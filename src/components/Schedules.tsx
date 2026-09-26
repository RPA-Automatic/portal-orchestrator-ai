import { useState, type FormEvent } from "react";
import { CalendarClock, Pause, Play, Plus, Pencil } from "lucide-react";
import { templates } from "../../supabase/functions/agent-orchestrator/templates";
import type { Resource, Schedule } from "../lib/types";
import { invoke } from "../lib/supabase";
import { Panel, Empty, formatDate } from "./shared";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
export function Schedules({
  items,
  workspace,
  resources,
  initialTemplate,
  onCreated,
  onOpenRun,
  notify,
}: {
  items: Schedule[];
  workspace: string;
  resources: Resource[];
  initialTemplate: string;
  onCreated: () => Promise<void>;
  onOpenRun: (id: string) => void;
  notify: (s: string) => void;
}) {
  const [open, setOpen] = useState(!!initialTemplate),
    [selected, setSelected] = useState(initialTemplate || templates[0].id),
    [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const template = templates.find((t) => t.id === selected);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await invoke({
        action: editing ? "schedule_update" : "schedule_create",
        id: editing?.id || crypto.randomUUID(),
        workspace_id: workspace,
        name: f.get("name"),
        prompt: f.get("prompt"),
        template_id: template?.id,
        workflow_id: template ? undefined : selected,
        workflow: "engineering",
        mode: template?.mode || "openai",
        interval_minutes: Number(f.get("interval")),
        next_run_at: new Date(String(f.get("start"))).toISOString(),
      });
      await onCreated();
      setOpen(false);
      notify("Agendamento salvo. A execução será iniciada pelo servidor.");
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function toggle(item: Schedule) {
    setBusy(true);
    try {
      await invoke({
        action: "schedule_toggle",
        id: item.id,
        enabled: !item.enabled,
      });
      await onCreated();
      notify(item.enabled ? "Agendamento pausado." : "Agendamento ativado.");
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const date = new Date(Date.now() + 120000);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
  return (
    <>
      <div className="view-toolbar">
        <p>
          Execute sem manter a página aberta. Horários exibidos no fuso do seu
          dispositivo.
        </p>
        <button
          className="primary"
          onClick={() => {
            setEditing(null);
            setSelected(templates[0].id);
            setOpen(true);
          }}
        >
          <Plus size={16} />
          Novo agendamento
        </button>
      </div>
      <Panel title="Agenda de automações">
        {items.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Agendamento</th>
                  <th>Frequência</th>
                  <th>Próxima execução</th>
                  <th>Última execução</th>
                  <th>Estado</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.name}</strong>
                      {s.last_error && (
                        <p className="notice error">{s.last_error}</p>
                      )}
                    </td>
                    <td>
                      {s.interval_minutes === 60
                        ? "A cada hora"
                        : s.interval_minutes === 360
                          ? "A cada 6 horas"
                          : s.interval_minutes === 1440
                            ? "Diariamente"
                            : "Semanalmente"}
                    </td>
                    <td>{s.enabled ? formatDate(s.next_run_at) : "Pausado"}</td>
                    <td>
                      {s.last_run_id ? (
                        <button onClick={() => onOpenRun(s.last_run_id!)}>
                          {formatDate(s.last_run_at!)}
                        </button>
                      ) : (
                        "Ainda não executado"
                      )}
                    </td>
                    <td>
                      <span className="status">
                        {s.enabled ? "Ativo" : "Pausado"}
                      </span>
                    </td>
                    <td>
                      <button
                        aria-label={`Editar ${s.name}`}
                        onClick={() => {
                          setEditing(s);
                          setSelected(s.template_id || "snapshot");
                          setOpen(true);
                        }}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        disabled={busy}
                        aria-label={`${s.enabled ? "Pausar" : "Ativar"} ${s.name}`}
                        onClick={() => void toggle(s)}
                      >
                        {s.enabled ? <Pause size={16} /> : <Play size={16} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Sua agenda começa aqui"
            detail="Escolha um exemplo ou um fluxo com IA e defina a frequência."
          />
        )}
      </Panel>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!busy) setOpen(v);
        }}
      >
        <DialogContent className="catalog-dialog">
          <DialogTitle>
            {editing ? "Editar agendamento" : "Novo agendamento"}
          </DialogTitle>
          <DialogDescription>
            Uma versão do fluxo será preservada para as próximas execuções.
            Limite de 30 tarefas por dia e uma ativa por conta.
          </DialogDescription>
          <form key={editing?.id || "new"} onSubmit={save}>
            <label>
              Automação
              <select
                disabled={!!editing}
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                {editing && !editing.template_id && (
                  <option value="snapshot">Fluxo preservado</option>
                )}
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
                {resources
                  .filter((r) => r.kind === "workflow")
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} · IA
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Nome
              <input
                name="name"
                defaultValue={editing?.name}
                required
                minLength={2}
                maxLength={120}
                placeholder="Verificação diária"
              />
            </label>
            <label>
              Dados ou objetivo
              <textarea
                key={selected}
                name="prompt"
                required
                minLength={12}
                maxLength={8000}
                rows={5}
                defaultValue={editing?.prompt || template?.input || ""}
              />
            </label>
            <div className="composer-options">
              <label>
                Frequência
                <select
                  name="interval"
                  defaultValue={editing?.interval_minutes || 1440}
                >
                  <option value="1440">Diariamente</option>
                  <option value="60">A cada hora</option>
                  <option value="360">A cada 6 horas</option>
                  <option value="10080">Semanalmente</option>
                </select>
              </label>
              <label>
                Primeira execução
                <input
                  type="datetime-local"
                  name="start"
                  required
                  defaultValue={
                    editing
                      ? new Date(
                          new Date(editing.next_run_at).getTime() -
                            new Date(editing.next_run_at).getTimezoneOffset() *
                              60000,
                        )
                          .toISOString()
                          .slice(0, 16)
                      : localDate
                  }
                />
              </label>
            </div>
            <button className="primary" disabled={busy}>
              <CalendarClock size={16} />
              {busy ? "Salvando…" : "Salvar agendamento"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
