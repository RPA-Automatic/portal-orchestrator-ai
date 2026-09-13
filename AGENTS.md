# Portal Orchestrator AI

Trabalhe em português do Brasil. Leia `docs/README.md` e diferencie sempre capacidade implementada, planejada e hipotética.

## Regras do repositório

- O frontend atual é React/TypeScript/Vite; não o descreva como Next.js.
- Supabase é o control plane atual: Auth, Postgres, RLS e Edge Function.
- Mudanças de schema exigem migration versionada, revisão de RLS e validação em DEV.
- Nunca exponha `service_role`, `sb_secret_*`, tokens OpenAI/GitHub ou credenciais no frontend, Git ou logs.
- Não trate cadastros MCP, projetos ou integrações futuras como execução real.
- Efeitos externos exigem autenticação, autorização, idempotência, auditoria e aprovação conforme risco.
- Portal Faturamento é outro produto; respeite `docs/decisions/ADR-0001-separacao-dos-portais.md`.
- Atualize SDD, catálogo de agentes, contratos e ADRs quando seu estado mudar.

## Validação

Execute `npm test` e `npm run build` para mudanças relevantes. Documente o que foi realmente executado e riscos remanescentes.
