# Diagramas

> Projeção operacional revisada em 2026-09-13. `docs/` permanece canônico; esta árvore acompanha a promoção para a `main`. Recursos planejados não equivalem a implantação.

## agent-promotion

Fonte: `docs/architecture/diagrams/agent-promotion.mmd`.

::: mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Testing: validar versão
    Testing --> Published: aprovação
    Testing --> Draft: correções
    Published --> Deprecated: nova versão
    Published --> Disabled: risco/incidente
    Deprecated --> Disabled
    Disabled --> [*]
    note right of Draft
      Fluxo planejado;
      ainda não implementado.
    end note
:::

## context

Fonte: `docs/architecture/diagrams/context.mmd`.

::: mermaid
graph LR
    Builder[Builder/operador] --> Portal[Portal Orchestrator AI]
    Reviewer[Revisor] --> Portal
    Portal --> Supabase[Supabase control plane]
    Supabase --> OpenAI[OpenAI adapter]
    Supabase --> GitHub[GitHub leitura]
    Supabase -. planejado .-> Workers[Workers e adapters]
    Workers -. planejado .-> External[Agentes, RPA, APIs e MCP]
:::

## control-execution-plane

Fonte: `docs/architecture/diagrams/control-execution-plane.mmd`.

::: mermaid
graph TB
    subgraph Control[Control plane]
      UI[React/Vite]
      Auth[Supabase Auth]
      DB[(PostgreSQL/RLS)]
      Edge[Edge Function]
      UI --> Auth
      UI --> Edge
      Edge --> DB
    end
    subgraph Execution[Execution plane]
      Current[Etapa por chamada do frontend]
      Queue[Queue durável - planejada]
      Worker[Worker isolado - planejado]
      Gateway[Model/MCP gateways - planejados]
      Queue -.-> Worker
      Worker -.-> Gateway
    end
    Edge --> Current
    Edge -. evolução .-> Queue
:::

## job-lifecycle

Fonte: `docs/architecture/diagrams/job-lifecycle.mmd`.

::: mermaid
sequenceDiagram
    actor User as Operador
    participant UI as Portal
    participant Edge as Edge Function
    participant DB as Supabase
    participant Model as Provedor
    User->>UI: Iniciar tarefa
    UI->>Edge: create run
    Edge->>DB: Validar sessão e criar snapshot
    loop Até quatro etapas
        UI->>Edge: processar próxima etapa
        Edge->>Model: gerar saída
        Model-->>Edge: resultado ou erro
        Edge->>DB: persistir etapa e evento
    end
    Edge-->>UI: waiting_approval
    User->>UI: Aprovar ou rejeitar
    UI->>Edge: decisão
    Edge->>DB: estado final e auditoria
:::

## sda-integration

Fonte: `docs/architecture/diagrams/sda-integration.mmd`.

::: mermaid
sequenceDiagram
    actor User as Usuário autorizado
    participant Portal as Portal Orchestrator
    participant Adapter as SDA adapter planejado
    participant SDA as Solution Design Architecture Agent
    User->>Portal: Aprovar solicitação
    Portal-->>Adapter: job + correlation + idempotency
    Adapter-->>SDA: Submeter referência autenticada
    SDA-->>Adapter: accepted + external_id
    loop Reconciliação planejada
        Adapter-->>SDA: Consultar status
        SDA-->>Adapter: estado e artefatos por referência
    end
    Adapter-->>Portal: resultado auditável
    Note over Portal,SDA: Integração não implementada
:::

