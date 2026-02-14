"""
Flux – AI Engine (Advanced Citation & Strict Formatting Version)
Handles OpenAI/LongCat API calls with forced formatting for blueprints and reference lists.
"""

import os
import json
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

# --- CONFIGURATION ---
client = AsyncOpenAI(
    api_key=os.getenv("LONGCAT_API_KEY", ""),
    base_url="https://api.longcat.chat/openai/v1"
)

MODEL_THINKING = "LongCat-Flash-Thinking"
MODEL_CHAT = "LongCat-Flash-Chat"

# ─── CITATION & FORMATTING PROTOCOLS ─────────────────────────

CITATION_PROTOCOL = """
## References & Learning Sources
To help you learn more, you MUST include this section at the end of the Improvement Ideas.
1. **User Goal**: Explain what we understood from your prompt.
2. **Real-World Examples**: Give 2-3 examples of companies or tools that do something similar.
   - Format: `* **[Company/Tool Name]**: [What they do and what we can learn from them]`
"""

STYLE_GUIDE = """
STYLE GUIDE (STRICT ENFORCEMENT):
1. **NO EMOJIS:** Do not use emojis anywhere in the document. Not even in headers.
   - BAD: "## 🚀 Introduction"
   - GOOD: "## Introduction"

2. **NO EM-DASHES:** Avoid using em-dashes (—) for pauses or lists. It makes the text look machine-generated.
   - BAD: "The system is fast — it processes data in real-time."
   - GOOD: "The system is fast; it processes data in real-time." or "The system is fast and processes data in real-time."

3. **PROFESSIONAL TONE:** Write like a Senior Technical Writer at a Fortune 500 company.
   - Be concise.
   - Use active voice.
   - Avoid flowery adjectives (e.g., "seamlessly," "cutting-edge," "robust").
   - Use standard bullet points (-) instead of fancy symbols.
"""

VISUAL_PROTOCOL = """
## Visual Intelligence Protocol
Whenever describing processes, architecture, or timelines, you MUST include a Mermaid.js diagram wrapped in ```mermaid blocks.

CRITICAL SYNTAX RULES (To prevent errors):
1. **WRAP ALL LABELS IN QUOTES**: 
   - BAD: A[User Login (Auth)] --> B{Valid?}
   - GOOD: A["User Login (Auth)"] --> B{"Valid?"}
2. **USE STANDARD SHAPES**: Use only `[]` for rects, `{}` for rhombuses, and `(())` for circles.
3. **NO SPECIAL CHARACTERS OUTSIDE QUOTES**.
4. Keep the diagram simple (max 10-15 nodes) to ensure rendering stability.
"""

FORMATTING_REMINDER = """
CRITICAL STRUCTURAL RULES:
1. The document MUST start with `## Improvement Ideas`.
3. The `## References` section MUST come AFTER the Improvement Ideas.
"""

# ─── SYSTEM PROMPTS ──────────────────────────────────────────

# --- Student-First Mentor Instructions ---
MENTOR_PERSONA = """
You are a Friendly Senior Developer Mentor. 
Your goal is to help a student or beginner understand how to build their idea.

TONE GUIDELINES:
1. **Simple Language:** Avoid jargon. If you use a technical term (e.g. "JWT", "Docker"), briefly explain it in parentheses.
2. **Explain "Why":** Don't just list something; explain WHY it is good for a beginner.
3. **Encouraging:** Be positive and helpful.
"""

GAP_ANALYSIS_SYSTEM = f"""{MENTOR_PERSONA}
Your task is to provide some 'Improvement Ideas' by researching the web.

PROCESS:
1. **Explain the Topic**: Briefly explain the industry in simple terms.
2. **Improvement Ideas**: Identify 3-5 ways the user could make their idea better or more unique.
3. **References**: List some learning sources as defined in the protocol.

{CITATION_PROTOCOL}

{STYLE_GUIDE}

{FORMATTING_REMINDER}

STRICT OUTPUT CONSTRAINTS:
- Use standard Markdown.
- Encouraging, helpful tone.
"""

PRD_SYSTEM = f"{MENTOR_PERSONA} Write a detailed PRD (Product Plan) for a beginner. {CITATION_PROTOCOL} {VISUAL_PROTOCOL} {STYLE_GUIDE}"
SRS_SYSTEM = f"{MENTOR_PERSONA} Write a Technical Spec (Step-by-step logic) for a student. {CITATION_PROTOCOL} {VISUAL_PROTOCOL} {STYLE_GUIDE}"
ROADMAP_SYSTEM = f"{MENTOR_PERSONA} Write an Implementation Roadmap (A to-do list) for building this. {CITATION_PROTOCOL} {VISUAL_PROTOCOL} {STYLE_GUIDE}"
CURSORRULES_SYSTEM = f"{MENTOR_PERSONA} Write a .cursorrules file to help an AI assistant code this project with the student. {CITATION_PROTOCOL} {STYLE_GUIDE}"

BLUEPRINT_GENERATOR_SYSTEM = f"""{MENTOR_PERSONA}
Based on the analysis, suggest exactly 3 Project Blueprints (Starter Ideas).
Return ONLY valid JSON matching this exact schema:

{{
  "blueprints": [
    {{
      "title": "Project Name Here",
      "tagline": "Short elevator pitch",
      "problem": "What problem are we solving?",
      "solution": "How does our app solve it?",
      "complexity": "Beginner/Intermediate/Advanced",
      "tech_stack": [
        {{
          "category": "Frontend",
          "technology": "React",
          "reason": "Explain why this is great for a student (e.g. easy tutorials, simple syntax)"
        }}
      ]
    }}
  ]
}}

CRITICAL RULES:
1. Use the EXACT keys: 'title', 'tagline', 'problem', 'solution', 'complexity', 'tech_stack', 'category', 'technology', 'reason'.
2. Explain EVERY technology choice in the 'reason' field using beginner-friendly language.
3. Return ONLY the JSON object.
"""


# ─── GENERATORS (CRASH-PROOF) ────────────────────────────────


from api.agent_search import perform_market_research

async def stream_gap_analysis(project_context: str, existing_text: str = ""):
    """Streams gap analysis with Citations and Strict Blueprint Formatting."""
    try:
        # 1. Input Sanitization
        ctx = str(project_context) if project_context else "New Idea"
        hist = str(existing_text) if existing_text else ""
        
        # 2. Run Agentic Search (Only if starting new)
        real_world_data = ""
        if not hist:
            real_world_data = await perform_market_research(ctx)
        
        # 3. Build Messages with Reinforced Instructions
        messages = []
        if len(hist) > 10:
            messages = [
                {"role": "system", "content": "You are continuing a document. RESUME EXACTLY where the text ends."},
                {"role": "user", "content": f"EXISTING TEXT:\n{hist}\n\n[RESUME GENERATION]"}
            ]
        else:
            # We append the formatting reminder to the USER prompt too, 
            # because thinking models sometimes ignore system prompts for formatting.
            reinforced_user_prompt = f"""Topic: {ctx}

INSTRUCTIONS:
1. Write a Market Gap Analysis.
2. Add a 'References' section.
"""
            
            # Inject Research into System Prompt
            system_prompt_with_research = GAP_ANALYSIS_SYSTEM + f"""
            
CRITICAL INSTRUCTION:
Use the following REAL-TIME RESEARCH to ground your analysis. 
Do not hallucinate competitors. Use the provided links and names.

{real_world_data}
"""
            messages = [
                {"role": "system", "content": system_prompt_with_research},
                {"role": "user", "content": reinforced_user_prompt}
            ]

        # 3. Start Stream
        stream = await client.chat.completions.create(
            model=MODEL_THINKING,
            messages=messages,
            stream=True,
            max_tokens=4096
        )

        # 4. Stream Loop
        thinking_buffer = ""
        content_buffer = ""
        current_phase = "thinking"

        async for chunk in stream:
            if not chunk.choices: continue
            
            delta = chunk.choices[0].delta
            reasoning = getattr(delta, "reasoning_content", None) or getattr(delta, "thought", None)
            content = delta.content

            if reasoning:
                thinking_buffer += str(reasoning)
                yield {'type': 'thinking', 'content': str(reasoning)}
            elif content:
                if current_phase == "thinking":
                    current_phase = "content"
                    yield {'type': 'phase', 'content': 'analysis'}
                content_buffer += str(content)
                yield {'type': 'content', 'content': str(content)}

        yield {'type': 'done', 'content_length': len(content_buffer)}

        # 5. Generate Blueprints (JSON Mode)
        yield {'type': 'phase', 'content': 'architecting'}
        
        blueprints_json = await generate_blueprints_json(content_buffer)
        if blueprints_json:
            yield {'type': 'blueprints_data', 'data': blueprints_json}

    except Exception as e:
        # Silent error log
        try: print(f"AI Error: {e}") 
        except: pass
        yield {'type': 'error', 'content': f"AI Error: {str(e)}"}


async def generate_blueprints_json(context: str):
    """Generates 3 structured blueprints in JSON format based on the analysis."""
    try:
        from api.models import BlueprintResponse

        completion = await client.chat.completions.create(
            model=MODEL_THINKING,
            messages=[
                {"role": "system", "content": BLUEPRINT_GENERATOR_SYSTEM},
                {"role": "user", "content": f"ANALYSIS:\n{context}\n\nTASK: Generate 3 blueprints."}
            ],
            response_format={"type": "json_object"}
        )
        
        content = completion.choices[0].message.content
        print(f"DEBUG: Blueprints Raw Content: {content}")
        return json.loads(content)
    except Exception as e:
        print(f"Blueprint Generation Error: {e}")
        import traceback
        traceback.print_exc()
        return None


async def stream_document(project_context: str, doc_type: str, existing_text: str = ""):
    """Streams document generation with Citations."""
    try:
        ctx = str(project_context) if project_context else ""
        hist = str(existing_text) if existing_text else ""

        prompts = {
            "prd": PRD_SYSTEM,
            "srs": SRS_SYSTEM, 
            "roadmap": ROADMAP_SYSTEM,
            "cursorrules": CURSORRULES_SYSTEM
        }
        sys_prompt = prompts.get(doc_type, PRD_SYSTEM)

        messages = []
        if len(hist) > 10:
            messages = [
                {"role": "system", "content": f"You are continuing a {doc_type}. RESUME EXACTLY where the text ends."},
                {"role": "user", "content": f"EXISTING TEXT:\n{hist}\n\n[RESUME]"}
            ]
        else:
            messages = [
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": ctx}
            ]

        stream = await client.chat.completions.create(
            model=MODEL_CHAT,
            messages=messages,
            stream=True
        )

        async for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield {'type': 'content', 'content': chunk.choices[0].delta.content}

        yield {'type': 'done', 'content_length': 0}

    except Exception as e:
        yield {'type': 'error', 'content': str(e)}


SCAFFOLD_SYSTEM = """You are a Senior DevOps Engineer. 
Generate a robust project scaffold based on the user's Blueprint.
OUTPUT STRICT JSON ONLY matching this exact schema:

{
  "root_directory": "project-name",
  "files": [
    {
      "path": "src/main.py",
      "content": "print('Hello World')",
      "language": "python"
    }
  ],
  "commands": ["pip install -r requirements.txt"]
}

RULES:
1. **Structure**: specific to the tech stack (e.g., React = /src, /public; Python = /app, requirements.txt).
2. **Config**: YOU MUST generate valid content for required config files (package.json, requirements.txt, go.mod, etc.)
3. **Code**: Generate 2-3 core source files with meaningful boilerplate code matching the requested features.
"""

async def generate_scaffold_json(context: str | dict):
    """Generates a file tree JSON based on the blueprint context."""
    try:
        # Prompt Engineering
        if isinstance(context, dict):
             c_title = context.get('project_name') or context.get('title') or "ProjeX"
             c_tech = context.get('tech_stack') or []
             c_features = context.get('features') or []

             # Format Tech Stack
             tech_str = ""
             if isinstance(c_tech, list):
                 tech_str = ", ".join([t.get('technology') if isinstance(t, dict) else str(t) for t in c_tech])
             else:
                 tech_str = str(c_tech)

             user_prompt = f"""
             PROJECT: {c_title}
             STACK: {tech_str}
             FEATURES: {c_features}
             
             TASK: Generate a file structure + boilerplate code for a {tech_str} application.
             CONSTRAINT: Ensure all config files (e.g. package.json) matches the {tech_str} ecosystem.
             """
        else:
             user_prompt = f"Blueprint Context: {context}\n\nGenerate Project Scaffold."

        completion = await client.chat.completions.create(
            model=MODEL_CHAT,
            messages=[
                {"role": "system", "content": SCAFFOLD_SYSTEM},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"}
        )
        return completion.choices[0].message.content
    except Exception as e:
        return json.dumps({"files": [], "error": str(e)})


REFINE_SYSTEM = """You are an expert AI Editor.
Your task is to rewrite the selected text based on the user's instruction.

RULES:
1. Output ONLY the rewritten text. No "Here is the new version" chatter.
2. Maintain the formatting (Markdown/HTML) of the original.
3. Fit the tone of the surrounding document.
"""

async def refine_text(selection: str, instruction: str, context: str = ""):
    """Refines a specific text selection based on user instruction."""
    try:
        completion = await client.chat.completions.create(
            model=MODEL_CHAT,
            messages=[
                {"role": "system", "content": REFINE_SYSTEM},
                {"role": "user", "content": f"ORIGINAL CONTEXT:\n{context[:1000]}...\n\nSELECTED TEXT:\n{selection}\n\nINSTRUCTION:\n{instruction}"}
            ]
        )
        return completion.choices[0].message.content
    except Exception as e:
        return f"Error refining text: {str(e)}"


# ─── BLUEPRINT ASSISTANT ─────────────────────────────────────

BLUEPRINT_ASSISTANT_SYSTEM = f"""{MENTOR_PERSONA}
The user has a rough idea for a project. 
Your goal is to flesh it out into a structured "Blueprint" so they can start building.

INPUT: User Description (e.g., "A social network for cats")
OUTPUT: Valid JSON with:
- suggested_title: Catchy name
- features: List of 3-4 core features (strings)
- tech_stack: List of objects {{ "category": "...", "technology": "...", "reason": "..." }}

CRITICAL:
1. Return ONLY valid JSON.
2. Keep the tech stack simple and beginner-friendly (e.g., HTML/JS/Firebase or Python/Flask).
3. Explain the 'reason' for each tech choice simply.
"""

async def suggest_blueprint_details(user_description: str):
    """Generates structured blueprint details from a rough user description."""
    try:
        completion = await client.chat.completions.create(
            model=MODEL_THINKING,
            messages=[
                {"role": "system", "content": BLUEPRINT_ASSISTANT_SYSTEM},
                {"role": "user", "content": f"User Idea: {user_description}\n\nSuggest details."}
            ],
            response_format={"type": "json_object"}
        )
        return json.loads(completion.choices[0].message.content)
    except Exception as e:
        print(f"Blueprint Assistant Error: {e}")
        # Fallback
        return {
            "suggested_title": "My Awesome Project",
            "features": ["User Login", "Dashboard", "Database Connection"],
            "tech_stack": [
                {"category": "Frontend", "technology": "HTML/CSS/JS", "reason": "Standard web technologies."}
            ]
        }


async def suggest_tech_stack(vision: str) -> dict:
    """
    Analyzes project vision and suggests appropriate technologies.
    Returns a dict with recommended tech stack items.
    """
    try:
        prompt = f"""{MENTOR_PERSONA}

Based on this project idea, recommend the best technologies for a beginner to use:

"{vision}"

Return ONLY a valid JSON object (no markdown decorators) in this exact format:
{{
  "frontend": [
    {{"name": "Node", "reason": "Most popular, huge community, easy to learn"}}
  ],
  "backend": [
    {{"name": "FastAPI", "reason": "Python-based, super fast, automatic API docs"}}
  ],
  "database": [
    {{"name": "PostgreSQL", "reason": "Free, powerful, handles complex data well"}}
  ]
}}

RULES:
1. Pick 1-2 technologies per category
2. Focus on beginner-friendly options
3. Match the complexity to the project idea
4. Explain WHY each tech is good for this specific project
5. Return ONLY the JSON, no "```json" markers or extra text
"""

        response = await client.chat.completions.create(
            model=MODEL_CHAT,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=800
        )

        result_text = response.choices[0].message.content.strip()
        
        # Remove markdown code blocks if present
        if result_text.startswith("```"):
            result_text = result_text.split("```")[1]
            if result_text.startswith("json"):
                result_text = result_text[4:]
            result_text = result_text.strip()
        
        suggestions = json.loads(result_text)
        return suggestions
        
    except Exception as e:
        print(f"Tech Stack Suggestion Error: {e}")
        print(f"Raw response: {result_text if 'result_text' in locals() else 'N/A'}")
        raise
