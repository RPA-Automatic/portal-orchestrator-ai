# Validação da entrega

Data: 09/09/2026.

- Build local React/TypeScript/Vite concluído.
- Testes automatizados: caminhos sensíveis/traversal e isolamento criptográfico de usuário/provedor aprovados.
- Banco: usuários anônimos sem SELECT no catálogo; usuários autenticados sem acesso à RPC de credenciais e à RPC privilegiada de criação de runs.
- RLS do catálogo verificada em transação com usuários descartáveis e rollback.
- Edge Function `agent-orchestrator` publicada como versão 3.
- Netlify confirmou o deploy `6aa1edc77c0ca1bb3ac6b07f` como pronto.

## Limitações de validação

Não foi concluído login com a conta do proprietário, execução paga de IA ou consulta GitHub através da credencial pessoal do portal. Esses testes dependem das credenciais cadastradas em Integrações. A navegação autenticada na conta UiPath encontrou a tela de login; a referência funcional veio da documentação pública, não de dados privados da conta.

O verificador Supabase reportou proteção contra senhas vazadas desativada (configuração preexistente). O aviso informativo de RLS sem política no schema privado de credenciais é intencional: todo acesso de usuário é negado; somente o backend de serviço tem acesso.

[Configuração da proteção de senhas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Escopo ainda não concluído do SDD

Workers isolados, execução real de ferramentas MCP, alterações de código/PR por agente, agendamento, filas de itens transacionais, busca vetorial, múltiplos provedores e compartilhamento entre membros não estão ativos. Não interpretar cadastros ou propostas geradas como execução dessas operações.
