"""
Flux – AI Engine
LongCat API client using the OpenAI SDK for gap analysis and document generation.
"""

import os
import json
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

client = AsyncOpenAI(
    api_key=os.getenv("LONGCAT_API_KEY", ""),
    base_url="https://api.longcat.chat/openai/v1"
)

MODEL_THINKING = "LongCat-Flash-Thinking"
MODEL_CHAT = "LongCat-Flash-Chat"


# ─── System Prompts ──────────────────────────────────────────

GAP_ANALYSIS_SYSTEM = """You are Flux, an elite AI Project Architect. Your task is to perform deep market research and gap analysis.

Given the user's idea or category, you must:
1. Analyze the current landscape of existing solutions in this space.
2. Identify 3-5 critical gaps or unmet needs in existing products.
3. Produce a structured "Gap Report" in Markdown with clear headings.
4. Then propose exactly 3 refined "Project Blueprints" that address the identified gaps.

Each Blueprint must include:
- **Title**: A catchy, memorable project name
- **Tagline**: One-line elevator pitch
- **Problem**: What specific gap it addresses
- **Solution**: High-level approach
- **Tech Stack**: Recommended technologies
- **Unique Angle**: What makes this different from existing solutions
- **Difficulty**: Easy / Medium / Hard

Format your entire response as valid Markdown. 
Use `## Gap Report` for the report section.
Use `## Blueprint: [Title]` for each of the three blueprints.
**IMPORTANT**: Do NOT use level 3 headers (###) inside the Blueprints. Use bolding (**) for sections like **Problem**, **Solution**, etc.

CRITICAL: You must start each of the 3 blueprints with the exact header '## Blueprint: [Project Name]'. Do not use any other '##' headers in the response.

CONSTRAINT: Do NOT use emojis or special unicode icons (like 🚀, ✅, 📝) anywhere in the document. Use standard Markdown formatting (lists, headers, bolding) only. Professional technical tone."""

PRD_SYSTEM = """You are Flux, an AI document generator. Generate a comprehensive Product Requirements Document (PRD) in Markdown format.

Include these sections:
1. Executive Summary
2. Problem Statement
3. Goals & Objectives
4. Target Users / Personas
5. Functional Requirements (numbered, detailed)
6. Non-Functional Requirements (performance, security, scalability)
7. User Stories (As a..., I want..., So that...)
8. Success Metrics / KPIs
9. Technical Constraints
10. Timeline & Milestones

Be thorough, professional, and specific. Use tables where appropriate.

CONSTRAINT: Do NOT use emojis or special unicode icons (like 🚀, ✅, 📝) anywhere in the document. Use standard Markdown formatting (lists, headers, bolding) only. Professional technical tone."""

SRS_SYSTEM = """You are Flux, an AI document generator. Generate a comprehensive Software Requirements Specification (SRS) in Markdown format following IEEE 830 standards.

Include these sections:
1. Introduction (Purpose, Scope, Definitions)
2. Overall Description (Product Perspective, Functions, User Characteristics, Constraints)
3. System Features (detailed with stimulus/response, functional requirements)
4. External Interface Requirements (User, Hardware, Software, Communication)
5. Non-Functional Requirements (Performance, Safety, Security, Quality)
6. Data Model / Database Design
7. API Specifications
8. Appendices

Be technically rigorous and comprehensive. Use tables and diagrams descriptions where helpful.

CONSTRAINT: Do NOT use emojis or special unicode icons (like 🚀, ✅, 📝) anywhere in the document. Use standard Markdown formatting (lists, headers, bolding) only. Professional technical tone."""

CURSORRULES_SYSTEM = """You are Flux, an AI context file generator. Generate a .cursorrules file (JSON format) that captures the project's technical "soul" for use in AI-native IDEs like Cursor or Windsurf.

The file should include:
{
  "project_name": "...",
  "description": "...",
  "tech_stack": { "frontend": "...", "backend": "...", "database": "...", "deployment": "..." },
  "architecture": "...",
  "coding_conventions": {
    "style": "...",
    "naming": "...",
    "file_structure": "..."
  },
  "key_patterns": ["..."],
  "dependencies": ["..."],
  "environment_variables": ["..."],
  "api_design": "...",
  "testing_strategy": "...",
  "deployment_notes": "...",
  "important_context": "..."
}

Return ONLY valid JSON, no markdown wrapping.

CONSTRAINT: Do NOT use emojis or special unicode icons (like 🚀, ✅, 📝) anywhere in the document. Use standard Markdown formatting (lists, headers, bolding) only. Professional technical tone."""

ROADMAP_SYSTEM = """You are Flux, an AI implementation planner. Generate a detailed step-by-step implementation roadmap in Markdown.

For each step include:
1. **Step Title** with a clear objective
2. **Description**: What needs to be done
3. **Deliverables**: Concrete outputs
4. **Vibe-Coding Prompt**: A detailed prompt that a developer can paste into an AI coding assistant (Cursor, Windsurf, etc.) to implement this step. The prompt should be self-contained and specific.

Organize steps in logical dependency order. Group into phases (Setup, Core, Features, Polish, Deploy).
Use checkboxes (- [ ]) for each step so users can track progress.

CONSTRAINT: Do NOT use emojis or special unicode icons (like 🚀, ✅, 📝) anywhere in the document. Use standard Markdown formatting (lists, headers, bolding) only. Professional technical tone."""


# ─── Streaming Generators ────────────────────────────────────

async def stream_gap_analysis(project_context: str, existing_text: str = ""):
    """Run gap analysis with the thinking model. Yields SSE-formatted chunks."""
    
    # Continuation Logic
    if existing_text and len(existing_text) > 10:
         messages = [
            {"role": "system", "content": "You are completing a document. RESUME EXACTLY where the following text left off. Do not repeat the existing text."},
            {"role": "user", "content": f"EXISTING TEXT:\n{existing_text}\n\n[RESUME FROM HERE]"}
        ]
    else:
        # Standard Mode
        if not project_context.strip():
            project_context = "Suggest innovative project ideas across emerging technology domains."

        messages = [
            {"role": "system", "content": GAP_ANALYSIS_SYSTEM},
            {"role": "user", "content": project_context}
        ]

    print(f"DEBUG: API Key present: {bool(client.api_key)}")
    print(f"DEBUG: Continuation Mode: {bool(existing_text)}")

    try:
        stream = await client.chat.completions.create(
            model=MODEL_THINKING,
            messages=messages,
            stream=True,
            max_tokens=8192,
            extra_body={
                "enable_thinking": True,
                "thinking_budget": 1024
            }
        )

        thinking_buffer = ""
        content_buffer = ""
        current_phase = "thinking"

        async for chunk in stream:
            if not chunk.choices:
                continue
            delta = chunk.choices[0].delta
            
            # Check attributes safely
            reasoning = getattr(delta, "reasoning_content", None) or getattr(delta, "thought", None) or getattr(delta, "reasoning", None)
            content = delta.content

            # Handle thinking content
            if reasoning:
                thinking_buffer += str(reasoning)
                yield {'type': 'thinking', 'content': str(reasoning)}
            elif content:
                if current_phase == "thinking":
                    current_phase = "content"
                    yield {'type': 'phase', 'content': 'analysis'}
                content_buffer += content
                yield {'type': 'content', 'content': content}
        
        yield {'type': 'done', 'thinking_length': len(thinking_buffer), 'content_length': len(content_buffer)}

    except Exception as e:
        print(f"CRITICAL STREAM ERROR: {str(e)}")
        yield {'type': 'error', 'content': f"Backend Crash: {str(e)}"}


async def stream_document(project_context: str, doc_type: str, existing_text: str = ""):
    """Generate a document (PRD, SRS, roadmap, cursorrules). Yields SSE-formatted chunks."""
    
    if existing_text and len(existing_text) > 10:
        messages = [
            {"role": "system", "content": "You are completing a document. RESUME EXACTLY where the following text left off. Do not repeat the existing text."},
            {"role": "user", "content": f"EXISTING TEXT:\n{existing_text}\n\n[RESUME FROM HERE]"}
        ]
    else: 
        system_prompts = {
            "prd": PRD_SYSTEM,
            "srs": SRS_SYSTEM,
            "cursorrules": CURSORRULES_SYSTEM,
            "roadmap": ROADMAP_SYSTEM
        }
        system_prompt = system_prompts.get(doc_type, PRD_SYSTEM)
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": project_context}
        ]

    try:
        stream = await client.chat.completions.create(
            model=MODEL_CHAT,
            messages=messages,
            stream=True,
            max_tokens=8192
        )

        full_content = ""
        async for chunk in stream:
            if not chunk.choices:
                continue
            delta = chunk.choices[0].delta
            if delta.content:
                full_content += delta.content
                yield {'type': 'content', 'content': delta.content}

        yield {'type': 'done', 'content_length': len(full_content)}
    
    except Exception as e:
        print(f"Doc Stream Error: {str(e)}")
        yield {'type': 'error', 'content': str(e)}

