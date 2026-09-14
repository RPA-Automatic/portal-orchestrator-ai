# Automação de progresso no Azure DevOps

Cada incremento material do Portal Orchestrator AI gera um checkpoint no histórico do Épico #87 depois de documentação, validação, commit e push. Conversas, hipóteses e tentativas sem entrega não geram registros.

O fluxo consulta a revisão real, cria um plano local, aplica uma atualização otimista e confere a nova revisão. Um marcador associado ao commit impede repetição. A atualização registra resumo, entregas, validações e próximo passo; não altera automaticamente estado, responsável, prazo, horas ou conclusão.

A skill `.agents/skills/azure-devops-progress-sync/SKILL.md` governa o processo. Os planos temporários ficam em `.devops/`, fora do Git. Credenciais vêm da sessão Azure ou de variáveis externas e nunca entram nos planos ou no repositório.

As páginas desta árvore são sincronizadas somente quando sua fonte canônica mudou. Um conflito de revisão ou transporte inconclusivo interrompe a escrita e exige nova consulta antes de repetir.
