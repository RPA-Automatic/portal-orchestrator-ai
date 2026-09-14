# Validação da entrega

> Status: Em revisão  
> Responsável: @RodrigoFreitas16n91  
> Versão: 1.0  
> Última revisão: 2026-09-13  
> Próxima revisão: após a próxima entrega funcional
> Documentos relacionados: [Catálogo documental](../README.md)  

Data: 09/09/2026.

- Build local React/TypeScript/Vite concluído.
- Testes automatizados: caminhos sensíveis/traversal e isolamento criptográfico de usuário/provedor aprovados.
- Banco: usuários anônimos sem SELECT no catálogo; usuários autenticados sem acesso à RPC de credenciais e à RPC privilegiada de criação de runs.
- RLS do catálogo verificada em transação com usuários descartáveis e rollback.
- Edge Function `agent-orchestrator` publicada como versão 3.
- Netlify confirmou o deploy `6aa1edc77c0ca1bb3ac6b07f` como pronto.

## Revalidação de promoção — 13/09/2026

- A `main` recebeu a aplicação pelo PR #2 e a URL de produção respondeu HTTP 200 com o título `Portal Orchestrator AI`.
- A resposta de produção incluiu CSP, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` e política de referência.
- Vite atualizado de `8.0.13` para `8.3.0`; `npm audit` passou sem vulnerabilidades conhecidas.
- Testes automatizados: 2/2 aprovados com Node 24.19.0.
- TypeScript e build Vite de produção aprovados.
- Workflows de validação passaram a cobrir `main` e `dev`; a publicação manual da Netlify usa a `main`.

## Limitações de validação

### Revisão visual — 13/09/2026

- Node 24.19.0: `npm test` aprovado (4 testes, incluindo 40 combinações de preferência/sistema/armazenamento no script de tema) e `npm run build` aprovado.
- Navegador: login e dashboard nos temas claro/escuro; preferência preservada ao recarregar; sugestões preenchem objetivo e área; catálogo abre com dados existentes na fixture.
- Diálogo: foco inicial no nome, Tab contido no modal, Escape fecha e restaura foco ao botão de edição. Navegação móvel abre e fecha ao selecionar uma área.
- Revisão responsiva local, incluindo larguras de 320 px, 390 px e 768 px, sem overflow horizontal da página. Tabelas mantêm sua própria rolagem horizontal.
- `tests/visual.html` e `tests/visual.ts` são uma fixture de desenvolvimento com sessão fictícia em memória e chamadas de API simuladas. Não são entradas de build nem recursos publicados em `dist/`; não validam operações reais no Supabase.
- Assets PNG originais preservados. Cabeçalho horizontal, rodapé compacto e manifesto/kit da marca atualizados.

Não foi concluído login com a conta do proprietário, execução paga de IA ou consulta GitHub através da credencial pessoal do portal. Esses testes dependem das credenciais cadastradas em Integrações.

O verificador Supabase reportou proteção contra senhas vazadas desativada (configuração preexistente). O aviso informativo de RLS sem política no schema privado de credenciais é intencional: todo acesso de usuário é negado; somente o backend de serviço tem acesso. O CLI local não estava autenticado nesta revalidação; nenhuma migration ou Edge Function foi alterada remotamente.

[Configuração da proteção de senhas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Escopo ainda não concluído do SDD

Workers isolados, execução real de ferramentas MCP, alterações de código/PR por agente, agendamento, filas de itens transacionais, busca vetorial, múltiplos provedores e compartilhamento entre membros não estão ativos. Não interpretar cadastros ou propostas geradas como execução dessas operações.

## Privacidade e assinatura da marca — 2026-09-13

Implementado: cartão comparativo removido, integrações com nomes funcionais, fontes locais, CSP restrita e frase do rodapé “Qual é o próximo passo? Você decide. A gente faz acontecer.”. Relatório dos três projetos em [Revisão LGPD](../security/lgpd-review-2026-09-13.md).

Validação executada: `npm test` (quatro testes), `npm run build` (TypeScript e Vite), inspeção da página Integrações e do rodapé com a fixture sintética local; viewport de 390 px sem transbordamento horizontal. Não houve cadastro de credencial nem execução de IA paga. Consultas remotas de privacidade foram somente de metadados, sem gravações. Não houve teste completo de exclusão/retencão ou certificação LGPD.
