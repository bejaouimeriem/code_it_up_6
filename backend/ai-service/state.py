from typing import TypedDict, Optional


class LabState(TypedDict):
    # Input
    user_prompt: str

    # Planner output
    plan: list[str]           # e.g. ["research", "inventory", "database"]

    # Each agent's output
    research_results: Optional[str]
    inventory_status: Optional[str]
    db_result: Optional[str]

    # Task tracking
    task_id: Optional[int]

    # Final assembled response
    final_response: Optional[str]