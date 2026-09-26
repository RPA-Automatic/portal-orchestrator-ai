import {
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
} from "lucide-react";
import type { Run, Schedule } from "../lib/types";
import { Panel, Empty, Status, formatDate, download } from "./shared";
export function Monitor({
  runs,
  schedules,
  onOpen,
  onFilter,
  updated,
}: {
  runs: Run[];
  schedules: Schedule[];
  onOpen: (id: string) => void;
  onFilter: (status: string) => void;
  updated: string;
}) {
  const finished = runs.filter((r) =>
    ["completed", "waiting_approval", "rejected", "failed"].includes(r.status),
  );
  const healthy = finished.filter((r) => r.status !== "failed").length;
  const tokens = runs.reduce(
    (n, r) => n + r.steps.reduce((sum, s) => sum + s.tokens, 0),
    0,
  );
  const metrics = [
    { label: "Na fila", status: "queued", icon: Clock },
    { label: "Em execução", status: "running", icon: Activity },
    {
      label: "Entregas em revisão",
      status: "waiting_approval",
      icon: CheckCircle2,
    },
    { label: "Falhas", status: "failed", icon: AlertTriangle },
  ];
  return (
    <>
      <div className="view-toolbar">
        <p>
          Últimas 100 execuções · atualizado{" "}
          {updated ? formatDate(updated) : "agora"} · atualização automática a
          cada 5 segundos
        </p>
        <button
          onClick={() =>
            download(
              "execucoes.json",
              JSON.stringify(
                runs.map(
                  ({ id, title, status, mode, created_at, finished_at }) => ({
                    id,
                    title,
                    status,
                    mode,
                    created_at,
                    finished_at,
                  }),
                ),
                null,
                2,
              ),
            )
          }
        >
          <Download size={16} />
          Exportar relatório
        </button>
      </div>
      <div className="metrics">
        {metrics.map((m) => (
          <button
            className="metric-action"
            key={m.status}
            onClick={() => onFilter(m.status)}
          >
            <Panel>
              <div className="metric-title">
                {m.label}
                <m.icon size={18} />
              </div>
              <strong className="metric-number">
                {runs.filter((r) => r.status === m.status).length}
              </strong>
              <small>Ver execuções →</small>
            </Panel>
          </button>
        ))}
      </div>
      <div className="split">
        <Panel title="Desempenho observado">
          <p className="integration-line">
            <span>Execuções sem falha técnica</span>
            <strong>
              {finished.length
                ? `${Math.round((healthy / finished.length) * 100)}%`
                : "Sem dados"}
            </strong>
          </p>
          <p className="integration-line">
            <span>Tokens registrados</span>
            <strong>{tokens.toLocaleString("pt-BR")}</strong>
          </p>
          <p className="integration-line">
            <span>Agendamentos ativos</span>
            <strong>{schedules.filter((s) => s.enabled).length}</strong>
          </p>
          <p className="muted">
            Métricas calculadas sobre os registros carregados. Consumo em tokens
            não representa valor faturado.
          </p>
        </Panel>
        <Panel title="Atenção operacional">
          {runs.filter((r) => r.status === "failed").length ? (
            runs
              .filter((r) => r.status === "failed")
              .slice(0, 5)
              .map((r) => (
                <button
                  className="team-agent"
                  key={r.id}
                  onClick={() => onOpen(r.id)}
                >
                  <AlertTriangle size={18} />
                  <div>
                    <strong>{r.title}</strong>
                    <small>{r.error}</small>
                  </div>
                </button>
              ))
          ) : (
            <Empty
              title="Nenhuma falha nas execuções carregadas"
              detail="Falhas e interrupções aparecerão aqui com acesso ao detalhe."
            />
          )}
        </Panel>
      </div>
      <Panel title="Atividade recente">
        {runs.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Execução</th>
                  <th>Estado</th>
                  <th>Etapas</th>
                  <th>Atualizada</th>
                </tr>
              </thead>
              <tbody>
                {runs.slice(0, 15).map((r) => (
                  <tr key={r.id}>
                    <td>
                      <button onClick={() => onOpen(r.id)}>{r.title}</button>
                    </td>
                    <td>
                      <Status value={r.status} />
                    </td>
                    <td>
                      {r.steps.length}/{r.context_snapshot?.agents?.length || 4}
                    </td>
                    <td>{formatDate(r.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="Nenhuma execução ainda" />
        )}
      </Panel>
    </>
  );
}
