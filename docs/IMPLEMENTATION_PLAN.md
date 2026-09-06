# Plano de implementação — Code Agent Orchestrator

## Objetivo da primeira entrega

Entregar um MVP demonstrável que transforme uma solicitação em um plano multiagente rastreável, execute um workflow determinístico, interrompa ações de maior risco para aprovação humana e apresente artefatos e eventos de auditoria.

## Estratégia de entrega

O trabalho está dividido em incrementos verticais. Cada incremento deve terminar com uma experiência demonstrável, contratos versionados e critérios de aceite verificáveis.

| Marco | Resultado | Estado |
| --- | --- | --- |
| M0 — Fundação | Projeto, contratos, migrações, políticas RLS e configuração de ambientes | Em andamento |
| M1 — Orquestração visível | Command center, criação de tarefa, plano, timeline, aprovação e artefatos simulados | Em andamento |
| M2 — Execução real | Gateway OpenAI-compatible, worker Python, skills e memória vetorial | Planejado |
| M3 — Code Assist e MCP | Leitura de repositório, diff, testes, MCP read-only e escrita reversível aprovada | Planejado |
| M4 — Hardening | RBAC, quotas, observabilidade, retenção, recuperação e avaliações | Planejado |

## Backlog priorizado

### P0 — obrigatório para o MVP

- [x] Definir contratos de tarefa, plano, execução, etapa, aprovação e artefato.
- [x] Criar esquema Supabase para workspaces, projetos, agentes, workflows e runs.
- [x] Aplicar RLS nas entidades pertencentes a um workspace.
- [x] Criar o command center responsivo com dados determinísticos de demonstração.
- [x] Implementar a máquina de estados da demonstração no frontend.
- [x] Exibir pausa explícita para aprovação antes de uma ação externa simulada.
- [x] Exibir timeline, progresso, artefatos e trilha de auditoria.
- [ ] Conectar Supabase Auth e substituir o estado local por persistência real.
- [ ] Implementar endpoints idempotentes para tarefas, planos, runs e decisões.
- [ ] Adicionar testes de RLS com usuários owner, member e unauthorized.

### P1 — execução de agentes

- [ ] Implementar o adaptador de modelo mock no backend.
- [ ] Implementar o gateway OpenAI-compatible com orçamento e timeout.
- [ ] Criar worker Python e protocolo de job assinado.
- [ ] Versionar skills e instruction sets.
- [ ] Registrar eventos em tempo real usando Supabase Realtime.
- [ ] Recuperar memória por projeto com pgvector e proveniência.

### P2 — integrações

- [ ] Integrar GitHub e Azure Repos em modo leitura.
- [ ] Gerar branch `agent/*`, diff e relatório de testes.
- [ ] Registrar e descobrir ferramentas MCP.
- [ ] Executar primeiro MCP R0 read-only.
- [ ] Criar draft PR somente após aprovação.
- [ ] Adicionar worker local para Ollama.

## Sequência recomendada de execução

1. Provisionar o projeto Supabase e aplicar as migrações em ambiente de desenvolvimento.
2. Conectar Auth ao command center e criar o workspace pessoal de Rodrigo.
3. Implementar `/api/tasks`, `/api/tasks/:id/plan`, `/api/runs` e `/api/approvals/:id/decision`.
4. Persistir a máquina de estados e publicar eventos por Realtime.
5. Substituir a simulação do frontend pelo adaptador mock no backend.
6. Criar testes de contrato, RLS e fluxo ponta a ponta.
7. Configurar preview no Netlify com variáveis públicas do Supabase.
8. Ensaiar a demonstração do Cubo Connect com dataset fixo e fallback gravado.

## Critérios de aceite do primeiro recorte

- O usuário consegue escrever uma tarefa e selecionar projeto e workflow.
- O plano exibe Intake, Architect, Implementer, Tester e Presenter.
- A execução avança por estados compreensíveis e mostra progresso.
- Uma ação externa é bloqueada até uma decisão humana.
- Aprovar conclui a execução e publica artefatos de demonstração.
- Rejeitar encerra a ação com um registro visível.
- O layout funciona em desktop e telas menores sem rolagem horizontal involuntária.
- O build de produção é concluído sem erro.

## Próxima decisão técnica

Conectar um projeto Supabase de desenvolvimento. São necessários `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e uma estratégia segura para funções administrativas; a service-role key nunca deve chegar ao navegador.
