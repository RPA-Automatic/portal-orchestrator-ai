# Contrato futuro — Solution Design Architecture Agent

> Status: Rascunho  
> Responsável: @RodrigoFreitas16n91  
> Versão: 0.1  
> Última revisão: 2026-09-13  
> Próxima revisão: antes da implementação  
> Documentos relacionados: [Catálogo documental](../README.md)  
> Relacionados: [`../product/agent-catalog.md`](../product/agent-catalog.md), [`../architecture/SDD.md`](../architecture/SDD.md)

## Declaração de estado

Este documento define comportamento desejado. Nenhum endpoint, webhook ou adapter descrito aqui está implementado ou disponível no Portal Orchestrator AI.

## Objetivo

Permitir que o portal registre o SDA como executor externo, envie uma solicitação de arquitetura, acompanhe seu processamento e receba artefatos sem acoplar o control plane ao Azure Durable Functions.

## Registro no catálogo

O adapter deverá declarar identificador estável, versão de contrato, capacidades, ambientes autorizados, health, método de autenticação e limites. O portal exibirá separadamente os estados `configured`, `reachable` e `executable`.

## Fluxo planejado

1. Usuário autorizado cria uma solicitação e aprova seu escopo.
2. O portal cria um job com `correlation_id` e `idempotency_key`.
3. O adapter autentica o workload e submete a referência do payload ao SDA.
4. O SDA confirma recebimento e informa um identificador externo.
5. O portal reconcilia estados por evento assinado ou consulta autenticada.
6. Artefatos são registrados por referência privada, checksum, tipo e classificação.
7. O usuário revisa e aprova ou rejeita o pacote; isso não implica deploy.

## Contrato lógico mínimo

### Solicitação

- versão do contrato;
- tenant, workspace e ambiente resolvidos no servidor;
- job ID, correlation ID e idempotency key;
- objetivo, escopo, referências autorizadas e critérios de aceite;
- callback ou estratégia de consulta previamente registrada;
- prazo e política de cancelamento.

### Estado

`accepted`, `running`, `waiting_input`, `waiting_approval`, `succeeded`, `failed`, `cancel_requested`, `cancelled`, `timed_out`.

### Resultado

- estado terminal e timestamps;
- resumo seguro e códigos de erro estáveis;
- artefatos com nome, tipo, URI privada, checksum e classificação;
- evidências e referências de auditoria;
- versão do agente e do contrato executados.

## Segurança

- Preferir identidade de workload ou OAuth com escopo mínimo; não transportar segredo pelo frontend.
- Resolver tenant e permissões no servidor.
- Assinar eventos e impedir replay por timestamp, nonce e idempotency key.
- Não enviar documentos privados por URL pública nem persistir conteúdo sensível em logs.
- Tratar prompts, anexos e resultados como dados não confiáveis.

## Falhas e reconciliação

- Timeout de transporte não confirma falha: consultar pela idempotency key antes de reenviar.
- Eventos duplicados são aceitos de forma idempotente.
- Estados fora de ordem não podem regredir um job terminal.
- Falha parcial preserva evidências já produzidas e registra causa segura.
- Cancelamento é solicitação até confirmação do executor.

## Critérios antes da implementação

- Definir mecanismo real de autenticação e propriedade dos endpoints.
- Versionar schema de payload e códigos de erro.
- Implementar testes de replay, duplicidade, timeout, autorização e isolamento.
- Definir retenção, observabilidade, SLA e responsáveis operacionais.
- Validar o contrato em DEV sem usar documentos privados de cliente.
