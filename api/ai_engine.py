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
## References & Analysis Sources
To ensure credibility, you MUST include this section at the end of the Gap Report (before the Blueprints).
1. **User Context**: Cite specific constraints or ideas from the user's prompt.
2. **Market Data (Simulated)**: Cite 2-3 real-world examples, papers, or documentation relevant to this topic.
   - Format: `* **[Source Name]**: [Relevance/Insight]`
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
1. The document MUST start with `## Gap Report`.
3. The `## References` section MUST come AFTER the Gap Report.
"""

# ─── SYSTEM PROMPTS ──────────────────────────────────────────

GAP_ANALYSIS_SYSTEM = f"""You are Flux, an elite AI Project Architect.
Your task is to perform deep market research and gap analysis.

PROCESS:
1. **Analyze**: detailed breakdown of the user's idea/industry.
2. **Gaps**: Identify 3-5 critical market gaps.
3. **References**: List sources as defined in the protocol.

{CITATION_PROTOCOL}

{FORMATTING_REMINDER}

STRICT OUTPUT CONSTRAINTS:
- Use standard Markdown.
- NO EMOJIS (Safe Mode).
- Professional tone.
"""

PRD_SYSTEM = f"You are an expert Product Manager. Write a detailed PRD. {CITATION_PROTOCOL} {VISUAL_PROTOCOL} NO EMOJIS."
SRS_SYSTEM = f"You are a Senior Architect. Write a Technical System Spec. {CITATION_PROTOCOL} {VISUAL_PROTOCOL} NO EMOJIS."
ROADMAP_SYSTEM = f"You are a Project Lead. Write a step-by-step implementation plan. {CITATION_PROTOCOL} {VISUAL_PROTOCOL} NO EMOJIS."
CURSORRULES_SYSTEM = f"You are a Senior Dev. Write a .cursorrules file. {CITATION_PROTOCOL} NO EMOJIS."

BLUEPRINT_GENERATOR_SYSTEM = """You are a System Architect.
Based on the provided analysis, generate exactly 3 distinct Project Blueprints.
Return ONLY valid JSON matching this exact schema:

{
  "blueprints": [
    {
      "title": "Project Name Here",
      "tagline": "Short elevator pitch",
      "problem": "The specific gap addressed",
      "solution": "Technical solution overview",
      "complexity": "High",
      "tech_stack": "Python, React, AWS"
    }
  ]
}

CRITICAL RULES:
1. Keys MUST be lowercase: 'title', 'tagline', 'problem', 'solution', 'complexity', 'tech_stack'.
2. Do NOT use keys like 'name', 'project_name', or 'difficulty'.
3. Return ONLY the JSON object. No markdown formatting.
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
        return json.loads(content)
    except Exception as e:
        print(f"Blueprint Generation Error: {e}")
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
