# Portal Orchestrator AI — contexto de engenharia

Use `docs/README.md` como índice e `AGENTS.md` como regra do projeto.

- Diferencie `Implementado`, `Planejado` e `Hipótese`.
- O stack atual é React/TypeScript/Vite, Supabase e Netlify.
- Nunca apresente catálogo MCP ou contrato futuro como integração executável.
- Mudanças Supabase exigem migration, RLS, validação de sessão no backend e teste de isolamento.
- Segredos nunca entram no frontend, Git ou logs.
- Atualize SDD, catálogo de agentes e ADRs quando contratos ou decisões mudarem.
- Valide com `npm test` e `npm run build` quando aplicável.
