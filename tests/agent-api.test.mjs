import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";
import { webcrypto } from "node:crypto";
const registry = JSON.parse(
  await readFile(new URL("../agents/registry.json", import.meta.url), "utf8"),
);
const source = await readFile(
  new URL("../supabase/functions/agent-orchestrator/index.ts", import.meta.url),
  "utf8",
);
const js = ts.transpile(source.replace(/^import .+;$/gm, ""), {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.None,
});
const uid = "11111111-1111-4111-8111-111111111111",
  ws = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  id = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
function app({ key = false, providerFailure = false } = {}) {
  const rows = {
    ao_workspaces: [{ id: ws, owner_id: uid }],
    ao_runs: [],
    ao_memory: [],
  };
  let handler,
    providerCalls = 0;
  const db = {
    auth: {
      getUser: async (token) => ({
        data: { user: token === "valid" ? { id: uid } : null },
        error: token === "valid" ? null : {},
      }),
    },
    from(table) {
      let patch = null;
      const filters = [];
      let max = Infinity;
      const q = {
        select() {
          return q;
        },
        eq(k, v) {
          filters.push((r) => r[k] === v);
          return q;
        },
        in(k, v) {
          filters.push((r) => v.includes(r[k]));
          return q;
        },
        lt(k, v) {
          filters.push((r) => r[k] < v);
          return q;
        },
        order() {
          return q;
        },
        limit(v) {
          max = v;
          return q;
        },
        update(p) {
          patch = p;
          return q;
        },
        async maybeSingle() {
          const r = rows[table].find((r) => filters.every((f) => f(r)));
          if (r && patch) Object.assign(r, patch);
          return { data: r ? structuredClone(r) : null, error: null };
        },
        then(resolve) {
          const matches = rows[table]
            .filter((r) => filters.every((f) => f(r)))
            .slice(0, max);
          if (patch) matches.forEach((r) => Object.assign(r, patch));
          return Promise.resolve({ data: matches, error: null }).then(resolve);
        },
      };
      return q;
    },
    async rpc(_name, p) {
      const row = {
        id: p.p_id,
        workspace_id: p.p_workspace,
        owner_id: p.p_owner,
        title: p.p_prompt,
        prompt: p.p_prompt,
        workflow: p.p_workflow,
        mode: p.p_mode,
        status: "queued",
        steps: [],
      };
      rows.ao_runs.push(row);
      return { data: structuredClone(row), error: null };
    },
  };
  vm.runInNewContext(js, {
    createClient: () => db,
    agents: registry,
    Deno: {
      env: {
        get: (k) =>
          k === "OPENAI_API_KEY" ? (key ? "test-only-key" : undefined) : "test",
      },
      serve: (f) => {
        handler = f;
      },
    },
    Request,
    Response,
    Set,
    Date,
    JSON,
    crypto: webcrypto,
    AbortSignal,
    fetch: async () => {
      providerCalls++;
      return new Response(
        JSON.stringify(
          providerFailure
            ? {}
            : {
                status: "completed",
                output: [
                  {
                    content: [
                      { type: "output_text", text: "Proposta de teste" },
                    ],
                  },
                ],
                usage: { total_tokens: 55 },
              },
        ),
        { status: providerFailure ? 429 : 200 },
      );
    },
  });
  return {
    rows,
    get providerCalls() {
      return providerCalls;
    },
    async call(body, token = "valid") {
      const response = await handler(
        new Request("https://test.local", {
          method: "POST",
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify(body),
        }),
      );
      return { status: response.status, body: await response.json() };
    },
  };
}
const create = {
  action: "create",
  id,
  workspace_id: ws,
  prompt: "Desenhe uma automação com revisão humana.",
  workflow: "rpa",
  mode: "demo",
};
test("registry used by backend equals versioned agent definitions", async () =>
  assert.deepEqual(
    JSON.parse(
      await readFile(
        new URL(
          "../supabase/functions/agent-orchestrator/registry.json",
          import.meta.url,
        ),
      ),
    ),
    registry,
  ));
test("unauthenticated and invalid sessions fail closed", async () => {
  const a = app();
  assert.equal((await a.call({ action: "health" }, "")).status, 401);
  assert.equal((await a.call(create, "invalid")).status, 401);
  assert.equal(a.rows.ao_runs.length, 0);
});
test("four demo steps persist and require exactly one human decision", async () => {
  const a = app();
  assert.equal((await a.call(create)).status, 200);
  await a.call(create);
  assert.equal(a.rows.ao_runs.length, 1);
  assert.equal(
    (await a.call({ action: "decision", id, decision: "approved" })).status,
    409,
  );
  for (let i = 0; i < 4; i++) {
    const r = await a.call({ action: "advance", id });
    assert.equal(r.status, 200);
    assert.equal(r.body.run.steps.length, i + 1);
  }
  assert.equal(a.rows.ao_runs[0].status, "waiting_approval");
  assert.equal(a.providerCalls, 0);
  assert.equal(
    (await a.call({ action: "decision", id, decision: "approved" })).body.run
      .status,
    "completed",
  );
  assert.equal(
    (await a.call({ action: "decision", id, decision: "rejected" })).status,
    409,
  );
});
test("cross-owner access and workspace spoofing rejected", async () => {
  const a = app();
  assert.equal((await a.call({ ...create, workspace_id: id })).status, 403);
  await a.call(create);
  a.rows.ao_runs[0].owner_id = "another-user";
  assert.equal((await a.call({ action: "advance", id })).status, 404);
  assert.equal((await a.call({ action: "cancel", id })).status, 404);
});
test("OpenAI requires server secret and never returns it", async () => {
  const a = app();
  assert.equal((await a.call({ ...create, mode: "openai" })).status, 409);
  const b = app({ key: true });
  const h = await b.call({ action: "health" });
  assert.equal(h.body.openai, true);
  assert.ok(!JSON.stringify(h).includes("test-only-key"));
  await b.call({ ...create, mode: "openai" });
  const r = await b.call({ action: "advance", id });
  assert.equal(r.body.run.steps[0].tokens, 55);
  assert.equal(b.providerCalls, 1);
});
test("provider failure persists failure and is not automatically retried", async () => {
  const a = app({ key: true, providerFailure: true });
  await a.call({ ...create, mode: "openai" });
  assert.equal((await a.call({ action: "advance", id })).status, 502);
  assert.equal(a.rows.ao_runs[0].status, "failed");
  await a.call({ action: "advance", id });
  assert.equal(a.providerCalls, 1);
});
test("cancellation prevents advancing and unknown decision is rejected", async () => {
  const a = app();
  await a.call(create);
  assert.equal(
    (await a.call({ action: "decision", id, decision: "release_shipment" }))
      .status,
    400,
  );
  await a.call({ action: "cancel", id });
  assert.equal(
    (await a.call({ action: "advance", id })).body.run.status,
    "cancelled",
  );
  assert.equal(a.providerCalls, 0);
});
