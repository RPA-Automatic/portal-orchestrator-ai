# Portal Orchestrator AI

Portal pessoal de agentes e automações, com interface em português, frontend React/TypeScript na Netlify e backend Supabase.

- Aplicação: https://portal-orchestrator-ai.netlify.app
- Repositório: RPA-Automatic/portal-orchestrator-ai. A `main` publica produção; a `dev` recebe integração contínua.
- Supabase: projeto `lvsocwetuhhqxlwyfdrw`.

## Começar

1. Abra a aplicação e entre ou crie uma conta. Se solicitado, confirme o e-mail.
2. Acesse Integrações e cadastre sua chave OpenAI para executar com IA. O token GitHub com permissão Contents: read habilita a consulta ao repositório privado no Code Assist.
3. Na visão geral, descreva o objetivo e escolha Demonstração ou IA.
4. Acompanhe as etapas em Tarefas, revise os textos produzidos e aceite ou rejeite a entrega. Baixe os resultados em Markdown.

As credenciais dos plugins do ChatGPT não são transferidas automaticamente para a aplicação. A chave publicável Supabase no frontend não é secreta; RLS e validação de sessão protegem os dados.

## Implementado

| Módulo | Comportamento |
|---|---|
| Autenticação | Supabase Auth, e-mail/senha, cadastro e encerramento de sessão |
| Workspace | Criado no primeiro acesso; dados isolados por proprietário |
| Tarefas | Persistência, fila, processamento sequencial, cancelamento, recuperação de etapa interrompida |
| Agentes | CRUD e instruções personalizadas; snapshot por execução |
| Fluxos | Sequência de até quatro agentes; `config.agent_ids` define a ordem |
| Skills e instruções | CRUD; até oito blocos de contexto incluídos no snapshot |
| Memória | Cadastro, leitura e exclusão; três memórias recentes usadas por etapa de IA |
| Code Assist | Consulta de diretórios e arquivos da branch dev, inclusão do arquivo no objetivo |
| Aprovações | Aceitar/rejeitar entregas, transições condicionais no banco |
| Auditoria | Histórico de estados gerado por trigger; sem permissão de escrita pelo cliente |
| Integrações | OpenAI Responses no backend, GitHub Contents API, cadastro de metadados MCP |
| Segurança | RLS, credenciais cifradas AES-GCM em schema privado, validação de sessão em cada chamada |

## Limites desta entrega

Esta implementação é a primeira versão operacional do SDD, não a implementação integral de todas as capacidades futuras. Os agentes produzem textos e propostas de código; não executam shell, testes de projetos ou alterações de repositório. Aceitar uma entrega não cria um PR ou um deploy. Os recursos MCP e projetos são cadastros de configuração; descoberta/execução de ferramentas MCP, workers isolados, agendamentos, filas transacionais RPA, embeddings e múltiplos provedores ainda precisam de runtime próprio. A memória usa recência, não busca vetorial.

O processamento de etapas é iniciado pelo frontend e cada chamada é concluída no backend. Fechar a aba pode deixar etapas subsequentes na fila; use Continuar execução. Uma etapa interrompida pode ser marcada como falha após dois minutos. Não há worker contínuo instalado. A interface consulta alterações a cada dez segundos; não utiliza Realtime nesta versão.

O modo Demonstração produz textos fixos identificados e não consome IA. O modo IA requer chave e saldo no provedor; até 30 tarefas por dia, uma ativa por usuário, até quatro etapas e até 1.600 tokens de saída por etapa. Esses limites não constituem limite financeiro rígido.

## Desenvolvimento

Requer Node 22.13+. A suíte usa `tsx` para carregar os módulos TypeScript da Edge Function de forma consistente no desenvolvimento e no CI.

```bash
npm ci
npm run dev
npm run build
npm test
```

`src/components` contém telas e componentes; `src/lib` contém contratos e acesso autenticado. A API está em `supabase/functions/agent-orchestrator`, dividida em catálogo, credenciais, GitHub e execução. Os comentários escritos nesta entrega estão em pt-BR. A primeira migração foi recuperada do histórico existente, preservando o conteúdo original.

## Backend e deploy

As migrações `20260906002918` e `20260909232214` correspondem ao histórico do projeto. Não reaplique migrações já registradas. Em um projeto novo, aplique ambas na ordem e ajuste o endereço/chave publicável do cliente e os domínios CORS/CSP.

```bash
supabase link --project-ref lvsocwetuhhqxlwyfdrw
supabase db push
supabase functions deploy agent-orchestrator --no-verify-jwt
```

`verify_jwt=false` mantém o comportamento anterior da função. A função valida explicitamente o token de usuário com `auth.getUser` antes de qualquer operação. Nunca remova essa validação. As funções SQL de acesso a segredos e criação de execução são concedidas somente à role de serviço.

O modelo é configurado no segredo `OPENAI_MODEL` do backend (fallback existente `gpt-4.1-mini`). A chave pode ser cadastrada pelo usuário no portal; `OPENAI_API_KEY` no servidor permanece como fallback global. A criptografia deriva uma chave da credencial de serviço gerenciada pelo Supabase; sua rotação exige recadastro das credenciais. Para ambientes corporativos, migre para um KMS com versionamento de chaves.

Netlify: build `npm run build`, publish `dist`, configuração em `netlify.toml`. O site está ligado à `main`. Um fluxo GitHub Actions manual publica a `main` quando os segredos `NETLIFY_AUTH_TOKEN` e `NETLIFY_SITE_ID` estiverem configurados no GitHub. Credenciais não foram adicionadas ao repositório.

## Referências

- [Índice documental](docs/README.md)
- [SDD atual](docs/architecture/SDD.md)
- [Catálogo de agentes](docs/product/agent-catalog.md)
- [Validação e pendências](docs/quality/validation.md)
- [Supabase Auth](https://supabase.com/docs/reference/javascript/auth-signinwithpassword)

Rollback: redeploy da versão anterior na Netlify; a função anterior está no histórico Supabase. Antes de desfazer migrations, exporte dados `ao_*`; não remova tabelas de outros processos do projeto compartilhado.
