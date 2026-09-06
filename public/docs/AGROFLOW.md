# AgroFlow — faturamento e liberação de embarques

## Separação dos produtos

Nome de trabalho proposto para o segundo produto da RPA Automatic. O Supabase dedicado ao faturamento é `eukazzizamxratkavcap`, confirmado ativo; o schema público não contém tabelas na inspeção atual. O projeto de agentes `lvsocwetuhhqxlwyfdrw` já continha tabelas com nomes fiscais/logísticos; elas foram preservadas. Não copiar essas tabelas para outro projeto sem mapear a origem e validar o modelo.

Este documento é um desenho de integração, não comprovação de um portal AgroFlow implementado. Repositório, hospedagem e regras operacionais do faturamento precisam ser recuperados antes de mudanças nesse produto.

## Jornada de negócio proposta

1. Receber ordem e contrato, origem/destino e identificador idempotente.
2. Validar documentos obrigatórios e divergências cadastrais.
3. Registrar conferência fiscal e situação do faturamento.
4. Bloquear pendências, exibindo motivo, evidência e responsável.
5. Submeter liberação de embarque a operador autorizado.
6. Registrar decisão, momento, versão dos documentos e justificativa.
7. Integrar com o sistema operacional de logística e registrar confirmação.

As regras fiscais, documentos obrigatórios, papéis e critérios de liberação dependem de validação com o responsável de negócio. Agentes de IA podem auxiliar na classificação e na explicação das pendências; não substituem a decisão autorizada nem inventam conformidade fiscal.

## Contrato proposto

Evento `shipment.review.requested.v1`:

```json
{
  "event_id": "uuid",
  "tenant_id": "uuid",
  "shipment_id": "uuid",
  "document_version": "sha256",
  "requested_at": "ISO-8601",
  "scope": "review_only",
  "evidence_refs": []
}
```

Resposta `shipment.review.completed.v1`: correlation/event ID, tenant, shipment, findings (code/severity/evidence), suggested next action, model/version e status `requires_human_review`. Nunca retornar `released=true` como efeito de um modelo.

A liberação é um comando separado do sistema de faturamento, com usuário autorizado, versão exata dos documentos, idempotência, transação e trilha imutável. Eventos assinados, proteção contra replay, escopo por tenant e nenhuma chave administrativa compartilhada entre produtos.

## Plano de implementação

- Recuperar o repositório de faturamento e inventariar schemas do projeto dedicado no ambiente ativo.
- Formalizar estados, papéis e tabela de regras com exemplos de bloqueio e liberação.
- Implementar fila operacional, painel de pendências, evidências e histórico de decisões.
- Testar isolamento entre clientes e concorrência de liberação.
- Conectar Agent OS primeiro em leitura, com dados sanitizados e evidências mínimas.
- Habilitar comandos de negócio somente após homologação humana.
