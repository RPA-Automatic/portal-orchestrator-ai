# ADR-0001 — Separação entre Portal Faturamento e Portal Orchestrator AI

> Status: Aprovado  
> Responsável: @RodrigoFreitas16n91  
> Versão: 1.0  
> Última revisão: 2026-09-13  
> Próxima revisão: quando houver proposta de consolidação de repositórios
> Documentos relacionados: [Catálogo documental](../README.md)  

## Contexto

Uma proposta inicial considerava reaproveitar e substituir progressivamente o repositório `portal-faturamento`. O Portal Orchestrator AI passou a existir em repositório próprio e já possui domínio, frontend, backend e ciclo de entrega independentes.

## Decisão

Manter `portal-faturamento` e `portal-orchestrator-ai` como produtos e repositórios distintos. Padrões técnicos de React, Supabase, Netlify, segurança e documentação podem ser reutilizados, mas entidades, migrations, rotas e regras de negócio não serão migradas implicitamente entre os produtos.

## Consequências

- Nenhum conteúdo de faturamento será tratado como legado a remover do Portal Faturamento.
- O Orchestrator usa contratos provider-neutral e não incorpora OP, contratos TOTVS, Farol ou regras fiscais.
- Integrações entre os portais exigirão contrato explícito, autenticação, autorização e auditoria.
- A antiga proposta de repurpose fica substituída por este ADR.

## Validação

Os dois repositórios devem ter documentação, agentes, prompts e pipelines próprios. Uma busca no Portal Faturamento não deve encontrar especificações normativas do produto Orchestrator.
