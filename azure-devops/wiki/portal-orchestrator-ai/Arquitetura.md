> Fonte canônica: `docs/architecture/SDD.md`. Projeção de 26/09/2026.

# SDD — Portal Orchestrator AI

Status: implementado, com limites descritos. Revisão: 26/09/2026. Versão: 2.0.

## Responsabilidades

| Componente | Implementação | Responsabilidade |
|---|---|---|
| Interface | React, TypeScript e Vite | Catálogo, composição sequencial, agendas, monitoramento, revisão e exportação |
| Identidade | Supabase Auth | Sessão individual, cadastro e login |
| Dados | Postgres e RLS | Isolamento por proprietário, snapshots e histórico |
| API | Edge Function `agent-orchestrator` | Validação, autorização e criação idempotente |
| Fila | `ao_runs`, estado `queued` | Trabalho persistente aguardando reserva |
| Despachante | Cron + pg_net + Vault | Chamada autenticada a cada minuto |
| Worker | Edge Function, uma etapa por lease | Regras determinísticas ou chamada de IA com timeout |
| Revisão | Transição condicional de estado | Aceitar/rejeitar resultados sem efeitos externos implícitos |

A primeira etapa de uma solicitação manual é também iniciada em background. A continuidade é responsabilidade do servidor. O navegador atualiza os registros a cada cinco segundos e não executa o laço de processamento.

## Navegação e contratos

Visão geral, Tarefas, Biblioteca, Agentes, Fluxos, Agendamentos, Monitoramento, Aprovações, Skills, Instruções, Memória, Code Assist, Integrações, Auditoria e Configurações. A área selecionada é preservada no fragmento da URL. Modais usam foco controlado e rótulos acessíveis. As identidades visuais aprovadas permanecem locais.

Fluxos usam um editor de até quatro etapas com seleção de agentes. Cada job preserva instruções e contexto. A Biblioteca oferece três automações por regras e um exemplo de fluxo com IA; os modos são identificados explicitamente. O modo demonstração anterior continua sendo texto fixo identificado.

A API implementa `create`, `templates`, `schedule_create`, `schedule_update`, `schedule_toggle`, `decision`, `cancel`, `retry`, `advance`, `recover`, além de bootstrap, health, credenciais e leitura de código. UUID de criação é a chave idempotente. Reexecutar cria outro job com o snapshot original; pode consumir novamente tokens. Agendas não acumulam backlog de ocorrências perdidas.

## Segurança

- `auth.getUser` revalida a sessão em cada chamada de usuário; consultas privilegiadas verificam `owner_id`.
- RLS e grants limitam os dados visíveis. Clientes não atualizam diretamente estados, etapas ou agendas.
- Token de worker existe apenas no Vault e no transporte interno. RPCs operacionais são exclusivas de `service_role`.
- Credenciais de provedores ficam cifradas em `orchestrator_private`; a rotação da chave de serviço ainda exige recadastro das credenciais.
- Cancelamento invalida o lease; uma resposta tardia não sobrescreve o estado cancelado.
- Segredos, dados de clientes e payloads completos não entram na documentação ou logs de entrega.
- O arquivo `billing_legacy` não é exposto pela API do portal. Objetos fiscais não integram o produto.

## Limites operacionais

Até 30 tarefas por conta nas últimas 24 horas, uma ativa por conta, quatro etapas por fluxo, 1.600 tokens de saída por etapa de IA e timeout de 60 segundos por chamada ao provedor. Até 20 agendas por conta, com frequências de uma hora, seis horas, um dia ou uma semana. O despachante reserva até três jobs por chamada. Esses limites não constituem orçamento financeiro rígido.

Etapas interrompidas falham após três minutos e preservam os resultados anteriores. A reexecução é explícita. As métricas cobrem as últimas 100 execuções; auditoria carrega os últimos 200 eventos. Tokens não são convertidos em cobrança estimada sem tabela de preços verificada.

## Evolução planejada

Compartilhamento organizacional, memberships, RBAC, ambientes separados, cobrança de assinatura, SSO, motor de grafos, containers isolados para código, ferramentas MCP reais, filas transacionais de negócio, busca vetorial e integração SDA. O cadastro de projetos ou MCP não é apresentado como executor disponível. O runtime atual é adequado a automações curtas e agentes de geração; não oferece hospedagem de código arbitrário nem SLA empresarial validado.

## Evidências

[Modelo de dados](https://github.com/RPA-Automatic/portal-orchestrator-ai/blob/main/docs/data/control-plane-model.md), [ADR de execução](https://github.com/RPA-Automatic/portal-orchestrator-ai/blob/main/docs/decisions/ADR-0002-execucao-autonoma.md), [homologação de 26/09](https://github.com/RPA-Automatic/portal-orchestrator-ai/blob/main/docs/quality/release-2026-09-26.md) e [diagrama](https://github.com/RPA-Automatic/portal-orchestrator-ai/blob/main/docs/architecture/diagrams/control-execution-plane.mmd).
