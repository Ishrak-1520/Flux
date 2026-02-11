"""
Flux – Database Layer
Async MySQL connection pool and CRUD helpers using aiomysql.
"""

import aiomysql
import os
from dotenv import load_dotenv

load_dotenv()

pool = None


async def get_pool():
    """Get or create the connection pool."""
    global pool
    if pool is None:
        pool = await aiomysql.create_pool(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", 3306)),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASS", ""),
            db=os.getenv("DB_NAME", "flux"),
            charset="utf8mb4",
            autocommit=True,
            minsize=1,
            maxsize=10
        )
    return pool


async def close_pool():
    """Close the connection pool."""
    global pool
    if pool:
        pool.close()
        await pool.wait_closed()
        pool = None


async def fetch_one(query: str, args: tuple = ()):
    """Execute a query and return a single row as a dict."""
    p = await get_pool()
    async with p.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(query, args)
            return await cur.fetchone()


async def fetch_all(query: str, args: tuple = ()):
    """Execute a query and return all rows as dicts."""
    p = await get_pool()
    async with p.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(query, args)
            return await cur.fetchall()


async def execute(query: str, args: tuple = ()):
    """Execute a write query and return the lastrowid."""
    p = await get_pool()
    async with p.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(query, args)
            return cur.lastrowid


# ─── User CRUD ───────────────────────────────────────────────

async def create_user(email: str, password_hash: str, display_name: str) -> int:
    return await execute(
        "INSERT INTO users (email, password_hash, display_name) VALUES (%s, %s, %s)",
        (email, password_hash, display_name)
    )


async def get_user_by_email(email: str):
    return await fetch_one("SELECT * FROM users WHERE email = %s", (email,))


async def get_user_by_id(user_id: int):
    return await fetch_one("SELECT id, email, display_name, created_at FROM users WHERE id = %s", (user_id,))


# ─── Project CRUD ────────────────────────────────────────────

async def create_project(user_id: int, title: str, category: str = None,
                         subdomain: str = None, original_prompt: str = None) -> int:
    return await execute(
        """INSERT INTO projects (user_id, title, category, subdomain, original_prompt)
           VALUES (%s, %s, %s, %s, %s)""",
        (user_id, title, category, subdomain, original_prompt)
    )


async def get_projects_by_user(user_id: int):
    return await fetch_all(
        "SELECT * FROM projects WHERE user_id = %s ORDER BY updated_at DESC",
        (user_id,)
    )


async def get_project(project_id: int, user_id: int):
    return await fetch_one(
        "SELECT * FROM projects WHERE id = %s AND user_id = %s",
        (project_id, user_id)
    )



async def update_project_status(project_id: int, status: str):
    await execute(
        "UPDATE projects SET status = %s WHERE id = %s",
        (status, project_id)
    )


async def update_project_title(project_id: int, title: str):
    await execute(
        "UPDATE projects SET title = %s WHERE id = %s",
        (title, project_id)
    )



async def update_project_blueprint(project_id: int, blueprint_index: int):
    await execute(
        "UPDATE projects SET selected_blueprint = %s, status = 'planning' WHERE id = %s",
        (blueprint_index, project_id)
    )


async def delete_project(project_id: int, user_id: int):
    await execute(
        "DELETE FROM projects WHERE id = %s AND user_id = %s",
        (project_id, user_id)
    )


# ─── Research CRUD ───────────────────────────────────────────

async def save_research(project_id: int, gap_report: str, blueprints: str, thinking_trace: str) -> int:
    return await execute(
        """INSERT INTO research_results (project_id, gap_report, blueprints, thinking_trace)
           VALUES (%s, %s, %s, %s)""",
        (project_id, gap_report, blueprints, thinking_trace)
    )


async def get_research(project_id: int):
    return await fetch_one(
        "SELECT * FROM research_results WHERE project_id = %s ORDER BY created_at DESC LIMIT 1",
        (project_id,)
    )


# ─── Planning Docs CRUD ─────────────────────────────────────

async def save_doc(project_id: int, doc_type: str, content: str) -> int:
    # Upsert: replace if same doc_type exists for this project
    existing = await fetch_one(
        "SELECT id FROM planning_docs WHERE project_id = %s AND doc_type = %s",
        (project_id, doc_type)
    )
    if existing:
        await execute(
            "UPDATE planning_docs SET content = %s WHERE id = %s",
            (content, existing["id"])
        )
        return existing["id"]
    return await execute(
        "INSERT INTO planning_docs (project_id, doc_type, content) VALUES (%s, %s, %s)",
        (project_id, doc_type, content)
    )


async def get_doc(project_id: int, doc_type: str):
    return await fetch_one(
        "SELECT * FROM planning_docs WHERE project_id = %s AND doc_type = %s",
        (project_id, doc_type)
    )


async def get_all_docs(project_id: int):
    return await fetch_all(
        "SELECT doc_type, content, created_at FROM planning_docs WHERE project_id = %s",
        (project_id,)
    )
