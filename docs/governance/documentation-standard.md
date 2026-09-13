# Padrão de governança documental

> Status: Aprovado  
> Responsável: @RodrigoFreitas16n91  
> Versão: 1.0  
> Última revisão: 2026-09-13  
> Próxima revisão: 2027-03-13
> Documentos relacionados: [Catálogo documental](../README.md)  

## Fonte de verdade

Cada assunto possui um documento canônico listado em `docs/README.md`. Use links em vez de copiar regras. Código, migrations e testes definem o que está implementado.

## Metadados e linguagem

Documentos normativos usam português técnico e informam status, responsável, versão, última e próxima revisão. Status permitidos: `Rascunho`, `Em revisão`, `Aprovado`, `Substituído` e `Arquivado`.

## Estado das capacidades

Toda capacidade deve ser marcada como `Implementado`, `Planejado` ou `Hipótese`. Registro em catálogo ou contrato não prova conectividade ou execução.

## ADRs e diagramas

Use `decisions/ADR-NNNN-titulo.md` para decisões difíceis de reverter. Mermaid `.mmd` é a fonte de diagramas e SVG de mesmo nome é o derivado para leitura no GitHub.

## Segurança

Não registre credenciais, payloads privados, conteúdo de cliente ou URLs assinadas. Fontes externas devem incluir link público e data da consulta; áreas autenticadas exigem investigação autorizada separada.
