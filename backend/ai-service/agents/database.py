from langchain_core.messages import HumanMessage
from llm import llm
from state import LabState
from tools.db_tool import save_project, update_task, log_ai_action, get_all_projects, get_research_cache, get_all_tasks, get_experiments_log


def database_agent(state: LabState) -> LabState:
    """
    - If inventory is FEASIBLE → saves project to DB
    - If user is querying data → fetches and returns it
    - Always updates the agent task status
    - Logs every action
    """
    prompt = state["user_prompt"]
    research = state.get("research_results", "")
    inventory = state.get("inventory_status", "")
    task_id = state.get("task_id")
    plan = state.get("plan", [])

    db_result = ""

    # ── Read-only queries (no research/inventory needed) ────────────────────
    prompt_lower = prompt.lower()
    if any(word in prompt_lower for word in ["show", "list", "get", "fetch", "what are", "display"]):
        if "project" in prompt_lower:
            projects = get_all_projects()
            db_result = f"Found {len(projects)} projects:\n" + "\n".join(
                [f"  [{p['status']}] {p['name']} (priority: {p['priority']})" for p in projects]
            )
        elif "research" in prompt_lower or "cache" in prompt_lower:
            cache = get_research_cache()
            db_result = f"Found {len(cache)} cached research entries:\n" + "\n".join(
                [f"  - {c['topic']} ({c['created_at'][:10]})" for c in cache]
            )
        elif "task" in prompt_lower:
            tasks = get_all_tasks()
            db_result = f"Found {len(tasks)} tasks:\n" + "\n".join(
                [f"  [{t['status']}] {t['task'][:80]}" for t in tasks]
            )
        elif "experiment" in prompt_lower:
            logs = get_experiments_log()
            db_result = f"Found {len(logs)} experiment logs." if logs else "No experiments logged yet."
        else:
            db_result = "Please specify what to show: projects, research cache, tasks, or experiments."

        log_ai_action("database_agent", f"Read query: {prompt[:100]}", {"type": "read"})

    # ── Write: save project if feasible ─────────────────────────────────────
    elif research and inventory:
        is_feasible = "FEASIBLE" in inventory and "NOT FEASIBLE" not in inventory

        if is_feasible:
            project_id = save_project(
                name=prompt[:200],
                description=research[:1000],
                priority=2
            )
            db_result = f"✅ Project saved successfully! ID: {project_id}\nTitle: {prompt[:100]}"
            log_ai_action("database_agent", f"Saved project ID {project_id}", {"feasible": True, "project_id": project_id})
        else:
            db_result = "⚠️ Project NOT saved — inventory check failed (insufficient materials)."
            log_ai_action("database_agent", "Skipped saving project — not feasible", {"feasible": False})

    else:
        db_result = "Database agent: no write action needed for this request."
        log_ai_action("database_agent", "No action taken", {"reason": "no research or inventory data"})

    # ── Update task status ───────────────────────────────────────────────────
    if task_id:
        update_task(task_id, "completed", db_result[:500])

    return {**state, "db_result": db_result}