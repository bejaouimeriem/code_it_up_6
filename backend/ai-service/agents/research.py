from langchain_core.messages import HumanMessage
from llm import llm
from state import LabState
from tools.search_tool import web_search
from tools.db_tool import cache_research, get_cached_research, log_ai_action


def research_agent(state: LabState) -> LabState:
    """
    1. Checks research cache first (avoid duplicate searches)
    2. If not cached, searches DuckDuckGo
    3. Asks LLM to generate experiment ideas from results
    4. Caches results to DB
    """
    prompt = state["user_prompt"]

    log_ai_action("research_agent", f"Starting research for: {prompt[:100]}", {"step": "start"})

    # Check cache first
    cached = get_cached_research(prompt)
    if cached:
        log_ai_action("research_agent", "Used cached research result", {"topic": prompt[:100]})
        return {**state, "research_results": f"[From cache]\n{cached}"}

    # Search the web
    search_results = web_search(f"Sandy science lab experiment ideas: {prompt}")

    # Generate structured experiment ideas with LLM
    response = llm.invoke([HumanMessage(content=f"""
You are Sandy Cheeks' AI research assistant in her Treedome Lab under the sea.

The user wants to explore: "{prompt}"

Web search results:
{search_results}

Based on this, generate 2-3 concrete experiment ideas for Sandy's lab.
For each idea include:
- Experiment name
- Brief description (2 sentences)  
- Required materials (list them clearly)
- Expected outcome

Keep it fun and Sandy-themed! She's a squirrel scientist from Texas living underwater.
""")
    ])

    research_summary = response.content

    # Cache it
    cache_research(topic=prompt, summary=research_summary, source="duckduckgo")
    log_ai_action("research_agent", f"Research complete for: {prompt[:100]}", {"cached": True})

    return {**state, "research_results": research_summary}