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

VISUAL_PROTOCOL = """
## Visual Intelligence Protocol
Whenever describing processes, architecture, or timelines, you MUST include a Mermaid.js diagram wrapped in ```mermaid blocks.
- **User Flows**: Use `graph TD` to show user journey.
- **Databases**: Use `erDiagram` for schema relationships.
- **Roadmaps**: Use `gantt` for timelines.
- **System Architecture**: Use `flowchart LR` for component interaction.
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

{FORMATTING_REMINDER}

STRICT OUTPUT CONSTRAINTS:
- Use standard Markdown.
- NO EMOJIS (Safe Mode).
- Encouraging, helpful tone.
"""

PRD_SYSTEM = f"{MENTOR_PERSONA} Write a detailed PRD (Product Plan) for a beginner. {CITATION_PROTOCOL} {VISUAL_PROTOCOL} NO EMOJIS."
SRS_SYSTEM = f"{MENTOR_PERSONA} Write a Technical Spec (Step-by-step logic) for a student. {CITATION_PROTOCOL} {VISUAL_PROTOCOL} NO EMOJIS."
ROADMAP_SYSTEM = f"{MENTOR_PERSONA} Write an Implementation Roadmap (A to-do list) for building this. {CITATION_PROTOCOL} {VISUAL_PROTOCOL} NO EMOJIS."
CURSORRULES_SYSTEM = f"{MENTOR_PERSONA} Write a .cursorrules file to help an AI assistant code this project with the student. {CITATION_PROTOCOL} NO EMOJIS."

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
2. **Config**: YOU MUST generate valid content for:
   - Dockerfile (Production ready)
   - docker-compose.yml
   - README.md (Use the Blueprint info)
   - .gitignore
   - package.json / requirements.txt (Include key dependencies)
3. **Code**: Generate 2-3 core source files (e.g., main.py, App.js) with meaningful boilerplate code, not just "Hello World".
"""

async def generate_scaffold_json(context: str):
    """Generates a file tree JSON based on the blueprint context."""
    try:
        completion = await client.chat.completions.create(
            model=MODEL_CHAT,
            messages=[
                {"role": "system", "content": SCAFFOLD_SYSTEM},
                {"role": "user", "content": f"Blueprint Context: {context}\n\nGenerate Project Scaffold."}
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
