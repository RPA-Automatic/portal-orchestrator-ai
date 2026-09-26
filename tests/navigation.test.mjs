import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
const { supabase } = await import("../src/lib/supabase.ts");
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost:5173",
});
for (const key of [
  "window",
  "document",
  "HTMLElement",
  "HTMLInputElement",
  "HTMLTextAreaElement",
  "HTMLSelectElement",
  "Element",
  "Node",
  "NodeFilter",
  "MutationObserver",
  "CustomEvent",
  "Event",
  "FormData",
  "localStorage",
  "getComputedStyle",
])
  globalThis[key] =
    key === "getComputedStyle"
      ? dom.window.getComputedStyle.bind(dom.window)
      : dom.window[key];
Object.defineProperty(globalThis, "navigator", {
  value: dom.window.navigator,
  configurable: true,
});
window.matchMedia = () => ({
  matches: false,
  addEventListener() {},
  removeEventListener() {},
});
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);
globalThis.cancelAnimationFrame = clearTimeout;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = await import("react");
const { render, screen, within, waitFor, cleanup, fireEvent } = await import(
  "@testing-library/react"
);
const userEvent = (await import("@testing-library/user-event")).default;
const { default: App } = await import("../src/App.tsx");
const { ThemeProvider } = await import("../src/components/ThemeProvider.tsx");

const owner = "10000000-0000-4000-8000-000000000001";
const workspace = "20000000-0000-4000-8000-000000000001";
const session = {
  access_token: "test-only",
  user: { id: owner, email: "qa@example.test" },
};
supabase.auth.getSession = async () => ({ data: { session }, error: null });
supabase.auth.onAuthStateChange = () => ({
  data: { subscription: { unsubscribe() {} } },
});
const resources = [
  {
    id: crypto.randomUUID(),
    owner_id: owner,
    kind: "agent",
    name: "Agente de teste",
    content: "Produza um resultado para revisão.",
    config: {},
    created_at: new Date().toISOString(),
  },
];
const runs = [],
  schedules = [],
  calls = [];
globalThis.fetch = async (input, init) => {
  const url = new URL(String(input));
  if (url.hostname !== "lvsocwetuhhqxlwyfdrw.supabase.co")
    throw new Error("Rede externa bloqueada em teste");
  const body = JSON.parse(String(init?.body || "{}"));
  let data = [];
  if (url.pathname.endsWith("agent-orchestrator")) {
    calls.push(body);
    if (body.action === "health")
      data = { openai: false, github: false, agents: 1, runtime: "scheduled" };
    else if (body.action === "create") {
      const run = {
        ...body,
        title: body.prompt.slice(0, 100),
        status: "queued",
        mode: "builtin",
        steps: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        context_snapshot: {
          agents: [{ id: "data-quality", name: "Guardião" }],
        },
      };
      runs.unshift(run);
      data = { run };
    } else if (body.action === "schedule_create") {
      const schedule = { ...body, enabled: true };
      schedules.push(schedule);
      data = { schedule };
    } else if (body.action === "schedule_update") {
      Object.assign(
        schedules.find((s) => s.id === body.id),
        body,
      );
      data = { ok: true };
    } else if (body.action === "schedule_toggle") {
      Object.assign(
        schedules.find((s) => s.id === body.id),
        { enabled: body.enabled },
      );
      data = { ok: true };
    } else if (body.action === "decision") {
      const run = runs.find((r) => r.id === body.id);
      run.status = body.decision === "approved" ? "completed" : "rejected";
      data = { run };
    } else data = { ok: true };
  } else if (url.pathname.endsWith("ao_workspaces")) data = { id: workspace };
  else if (url.pathname.endsWith("ao_resources")) {
    if (init?.method === "POST") {
      resources.push({
        ...body,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      });
      data = null;
    } else data = resources;
  } else if (url.pathname.endsWith("ao_runs")) data = runs;
  else if (url.pathname.endsWith("ao_schedules")) data = schedules;
  return Response.json(data);
};
test("Interface: todas as abas, exemplo, atualização, aprovação, fluxo e agenda", async () => {
  const user = userEvent.setup();
  render(React.createElement(ThemeProvider, null, React.createElement(App)));
  try {
    await screen.findByText("Seu próximo agente já está pronto.");
    const nav = screen.getByRole("navigation", { name: "Navegação principal" });
    for (const name of [
      "Tarefas",
      "Agentes",
      "Fluxos",
      "Skills",
      "Instruções",
      "Memória",
      "Code Assist",
      "Integrações",
      "Auditoria",
      "Configurações",
      "Biblioteca",
      "Agendamentos",
      "Monitoramento",
      "Aprovações",
    ]) {
      fireEvent.click(
        within(nav).getByRole("button", { name: new RegExp("^" + name) }),
      );
      await screen.findByRole("heading", { level: 1, name });
      await waitFor(() =>
        assert.ok(!screen.queryByText("Carregando área do workspace…")),
      );
    }
    fireEvent.click(within(nav).getByRole("button", { name: "Biblioteca" }));
    fireEvent.click(
      (await screen.findAllByRole("button", { name: "Experimentar" }))[0],
    );
    const dialog = await screen.findByRole("dialog");
    assert.ok(
      within(dialog).getByRole("textbox", { name: "Dados de entrada" }),
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Executar exemplo" }),
    );
    await screen.findByRole("heading", { level: 1, name: "Tarefas" });
    assert.equal(calls.filter((c) => c.action === "create").length, 1);
    assert.equal(
      calls.filter((c) => c.action === "advance").length,
      0,
      "frontend não processa etapas",
    );
    runs[0].status = "waiting_approval";
    runs[0].steps = [
      {
        agent: "data-quality",
        name: "Guardião",
        content: "Resultado calculado",
        tokens: 0,
        completed_at: new Date().toISOString(),
      },
    ];
    fireEvent.click(screen.getByRole("button", { name: "Atualizar dados" }));
    fireEvent.click(within(nav).getByRole("button", { name: "Aprovações" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Aceitar entrega" }),
    );
    await screen.findByText("Todas as entregas foram revisadas");
    assert.equal(runs[0].status, "completed");
    fireEvent.click(within(nav).getByRole("button", { name: "Fluxos" }));
    fireEvent.click(await screen.findByRole("button", { name: "Novo fluxo" }));
    await user.type(
      screen.getByRole("textbox", { name: "Nome" }),
      "Fluxo de homologação",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Conteúdo" }),
      "Fluxo de um agente para validação",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Agente da etapa 1" }),
      resources[0].id,
    );
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await screen.findByRole("heading", { name: "Fluxo de homologação" });
    assert.equal(resources.at(-1).config.agent_ids[0], resources[0].id);
    fireEvent.click(within(nav).getByRole("button", { name: "Agendamentos" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Novo agendamento" }),
    );
    await user.type(
      screen.getByRole("textbox", { name: "Nome" }),
      "Agenda de homologação",
    );
    fireEvent.click(screen.getByRole("button", { name: "Salvar agendamento" }));
    await screen.findByText("Agenda de homologação");
    assert.equal(schedules.length, 1);
    fireEvent.click(
      screen.getByRole("button", { name: "Pausar Agenda de homologação" }),
    );
    await screen.findByRole("button", { name: "Ativar Agenda de homologação" });
    assert.equal(schedules[0].enabled, false);
    fireEvent.click(
      screen.getByRole("button", { name: "Ativar Agenda de homologação" }),
    );
    await screen.findByRole("button", { name: "Pausar Agenda de homologação" });
    assert.equal(schedules[0].enabled, true);
    fireEvent.click(
      screen.getByRole("button", { name: "Editar Agenda de homologação" }),
    );
    await screen.findByRole("dialog");
    await user.clear(screen.getByRole("textbox", { name: "Nome" }));
    await user.type(
      screen.getByRole("textbox", { name: "Nome" }),
      "Agenda revisada",
    );
    fireEvent.click(screen.getByRole("button", { name: "Salvar agendamento" }));
    await screen.findByText("Agenda revisada");
    assert.equal(schedules[0].name, "Agenda revisada");
    fireEvent.click(screen.getByRole("button", { name: "Tema escuro" }));
    assert.equal(document.documentElement.dataset.theme, "dark");
  } finally {
    cleanup();
    supabase.auth.stopAutoRefresh();
    dom.window.close();
  }
});
