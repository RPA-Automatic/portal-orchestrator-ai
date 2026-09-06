# Agent OS — operação e implantação

## Ambientes

- Sites: https://code-agent-orchestrator.rodrigo-freitas.chatgpt.site
- Supabase Agent OS: `lvsocwetuhhqxlwyfdrw`.
- Supabase faturamento: `eukazzizamxratkavcap`; confirmado ativo; a listagem atual não retornou tabelas no schema público. A tentativa de restauração informou que ele já estava ativo. Nenhuma tabela de faturamento foi alterada.
- GitHub: RPA-Automatic/portal-orchestrator-ai.

## Início

1. Abrir o portal e entrar com uma conta do Supabase do projeto Agent OS. A conta ChatGPT do Sites não substitui essa conta.
2. Se necessário, criar uma conta e confirmar o e-mail conforme a configuração do projeto.
3. Criar missão, selecionar workflow e modo de execução.
4. Abrir missão e iniciar os quatro agentes.
5. Revisar as saídas, aceitar/rejeitar a entrega e exportar os artefatos Markdown.

## Ativar OpenAI

O proprietário deve abrir https://supabase.com/dashboard/project/lvsocwetuhhqxlwyfdrw/functions/secrets e criar `OPENAI_API_KEY` com a chave da API do projeto OpenAI. Opcional: `OPENAI_MODEL` (default `gpt-4.1-mini`). Nunca usar a chave no chat, Git ou frontend. Não confundir uma assinatura ChatGPT com faturamento da API.

Após configurar o segredo, recarregar o portal e verificar Integrações. Executar uma tarefa sanitizada curta, conferir quatro respostas, tokens e exportação. Enquanto não houver chave válida, somente demonstração estará disponível. Configuração presente não prova saldo ou permissão do modelo; uma chamada real é necessária.

## Desenvolvimento

Node >=22.13, npm e o lockfile do repositório. `npm ci`, `npm run dev`. A função Edge é um serviço separado; desenvolvimento frontend aponta para o Supabase designado.

Validação: `npx tsc --noEmit`, `npm run lint`, `npm run build`, `node --test tests/*.test.mjs`. Os testes de RLS em `tests/rls.sql` usam transação e rollback.

A função Deno tem `deno.json` com dependência fixada. A cópia do registro de agentes deve coincidir com `agents/registry.json`. Modificações precisam ser publicadas no Supabase independentemente do frontend.

## Migrações

A migração Agent OS é aditiva. As migrações antigas do MVP foram movidas para `supabase/legacy-migrations/` como referência e NÃO devem ser aplicadas a este projeto. Não apagar nem reutilizar tabelas de contratos/faturamento existentes.

Antes de alterações futuras: backup/export, revisão de permissões, teste com dois usuários, aplicar migração e verificar advisors. Reversão requer exportar `ao_*` e remover somente objetos introduzidos, respeitando dependências.

## Operação de falhas

- Erro de login: verificar conta e confirmação de e-mail do projeto correto.
- Falha OpenAI: verificar segredo, saldo e modelo no painel do provedor. O portal não imprime resposta bruta do provedor nem segredos.
- Execução interrompida: reabrir a missão. Se queued, continuar; se running há mais de dois minutos, recuperar, revisar resultados e criar nova missão quando apropriado.
- Cancelamento: impede persistência posterior pelo compare-and-set; uma chamada já enviada ao provedor pode terminar e ser cobrada.
- Limites: 30 runs/dia/usuário e uma run ativa. A API não retenta chamadas OpenAI automaticamente.
- Aceitação: registra decisão humana; não dispara efeitos em outros sistemas.

## Antes de abrir aos clientes

Ainda necessários: SMTP de produção, recuperação de conta, proteção contra senhas vazadas (advisory detectado), MFA conforme público, RBAC compartilhado, observabilidade e retenção, backup/restauração ensaiado, limites monetários e testes de carga. O acesso do Sites permanece privado. Não apresentar esta versão como uma operação comercial totalmente endurecida.

Referência de proteção de senhas: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
