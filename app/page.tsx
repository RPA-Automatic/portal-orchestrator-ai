"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import {
  Activity,
  ArrowUpRight,
  ArrowRight,
  Bot,
  Boxes,
  BrainCircuit,
  Check,
  ChevronRight,
  Code2,
  Download,
  FileText,
  GitBranch,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  Network,
  Play,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
  X,
  Zap,
  Settings,
  Database,
  BookOpen,
  Square,
  RefreshCw,
} from "lucide-react";
import agents from "@/agents/registry.json";
import { supabase, invoke, type Run } from "@/lib/agent-os/client";
type Tab =
  | "overview"
  | "runs"
  | "agents"
  | "workflows"
  | "memory"
  | "integrations"
  | "docs";
type Memory = { id: string; title: string; content: string };
const navigation = [
  { id: "overview", label: "Visão geral", icon: LayoutDashboard },
  { id: "runs", label: "Execuções", icon: Activity },
  { id: "agents", label: "Agentes", icon: Bot },
  { id: "workflows", label: "Workflows", icon: Network },
  { id: "memory", label: "Conhecimento", icon: BrainCircuit },
  { id: "integrations", label: "Integrações", icon: Boxes },
  { id: "docs", label: "Documentação", icon: BookOpen },
] as const;
const workflows = [
  {
    id: "engineering",
    name: "Engenharia de software",
    description: "Da ideia à arquitetura, com plano técnico e revisão.",
    icon: Code2,
    prompt:
      "Desenhe uma API de gestão de processos com autenticação, isolamento por cliente e critérios de aceite.",
  },
  {
    id: "rpa",
    name: "Automação de processos",
    description: "Mapeie operações, exceções e controles humanos.",
    icon: Zap,
    prompt:
      "Especifique uma automação RPA para receber solicitações, validar documentos e encaminhar exceções para revisão humana.",
  },
  {
    id: "agro",
    name: "Operações do agronegócio",
    description: "Planeje controles de faturamento e embarque.",
    icon: Truck,
    prompt:
      "Desenhe o fluxo de conferência documental e aprovação humana de embarques de cargas agrícolas. Identifique bloqueios e evidências, sem liberar cargas.",
  },
];
const statusNames: Record<string, string> = {
  queued: "Pronta para executar",
  running: "Em execução",
  waiting_approval: "Aguardando revisão",
  completed: "Entrega aceita",
  rejected: "Entrega rejeitada",
  failed: "Falhou",
  cancelled: "Cancelada",
};
function date(s: string) {
  return new Date(s).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
export default function Home() {
  const [tab, setTab] = useState<Tab>("overview"),
    [mobile, setMobile] = useState(false),
    [user, setUser] = useState<User | null>(null),
    [workspace, setWorkspace] = useState<string>(""),
    [runs, setRuns] = useState<Run[]>([]),
    [memory, setMemory] = useState<Memory[]>([]),
    [selected, setSelected] = useState<Run | null>(null),
    [query, setQuery] = useState("");
  const [authOpen, setAuthOpen] = useState(false),
    [signup, setSignup] = useState(false),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [loading, setLoading] = useState(false),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState("");
  const [prompt, setPrompt] = useState(""),
    [workflow, setWorkflow] = useState("engineering"),
    [mode, setMode] = useState("demo"),
    [health, setHealth] = useState<{ openai: boolean; model: string } | null>(
      null,
    ),
    [memoryTitle, setMemoryTitle] = useState(""),
    [memoryContent, setMemoryContent] = useState("");
  const runOpen = selected !== null;
  const mounted = useRef(true),
    actor = useRef<string | null>(null);
  const refresh = useCallback(async (uid: string) => {
    const [r, m] = await Promise.all([
      supabase
        .from("ao_runs")
        .select("*")
        .eq("owner_id", uid)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("ao_memory")
        .select("id,title,content")
        .eq("owner_id", uid)
        .order("created_at", { ascending: false }),
    ]);
    if (actor.current !== uid) return;
    if (r.error || m.error)
      throw new Error("Não foi possível carregar os dados do workspace.");
    setRuns(r.data || []);
    setMemory(m.data || []);
    setSelected((old) =>
      old ? (r.data || []).find((x) => x.id === old.id) || old : null,
    );
  }, []);
  useEffect(() => {
    mounted.current = true;
    const apply = async (next: User | null) => {
      const changed = actor.current !== next?.id;
      actor.current = next?.id || null;
      setUser(next);
      if (changed) {
        setRuns([]);
        setMemory([]);
        setSelected(null);
        setWorkspace("");
        setHealth(null);
      }
      if (!next) return;
      try {
        const lookup = await supabase
          .from("ao_workspaces")
          .select("id")
          .eq("owner_id", next.id)
          .maybeSingle();
        let data = lookup.data;
        const error = lookup.error;
        if (error) throw error;
        if (!data) {
          const created = await supabase
            .from("ao_workspaces")
            .insert({ owner_id: next.id, name: "Meu workspace" })
            .select("id")
            .single();
          if (created.error) {
            const retry = await supabase
              .from("ao_workspaces")
              .select("id")
              .eq("owner_id", next.id)
              .single();
            if (retry.error) throw retry.error;
            data = retry.data;
          } else data = created.data;
        }
        if (!mounted.current || actor.current !== next.id) return;
        setWorkspace(data!.id);
        await refresh(next.id);
        const h = await invoke("health");
        if (actor.current === next.id) setHealth(h);
      } catch {
        if (mounted.current)
          setError(
            "Não foi possível abrir o workspace. Recarregue a página ou entre novamente.",
          );
      }
    };
    void supabase.auth
      .getSession()
      .then(({ data }) => apply(data.session?.user || null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => void apply(session?.user || null), 0);
    });
    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, [refresh]);
  useEffect(() => {
    if (!authOpen && !runOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>("[role=dialog]");
    const focusables = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          "button:not(:disabled),input,textarea,select,a[href],summary",
        ) || [],
      );
    focusables()[0]?.focus();
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAuthOpen(false);
        setSelected(null);
      }
      if (e.key === "Tab") {
        const items = focusables();
        const first = items[0],
          last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("keydown", handle);
      previous?.focus();
    };
  }, [authOpen, runOpen]);
  async function authenticate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = signup
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
      if (result.error)
        throw new Error(
          signup
            ? "Não foi possível criar a conta. Verifique os dados ou tente entrar."
            : "E-mail ou senha inválidos.",
        );
      if (signup && !result.data.session)
        setNotice("Conta solicitada. Confirme seu e-mail antes de entrar.");
      else {
        setAuthOpen(false);
        setNotice("Bem-vindo ao seu centro de operações.");
      }
      setPassword("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  async function createRun() {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (!workspace) {
      setError("Aguarde o carregamento do workspace.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const data = await invoke("create", {
        id: crypto.randomUUID(),
        workspace_id: workspace,
        prompt,
        workflow,
        mode,
      });
      setSelected(data.run);
      setTab("runs");
      await refresh(user.id);
      setNotice("Missão criada. Revise o objetivo e inicie os agentes.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function advance(run: Run) {
    setBusy(true);
    setError("");
    try {
      let current = run;
      while (
        current.status === "queued" &&
        mounted.current &&
        actor.current === user?.id
      ) {
        const data = await invoke("advance", { id: current.id });
        current = data.run;
        setSelected(current);
        if (user) await refresh(user.id);
      }
    } catch (e) {
      setError((e as Error).message);
      if (user) await refresh(user.id);
    } finally {
      setBusy(false);
    }
  }
  async function action(name: string, run: Run, decision?: string) {
    setBusy(true);
    setError("");
    try {
      const data = await invoke(name, { id: run.id, decision });
      setSelected(data.run);
      if (user) await refresh(user.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function saveMemory(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase
        .from("ao_memory")
        .insert({
          workspace_id: workspace,
          owner_id: user.id,
          title: memoryTitle,
          content: memoryContent,
        });
      if (error) throw error;
      setMemoryTitle("");
      setMemoryContent("");
      await refresh(user.id);
      setNotice(
        "Conhecimento salvo. Os três registros mais recentes serão usados nas execuções de IA.",
      );
    } catch {
      setError("Não foi possível salvar o conhecimento.");
    } finally {
      setBusy(false);
    }
  }
  function download(run: Run) {
    const text = `# ${run.title}\n\nModo: ${run.mode}\nStatus: ${statusNames[run.status]}\nObjetivo: ${run.prompt}\n\n${run.steps.map((s) => `## ${s.name}\n\n${s.content}`).join("\n\n---\n\n")}`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([text], { type: "text/markdown;charset=utf-8" }),
    );
    a.download = `rpa-automatic-${run.id}.md`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  const pending = runs.filter((r) => r.status === "waiting_approval"),
    filtered = runs.filter((r) =>
      `${r.title} ${r.workflow} ${statusNames[r.status]}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    );
  const navigate = (value: Tab) => {
    setTab(value);
    setMobile(false);
    setQuery("");
  };
  function list(items: Run[]) {
    return items.length ? (
      <div className="run-list">
        {items.map((r) => (
          <button className="run-row" key={r.id} onClick={() => setSelected(r)}>
            <span
              className={
                "run-icon " + (r.status === "completed" ? "green" : "cyan")
              }
            >
              <Network size={19} />
            </span>
            <span className="run-title">
              <strong>{r.title}</strong>
              <small>
                {r.mode === "demo" ? "Demonstração" : "OpenAI"} ·{" "}
                {date(r.created_at)}
              </small>
            </span>
            <span className={"pill " + r.status}>{statusNames[r.status]}</span>
            <ChevronRight size={16} />
          </button>
        ))}
      </div>
    ) : (
      <div className="empty">
        <Network size={30} />
        <h3>Sua próxima missão começa aqui</h3>
        <p>
          Crie uma tarefa para acompanhar os agentes, as entregas e as decisões
          em um só lugar.
        </p>
        <button className="text-button" onClick={() => navigate("overview")}>
          Criar primeira missão <ArrowRight size={15} />
        </button>
      </div>
    );
  }
  return (
    <div className="os-shell">
      <aside className={"os-sidebar " + (mobile ? "open" : "")}>
        <Link className="brand" href="/" aria-label="RPA Automatic início">
          <span className="brand-mark">
            <Zap size={23} fill="currentColor" />
          </span>
          <span>
            RPA<span className="brand-light"> AUTOMATIC</span>
            <small>AGENT OPERATING SYSTEM</small>
          </span>
        </Link>
        <div className="workspace-chip">
          <span className="avatar-small">RA</span>
          <div>
            <strong>RPA Automatic</strong>
            <small>Workspace {user ? "pessoal" : "de apresentação"}</small>
          </div>
          <span className="online-dot" />
        </div>
        <p className="nav-caption">WORKSPACE</p>
        <nav aria-label="Menu principal">
          {navigation.map((item) => (
            <button
              className={tab === item.id ? "active" : ""}
              key={item.id}
              onClick={() => navigate(item.id)}
            >
              <item.icon size={18} />
              {item.label}
              {item.id === "runs" && pending.length > 0 && (
                <span className="nav-count">{pending.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="ecosystem-card">
            <span className="eyebrow">ECOSSISTEMA RPA</span>
            <strong>Inteligência que conecta.</strong>
            <p>Agentes e operações trabalhando na mesma direção.</p>
            <button
              className="text-button"
              onClick={() => navigate("integrations")}
            >
              Explorar conexões <ArrowUpRight size={15} />
            </button>
          </div>
          <button
            className="profile"
            onClick={() =>
              user ? void supabase.auth.signOut() : setAuthOpen(true)
            }
          >
            <span className="avatar-small">{user ? "EU" : "→"}</span>
            <span>
              <strong>{user ? "Minha conta" : "Acessar workspace"}</strong>
              <small>{user?.email || "Entre para salvar suas missões"}</small>
            </span>
            {user ? <LogOut size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
      </aside>
      {mobile && (
        <button
          className="mobile-scrim"
          aria-label="Fechar menu"
          onClick={() => setMobile(false)}
        />
      )}
      <div className="os-main">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-toggle"
              aria-label="Abrir menu"
              onClick={() => setMobile(true)}
            >
              <Menu size={20} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>{navigation.find((x) => x.id === tab)?.label}</strong>
          </div>
          <div className="topbar-actions">
            <span className="system-indicator">
              <span className="online-dot" />
              {user ? "Workspace conectado" : "Ambiente privado"}
            </span>
            <button
              className="icon-button"
              aria-label="Integrações e configurações"
              onClick={() => navigate("integrations")}
            >
              <Settings size={18} />
            </button>
          </div>
        </header>
        <main id="main-content">
          {(notice || error) && (
            <div
              role={error ? "alert" : "status"}
              className={"notice " + (error ? "error" : "")}
            >
              <span>{error || notice}</span>
              <button
                className="icon-button"
                aria-label="Fechar aviso"
                onClick={() => {
                  setError("");
                  setNotice("");
                }}
              >
                <X size={16} />
              </button>
            </div>
          )}
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span className="tiny-line" />
                RPA AUTOMATIC / AGENT OS
              </div>
              <h1>
                {
                  {
                    overview: "Seu centro de inteligência.",
                    runs: "Cada missão, uma evolução.",
                    agents: "Especialistas. Uma só direção.",
                    workflows: "Ideias em movimento.",
                    memory: "Conhecimento que permanece.",
                    integrations: "Um ecossistema conectado.",
                    docs: "Clareza em cada decisão.",
                  }[tab]
                }
              </h1>
              <p>
                {
                  {
                    overview:
                      "Orquestre agentes, transforme processos e acompanhe cada decisão.",
                    runs: "Da primeira instrução à entrega revisada, com tudo registrado.",
                    agents:
                      "Quatro agentes com responsabilidades explícitas e instruções versionadas.",
                    workflows:
                      "Escolha um ponto de partida para o seu próximo desafio.",
                    memory:
                      "Registre contexto aprovado para orientar as próximas execuções.",
                    integrations:
                      "Conexões reais, com limites claros e dados separados por produto.",
                    docs: "Arquitetura, contratos e operação da plataforma RPA Automatic.",
                  }[tab]
                }
              </p>
            </div>
            {tab !== "overview" && (
              <button
                className="primary-button"
                onClick={() => navigate("overview")}
              >
                <Plus size={16} />
                Nova missão
              </button>
            )}
          </div>
          {tab === "overview" && (
            <>
              <div className="metrics">
                <div>
                  <span>
                    Missões criadas <Activity size={16} />
                  </span>
                  <strong>{runs.length.toString().padStart(2, "0")}</strong>
                  <small>Últimas 50 execuções</small>
                </div>
                <div>
                  <span>
                    Agentes disponíveis <Bot size={16} />
                  </span>
                  <strong>04</strong>
                  <small>Especialistas em colaboração</small>
                </div>
                <div>
                  <span>
                    Entregas para revisar <ShieldCheck size={16} />
                  </span>
                  <strong>{pending.length.toString().padStart(2, "0")}</strong>
                  <small>Você mantém o controle</small>
                </div>
                <div>
                  <span>
                    Tokens utilizados <Zap size={16} />
                  </span>
                  <strong>
                    {runs
                      .reduce(
                        (n, r) => n + r.steps.reduce((x, s) => x + s.tokens, 0),
                        0,
                      )
                      .toLocaleString("pt-BR")}
                  </strong>
                  <small>Uso reportado pelo provedor</small>
                </div>
              </div>
              <div className="command-grid">
                <section className="panel composer">
                  <div className="panel-heading">
                    <div>
                      <span className="eyebrow cyan-text">COMMAND CENTER</span>
                      <h2>O que vamos construir?</h2>
                    </div>
                    <span className="spark-box">
                      <Sparkles size={23} />
                    </span>
                  </div>
                  <p>
                    Defina o resultado. Sua equipe de agentes prepara o caminho.
                  </p>
                  <label className="sr-only" htmlFor="mission">
                    Objetivo da missão
                  </label>
                  <textarea
                    id="mission"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Descreva um processo para automatizar, uma solução para desenhar ou um desafio para resolver…"
                    maxLength={8000}
                  />
                  <div className="suggestions">
                    {workflows.map((w) => (
                      <button
                        key={w.id}
                        onClick={() => {
                          setPrompt(w.prompt);
                          setWorkflow(w.id);
                        }}
                      >
                        <w.icon size={13} />
                        {w.id === "engineering"
                          ? "Desenhar uma API"
                          : w.id === "rpa"
                            ? "Automatizar processo"
                            : "Planejar embarque"}
                      </button>
                    ))}
                  </div>
                  <div className="composer-controls">
                    <label>
                      Workflow
                      <select
                        value={workflow}
                        onChange={(e) => setWorkflow(e.target.value)}
                      >
                        {workflows.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Execução
                      <select
                        value={mode}
                        onChange={(e) => setMode(e.target.value)}
                      >
                        <option value="demo">Demonstração sem IA</option>
                        <option value="openai" disabled={!health?.openai}>
                          OpenAI{" "}
                          {health?.openai ? "" : "· configuração pendente"}
                        </option>
                      </select>
                    </label>
                  </div>
                  <div className="composer-footer">
                    <span>
                      <ShieldCheck size={14} />
                      Entregas passam pela sua revisão
                    </span>
                    <button
                      className="primary-button"
                      onClick={() => void createRun()}
                      disabled={busy || (!!user && prompt.trim().length < 12)}
                    >
                      {busy ? (
                        <LoaderCircle className="spin" size={16} />
                      ) : (
                        <ArrowRight size={16} />
                      )}{" "}
                      {user ? "Criar missão" : "Entrar e começar"}
                    </button>
                  </div>
                </section>
                <section className="panel constellation">
                  <div className="panel-heading">
                    <span className="eyebrow">SUA EQUIPE DE AGENTES</span>
                    <span className="pill subtle">4 especialistas</span>
                  </div>
                  <div className="orbital" aria-hidden="true">
                    <div className="orbit orbit-one" />
                    <div className="orbit orbit-two" />
                    <div className="orbit-core">
                      <Network size={34} />
                    </div>
                    {agents.map((a, i) => (
                      <span
                        key={a.id}
                        className={"orb-node node-" + i + " " + a.color}
                      >
                        {a.initials}
                      </span>
                    ))}
                  </div>
                  <h2>Inteligência em colaboração</h2>
                  <p>Planejar. Projetar. Automatizar. Revisar.</p>
                  <div className="team-legend">
                    {agents.map((a) => (
                      <span key={a.id}>
                        <i className={a.color} />
                        {a.name}
                      </span>
                    ))}
                  </div>
                  <button
                    className="text-button"
                    onClick={() => navigate("agents")}
                  >
                    Conhecer os agentes <ArrowUpRight size={15} />
                  </button>
                </section>
              </div>
              <div className="bottom-grid">
                <section className="panel">
                  <div className="panel-heading">
                    <h2>Missões recentes</h2>
                    <button
                      className="text-button"
                      onClick={() => navigate("runs")}
                    >
                      Ver todas <ArrowRight size={15} />
                    </button>
                  </div>
                  {list(runs.slice(0, 4))}
                </section>
                <section className="panel review-panel">
                  <div className="panel-heading">
                    <h2>Seu controle, sempre.</h2>
                    <ShieldCheck size={19} />
                  </div>
                  <p>
                    Os agentes propõem. Você revisa os resultados e decide o
                    próximo passo.
                  </p>
                  <div className="review-stat">
                    <strong>{pending.length}</strong>
                    <span>
                      entregas aguardando
                      <br />
                      sua revisão
                    </span>
                  </div>
                  <button
                    className="secondary-button"
                    onClick={() =>
                      pending[0] ? setSelected(pending[0]) : navigate("runs")
                    }
                  >
                    Abrir central de revisão <ArrowRight size={15} />
                  </button>
                </section>
              </div>
            </>
          )}
          {tab === "runs" && (
            <section className="panel">
              <div className="panel-heading">
                <h2>
                  Histórico de missões{" "}
                  <span className="muted">/ {runs.length}</span>
                </h2>
                <label className="search">
                  <Search size={16} />
                  <input
                    placeholder="Buscar missões…"
                    aria-label="Buscar missões"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
              </div>
              {list(filtered)}
            </section>
          )}
          {tab === "agents" && (
            <div className="agent-grid">
              {agents.map((a, i) => (
                <article className="panel agent-card" key={a.id}>
                  <div className="panel-heading">
                    <span className={"agent-avatar " + a.color}>
                      {a.initials}
                    </span>
                    <span className="pill subtle">v1.0 · {i + 1}/4</span>
                  </div>
                  <h2>{a.name}</h2>
                  <span className={"role " + a.color}>{a.role}</span>
                  <p>{a.description}</p>
                  <div className="agent-tags">
                    <span>Contexto versionado</span>
                    <span>Saída em Markdown</span>
                  </div>
                  <details>
                    <summary>Ver instruções do agente</summary>
                    <p>{a.instructions}</p>
                  </details>
                  <div className="agent-bottom">
                    <span>
                      <span className="online-dot" />
                      Registrado
                    </span>
                    <span>OpenAI / Demo</span>
                  </div>
                </article>
              ))}
            </div>
          )}
          {tab === "workflows" && (
            <div className="workflow-grid">
              {workflows.map((w) => (
                <article className="panel workflow-card" key={w.id}>
                  <span className="spark-box">
                    <w.icon size={27} />
                  </span>
                  <h2>{w.name}</h2>
                  <p>{w.description}</p>
                  <div className="workflow-chain">
                    {agents.map((a, i) => (
                      <span key={a.id}>
                        <span className={"chain-dot " + a.color}>
                          {a.initials}
                        </span>
                        {i < 3 && <ChevronRight size={14} />}
                      </span>
                    ))}
                  </div>
                  <p className="muted">
                    4 etapas · revisão humana · artefato exportável
                  </p>
                  <button
                    className="secondary-button"
                    onClick={() => {
                      setPrompt(w.prompt);
                      setWorkflow(w.id);
                      navigate("overview");
                    }}
                  >
                    Usar este workflow <ArrowRight size={16} />
                  </button>
                </article>
              ))}
            </div>
          )}
          {tab === "memory" && (
            <div className="bottom-grid">
              <section className="panel">
                <div className="panel-heading">
                  <h2>Contexto aprovado</h2>
                  <span className="pill subtle">{memory.length} registros</span>
                </div>
                <p className="muted">
                  As três notas mais recentes são fornecidas aos agentes como
                  referência, nunca como permissão.
                </p>
                {memory.length ? (
                  memory.map((m) => (
                    <article className="memory-item" key={m.id}>
                      <h3>{m.title}</h3>
                      <p>{m.content}</p>
                      <button
                        className="text-button"
                        onClick={async () => {
                          const { error } = await supabase
                            .from("ao_memory")
                            .delete()
                            .eq("id", m.id);
                          if (error)
                            setError("Não foi possível remover a nota.");
                          else if (user) await refresh(user.id);
                        }}
                      >
                        Remover nota
                      </button>
                    </article>
                  ))
                ) : (
                  <div className="empty">
                    <BrainCircuit size={32} />
                    <h3>Construa a memória do workspace</h3>
                    <p>
                      Registre convenções, contexto de negócio e decisões
                      aceitas.
                    </p>
                  </div>
                )}
              </section>
              <form className="panel form-panel" onSubmit={saveMemory}>
                <h2>Adicionar conhecimento</h2>
                <label>
                  Título
                  <input
                    required
                    minLength={2}
                    maxLength={120}
                    value={memoryTitle}
                    onChange={(e) => setMemoryTitle(e.target.value)}
                    placeholder="Ex.: convenções da equipe"
                  />
                </label>
                <label>
                  Conteúdo
                  <textarea
                    required
                    maxLength={12000}
                    value={memoryContent}
                    onChange={(e) => setMemoryContent(e.target.value)}
                    placeholder="Contexto útil para suas próximas missões. Não inclua senhas ou chaves."
                  />
                </label>
                <button className="primary-button" disabled={busy}>
                  <Plus size={16} />
                  Salvar conhecimento
                </button>
              </form>
            </div>
          )}
          {tab === "integrations" && (
            <>
              <div className="integration-grid">
                {[
                  {
                    name: "OpenAI",
                    icon: Sparkles,
                    category: "INTELIGÊNCIA",
                    description:
                      "Execução sequencial dos quatro agentes pela Responses API. Credenciais ficam no servidor.",
                    status: health?.openai ? "Configurada" : "Aguardando chave",
                    color: health?.openai ? "green" : "orange",
                  },
                  {
                    name: "Supabase",
                    icon: Database,
                    category: "DADOS & IDENTIDADE",
                    description:
                      "Autenticação, workspaces isolados, execuções e histórico de decisões.",
                    status: user ? "Conectado" : "Entre para conectar",
                    color: "green",
                  },
                  {
                    name: "GitHub",
                    icon: GitBranch,
                    category: "CÓDIGO & VERSIONAMENTO",
                    description:
                      "Código e definições de agentes no repositório portal-orchestrator-ai. Execução de ferramentas Git pelo portal ainda não habilitada.",
                    status: "Repositório do projeto",
                    color: "cyan",
                  },
                  {
                    name: "AgroFlow",
                    icon: Truck,
                    category: "ECOSSISTEMA RPA",
                    description:
                      "Produto de controle de faturamento e liberação de embarques. Banco separado; conector de operações em planejamento.",
                    status: "Integração planejada",
                    color: "violet",
                  },
                ].map((c) => (
                  <article className="panel integration-card" key={c.name}>
                    <div className="panel-heading">
                      <span className={"agent-avatar " + c.color}>
                        <c.icon size={26} />
                      </span>
                      <span className={"pill " + c.color}>{c.status}</span>
                    </div>
                    <span className="eyebrow">{c.category}</span>
                    <h2>{c.name}</h2>
                    <p>{c.description}</p>
                  </article>
                ))}
              </div>
              <section className="panel setup-note">
                <ShieldCheck size={25} />
                <div>
                  <h2>Ativar a execução real</h2>
                  <p>
                    O administrador precisa configurar a chave da OpenAI nos
                    segredos do servidor. O portal nunca solicita nem armazena
                    essa chave no navegador.
                  </p>
                  <a
                    className="text-button"
                    href="https://supabase.com/dashboard/project/lvsocwetuhhqxlwyfdrw/functions/secrets"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir configuração protegida <ArrowUpRight size={14} />
                  </a>
                </div>
              </section>
            </>
          )}
          {tab === "docs" && (
            <div className="bottom-grid">
              <section className="panel docs-panel">
                <span className="eyebrow cyan-text">
                  ARQUITETURA DA PLATAFORMA
                </span>
                <h2>Uma plataforma, limites claros.</h2>
                <p>
                  O Agent OS coordena trabalho intelectual. O AgroFlow controla
                  operações de faturamento e embarque. A integração entre os
                  produtos exige contratos e aprovação humana para ações de
                  negócio.
                </p>
                <div className="architecture-flow">
                  <span>
                    <LayoutDashboard />
                    Portal React + HTML5
                  </span>
                  <ChevronRight />
                  <span>
                    <ShieldCheck />
                    API autenticada
                  </span>
                  <ChevronRight />
                  <span>
                    <Database />
                    Supabase + RLS
                  </span>
                </div>
                <h3>Ciclo de uma missão</h3>
                <p>
                  Objetivo → Atlas → Nova → Flux → Sentinel → revisão humana →
                  entrega aceita ou rejeitada.
                </p>
                <p>
                  O modo OpenAI produz análises e propostas. Nenhum agente
                  executa shell, escreve em sistemas externos ou libera
                  embarques nesta versão.
                </p>
                <a
                  className="secondary-button"
                  href="/docs/ARCHITECTURE.md"
                  download
                >
                  <Download size={16} />
                  Baixar arquitetura
                </a>
              </section>
              <section className="panel docs-panel">
                <h2>Biblioteca do projeto</h2>
                {[
                  { name: "SDD original · Cubo Connect", file: "SDD.md" },
                  {
                    name: "Arquitetura e modelo de dados",
                    file: "ARCHITECTURE.md",
                  },
                  {
                    name: "Operação, segurança e implantação",
                    file: "OPERATIONS.md",
                  },
                  {
                    name: "AgroFlow · contrato de integração",
                    file: "AGROFLOW.md",
                  },
                ].map((d) => (
                  <a
                    key={d.file}
                    className="doc-link"
                    href={"/docs/" + d.file}
                    download
                  >
                    <FileText size={20} />
                    <span>{d.name}</span>
                    <Download size={15} />
                  </a>
                ))}
                <p className="muted">
                  Especificações e decisões preservadas junto ao código.
                </p>
              </section>
            </div>
          )}
          <footer className="os-footer">
            <span>
              RPA AUTOMATIC <b>·</b> Engenharia de automação inteligente
            </span>
            <span>Agent OS / 0.2</span>
          </footer>
        </main>
      </div>
      {authOpen && (
        <div className="modal-overlay">
          <section
            className="modal auth-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
          >
            <button
              className="icon-button modal-close"
              aria-label="Fechar login"
              onClick={() => setAuthOpen(false)}
            >
              <X />
            </button>
            <span className="brand-mark">
              <Zap fill="currentColor" />
            </span>
            <h2 id="auth-title">
              {signup ? "Crie seu workspace." : "Bem-vindo de volta."}
            </h2>
            <p>Entre para salvar missões e trabalhar com seus agentes.</p>
            <form onSubmit={authenticate}>
              <label>
                E-mail
                <input
                  autoFocus
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label>
                Senha
                <input
                  required
                  type="password"
                  minLength={8}
                  autoComplete={signup ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              {error && (
                <p role="alert" className="error-text">
                  {error}
                </p>
              )}
              {notice && <p role="status">{notice}</p>}
              <button className="primary-button" disabled={loading}>
                {loading ? (
                  <LoaderCircle size={17} className="spin" />
                ) : (
                  <ArrowRight size={17} />
                )}{" "}
                {signup ? "Criar conta" : "Entrar"}
              </button>
            </form>
            <button
              className="text-button"
              onClick={() => {
                setSignup(!signup);
                setError("");
              }}
            >
              {signup ? "Já tenho uma conta" : "Criar uma conta"}
            </button>
          </section>
        </div>
      )}
      {selected && (
        <div className="modal-overlay">
          <section
            className="modal run-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="run-title"
          >
            <button
              className="icon-button modal-close"
              aria-label="Fechar detalhes"
              onClick={() => setSelected(null)}
            >
              <X />
            </button>
            <div className="eyebrow cyan-text">
              MISSION CONTROL / {selected.id.slice(0, 8)}
            </div>
            <h2 id="run-title">{selected.title}</h2>
            <div className="run-meta">
              <span className={"pill " + selected.status}>
                {statusNames[selected.status]}
              </span>
              <span>
                {selected.mode === "demo"
                  ? "Demonstração · sem consumo de IA"
                  : "OpenAI · geração de propostas"}
              </span>
              <span>{date(selected.created_at)}</span>
            </div>
            <p className="run-prompt">{selected.prompt}</p>
            <div className="execution-track">
              {agents.map((a, i) => (
                <div
                  key={a.id}
                  className={selected.steps.length > i ? "done" : ""}
                >
                  <span>
                    {selected.steps.length > i ? <Check size={16} /> : i + 1}
                  </span>
                  <strong>{a.name}</strong>
                  <small>{a.role}</small>
                </div>
              ))}
            </div>
            <div className="progress-track">
              <div style={{ width: `${selected.steps.length * 25}%` }} />
            </div>
            <div className="run-actions">
              {selected.status === "queued" && (
                <button
                  className="primary-button"
                  disabled={busy}
                  onClick={() => void advance(selected)}
                >
                  {busy ? (
                    <LoaderCircle size={16} className="spin" />
                  ) : (
                    <Play size={16} />
                  )}{" "}
                  {selected.steps.length
                    ? "Continuar agentes"
                    : "Iniciar agentes"}
                </button>
              )}
              {selected.status === "running" && (
                <button
                  className="secondary-button"
                  disabled={busy}
                  onClick={() => void action("recover", selected)}
                >
                  <RefreshCw size={15} />
                  Recuperar etapa interrompida
                </button>
              )}
              {["queued", "running"].includes(selected.status) && (
                <button
                  className="secondary-button"
                  disabled={busy}
                  onClick={() => void action("cancel", selected)}
                >
                  <Square size={13} />
                  Cancelar
                </button>
              )}
              {selected.status === "waiting_approval" && (
                <>
                  <button
                    className="primary-button"
                    disabled={busy}
                    onClick={() =>
                      void action("decision", selected, "approved")
                    }
                  >
                    <Check size={16} />
                    Aceitar entrega
                  </button>
                  <button
                    className="secondary-button"
                    disabled={busy}
                    onClick={() =>
                      void action("decision", selected, "rejected")
                    }
                  >
                    <X size={16} />
                    Rejeitar
                  </button>
                </>
              )}
              {selected.steps.length > 0 && (
                <button
                  className="secondary-button"
                  onClick={() => download(selected)}
                >
                  <Download size={16} />
                  Exportar artefatos
                </button>
              )}
            </div>
            {busy && (
              <p role="status" className="cyan-text">
                <LoaderCircle className="spin inline" size={15} /> Processando.
                Cada etapa é salva antes de avançar.
              </p>
            )}
            {error && (
              <p className="error-text" role="alert">
                {error}
              </p>
            )}
            {selected.error && <p className="notice error">{selected.error}</p>}
            {selected.status === "waiting_approval" && (
              <p className="review-explanation">
                <ShieldCheck size={18} />
                Aceitar registra sua revisão. Não publica código nem autoriza
                operações externas.
              </p>
            )}
            <div className="outputs">
              {selected.steps.map((s, i) => (
                <details open={i === selected.steps.length - 1} key={s.agent}>
                  <summary>
                    <span className={"agent-avatar small " + agents[i].color}>
                      {agents[i].initials}
                    </span>
                    <strong>
                      {s.name} · {agents[i].role}
                    </strong>
                    <span>{s.tokens ? `${s.tokens} tokens` : "Demo"}</span>
                  </summary>
                  <pre>{s.content}</pre>
                </details>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
