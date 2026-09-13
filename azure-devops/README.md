# Azure DevOps — Portal Orchestrator AI

Projeto: RPA Automatic. Épico: #87. [Wiki](https://dev.azure.com/rpa-automatic/RPA%20Automatic/_wiki/wikis/a872b434-77b1-4e65-ba18-923abf5021f1?pagePath=%2Fportal-orchestrator-ai).

A raiz permitida é `/portal-orchestrator-ai`. Fontes de publicação em `wiki/`, projeções revisadas de `docs/`; atualizar ambas quando o comportamento mudar.

Publicador comum disponível no repositório irmão Portal Faturamento:

```bash
python3 ../portal-faturamento/scripts/publish_devops_wiki.py --config azure-devops/config.json
python3 ../portal-faturamento/scripts/publish_devops_wiki.py --config azure-devops/config.json --apply
```

Autenticação por Azure CLI ou variáveis de ambiente fora do Git. Se o repositório irmão não estiver disponível, usar a API Wiki 7.1 com ETag, mantendo a raiz deste produto.
