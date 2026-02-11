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

FORMATTING_REMINDER = """
CRITICAL STRUCTURAL RULES:
1. The document MUST start with `## Gap Report`.
2. The `## References` section MUST come AFTER the Gap Report but BEFORE the Blueprints.
3. You MUST output exactly 3 Blueprints.
4. Each Blueprint MUST start with the exact header: `## Blueprint: [Project Name]`. 
   - DO NOT use `### Blueprint` or `**Blueprint**`.
   - The frontend parser relies on `## Blueprint:`.
"""

# ─── SYSTEM PROMPTS ──────────────────────────────────────────

GAP_ANALYSIS_SYSTEM = f"""You are Flux, an elite AI Project Architect.
Your task is to perform deep market research and gap analysis.

PROCESS:
1. **Analyze**: detailed breakdown of the user's idea/industry.
2. **Gaps**: Identify 3-5 critical market gaps.
3. **References**: List sources as defined in the protocol.
4. **Blueprints**: Propose 3 refined project ideas.

{CITATION_PROTOCOL}

{FORMATTING_REMINDER}

STRICT OUTPUT CONSTRAINTS:
- Use standard Markdown.
- NO EMOJIS (Safe Mode).
- Professional tone.
"""

PRD_SYSTEM = f"You are an expert Product Manager. Write a detailed PRD. {CITATION_PROTOCOL} NO EMOJIS."
SRS_SYSTEM = f"You are a Senior Architect. Write a Technical System Spec. {CITATION_PROTOCOL} NO EMOJIS."
ROADMAP_SYSTEM = f"You are a Project Lead. Write a step-by-step implementation plan. {CITATION_PROTOCOL} NO EMOJIS."
CURSORRULES_SYSTEM = f"You are a Senior Dev. Write a .cursorrules file. {CITATION_PROTOCOL} NO EMOJIS."


# ─── GENERATORS (CRASH-PROOF) ────────────────────────────────

async def stream_gap_analysis(project_context: str, existing_text: str = ""):
    """Streams gap analysis with Citations and Strict Blueprint Formatting."""
    try:
        # 1. Input Sanitization
        ctx = str(project_context) if project_context else "New Idea"
        hist = str(existing_text) if existing_text else ""
        
        # 2. Build Messages with Reinforced Instructions
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
3. Write 3 Blueprints.

IMPORTANT: Start each blueprint with '## Blueprint: Name'. Do not use '###'.
"""
            messages = [
                {"role": "system", "content": GAP_ANALYSIS_SYSTEM},
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

    except Exception as e:
        # Silent error log
        try: print(f"AI Error: {e}") 
        except: pass
        yield {'type': 'error', 'content': f"AI Error: {str(e)}"}


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
