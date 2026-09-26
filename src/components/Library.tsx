import { useState } from "react";
import { Play, Search, CalendarClock, Bot, CheckCircle2 } from "lucide-react";
import { templates } from "../../supabase/functions/agent-orchestrator/templates";
import { invoke } from "../lib/supabase";
import type { Run } from "../lib/types";
import { Panel } from "./shared";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
export function Library({
  workspace,
  hasAI,
  onRun,
  onSchedule,
  notify,
}: {
  workspace: string;
  hasAI: boolean;
  onRun: (run: Run) => Promise<void>;
  onSchedule: (id: string) => void;
  notify: (s: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<(typeof templates)[number] | null>(
    null,
  );
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  async function run() {
    if (!selected) return;
    setBusy(true);
    try {
      const result = await invoke<{ run: Run }>({
        action: "create",
        id: crypto.randomUUID(),
        workspace_id: workspace,
        template_id: selected.id,
        prompt: input,
        workflow: "engineering",
        mode: selected.mode,
      });
      await onRun(result.run);
      setSelected(null);
      notify(
        "Execução recebida. O servidor continuará mesmo se você fechar a página.",
      );
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="view-toolbar">
        <p>
          Exemplos prontos para executar com seus próprios dados. Revise a
          entrada e acompanhe cada resultado.
        </p>
        <label className="search">
          <Search size={16} />
          <input
            aria-label="Buscar na biblioteca"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar exemplo…"
          />
        </label>
      </div>
      <div className="catalog-grid">
        {templates
          .filter((t) =>
            `${t.name} ${t.category}`
              .toLowerCase()
              .includes(query.toLowerCase()),
          )
          .map((t) => (
            <Panel key={t.id}>
              <div className="resource-top">
                <span className="agent-icon">
                  <Bot />
                </span>
                <span className="status">
                  {t.mode === "builtin"
                    ? "Automação por regras"
                    : "Agentes com IA"}
                </span>
              </div>
              <small className="eyebrow">{t.category}</small>
              <h3>{t.name}</h3>
              <p>{t.description}</p>
              <p className="muted">
                <CheckCircle2 size={14} />{" "}
                {t.mode === "builtin"
                  ? "Pronto · sem credencial de IA"
                  : "Usa sua credencial de IA"}
              </p>
              <div className="button-row">
                <button
                  className="primary"
                  onClick={() => {
                    setSelected(t);
                    setInput(t.input);
                  }}
                >
                  <Play size={15} />
                  Experimentar
                </button>
                <button onClick={() => onSchedule(t.id)}>
                  <CalendarClock size={15} />
                  Agendar
                </button>
              </div>
            </Panel>
          ))}
      </div>
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open && !busy) setSelected(null);
        }}
      >
        {selected && (
          <DialogContent className="catalog-dialog">
            <DialogTitle>{selected.name}</DialogTitle>
            <DialogDescription>{selected.description}</DialogDescription>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void run();
              }}
            >
              <label>
                Dados de entrada
                <textarea
                  rows={8}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  minLength={12}
                  maxLength={8000}
                  required
                />
              </label>
              {selected.mode === "openai" && !hasAI && (
                <p className="notice">
                  Cadastre sua credencial em Integrações para executar este
                  exemplo.
                </p>
              )}
              <p className="muted">
                {selected.mode === "builtin"
                  ? "O processamento usa regras determinísticas no servidor."
                  : "Os dados serão enviados ao provedor de IA configurado."}{" "}
                A entrega fica disponível para revisão.
              </p>
              <button
                className="primary"
                disabled={busy || (selected.mode === "openai" && !hasAI)}
              >
                {busy ? "Enviando…" : "Executar exemplo"}
              </button>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
