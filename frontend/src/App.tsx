import { useState, useCallback, useEffect, useRef } from "react";
import { api, ApiProject, ApiInventory, AiLog, AiTask, ApiTransaction, ApiRequirement } from "./api";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Priority = "high" | "med" | "low";
type ProjectStatus = "planned" | "ongoing" | "completed";
type AgentKey = "research" | "inventory" | "database";
type AgentStatus = "idle" | "running" | "done" | "skipped";
type Page = "dashboard" | "transactions" | "projects" | "inventory" | "logs" | "experiments";
type ModalType = "proj" | "inv" | "editInv" | "exp" | "editExp" | "experiment" | "projectDetail" | null;

interface Project {
  id: number;
  name: string;
  desc: string;
  priority: Priority;
  status: ProjectStatus;
  icon: string;
}

interface InvItem {
  id: number;
  name: string;
  qty: number;
  min: number;
  cat: string;
  unit: string;
}

interface Agent {
  status: AgentStatus;
  action: string;
  out: string;
}

interface LogEntry {
  id: number;
  agent: string;
  text: string;
  time: string;
}

interface Experiment {
  id: number;
  projectId: number;
  result: string;
  success: boolean;
  notes: string;
  createdAt: string;
  usedResources?: { inventoryId: number; quantity: number; reason?: string }[];
}

interface RequirementRow {
  inventoryId: number;
  requiredQuantity: number;
}

interface UsedResourceRow {
  inventoryId: number;
  quantity: number;
  reason: string;
}

const INIT_LOGS: LogEntry[] = [
  { id: 1, agent: "system",    text: "Sandy's Lab AI initialized — Treedome mode active 🌊", time: "09:00" },
  { id: 2, agent: "planner",   text: "Planner ready — waiting for task prompt",              time: "09:01" },
  { id: 3, agent: "research",  text: "Research Agent connected to web search module",        time: "09:01" },
  { id: 4, agent: "inventory", text: "Inventory Agent loaded",                               time: "09:02" },
  { id: 5, agent: "database",  text: "Database Agent CRUD interface ready — sandy_lab connected", time: "09:02" },
];

const PRIORITY_MAP: Record<number, Priority> = { 3: "high", 2: "med", 1: "low" };
const PRIORITY_TO_NUM: Record<Priority, number> = { high: 3, med: 2, low: 1 };
const PROJECT_ICONS = ["🪸","🍔","🪼","💧","🌿","🔬","🧬","⭐","🫧","🦑","🐡","🧪"];

const AGENT_SEQUENCES: Record<AgentKey, string[]> = {
  research:  ["🔬 Initiating oceanic web search protocol...", "📡 Querying Bikini Bottom knowledge base...", "🪸 Found relevant marine science sources", "🧪 Synthesizing research results...", "Research report complete ✓"],
  inventory: ["📦 Scanning Treedome inventory database...", "🔍 Checking stock levels for all materials...", "📋 Generating feasibility report...", "Inventory report ready ✓"],
  database:  ["🗄️ Connecting to sandy_lab PostgreSQL...", "✅ Running CRUD validation on all tables...", "📝 Logging task metadata to ai_actions_log...", "💾 Updating records...", "Database sync complete ✓"],
};

function nowTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}
function sleep(ms: number) { return new Promise<void>((r) => setTimeout(r, ms)); }
function mapPriority(n: number): Priority { return PRIORITY_MAP[n] || "low"; }
function apiToProject(p: ApiProject): Project {
  return {
    id: p.id, name: p.name, desc: p.description || "",
    priority: mapPriority(p.priority), status: p.status,
    icon: PROJECT_ICONS[p.id % PROJECT_ICONS.length],
  };
}
function apiToInv(i: ApiInventory): InvItem {
  return { id: i.id, name: i.name, qty: i.quantity, min: i.minRequired, cat: i.category || "Lab", unit: i.unit || "pcs" };
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────
function OceanBubbles() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" style={{ background: "linear-gradient(180deg, #bae1ff 0%, #7ec8e3 30%, #2d6a9f 70%, #1a3a5c 100%)" }}>
      <div className="absolute inset-0 opacity-[0.08]" style={{ background: `repeating-linear-gradient(45deg, transparent, transparent 30px, rgba(255,255,255,0.1) 30px, rgba(255,255,255,0.1) 60px), repeating-linear-gradient(-45deg, transparent, transparent 40px, rgba(255,255,255,0.06) 40px, rgba(255,255,255,0.06) 80px)` }} />
      <div className="absolute text-3xl opacity-20" style={{ top: "10%", left: "5%", animation: "jelly-float 14s ease-in-out infinite" }}>🪼</div>
      <div className="absolute text-2xl opacity-15" style={{ top: "30%", right: "8%", animation: "jelly-float 18s ease-in-out infinite reverse" }}>🪼</div>
      <div className="sea-flower" style={{ top: "12%", right: "18%", animationDelay: "0s", color: "rgba(248,231,28,0.3)" }}>✿</div>
      <div className="sea-flower" style={{ top: "46%", left: "8%", animationDelay: "1.4s", color: "rgba(255,182,193,0.3)" }}>✿</div>
      <div className="sandy-float" style={{ top: "18%", left: "18%", animationDelay: "0.4s" }}>🤠</div>
      <div className="sandy-float" style={{ top: "68%", right: "18%", animationDelay: "1.8s" }}>🥜</div>
      <div className="sandy-float" style={{ top: "8%", right: "6%", animationDelay: "3.5s" }}>⭐</div>
      {Array.from({ length: 34 }, (_, i) => (
        <div key={i} className="absolute rounded-full bubble-rise" style={{ width: `${6+((i*5)%18)}px`, height: `${6+((i*5)%18)}px`, left: `${(i*5.1)%100}%`, bottom: -20, background: i%3===0?"rgba(255,255,255,0.35)":i%3===1?"rgba(173,216,230,0.4)":"rgba(255,215,0,0.2)", animationDuration: `${10+(i%7)*2.5}s`, animationDelay: `${(i*0.9)%12}s` }} />
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: AgentStatus }) {
  const map = { idle: { label: "Idle", bg: "bg-sky-100/70", text: "text-sky-700", dot: "bg-teal-400" }, running: { label: "Running", bg: "bg-amber-100/70", text: "text-amber-700", dot: "bg-amber-400 animate-pulse" }, done: { label: "Done", bg: "bg-teal-100/70", text: "text-teal-700", dot: "bg-teal-500" }, skipped: { label: "Skipped", bg: "bg-slate-100", text: "text-slate-400", dot: "bg-slate-300" } };
  const s = map[status];
  return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black ${s.bg} ${s.text}`}><span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}</span>;
}

function AgentCard({ agentKey, agent }: { agentKey: AgentKey; agent: Agent }) {
  const defs = { research: { emoji: "🔍", name: "Research Agent", type: "Web Search & Experiment Ideas", accent: "border-sky-300 bg-sky-100/60" }, inventory: { emoji: "📦", name: "Inventory Agent", type: "Stock Tracking & Alerts", accent: "border-amber-300 bg-amber-100/50" }, database: { emoji: "🗄️", name: "Database Agent", type: "PostgreSQL CRUD — sandy_lab", accent: "border-rose-300 bg-rose-100/40" } };
  const d = defs[agentKey];
  const borderCls = agent.status==="running"?"border-amber-300 shadow-lg shadow-amber-100/50":agent.status==="done"?"border-teal-300/60 shadow-sm shadow-teal-100/30":agent.status==="skipped"?"border-slate-200/60 opacity-50":"border-sky-200/60";
  return (
    <div className={`rounded-2xl border-2 bg-white/85 backdrop-blur-md p-4 transition-all duration-300 ${borderCls}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border-2 ${d.accent}`}>{d.emoji}</div>
          <div><div className="text-sm font-black text-cyan-950">{d.name}</div><div className="text-[10px] text-slate-400 mt-0.5">{d.type}</div></div>
        </div>
        <StatusBadge status={agent.status} />
      </div>
      <hr className="border-sky-200/50 mb-3" />
      <div className="mb-1"><div className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Last Action</div><div className="text-[11px] text-slate-600">{agent.action || "—"}</div></div>
      <div className="mt-2 rounded-lg bg-sky-50/60 border border-sky-200/50 p-2.5 text-[11px] text-slate-600 leading-relaxed min-h-[44px]">
        {agent.out || <span className="text-teal-400/70">Waiting for task... 🫧</span>}
        {agent.status==="running" && <span className="inline-block w-0.5 h-3 bg-amber-400 ml-0.5 animate-pulse align-middle" />}
      </div>
    </div>
  );
}

function PriBadge({ priority }: { priority: Priority }) {
  const map = { high: "bg-red-100 text-red-600", med: "bg-amber-100 text-amber-600", low: "bg-teal-100 text-teal-600" };
  return <span className={`text-[9px] font-black px-2 py-0.5 rounded-full whitespace-nowrap ${map[priority]}`}>{priority==="high"?"High":priority==="med"?"Med":"Low"}</span>;
}

function StBadge({ status }: { status: ProjectStatus }) {
  const map = { planned: "bg-sky-100 text-sky-700", ongoing: "bg-amber-100 text-amber-700", completed: "bg-teal-100 text-teal-600" };
  return <span className={`text-[9px] font-black px-2 py-0.5 rounded-full whitespace-nowrap ${map[status]}`}>{status.charAt(0).toUpperCase()+status.slice(1)}</span>;
}

function LogDot({ agent }: { agent: string }) {
  const map: Record<string,string> = { research: "border-teal-400 bg-sky-200", inventory: "border-amber-400 bg-amber-200/70", database: "border-rose-400 bg-rose-200/60", planner: "border-teal-500 bg-teal-100", system: "border-sky-400 bg-sky-100" };
  return <span className={`w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 mt-1 ${map[agent]||map.system}`} />;
}

function AgentText({ agent }: { agent: string }) {
  const map: Record<string,string> = { research: "text-sky-600", inventory: "text-amber-600", database: "text-rose-500", planner: "text-teal-600", system: "text-teal-500" };
  return <span className={`text-[10px] font-black ${map[agent]||map.system}`}>{agent.toUpperCase()} </span>;
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 bg-cyan-950/40 z-50 flex items-center justify-center backdrop-blur-sm px-4" onClick={onClose}>
      <div className={`bg-gradient-to-br from-white via-sky-50/60 to-pink-50/40 border-2 border-sky-200/70 rounded-3xl p-5 md:p-6 w-full ${wide ? "max-w-2xl" : "max-w-md"} shadow-2xl max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        <div className="text-[17px] font-black text-cyan-950 mb-5">{title}</div>
        {children}
      </div>
    </div>
  );
}

function MField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="mb-3"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>{children}</div>;
}

const inputCls = "w-full bg-white border-2 border-sky-200 rounded-xl px-3 py-2.5 text-[13px] text-cyan-950 font-semibold outline-none focus:border-teal-400 transition-colors placeholder:text-slate-300";
const selectCls = "w-full bg-white border-2 border-sky-200 rounded-xl px-3 py-2.5 text-[13px] text-cyan-950 font-semibold outline-none cursor-pointer focus:border-teal-400";

function Spinner() {
  return <span className="inline-block w-4 h-4 border-2 border-sky-300 border-t-teal-500 rounded-full animate-spin" />;
}

function ErrorBanner({ msg, onClose }: { msg: string; onClose: () => void }) {
  return (
    <div className="flex items-center gap-2 bg-red-50 border-2 border-red-200 rounded-xl px-4 py-2.5 text-[12px] font-bold text-red-600 mb-3">
      <span>❌</span><span className="flex-1">{msg}</span>
      <button onClick={onClose} className="text-red-400 hover:text-red-600 font-black">✕</button>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [promptText, setPromptText] = useState("");
  const [running, setRunning] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [resultExpanded, setResultExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [projects, setProjects] = useState<Project[]>([]);
  const [inventory, setInventory] = useState<InvItem[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>(INIT_LOGS);
  const [aiTasks, setAiTasks] = useState<AiTask[]>([]);
  const [aiOnline, setAiOnline] = useState<boolean | null>(null);

  // Transactions
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Selected project for detail modal
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedProjectRequirements, setSelectedProjectRequirements] = useState<ApiRequirement[]>([]);
  const [loadingRequirements, setLoadingRequirements] = useState(false);

  // Loading states
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [loadingExperiments, setLoadingExperiments] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const [agents, setAgents] = useState<Record<AgentKey, Agent>>({
    research:  { status: "idle", action: "Awaiting task 🫧", out: "" },
    inventory: { status: "idle", action: "Stock loaded",     out: "" },
    database:  { status: "idle", action: "sandy_lab connected", out: "" },
  });

  const [modal, setModal] = useState<ModalType>(null);
  const [modalForm, setModalForm] = useState<Record<string, any>>({});
  // Requirements rows in the new project form
  const [requirementRows, setRequirementRows] = useState<RequirementRow[]>([]);
  const [usedResourceRows, setUsedResourceRows] = useState<UsedResourceRow[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  // ── Filters ─────────────────────────────────────────────────────────────
  const [projSearch, setProjSearch] = useState("");
  const [projPriority, setProjPriority] = useState<"all"|Priority>("all");
  const [projStatus, setProjStatus] = useState<"all"|ProjectStatus>("all");
  const [invSearch, setInvSearch] = useState("");
  const [invCat, setInvCat] = useState<string>("all");
  const [invStock, setInvStock] = useState<"all"|"low"|"ok"|"out">("all");
  const [txSearch, setTxSearch] = useState("");

  // ── Close sidebar on outside click ────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sidebarOpen && sidebarRef.current && !sidebarRef.current.contains(e.target as Node))
        setSidebarOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [sidebarOpen]);

  const addLog = useCallback((agent: string, text: string) => {
    setLogs((l) => [...l, { id: Date.now() + Math.random(), agent, text, time: nowTime() }]);
  }, []);

  // ── Data fetchers ────────────────────────────────────────────────────
  const fetchProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const data = await api.projects.list();
      setProjects(data.map(apiToProject));
    } catch (e: any) {
      addLog("system", `⚠️ Could not load projects: ${e.message}`);
    } finally {
      setLoadingProjects(false);
    }
  }, [addLog]);

  const fetchInventory = useCallback(async () => {
    setLoadingInventory(true);
    try {
      const data = await api.inventory.list();
      setInventory(data.map(apiToInv));
    } catch (e: any) {
      addLog("system", `⚠️ Could not load inventory: ${e.message}`);
    } finally {
      setLoadingInventory(false);
    }
  }, [addLog]);

  const fetchExperiments = useCallback(async () => {
    setLoadingExperiments(true);
    try {
      const data = await api.experiments.list();
      setExperiments(data.map((e) => ({
        id: e.id, projectId: e.projectId, result: e.result,
        success: e.success, notes: e.notes, createdAt: e.createdAt,
      })));
    } catch (e: any) {
      addLog("system", `⚠️ Could not load experiments: ${e.message}`);
    } finally {
      setLoadingExperiments(false);
    }
  }, [addLog]);

  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const data = await api.ai.logs();
      const mapped: LogEntry[] = data.map((l) => ({
        id: l.id,
        agent: l.action_type?.split("_")[0] || "system",
        text: l.description,
        time: new Date(l.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      }));
      if (mapped.length > 0) setLogs((prev) => [...INIT_LOGS, ...mapped]);
    } catch {
      // AI service offline — keep INIT_LOGS
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const data = await api.ai.tasks();
      setAiTasks(data);
    } catch { /* silent */ }
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoadingTransactions(true);
    try {
      // Fetch transactions for all inventory items
      const invData = await api.inventory.list();
      const allTx: ApiTransaction[] = [];
      await Promise.allSettled(
        invData.map(async (item) => {
          try {
            const txs = await api.inventory.transactions(item.id);
            allTx.push(...txs);
          } catch { /* skip */ }
        })
      );
      allTx.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTransactions(allTx);
    } catch (e: any) {
      addLog("system", `⚠️ Could not load transactions: ${e.message}`);
    } finally {
      setLoadingTransactions(false);
    }
  }, [addLog]);

  const checkAiHealth = useCallback(async () => {
    try {
      await api.ai.health();
      setAiOnline(true);
    } catch {
      setAiOnline(false);
    }
  }, []);

  // ── Initial load ─────────────────────────────────────────────────────
  useEffect(() => {
    fetchProjects();
    fetchInventory();
    fetchExperiments();
    fetchLogs();
    fetchTasks();
    checkAiHealth();
  }, []);

  // ── Refresh when page changes ────────────────────────────────────────
  useEffect(() => {
    if (page === "projects")      fetchProjects();
    if (page === "inventory")     fetchInventory();
    if (page === "experiments")   fetchExperiments();
    if (page === "transactions")  { fetchTransactions(); fetchInventory(); }
    if (page === "logs")          { fetchLogs(); fetchTasks(); }
  }, [page]);

  // ── Run agent ────────────────────────────────────────────────────────
  const handleRun = async (taskOverride?: string) => {
    const taskText = (taskOverride ?? promptText).trim();
    if (!taskText || running) return;
    setPromptText(taskText);
    setRunning(true);
    setResultText(null);
    setResultExpanded(false);
    setError(null);

    addLog("system", `New task: "${taskText.substring(0, 60)}..."`);
    addLog("planner", "Routing to agents...");

    setAgents({
      research:  { status: "idle", action: "Standby...", out: "" },
      inventory: { status: "idle", action: "Standby...", out: "" },
      database:  { status: "idle", action: "Standby...", out: "" },
    });

    const animateAll = async () => {
      const keys: AgentKey[] = ["research", "inventory", "database"];
      for (const key of keys) {
        const seq = AGENT_SEQUENCES[key];
        setAgents((prev) => ({ ...prev, [key]: { ...prev[key], status: "running", action: seq[0], out: seq[0] } }));
        for (let i = 1; i < seq.length - 1; i++) {
          await sleep(700);
          setAgents((prev) => ({ ...prev, [key]: { ...prev[key], action: seq[i], out: seq[i] } }));
        }
      }
    };

    const [result] = await Promise.allSettled([
      api.ai.run(taskText),
      animateAll(),
    ]);

    if (result.status === "fulfilled" && result.value.success) {
      const data = result.value;
      const activePlan = data.plan as AgentKey[];

      const allKeys: AgentKey[] = ["research", "inventory", "database"];
      const finalAgents: Record<AgentKey, Agent> = { research: agents.research, inventory: agents.inventory, database: agents.database };
      for (const key of allKeys) {
        if (activePlan.includes(key)) {
          const out = key === "research" ? data.research : key === "inventory" ? data.inventory : data.database;
          finalAgents[key] = { status: "done", action: AGENT_SEQUENCES[key].at(-1) || "Done ✓", out: out || "Completed ✓" };
          addLog(key, AGENT_SEQUENCES[key].at(-1) || "Done");
        } else {
          finalAgents[key] = { status: "skipped", action: "Not needed for this task", out: "" };
        }
      }
      setAgents(finalAgents);

      const parts: string[] = ["✅ Sandy's AI system completed your task!\n\n"];
      if (data.research) parts.push(`🔍 Research:\n${data.research}\n\n`);
      if (data.inventory) parts.push(`📦 Inventory:\n${data.inventory}\n\n`);
      if (data.database) parts.push(`🗄️ Database:\n${data.database}`);
      setResultText(parts.join(""));
      addLog("system", "All activated agents completed — task finalized 🌊");

      await Promise.all([fetchProjects(), fetchInventory(), fetchLogs(), fetchTasks()]);
    } else {
      const errMsg = result.status === "rejected" ? result.reason?.message : "AI service error";
      setError(`Agent error: ${errMsg}. Running in demo mode.`);

      const demoAgents: Record<AgentKey, Agent> = {
        research:  { status: "done", action: AGENT_SEQUENCES.research.at(-1)!,  out: "Demo mode — AI service offline 🫧" },
        inventory: { status: "done", action: AGENT_SEQUENCES.inventory.at(-1)!, out: "Demo mode — AI service offline 🫧" },
        database:  { status: "done", action: AGENT_SEQUENCES.database.at(-1)!,  out: "Demo mode — AI service offline 🫧" },
      };
      setAgents(demoAgents);
      setResultText("⚠️ AI service offline — running in demo mode. Start the FastAPI service to get real results.");
      addLog("system", "⚠️ AI service unreachable — demo mode activated");
    }

    setRunning(false);
  };

  // ── Project CRUD ─────────────────────────────────────────────────────
  const openProjModal = () => {
    setModalForm({ name: "", desc: "", priority: "med", status: "planned" });
    setRequirementRows([]);
    setModal("proj");
  };

  const saveProj = async () => {
    if (!String(modalForm.name).trim()) return;
    try {
      const created = await api.projects.create({ name: modalForm.name, description: modalForm.desc, status: modalForm.status, priority: PRIORITY_TO_NUM[modalForm.priority as Priority] });
      addLog("database", `Project created: ${modalForm.name}`);

      // Save requirements
      for (const row of requirementRows) {
        if (row.inventoryId && row.requiredQuantity > 0) {
          try {
            await api.requirements.create({ projectId: created.id, inventoryId: row.inventoryId, requiredQuantity: row.requiredQuantity });
          } catch (e: any) {
            addLog("database", `⚠️ Requirement failed: ${e.message}`);
          }
        }
      }

      setModal(null);
      fetchProjects();
    } catch (e: any) { setError(e.message); }
  };

  const cycleProjectStatus = async (id: number) => {
    const order: ProjectStatus[] = ["planned", "ongoing", "completed"];
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    const next = order[(order.indexOf(project.status) + 1) % order.length];
    try {
      await api.projects.update(id, { status: next });
      setProjects((v) => v.map((p) => p.id === id ? { ...p, status: next } : p));
      addLog("database", `Project status: ${project.name} → ${next}`);
    } catch (e: any) { setError(e.message); }
  };

  const deleteProject = async (id: number) => {
    const project = projects.find((p) => p.id === id);
    try {
      await api.projects.remove(id);
      setProjects((v) => v.filter((p) => p.id !== id));
      if (project) addLog("database", `Project deleted: ${project.name}`);
    } catch (e: any) { setError(e.message); }
  };

  // ── Open Project Detail Modal ────────────────────────────────────────
  const openProjectDetail = async (project: Project) => {
    setSelectedProject(project);
    setModal("projectDetail");
    setLoadingRequirements(true);
    setSelectedProjectRequirements([]);
    try {
      // Fetch requirements: GET /project-requirements?projectId=id
      // Since the API only has a generic list endpoint, we fetch all and filter
      // Or use the project's requirements if they come embedded
      const allProjects = await api.projects.list();
      const found = allProjects.find((p) => p.id === project.id);
      setSelectedProjectRequirements(found?.requirements || []);
    } catch (e: any) {
      addLog("system", `⚠️ Could not load requirements: ${e.message}`);
    } finally {
      setLoadingRequirements(false);
    }
  };

  // ── Inventory CRUD ────────────────────────────────────────────────────
  const openInvModal = () => {
    setModalForm({ name: "", qty: 0, min: 5, cat: "Lab", unit: "pcs" });
    setModal("inv");
  };
  const openEditInv = (item: InvItem) => { setModalForm({ ...item }); setModal("editInv"); };

  const saveInv = async () => {
    if (!String(modalForm.name).trim()) return;
    try {
      await api.inventory.create({ name: modalForm.name, category: modalForm.cat, quantity: Number(modalForm.qty), unit: modalForm.unit, minRequired: Number(modalForm.min) });
      addLog("database", `Item added: ${modalForm.name}`);
      setModal(null);
      fetchInventory();
    } catch (e: any) { setError(e.message); }
  };
  const saveEditInv = async () => {
    try {
      await api.inventory.update(modalForm.id, { name: modalForm.name, category: modalForm.cat, quantity: Number(modalForm.qty), unit: modalForm.unit, minRequired: Number(modalForm.min) });
      addLog("database", `Item updated: ${modalForm.name}`);
      setModal(null);
      fetchInventory();
    } catch (e: any) { setError(e.message); }
  };
  const deleteInv = async (id: number) => {
    const item = inventory.find((i) => i.id === id);
    setInventory((v) => v.filter((i) => i.id !== id));
    if (item) addLog("database", `Item removed: ${item.name}`);
  };
  const restockInv = async (id: number) => {
    const item = inventory.find((i) => i.id === id);
    if (!item) return;
    const target = Math.max(item.min + 5, item.qty + 5);
    try {
      await api.inventory.addTransaction(id, { changeAmount: target - item.qty, reason: "Manual restock" });
      await api.inventory.update(id, { quantity: target });
      setInventory((v) => v.map((i) => i.id === id ? { ...i, qty: target } : i));
      addLog("inventory", `Restocked ${item.name} to ${target} ${item.unit}`);
    } catch (e: any) { setError(e.message); }
  };
  const restockLowInventory = async () => {
    const lowItems = inventory.filter((i) => i.qty < i.min);
    if (lowItems.length === 0) { addLog("inventory", "All supplies already OK"); return; }
    for (const item of lowItems) await restockInv(item.id);
    addLog("inventory", `Auto-restocked ${lowItems.length} item(s)`);
  };

  // ── Experiment CRUD ────────────────────────────────────────────────────
  const openExpModal = () => {
    setModalForm({ projectId: projects[0]?.id || "", result: "", success: true, notes: "", resources: [] });
    setUsedResourceRows([]);
    setModal("experiment");
  };
  const saveExperiment = async () => {
    try {
      await api.experiments.create({
        projectId: Number(modalForm.projectId) || undefined,
        result: modalForm.result,
        success: modalForm.success === true || modalForm.success === "true",
        notes: modalForm.notes,
        usedResources: usedResourceRows
          .filter((r) => r.inventoryId && r.quantity > 0)
          .map((r) => ({ inventoryId: r.inventoryId, quantity: r.quantity, reason: r.reason || undefined })),
      });
      addLog("database", `Experiment logged for project #${modalForm.projectId}`);
      setModal(null);
      fetchExperiments();
      fetchInventory();
    } catch (e: any) { setError(e.message); }
  };

  // ── Requirement rows helpers ─────────────────────────────────────────
  const addRequirementRow = () => {
    setRequirementRows((prev) => [...prev, { inventoryId: inventory[0]?.id || 0, requiredQuantity: 1 }]);
  };
  const updateRequirementRow = (index: number, field: keyof RequirementRow, value: number) => {
    setRequirementRows((prev) => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };
  const removeRequirementRow = (index: number) => {
    setRequirementRows((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Used resource rows helpers (experiment modal) ────────────────────
  const addUsedResourceRow = () => {
    setUsedResourceRows((prev) => [...prev, { inventoryId: inventory[0]?.id || 0, quantity: 1, reason: "" }]);
  };
  const updateUsedResourceRow = (index: number, field: keyof UsedResourceRow, value: number | string) => {
    setUsedResourceRows((prev) => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };
  const removeUsedResourceRow = (index: number) => {
    setUsedResourceRows((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Derived ──────────────────────────────────────────────────────────
  const lowStock = inventory.filter((i) => i.qty < i.min).length;
  const activeProj = projects.filter((p) => p.status === "ongoing").length;
  const filteredProjects = projects.filter((p) => {
    if (projPriority !== "all" && p.priority !== projPriority) return false;
    if (projStatus !== "all" && p.status !== projStatus) return false;
    if (projSearch.trim()) { const q = projSearch.toLowerCase(); if (!p.name.toLowerCase().includes(q) && !p.desc.toLowerCase().includes(q)) return false; }
    return true;
  });
  const invCategories = Array.from(new Set(inventory.map((i) => i.cat)));
  const filteredInventory = inventory.filter((i) => {
    if (invCat !== "all" && i.cat !== invCat) return false;
    if (invStock === "low" && !(i.qty < i.min && i.qty > 0)) return false;
    if (invStock === "out" && i.qty !== 0) return false;
    if (invStock === "ok" && i.qty < i.min) return false;
    if (invSearch.trim()) { const q = invSearch.toLowerCase(); if (!i.name.toLowerCase().includes(q)) return false; }
    return true;
  });
  const filteredTransactions = transactions.filter((tx) => {
    if (!txSearch.trim()) return true;
    const q = txSearch.toLowerCase();
    const invItem = inventory.find((i) => i.id === tx.inventoryId);
    return (invItem?.name.toLowerCase().includes(q)) || tx.reason?.toLowerCase().includes(q);
  });

  const navItems = [
    { key: "dashboard"    as Page, icon: "🏠", label: "Dashboard" },
    { key: "transactions" as Page, icon: "📊", label: "Transactions", badge: null },
    { key: "projects"     as Page, icon: "🧪", label: "Projects",   badge: activeProj || null },
    { key: "inventory"    as Page, icon: "📦", label: "Inventory",  badge: lowStock || null },
    { key: "experiments"  as Page, icon: "🔬", label: "Experiments", badge: null },
    { key: "logs"         as Page, icon: "📋", label: "Logs" },
  ];
  const agentKeys: AgentKey[] = ["research", "inventory", "database"];
  const handleNavClick = (key: Page) => { setPage(key); setSidebarOpen(false); };

  const RESULT_PREVIEW_LEN = 200;

  // ── RENDER ────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap');
        * { font-family: 'Quicksand', sans-serif; }
        @keyframes bubble-rise { 0% { transform:translateY(0) scale(0.5); opacity:0; } 10% { opacity:1; } 90% { opacity:0.3; } 100% { transform:translateY(-110vh) scale(1.3); opacity:0; } }
        .bubble-rise { animation: bubble-rise linear infinite; }
        @keyframes jelly-float { 0%,100% { transform:translateY(0) translateX(0) rotate(0deg); } 25% { transform:translateY(-20px) translateX(15px) rotate(5deg); } 50% { transform:translateY(-10px) translateX(-10px) rotate(-3deg); } 75% { transform:translateY(-30px) translateX(8px) rotate(4deg); } }
        @keyframes bubble-pop { 0%,100% { transform:translateY(0) scale(1); opacity:0.55; } 50% { transform:translateY(-8px) scale(1.16); opacity:1; } }
        .bubble-pop { animation: bubble-pop 2.8s ease-in-out infinite; }
        @keyframes flower-pop { 0%,100% { transform:rotate(0deg) scale(1); opacity:0.85; } 50% { transform:rotate(8deg) scale(1.08); opacity:1; } }
        .flower-pop { animation: flower-pop 4s ease-in-out infinite; }
        .sea-flower { position:absolute; font-size:76px; line-height:1; animation:flower-pop 7s ease-in-out infinite; }
        @keyframes sandy-float { 0%,100% { transform:translateY(0) rotate(-4deg); opacity:0.16; } 50% { transform:translateY(-18px) rotate(5deg); opacity:0.32; } }
        .sandy-float { position:absolute; font-size:42px; line-height:1; animation:sandy-float 8s ease-in-out infinite; }
        @keyframes lasso-loop { 0%,100% { transform:rotate(-8deg) scale(1); } 50% { transform:rotate(8deg) scale(1.04); } }
        .lasso-loop { animation: lasso-loop 5s ease-in-out infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; display:inline-block; }
        ::-webkit-scrollbar { width:6px; height:6px; }
        ::-webkit-scrollbar-thumb { background:rgba(126,200,227,0.6); border-radius:3px; }
        ::-webkit-scrollbar-track { background:transparent; }
      `}</style>

      <OceanBubbles />

      {/* ── MODALS ──────────────────────────────────────────────────────── */}
      {modal === "proj" && (
        <Modal title="🧪 New Research Project" onClose={() => setModal(null)} wide>
          <MField label="Project Name"><input className={inputCls} placeholder="Enter name..." value={modalForm.name} onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })} /></MField>
          <MField label="Description"><input className={inputCls} placeholder="Short description..." value={modalForm.desc} onChange={(e) => setModalForm({ ...modalForm, desc: e.target.value })} /></MField>
          <div className="grid grid-cols-2 gap-3">
            <MField label="Priority"><select className={selectCls} value={modalForm.priority} onChange={(e) => setModalForm({ ...modalForm, priority: e.target.value })}><option value="high">High</option><option value="med">Medium</option><option value="low">Low</option></select></MField>
            <MField label="Status"><select className={selectCls} value={modalForm.status} onChange={(e) => setModalForm({ ...modalForm, status: e.target.value })}><option value="planned">Planned</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option></select></MField>
          </div>

          {/* Requirements Section */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">📦 Required Inventory Items</label>
              <button
                onClick={addRequirementRow}
                className="text-[10px] font-black bg-sky-100 border-2 border-sky-200 text-sky-700 px-2.5 py-1 rounded-lg hover:bg-sky-200 transition-colors"
              >+ Add Item</button>
            </div>
            {requirementRows.length === 0 ? (
              <div className="text-center py-4 text-slate-300 text-[11px] border-2 border-dashed border-sky-200 rounded-xl">
                No requirements yet — tap "+ Add Item" to add inventory requirements
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {requirementRows.map((row, i) => {
                  const selectedItem = inventory.find((inv) => inv.id === row.inventoryId);
                  return (
                    <div key={i} className="flex items-center gap-2 bg-sky-50/60 border-2 border-sky-200/60 rounded-xl px-3 py-2">
                      <select
                        className="flex-1 bg-white border-2 border-sky-200 rounded-lg px-2 py-1.5 text-[12px] text-cyan-950 font-semibold outline-none cursor-pointer focus:border-teal-400"
                        value={row.inventoryId}
                        onChange={(e) => updateRequirementRow(i, "inventoryId", Number(e.target.value))}
                      >
                        {inventory.map((inv) => (
                          <option key={inv.id} value={inv.id}>{inv.name} ({inv.unit}) — stock: {inv.qty}</option>
                        ))}
                      </select>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <input
                          type="number"
                          min={1}
                          className="w-20 bg-white border-2 border-sky-200 rounded-lg px-2 py-1.5 text-[12px] text-cyan-950 font-semibold outline-none focus:border-teal-400 text-center"
                          value={row.requiredQuantity}
                          onChange={(e) => updateRequirementRow(i, "requiredQuantity", Number(e.target.value))}
                        />
                        <span className="text-[10px] text-slate-400 font-black">{selectedItem?.unit || "pcs"}</span>
                      </div>
                      <button onClick={() => removeRequirementRow(i)} className="text-[10px] font-black text-red-400 hover:text-red-600 px-1.5 py-1 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0">✕</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl bg-white border-2 border-sky-200 text-slate-400 text-sm font-black hover:bg-sky-50">Cancel</button>
            <button onClick={saveProj} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-300 to-teal-400 text-cyan-950 text-sm font-black hover:opacity-90">Create Project</button>
          </div>
        </Modal>
      )}

      {/* Project Detail Modal */}
      {modal === "projectDetail" && selectedProject && (
        <Modal title={`${selectedProject.icon} ${selectedProject.name}`} onClose={() => setModal(null)} wide>
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="bg-sky-50/60 border-2 border-sky-200/60 rounded-2xl p-4">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Project Info</div>
              <p className="text-[13px] text-slate-600 leading-relaxed mb-3">{selectedProject.desc || "No description provided."}</p>
              <div className="flex flex-wrap gap-2">
                <PriBadge priority={selectedProject.priority} />
                <StBadge status={selectedProject.status} />
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">ID #{selectedProject.id}</span>
              </div>
            </div>

            {/* Requirements */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="text-[13px] font-black text-cyan-950">📦 Inventory Requirements</div>
                {loadingRequirements && <Spinner />}
              </div>
              {loadingRequirements ? (
                <div className="text-center py-6 text-slate-400 text-[12px] bg-white/60 rounded-xl border-2 border-dashed border-sky-200">Loading requirements...</div>
              ) : selectedProjectRequirements.length === 0 ? (
                <div className="text-center py-6 text-slate-300 text-[12px] bg-white/60 rounded-xl border-2 border-dashed border-sky-200">No requirements defined for this project.</div>
              ) : (
                <div className="border-2 border-sky-200/60 bg-white/80 rounded-2xl overflow-hidden">
                  <table className="w-full text-[12px]">
                    <thead className="bg-sky-100/60">
                      <tr>
                        {["Item", "Required Qty", "In Stock", "Status"].map((h) => (
                          <th key={h} className="text-left px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-sky-200/50">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProjectRequirements.map((req) => {
                        const invItem = inventory.find((i) => i.id === req.inventoryId);
                        const hasEnough = invItem ? invItem.qty >= req.requiredQuantity : false;
                        return (
                          <tr key={req.id} className="border-b border-sky-100/60 last:border-0 hover:bg-sky-50/40 transition-colors">
                            <td className="px-3 py-2.5 font-black text-cyan-950">{invItem?.name || `Item #${req.inventoryId}`}</td>
                            <td className="px-3 py-2.5 text-slate-600 font-bold">{req.requiredQuantity} {invItem?.unit || "pcs"}</td>
                            <td className={`px-3 py-2.5 font-bold ${hasEnough ? "text-teal-600" : "text-red-500"}`}>{invItem?.qty ?? "?"} {invItem?.unit || "pcs"}</td>
                            <td className="px-3 py-2.5">
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${hasEnough ? "bg-teal-100 text-teal-700" : "bg-red-100 text-red-600"}`}>
                                {hasEnough ? "✅ Available" : "⚠️ Low Stock"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Related experiments */}
            <div>
              <div className="text-[13px] font-black text-cyan-950 mb-2">🔬 Experiments</div>
              {(() => {
                const projExps = experiments.filter((e) => e.projectId === selectedProject.id);
                if (projExps.length === 0) return <div className="text-center py-4 text-slate-300 text-[12px] bg-white/60 rounded-xl border-2 border-dashed border-sky-200">No experiments logged for this project.</div>;
                return (
                  <div className="flex flex-col gap-2">
                    {projExps.slice(0, 5).map((exp) => (
                      <div key={exp.id} className={`flex items-start gap-3 border-2 rounded-xl px-3 py-2.5 ${exp.success ? "border-teal-200 bg-teal-50/40" : "border-red-200 bg-red-50/30"}`}>
                        <span className="text-base">{exp.success ? "✅" : "❌"}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-bold text-cyan-950 truncate">{exp.result || "No result recorded"}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{new Date(exp.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</div>
                        </div>
                      </div>
                    ))}
                    {projExps.length > 5 && <div className="text-center text-[11px] text-slate-400 font-bold">+{projExps.length - 5} more experiments</div>}
                  </div>
                );
              })()}
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => cycleProjectStatus(selectedProject.id).then(() => setModal(null))} className="flex-1 py-2.5 rounded-xl bg-sky-100 border-2 border-sky-200 text-sky-700 text-sm font-black hover:bg-sky-200">
                Next Status →
              </button>
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-300 to-teal-400 text-cyan-950 text-sm font-black hover:opacity-90">
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {(modal === "inv" || modal === "editInv") && (
        <Modal title={modal === "editInv" ? "✏️ Edit Item" : "📦 Add Inventory Item"} onClose={() => setModal(null)}>
          <MField label="Item Name"><input className={inputCls} placeholder="Item name..." value={modalForm.name} onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })} /></MField>
          <div className="grid grid-cols-3 gap-2">
            <MField label="Qty"><input type="number" className={inputCls} value={modalForm.qty} onChange={(e) => setModalForm({ ...modalForm, qty: e.target.value })} /></MField>
            <MField label="Min"><input type="number" className={inputCls} value={modalForm.min} onChange={(e) => setModalForm({ ...modalForm, min: e.target.value })} /></MField>
            <MField label="Unit"><input className={inputCls} value={modalForm.unit} onChange={(e) => setModalForm({ ...modalForm, unit: e.target.value })} /></MField>
          </div>
          <MField label="Category"><select className={selectCls} value={modalForm.cat} onChange={(e) => setModalForm({ ...modalForm, cat: e.target.value })}>{["Lab","Bio","Marine","Chem","Equipment"].map((c) => <option key={c} value={c}>{c}</option>)}</select></MField>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl bg-white border-2 border-sky-200 text-slate-400 text-sm font-black hover:bg-sky-50">Cancel</button>
            <button onClick={modal === "editInv" ? saveEditInv : saveInv} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-300 to-teal-400 text-cyan-950 text-sm font-black hover:opacity-90">{modal === "editInv" ? "Save Changes" : "Add Item"}</button>
          </div>
        </Modal>
      )}

      {modal === "experiment" && (
        <Modal title="🔬 Log Experiment" onClose={() => setModal(null)} wide>
          <MField label="Project">
            <select className={selectCls} value={modalForm.projectId} onChange={(e) => setModalForm({ ...modalForm, projectId: e.target.value })}>
              <option value="">— No project —</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </MField>
          <MField label="Result"><textarea className={`${inputCls} resize-none`} rows={2} placeholder="What happened?" value={modalForm.result} onChange={(e) => setModalForm({ ...modalForm, result: e.target.value })} /></MField>
          <MField label="Notes"><textarea className={`${inputCls} resize-none`} rows={2} placeholder="Additional notes..." value={modalForm.notes} onChange={(e) => setModalForm({ ...modalForm, notes: e.target.value })} /></MField>
          <MField label="Success?">
            <select className={selectCls} value={String(modalForm.success)} onChange={(e) => setModalForm({ ...modalForm, success: e.target.value === "true" })}>
              <option value="true">✅ Success</option>
              <option value="false">❌ Failed</option>
            </select>
          </MField>

          {/* Used Resources Section */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">🧪 Resources Used</label>
              <button
                onClick={addUsedResourceRow}
                className="text-[10px] font-black bg-rose-100 border-2 border-rose-200 text-rose-700 px-2.5 py-1 rounded-lg hover:bg-rose-200 transition-colors"
              >+ Add Resource</button>
            </div>
            {usedResourceRows.length === 0 ? (
              <div className="text-center py-4 text-slate-300 text-[11px] border-2 border-dashed border-sky-200 rounded-xl">
                No resources used — tap "+ Add Resource" to log inventory consumption
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {usedResourceRows.map((row, i) => {
                  const selectedItem = inventory.find((inv) => inv.id === row.inventoryId);
                  return (
                    <div key={i} className="flex flex-col gap-1.5 bg-rose-50/50 border-2 border-rose-200/60 rounded-xl px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <select
                          className="flex-1 bg-white border-2 border-sky-200 rounded-lg px-2 py-1.5 text-[12px] text-cyan-950 font-semibold outline-none cursor-pointer focus:border-teal-400"
                          value={row.inventoryId}
                          onChange={(e) => updateUsedResourceRow(i, "inventoryId", Number(e.target.value))}
                        >
                          {inventory.map((inv) => (
                            <option key={inv.id} value={inv.id}>{inv.name} ({inv.unit}) — stock: {inv.qty}</option>
                          ))}
                        </select>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <input
                            type="number"
                            min={1}
                            className="w-20 bg-white border-2 border-sky-200 rounded-lg px-2 py-1.5 text-[12px] text-cyan-950 font-semibold outline-none focus:border-teal-400 text-center"
                            value={row.quantity}
                            onChange={(e) => updateUsedResourceRow(i, "quantity", Number(e.target.value))}
                          />
                          <span className="text-[10px] text-slate-400 font-black">{selectedItem?.unit || "pcs"}</span>
                        </div>
                        <button onClick={() => removeUsedResourceRow(i)} className="text-[10px] font-black text-red-400 hover:text-red-600 px-1.5 py-1 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0">✕</button>
                      </div>
                      <input
                        className="w-full bg-white border-2 border-sky-200 rounded-lg px-2 py-1.5 text-[12px] text-cyan-950 font-semibold outline-none focus:border-teal-400 placeholder:text-slate-300"
                        placeholder="Reason (optional, e.g. coral sample prep)..."
                        value={row.reason}
                        onChange={(e) => updateUsedResourceRow(i, "reason", e.target.value)}
                      />
                    </div>
                  );
                })}
                <div className="text-[10px] text-slate-400 font-bold px-1">
                  ⚠️ These quantities will be <span className="text-red-500">subtracted</span> from inventory and logged as transactions.
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl bg-white border-2 border-sky-200 text-slate-400 text-sm font-black hover:bg-sky-50">Cancel</button>
            <button onClick={saveExperiment} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-300 to-teal-400 text-cyan-950 text-sm font-black hover:opacity-90">Log Experiment</button>
          </div>
        </Modal>
      )}

      {/* ── LAYOUT ──────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex h-screen overflow-hidden">
        {sidebarOpen && <div className="fixed inset-0 z-30 bg-cyan-950/40 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* SIDEBAR */}
        <aside ref={sidebarRef} className={`fixed md:relative z-40 md:z-auto w-[210px] min-w-[210px] h-full bg-white/60 backdrop-blur-xl border-r-2 border-sky-200/50 flex flex-col shadow-lg transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
          <div className="px-4 py-5 border-b-2 border-sky-200/40 text-center" style={{ background: "linear-gradient(180deg,rgba(186,230,255,.35),transparent)" }}>
            <div className="text-3xl mb-1.5">🔬</div>
            <div className="text-[16px] font-black text-cyan-950 tracking-tight">Sandy's Lab</div>
            <div className="text-[10px] text-teal-500 mt-0.5">Bikini Bottom AI 🌊🫧</div>
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <span className={`w-2 h-2 rounded-full ${aiOnline===true?"bg-teal-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]":aiOnline===false?"bg-red-400":"bg-slate-300 animate-pulse"}`} />
              <span className="text-[9px] font-bold text-slate-400">{aiOnline===true?"AI Online":aiOnline===false?"AI Offline":"Checking..."}</span>
            </div>
          </div>
          <nav className="flex-1 px-2.5 py-3 overflow-y-auto">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-[1.5px] px-2 mb-2">Navigation</div>
            {navItems.map((n) => (
              <button key={n.key} onClick={() => handleNavClick(n.key)} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-black mb-1 transition-all border-2 ${page===n.key?"bg-sky-200/70 text-cyan-950 border-sky-300 shadow-md":"text-slate-500 border-transparent hover:bg-sky-100/50 hover:text-cyan-950"}`}>
                <span className="text-sm">{n.icon}</span>
                <span>{n.label}</span>
                {n.badge ? <span className="ml-auto bg-red-100 text-red-600 text-[9px] font-black px-1.5 py-0.5 rounded-full">{n.badge}</span> : null}
              </button>
            ))}
          </nav>
          <div className="px-3 py-3 border-t-2 border-sky-200/40">
            <div className="relative overflow-hidden flex items-center gap-2.5 border-2 border-sky-200/60 rounded-xl px-3 py-2.5" style={{ background: "linear-gradient(135deg,rgba(253,230,138,.5),rgba(186,230,255,.45),rgba(167,243,208,.4))" }}>
              <div className="absolute -right-3 -top-3 text-3xl opacity-20 lasso-loop">➰</div>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0 shadow-sm border-2 border-white/70" style={{ background: "linear-gradient(135deg,#fbbf24,#fde68a)" }}>🤠</div>
              <div><div className="text-[12px] font-black text-cyan-950">Sandy Cheeks</div><div className="text-[10px] text-slate-500">Texas Lab Director 🥜</div></div>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="flex-1 overflow-y-auto" style={{ background: "linear-gradient(180deg,rgba(186,230,255,.3),rgba(255,255,255,.1),rgba(45,106,159,.05))" }}>
          {/* Topbar */}
          <div className="sticky top-0 z-20 flex items-center gap-3 px-4 md:px-6 pt-4 pb-2 backdrop-blur-md" style={{ background: "linear-gradient(180deg,rgba(186,230,255,.85),rgba(186,230,255,.45),transparent)" }}>
            <button onClick={() => setSidebarOpen(true)} className="md:hidden flex-shrink-0 flex flex-col gap-1 w-9 h-9 items-center justify-center rounded-xl border-2 border-sky-200 bg-white/60 shadow-sm">
              <span className="w-4 h-0.5 bg-cyan-800 rounded" /><span className="w-4 h-0.5 bg-cyan-800 rounded" /><span className="w-4 h-0.5 bg-cyan-800 rounded" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="text-[18px] md:text-[20px] font-black text-cyan-950 truncate">
                {{ dashboard:"🏠 Sandy Command Center", transactions:"📊 Inventory Transactions", projects:"🧪 Research Projects", inventory:"📦 Lab Inventory", experiments:"🔬 Experiments Log", logs:"📋 System Logs" }[page]}
              </div>
              <div className="text-[11px] md:text-[12px] text-slate-500 mt-0.5 hidden sm:block">
                {{ dashboard:"Treedome AI Agentic Lab System 🌊", transactions:"Full history of stock movements & changes 📊", projects:"Sandy's Research Management", inventory:"Lab Materials CRUD Interface", experiments:"Experiments history & results", logs:"Agent Activity Log" }[page]}
              </div>
            </div>
            <div className="pointer-events-none hidden md:flex items-center gap-2 pr-1">
              {[0,1,2,3].map((i) => <span key={i} className="bubble-pop rounded-full border-2 border-white/70 bg-white/30 shadow-sm" style={{ width:`${10+i*4}px`, height:`${10+i*4}px`, animationDelay:`${i*0.35}s` }} />)}
              <span className="flower-pop text-3xl text-amber-400 drop-shadow-sm">✿</span>
              <span className="text-2xl drop-shadow-sm">🍍</span>
            </div>
          </div>

          <div className="px-4 md:px-6 pb-8 pt-3 md:pt-4">
            {/* Error Banner */}
            {error && <ErrorBanner msg={error} onClose={() => setError(null)} />}

            {/* ── DASHBOARD ─────────────────────────────────────────────────── */}
            {page === "dashboard" && (
              <>
                {/* Hero */}
                <div className="relative overflow-hidden rounded-2xl md:rounded-[28px] border-2 border-white/70 backdrop-blur-md p-4 md:p-5 mb-4 md:mb-5 shadow-md" style={{ background: "linear-gradient(135deg,rgba(253,230,138,.7),rgba(186,230,255,.6),rgba(167,243,208,.5))" }}>
                  <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full border-[18px] border-amber-300/25 lasso-loop" />
                  <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                      <div className="h-14 w-14 md:h-16 md:w-16 flex-shrink-0 rounded-full border-2 border-white/80 shadow-md flex items-center justify-center text-2xl md:text-3xl" style={{ background: "linear-gradient(135deg,#fbbf24,#fde68a,#bae1ff)" }}>🤠</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[17px] md:text-[22px] font-black text-cyan-950 tracking-tight">Howdy, partner. Sandy Mode is on.</div>
                        <div className="text-[11px] md:text-[12px] text-slate-500 mt-1 leading-relaxed">Treedome science, Texas grit, karate focus, and underwater AI all working together for Bikini Bottom.</div>
                        <div className="flex flex-wrap gap-1.5 md:gap-2 mt-2 md:mt-3">
                          {["🥜 Acorn fuel","🥋 Karate focus","🌳 Treedome ready","⭐ Texas smart","🫧 Bubble science"].map((tag) => <span key={tag} className="rounded-full border border-white/70 bg-white/55 px-2 md:px-2.5 py-1 text-[10px] font-black text-slate-500 shadow-sm">{tag}</span>)}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto sm:min-w-[170px]">
                      <button onClick={() => handleRun("Run a Sandy-style Treedome lab check: research, inventory, and database summary")} disabled={running} className="flex-1 sm:flex-none rounded-2xl border-2 border-white/70 bg-cyan-800 text-white px-3 md:px-4 py-2 md:py-2.5 text-[11px] md:text-[12px] font-black shadow-md hover:bg-cyan-900 transition-colors disabled:opacity-50">🤠 Treedome Check</button>
                      <button onClick={() => setPromptText("Sandy, plan a karate-focused safety review for today's underwater experiments")} className="flex-1 sm:flex-none rounded-2xl border-2 border-sky-200/60 bg-white/65 text-cyan-950 px-3 md:px-4 py-2 md:py-2.5 text-[11px] md:text-[12px] font-black shadow-sm hover:bg-white/90 transition-colors">🥋 Fill Sandy Prompt</button>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-5">
                  {[
                    { emoji:"🧪", label:"Active Projects", val: loadingProjects ? "…" : activeProj,           note:"↑ ongoing",                                          noteColor:"text-teal-500" },
                    { emoji:"🔬", label:"Experiments",     val: loadingExperiments ? "…" : experiments.length, note:"total logged",                                       noteColor:"text-slate-400" },
                    { emoji:"📦", label:"Low Stock",       val: loadingInventory ? "…" : lowStock,             note: lowStock>0?"↓ restock needed":"All stocked ✅",       noteColor: lowStock>0?"text-rose-400":"text-teal-500" },
                    { emoji:"🗄️", label:"DB Tables",       val:8,                                              note:"sandy_lab",                                          noteColor:"text-slate-400" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-2xl border-2 border-white/80 bg-white/60 backdrop-blur-md px-3 md:px-4 py-3 md:py-3.5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="text-lg mb-1">{s.emoji}</div>
                      <div className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">{s.label}</div>
                      <div className="text-xl md:text-[24px] font-black text-cyan-950">{s.val}</div>
                      <div className={`text-[10px] mt-1 font-bold ${s.noteColor}`}>{s.note}</div>
                    </div>
                  ))}
                </div>

                {/* Prompt */}
                <div className="rounded-2xl border-2 border-sky-200/70 bg-white/70 backdrop-blur-md p-4 md:p-5 mb-4 md:mb-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-3 md:mb-4">
                    <span className="text-xl">🌊</span>
                    <div>
                      <div className="text-[14px] md:text-[15px] font-black text-cyan-950">Lab Request Interface</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Sandy's Planner reads your prompt and routes to the right AI agents 🫧</div>
                    </div>
                    {aiOnline === false && <span className="ml-auto text-[10px] font-black bg-red-100 text-red-500 px-2.5 py-1 rounded-full border border-red-200">⚠️ AI Offline</span>}
                    {aiOnline === true  && <span className="ml-auto text-[10px] font-black bg-teal-100 text-teal-600 px-2.5 py-1 rounded-full border border-teal-200">🟢 AI Online</span>}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                    <textarea className="flex-1 bg-sky-50/60 border-2 border-sky-200/60 rounded-xl px-3 md:px-4 py-3 text-[13px] text-cyan-950 outline-none focus:border-teal-400 transition-colors resize-none leading-relaxed placeholder:text-slate-300" rows={3} placeholder="Give me your prompt... (Ctrl+Enter to run)" value={promptText} onChange={(e) => setPromptText(e.target.value)} onKeyDown={(e) => { if (e.key==="Enter" && e.ctrlKey) handleRun(); }} />
                    <button onClick={() => handleRun()} disabled={running || !promptText.trim()} className="bg-gradient-to-r from-teal-400 to-cyan-700 text-white font-black text-[13px] px-5 py-3 rounded-xl flex items-center gap-2 whitespace-nowrap hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed justify-center border-2 border-white/50 shadow-md">
                      {running ? <><span className="spin">🫧</span> Processing...</> : <>🚀 Run Lab AI</>}
                    </button>
                  </div>
                </div>

                {/* ── AI Result (moved right after prompt, no section between) ── */}
                {resultText && (
                  <div className="rounded-2xl border-2 border-teal-300/70 bg-teal-50/60 backdrop-blur p-4 md:p-5 mb-4 md:mb-5 shadow-sm">
                    <div className="flex items-center justify-between gap-2.5 mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">🏆</span>
                        <span className="text-[15px] font-black text-teal-700">AI System Result</span>
                      </div>
                      <button
                        onClick={() => setResultExpanded((v) => !v)}
                        className="text-[10px] font-black bg-teal-100 border border-teal-200 text-teal-700 px-3 py-1 rounded-full hover:bg-teal-200 transition-colors"
                      >
                        {resultExpanded ? "Show less ▲" : "Show more ▼"}
                      </button>
                    </div>
                    <div className={`overflow-hidden transition-all duration-300 ${resultExpanded ? "max-h-[800px]" : "max-h-[72px]"}`}>
                      <pre className="text-[13px] text-cyan-950/80 leading-relaxed whitespace-pre-wrap font-[Quicksand,sans-serif]">{resultText}</pre>
                    </div>
                    {!resultExpanded && resultText.length > RESULT_PREVIEW_LEN && (
                      <div className="mt-1 h-6 bg-gradient-to-t from-teal-50/80 to-transparent pointer-events-none -mb-1" />
                    )}
                  </div>
                )}

                {/* Quick actions + DB health */}
                <div className="grid grid-cols-1 md:grid-cols-[1.35fr_1fr] gap-3 md:gap-4 mb-4 md:mb-5">
                  <div className="rounded-2xl md:rounded-3xl border-2 border-sky-200/60 bg-white/70 backdrop-blur-md p-4 md:p-5 shadow-sm overflow-hidden relative">
                    <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-sky-200/40 blur-2xl" />
                    <div className="relative">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div><div className="text-[14px] md:text-[15px] font-black text-cyan-950">Sea Ops Quick Actions</div><div className="text-[11px] text-slate-400 mt-0.5">Fast controls for Sandy's most common lab flows.</div></div>
                        <span className="text-[10px] font-black rounded-full bg-teal-100 text-teal-600 px-2.5 py-1 border border-teal-200">Live</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 md:gap-2.5">
                        {[
                          { label:"Scan coral research", icon:"🪸", action: () => handleRun("Search for coral bleaching solutions and summarize practical lab ideas") },
                          { label:"Log experiment",      icon:"🔬", action: openExpModal },
                          { label:"Restock lows",        icon:"🥜", action: restockLowInventory },
                          { label:"View transactions",   icon:"📊", action: () => handleNavClick("transactions") },
                        ].map((a) => (
                          <button key={a.label} onClick={a.action} disabled={running && a.label==="Scan coral research"} className="group rounded-2xl border-2 border-sky-200/50 bg-sky-50/60 px-3 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-teal-400/60 hover:bg-white/70 disabled:opacity-50 disabled:hover:translate-y-0">
                            <div className="text-xl mb-1">{a.icon}</div>
                            <div className="text-[12px] font-black text-cyan-950">{a.label}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">Tap to run</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl md:rounded-3xl border-2 border-sky-200/60 bg-white/70 backdrop-blur-md p-4 md:p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div><div className="text-[14px] md:text-[15px] font-black text-cyan-950">Database Health</div><div className="text-[11px] text-slate-400">PostgreSQL sandy_lab schema</div></div>
                      <span className="h-3 w-3 rounded-full bg-teal-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                    </div>
                    <div className="space-y-2">
                      {[["projects", projects.length],["inventory", inventory.length],["experiments_log", experiments.length],["agent_tasks", aiTasks.length]].map(([table, count]) => (
                        <div key={String(table)} className="flex items-center justify-between rounded-xl bg-sky-50/60 border border-sky-200/50 px-3 py-2">
                          <span className="text-[11px] font-black text-cyan-950">{table}</span>
                          <span className="text-[10px] font-black text-slate-400">{loadingProjects||loadingInventory?"…":count} rows</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="text-[14px] md:text-[15px] font-black text-cyan-950 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-400 border-2 border-white shadow-sm" />Agent Status
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {agentKeys.map((k) => <AgentCard key={k} agentKey={k} agent={agents[k]} />)}
                </div>
              </>
            )}

            {/* ── INVENTORY TRANSACTIONS ────────────────────────────────────── */}
            {page === "transactions" && (
              <>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div className="text-[14px] md:text-[15px] font-black text-cyan-950 flex items-center gap-2 flex-wrap">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400 border-2 border-white shadow-sm" />Inventory Transactions
                    <span className="text-[10px] font-bold text-slate-400">({filteredTransactions.length} of {transactions.length})</span>
                    {loadingTransactions && <Spinner />}
                  </div>
                  <button onClick={fetchTransactions} className="bg-white border-2 border-sky-200 rounded-xl px-3 py-1.5 text-slate-500 text-[12px] font-black hover:bg-sky-50">↻ Refresh</button>
                </div>

                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-2 md:gap-3 mb-4">
                  {[
                    { label: "Total Movements", val: transactions.length, icon: "📊", color: "text-cyan-950" },
                    { label: "Additions", val: transactions.filter((t) => t.changeAmount > 0).length, icon: "📈", color: "text-teal-600" },
                    { label: "Deductions", val: transactions.filter((t) => t.changeAmount < 0).length, icon: "📉", color: "text-red-500" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-2xl border-2 border-white/80 bg-white/60 backdrop-blur-md px-3 py-3 shadow-sm">
                      <div className="text-base mb-1">{s.icon}</div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">{s.label}</div>
                      <div className={`text-xl font-black ${s.color}`}>{loadingTransactions ? "…" : s.val}</div>
                    </div>
                  ))}
                </div>

                {/* Search */}
                <div className="bg-white/60 backdrop-blur-md border-2 border-sky-200/60 rounded-2xl p-3 mb-4 flex flex-wrap gap-2 items-center shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">🔎 Search:</span>
                  <input
                    placeholder="Search by item name or reason..."
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                    className="flex-1 min-w-[180px] bg-sky-50/60 border-2 border-sky-200/60 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-cyan-950 outline-none focus:border-teal-400 placeholder:text-slate-300"
                  />
                  {txSearch && <button onClick={() => setTxSearch("")} className="bg-white border-2 border-sky-200 rounded-lg px-2.5 py-1.5 text-[11px] font-black text-slate-400 hover:bg-sky-50">✕ Clear</button>}
                </div>

                {loadingTransactions && transactions.length === 0 ? (
                  <div className="text-center py-14 text-slate-400 text-sm font-bold bg-white/50 rounded-2xl border-2 border-dashed border-sky-200 flex items-center justify-center gap-2"><Spinner /> Loading transactions...</div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-14 text-slate-400 text-sm font-bold bg-white/50 rounded-2xl border-2 border-dashed border-sky-200">📊 No transactions recorded yet — add some inventory movements 🫧</div>
                ) : (
                  <div className="border-2 border-sky-200/60 bg-white/80 backdrop-blur-md rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
                    <table className="w-full text-[12px] border-collapse min-w-[560px]">
                      <thead className="bg-sky-100/60">
                        <tr>
                          {["#", "Item", "Change", "Reason", "Experiment", "Date"].map((h) => (
                            <th key={h} className="text-left px-3 md:px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b-2 border-sky-200/50">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map((tx) => {
                          const invItem = inventory.find((i) => i.id === tx.inventoryId);
                          const isPositive = tx.changeAmount > 0;
                          return (
                            <tr key={tx.id} className="border-b border-sky-100/60 last:border-0 hover:bg-sky-50/40 transition-colors">
                              <td className="px-3 md:px-4 py-2.5 text-slate-300 font-bold">#{tx.id}</td>
                              <td className="px-3 md:px-4 py-2.5 font-black text-cyan-950">{invItem?.name || `Item #${tx.inventoryId}`}
                                {invItem && <span className="ml-1.5 text-[9px] bg-sky-100 text-sky-600 px-1.5 py-0.5 rounded-full font-black">{invItem.unit}</span>}
                              </td>
                              <td className="px-3 md:px-4 py-2.5">
                                <span className={`font-black text-[13px] ${isPositive ? "text-teal-600" : "text-red-500"}`}>
                                  {isPositive ? "+" : ""}{tx.changeAmount}
                                </span>
                              </td>
                              <td className="px-3 md:px-4 py-2.5 text-slate-500 max-w-[160px] truncate">{tx.reason || <span className="text-slate-300 italic">—</span>}</td>
                              <td className="px-3 md:px-4 py-2.5">
                                {tx.experimentId
                                  ? <span className="text-[9px] font-black bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full">Exp #{tx.experimentId}</span>
                                  : <span className="text-slate-300">—</span>}
                              </td>
                              <td className="px-3 md:px-4 py-2.5 text-slate-400 text-[11px] whitespace-nowrap">
                                {new Date(tx.createdAt).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* ── PROJECTS ──────────────────────────────────────────────────── */}
            {page === "projects" && (
              <>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div className="text-[14px] md:text-[15px] font-black text-cyan-950 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-400 border-2 border-white shadow-sm" />Research Projects
                    <span className="text-[10px] font-bold text-slate-400">({filteredProjects.length} of {projects.length})</span>
                    {loadingProjects && <Spinner />}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={fetchProjects} className="bg-white border-2 border-sky-200 rounded-xl px-3 py-1.5 text-slate-500 text-[12px] font-black hover:bg-sky-50">↻ Refresh</button>
                    <button onClick={openProjModal} className="bg-gradient-to-r from-sky-300 to-teal-400 border-2 border-white/50 rounded-xl px-3.5 py-1.5 text-cyan-950 text-[12px] font-black hover:opacity-90 shadow-md">+ New Project</button>
                  </div>
                </div>
                <div className="bg-white/60 backdrop-blur-md border-2 border-sky-200/60 rounded-2xl p-3 mb-4 flex flex-wrap gap-2 items-center shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">🔎 Filters:</span>
                  <input placeholder="Search projects..." value={projSearch} onChange={(e) => setProjSearch(e.target.value)} className="flex-1 min-w-[140px] bg-sky-50/60 border-2 border-sky-200/60 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-cyan-950 outline-none focus:border-teal-400 placeholder:text-slate-300" />
                  <select value={projPriority} onChange={(e) => setProjPriority(e.target.value as any)} className="bg-red-50 border-2 border-red-200 rounded-lg px-2.5 py-1.5 text-[12px] font-black text-red-600 outline-none cursor-pointer"><option value="all">All priorities</option><option value="high">High</option><option value="med">Medium</option><option value="low">Low</option></select>
                  <select value={projStatus} onChange={(e) => setProjStatus(e.target.value as any)} className="bg-sky-50 border-2 border-sky-200 rounded-lg px-2.5 py-1.5 text-[12px] font-black text-sky-700 outline-none cursor-pointer"><option value="all">All statuses</option><option value="planned">Planned</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option></select>
                  {(projSearch || projPriority!=="all" || projStatus!=="all") && <button onClick={() => { setProjSearch(""); setProjPriority("all"); setProjStatus("all"); }} className="bg-white border-2 border-sky-200 rounded-lg px-2.5 py-1.5 text-[11px] font-black text-slate-400 hover:bg-sky-50">✕ Reset</button>}
                </div>
                <div className="flex flex-col gap-2 md:gap-2.5">
                  {loadingProjects && projects.length === 0 ? (
                    <div className="text-center py-14 text-slate-400 text-sm font-bold bg-white/50 rounded-2xl border-2 border-dashed border-sky-200 flex items-center justify-center gap-2"><Spinner /> Loading projects...</div>
                  ) : filteredProjects.length === 0 ? (
                    <div className="text-center py-14 text-slate-400 text-sm font-bold bg-white/50 rounded-2xl border-2 border-dashed border-sky-200">🔍 No projects match your filters 🫧</div>
                  ) : filteredProjects.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 md:gap-3 border-2 border-sky-200/50 bg-white/80 backdrop-blur-md rounded-2xl px-3 md:px-4 py-3 md:py-3.5 hover:border-teal-400/60 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => openProjectDetail(p)}
                    >
                      <div className="w-9 h-9 md:w-10 md:h-10 flex-shrink-0 rounded-xl flex items-center justify-center text-lg border border-sky-200/50" style={{ background: "linear-gradient(135deg,rgba(186,230,255,.5),rgba(167,243,208,.5))" }}>{p.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-black text-cyan-950 truncate">{p.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 hidden sm:block truncate">{p.desc}</div>
                      </div>
                      <PriBadge priority={p.priority} /><StBadge status={p.status} />
                      <div className="flex gap-1 md:gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => cycleProjectStatus(p.id)} className="text-[10px] font-black bg-sky-100 border-2 border-teal-300/50 text-cyan-950 px-2 py-1 rounded-lg hover:bg-sky-200 transition-colors">Next</button>
                        <button onClick={() => deleteProject(p.id)} className="text-[10px] font-black bg-red-100 border-2 border-red-200 text-red-600 px-2 py-1 rounded-lg hover:bg-red-200 transition-colors">Del</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── INVENTORY ─────────────────────────────────────────────────── */}
            {page === "inventory" && (
              <>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div className="text-[14px] md:text-[15px] font-black text-cyan-950 flex items-center gap-2 flex-wrap">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-300 border-2 border-white shadow-sm" />Lab Materials
                    <span className="text-[10px] font-bold text-slate-400">({filteredInventory.length} of {inventory.length})</span>
                    {loadingInventory && <Spinner />}
                    {lowStock > 0 && <span className="text-[10px] font-black bg-red-100 text-red-500 px-2 py-0.5 rounded-full">⚠️ {lowStock} low stock</span>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={fetchInventory} className="bg-white border-2 border-sky-200 rounded-xl px-3 py-1.5 text-slate-500 text-[12px] font-black hover:bg-sky-50">↻ Refresh</button>
                    <button onClick={restockLowInventory} className="bg-teal-100 border-2 border-teal-200 rounded-xl px-3 md:px-3.5 py-1.5 text-teal-700 text-[12px] font-black hover:opacity-90 shadow-md">Auto Restock</button>
                    <button onClick={openInvModal} className="bg-gradient-to-r from-sky-300 to-teal-400 border-2 border-white/50 rounded-xl px-3 md:px-3.5 py-1.5 text-cyan-950 text-[12px] font-black hover:opacity-90 shadow-md">+ Add Item</button>
                  </div>
                </div>
                <div className="bg-white/60 backdrop-blur-md border-2 border-sky-200/60 rounded-2xl p-3 mb-4 flex flex-wrap gap-2 items-center shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">🔎 Filters:</span>
                  <input placeholder="Search materials..." value={invSearch} onChange={(e) => setInvSearch(e.target.value)} className="flex-1 min-w-[140px] bg-sky-50/60 border-2 border-sky-200/60 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-cyan-950 outline-none focus:border-teal-400 placeholder:text-slate-300" />
                  <select value={invCat} onChange={(e) => setInvCat(e.target.value)} className="bg-red-50 border-2 border-red-200 rounded-lg px-2.5 py-1.5 text-[12px] font-black text-red-600 outline-none cursor-pointer"><option value="all">All categories</option>{invCategories.map((c) => <option key={c} value={c}>{c}</option>)}</select>
                  <select value={invStock} onChange={(e) => setInvStock(e.target.value as any)} className="bg-amber-50 border-2 border-amber-200 rounded-lg px-2.5 py-1.5 text-[12px] font-black text-amber-600 outline-none cursor-pointer"><option value="all">All stock</option><option value="ok">✅ OK</option><option value="low">⚠️ Low</option><option value="out">❌ Out</option></select>
                  {(invSearch || invCat!=="all" || invStock!=="all") && <button onClick={() => { setInvSearch(""); setInvCat("all"); setInvStock("all"); }} className="bg-white border-2 border-sky-200 rounded-lg px-2.5 py-1.5 text-[11px] font-black text-slate-400 hover:bg-sky-50">✕ Reset</button>}
                </div>
                <div className="border-2 border-sky-200/60 bg-white/80 backdrop-blur-md rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
                  <table className="w-full text-[12px] border-collapse min-w-[540px]">
                    <thead className="bg-sky-100/60">
                      <tr>{["Item","Category","Qty","Min","Unit","Status","Actions"].map((h) => <th key={h} className="text-left px-3 md:px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b-2 border-sky-200/50">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {loadingInventory && inventory.length===0 ? (
                        <tr><td colSpan={7} className="text-center py-10 text-slate-400 font-bold"><Spinner /></td></tr>
                      ) : filteredInventory.length===0 ? (
                        <tr><td colSpan={7} className="text-center py-10 text-slate-400 font-bold">🔍 No items match your filters 🫧</td></tr>
                      ) : filteredInventory.map((item) => {
                        const low = item.qty < item.min;
                        return (
                          <tr key={item.id} className="border-b border-sky-100/60 last:border-0 hover:bg-sky-50/40 transition-colors">
                            <td className="px-3 md:px-4 py-2.5 font-black text-cyan-950">{item.name}{item.qty===0 && <span className="ml-1.5 text-[9px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full">OUT</span>}</td>
                            <td className="px-3 md:px-4 py-2.5"><span className="text-[9px] font-black bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">{item.cat}</span></td>
                            <td className={`px-3 md:px-4 py-2.5 font-black ${low?"text-red-500":"text-teal-600"}`}>{item.qty}</td>
                            <td className="px-3 md:px-4 py-2.5 text-slate-400">{item.min}</td>
                            <td className="px-3 md:px-4 py-2.5 text-slate-400">{item.unit}</td>
                            <td className="px-3 md:px-4 py-2.5"><span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${low?"bg-red-100 text-red-500":"bg-teal-100 text-teal-600"}`}>{low?"Low Stock":"OK"}</span></td>
                            <td className="px-3 md:px-4 py-2.5">
                              <div className="flex gap-1 md:gap-1.5">
                                <button onClick={() => openEditInv(item)} className="text-[10px] font-black bg-sky-100 border-2 border-teal-300/50 text-cyan-950 px-2 py-1 rounded-lg hover:bg-sky-200 transition-colors">Edit</button>
                                {low && <button onClick={() => restockInv(item.id)} className="text-[10px] font-black bg-teal-100 border-2 border-teal-200 text-teal-700 px-2 py-1 rounded-lg hover:bg-teal-200 transition-colors">Restock</button>}
                                <button onClick={() => deleteInv(item.id)} className="text-[10px] font-black bg-red-100 border-2 border-red-200 text-red-500 px-2 py-1 rounded-lg hover:bg-red-200 transition-colors">Del</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── EXPERIMENTS ───────────────────────────────────────────────── */}
            {page === "experiments" && (
              <>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div className="text-[14px] md:text-[15px] font-black text-cyan-950 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400 border-2 border-white shadow-sm" />Experiments Log
                    <span className="text-[10px] font-bold text-slate-400">({experiments.length} entries)</span>
                    {loadingExperiments && <Spinner />}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={fetchExperiments} className="bg-white border-2 border-sky-200 rounded-xl px-3 py-1.5 text-slate-500 text-[12px] font-black hover:bg-sky-50">↻ Refresh</button>
                    <button onClick={openExpModal} className="bg-gradient-to-r from-sky-300 to-teal-400 border-2 border-white/50 rounded-xl px-3.5 py-1.5 text-cyan-950 text-[12px] font-black hover:opacity-90 shadow-md">+ Log Experiment</button>
                  </div>
                </div>
                {loadingExperiments && experiments.length === 0 ? (
                  <div className="text-center py-14 text-slate-400 text-sm font-bold bg-white/50 rounded-2xl border-2 border-dashed border-sky-200 flex items-center justify-center gap-2"><Spinner /> Loading experiments...</div>
                ) : experiments.length === 0 ? (
                  <div className="text-center py-14 text-slate-400 text-sm font-bold bg-white/50 rounded-2xl border-2 border-dashed border-sky-200">🔬 No experiments logged yet — Sandy's working on it! 🫧</div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {[...experiments].reverse().map((exp) => {
                      const proj = projects.find((p) => p.id === exp.projectId);
                      return (
                        <div key={exp.id} className={`border-2 bg-white/80 backdrop-blur-md rounded-2xl px-4 py-4 hover:shadow-md transition-all ${exp.success ? "border-teal-300/60" : "border-red-200/60"}`}>
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border-2 ${exp.success ? "bg-teal-50 border-teal-200" : "bg-red-50 border-red-200"}`}>{exp.success ? "✅" : "❌"}</div>
                              <div>
                                <div className="text-[13px] font-black text-cyan-950">{proj ? proj.name : `Project #${exp.projectId}`}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">{new Date(exp.createdAt).toLocaleString("fr-FR", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })}</div>
                              </div>
                            </div>
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${exp.success ? "bg-teal-100 text-teal-700 border-teal-200" : "bg-red-100 text-red-600 border-red-200"}`}>{exp.success ? "Success" : "Failed"}</span>
                          </div>
                          {exp.result && <p className="text-[12px] text-slate-600 mt-3 leading-relaxed"><span className="font-black text-cyan-950">Result: </span>{exp.result}</p>}
                          {exp.notes && <p className="text-[12px] text-slate-500 mt-1 leading-relaxed"><span className="font-black text-cyan-950">Notes: </span>{exp.notes}</p>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* ── LOGS ──────────────────────────────────────────────────────── */}
            {page === "logs" && (
              <>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div className="text-[14px] md:text-[15px] font-black text-cyan-950 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-400 border-2 border-white shadow-sm" />Agent Activity Log
                    {loadingLogs && <Spinner />}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { fetchLogs(); fetchTasks(); }} className="bg-white border-2 border-sky-200 rounded-xl px-3 py-1.5 text-slate-500 text-[12px] font-black hover:bg-sky-50">↻ Refresh</button>
                    <button onClick={() => setLogs(INIT_LOGS)} className="bg-gradient-to-r from-sky-300 to-teal-400 border-2 border-white/50 rounded-xl px-3.5 py-1.5 text-cyan-950 text-[12px] font-black hover:opacity-90 shadow-md">Reset</button>
                  </div>
                </div>

                {aiTasks.length > 0 && (
                  <div className="border-2 border-sky-200/60 bg-white/70 backdrop-blur-md rounded-2xl p-4 mb-4 shadow-sm">
                    <div className="text-[13px] font-black text-cyan-950 mb-3 flex items-center gap-2">🗄️ Agent Tasks (DB) <span className="text-[10px] font-bold text-slate-400">agent_tasks table</span></div>
                    <div className="flex flex-col gap-2">
                      {aiTasks.slice(0,10).map((t) => (
                        <div key={t.id} className="flex items-center gap-3 bg-sky-50/60 border border-sky-200/50 rounded-xl px-3 py-2">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${t.status==="completed"?"bg-teal-100 text-teal-700":t.status==="failed"?"bg-red-100 text-red-600":t.status==="running"?"bg-amber-100 text-amber-700 animate-pulse":"bg-slate-100 text-slate-500"}`}>{t.status}</span>
                          <span className="text-[11px] text-slate-600 flex-1 truncate">{t.task}</span>
                          <span className="text-[9px] text-slate-300">{new Date(t.created_at).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-2 border-sky-200/60 bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-sm">
                  <div className="flex flex-col">
                    {[...logs].reverse().map((l) => (
                      <div key={l.id} className="flex items-start gap-3 py-2.5 border-b border-sky-100/60 last:border-0">
                        <LogDot agent={l.agent} />
                        <div className="flex-1 min-w-0"><AgentText agent={l.agent} /><span className="text-[11px] text-slate-500">{l.text}</span></div>
                        <span className="text-[9px] text-slate-300 flex-shrink-0 mt-0.5">{l.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}