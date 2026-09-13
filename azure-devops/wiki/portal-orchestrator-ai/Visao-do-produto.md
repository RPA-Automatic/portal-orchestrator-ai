> Projeção operacional revisada em 2026-09-13. `docs/` permanece canônico; esta árvore acompanha a promoção para a `main`. Recursos planejados não equivalem a implantação.

> Fonte: `docs/product/product-spec.md`

# Especificação do Produto — Portal Orchestrator AI

> Status: Em revisão  
> Responsável: @RodrigoFreitas16n91  
> Versão: 1.0  
> Última revisão: 2026-09-13  
> Próxima revisão: 2026-12-13  
> Documentos relacionados: Catálogo documental (`docs/README.md`)  
> Relacionados: `../architecture/SDD.md` (`docs/architecture/SDD.md`), `agent-catalog.md` (`docs/product/agent-catalog.md`)

## Visão

O Portal Orchestrator AI é um control plane para registrar, governar, executar e observar agentes de IA, integrações e automações. A experiência combina um cockpit operacional com composição visual de fluxos, mantendo os executores substituíveis e os efeitos externos sujeitos a políticas e aprovação humana.

## Princípios

- Um ponto de controle para agentes, integrações, fluxos e histórico de execução.
- Isolamento por workspace hoje e evolução explícita para tenants e ambientes.
- Credenciais e operações privilegiadas somente no backend.
- Estado, logs seguros, correlation IDs e auditoria para toda execução.
- Definições versionadas e contratos neutros em relação ao provedor.
- Interface clara, acessível e orientada à operação, sem copiar implementações proprietárias.

## Estado do produto

### Implementado

- Autenticação Supabase e workspace individual protegido por RLS.
- Catálogo CRUD de agentes, fluxos, skills, instruções, projetos e metadados MCP.
- Execuções sequenciais de até quatro agentes, modos demonstração e OpenAI.
- Aprovação ou rejeição humana, cancelamento, recuperação e auditoria de estados.
- Code Assist de leitura via GitHub Contents API.
- Credenciais OpenAI/GitHub cifradas no backend.

### Planejado

- Cockpit operacional ampliado e canvas visual para composição de fluxos.
- Tenants, membros, papéis e ambientes `dev`, `qa` e `prod`.
- Jobs assíncronos com workers contínuos, filas, schedules, triggers e artefatos.
- Descoberta e execução real de ferramentas MCP.
- Integração do Solution Design Architecture Agent como executor externo.

### Hipóteses a validar

- Contratos universais conseguem representar automações RPA, agentes e APIs sem acoplamento ao provedor.
- A combinação cockpit + canvas reduz o esforço operacional sem esconder estados e falhas.
- O modelo multi-tenant poderá evoluir do workspace atual sem migração destrutiva.

## Áreas de navegação-alvo

Visão geral, Tarefas/Jobs, Agentes, Fluxos/Processos, Triggers, Schedules, Queues, Assets, Variáveis, Integrações, Logs, Auditoria e Administração.

## Casos de uso prioritários

1. O builder registra e versiona um agente ou fluxo.
2. O operador inicia uma execução e acompanha suas etapas.
3. O revisor aprova ou rejeita uma entrega antes de qualquer efeito externo.
4. O administrador verifica auditoria e desabilita uma integração comprometida.
5. Um executor externo recebe trabalho por contrato assíncrono e devolve estado e artefatos.

## Fora do escopo atual

- Reimplementar mecanismos proprietários de UiPath, Automation Anywhere ou Blue Prism.
- Armazenar segredos no frontend, Git, logs ou colunas de uso comum.
- Executar código arbitrário sem isolamento, limites e aprovação.
- Apresentar registros de configuração como integrações já funcionais.

## Critérios do próximo marco

- O usuário distingue claramente recursos configurados, conectados e executáveis.
- Uma execução apresenta estado, etapas, saída segura, falha, retry e auditoria.
- O contrato do SDA pode ser implementado sem alterar o modelo central de jobs.
- Todos os recursos futuros de tenant e ambiente têm autorização definida antes da exposição no frontend.

[Voltar ao produto](https://dev.azure.com/rpa-automatic/RPA%20Automatic/_wiki/wikis/a872b434-77b1-4e65-ba18-923abf5021f1?pagePath=%2Fportal-orchestrator-ai)
