import { useRef, useState, type FormEvent } from "react";
import { Bot, BookOpen, Pencil, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { supabase } from "../lib/supabase";
import type { Resource, ResourceKind } from "../lib/types";
import { Empty, Panel } from "./shared";
const labels: Record<ResourceKind, string> = {
  agent: "agente",
  skill: "skill",
  instruction: "instrução",
  project: "projeto",
  workflow: "fluxo",
  mcp: "servidor MCP",
};
export function Catalog({
  kind,
  resources,
  owner,
  refresh,
  notify,
}: {
  kind: ResourceKind;
  resources: Resource[];
  owner: string;
  refresh: () => Promise<void>;
  notify: (s: string) => void;
}) {
  const [editing, setEditing] = useState<Partial<Resource> | null>(null);
  const catalogTrigger = useRef<HTMLButtonElement | null>(null);
  const [busy, setBusy] = useState(false);
  const rows = resources.filter((r) => r.kind === kind);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const config = JSON.parse(String(f.get("config") || "{}"));
      if (!config || Array.isArray(config) || typeof config !== "object")
        throw new Error("Use um objeto JSON para a configuração.");
      const data = {
        owner_id: owner,
        kind,
        name: String(f.get("name")),
        content: String(f.get("content")),
        config,
      };
      const { error } = editing?.id
        ? await supabase.from("ao_resources").update(data).eq("id", editing.id)
        : await supabase.from("ao_resources").insert(data);
      if (error) throw error;
      await refresh();
      setEditing(null);
      notify("Salvo no workspace.");
    } catch (err) {
      notify((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(r: Resource) {
    if (!window.confirm(`Excluir ${r.name}?`)) return;
    const { error } = await supabase
      .from("ao_resources")
      .delete()
      .eq("id", r.id);
    if (error) notify(error.message);
    else await refresh();
  }
  return (
    <>
      <div className="view-toolbar">
        <p>
          {kind === "agent"
            ? "Instruções especializadas usadas nas próximas execuções."
            : kind === "workflow"
              ? "Defina agent_ids com os IDs dos agentes, na ordem de execução (até 4)."
              : kind === "mcp"
                ? "Cadastre endpoints e políticas. A execução remota de ferramentas exige um worker autorizado."
                : "Contexto reutilizável para os seus projetos e agentes."}
        </p>
        <button
          className="primary"
          onClick={(event) => {
            catalogTrigger.current = event.currentTarget;
            setEditing({ config: {} });
          }}
        >
          <Plus size={16} />
          Novo {labels[kind]}
        </button>
      </div>
      <div className="catalog-grid">
        {rows.map((r, i) => (
          <Panel key={r.id}>
            <div className="resource-top">
              <span className={`agent-icon color-${i % 4}`}>
                {kind === "agent" ? <Bot /> : <BookOpen />}
              </span>
              <span className="status">
                {String(r.config.version || "1.0")}
              </span>
            </div>
            <h3>{r.name}</h3>
            <p className="clamp">{r.content}</p>
            <div className="resource-footer">
              <code title={r.id}>{r.id.slice(0, 8)}</code>
              <button
                aria-label={`Editar ${r.name}`}
                onClick={(event) => {
                  catalogTrigger.current = event.currentTarget;
                  setEditing(r);
                }}
              >
                <Pencil size={16} />
              </button>
              <button
                aria-label={`Excluir ${r.name}`}
                onClick={() => void remove(r)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </Panel>
        ))}
      </div>
      {!rows.length && (
        <Panel>
          <Empty
            title={`Nenhum ${labels[kind]} cadastrado`}
            detail="Crie o primeiro para personalizar seu workspace."
          />
        </Panel>
      )}
      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open && !busy) setEditing(null);
        }}
      >
        {editing && (
          <DialogContent
            className="catalog-dialog"
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              catalogTrigger.current?.focus();
            }}
          >
            <DialogTitle>
              {editing.id ? "Editar" : "Novo"} {labels[kind]}
            </DialogTitle>
            <DialogDescription>
              Personalize o conteúdo disponível no seu workspace.
            </DialogDescription>
            <form onSubmit={save}>
              <label>
                Nome
                <input
                  name="name"
                  defaultValue={editing.name}
                  required
                  minLength={2}
                  maxLength={120}
                  autoFocus
                />
              </label>
              <label>
                {kind === "agent" ? "Instruções do agente" : "Conteúdo"}
                <textarea
                  name="content"
                  defaultValue={editing.content}
                  rows={7}
                  required
                  maxLength={12000}
                />
              </label>
              <label>
                Configuração (JSON)
                <textarea
                  name="config"
                  defaultValue={JSON.stringify(editing.config || {}, null, 2)}
                  rows={4}
                />
              </label>
              <button className="primary" disabled={busy}>
                {busy ? "Salvando…" : "Salvar"}
              </button>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
