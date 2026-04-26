// ─── CONFIG ───────────────────────────────────────────────────────────────────
const NEST  = import.meta.env.VITE_NEST_URL  || "http://localhost:3000/api";
const AI    = import.meta.env.VITE_AI_URL    || "http://localhost:8000";

async function req<T>(url: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── PROJECTS ─────────────────────────────────────────────────────────────────
export interface ApiProject {
  id: number;
  name: string;
  description: string;
  status: "planned" | "ongoing" | "completed";
  priority: number;
  createdAt: string;
  requirements?: ApiRequirement[];
  experiments?: ApiExperiment[];
}

export const api = {
  // ── Projects ──────────────────────────────────────────────────────────────
  projects: {
    list: () =>
      req<ApiProject[]>(`${NEST}/projects`),

    create: (data: { name: string; description?: string; status?: string; priority?: number }) =>
      req<ApiProject>(`${NEST}/projects`, { method: "POST", body: JSON.stringify(data) }),

    update: (id: number, data: Partial<{ name: string; description: string; status: string; priority: number }>) =>
      req<ApiProject>(`${NEST}/projects/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

    remove: (id: number) =>
      req<void>(`${NEST}/projects/${id}`, { method: "DELETE" }),
  },

  // ── Inventory ─────────────────────────────────────────────────────────────
  inventory: {
    list: () =>
      req<ApiInventory[]>(`${NEST}/inventory`),

    lowStock: () =>
      req<ApiInventory[]>(`${NEST}/inventory/low-stock`),

    create: (data: { name: string; category?: string; quantity?: number; unit?: string; minRequired?: number }) =>
      req<ApiInventory>(`${NEST}/inventory`, { method: "POST", body: JSON.stringify(data) }),

    update: (id: number, data: Partial<{ name: string; category: string; quantity: number; unit: string; minRequired: number }>) =>
      req<ApiInventory>(`${NEST}/inventory/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

    addTransaction: (id: number, data: { changeAmount: number; reason?: string; experimentId?: number }) =>
      req<ApiTransaction>(`${NEST}/inventory/${id}/transactions`, { method: "POST", body: JSON.stringify(data) }),

    transactions: (id: number) =>
      req<ApiTransaction[]>(`${NEST}/inventory/${id}/transactions`),
  },

  // ── Experiments ───────────────────────────────────────────────────────────
  experiments: {
    list: (projectId?: number) =>
      req<ApiExperiment[]>(`${NEST}/experiments${projectId ? `?projectId=${projectId}` : ""}`),

    create: (data: {
      projectId?: number; result?: string; success?: boolean; notes?: string;
      usedResources?: { inventoryId: number; quantity: number; reason?: string }[];
    }) =>
      req<ApiExperiment>(`${NEST}/experiments`, { method: "POST", body: JSON.stringify(data) }),
  },

  // ── Project Requirements ──────────────────────────────────────────────────
  requirements: {
    create: (data: { projectId: number; inventoryId: number; requiredQuantity: number }) =>
      req<ApiRequirement>(`${NEST}/project-requirements`, { method: "POST", body: JSON.stringify(data) }),
  },

  // ── AI Service ────────────────────────────────────────────────────────────
  ai: {
    run: (prompt: string) =>
      req<AiRunResult>(`${AI}/agent/run`, { method: "POST", body: JSON.stringify({ prompt }) }),

    logs: () =>
      req<AiLog[]>(`${AI}/data/logs`),

    tasks: () =>
      req<AiTask[]>(`${AI}/data/tasks`),

    research: () =>
      req<AiResearch[]>(`${AI}/data/research-cache`),

    health: () =>
      req<{ status: string; message: string }>(`${AI}/health`),
  },
};

// ─── TYPES ────────────────────────────────────────────────────────────────────
export interface ApiInventory {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minRequired: number;
  lastUpdated: string;
}

export interface ApiTransaction {
  id: number;
  inventoryId: number;
  changeAmount: number;
  reason: string;
  experimentId?: number;
  createdAt: string;
}

export interface ApiExperiment {
  id: number;
  projectId: number;
  result: string;
  success: boolean;
  notes: string;
  createdAt: string;
}

export interface ApiRequirement {
  id: number;
  projectId: number;
  inventoryId: number;
  requiredQuantity: number;
  inventory?: ApiInventory;
}

export interface AiRunResult {
  success: boolean;
  prompt: string;
  plan: string[];
  research?: string;
  inventory?: string;
  database?: string;
  task_id?: number;
}

export interface AiLog {
  id: number;
  action_type: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface AiTask {
  id: number;
  task: string;
  status: string;
  result: string;
  created_at: string;
}

export interface AiResearch {
  id: number;
  topic: string;
  summary: string;
  source: string;
  created_at: string;
}