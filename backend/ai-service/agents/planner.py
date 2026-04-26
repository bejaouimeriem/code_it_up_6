from langchain_core.messages import HumanMessage
from llm import llm
from state import LabState
from tools.db_tool import log_ai_action, create_task, update_task


def planner_agent(state: LabState) -> LabState:
    """
    Reads the user prompt and decides which agents to invoke.
    Can return 1, 2, or all 3 agents depending on what is needed.
    Order is always: research → inventory → database (when included).
    """
    print ("🔍 Planner analyzing prompt...")
    prompt = state["user_prompt"]
    print(f"User prompt: {prompt}")
    task_id = create_task(prompt)
    print(f"📋 Task created with ID: {task_id}")
    update_task(task_id, "running")
    print("✅ Planner task status updated to 'running'")

    response = llm.invoke([HumanMessage(content=f"""
You are the Planner for Sandy's Treedome Lab AI system.
Analyze the user request and decide which agents are needed. You can pick 1, 2, or all 3.

Available agents and what they do:
- research   → searches the web, finds scientific info, generates experiment ideas
- inventory  → reads the lab database to check available materials and stock levels
- database   → performs CRUD on the DB: saves projects, reads projects/experiments/logs, updates records

Decision rules (pick the MINIMUM agents needed):
| User intent                                          | Agents to use                        |
|------------------------------------------------------|--------------------------------------|
| "research X" / "find ideas for X" / "what experiments can I do with X" | research only |
| "check stock" / "do we have X" / "inventory status" | inventory only |
| "show projects" / "list experiments" / "get logs"   | database only  |
| "can we do X experiment" / "is X feasible"          | research + inventory |
| "save / create a project about X"                   | research + inventory + database |
| "update / delete / modify something"                | database only  |
| "research X and save it"                            | research + database |

User request: "{prompt}"

Respond with ONLY a comma-separated list from: research, inventory, database
No explanation. No punctuation. Just the list.
Examples:
  research
  inventory, database
  research, inventory, database
""")])

    raw = response.content.strip().lower()
    # Keep only valid agent names, preserve order: research → inventory → database
    valid = ["research", "inventory", "database"]
    parsed = [p.strip() for p in raw.replace("\n", ",").split(",") if p.strip() in valid]
    # Deduplicate while preserving order
    seen = set()
    plan = [x for x in parsed if not (x in seen or seen.add(x))]
    if not plan:
        plan = ["database"]  # safe fallback

    log_ai_action("planner", f"Plan decided: {plan} for: {prompt[:80]}", {"plan": plan, "task_id": task_id})
    print(f"🔍 Planner decided on agents: {plan}")

    return {**state, "plan": plan, "task_id": task_id}