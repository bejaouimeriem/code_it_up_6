import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from graph import graph
from tools.db_tool import (
    get_all_projects,
    get_ai_logs,
    get_research_cache,
    get_all_tasks,
    get_experiments_log,
)
from tools.inventory_tool import get_full_inventory

load_dotenv()

app = FastAPI(title="Sandy's Lab AI Service 🐿️", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:5173"),
        os.getenv("NESTJS_URL", "http://localhost:3000"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PromptRequest(BaseModel):
    prompt: str


@app.post("/agent/run")
def run_agent(req: PromptRequest):
    if not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")
    try:
        print(f"🔵 Starting agent for: {req.prompt[:50]}")
        result = graph.invoke({"user_prompt": req.prompt})
        print(f"✅ Agent done!")
        return {
            "success": True,
            "prompt": req.prompt,
            "plan": result.get("plan", []),
            "research": result.get("research_results"),
            "inventory": result.get("inventory_status"),
            "database": result.get("db_result"),
            "task_id": result.get("task_id"),
        }
    except Exception as e:
        print(f"❌ Agent error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/data/projects")
def get_projects():
    return get_all_projects()


@app.get("/data/inventory")
def get_inventory():
    return {"raw": get_full_inventory()}


@app.get("/data/logs")
def get_logs():
    return get_ai_logs()


@app.get("/data/research-cache")
def get_research():
    return get_research_cache()


@app.get("/data/tasks")
def get_tasks():
    return get_all_tasks()


@app.get("/data/experiments")
def get_experiments():
    return get_experiments_log()


@app.get("/health")
def health():
    return {"status": "ok", "message": "Sandy's Lab AI is up! 🌊"}