import { useState, useCallback, useEffect, useRef } from "react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Priority = "high" | "med" | "low";
type ProjectStatus = "planned" | "ongoing" | "completed";
type AgentKey = "research" | "inventory" | "database";
type AgentStatus = "idle" | "running" | "done" | "skipped";
type Page = "dashboard" | "experience" | "projects" | "inventory" | "logs";
type ModalType = "proj" | "inv" | "editInv" | "exp" | "editExp" | null;

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

interface Experience {
  id: number;
  title: string;
  role: string;
  period: string;
  desc: string;
  icon: string;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const INIT_PROJECTS: Project[] = [
  { id: 1, name: "Bikini Bottom Coral Study", desc: "Tracking coral reef health changes", priority: "high", status: "ongoing", icon: "🪸" },
  { id: 2, name: "Krabby Patty Formula Analysis", desc: "Chemical composition research", priority: "high", status: "planned", icon: "🍔" },
  { id: 3, name: "Jellyfish Migration Patterns", desc: "Seasonal movement data collection", priority: "med", status: "completed", icon: "🪼" },
  { id: 4, name: "Sandy Water Pressure Study", desc: "Deep sea pressure experiments", priority: "low", status: "ongoing", icon: "💧" },
  { id: 5, name: "Texas Coral Transplant", desc: "Adaptation study in new environment", priority: "med", status: "planned", icon: "🌿" },
];

const INIT_INVENTORY: InvItem[] = [
  { id: 1, name: "Algae Extract", qty: 3, min: 5, cat: "Bio", unit: "vials" },
  { id: 2, name: "Coral Samples", qty: 24, min: 10, cat: "Marine", unit: "pcs" },
  { id: 3, name: "Microscope Slides", qty: 8, min: 20, cat: "Lab", unit: "boxes" },
  { id: 4, name: "pH Test Strips", qty: 150, min: 50, cat: "Chem", unit: "strips" },
  { id: 5, name: "Saltwater Solution", qty: 2, min: 5, cat: "Chem", unit: "liters" },
  { id: 6, name: "Petri Dishes", qty: 60, min: 30, cat: "Lab", unit: "pcs" },
  { id: 7, name: "Kelp Powder", qty: 0, min: 3, cat: "Bio", unit: "kg" },
  { id: 8, name: "UV Light Bulbs", qty: 12, min: 4, cat: "Equipment", unit: "pcs" },
];

const INIT_LOGS: LogEntry[] = [
  { id: 1, agent: "system", text: "Sandy's Lab AI initialized — Treedome mode active 🌊", time: "09:00" },
  { id: 2, agent: "planner", text: "Planner ready — waiting for task prompt", time: "09:01" },
  { id: 3, agent: "research", text: "Research Agent connected to web search module", time: "09:01" },
  { id: 4, agent: "inventory", text: "Inventory Agent loaded 8 items", time: "09:02" },
  { id: 5, agent: "database", text: "Database Agent CRUD interface ready — sandy_lab connected", time: "09:02" },
];

const INIT_EXPERIENCE: Experience[] = [
  { id: 1, title: "Treedome Marine Lab", role: "Lead Scientist & Founder", period: "2018 – Present", desc: "Founded and run an underwater air-dome lab in Bikini Bottom studying marine biology, kelp ecosystems, and coral reef dynamics.", icon: "🌳" },
  { id: 2, title: "Texas A&M University", role: "Graduate Researcher — Marine Biology", period: "2014 – 2018", desc: "Specialized in deep-sea pressure adaptations, karate-based stress relief studies, and robotic ocean exploration.", icon: "🤠" },
  { id: 3, title: "Krusty Krab", role: "Food Science Advisor", period: "2016 – 2020", desc: "Consulted on Krabby Patty nutritional composition, seaweed-based ingredient analysis, and quality control.", icon: "🍔" },
  { id: 4, title: "Bikini Bottom Karate Club", role: "Head Instructor", period: "2015 – Present", desc: "Teaching karate to local marine life — promoting balance, focus, and discipline through the art of underwater martial arts.", icon: "🥋" },
  { id: 5, title: "SpongeBob & Patrick Research", role: "Co-Principal Investigator", period: "2019 – 2023", desc: "Joint research with SpongeBob SquarePants on jellyfishing behavioral patterns and bubble-blowing fluid dynamics.", icon: "🫧" },
];

const AGENT_SEQUENCES: Record<AgentKey, string[]> = {
  research: [
    "🔬 Initiating oceanic web search protocol...",
    "📡 Querying Bikini Bottom knowledge base...",
    "🪸 Found 5 relevant marine science sources",
    "🧪 Synthesizing research results...",
    "Research report complete ✓",
  ],
  inventory: [
    "📦 Scanning Treedome inventory database...",
    "🔍 Checking stock levels for all materials...",
    "⚠️ Low stock detected: Algae Extract, Saltwater Solution",
    "📋 Generating restocking recommendations...",
    "Inventory report ready ✓",
  ],
  database: [
    "🗄️ Connecting to sandy_lab PostgreSQL...",
    "✅ Running CRUD validation on all tables...",
    "📝 Logging task metadata to ai_actions_log...",
    "💾 Updating experiment records & agent_tasks...",
    "Database sync complete — 8 tables nominal ✓",
  ],
};

// ─── PLANNER LOGIC ────────────────────────────────────────────────────────────

function planAgents(prompt: string): AgentKey[] {
  const p = prompt.toLowerCase();
  const chosen: AgentKey[] = [];
  if (/search|find|research|study|experiment|idea|analys|discover|look.?up|jellyfish|coral|krabby|formula|species|data/i.test(p))
    chosen.push("research");
  if (/stock|inventory|material|supply|supplies|chemical|reagent|need|have enough|check|order|restock|item|qty|quantity/i.test(p))
    chosen.push("inventory");
  if (/save|log|record|update|add|create|delete|remove|store|crud|database|register|write|note|track/i.test(p))
    chosen.push("database");
  return chosen.length === 0 ? ["research", "inventory", "database"] : chosen;
}

function buildResult(activeAgents: AgentKey[]): string {
  const parts = ["✅ Sandy's AI system completed your task!"];
  if (activeAgents.includes("research"))
    parts.push("🔍 Research Agent found 5 sources and synthesized relevant experiment data.");
  if (activeAgents.includes("inventory"))
    parts.push("📦 Inventory Agent flagged 2 low-stock items: Algae Extract & Saltwater Solution. Restocking recommended!");
  if (activeAgents.includes("database"))
    parts.push("🗄️ Database Agent synced with sandy_lab — logged metadata and updated experiment records.");
  return parts.join(" ");
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function nowTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function sleep(ms: number) { return new Promise<void>((r) => setTimeout(r, ms)); }

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function OceanBubbles() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" style={{ background: "linear-gradient(180deg, #bae1ff 0%, #7ec8e3 30%, #2d6a9f 70%, #1a3a5c 100%)" }}>
      <div className="absolute inset-0 opacity-[0.08]" style={{
        background: `repeating-linear-gradient(45deg, transparent, transparent 30px, rgba(255,255,255,0.1) 30px, rgba(255,255,255,0.1) 60px),
                     repeating-linear-gradient(-45deg, transparent, transparent 40px, rgba(255,255,255,0.06) 40px, rgba(255,255,255,0.06) 80px)`
      }} />
      <div className="absolute text-3xl opacity-20" style={{ top: "10%", left: "5%", animation: "jelly-float 14s ease-in-out infinite" }}>🪼</div>
      <div className="absolute text-2xl opacity-15" style={{ top: "30%", right: "8%", animation: "jelly-float 18s ease-in-out infinite reverse" }}>🪼</div>
      <div className="absolute text-xl opacity-10" style={{ top: "60%", left: "15%", animation: "jelly-float 20s ease-in-out infinite 3s" }}>🪼</div>
      <div className="sea-flower" style={{ top: "12%", right: "18%", animationDelay: "0s", color: "rgba(248,231,28,0.3)" }}>✿</div>
      <div className="sea-flower" style={{ top: "46%", left: "8%", animationDelay: "1.4s", color: "rgba(255,182,193,0.3)" }}>✿</div>
      <div className="sea-flower" style={{ bottom: "16%", right: "10%", animationDelay: "2.6s", color: "rgba(72,201,176,0.3)" }}>✿</div>
      <div className="sandy-float" style={{ top: "18%", left: "18%", animationDelay: "0.4s" }}>🤠</div>
      <div className="sandy-float" style={{ top: "68%", right: "18%", animationDelay: "1.8s" }}>🥜</div>
      <div className="sandy-float" style={{ top: "76%", left: "7%", animationDelay: "2.8s" }}>🥋</div>
      <div className="sandy-float" style={{ top: "8%", right: "6%", animationDelay: "3.5s" }}>⭐</div>
      {Array.from({ length: 34 }, (_, i) => (
        <div
          key={i}
          className="absolute rounded-full bubble-rise"
          style={{
            width: `${6 + ((i * 5) % 18)}px`,
            height: `${6 + ((i * 5) % 18)}px`,
            left: `${(i * 5.1) % 100}%`,
            bottom: -20,
            background: i % 3 === 0 ? "rgba(255,255,255,0.35)" : i % 3 === 1 ? "rgba(173,216,230,0.4)" : "rgba(255,215,0,0.2)",
            border: i % 4 === 0 ? "1px solid rgba(255,255,255,0.25)" : "none",
            animationDuration: `${10 + (i % 7) * 2.5}s`,
            animationDelay: `${(i * 0.9) % 12}s`,
          }}
        />
      ))}
      <div className="absolute bottom-0 left-0 right-0 h-12 opacity-30" style={{ background: "linear-gradient(0deg, #48c9b0 0%, transparent 100%)" }} />
    </div>
  );
}

function StatusBadge({ status }: { status: AgentStatus }) {
  const map = {
    idle:    { label: "Idle",    bg: "bg-sky-100/70",    text: "text-sky-700",   dot: "bg-teal-400" },
    running: { label: "Running", bg: "bg-amber-100/70",  text: "text-amber-700", dot: "bg-amber-400 animate-pulse" },
    done:    { label: "Done",    bg: "bg-teal-100/70",   text: "text-teal-700",  dot: "bg-teal-500" },
    skipped: { label: "Skipped", bg: "bg-slate-100",     text: "text-slate-400", dot: "bg-slate-300" },
  };
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function AgentCard({ agentKey, agent }: { agentKey: AgentKey; agent: Agent }) {
  const defs = {
    research:  { emoji: "🔍", name: "Research Agent",  type: "Web Search & Experiment Ideas",  accent: "border-sky-300 bg-sky-100/60" },
    inventory: { emoji: "📦", name: "Inventory Agent", type: "Stock Tracking & Alerts",        accent: "border-amber-300 bg-amber-100/50" },
    database:  { emoji: "🗄️", name: "Database Agent",  type: "PostgreSQL CRUD — sandy_lab",    accent: "border-rose-300 bg-rose-100/40" },
  };
  const d = defs[agentKey];
  const borderCls =
    agent.status === "running" ? "border-amber-300 shadow-lg shadow-amber-100/50"
    : agent.status === "done"  ? "border-teal-300/60 shadow-sm shadow-teal-100/30"
    : agent.status === "skipped" ? "border-slate-200/60 opacity-50"
    : "border-sky-200/60";

  return (
    <div className={`rounded-2xl border-2 bg-white/85 backdrop-blur-md p-4 transition-all duration-300 ${borderCls}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border-2 ${d.accent}`}>
            {d.emoji}
          </div>
          <div>
            <div className="text-sm font-black text-cyan-950">{d.name}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{d.type}</div>
          </div>
        </div>
        <StatusBadge status={agent.status} />
      </div>
      <hr className="border-sky-200/50 mb-3" />
      <div className="mb-1">
        <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Last Action</div>
        <div className="text-[11px] text-slate-600">{agent.action || "—"}</div>
      </div>
      <div className="mt-2 rounded-lg bg-sky-50/60 border border-sky-200/50 p-2.5 text-[11px] text-slate-600 leading-relaxed min-h-[44px]">
        {agent.out || <span className="text-teal-400/70">Waiting for task... 🫧</span>}
        {agent.status === "running" && (
          <span className="inline-block w-0.5 h-3 bg-amber-400 ml-0.5 animate-pulse align-middle" />
        )}
      </div>
    </div>
  );
}

function PriBadge({ priority }: { priority: Priority }) {
  const map = {
    high: "bg-red-100 text-red-600",
    med:  "bg-amber-100 text-amber-600",
    low:  "bg-teal-100 text-teal-600",
  };
  return (
    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full whitespace-nowrap ${map[priority]}`}>
      {priority === "high" ? "High" : priority === "med" ? "Med" : "Low"}
    </span>
  );
}

function StBadge({ status }: { status: ProjectStatus }) {
  const map = {
    planned:   "bg-sky-100 text-sky-700",
    ongoing:   "bg-amber-100 text-amber-700",
    completed: "bg-teal-100 text-teal-600",
  };
  return (
    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full whitespace-nowrap ${map[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function LogDot({ agent }: { agent: string }) {
  const map: Record<string, string> = {
    research:  "border-teal-400 bg-sky-200",
    inventory: "border-amber-400 bg-amber-200/70",
    database:  "border-rose-400 bg-rose-200/60",
    planner:   "border-teal-500 bg-teal-100",
    system:    "border-sky-400 bg-sky-100",
  };
  return <span className={`w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 mt-1 ${map[agent] || map.system}`} />;
}

function AgentText({ agent }: { agent: string }) {
  const map: Record<string, string> = {
    research:  "text-sky-600",
    inventory: "text-amber-600",
    database:  "text-rose-500",
    planner:   "text-teal-600",
    system:    "text-teal-500",
  };
  return <span className={`text-[10px] font-black ${map[agent] || map.system}`}>{agent.toUpperCase()} </span>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 bg-cyan-950/40 z-50 flex items-center justify-center backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-white via-sky-50/60 to-pink-50/40 border-2 border-sky-200/70 rounded-3xl p-5 md:p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[17px] font-black text-cyan-950 mb-5">{title}</div>
        {children}
      </div>
    </div>
  );
}

function MField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full bg-white border-2 border-sky-200 rounded-xl px-3 py-2.5 text-[13px] text-cyan-950 font-semibold outline-none focus:border-teal-400 transition-colors placeholder:text-slate-300";

const selectCls =
  "w-full bg-white border-2 border-sky-200 rounded-xl px-3 py-2.5 text-[13px] text-cyan-950 font-semibold outline-none cursor-pointer focus:border-teal-400";

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [promptText, setPromptText] = useState("");
  const [running, setRunning] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>(INIT_LOGS);
  const [projects, setProjects] = useState<Project[]>(INIT_PROJECTS);
  const [inventory, setInventory] = useState<InvItem[]>(INIT_INVENTORY);
  const [experiences, setExperiences] = useState<Experience[]>(INIT_EXPERIENCE);
  const [agents, setAgents] = useState<Record<AgentKey, Agent>>({
    research:  { status: "idle", action: "Awaiting task 🫧", out: "" },
    inventory: { status: "idle", action: "Stock loaded", out: "" },
    database:  { status: "idle", action: "sandy_lab connected", out: "" },
  });
  const [modal, setModal] = useState<ModalType>(null);
  const [modalForm, setModalForm] = useState<Record<string, string | number>>({});

  // Mobile sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  // Close sidebar on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sidebarOpen && sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [sidebarOpen]);

  // ── Filters ────────────────────────────────────────────────────────────────
  const [projSearch, setProjSearch] = useState("");
  const [projPriority, setProjPriority] = useState<"all" | Priority>("all");
  const [projStatus, setProjStatus] = useState<"all" | ProjectStatus>("all");

  const [invSearch, setInvSearch] = useState("");
  const [invCat, setInvCat] = useState<string>("all");
  const [invStock, setInvStock] = useState<"all" | "low" | "ok" | "out">("all");

  const addLog = useCallback((agent: string, text: string) => {
    setLogs((l) => [...l, { id: Date.now() + Math.random(), agent, text, time: nowTime() }]);
  }, []);

  // ── Run agent task ───────────────────────────────────────────────────────
  const handleRun = async (taskOverride?: string) => {
    const taskText = (taskOverride ?? promptText).trim();
    if (!taskText || running) return;
    setPromptText(taskText);
    setRunning(true);
    setResultText(null);
    const activeAgents = planAgents(taskText);

    setAgents({
      research:  { status: activeAgents.includes("research")  ? "idle" : "skipped", action: "Standby...", out: "" },
      inventory: { status: activeAgents.includes("inventory") ? "idle" : "skipped", action: "Standby...", out: "" },
      database:  { status: activeAgents.includes("database")  ? "idle" : "skipped", action: "Standby...", out: "" },
    });

    addLog("system", `New task: "${taskText.substring(0, 50)}${taskText.length > 50 ? "..." : ""}"`);
    addLog("planner", `Routing to: ${activeAgents.join(", ")}`);
    await sleep(500);

    for (const key of activeAgents) {
      const seq = AGENT_SEQUENCES[key];
      setAgents((prev) => ({ ...prev, [key]: { ...prev[key], status: "running", action: seq[0], out: seq[0] } }));
      for (let i = 1; i < seq.length; i++) {
        await sleep(800);
        setAgents((prev) => ({ ...prev, [key]: { ...prev[key], action: seq[i], out: seq[i] } }));
      }
      await sleep(400);
      setAgents((prev) => ({ ...prev, [key]: { ...prev[key], status: "done" } }));
      addLog(key, seq[seq.length - 1]);
    }

    setResultText(buildResult(activeAgents));
    addLog("system", "All activated agents completed — task finalized 🌊");
    setRunning(false);
  };

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const openProjModal = () => {
    setModalForm({ name: "", desc: "", priority: "med", status: "planned", icon: "🔬" });
    setModal("proj");
  };
  const openInvModal = () => {
    setModalForm({ name: "", qty: 0, min: 5, cat: "Lab", unit: "pcs" });
    setModal("inv");
  };
  const openEditInv = (item: InvItem) => {
    setModalForm({ ...item });
    setModal("editInv");
  };
  const deleteInv = (id: number) => {
    const item = inventory.find((i) => i.id === id);
    setInventory((v) => v.filter((i) => i.id !== id));
    if (item) addLog("database", `Item deleted: ${item.name}`);
  };
  const restockInv = (id: number) => {
    const item = inventory.find((i) => i.id === id);
    if (!item) return;
    const targetQty = Math.max(item.min + 5, item.qty + 5);
    setInventory((v) => v.map((i) => i.id === id ? { ...i, qty: targetQty } : i));
    addLog("inventory", `Restocked ${item.name} to ${targetQty} ${item.unit}`);
  };
  const restockLowInventory = () => {
    const lowItems = inventory.filter((i) => i.qty < i.min);
    if (lowItems.length === 0) {
      addLog("inventory", "Restock scan complete — all supplies already OK");
      return;
    }
    setInventory((v) => v.map((i) => i.qty < i.min ? { ...i, qty: i.min + 5 } : i));
    addLog("inventory", `Auto-restocked ${lowItems.length} low-stock item${lowItems.length > 1 ? "s" : ""}`);
  };
  const saveProj = () => {
    if (!String(modalForm.name).trim()) return;
    setProjects((p) => [...p, { ...modalForm, id: Date.now() } as unknown as Project]);
    addLog("database", `Project created: ${modalForm.name}`);
    setModal(null);
  };
  const cycleProjectStatus = (id: number) => {
    const order: ProjectStatus[] = ["planned", "ongoing", "completed"];
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    const next = order[(order.indexOf(project.status) + 1) % order.length];
    setProjects((v) => v.map((p) => p.id === id ? { ...p, status: next } : p));
    addLog("database", `Project status updated: ${project.name} → ${next}`);
  };
  const deleteProject = (id: number) => {
    const project = projects.find((p) => p.id === id);
    setProjects((v) => v.filter((p) => p.id !== id));
    if (project) addLog("database", `Project deleted: ${project.name}`);
  };
  const saveInv = () => {
    if (!String(modalForm.name).trim()) return;
    setInventory((v) => [...v, { ...modalForm, id: Date.now(), qty: Number(modalForm.qty), min: Number(modalForm.min) } as InvItem]);
    addLog("database", `Item added: ${modalForm.name}`);
    setModal(null);
  };
  const saveEditInv = () => {
    setInventory((v) =>
      v.map((i) => i.id === modalForm.id ? { ...modalForm, qty: Number(modalForm.qty), min: Number(modalForm.min) } as InvItem : i)
    );
    addLog("database", `Item updated: ${modalForm.name}`);
    setModal(null);
  };

  // ── Experience CRUD ───────────────────────────────────────────────────────
  const openExpModal = () => {
    setModalForm({ title: "", role: "", period: "", desc: "", icon: "⭐" });
    setModal("exp");
  };
  const openEditExp = (exp: Experience) => {
    setModalForm({ ...exp });
    setModal("editExp");
  };
  const deleteExp = (id: number) => {
    const e = experiences.find((x) => x.id === id);
    setExperiences((v) => v.filter((x) => x.id !== id));
    if (e) addLog("database", `Experience removed: ${e.title}`);
  };
  const saveExp = () => {
    if (!String(modalForm.title).trim()) return;
    setExperiences((v) => [...v, { ...modalForm, id: Date.now() } as unknown as Experience]);
    addLog("database", `Experience added: ${modalForm.title}`);
    setModal(null);
  };
  const saveEditExp = () => {
    setExperiences((v) =>
      v.map((x) => x.id === modalForm.id ? ({ ...modalForm } as unknown as Experience) : x)
    );
    addLog("database", `Experience updated: ${modalForm.title}`);
    setModal(null);
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const lowStock = inventory.filter((i) => i.qty < i.min).length;
  const activeProj = projects.filter((p) => p.status === "ongoing").length;

  const filteredProjects = projects.filter((p) => {
    if (projPriority !== "all" && p.priority !== projPriority) return false;
    if (projStatus !== "all" && p.status !== projStatus) return false;
    if (projSearch.trim()) {
      const q = projSearch.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.desc.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const invCategories = Array.from(new Set(inventory.map((i) => i.cat)));
  const filteredInventory = inventory.filter((i) => {
    if (invCat !== "all" && i.cat !== invCat) return false;
    if (invStock === "low" && !(i.qty < i.min && i.qty > 0)) return false;
    if (invStock === "out" && i.qty !== 0) return false;
    if (invStock === "ok" && i.qty < i.min) return false;
    if (invSearch.trim()) {
      const q = invSearch.toLowerCase();
      if (!i.name.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const navItems = [
    { key: "dashboard"  as Page, icon: "🏠", label: "Dashboard" },
    { key: "experience" as Page, icon: "⭐", label: "Experience", badge: experiences.length || null },
    { key: "projects"   as Page, icon: "🧪", label: "Projects",   badge: activeProj || null },
    { key: "inventory"  as Page, icon: "📦", label: "Inventory",  badge: lowStock || null },
    { key: "logs"       as Page, icon: "📋", label: "Logs" },
  ];

  const agentKeys: AgentKey[] = ["research", "inventory", "database"];

  const handleNavClick = (key: Page) => {
    setPage(key);
    setSidebarOpen(false);
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap');
        * { font-family: 'Quicksand', sans-serif; }

        @keyframes bubble-rise {
          0%   { transform: translateY(0) scale(0.5); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 0.3; }
          100% { transform: translateY(-110vh) scale(1.3); opacity: 0; }
        }
        .bubble-rise { animation: bubble-rise linear infinite; }

        @keyframes jelly-float {
          0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
          25%      { transform: translateY(-20px) translateX(15px) rotate(5deg); }
          50%      { transform: translateY(-10px) translateX(-10px) rotate(-3deg); }
          75%      { transform: translateY(-30px) translateX(8px) rotate(4deg); }
        }
        .jelly-float { animation: jelly-float ease-in-out infinite; }

        @keyframes bubble-pop {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.55; }
          50%      { transform: translateY(-8px) scale(1.16); opacity: 1; }
        }
        .bubble-pop { animation: bubble-pop 2.8s ease-in-out infinite; }

        @keyframes flower-pop {
          0%, 100% { transform: rotate(0deg) scale(1); opacity: 0.85; }
          50%      { transform: rotate(8deg) scale(1.08); opacity: 1; }
        }
        .flower-pop { animation: flower-pop 4s ease-in-out infinite; }

        .sea-flower {
          position: absolute;
          font-size: 76px;
          line-height: 1;
          animation: flower-pop 7s ease-in-out infinite;
          filter: blur(0.2px);
        }

        @keyframes sandy-float {
          0%, 100% { transform: translateY(0) rotate(-4deg); opacity: 0.16; }
          50%      { transform: translateY(-18px) rotate(5deg); opacity: 0.32; }
        }
        .sandy-float {
          position: absolute;
          font-size: 42px;
          line-height: 1;
          animation: sandy-float 8s ease-in-out infinite;
          filter: drop-shadow(0 8px 18px rgba(26,58,92,0.18));
        }

        @keyframes lasso-loop {
          0%, 100% { transform: rotate(-8deg) scale(1); }
          50%      { transform: rotate(8deg) scale(1.04); }
        }
        .lasso-loop { animation: lasso-loop 5s ease-in-out infinite; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; display: inline-block; }

        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(126,200,227,0.6); border-radius: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
      `}</style>

      <OceanBubbles />

      {/* MODALS */}
      {modal === "proj" && (
        <Modal title="🧪 New Research Project" onClose={() => setModal(null)}>
          <MField label="Project Name">
            <input className={inputCls} placeholder="Enter name..." value={String(modalForm.name)} onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })} />
          </MField>
          <MField label="Description">
            <input className={inputCls} placeholder="Short description..." value={String(modalForm.desc)} onChange={(e) => setModalForm({ ...modalForm, desc: e.target.value })} />
          </MField>
          <div className="grid grid-cols-2 gap-3">
            <MField label="Priority">
              <select className={selectCls} value={String(modalForm.priority)} onChange={(e) => setModalForm({ ...modalForm, priority: e.target.value })}>
                <option value="high">High</option>
                <option value="med">Medium</option>
                <option value="low">Low</option>
              </select>
            </MField>
            <MField label="Status">
              <select className={selectCls} value={String(modalForm.status)} onChange={(e) => setModalForm({ ...modalForm, status: e.target.value })}>
                <option value="planned">Planned</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </MField>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl bg-white border-2 border-sky-200 text-slate-400 text-sm font-black hover:bg-sky-50 transition-colors">Cancel</button>
            <button onClick={saveProj} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-300 to-teal-400 text-cyan-950 text-sm font-black hover:opacity-90 transition-opacity">Create Project</button>
          </div>
        </Modal>
      )}

      {(modal === "inv" || modal === "editInv") && (
        <Modal title={modal === "editInv" ? "✏️ Edit Item" : "📦 Add Inventory Item"} onClose={() => setModal(null)}>
          <MField label="Item Name">
            <input className={inputCls} placeholder="Item name..." value={String(modalForm.name)} onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })} />
          </MField>
          <div className="grid grid-cols-3 gap-2">
            <MField label="Qty">
              <input type="number" className={inputCls} value={Number(modalForm.qty)} onChange={(e) => setModalForm({ ...modalForm, qty: e.target.value })} />
            </MField>
            <MField label="Min">
              <input type="number" className={inputCls} value={Number(modalForm.min)} onChange={(e) => setModalForm({ ...modalForm, min: e.target.value })} />
            </MField>
            <MField label="Unit">
              <input className={inputCls} value={String(modalForm.unit)} onChange={(e) => setModalForm({ ...modalForm, unit: e.target.value })} />
            </MField>
          </div>
          <MField label="Category">
            <select className={selectCls} value={String(modalForm.cat)} onChange={(e) => setModalForm({ ...modalForm, cat: e.target.value })}>
              {["Lab", "Bio", "Marine", "Chem", "Equipment"].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </MField>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl bg-white border-2 border-sky-200 text-slate-400 text-sm font-black hover:bg-sky-50 transition-colors">Cancel</button>
            <button onClick={modal === "editInv" ? saveEditInv : saveInv} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-300 to-teal-400 text-cyan-950 text-sm font-black hover:opacity-90 transition-opacity">
              {modal === "editInv" ? "Save Changes" : "Add Item"}
            </button>
          </div>
        </Modal>
      )}

      {(modal === "exp" || modal === "editExp") && (
        <Modal title={modal === "editExp" ? "✏️ Edit Experience" : "⭐ Add Experience"} onClose={() => setModal(null)}>
          <div className="grid grid-cols-[70px_1fr] gap-2">
            <MField label="Icon">
              <input className={inputCls} placeholder="⭐" value={String(modalForm.icon)} onChange={(e) => setModalForm({ ...modalForm, icon: e.target.value })} />
            </MField>
            <MField label="Title">
              <input className={inputCls} placeholder="Lab / Company..." value={String(modalForm.title)} onChange={(e) => setModalForm({ ...modalForm, title: e.target.value })} />
            </MField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MField label="Role">
              <input className={inputCls} placeholder="e.g. Lead Scientist" value={String(modalForm.role)} onChange={(e) => setModalForm({ ...modalForm, role: e.target.value })} />
            </MField>
            <MField label="Period">
              <input className={inputCls} placeholder="2018 – Present" value={String(modalForm.period)} onChange={(e) => setModalForm({ ...modalForm, period: e.target.value })} />
            </MField>
          </div>
          <MField label="Description">
            <textarea className={`${inputCls} resize-none`} rows={3} placeholder="What did you do here?" value={String(modalForm.desc)} onChange={(e) => setModalForm({ ...modalForm, desc: e.target.value })} />
          </MField>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl bg-white border-2 border-sky-200 text-slate-400 text-sm font-black hover:bg-sky-50 transition-colors">Cancel</button>
            <button onClick={modal === "editExp" ? saveEditExp : saveExp} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-300 to-teal-400 text-cyan-950 text-sm font-black hover:opacity-90 transition-opacity">
              {modal === "editExp" ? "Save Changes" : "Add Experience"}
            </button>
          </div>
        </Modal>
      )}

      {/* APP LAYOUT */}
      <div className="relative z-10 flex h-screen overflow-hidden">

        {/* ── MOBILE SIDEBAR BACKDROP ── */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-cyan-950/40 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── SIDEBAR ── */}
        <aside
          ref={sidebarRef}
          className={`
            fixed md:relative z-40 md:z-auto
            w-[210px] min-w-[210px] h-full
            bg-white/60 backdrop-blur-xl border-r-2 border-sky-200/50
            flex flex-col shadow-lg
            transition-transform duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}
        >
          {/* Logo */}
          <div className="px-4 py-5 border-b-2 border-sky-200/40 text-center" style={{ background: "linear-gradient(180deg,rgba(186,230,255,.35),transparent)" }}>
            <div className="text-3xl mb-1.5">🔬</div>
            <div className="text-[16px] font-black text-cyan-950 tracking-tight">Sandy's Lab</div>
            <div className="text-[10px] text-teal-500 mt-0.5">Bikini Bottom AI 🌊🫧</div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-2.5 py-3 overflow-y-auto">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-[1.5px] px-2 mb-2">Navigation</div>
            {navItems.map((n) => (
              <button
                key={n.key}
                onClick={() => handleNavClick(n.key)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-black mb-1 transition-all border-2
                  ${page === n.key
                    ? "bg-sky-200/70 text-cyan-950 border-sky-300 shadow-md"
                    : "text-slate-500 border-transparent hover:bg-sky-100/50 hover:text-cyan-950"}`}
              >
                <span className="text-sm">{n.icon}</span>
                <span>{n.label}</span>
                {n.badge ? (
                  <span className="ml-auto bg-red-100 text-red-600 text-[9px] font-black px-1.5 py-0.5 rounded-full">{n.badge}</span>
                ) : null}
              </button>
            ))}
          </nav>

          {/* Sandy card */}
          <div className="px-3 py-3 border-t-2 border-sky-200/40">
            <div className="relative overflow-hidden flex items-center gap-2.5 border-2 border-sky-200/60 rounded-xl px-3 py-2.5" style={{ background: "linear-gradient(135deg,rgba(253,230,138,.5),rgba(186,230,255,.45),rgba(167,243,208,.4))" }}>
              <div className="absolute -right-3 -top-3 text-3xl opacity-20 lasso-loop">➰</div>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0 shadow-sm border-2 border-white/70" style={{ background: "linear-gradient(135deg,#fbbf24,#fde68a)" }}>🤠</div>
              <div>
                <div className="text-[12px] font-black text-cyan-950">Sandy Cheeks</div>
                <div className="text-[10px] text-slate-500">Texas Lab Director 🥜</div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="flex-1 overflow-y-auto" style={{ background: "linear-gradient(180deg,rgba(186,230,255,.3),rgba(255,255,255,.1),rgba(45,106,159,.05))" }}>

          {/* Topbar */}
          <div className="sticky top-0 z-20 flex items-center gap-3 px-4 md:px-6 pt-4 pb-2 backdrop-blur-md" style={{ background: "linear-gradient(180deg,rgba(186,230,255,.85),rgba(186,230,255,.45),transparent)" }}>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden flex-shrink-0 flex flex-col gap-1 w-9 h-9 items-center justify-center rounded-xl border-2 border-sky-200 bg-white/60 shadow-sm"
              aria-label="Open menu"
            >
              <span className="w-4 h-0.5 bg-cyan-800 rounded" />
              <span className="w-4 h-0.5 bg-cyan-800 rounded" />
              <span className="w-4 h-0.5 bg-cyan-800 rounded" />
            </button>

            <div className="flex-1 min-w-0">
              <div className="text-[18px] md:text-[20px] font-black text-cyan-950 truncate">
                {{
                  dashboard:  "🏠 Sandy Command Center",
                  experience: "⭐ Sandy's Experience",
                  projects:   "🧪 Research Projects",
                  inventory:  "📦 Lab Inventory",
                  logs:       "📋 System Logs",
                }[page]}
              </div>
              <div className="text-[11px] md:text-[12px] text-slate-500 mt-0.5 hidden sm:block">
                {{
                  dashboard:  "Treedome AI Agentic Lab System 🌊",
                  experience: "Career & background — managed by Sandy herself 🤠",
                  projects:   "Sandy's Research Management",
                  inventory:  "Lab Materials CRUD Interface",
                  logs:       "Agent Activity Log",
                }[page]}
              </div>
            </div>

            <div className="pointer-events-none hidden md:flex items-center gap-2 pr-1" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="bubble-pop rounded-full border-2 border-white/70 bg-white/30 shadow-sm"
                  style={{ width: `${10 + i * 4}px`, height: `${10 + i * 4}px`, animationDelay: `${i * 0.35}s` }}
                />
              ))}
              <span className="flower-pop text-3xl text-amber-400 drop-shadow-sm">✿</span>
              <span className="text-2xl drop-shadow-sm">🍍</span>
            </div>
          </div>

          <div className="px-4 md:px-6 pb-8 pt-3 md:pt-4">

            {/* ── DASHBOARD ── */}
            {page === "dashboard" && (
              <>
                {/* Hero */}
                <div className="relative overflow-hidden rounded-2xl md:rounded-[28px] border-2 border-white/70 backdrop-blur-md p-4 md:p-5 mb-4 md:mb-5 shadow-md" style={{ background: "linear-gradient(135deg,rgba(253,230,138,.7),rgba(186,230,255,.6),rgba(167,243,208,.5))" }}>
                  <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full border-[18px] border-amber-300/25 lasso-loop" />
                  <div className="absolute right-8 bottom-4 text-6xl opacity-10">🥜</div>
                  <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                      <div className="h-14 w-14 md:h-16 md:w-16 flex-shrink-0 rounded-full border-2 border-white/80 shadow-md flex items-center justify-center text-2xl md:text-3xl" style={{ background: "linear-gradient(135deg,#fbbf24,#fde68a,#bae1ff)" }}>🤠</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[17px] md:text-[22px] font-black text-cyan-950 tracking-tight">Howdy, partner. Sandy Mode is on.</div>
                        <div className="text-[11px] md:text-[12px] text-slate-500 mt-1 leading-relaxed">
                          Treedome science, Texas grit, karate focus, and underwater AI all working together for Bikini Bottom.
                        </div>
                        <div className="flex flex-wrap gap-1.5 md:gap-2 mt-2 md:mt-3">
                          {["🥜 Acorn fuel", "🥋 Karate focus", "🌳 Treedome ready", "⭐ Texas smart", "🫧 Bubble science"].map((tag) => (
                            <span key={tag} className="rounded-full border border-white/70 bg-white/55 px-2 md:px-2.5 py-1 text-[10px] font-black text-slate-500 shadow-sm">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto sm:min-w-[170px]">
                      <button
                        onClick={() => handleRun("Run a Sandy-style Treedome lab check: research, inventory, and database summary")}
                        disabled={running}
                        className="flex-1 sm:flex-none rounded-2xl border-2 border-white/70 bg-cyan-800 text-white px-3 md:px-4 py-2 md:py-2.5 text-[11px] md:text-[12px] font-black shadow-md hover:bg-cyan-900 transition-colors disabled:opacity-50"
                      >
                        🤠 Treedome Check
                      </button>
                      <button
                        onClick={() => setPromptText("Sandy, plan a karate-focused safety review for today's underwater experiments")}
                        className="flex-1 sm:flex-none rounded-2xl border-2 border-sky-200/60 bg-white/65 text-cyan-950 px-3 md:px-4 py-2 md:py-2.5 text-[11px] md:text-[12px] font-black shadow-sm hover:bg-white/90 transition-colors"
                      >
                        🥋 Fill Sandy Prompt
                      </button>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-5">
                  {[
                    { emoji: "🧪", label: "Active Projects", val: activeProj,          note: "↑ ongoing",                                          noteColor: "text-teal-500" },
                    { emoji: "⭐", label: "Experiences",     val: experiences.length,  note: "Sandy's career",                                      noteColor: "text-slate-400" },
                    { emoji: "📦", label: "Low Stock",       val: lowStock,            note: lowStock > 0 ? "↓ restock needed" : "All stocked ✅",  noteColor: lowStock > 0 ? "text-rose-400" : "text-teal-500" },
                    { emoji: "🗄️", label: "DB Tables",       val: 8,                   note: "sandy_lab",                                           noteColor: "text-slate-400" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-2xl border-2 border-white/80 bg-white/60 backdrop-blur-md px-3 md:px-4 py-3 md:py-3.5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="text-lg mb-1">{s.emoji}</div>
                      <div className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">{s.label}</div>
                      <div className="text-xl md:text-[24px] font-black text-cyan-950">{s.val}</div>
                      <div className={`text-[10px] mt-1 font-bold ${s.noteColor}`}>{s.note}</div>
                    </div>
                  ))}
                </div>

                {/* Prompt box */}
                <div className="rounded-2xl border-2 border-sky-200/70 bg-white/70 backdrop-blur-md p-4 md:p-5 mb-4 md:mb-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-3 md:mb-4">
                    <span className="text-xl">🌊</span>
                    <div>
                      <div className="text-[14px] md:text-[15px] font-black text-cyan-950">Lab Request Interface</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Sandy's Planner reads your prompt and routes to the right AI agents 🫧</div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                    <textarea
                      className="flex-1 bg-sky-50/60 border-2 border-sky-200/60 rounded-xl px-3 md:px-4 py-3 text-[13px] text-cyan-950 outline-none focus:border-teal-400 transition-colors resize-none leading-relaxed placeholder:text-slate-300"
                      rows={3}
                      placeholder="Give me your prompt..."
                      value={promptText}
                      onChange={(e) => setPromptText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleRun(); }}
                    />
                    <button
                      onClick={() => handleRun()}
                      disabled={running || !promptText.trim()}
                      className="bg-gradient-to-r from-teal-400 to-cyan-700 text-white font-black text-[13px] px-5 py-3 rounded-xl flex items-center gap-2 whitespace-nowrap hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed justify-center border-2 border-white/50 shadow-md"
                    >
                      {running ? <><span className="spin">🫧</span> Processing...</> : <>🚀 Run Lab AI</>}
                    </button>
                  </div>
                </div>

                {/* Quick actions + DB health */}
                <div className="grid grid-cols-1 md:grid-cols-[1.35fr_1fr] gap-3 md:gap-4 mb-4 md:mb-5">
                  <div className="rounded-2xl md:rounded-3xl border-2 border-sky-200/60 bg-white/70 backdrop-blur-md p-4 md:p-5 shadow-sm overflow-hidden relative">
                    <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-sky-200/40 blur-2xl" />
                    <div className="absolute right-10 bottom-4 text-5xl opacity-10">🫧</div>
                    <div className="relative">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                          <div className="text-[14px] md:text-[15px] font-black text-cyan-950">Sea Ops Quick Actions</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">Fast controls for Sandy's most common lab flows.</div>
                        </div>
                        <span className="text-[10px] font-black rounded-full bg-teal-100 text-teal-600 px-2.5 py-1 border border-teal-200">Live</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 md:gap-2.5">
                        {[
                          { label: "Scan coral research", icon: "🪸", action: () => handleRun("Search for coral bleaching solutions and summarize practical lab ideas") },
                          { label: "Sandy karate check",  icon: "🥋", action: () => handleRun("Run a karate-focused safety check for today's experiments and log the results") },
                          { label: "Restock lows",        icon: "🥜", action: restockLowInventory },
                          { label: "Add experience",      icon: "🤠", action: openExpModal },
                        ].map((a) => (
                          <button
                            key={a.label}
                            onClick={a.action}
                            disabled={running && a.label !== "Restock lows" && a.label !== "Add experience"}
                            className="group rounded-2xl border-2 border-sky-200/50 bg-sky-50/60 px-3 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-teal-400/60 hover:bg-white/70 disabled:opacity-50 disabled:hover:translate-y-0"
                          >
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
                      <div>
                        <div className="text-[14px] md:text-[15px] font-black text-cyan-950">Database Health</div>
                        <div className="text-[11px] text-slate-400">PostgreSQL sandy_lab schema</div>
                      </div>
                      <span className="h-3 w-3 rounded-full bg-teal-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                    </div>
                    <div className="space-y-2">
                      {[
                        ["projects",      projects.length],
                        ["inventory",     inventory.length],
                        ["ai_actions_log", logs.length],
                        ["agent_tasks",   running ? 1 : 0],
                      ].map(([table, count]) => (
                        <div key={String(table)} className="flex items-center justify-between rounded-xl bg-sky-50/60 border border-sky-200/50 px-3 py-2">
                          <span className="text-[11px] font-black text-cyan-950">{table}</span>
                          <span className="text-[10px] font-black text-slate-400">{count} rows</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Result */}
                {resultText && (
                  <div className="rounded-2xl border-2 border-teal-300/70 bg-teal-50/60 backdrop-blur p-4 md:p-5 mb-4 md:mb-5">
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <span className="text-lg">🏆</span>
                      <span className="text-[14px] font-black text-teal-700">AI System Result</span>
                    </div>
                    <p className="text-[13px] text-cyan-950/80 leading-relaxed">{resultText}</p>
                  </div>
                )}

                {/* Agent Status */}
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[14px] md:text-[15px] font-black text-cyan-950 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-400 border-2 border-white shadow-sm" />
                    Agent Status
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {agentKeys.map((k) => <AgentCard key={k} agentKey={k} agent={agents[k]} />)}
                </div>
              </>
            )}

            {/* ── EXPERIENCE ── */}
            {page === "experience" && (
              <>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div className="text-[14px] md:text-[15px] font-black text-cyan-950 flex items-center gap-2 flex-wrap">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-white shadow-sm" />
                    Sandy's Career & Experience
                    <span className="text-[10px] font-bold text-slate-400">({experiences.length} entries)</span>
                  </div>
                  <button onClick={openExpModal} className="bg-gradient-to-r from-sky-300 to-teal-400 border-2 border-white/50 rounded-xl px-3.5 py-1.5 text-cyan-950 text-[12px] font-black hover:opacity-90 transition-opacity shadow-md">
                    + Add Experience
                  </button>
                </div>

                {/* Sandy intro card */}
                <div className="border-2 border-sky-200/60 rounded-2xl p-4 md:p-5 mb-5 md:mb-6 flex items-start md:items-center gap-3 md:gap-4 shadow-md" style={{ background: "linear-gradient(135deg,rgba(186,230,255,.5),rgba(167,243,208,.4),rgba(253,230,138,.3))" }}>
                  <div className="w-14 h-14 md:w-16 md:h-16 flex-shrink-0 rounded-full flex items-center justify-center text-2xl md:text-3xl shadow-md border-2 border-white/80" style={{ background: "linear-gradient(135deg,#fbbf24,#fde68a)" }}>🤠</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] md:text-[16px] font-black text-cyan-950">Sandy Cheeks — Squirrel Scientist 🌟</div>
                    <div className="text-[11px] md:text-[12px] text-slate-500 mt-1 leading-relaxed">
                      Born in Texas, moved to Bikini Bottom. Marine biologist, inventor, karate champion, and proud Treedome resident.
                      Running the lab AI system and managing 8 PostgreSQL tables in <span className="font-black text-teal-500">sandy_lab</span>. 🌊🫧
                    </div>
                    <div className="flex flex-wrap gap-1.5 md:gap-2 mt-2">
                      {["🧬 Marine Bio", "🥋 Karate", "🔬 Research", "🤖 AI Systems", "🗄️ PostgreSQL"].map(t => (
                        <span key={t} className="text-[10px] font-black bg-white/60 border border-sky-200/60 rounded-full px-2 py-0.5 text-slate-500">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="relative pl-8 md:pl-10">
                  <div className="absolute left-3 md:left-4 top-2 bottom-2 w-0.5 rounded-full" style={{ background: "linear-gradient(180deg,#fbbf24,#7dd3fc,#2dd4bf)" }} />
                  <div className="flex flex-col gap-4">
                    {experiences.length === 0 ? (
                      <div className="text-center py-14 text-slate-400 text-sm font-bold bg-white/50 rounded-2xl border-2 border-dashed border-sky-200">
                        ⭐ No experiences yet — Sandy can add one! 🫧
                      </div>
                    ) : experiences.map((e) => (
                      <div key={e.id} className="relative">
                        <div className="absolute -left-[26px] md:-left-[34px] top-4 w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center text-xs z-10" style={{ background: "linear-gradient(135deg,#fbbf24,#fde68a)" }}>
                          {e.icon}
                        </div>
                        <div className="border-2 border-sky-200/60 bg-white/80 backdrop-blur-md rounded-2xl px-4 md:px-5 py-4 hover:border-teal-400/60 hover:shadow-lg transition-all">
                          <div className="flex items-start gap-3 md:gap-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 rounded-xl flex items-center justify-center text-xl md:text-2xl border border-sky-200/50" style={{ background: "linear-gradient(135deg,rgba(186,230,255,.5),rgba(167,243,208,.5))" }}>{e.icon}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 flex-wrap">
                                <div>
                                  <div className="text-[14px] md:text-[15px] font-black text-cyan-950">{e.title}</div>
                                  <div className="text-[11px] md:text-[12px] font-bold text-teal-500 mt-0.5">{e.role}</div>
                                </div>
                                <span className="text-[10px] font-black bg-amber-100 text-amber-600 px-2 md:px-2.5 py-1 rounded-full whitespace-nowrap border border-amber-200">
                                  📅 {e.period}
                                </span>
                              </div>
                              <p className="text-[12px] text-slate-500 mt-2 leading-relaxed">{e.desc}</p>
                              <div className="flex gap-2 mt-3">
                                <button onClick={() => openEditExp(e)} className="text-[10px] font-black bg-sky-100 border-2 border-teal-300/60 text-cyan-950 px-2.5 py-1 rounded-lg hover:bg-sky-200 transition-colors">
                                  ✏️ Edit
                                </button>
                                <button onClick={() => deleteExp(e.id)} className="text-[10px] font-black bg-red-100 border-2 border-red-200 text-red-600 px-2.5 py-1 rounded-lg hover:bg-red-200 transition-colors">
                                  🗑️ Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── PROJECTS ── */}
            {page === "projects" && (
              <>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div className="text-[14px] md:text-[15px] font-black text-cyan-950 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-400 border-2 border-white shadow-sm" />
                    Research Projects
                    <span className="text-[10px] font-bold text-slate-400">({filteredProjects.length} of {projects.length})</span>
                  </div>
                  <button onClick={openProjModal} className="bg-gradient-to-r from-sky-300 to-teal-400 border-2 border-white/50 rounded-xl px-3.5 py-1.5 text-cyan-950 text-[12px] font-black hover:opacity-90 transition-opacity shadow-md">
                    + New Project
                  </button>
                </div>

                {/* Filters */}
                <div className="bg-white/60 backdrop-blur-md border-2 border-sky-200/60 rounded-2xl p-3 mb-4 flex flex-wrap gap-2 items-center shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">🔎 Filters:</span>
                  <input
                    placeholder="Search projects..."
                    value={projSearch}
                    onChange={(e) => setProjSearch(e.target.value)}
                    className="flex-1 min-w-[140px] bg-sky-50/60 border-2 border-sky-200/60 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-cyan-950 outline-none focus:border-teal-400 placeholder:text-slate-300"
                  />
                  <select value={projPriority} onChange={(e) => setProjPriority(e.target.value as "all" | Priority)}
                    className="bg-red-50 border-2 border-red-200 rounded-lg px-2.5 py-1.5 text-[12px] font-black text-red-600 outline-none cursor-pointer">
                    <option value="all">All priorities</option>
                    <option value="high">High</option>
                    <option value="med">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <select value={projStatus} onChange={(e) => setProjStatus(e.target.value as "all" | ProjectStatus)}
                    className="bg-sky-50 border-2 border-sky-200 rounded-lg px-2.5 py-1.5 text-[12px] font-black text-sky-700 outline-none cursor-pointer">
                    <option value="all">All statuses</option>
                    <option value="planned">Planned</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                  {(projSearch || projPriority !== "all" || projStatus !== "all") && (
                    <button
                      onClick={() => { setProjSearch(""); setProjPriority("all"); setProjStatus("all"); }}
                      className="bg-white border-2 border-sky-200 rounded-lg px-2.5 py-1.5 text-[11px] font-black text-slate-400 hover:bg-sky-50">
                      ✕ Reset
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-2 md:gap-2.5">
                  {filteredProjects.length === 0 ? (
                    <div className="text-center py-14 text-slate-400 text-sm font-bold bg-white/50 rounded-2xl border-2 border-dashed border-sky-200">
                      🔍 No projects match your filters 🫧
                    </div>
                  ) : filteredProjects.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 md:gap-3 border-2 border-sky-200/50 bg-white/80 backdrop-blur-md rounded-2xl px-3 md:px-4 py-3 md:py-3.5 hover:border-teal-400/60 hover:shadow-md transition-all">
                      <div className="w-9 h-9 md:w-10 md:h-10 flex-shrink-0 rounded-xl flex items-center justify-center text-lg border border-sky-200/50" style={{ background: "linear-gradient(135deg,rgba(186,230,255,.5),rgba(167,243,208,.5))" }}>{p.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-black text-cyan-950 truncate">{p.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 hidden sm:block truncate">{p.desc}</div>
                      </div>
                      <PriBadge priority={p.priority} />
                      <StBadge status={p.status} />
                      <div className="flex gap-1 md:gap-1.5 flex-shrink-0">
                        <button onClick={() => cycleProjectStatus(p.id)} className="text-[10px] font-black bg-sky-100 border-2 border-teal-300/50 text-cyan-950 px-2 py-1 rounded-lg hover:bg-sky-200 transition-colors">
                          Next
                        </button>
                        <button onClick={() => deleteProject(p.id)} className="text-[10px] font-black bg-red-100 border-2 border-red-200 text-red-600 px-2 py-1 rounded-lg hover:bg-red-200 transition-colors">
                          Del
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── INVENTORY ── */}
            {page === "inventory" && (
              <>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div className="text-[14px] md:text-[15px] font-black text-cyan-950 flex items-center gap-2 flex-wrap">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-300 border-2 border-white shadow-sm" />
                    Lab Materials
                    <span className="text-[10px] font-bold text-slate-400">({filteredInventory.length} of {inventory.length})</span>
                    {lowStock > 0 && (
                      <span className="text-[10px] font-black bg-red-100 text-red-500 px-2 py-0.5 rounded-full">
                        ⚠️ {lowStock} low stock
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={restockLowInventory} className="bg-teal-100 border-2 border-teal-200 rounded-xl px-3 md:px-3.5 py-1.5 text-teal-700 text-[12px] font-black hover:opacity-90 transition-opacity shadow-md">
                      Auto Restock
                    </button>
                    <button onClick={openInvModal} className="bg-gradient-to-r from-sky-300 to-teal-400 border-2 border-white/50 rounded-xl px-3 md:px-3.5 py-1.5 text-cyan-950 text-[12px] font-black hover:opacity-90 transition-opacity shadow-md">
                      + Add Item
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="bg-white/60 backdrop-blur-md border-2 border-sky-200/60 rounded-2xl p-3 mb-4 flex flex-wrap gap-2 items-center shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">🔎 Filters:</span>
                  <input
                    placeholder="Search materials..."
                    value={invSearch}
                    onChange={(e) => setInvSearch(e.target.value)}
                    className="flex-1 min-w-[140px] bg-sky-50/60 border-2 border-sky-200/60 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-cyan-950 outline-none focus:border-teal-400 placeholder:text-slate-300"
                  />
                  <select value={invCat} onChange={(e) => setInvCat(e.target.value)}
                    className="bg-red-50 border-2 border-red-200 rounded-lg px-2.5 py-1.5 text-[12px] font-black text-red-600 outline-none cursor-pointer">
                    <option value="all">All categories</option>
                    {invCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={invStock} onChange={(e) => setInvStock(e.target.value as "all" | "low" | "ok" | "out")}
                    className="bg-amber-50 border-2 border-amber-200 rounded-lg px-2.5 py-1.5 text-[12px] font-black text-amber-600 outline-none cursor-pointer">
                    <option value="all">All stock</option>
                    <option value="ok">✅ OK</option>
                    <option value="low">⚠️ Low</option>
                    <option value="out">❌ Out</option>
                  </select>
                  {(invSearch || invCat !== "all" || invStock !== "all") && (
                    <button
                      onClick={() => { setInvSearch(""); setInvCat("all"); setInvStock("all"); }}
                      className="bg-white border-2 border-sky-200 rounded-lg px-2.5 py-1.5 text-[11px] font-black text-slate-400 hover:bg-sky-50">
                      ✕ Reset
                    </button>
                  )}
                </div>

                {/* Scrollable table wrapper on mobile */}
                <div className="border-2 border-sky-200/60 bg-white/80 backdrop-blur-md rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
                  <table className="w-full text-[12px] border-collapse min-w-[540px]">
                    <thead className="bg-sky-100/60">
                      <tr>
                        {["Item", "Category", "Qty", "Min", "Unit", "Status", "Actions"].map((h) => (
                          <th key={h} className="text-left px-3 md:px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b-2 border-sky-200/50">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventory.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-10 text-slate-400 font-bold">🔍 No items match your filters 🫧</td>
                        </tr>
                      ) : filteredInventory.map((item) => {
                        const low = item.qty < item.min;
                        return (
                          <tr key={item.id} className="border-b border-sky-100/60 last:border-0 hover:bg-sky-50/40 transition-colors">
                            <td className="px-3 md:px-4 py-2.5 font-black text-cyan-950">
                              {item.name}
                              {item.qty === 0 && (
                                <span className="ml-1.5 text-[9px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full">OUT</span>
                              )}
                            </td>
                            <td className="px-3 md:px-4 py-2.5">
                              <span className="text-[9px] font-black bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">{item.cat}</span>
                            </td>
                            <td className={`px-3 md:px-4 py-2.5 font-black ${low ? "text-red-500" : "text-teal-600"}`}>{item.qty}</td>
                            <td className="px-3 md:px-4 py-2.5 text-slate-400">{item.min}</td>
                            <td className="px-3 md:px-4 py-2.5 text-slate-400">{item.unit}</td>
                            <td className="px-3 md:px-4 py-2.5">
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${low ? "bg-red-100 text-red-500" : "bg-teal-100 text-teal-600"}`}>
                                {low ? "Low Stock" : "OK"}
                              </span>
                            </td>
                            <td className="px-3 md:px-4 py-2.5">
                              <div className="flex gap-1 md:gap-1.5">
                                <button onClick={() => openEditInv(item)} className="text-[10px] font-black bg-sky-100 border-2 border-teal-300/50 text-cyan-950 px-2 py-1 rounded-lg hover:bg-sky-200 transition-colors">
                                  Edit
                                </button>
                                {low && (
                                  <button onClick={() => restockInv(item.id)} className="text-[10px] font-black bg-teal-100 border-2 border-teal-200 text-teal-700 px-2 py-1 rounded-lg hover:bg-teal-200 transition-colors">
                                    Restock
                                  </button>
                                )}
                                <button onClick={() => deleteInv(item.id)} className="text-[10px] font-black bg-red-100 border-2 border-red-200 text-red-500 px-2 py-1 rounded-lg hover:bg-red-200 transition-colors">
                                  Del
                                </button>
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

            {/* ── LOGS ── */}
            {page === "logs" && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[14px] md:text-[15px] font-black text-cyan-950 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-400 border-2 border-white shadow-sm" />
                    Agent Activity Log
                  </div>
                  <button onClick={() => setLogs(INIT_LOGS)} className="bg-gradient-to-r from-sky-300 to-teal-400 border-2 border-white/50 rounded-xl px-3.5 py-1.5 text-cyan-950 text-[12px] font-black hover:opacity-90 transition-opacity shadow-md">
                    Reset
                  </button>
                </div>
                <div className="border-2 border-sky-200/60 bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-sm">
                  <div className="flex flex-col">
                    {[...logs].reverse().map((l) => (
                      <div key={l.id} className="flex items-start gap-3 py-2.5 border-b border-sky-100/60 last:border-0">
                        <LogDot agent={l.agent} />
                        <div className="flex-1 min-w-0">
                          <AgentText agent={l.agent} />
                          <span className="text-[11px] text-slate-500">{l.text}</span>
                        </div>
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