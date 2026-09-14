# Revisão de privacidade e LGPD — projetos RPA Automatic

> Status: Em revisão
> Responsável: RPA Automatic — responsável por privacidade a designar
> Versão: 1.0
> Última revisão: 2026-09-13
> Próxima revisão: antes de incorporar dados pessoais de novos clientes
> Documentos relacionados: [Catálogo documental](../README.md)

## Resultado e alcance

**Conformidade integral não comprovada.** Existem controles técnicos relevantes, mas faltam decisões de governança, evidências operacionais e mecanismos de atendimento aos titulares. Esta revisão não equivale a certificação, parecer jurídico ou teste de invasão completo.

Foram revisados três projetos próprios: Portal Orchestrator, Portal Faturamento e Solution Design Architecture Agent. O acervo de exemplos de terceiros ficou fora do escopo. Código e configuração locais foram inspecionados; nos dois bancos remotos foram consultados somente catálogos de tabelas, permissões, políticas, buckets, regiões e alertas de segurança, sem extrair registros pessoais. Não houve alteração de banco, usuários ou políticas remotas.

A implantação Azure do agente não foi comprovada. Seu workspace contém mudanças preexistentes em andamento; esta revisão não as publica nem valida como versão implantada. Não foram inspecionados contratos, backups, logs completos dos fornecedores, todos os arquivos privados ou o histórico Git completo. Ausência de achado não prova ausência de dados pessoais nesses locais.

## Evidências técnicas

| Controle | Orchestrator | Faturamento | Agente de arquitetura |
|---|---|---|---|
| RLS nas tabelas públicas remotas | 27/27 habilitadas | 32/32 habilitadas | Não aplicável ao runtime revisado |
| SELECT concedido ao papel anônimo nessas tabelas | Nenhum | Nenhum | Não verificado remotamente |
| Views públicas | 3 com `security_invoker=true`, sem SELECT anônimo | 5 com `security_invoker=true`, sem SELECT anônimo | Não aplicável |
| Isolamento de leitura | Políticas `ao_*` por proprietário; função valida sessão e proprietário no código | Políticas operacionais por perfil ativo e escopo da operação | Código limita projeto/Epic e consulta aprovações; acesso individual ao endpoint ainda pendente |
| Credenciais | Tabela privada com RLS e sem SELECT para `anon`/`authenticated`; RPCs de segredos sem EXECUTE para ambos; criptografia no servidor | Configuração pública do cliente e autenticação PKCE; ausência de segredo em `netlify.toml` revisado | Identidade gerenciada e referências ao cofre no código/infraestrutura |
| Arquivos remotos | Bucket legado de documentos privado | Bucket `operation-documents` privado, limite 50 MB | Bicep desabilita acesso público a blobs; implantação não verificada |
| Senhas comprometidas | Alerta de proteção contra senhas vazadas desativada | Mesmo alerta | Fora da verificação de produção |
| Região do banco | Estados Unidos: `us-west-2` | Estados Unidos: `us-east-2` | Região implantada não comprovada |

RLS habilitado e leitura anônima revogada são evidências positivas, mas não substituem testes entre identidades reais de papéis diferentes. A revisão remota não executou gravações nem criou usuários sintéticos.

O banco do Orchestrator ainda contém 22 tabelas públicas do domínio fiscal além das cinco `ao_*`. Nenhuma foi apagada. É necessário identificar uso, responsáveis, conteúdo e plano de segregação antes de qualquer migração ou descarte. O alerta de RLS sem policy no armazenamento privado de credenciais corresponde à negação de acesso direto, não a uma liberação pública.

No Faturamento, o assessor apontou 29 alertas de exposição de metadados de schema ao papel autenticado via GraphQL. Isso não comprova vazamento de linhas. Revisar a necessidade da interface GraphQL e de sua introspecção; manter testes de RLS para os perfis autorizados. Os achados antigos de políticas abertas descritos na auditoria de maio foram substituídos pelas políticas atuais verificadas.

## Dados, finalidades e compartilhamento a formalizar

| Projeto | Dados tratados ou que podem constar do conteúdo | Finalidade observada | Lacuna principal |
|---|---|---|---|
| Orchestrator | E-mail/identidade, prompts, instruções, memórias, resultados, eventos e tokens de integração cifrados | Acesso, execução e revisão de tarefas | Não há classificação prévia do conteúdo, retenção aprovada ou fluxo completo de exportação/exclusão da conta |
| Faturamento | Perfis, responsáveis, contatos presentes em documentos, histórico e evidências operacionais | Acompanhamento fiscal e liberação de embarques | Auditoria pode copiar linhas inteiras em `old_data`/`new_data`; avaliar campos, obrigação de guarda e acesso aos históricos |
| Agente de arquitetura | Responsáveis de cards, Epic, PDD, anexos, decisões e documentos gerados | Elaborar arquitetura e coordenar aprovações | Código persiste intake completo e envia Epic/PDD à IA; faltam minimização validada, política de ciclo de vida e comprovação de execução segura |

No Orchestrator, o código encaminha objetivo, instruções, até três memórias recentes e resultados anteriores ao serviço de IA. No agente, encaminha Epic e PDD. `store: false` está presente nas chamadas revisadas, mas **não comprova retenção zero pelo operador**. Não enviar dados sensíveis ou de clientes sem finalidade, autorização e base legal definidas. Uma mensagem na tela não substitui esses controles.

Inventário técnico de operadores a validar: Supabase para autenticação/banco dos portais; Netlify para hospedagem; OpenAI para geração quando habilitada; Microsoft Azure/Graph/DevOps/SharePoint no fluxo do agente; GitHub para repositórios e leitura autorizada. A presença no código não comprova contrato, suboperadores, região de todo tratamento ou integração implantada. Avaliar os papéis de controlador/operador por contrato e por cliente. As regiões de banco nos EUA exigem análise do mecanismo de transferência internacional aplicável; localização externa, isoladamente, não demonstra irregularidade.

As telas usam nomes funcionais e a marca própria. Isso não autoriza ocultar operadores reais do aviso de privacidade, dos contratos ou dos registros de tratamento. Licenças e identificadores técnicos permanecem exatos.

## Correções deste incremento

- Remoção do cartão comparativo e de referências comerciais nas telas ativas do Orchestrator; documentação de comparação convertida em critérios próprios.
- Fontes tipográficas servidas pelo próprio domínio dos dois portais, com licenças preservadas. Removidas chamadas do navegador aos serviços externos de fontes.
- CSP ajustada no Orchestrator; CSP, restrições de enquadramento, `nosniff`, política de referência e permissões de câmera/microfone/geolocalização adicionadas ao Faturamento.
- Mensagem no modo IA e na configuração do Orchestrator explica o contexto enviado; erros do formulário de credenciais não reproduzem detalhes arbitrários do servidor.
- Faturamento: etapa do ERP com rótulo neutro, erro do Farol sem mensagem bruta do banco e provedores sociais não configurados ocultos. Provedores futuramente habilitados precisam continuar identificáveis no fluxo de autenticação.

Estas alterações não implementam retenção, exclusão integral, base legal ou homologação do agente. Não foi inserido selo de conformidade nem aviso de privacidade com informações fictícias.

## Plano de adequação

| Prioridade | Ação | Responsável proposto | Critério de conclusão | Estado |
|---|---|---|---|---|
| Alta | Identificar controlador, contato de privacidade e papéis por cliente | Direção/privacidade | Razão social e canal real aprovados; aviso acessível antes do cadastro | PENDENTE: informações solicitadas ao proprietário |
| Alta | Registrar finalidade, categorias, titulares, base legal e compartilhamento | Privacidade + donos dos processos | Registro de operações aprovado; bases justificadas por finalidade, sem consentimento genérico | PENDENTE |
| Alta | Revisar contratos de operadores e transferências internacionais | Direção/jurídico | Contratos, regiões, suboperadores e mecanismo aplicável documentados | PENDENTE |
| Alta | Atendimento a titulares | Produto + privacidade | Canal validado, verificação proporcional da identidade, exportação restrita ao titular, correção e exclusão/anonimização testadas, registro do atendimento | PENDENTE |
| Alta | Matriz de retenção e descarte | Donos dos processos + privacidade | Prazo e justificativa por categoria, exceções de guarda, expurgo testado de banco, blobs, anexos, logs, histórico Durable e tratamento de backups | PENDENTE |
| Alta | Minimização do contexto de IA | Engenharia + donos dos dados | Seleção explícita de contexto, remoção de campos desnecessários, teste com dados sintéticos e bloqueio de envio indevido | PENDENTE |
| Alta | Segurança de acesso | Administração | Validar proteção de senhas vazadas conforme disponibilidade do plano; MFA de administradores; revisão de convites, desligamentos e menor privilégio | PENDENTE: proteção desativada nos dois projetos |
| Alta | Resposta a incidentes e recuperação | Operações + privacidade | Responsáveis e procedimento definidos; triagem, registro, comunicação quando aplicável e restauração exercitados | PENDENTE |
| Alta | Homologar acesso ao agente | Engenharia Azure | Identidade individual, autorização por projeto, logs sem conteúdo pessoal e piloto com dados sintéticos | PENDENTE: Function key compartilhada no código não comprova autorização individual |
| Média | Auditoria fiscal mínima e metadados GraphQL | Engenharia fiscal | Campos de histórico minimizados; escopo de introspecção justificado; teste de perfil externo e inativo | PENDENTE |
| Média | Segregar objetos legados no Orchestrator | Engenharia + dono dos dados | Inventário, plano de migração/backup e prova de isolamento antes de excluir qualquer objeto | PENDENTE |
| Média | Separar e versionar chave de criptografia | Engenharia | Rotação testada em cofre/KMS, independente da chave de serviço, sem perda de credenciais | PENDENTE |

Não definir automaticamente um prazo único de descarte para documentos fiscais. Obrigações de guarda e outras hipóteses de conservação precisam de avaliação própria. Não criar expurgo destrutivo antes dessa decisão.

## Referências oficiais

Consulta em 2026-09-13: a [LGPD, texto compilado](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm) orienta princípios e bases de tratamento (arts. 6–11), conservação e direitos (15–19), transferências internacionais (33 e seguintes), registros de operações (37), segurança e incidentes (46–48). O [guia de segurança da ANPD para agentes de pequeno porte](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-sobre-seguranca-da-informacao-para-agentes-de-tratamento-de-pequeno-porte) apoia a avaliação de controles. A conclusão depende também da situação concreta da empresa e de suas operações.
