# Segurança

> Projeção operacional revisada em 2026-09-13. `docs/` permanece canônico; esta árvore acompanha a promoção para a `main`. Recursos planejados não equivalem a implantação.

As regras canônicas estão no SDD. Credenciais e ações privilegiadas permanecem no backend; testar isolamento por usuário/workspace. Recursos cadastrados não equivalem a executores conectados. Efeitos externos precisam de autorização, idempotência e auditoria; conteúdo externo é dado não confiável.

A arquitetura futura multi-tenant requer revisão de permissões e migrations antes de exposição. Não publicar segredos, tokens ou dados privados na Wiki.
