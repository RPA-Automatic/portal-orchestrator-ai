# Operação do runtime

Revisão: 26/09/2026.

1. O usuário cadastra sua credencial de IA em Integrações ou usa um exemplo por regras.
2. Cria agentes e ordena até quatro deles em Fluxos. As instruções devem descrever saídas de texto; ferramentas externas ainda não são executadas.
3. Inicia uma tarefa ou agenda sua repetição. Fechar o navegador não interrompe o despacho.
4. Consulta Monitoramento para fila, falhas, tokens e agendas ativas. Abre Tarefas para etapas e exportação.
5. Aceita ou rejeita resultados em Aprovações. Essa decisão não publica código, não envia mensagens e não altera sistemas externos.

## Diagnóstico

- Na fila por mais de alguns minutos: verificar `cron.job`, `cron.job_run_details` e status das respostas em `net._http_response` sem registrar headers de autenticação.
- Falha de IA: verificar credencial, saldo e disponibilidade; reexecutar somente após revisar o custo potencial.
- Agenda adiada: verificar tarefa ativa e limite diário. A próxima tentativa ocorre em uma hora.
- Troca de agentes de agenda: criar outra agenda, que preservará o novo snapshot, e pausar a anterior.
- Interrupção de etapa: o lease expira operacionalmente após três minutos e o job falha. A reexecução cria novo ID e preserva o histórico.

## Deploy e rollback

Aplicar migrations na ordem registrada no histórico e publicar `agent-orchestrator` com `verify_jwt=false`, pois a função valida explicitamente a sessão ou o token interno. Nunca remover essas verificações. `deno.json` precisa ser enviado como import map.

O build de produção usa `npm run build`, publica `dist` e deve corresponder à `main`. A UI e o backend foram desenhados para conviver durante a promoção. Em rollback do backend, pausar antes o job Cron `ao-autonomous-worker`. Preservar jobs e agendas; não desfazer schemas com exclusão de dados.

O schema `billing_legacy` é arquivo reversível. Não reativar suas rotinas ou seu gatilho Auth como parte de rollback comum. O runtime atual não depende desse schema.
