import { getTemplate } from "./templates.ts";
import { snapshot } from "./catalog.ts";
import { credential } from "./credentials.ts";
export const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function validateInput(b: any) {
  if (
    !uuid.test(b.workspace_id || "") ||
    typeof b.prompt !== "string" ||
    b.prompt.trim().length < 12 ||
    b.prompt.length > 8000
  )
    throw new Error("Informe um objetivo entre 12 e 8.000 caracteres.");
  const template = b.template_id ? getTemplate(b.template_id) : undefined;
  if (b.template_id && !template) throw new Error("Exemplo não encontrado.");
  const mode = template?.mode || b.mode;
  if (
    !["demo", "openai", "builtin"].includes(mode) ||
    (!template && mode === "builtin")
  )
    throw new Error("Modo de execução inválido.");
  if (!["engineering", "rpa", "agro"].includes(b.workflow || "engineering"))
    throw new Error("Área inválida.");
  return { template, mode };
}
export async function prepareRun(db: any, owner: string, b: any) {
  const { template, mode } = validateInput(b);
  const { data: ws, error } = await db
    .from("ao_workspaces")
    .select("id")
    .eq("id", b.workspace_id)
    .eq("owner_id", owner)
    .maybeSingle();
  if (error || !ws) throw new Error("Workspace não autorizado.");
  if (mode === "openai" && !(await credential(db, owner, "openai")))
    throw new Error("Cadastre sua credencial de IA em Integrações.");
  const context =
    mode === "builtin"
      ? {
          agents: [
            {
              id: template!.id,
              name: template!.name,
              instructions: template!.description,
            },
          ],
          skills: [],
          version: "1.0",
        }
      : await snapshot(db, owner, b.workflow_id);
  return { mode, context, template: template?.id || null };
}
