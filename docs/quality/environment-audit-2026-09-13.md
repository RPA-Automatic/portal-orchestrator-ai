# Auditoria de sincronização — GitHub, Netlify e Supabase

> Status: Em revisão  
> Responsável: @RodrigoFreitas16n91  
> Versão: 1.0  
> Última revisão: 2026-09-13  
> Próxima revisão: após promover a aplicação para produção e separar o banco
> Documentos relacionados: [Catálogo documental](../README.md)  

## Revalidação após o PR #2

- A `main` remota passou a conter a aplicação no merge `f7f4a44`.
- Em 13/09/2026, `https://portal-orchestrator-ai.netlify.app/` respondeu HTTP 200 com o HTML correto, assets Vite e os headers de segurança definidos em `netlify.toml`.
- O domínio de produção usa o projeto Supabase do Orchestrator (`lvsocwetuhhqxlwyfdrw`) no bundle atual.
- O alias de branch `dev--portal-orchestrator-ai.netlify.app` ainda serve o Portal de Faturamento e não deve ser usado como evidência do Orchestrator.
- A dependência Vite foi elevada para `8.3.0`; testes, build e `npm audit` passaram localmente antes da promoção seguinte.

## Resultado da auditoria inicial

O erro público foi reproduzido e sua causa foi identificada: a produção Netlify publicava uma versão da `main` que continha somente `README.md`. O build aparecia como `ready` porque havia publicado um deploy sem aplicação, resultando em HTTP 404. Esse estado histórico foi corrigido pelo PR #2 e pela nova publicação de produção descrita acima.

## GitHub

- Repositório: `RPA-Automatic/portal-orchestrator-ai`.
- Branch padrão: `main`.
- `main`: `fec6af3b8b456b3b9f3e367ca8ff12c42ff875a5`, somente com `README.md`.
- `dev`: `0aa9a8cefadb3cfd1eb542b1465238278a5bd3ec`, um commit à frente e contendo a aplicação.
- O workflow `Validar portal` concluiu com sucesso para esse commit de `dev`; `main` não possui execução de validação registrada.
- O checkout local `dev` corresponde ao `dev` remoto antes das mudanças documentais atuais.
- As mudanças de governança permanecem locais e ainda não estão no GitHub.

## Netlify

- Site: `portal-orchestrator-ai` (`3cf826f4-3476-4536-bbfa-d3ed54b9a448`).
- URL pública: https://portal-orchestrator-ai.netlify.app/ — respondeu HTTP 404.
- Deploy de produção: `6aa6c97031deb24c0572f277`, estado `ready`, branch `main`, commit `fec6af3`.
- O deploy detectou framework `unknown`, não processou redirects e não publicou aplicação.
- O branch deploy `dev--portal-orchestrator-ai.netlify.app` respondeu HTTP 200, mas o HTML é do **Portal de Faturamento — Biond**. Esse alias também está incorreto e não comprova deploy da branch GitHub atual.
- O deploy histórico `6aa1edc77c0ca1bb3ac6b07f`, de 2026-09-09, contém o HTML correto `Portal Orchestrator AI`, Vite, redirect e headers. Seu permalink permanece acessível e é um candidato verificável a rollback emergencial.
- As variáveis Netlify estão inconsistentes: o contexto `production` aponta para o Supabase de faturamento (`eukazz...`), enquanto branch deploy/preview aponta para o Orchestrator (`lvsoc...`). O código atual de `dev` usa `lvsoc...`; a configuração de produção deve ser corrigida antes da promoção.

## Supabase

- Projeto: `Agent Orchestrator Portal` (`lvsocwetuhhqxlwyfdrw`).
- Estado: `ACTIVE_HEALTHY`, PostgreSQL 17 em `us-west-2`.
- Edge Function `agent-orchestrator`: ativa, versão 3, com autenticação customizada no código e `verify_jwt=false` preservado.
- As duas migrations `ao_*` do repositório constam no histórico remoto.
- O banco também contém sete migrations e tabelas do Portal Faturamento. Isso viola a separação de produtos e explica os achados de performance mistos.
- Segurança: proteção contra senhas vazadas desativada; schema privado de credenciais tem RLS sem policy de usuário, situação intencional se o acesso continuar exclusivo à role de serviço.
- Performance: 23 foreign keys sem índice de cobertura e índices ainda não usados; os achados devem ser separados por produto antes de qualquer otimização.

Referências de remediation: [RLS sem policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [proteção de senhas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) e [foreign keys sem índice](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys).

## Pendências remanescentes

1. Corrigir ou desativar o alias `dev` incorreto na configuração do site Netlify.
2. Confirmar no painel Netlify que variáveis antigas do projeto de faturamento não são consumidas por builds futuros.
3. Fazer backup e inventário das tabelas de faturamento em `lvsoc...`.
4. Aplicar as migrations de faturamento ao projeto correto e validar dados/RLS.
5. Somente com aprovação explícita e rollback remover do Orchestrator os objetos de faturamento e reconciliar o histórico de migrations.
6. Ativar proteção contra senhas vazadas no Supabase Auth após validar o impacto nas contas existentes.

## Validação local

- Testes com Node 24: 2/2 aprovados.
- TypeScript: aprovado.
- Build Vite 8.0.13: aprovado após instalar localmente o binding opcional do Rolldown omitido pelo npm do sistema; nenhum manifesto foi alterado por essa correção local.
- `npm audit`: nenhuma vulnerabilidade conhecida após atualizar Vite para 8.3.0.
