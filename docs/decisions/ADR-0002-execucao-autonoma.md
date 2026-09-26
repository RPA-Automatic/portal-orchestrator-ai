# ADR-0002 — Execução autônoma e separação do domínio

Status: implementado em 26/09/2026.

A execução deixa de depender de chamadas sucessivas do navegador. A API registra objetivo e snapshot na mesma transação; `ao_runs` é a fila persistente. Um despachante Cron invoca a Edge Function a cada minuto. O worker reserva até três execuções com `FOR UPDATE SKIP LOCKED`, processa uma etapa por reserva e grava o resultado somente se o lease e o estado ainda forem válidos. A criação manual também solicita a primeira etapa em background.

Esta escolha utiliza a infraestrutura já disponível para etapas curtas. Não implanta containers nem LangGraph. Workers externos e outro motor continuam possíveis por evolução do contrato. A espera na fila sobrevive ao fechamento do navegador e ao reinício do executor. Uma etapa interrompida por mais de três minutos falha com histórico preservado; ela não é repetida automaticamente, pois o provedor pode ter cobrado a chamada anterior.

As agendas preservam o snapshot dos agentes. Editar o catálogo não muda uma agenda existente. Alterar nome, objetivo, frequência e próxima data é permitido. Para trocar agentes de uma agenda, criar outra configuração e pausar a antiga. Atrasos acumulados são coalescidos em uma ocorrência. Limites de conta são aplicados antes de criar jobs; agendas impedidas por limite ou tarefa ativa são adiadas por uma hora.

O endpoint de usuário valida sessão com Auth. O endpoint interno `tick` valida token aleatório de 256 bits guardado no Vault; não aceita sessão de usuário como credencial de worker. As RPCs de reserva, dispatch e segredos são exclusivas do serviço. O transporte de rede não fica acessível aos papéis do frontend.

As 22 tabelas fiscais/logísticas e três views existentes no projeto foram movidas para `billing_legacy`, sem exclusão de registros. As rotinas públicas daquele domínio foram arquivadas. O gatilho em `auth.users` mantém sua referência, mas sua rotina passa a retornar `NEW` sem criar perfis de faturamento. Isso evita alterar a propriedade das tabelas gerenciadas por Auth. O outro projeto Supabase não foi modificado.

Rollback: pausar `ao-autonomous-worker` antes de restaurar a Edge Function anterior. Preservar os dados `ao_*`. A reversão do arquivo fiscal exige mover objetos de volta a `public` e restaurar a implementação original de `handle_new_auth_user_profile` a partir do histórico anterior; nunca realizar isso como parte do rollback comum do frontend. As rotinas arquivadas não constituem uma API operacional.
