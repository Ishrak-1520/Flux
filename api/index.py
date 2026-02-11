"""
Flux – Main FastAPI Application
Entry point for the backend. Handles routing, auth, and AI streaming.
"""

from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from sse_starlette.sse import EventSourceResponse
import os
import json
from pydantic import BaseModel
from typing import Optional

from . import db, auth, ai_engine
from .models import (
    RegisterRequest, LoginRequest, ProjectCreate, 
    IdeationRequest, BlueprintSelect, DocType, ProjectUpdate
)

app = FastAPI(title="Flux API", version="1.0.0")

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Lifecycle ───────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    await db.get_pool()

@app.on_event("shutdown")
async def shutdown():
    await db.close_pool()

# ─── Auth Routes ─────────────────────────────────────────────

@app.post("/api/auth/register")
async def register(req: RegisterRequest):
    existing = await db.get_user_by_email(req.email)
    if existing:
        raise HTTPException(400, "Email already registered")
    
    hashed = auth.hash_password(req.password)
    user_id = await db.create_user(req.email, hashed, req.display_name)
    token = auth.create_token(user_id)
    
    return {"token": token, "user": {"id": user_id, "email": req.email, "display_name": req.display_name}}

@app.post("/api/auth/login")
async def login(req: LoginRequest):
    user = await db.get_user_by_email(req.email)
    if not user or not auth.verify_password(req.password, user["password_hash"]):
        raise HTTPException(401, "Invalid credentials")
    
    token = auth.create_token(user["id"])
    return {
        "token": token, 
        "user": {
            "id": user["id"], 
            "email": user["email"], 
            "display_name": user["display_name"]
        }
    }

@app.get("/api/auth/me")
async def get_me(user_id: int = Depends(auth.get_current_user)):
    user = await db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(404, "User not found")
    return user

# ─── Project Routes ──────────────────────────────────────────

@app.get("/api/projects")
async def list_projects(user_id: int = Depends(auth.get_current_user)):
    return await db.get_projects_by_user(user_id)

@app.post("/api/projects")
async def create_project(req: ProjectCreate, user_id: int = Depends(auth.get_current_user)):
    # If starting from freestyle prompt, use that as title initially if not provided
    title = req.title
    if not title and req.original_prompt:
        title = "New Project"

    project_id = await db.create_project(
        user_id, title, req.category, req.subdomain, req.original_prompt
    )
    return {"id": project_id, "title": title}

@app.get("/api/projects/{project_id}")
async def get_project(project_id: int, user_id: int = Depends(auth.get_current_user)):
    project = await db.get_project(project_id, user_id)
    if not project:
        raise HTTPException(404, "Project not found")
    
    # Enrich with latest research/docs state
    research = await db.get_research(project_id)
    docs = await db.get_all_docs(project_id)
    
    return {**project, "research": research, "docs": docs}

@app.delete("/api/projects/{project_id}")
async def delete_project(project_id: int, user_id: int = Depends(auth.get_current_user)):
    await db.delete_project(project_id, user_id)
    return {"status": "deleted"}


@app.patch("/api/projects/{project_id}")
async def update_project(project_id: int, req: ProjectUpdate, user_id: int = Depends(auth.get_current_user)):
    await db.update_project_title(project_id, req.title)
    return {"status": "updated", "id": project_id, "title": req.title}


@app.put("/api/projects/{project_id}/blueprint")
async def select_blueprint(
    project_id: int, 
    req: BlueprintSelect, 
    user_id: int = Depends(auth.get_current_user)
):
    await db.update_project_blueprint(project_id, req.blueprint_index)
    return {"status": "updated"}

# ─── AI Streaming Routes ─────────────────────────────────────

@app.get("/api/projects/{project_id}/research/stream")
async def stream_research_endpoint(
    project_id: int, 
    user_id: int = Depends(auth.get_current_user)
):
    """
    Streams gap analysis for a project. 
    Note: For simplicity, we trigger specific generation steps via GET + SSE.
    In a real app, this might be a POST that returns a job ID to stream.
    Here we rely on the project state.
    """
    project = await db.get_project(project_id, user_id)
    if not project:
        raise HTTPException(404, "Project not found")

    prompt = project["original_prompt"]
    category = project["category"]
    subdomain = project["subdomain"]

    # Combine context for new single-argument function
    context = f"Idea: {prompt}\nCategory: {category}\nSubdomain: {subdomain}"

    async def event_generator():
        thinking_log = ""
        full_content = ""
        blueprints_json = "[]"
        
        try:
            async for data in ai_engine.stream_gap_analysis(context):
                if data["type"] == "thinking" and data.get("content"):
                    thinking_log += data["content"]
                elif data["type"] == "content" and data.get("content"):
                    full_content += data["content"]
                elif data["type"] == "blueprints_data" and data.get("data"):
                     blueprints_json = json.dumps(data["data"])
                elif data["type"] == "done":
                    # We'll yield the done event ourselves after saving
                    continue
                
                yield {"data": json.dumps(data)}

            # Save result to DB after streaming completes
            if full_content:
                await db.save_research(project_id, full_content, blueprints_json, thinking_log)
                await db.update_project_status(project_id, "research")
                # Yield done event manually
                yield {"data": json.dumps({'type': 'done', 'content_length': len(full_content)})}
            else:
                 yield {"data": json.dumps({'type': 'error', 'content': 'No content generated. Please check API key.'})}

        except Exception as e:
            print(f"Stream Error: {e}")
            yield {"data": json.dumps({'type': 'error', 'content': str(e)})}

    return EventSourceResponse(event_generator())

@app.get("/api/projects/{project_id}/plan/stream/{doc_type}")
async def stream_doc_endpoint(
    project_id: int, 
    doc_type: DocType,
    user_id: int = Depends(auth.get_current_user)
):
    project = await db.get_project(project_id, user_id)
    if not project:
        raise HTTPException(404, "Project not found")
        
    research = await db.get_research(project_id)
    if not research:
         raise HTTPException(400, "Research not found for this project")

    # Construct context for the AI
    context = f"""
    Project: {project['title']}
    Category: {project['category']}
    Original Idea: {project['original_prompt']}
    
    Research Gap Analysis:
    {research['gap_report']}
    
    Selected Blueprint Index: {project['selected_blueprint']}
    """

    async def event_generator():
        full_doc = ""
        try:
            async for data in ai_engine.stream_document(context, doc_type.value):
                if data["type"] == "content" and data.get("content"):
                    full_doc += data["content"]
                elif data["type"] == "done":
                    continue
                
                yield {"data": json.dumps(data)}
            
            # Save and yield final done
            if full_doc:
                await db.save_doc(project_id, doc_type.value, full_doc)
                yield {"data": json.dumps({'type': 'done', 'content_length': len(full_doc)})}
            else:
                yield {"data": json.dumps({'type': 'error', 'content': 'No document generated.'})}
        except Exception as e:
            print(f"Doc Stream Error: {e}")
            yield {"data": json.dumps({'type': 'error', 'content': str(e)})}

    return EventSourceResponse(event_generator())


@app.post("/api/project/{project_id}/scaffold")
async def create_scaffold(project_id: int, request: Request, user_id: int = Depends(auth.get_current_user)):
    try:
        data = await request.json()
        raw_context = data.get('context')
        
        prompt = ""
        # PROMPT ENGINEERING: Handle Dict vs String
        if isinstance(raw_context, dict):
            # It's a full blueprint!
            print(f"🏗️ Building from Blueprint: {raw_context.keys()}")
            
            # Construct a high-fidelity prompt
            tech_stack = json.dumps(raw_context.get('tech_stack', []))
            db_schema = json.dumps(raw_context.get('database_schema', []))
            routes = json.dumps(raw_context.get('api_routes', []))
            
            prompt = f"""
            Generate a project scaffold strictly following this architecture:
            
            1. PROJECT NAME: {raw_context.get('project_name', 'flux-app')}
            2. TECH STACK: {tech_stack}
            3. DATABASE: {db_schema}
            4. API ROUTES: {routes}
            
            CRITICAL:
            - Create the exact folder structure for this stack.
            - Include a README.md explaining the architecture.
            - Generate the `requirements.txt` or `package.json` matching the Tech Stack exactly.
            - Ensure the 'root_directory' in JSON is '{raw_context.get('project_name', 'flux-app')}'.
            """
        else:
            # Fallback for manual string input
            prompt = str(raw_context or "Generic Web App")

        json_str = await ai_engine.generate_scaffold_json(prompt)
        return json.loads(json_str)
    except Exception as e:
        print(f"Scaffold Generation Error: {e}")
        return JSONResponse(status_code=500, content={"detail": str(e)})




class RefineRequest(BaseModel):
    selection: str
    instruction: str
    context: Optional[str] = ""

@app.post("/api/refine")
async def refine_endpoint(req: RefineRequest, user_id: int = Depends(auth.get_current_user)):
    try:
        refined_text = await ai_engine.refine_text(req.selection, req.instruction, req.context)
        return {"refined_text": refined_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.exception_handler(404)
async def spa_fallback(request: Request, exc: Exception):
    # If the request is for an API route, return 404
    if request.url.path.startswith("/api"):
        return JSONResponse(status_code=404, content={"detail": "API endpoint not found"})
    
    # For everything else, serve index.html (SPA Router handles the rest)
    index_path = os.path.join("static", "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    
    return JSONResponse(status_code=404, content={"detail": "Static assets not found"})


# ─── Static Files ────────────────────────────────────────────

# Mount static files (must be last to avoid masking API routes)
if os.path.exists("static"):
    app.mount("/", StaticFiles(directory="static", html=True), name="static")

# Vercel entry point
# On Vercel, the app object is imported directly.
