import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import {
  executeBuiltin,
  templates,
} from "../supabase/functions/agent-orchestrator/templates.ts";
import { validateInput } from "../supabase/functions/agent-orchestrator/requests.ts";
const owner = "10000000-0000-4000-8000-000000000001",
  other = "10000000-0000-4000-8000-000000000002",
  workspace = "20000000-0000-4000-8000-000000000001";
const context = {
  agents: [{ id: "text-insights", name: "Analista de conteúdo" }],
  skills: [],
};
test("Exemplos calculam resultados e recusam entradas incorretas", () => {
  const quality = executeBuiltin("data-quality", templates[0].input);
  assert.match(quality, /Completude: 78%/);
  assert.match(quality, /ID duplicado/);
  assert.throws(() => executeBuiltin("data-quality", "{}"), /objetos JSON/);
  assert.throws(() => executeBuiltin("data-quality", "invalid"), /JSON válida/);
  const text = executeBuiltin("text-insights", "Automação automação dados.");
  assert.match(text, /Palavras: 3/);
  assert.match(text, /automação: 2/);
  const triage = executeBuiltin(
    "task-triage",
    "Solicitar acesso\nSistema indisponível",
  );
  assert.ok(triage.indexOf("P1") < triage.indexOf("P3"));
  assert.throws(() => executeBuiltin("unknown", "teste"), /não disponível/);
});
test("Entrada não escolhe executores arbitrários nem ignora o modo do exemplo", () => {
  const b = {
    workspace_id: workspace,
    prompt: "Objetivo sintético de validação",
    mode: "builtin",
  };
  assert.throws(() => validateInput(b), /Modo/);
  assert.throws(
    () => validateInput({ ...b, template_id: "unknown" }),
    /Exemplo/,
  );
  assert.equal(
    validateInput({ ...b, template_id: "data-quality", mode: "openai" }).mode,
    "builtin",
  );
  assert.throws(
    () => validateInput({ ...b, prompt: "a", mode: "demo" }),
    /objetivo/,
  );
});
test("DEV PostgreSQL: migrations, RLS, leases, snapshots, quotas e agendas", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`,
    );
    for (const file of [
      "20260906002918_agent_os_foundation.sql",
      "20260909232214_portal_resources_and_private_credentials.sql",
      "20260926162114_autonomous_runtime.sql",
    ])
      await db.exec(
        await readFile(
          new URL("../supabase/migrations/" + file, import.meta.url),
          "utf8",
        ),
      );
    await db.exec(
      (
        await readFile(
          new URL(
            "../supabase/migrations/20260926162622_runtime_hardening.sql",
            import.meta.url,
          ),
          "utf8",
        )
      ).split("-- pg_net")[0],
    );
    await db.exec(
      "create table public.contracts(id uuid primary key); create view public.v_contract_drilldown as select * from public.contracts;",
    );
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/20260926162239_isolate_billing_legacy.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    assert.equal(
      (await db.query("select to_regclass('public.contracts') as t")).rows[0].t,
      null,
    );
    assert.ok(
      (await db.query("select to_regclass('billing_legacy.contracts') as t"))
        .rows[0].t,
    );
    await db.query("insert into auth.users values ($1),($2)", [owner, other]);
    await db.query(
      "insert into ao_workspaces(id,owner_id,name) values($1,$2,'DEV workspace')",
      [workspace, owner],
    );
    const enqueue = async (id = crypto.randomUUID()) =>
      (
        await db.query(
          "select * from ao_enqueue_run($1,$2,$3,'Texto sintético para análise','engineering','builtin',$4,'text-insights')",
          [id, workspace, owner, JSON.stringify(context)],
        )
      ).rows[0];
    const first = await enqueue();
    assert.deepEqual(first.context_snapshot, context);
    assert.equal((await enqueue(first.id)).id, first.id);
    await assert.rejects(() => enqueue(), /active_run/);
    const claim = (await db.query("select * from ao_claim_runs()")).rows;
    assert.equal(claim.length, 1);
    assert.equal(claim[0].status, "running");
    assert.ok(claim[0].lease);
    assert.equal(
      (await db.query("select * from ao_claim_runs()")).rows.length,
      0,
    );
    await db.query(
      "update ao_runs set status='cancelled',lease=null where id=$1",
      [first.id],
    );
    assert.equal(
      (
        await db.query(
          "update ao_runs set status='waiting_approval' where id=$1 and status='running' and lease=$2 returning id",
          [first.id, claim[0].lease],
        )
      ).rows.length,
      0,
      "cancelamento vence resultado tardio",
    );
    const second = await enqueue();
    const steps = [
      {
        agent: "text-insights",
        name: "Analista",
        content: "Resultado real calculado",
        tokens: 0,
        completed_at: new Date().toISOString(),
      },
    ];
    await db.query(
      "update ao_runs set steps=$2,status='waiting_approval' where id=$1",
      [second.id, JSON.stringify(steps)],
    );
    assert.equal((await db.query("select * from ao_run_steps")).rows.length, 1);
    await db.query(
      "update ao_runs set status='completed' where id=$1 and status='waiting_approval'",
      [second.id],
    );
    assert.equal(
      (
        await db.query(
          "update ao_runs set status='rejected' where id=$1 and status='waiting_approval' returning id",
          [second.id],
        )
      ).rows.length,
      0,
    );
    await db.exec(
      `set role authenticated;select set_config('request.jwt.claim.sub','${other}',false);`,
    );
    for (const table of ["ao_runs", "ao_run_steps", "ao_schedules"])
      assert.equal(
        (await db.query(`select * from ${table}`)).rows.length,
        0,
        `${table} isola outro usuário`,
      );
    await assert.rejects(
      () => db.query("select * from ao_claim_runs()"),
      /permission denied/,
    );
    await assert.rejects(
      () => db.query("update ao_runs set status='completed'"),
      /permission denied/,
    );
    await db.exec(
      `select set_config('request.jwt.claim.sub','${owner}',false);`,
    );
    assert.equal((await db.query("select * from ao_runs")).rows.length, 2);
    await db.exec("reset role");
    await db.query(
      "insert into ao_schedules(owner_id,workspace_id,name,prompt,mode,context_snapshot,template_id,interval_minutes,next_run_at) values($1,$2,'Agenda DEV','Texto de entrada agendado','builtin',$3,'text-insights',60,now()-interval '1 minute')",
      [owner, workspace, JSON.stringify(context)],
    );
    assert.equal(
      (await db.query("select ao_dispatch_schedules() as n")).rows[0].n,
      1,
    );
    assert.equal(
      (await db.query("select ao_dispatch_schedules() as n")).rows[0].n,
      0,
      "agenda não duplica ocorrência",
    );
    const schedule = (await db.query("select * from ao_schedules")).rows[0];
    assert.ok(schedule.last_run_id);
    await db.exec(
      "update ao_runs set status='completed' where status='queued';update ao_schedules set enabled=false,next_run_at=now()-interval '1 minute'",
    );
    assert.equal(
      (await db.query("select ao_dispatch_schedules() as n")).rows[0].n,
      0,
    );
    for (let i = 0; i < 27; i++) {
      const r = await enqueue();
      await db.query("update ao_runs set status='completed' where id=$1", [
        r.id,
      ]);
    }
    await assert.rejects(() => enqueue(), /daily_limit/);
  } finally {
    await db.close();
  }
});
