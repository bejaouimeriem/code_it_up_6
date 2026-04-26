import json
from db import get_connection


# ─── Projects ────────────────────────────────────────────────────────────────

def save_project(name: str, description: str, priority: int = 1) -> int:
    """Insert a new project and return its ID."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO projects (name, description, priority) VALUES (%s, %s, %s) RETURNING id",
                (name[:200], description[:1000], priority)
            )
            project_id = cur.fetchone()[0]
        conn.commit()
        return project_id
    finally:
        conn.close()


def get_all_projects() -> list:
    """Fetch all projects."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, name, description, status, priority, created_at FROM projects ORDER BY created_at DESC")
            rows = cur.fetchall()
        return [
            {"id": r[0], "name": r[1], "description": r[2], "status": r[3], "priority": r[4], "created_at": str(r[5])}
            for r in rows
        ]
    finally:
        conn.close()


def update_project_status(project_id: int, status: str) -> str:
    """Update a project's status."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("UPDATE projects SET status = %s WHERE id = %s", (status, project_id))
        conn.commit()
        return f"Project {project_id} status updated to '{status}'."
    finally:
        conn.close()


# ─── AI Actions Log ──────────────────────────────────────────────────────────

def log_ai_action(action_type: str, description: str, metadata: dict = {}) -> None:
    """Log every agent action — called after every agent step."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO ai_actions_log (action_type, description, metadata) VALUES (%s, %s, %s)",
                (action_type, description, json.dumps(metadata))
            )
        conn.commit()
    finally:
        conn.close()


def get_ai_logs() -> list:
    """Fetch recent AI action logs."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, action_type, description, metadata, created_at FROM ai_actions_log ORDER BY created_at DESC LIMIT 50")
            rows = cur.fetchall()
        return [
            {"id": r[0], "action_type": r[1], "description": r[2], "metadata": r[3], "created_at": str(r[4])}
            for r in rows
        ]
    finally:
        conn.close()


# ─── Research Cache ───────────────────────────────────────────────────────────

def cache_research(topic: str, summary: str, source: str = "duckduckgo") -> None:
    """Save research results to avoid redundant searches."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO research_cache (topic, summary, source) VALUES (%s, %s, %s)",
                (topic, summary, source)
            )
        conn.commit()
    finally:
        conn.close()


def get_cached_research(topic: str) -> str | None:
    """Check if we already researched this topic recently (last 24h)."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT summary FROM research_cache
                   WHERE topic ILIKE %s
                   AND created_at > NOW() - INTERVAL '24 hours'
                   ORDER BY created_at DESC LIMIT 1""",
                (f"%{topic}%",)
            )
            row = cur.fetchone()
        return row[0] if row else None
    finally:
        conn.close()


def get_research_cache() -> list:
    """Fetch all cached research."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, topic, summary, source, created_at FROM research_cache ORDER BY created_at DESC LIMIT 30")
            rows = cur.fetchall()
        return [
            {"id": r[0], "topic": r[1], "summary": r[2], "source": r[3], "created_at": str(r[4])}
            for r in rows
        ]
    finally:
        conn.close()


# ─── Agent Tasks ──────────────────────────────────────────────────────────────

def create_task(task: str) -> int:
    """Create a new agent task entry, returns task ID."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO agent_tasks (task, status) VALUES (%s, 'pending') RETURNING id",
                (task,)
            )
            task_id = cur.fetchone()[0]
        conn.commit()
        return task_id
    finally:
        conn.close()


def update_task(task_id: int, status: str, result: str = "") -> None:
    """Update a task's status and result."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE agent_tasks SET status = %s, result = %s WHERE id = %s",
                (status, result, task_id)
            )
        conn.commit()
    finally:
        conn.close()


def get_all_tasks() -> list:
    """Fetch all agent tasks."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, task, status, result, created_at FROM agent_tasks ORDER BY created_at DESC LIMIT 50")
            rows = cur.fetchall()
        return [
            {"id": r[0], "task": r[1], "status": r[2], "result": r[3], "created_at": str(r[4])}
            for r in rows
        ]
    finally:
        conn.close()


# ─── Experiments Log ──────────────────────────────────────────────────────────

def get_experiments_log() -> list:
    """Fetch all experiments."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, project_id, result, success, notes, created_at FROM experiments_log ORDER BY created_at DESC")
            rows = cur.fetchall()
        return [
            {"id": r[0], "project_id": r[1], "result": r[2], "success": r[3], "notes": r[4], "created_at": str(r[5])}
            for r in rows
        ]
    finally:
        conn.close()