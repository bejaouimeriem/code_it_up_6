from langchain_core.messages import HumanMessage
from llm import llm
from state import LabState
from tools.inventory_tool import get_full_inventory
from tools.db_tool import log_ai_action


def inventory_agent(state: LabState) -> LabState:
    """
    Compares experiment requirements (from research agent or user prompt)
    against current inventory and decides if experiments are feasible.
    """
    prompt = state["user_prompt"]
    research = state.get("research_results", "")

    log_ai_action("inventory_agent", "Checking inventory feasibility", {"step": "start"})

    inventory_data = get_full_inventory()

    context = research if research else f"User request: {prompt}"

    response = llm.invoke([HumanMessage(content=f"""
You are Sandy's inventory manager AI for the Treedome Lab.

Experiment context:
{context}

Current lab inventory:
{inventory_data}

Your job:
1. Identify which materials from the experiments are in inventory
2. Identify what is MISSING or has LOW STOCK
3. Give a final verdict: FEASIBLE or NOT FEASIBLE

Format your response exactly like this:
VERDICT: FEASIBLE  (or NOT FEASIBLE)
AVAILABLE: [list what we have]
MISSING: [list what's missing or low]
NOTES: [any important notes]
""")])

    inventory_status = response.content

    is_feasible = "FEASIBLE" in inventory_status and "NOT FEASIBLE" not in inventory_status
    log_ai_action(
        "inventory_agent",
        f"Inventory check complete — {'feasible' if is_feasible else 'not feasible'}",
        {"feasible": is_feasible, "prompt": prompt[:100]}
    )

    return {**state, "inventory_status": inventory_status}