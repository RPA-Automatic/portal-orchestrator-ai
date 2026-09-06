# RPA Automatic · Agent OS

Portal de orquestração com HTML5, React, CSS responsivo, Supabase Auth/Postgres e quatro agentes integrados à OpenAI Responses API. O código inclui o modo demonstrativo explícito, memória contextual, histórico persistente, revisão humana e exportação Markdown.

Site: https://code-agent-orchestrator.rodrigo-freitas.chatgpt.site

## Executar

Node >=22.13. `npm ci` e `npm run dev`.

`npx tsc --noEmit`, `npm run lint`, `npm run build` e `node --test tests/*.test.mjs` validam a aplicação. A função em `supabase/functions/agent-orchestrator` é publicada separadamente no Supabase.

## Agentes

- Atlas: planejamento.
- Nova: arquitetura.
- Flux: automação RPA.
- Sentinel: qualidade e segurança.

Registro versionado em `agents/registry.json`. A integração real exige `OPENAI_API_KEY` nos segredos Supabase; não colocar a chave no frontend ou neste repositório. Sem chave, o modo demonstração permanece disponível e identificado. Os agentes geram propostas; ferramentas externas e execução de código não estão habilitadas.

## Documentos

- [Arquitetura](docs/architecture/ARCHITECTURE.md)
- [Operação](docs/runbooks/OPERATIONS.md)
- [AgroFlow](docs/architecture/AGROFLOW.md)
- [SDD original](public/docs/SDD.md)
- [Plano original do MVP](docs/IMPLEMENTATION_PLAN.md)

Apenas a migração nova `agent_os_foundation` se aplica ao Agent OS. As migrações antigas são referência em `supabase/legacy-migrations`.

## Limites atuais

Workspace individual por usuário; equipes/RBAC ainda pendentes. Processamento avança por requisições do navegador, sem fila durável. Aceitação não executa ações externas. AgroFlow é o contrato planejado para um produto separado. Antes de abertura comercial, executar o checklist de operação e homologação.
