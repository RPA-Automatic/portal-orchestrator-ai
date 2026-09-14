# Estado atual — Portal Orchestrator AI

> Status: Aprovado
> Responsável: @RodrigoFreitas16n91
> Versão: 1.0
> Última revisão: 2026-09-13
> Próxima revisão: após o próximo incremento material
> Documentos relacionados: [Catálogo documental](../README.md)

## Exemplos e agentes

O portal oferece duas sugestões de entrada: automatizar um processo e desenhar uma solução técnica. O modo demonstração usa quatro respostas fixas e transparentes para validar persistência, sequência e aprovação sem consumo de IA. A fixture visual usa dados exclusivamente sintéticos, com duas execuções e os mesmos quatro agentes do registry real.

| Agente | Papel atual | Estado |
|---|---|---|
| Atlas | Planejamento e critérios de aceite | Implementado |
| Nova | Arquitetura, contratos e isolamento | Implementado |
| Flux | Automação RPA, exceções e idempotência | Implementado |
| Sentinel | Revisão de qualidade e segurança | Implementado |

Esses agentes geram texto em sequência. Não executam código, testes, commits, deploys, ferramentas MCP ou alterações no Azure DevOps. O Solution Design Architecture Agent possui contrato documentado, mas seu adapter ainda não está implementado no portal.

## Modelo de IA

O backend usa a Responses API. O modelo padrão no código é `gpt-4.1-mini` e pode ser substituído pelo segredo operacional `OPENAI_MODEL`. Hoje todos os agentes de uma execução usam o mesmo modelo; não existe roteamento por capacidade, fallback entre modelos ou avaliação automática de qualidade. O modo IA exige credencial no servidor e envia objetivo, instruções, até três memórias recentes e etapas anteriores; a chamada usa `store: false`.

## Arquitetura

| Camada | Implementado | Planejado |
|---|---|---|
| Interface | React 19, TypeScript, Vite, temas, autenticação, tarefas, catálogos, memória, auditoria e Code Assist | Canvas visual e cockpit operacional ampliado |
| Control plane | Auth, PostgreSQL, RLS, workspaces individuais, recursos, snapshots, eventos e credenciais cifradas | Tenants, ambientes, memberships, RBAC e versões imutáveis |
| Execução | Edge Function; uma etapa por chamada; modo demonstração e IA; revisão humana | Workers isolados, filas, retry, timeout, artefatos e execução durável |
| Integrações | Geração de texto no backend e leitura controlada de repositório | Gateway de modelos, gateway MCP e adapter do agente de arquitetura |
| Operação | CI, deploy pela `main`, eventos de estado e health básico | Métricas, traces, alertas, retenção e reconciliação completa |

## Azure DevOps verificado

Consulta real em 13/09/2026: Épico #87, revisão 6, estado `Active`, coluna `Em andamento`, responsável definido e links para repositório e wiki. Nenhum card filho foi retornado; Features, Stories e Tasks do produto ainda precisam ser estruturadas. A comparação da wiki encontrou cinco páginas locais desatualizadas antes deste incremento.

A skill `azure-devops-progress-sync` e o script `scripts/devops_progress.py` passam a registrar checkpoints materiais com resumo, evidências, commit e próximo passo, usando revisão otimista e marcador idempotente. Conversas e hipóteses não geram ruído no histórico.

## Próximas prioridades

1. Estruturar o backlog filho do Épico #87.
2. Corrigir ou desativar o alias de desenvolvimento da hospedagem, que ainda aponta para outro produto.
3. Implementar tenancy, papéis e ambientes com testes de isolamento.
4. Introduzir execução assíncrona durável com filas e workers.
5. Homologar o contrato e a autenticação do adapter do agente de arquitetura.
6. Definir roteamento de modelos, avaliações e limites antes de oferecer seleção avançada.
