"""
Flux – Pydantic Models
Request/Response schemas for API validation.
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from enum import Enum


# ─── Auth ────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)
    display_name: str = Field(..., min_length=1, max_length=100)


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    token: str
    user: dict


# ─── Projects ────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    title: Optional[str] = Field(default="New Project", min_length=1, max_length=255)
    category: Optional[str] = None
    subdomain: Optional[str] = None
    original_prompt: Optional[str] = None

    entry_mode: str = Field(default="freestyle")  # "freestyle" or "guided"


class ProjectUpdate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)



class BlueprintSelect(BaseModel):
    blueprint_index: int = Field(..., ge=0, le=2)


# ─── AI / Research ────────────────────────────────────────────

class IdeationRequest(BaseModel):
    prompt: Optional[str] = None
    category: Optional[str] = None
    subdomain: Optional[str] = None


class DocType(str, Enum):
    prd = "prd"
    srs = "srs"
    cursorrules = "cursorrules"
    roadmap = "roadmap"


class TechStackItem(BaseModel):
    category: str      # e.g. "Frontend"
    technology: str    # e.g. "React"
    reason: str        # e.g. "Great for beginners..."


class BlueprintItem(BaseModel):
    title: str
    tagline: str
    problem: str
    solution: str
    tech_stack: List[TechStackItem]
    complexity: str  # e.g. "Low", "Medium", "High"

class BlueprintResponse(BaseModel):
    blueprints: List[BlueprintItem]


# ─── Forge ───────────────────────────────────────────────────

class FileNode(BaseModel):
    path: str       # e.g. "src/app.py" or "Dockerfile"
    content: str    # The actual code
    language: str   # "python", "javascript", "json", "markdown"

class ScaffoldResponse(BaseModel):
    root_directory: str # e.g. "flux-generated-app"
    files: List[FileNode]
    commands: List[str] # e.g. ["npm install", "npm run dev"]

