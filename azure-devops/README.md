# Azure DevOps — Portal Orchestrator AI

Projeto: RPA Automatic. Épico: #87. [Wiki](https://dev.azure.com/rpa-automatic/RPA%20Automatic/_wiki/wikis/a872b434-77b1-4e65-ba18-923abf5021f1?pagePath=%2Fportal-orchestrator-ai).

A raiz permitida é `/portal-orchestrator-ai`. Fontes de publicação em `wiki/`, projeções revisadas de `docs/`; atualizar ambas quando o comportamento mudar.

O checkpoint de cada incremento material é planejado e aplicado por:

```bash
python3 scripts/devops_progress.py status
python3 scripts/devops_progress.py plan --summary "..." --detail "..." --validation "..." --commit "<sha-completo>" --next "..." --out .devops/progress-plan.json
python3 scripts/devops_progress.py apply --plan .devops/progress-plan.json --apply
```

O histórico é acrescentado ao Épico #87 com controle de revisão e marcador idempotente do commit. A automação não muda estado, responsável ou conclusão do card. A skill canônica está em `.agents/skills/azure-devops-progress-sync/SKILL.md`.

Publicador comum disponível por meio do wrapper local:

```bash
python3 scripts/publish_devops_wiki.py --config azure-devops/config.json
python3 scripts/publish_devops_wiki.py --config azure-devops/config.json --apply
```

Autenticação por Azure CLI ou variáveis de ambiente fora do Git. Se o repositório irmão não estiver disponível, usar a API Wiki 7.1 com ETag, mantendo a raiz deste produto.
