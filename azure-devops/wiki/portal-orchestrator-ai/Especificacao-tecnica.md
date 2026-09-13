> Projeção operacional revisada em 2026-09-13. `docs/` permanece canônico; esta árvore acompanha a promoção para a `main`. Recursos planejados não equivalem a implantação.

> Fonte: `docs/data/control-plane-model.md`

# Modelo de dados do control plane

> Status: Rascunho  
> Responsável: @RodrigoFreitas16n91  
> Versão: 0.2  
> Última revisão: 2026-09-13  
> Próxima revisão: antes da primeira migration multi-tenant  
> Documentos relacionados: Catálogo documental (`docs/README.md`)  
> Relacionados: `../architecture/SDD.md` (`docs/architecture/SDD.md`), `../decisions/ADR-0001-separacao-dos-portais.md` (`docs/decisions/ADR-0001-separacao-dos-portais.md`)

## Estado atual

As tabelas `ao_*` implementam workspaces individuais, recursos, memória, execuções, eventos e credenciais privadas. O schema atual é a autoridade para comportamento implementado; os grupos abaixo descrevem evolução planejada e não autorizam migrations.

## Tenancy e acesso — planejado

- `tenants`: organização isolada, status e limites.
- `environments`: alvo `dev`, `qa` ou `prod` dentro de um tenant.
- `tenant_members`: associação entre usuário, tenant, papel e status.
- `roles` e `role_permissions`: permissões explícitas por recurso e ação.

Tenant é a fronteira organizacional; ambiente é um alvo de execução dentro do tenant. Eles não são conceitos equivalentes.

## Definições — planejado

- `agents` e `agent_versions`: identidade, instruções, ferramentas, modelo, política, checksum e ciclo de vida.
- `processes` e `process_versions`: definição versionada, contrato de entrada/saída, timeout e retry.
- `process_releases`: promoção de uma versão para um ambiente, com aprovação.
- `integrations` e `integration_versions`: conexão, capacidade, saúde e referência de segredo.
- `assets` e `variables`: configurações tipadas; segredos permanecem apenas como referências.

## Execução — planejado

- `triggers` e `schedules`: início manual, por evento, webhook, polling, queue ou agenda.
- `jobs`: solicitação idempotente, estado, tentativa, timestamps e correlation ID.
- `job_steps`, `job_logs`, `job_artifacts` e `job_retries`: progresso observável e saídas seguras.
- `queues`, `queue_items` e `queue_item_events`: prioridade, lease atômico, deadline, retry e dead-letter.
- `audit_events`, `health_checks`, `webhook_deliveries` e `notifications`: governança operacional.

## Estados de referência

- Definições: `draft`, `testing`, `published`, `deprecated`, `disabled`.
- Jobs: `queued`, `running`, `waiting`, `succeeded`, `failed`, `cancel_requested`, `cancelled`, `timed_out`, `retrying`.
- Triggers: `disabled`, `armed`, `paused`, `error`.
- Queue items: `new`, `leased`, `processing`, `succeeded`, `failed`, `deferred`, `dead_letter`.

## Invariantes

- Todo recurso operacional futuro inclui `tenant_id`; recursos de execução incluem também `environment_id`.
- RLS deriva acesso de membership autenticada, nunca de papel fornecido pelo navegador.
- Tabelas em schemas expostos exigem RLS e políticas de autorização específicas.
- Segredos ficam em sistema gerenciado; o banco armazena referências e metadados.
- Definições publicadas são imutáveis; alterações criam nova versão.
- Eventos de auditoria são append-only para operadores comuns.
- Jobs usam idempotency key e queues usam lease atômico antes de processamento concorrente.

## Sequência de evolução

1. Formalizar tenancy, ambientes, memberships e papéis.
2. Versionar agentes, processos, integrações, assets e variáveis.
3. Introduzir jobs, steps, logs, artefatos, triggers e schedules.
4. Adicionar queues, health checks, notificações e retenção.
5. Validar índices, RLS, funções privilegiadas e testes de isolamento antes de expor APIs.

[Voltar ao produto](https://dev.azure.com/rpa-automatic/RPA%20Automatic/_wiki/wikis/a872b434-77b1-4e65-ba18-923abf5021f1?pagePath=%2Fportal-orchestrator-ai)
