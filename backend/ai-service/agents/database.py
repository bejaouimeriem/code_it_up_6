from langchain_core.messages import HumanMessage
from llm import llm
from state import LabState
from tools.db_tool import (
    save_project,
    save_project_requirements,
    update_task,
    log_ai_action,
    get_all_projects,
    get_research_cache,
    get_all_tasks,
    get_experiments_log,
)
from tools.inventory_tool import resolve_inventory_ids


def _parse_available_materials(inventory_status: str) -> list[str]:
    """
    Extracts materials from the AVAILABLE: line in the inventory agent's output.

    Handles formats like:
      AVAILABLE: beakers, sodium chloride, Bunsen burner
      AVAILABLE: [beakers, sodium chloride, Bunsen burner]
      AVAILABLE: - beakers - sodium chloride

    Returns a list of clean material name strings.
    """
    for line in inventory_status.splitlines():
        if line.strip().upper().startswith("AVAILABLE:"):
            raw = line.split(":", 1)[1]
            # Strip surrounding brackets if present: [item1, item2]
            raw = raw.strip().strip("[]")
            items = [
                item.strip().strip("-").strip()
                for item in raw.split(",")
                if item.strip().strip("-").strip()
            ]
            return items
    return []


def database_agent(state: LabState) -> LabState:
    """
    - Read-only queries: fetches projects / research cache / tasks / experiments
    - Write: saves project + links project_requirements when inventory is FEASIBLE
    - Always updates the agent task status and logs every action
    """
    prompt = state["user_prompt"]
    research = state.get("research_results", "")
    inventory = state.get("inventory_status", "")
    task_id = state.get("task_id")

    db_result = ""

    # ── Read-only queries ────────────────────────────────────────────────────
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

    # ── Write: save project + requirements if feasible ───────────────────────
    elif research and inventory:
        is_feasible = "FEASIBLE" in inventory and "NOT FEASIBLE" not in inventory

        if is_feasible:
            # 1. Save the project
            project_id = save_project(
                name=prompt[:200],
                description=research[:1000],
                priority=2,
            )

            # 2. Parse available materials from inventory agent output
            material_names = _parse_available_materials(inventory)

            # 3. Resolve names → inventory row IDs
            matched = resolve_inventory_ids(material_names)

            # 4. Build requirements list (required_quantity defaults to 1)
            requirements = [
                {"inventory_id": item["inventory_id"], "required_quantity": 1}
                for item in matched
            ]

            # 5. Insert into project_requirements
            req_count = save_project_requirements(project_id, requirements)

            matched_names = ", ".join([i["name"] for i in matched]) if matched else "none matched in inventory"

            db_result = (
                f"✅ Project saved! ID: {project_id}\n"
                f"Title: {prompt[:100]}\n"
                f"📦 Requirements linked: {req_count} material(s) → {matched_names}"
            )
            log_ai_action(
                "database_agent",
                f"Saved project ID {project_id} with {req_count} requirements",
                {
                    "feasible": True,
                    "project_id": project_id,
                    "requirements_count": req_count,
                    "materials": [i["name"] for i in matched],
                },
            )
        else:
            db_result = "⚠️ Project NOT saved — inventory check failed (insufficient materials)."
            log_ai_action(
                "database_agent",
                "Skipped saving project — not feasible",
                {"feasible": False},
            )

    else:
        db_result = "Database agent: no write action needed for this request."
        log_ai_action(
            "database_agent",
            "No action taken",
            {"reason": "no research or inventory data"},
        )

    # ── Update task status ───────────────────────────────────────────────────
    if task_id:
        update_task(task_id, "completed", db_result[:500])

    return {**state, "db_result": db_result}