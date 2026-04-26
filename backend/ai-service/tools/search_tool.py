from duckduckgo_search import DDGS

def web_search(query: str, max_results: int = 4) -> str:
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results, timeout=10))
        if not results:
            return "No results found."
        return "\n".join([f"- {r['title']}: {r['body']}" for r in results])
    except Exception as e:
        return f"Search unavailable: {str(e)}"