import {
  Check,
  Download,
  Play,
  ShieldCheck,
  Square,
  RotateCcw,
} from "lucide-react";
import { invoke } from "../lib/supabase";
import type { Run } from "../lib/types";
import { Panel, Status, download, formatDate } from "./shared";
export function RunDetail({
  run,
  busy,
  onAdvance,
  onChange,
  notify,
  onSelect,
}: {
  run: Run;
  busy: boolean;
  onAdvance: (r: Run) => Promise<void>;
  onChange: () => Promise<void>;
  notify: (s: string) => void;
  onSelect?: (id: string) => void;
}) {
  async function act(action: string, decision?: string) {
    try {
      const result = await invoke<{ run: Run }>({
        action,
        id: run.id,
        decision,
        request_id: crypto.randomUUID(),
      });
      await onChange();
      if (action === "retry") onSelect?.(result.run.id);
    } catch (err) {
      notify((err as Error).message);
    }
  }
  return (
    <Panel title="Detalhes da execução" action={<Status value={run.status} />}>
      <div className="run-detail">
        <div className="run-meta">
          <code>{run.id.slice(0, 8)}</code>
          <span>{formatDate(run.created_at)}</span>
          <span>
            {run.mode === "demo"
              ? "Demonstração · sem IA"
              : run.mode === "builtin"
                ? "Automação por regras · servidor"
                : "IA · servidor"}
          </span>
        </div>
        <h3>{run.title}</h3>
        <p className="muted">{run.prompt}</p>
        <div className="progress">
          <div
            style={{
              width: `${Math.min((run.steps.length / (run.context_snapshot?.agents?.length || 4)) * 100, 100)}%`,
            }}
          />
        </div>
        <div className="run-meta">
          <span>{run.steps.length} etapas concluídas</span>
          <span>
            {run.steps
              .reduce((n, s) => n + s.tokens, 0)
              .toLocaleString("pt-BR")}{" "}
            tokens
          </span>
        </div>
        {run.error && <p className="notice error">{run.error}</p>}
        {run.steps.map((s, i) => (
          <details key={i} className="step" open={i === run.steps.length - 1}>
            <summary>
              <span className="step-check">
                <Check size={15} />
              </span>
              <strong>{s.name}</strong>
              <small>{formatDate(s.completed_at)}</small>
            </summary>
            <pre>{s.content}</pre>
            <button onClick={() => download(`${s.agent}.md`, s.content)}>
              <Download size={15} />
              Baixar entrega
            </button>
          </details>
        ))}
        {run.status === "waiting_approval" && (
          <div className="approval">
            <ShieldCheck />
            <div>
              <h3>Revisar a entrega</h3>
              <p>
                Aceitar registra sua decisão. Não publica código nem executa
                ações em sistemas externos.
              </p>
              <div className="button-row">
                <button onClick={() => void act("decision", "rejected")}>
                  Rejeitar
                </button>
                <button
                  className="primary"
                  onClick={() => void act("decision", "approved")}
                >
                  Aceitar entrega
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="button-row">
          {run.status === "queued" && (
            <button
              className="primary"
              disabled={busy}
              onClick={() => void onAdvance(run)}
            >
              <Play size={15} />
              Solicitar processamento
            </button>
          )}
          {["running", "queued"].includes(run.status) && (
            <button onClick={() => void act("cancel")}>
              <Square size={15} />
              Cancelar
            </button>
          )}
          {run.status === "running" && (
            <button onClick={() => void act("recover")}>
              <RotateCcw size={15} />
              Recuperar etapa interrompida
            </button>
          )}
          {["failed", "cancelled", "completed", "rejected"].includes(
            run.status,
          ) && (
            <button disabled={busy} onClick={() => void act("retry")}>
              <RotateCcw size={15} />
              Executar novamente
            </button>
          )}
          {run.steps.length > 0 && (
            <button
              onClick={() =>
                download(
                  `execucao-${run.id.slice(0, 8)}.md`,
                  run.steps.map((s) => s.content).join("\n\n---\n\n"),
                )
              }
            >
              <Download size={15} />
              Exportar todas as etapas
            </button>
          )}
        </div>
      </div>
    </Panel>
  );
}
