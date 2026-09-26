import { createClient } from "@supabase/supabase-js";
import agents from "./registry.json" with { type: "json" };
import { credential, encrypt } from "./credentials.ts";
import { bootstrap } from "./catalog.ts";
import { readGithub } from "./github.ts";
import { templates } from "./templates.ts";
import { prepareRun, uuid } from "./requests.ts";
import { processPending } from "./execution.ts";
declare const EdgeRuntime: { waitUntil(job: Promise<unknown>): void };
const origins = new Set([
  "https://portal-orchestrator-ai.netlify.app",
  "https://dev--portal-orchestrator-ai.netlify.app",
  "http://localhost:5173",
  "http://localhost:5174",
]);
const background = (job: Promise<unknown>) =>
  EdgeRuntime.waitUntil(job.catch(() => undefined));
Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin") || "";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Vary: "Origin",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
  if (origins.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  const reply = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers });
  if (origin && !origins.has(origin))
    return reply({ error: "Origem não autorizada." }, 403);
  if (req.method === "OPTIONS")
    return new Response(null, { status: 204, headers });
  if (req.method !== "POST")
    return reply({ error: "Método não permitido." }, 405);
  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  try {
    const raw = await req.text();
    if (raw.length > 20000)
      return reply({ error: "Solicitação muito grande." }, 413);
    const b = JSON.parse(raw);
    if (b.action === "tick") {
      const token = req.headers.get("x-worker-token") || "";
      if (token.length !== 64)
        return reply({ error: "Worker não autorizado." }, 401);
      const check = await db.rpc("ao_verify_worker", { p_token: token });
      if (check.error || check.data !== true)
        return reply({ error: "Worker não autorizado." }, 401);
      const dispatch = await db.rpc("ao_dispatch_schedules");
      if (dispatch.error) throw dispatch.error;
      return reply(await processPending(db));
    }
    const token = req.headers.get("authorization")?.replace(/^Bearer /i, "");
    if (!token) return reply({ error: "Autenticação necessária." }, 401);
    const {
      data: { user },
      error: authError,
    } = await db.auth.getUser(token);
    if (authError || !user)
      return reply({ error: "Sessão inválida. Entre novamente." }, 401);
    if (b.action === "bootstrap") {
      await bootstrap(db, user.id);
      return reply({ ok: true });
    }
    if (b.action === "templates") return reply({ templates });
    if (b.action === "health")
      return reply({
        openai: !!(await credential(db, user.id, "openai")),
        github: !!(await credential(db, user.id, "github")),
        model: Deno.env.get("OPENAI_MODEL") || "gpt-4.1-mini",
        agents: agents.length,
        runtime: "scheduled",
        version: "2.0",
      });
    if (b.action === "credential") {
      if (
        !["openai", "github"].includes(b.provider) ||
        typeof b.value !== "string" ||
        b.value.trim().length < 10 ||
        b.value.length > 512
      )
        return reply({ error: "Credencial inválida." }, 400);
      const value = await encrypt(b.value.trim(), `${user.id}:${b.provider}`);
      const { error } = await db.rpc("ao_secret_set", {
        p_owner: user.id,
        p_provider: b.provider,
        p_value: value,
      });
      if (error) throw error;
      return reply({ ok: true });
    }
    if (b.action === "github_read") {
      try {
        return reply(
          await readGithub(b.path, await credential(db, user.id, "github")),
        );
      } catch {
        return reply(
          {
            error:
              "Não foi possível ler o arquivo. Verifique a credencial, o caminho e a permissão Contents: read.",
          },
          400,
        );
      }
    }
    if (b.action === "create" || b.action === "schedule_create") {
      if (!uuid.test(b.id || ""))
        return reply({ error: "Identificador inválido." }, 400);
      // Repetir a mesma solicitação retorna o registro existente, sem disparar outro job.
      const table = b.action === "create" ? "ao_runs" : "ao_schedules";
      const existing = await db
        .from(table)
        .select("*")
        .eq("id", b.id)
        .eq("owner_id", user.id)
        .maybeSingle();
      if (existing.data)
        return reply(
          b.action === "create"
            ? { run: existing.data }
            : { schedule: existing.data },
        );
      let prepared;
      try {
        prepared = await prepareRun(db, user.id, b);
      } catch (e) {
        return reply(
          { error: e instanceof Error ? e.message : "Entrada inválida." },
          400,
        );
      }
      if (b.action === "schedule_create") {
        if (
          typeof b.name !== "string" ||
          b.name.trim().length < 2 ||
          b.name.length > 120 ||
          ![60, 360, 1440, 10080].includes(b.interval_minutes)
        )
          return reply({ error: "Informe nome e frequência válidos." }, 400);
        const next = Date.parse(b.next_run_at);
        if (
          !Number.isFinite(next) ||
          next < Date.now() - 60000 ||
          next > Date.now() + 366 * 86400000
        )
          return reply({ error: "Escolha uma data futura válida." }, 400);
        const count = await db
          .from("ao_schedules")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", user.id);
        if ((count.count || 0) >= 20)
          return reply({ error: "Limite de 20 agendamentos por conta." }, 409);
        const { data, error } = await db
          .from("ao_schedules")
          .insert({
            id: b.id,
            owner_id: user.id,
            workspace_id: b.workspace_id,
            name: b.name.trim(),
            prompt: b.prompt.trim(),
            workflow: b.workflow || "engineering",
            mode: prepared.mode,
            context_snapshot: prepared.context,
            template_id: prepared.template,
            interval_minutes: b.interval_minutes,
            next_run_at: new Date(next).toISOString(),
          })
          .select()
          .single();
        if (error) throw error;
        return reply({ schedule: data });
      }
      const { data, error } = await db.rpc("ao_enqueue_run", {
        p_id: b.id,
        p_workspace: b.workspace_id,
        p_owner: user.id,
        p_prompt: b.prompt.trim(),
        p_workflow: b.workflow || "engineering",
        p_mode: prepared.mode,
        p_context: prepared.context,
        p_template: prepared.template,
      });
      if (error)
        return reply(
          {
            error:
              "Limite de 30 execuções/dia ou uma tarefa ativa atingido. Aguarde a conclusão e tente novamente.",
          },
          409,
        );
      background(processPending(db, data.id));
      return reply({ run: data }, 202);
    }
    if (b.action === "schedule_update") {
      const next = Date.parse(b.next_run_at);
      if (
        !uuid.test(b.id || "") ||
        typeof b.name !== "string" ||
        b.name.trim().length < 2 ||
        b.name.length > 120 ||
        typeof b.prompt !== "string" ||
        b.prompt.trim().length < 12 ||
        b.prompt.length > 8000 ||
        ![60, 360, 1440, 10080].includes(b.interval_minutes) ||
        !Number.isFinite(next) ||
        next < Date.now() - 60000 ||
        next > Date.now() + 366 * 86400000
      )
        return reply(
          { error: "Confira o nome, os dados, a frequência e a data futura." },
          400,
        );
      const { data, error } = await db
        .from("ao_schedules")
        .update({
          name: b.name.trim(),
          prompt: b.prompt.trim(),
          interval_minutes: b.interval_minutes,
          next_run_at: new Date(next).toISOString(),
          last_error: null,
        })
        .eq("id", b.id)
        .eq("owner_id", user.id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data
        ? reply({ schedule: data })
        : reply({ error: "Agendamento não encontrado." }, 404);
    }
    if (b.action === "schedule_toggle" || b.action === "schedule_delete") {
      if (!uuid.test(b.id || ""))
        return reply({ error: "Agendamento inválido." }, 400);
      if (b.action === "schedule_toggle" && typeof b.enabled !== "boolean")
        return reply({ error: "Estado inválido." }, 400);
      // Desativação reversível preserva o histórico de execução e as relações.
      const { data, error } = await db
        .from("ao_schedules")
        .update({ enabled: b.action === "schedule_delete" ? false : b.enabled })
        .eq("id", b.id)
        .eq("owner_id", user.id)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) return reply({ error: "Agendamento não encontrado." }, 404);
      return reply({ schedule: data });
    }
    if (!uuid.test(b.id || ""))
      return reply({ error: "Execução inválida." }, 400);
    const { data: run, error } = await db
      .from("ao_runs")
      .select("*")
      .eq("id", b.id)
      .eq("owner_id", user.id)
      .maybeSingle();
    if (error || !run) return reply({ error: "Execução não encontrada." }, 404);
    if (b.action === "decision") {
      if (!["approved", "rejected"].includes(b.decision))
        return reply({ error: "Decisão inválida." }, 400);
      const { data, error } = await db
        .from("ao_runs")
        .update({
          status: b.decision === "approved" ? "completed" : "rejected",
          decision: b.decision,
          decided_at: new Date().toISOString(),
        })
        .eq("id", run.id)
        .eq("status", "waiting_approval")
        .select()
        .maybeSingle();
      if (error || !data)
        return reply(
          { error: "A entrega já foi decidida ou ainda não está pronta." },
          409,
        );
      return reply({ run: data });
    }
    if (b.action === "cancel") {
      const { data } = await db
        .from("ao_runs")
        .update({
          status: "cancelled",
          lease: null,
          finished_at: new Date().toISOString(),
        })
        .eq("id", run.id)
        .in("status", ["queued", "running"])
        .select()
        .maybeSingle();
      return data
        ? reply({ run: data })
        : reply(
            { error: "Execução não pode ser cancelada neste estado." },
            409,
          );
    }
    if (b.action === "retry") {
      if (
        !["failed", "cancelled", "completed", "rejected"].includes(
          run.status,
        ) ||
        !uuid.test(b.request_id || "")
      )
        return reply({ error: "Selecione uma execução finalizada." }, 409);
      const { data, error } = await db.rpc("ao_enqueue_run", {
        p_id: b.request_id,
        p_workspace: run.workspace_id,
        p_owner: user.id,
        p_prompt: run.prompt,
        p_workflow: run.workflow,
        p_mode: run.mode,
        p_context: run.context_snapshot,
        p_template: run.template_id,
      });
      if (error)
        return reply(
          {
            error:
              "Aguarde a tarefa ativa ou o limite diário antes de executar novamente.",
          },
          409,
        );
      background(processPending(db, data.id));
      return reply({ run: data }, 202);
    }
    if (b.action === "advance" || b.action === "recover") {
      background(processPending(db, run.id));
      return reply({ run });
    }
    return reply({ error: "Ação desconhecida." }, 400);
  } catch {
    return reply({ error: "Não foi possível processar a solicitação." }, 400);
  }
});
