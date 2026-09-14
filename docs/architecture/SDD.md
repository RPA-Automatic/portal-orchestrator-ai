# SDD — Portal Orchestrator AI

> Status: Em revisão  
> Responsável: @RodrigoFreitas16n91  
> Versão: 1.0  
> Última revisão: 2026-09-13  
> Próxima revisão: 2026-12-13  
> Documentos relacionados: [Catálogo documental](../README.md)  
> Relacionados: [`../product/product-spec.md`](../product/product-spec.md), [`../data/control-plane-model.md`](../data/control-plane-model.md), [`../integrations/solution-design-architecture-agent.md`](../integrations/solution-design-architecture-agent.md)

## Objetivo e limites

O Portal Orchestrator AI coordena agentes, contexto, fluxos e aprovações em uma interface web. Esta versão do SDD diferencia capacidades comprovadas, evolução planejada e hipóteses. O código, as migrations e os testes prevalecem quando houver divergência.

## Estado implementado

### Frontend

- React 19, TypeScript e Vite, publicado na Netlify.
- Tailwind CSS 4, Button/Dialog do shadcn/ui com Radix UI e ícones Lucide. Temas claro/escuro/automático e identidade azul documentados em [Identidade visual](../product/brand.md).
- Áreas de catálogo, memória, execução, integrações e Code Assist carregadas sob demanda com React lazy/Suspense.
- SPA em português com autenticação, catálogo, tarefas, memória, Code Assist, integrações e auditoria.
- Polling periódico; não há assinatura Supabase Realtime ativa.

### Control plane

- Supabase Auth, PostgreSQL, RLS e Edge Function `agent-orchestrator`.
- Workspaces individuais, recursos `ao_*`, execuções sequenciais, snapshots, eventos e aprovação humana.
- Credenciais por usuário/provedor cifradas com AES-GCM em schema privado.
- Chamada OpenAI no backend e leitura do GitHub Contents API.

### Execution plane

- A Edge Function processa uma etapa por chamada iniciada pelo frontend.
- Modo demonstração é determinístico; modo IA requer credencial disponível.
- Não há worker contínuo, sandbox de código, executor RPA ou runtime MCP.

## Arquitetura-alvo planejada

- Control plane multi-tenant com ambientes, RBAC, versões e políticas.
- Execution plane assíncrono com workers isolados, filas, retry, timeout e artefatos.
- Model gateway e MCP gateway substituíveis.
- Canvas visual para composição e cockpit operacional para acompanhamento.
- Integrações por adapters, inclusive SDA, UiPath e APIs, sem dependência de contratos proprietários não documentados.

## Componentes e responsabilidades

| Componente | Estado | Responsabilidade |
|---|---|---|
| SPA React/Vite | Implementado | Interface, sessão e chamadas autenticadas |
| Supabase Auth/Postgres/RLS | Implementado | Identidade, persistência e isolamento atual |
| Edge Function | Implementado | Validação de sessão, credenciais e execução de etapas |
| OpenAI adapter | Implementado | Geração via Responses no backend |
| GitHub read adapter | Implementado | Leitura controlada de repositórios |
| Job service/queue | Planejado | Execução durável e assíncrona |
| Worker runtime | Planejado | Ferramentas e automações isoladas |
| MCP gateway | Planejado | Descoberta, política e invocação de tools |
| SDA adapter | Planejado | Submissão e acompanhamento de arquitetura |

## Contratos atuais

- O frontend obtém sessão Supabase e chama a Edge Function com token de usuário.
- A Edge Function revalida o usuário com `auth.getUser`.
- Fluxos referenciam até quatro IDs de agentes em ordem.
- Cada execução preserva snapshot dos agentes e contexto usado.
- Aprovação registra decisão, mas não cria PR, deploy ou efeito externo.

## Segurança e governança

- Nenhuma chave privilegiada pode entrar no bundle, Git ou logs.
- Tabelas expostas exigem RLS e autorização por proprietário/membership.
- Funções privilegiadas permanecem restritas à role de serviço.
- Saídas de agentes e conteúdo de repositórios são dados não confiáveis.
- Efeitos externos exigirão política, idempotência, auditoria e aprovação conforme risco.
- O modelo futuro de tenant não confiará em `tenant_id` informado apenas pelo cliente.

## Dados e evolução

O modelo implementado está nas migrations `supabase/migrations/`. O modelo futuro está descrito em [`../data/control-plane-model.md`](../data/control-plane-model.md) e só se torna implementado depois de migration, RLS, testes e validação em DEV.

## Falhas e recuperação

- Sessão inválida: negar a operação sem fallback privilegiado.
- Credencial ausente: manter execução não iniciada e orientar configuração.
- Etapa interrompida: permitir recuperação controlada após a janela existente.
- Fechamento da aba: etapas posteriores podem permanecer na fila; o usuário pode continuar.
- Provedor indisponível: registrar erro seguro sem expor credenciais ou payload sensível.
- Futuro executor externo: usar idempotency key, correlation ID, timeout e reconciliação por status.

## Observabilidade

Hoje existem eventos de mudança de estado e health básico de integrações. A evolução deverá incluir logs estruturados, métricas de fila/latência/erro, traces correlacionados, retenção e alertas sem conteúdo sensível.

## Diagramas

- [Contexto](diagrams/context.mmd) · [SVG](diagrams/context.svg)
- [Control plane e execution plane](diagrams/control-execution-plane.mmd) · [SVG](diagrams/control-execution-plane.svg)
- [Ciclo de um job](diagrams/job-lifecycle.mmd) · [SVG](diagrams/job-lifecycle.svg)
- [Versionamento e promoção](diagrams/agent-promotion.mmd) · [SVG](diagrams/agent-promotion.svg)
- [Integração futura com SDA](diagrams/sda-integration.mmd) · [SVG](diagrams/sda-integration.svg)

## Critérios de validação

- Build e testes atuais continuam aprovados.
- Documentos não apresentam recurso planejado como disponível.
- Mudanças de schema incluem migration, RLS e teste de isolamento.
- Integrações futuras têm contrato, autenticação, timeout, retry e auditoria antes da implementação.
- Decisões arquiteturais relevantes são registradas em ADR.
