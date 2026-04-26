from langgraph.graph import StateGraph, END
from state import LabState
from agents.planner import planner_agent
from agents.research import research_agent
from agents.inventory import inventory_agent
from agents.database import database_agent


def route_after_planner(state: LabState) -> str:
    plan = state.get("plan", [])
    if "research" in plan:
        return "research"
    elif "inventory" in plan:
        return "inventory"
    elif "database" in plan:
        return "database"
    return END


def route_after_research(state: LabState) -> str:
    plan = state.get("plan", [])
    if "inventory" in plan:
        return "inventory"
    elif "database" in plan:
        return "database"
    return END


def route_after_inventory(state: LabState) -> str:
    plan = state.get("plan", [])
    if "database" in plan:
        return "database"
    return END


def build_graph():
    builder = StateGraph(LabState)

    builder.add_node("planner", planner_agent)
    builder.add_node("research", research_agent)
    builder.add_node("inventory", inventory_agent)
    builder.add_node("database", database_agent)

    builder.set_entry_point("planner")

    builder.add_conditional_edges("planner", route_after_planner, {
        "research": "research",
        "inventory": "inventory",
        "database": "database",
        END: END,
    })
    builder.add_conditional_edges("research", route_after_research, {
        "inventory": "inventory",
        "database": "database",
        END: END,
    })
    builder.add_conditional_edges("inventory", route_after_inventory, {
        "database": "database",
        END: END,
    })
    builder.add_edge("database", END)

    return builder.compile()


graph = build_graph()