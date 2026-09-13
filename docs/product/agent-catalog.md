# Catálogo de agentes

> Status: Aprovado  
> Responsável: @RodrigoFreitas16n91  
> Versão: 1.0  
> Última revisão: 2026-09-13  
> Próxima revisão: quando um agente for adicionado, removido ou integrado  
> Documentos relacionados: [Catálogo documental](../README.md)  
> Fonte implementada: `supabase/functions/agent-orchestrator/registry.json`

## Agentes internos atuais

| Agente | ID | Responsabilidade | Entrada | Saída | Estado |
|---|---|---|---|---|---|
| Atlas | `planner` | Planejamento, etapas e critérios de aceite | Objetivo e contexto | Plano em Markdown | Implementado |
| Nova | `architect` | Arquitetura, contratos e isolamento | Objetivo e entregas anteriores | Proposta arquitetural | Implementado |
| Flux | `automation` | Automação RPA, exceções e idempotência | Objetivo e contexto do fluxo | Procedimento ou código proposto | Implementado |
| Sentinel | `reviewer` | Qualidade, segurança e lacunas | Objetivo e entregas anteriores | Revisão crítica | Implementado |

Os quatro agentes geram conteúdo. Eles não executam shell, testes, commits, PRs, deploys ou ações em sistemas externos.

## Agente externo planejado

| Agente | Repositório | Responsabilidade | Entrada | Saída | Estado |
|---|---|---|---|---|---|
| Solution Design Architecture Agent | `RodrigoFreitas16n91/solution-design-architecture-agent` | Produzir e governar pacotes de arquitetura com rastreabilidade e aprovação | Solicitação versionada e referências autorizadas | Estado, SDD, ADRs, diagramas e evidências | Contrato documentado; integração não implementada |

O contrato planejado está em [`../integrations/solution-design-architecture-agent.md`](../integrations/solution-design-architecture-agent.md).

## Regra de atualização

Uma alteração de ID, capacidade, instrução-base ou estágio de integração deve atualizar este catálogo, o registry implementado quando aplicável e os testes correspondentes. Cadastro de metadados não significa disponibilidade de execução.
