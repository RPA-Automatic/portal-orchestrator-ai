# Estado atual — Portal Orchestrator AI

> Fonte canônica: `docs/quality/product-status-2026-09-13.md`

## Implementado

- Interface React/TypeScript/Vite com autenticação, tarefas, catálogos, memória, auditoria, Code Assist e temas.
- Control plane com Auth, PostgreSQL, RLS, workspaces individuais, snapshots, eventos e credenciais cifradas.
- Quatro agentes de geração: Atlas, Nova, Flux e Sentinel.
- Modo demonstração determinístico e modo IA no backend.
- CI e produção publicadas pela `main`.

## Modelo atual

O backend usa Responses API e `gpt-4.1-mini` como padrão configurável por `OPENAI_MODEL`. Todos os agentes usam o mesmo modelo. Roteamento, fallback e avaliação automática permanecem planejados.

## Planejado

- Tenants, ambientes, memberships, RBAC e versionamento.
- Workers, filas, retry, timeout, artefatos e execução durável.
- Gateway de modelos, gateway MCP, canvas e adapter do Solution Design Architecture Agent.

## Azure DevOps

Em 13/09/2026, o Épico #87 estava ativo, na coluna `Em andamento`, revisão 6 e sem cards filhos. A automação `azure-devops-progress-sync` registra cada incremento material validado no histórico e sincroniza esta wiki sem alterar automaticamente o estado ou a conclusão.
