> Fonte canônica: `docs/product/brand.md`

# Identidade visual — RPA Automatic

> Status: Aplicado  
> Responsável: @RodrigoFreitas16n91  
> Última revisão: 2026-09-13

Os produtos da RPA Automatic utilizam as mesmas três imagens, preservando seus arquivos, cores, proporções e fundo branco.

| Papel | Arquivo |
|---|---|
| Login | `rpa-automatic-primary.png` |
| Cabeçalho do workspace | `rpa-automatic-horizontal.png` |
| Chat, assistência inteligente e monitoramento | `rpa-automatic-icon.png` |
| Rodapé com direitos reservados | `rpa-automatic-horizontal.png` |

O rodapé apresenta “© ANO RPA Automatic. Todos os direitos reservados.”. Nos portais, o ano é calculado automaticamente. O `brand-manifest.json` registra os papéis e hashes para manter as cópias consistentes entre projetos.

As imagens são recursos de identidade; sua aplicação não cria integrações, chats ou agentes adicionais. Usar o robô nos recursos realmente disponíveis e registrar separadamente funcionalidades ainda planejadas. Não reutilizar nomes, logotipos, imagens ou referências de clientes.

Neste portal, a marca completa aparece no login; o robô identifica o assistente de tarefas, Code Assist e o histórico de monitoramento; a marca horizontal aparece no cabeçalho e no rodapé. O proprietário solicitou essa revisão do cabeçalho em 13/09/2026. As imagens mantêm proporções e fundo branco, sem recorte ou redesenho. O código atual não contém um chat dedicado chamado Monitoring. Os assets são servidos localmente de `public/brand/`.

## Sistema visual implementado

- React 19 + TypeScript + Vite; Tailwind CSS 4 via plugin oficial do Vite.
- Componentes Button e Dialog incorporados do shadcn/ui, com Radix UI para foco, teclado e modal. `components.json` registra a configuração; os componentes ficam em `src/components/ui/`.
- Ícones Lucide; transições CSS discretas respeitando `prefers-reduced-motion`. Motion não é dependência desta entrega.
- Tema claro, escuro e automático, disponível no login e no cabeçalho. A preferência fica no navegador (`rpa-automatic-theme`), acompanha alterações do sistema no modo automático e sincroniza entre abas. Com armazenamento bloqueado, a troca continua disponível durante a sessão.
- `public/theme-init.js` aplica a preferência antes de montar o React e é compatível com a CSP de scripts locais.
- Fundo claro `#f5f7fc` ou azul profundo `#0b1120`; ação primária azul `#2162dc`/`#2c6bea`. Degradês de baixa intensidade, bordas e sombras suaves. Tons semânticos de aviso/erro/sucesso continuam diferenciando estados; laranja não é cor de marca ou navegação.
- Tokens semânticos centralizados em `src/styles.css`, compartilhados por login, tabelas, cards, formulários e diálogos. A barra lateral vira um diálogo de navegação no celular.

O canvas React Flow permanece planejado. Adotar Next.js, Motion ou React Flow exige uma necessidade funcional própria; o sistema visual atual não depende dessas migrações.

## Referências públicas e privacidade

A interface deve apresentar somente a identidade RPA Automatic, sem comparativos ou divulgação de marcas de outras empresas. Use nomes funcionais para os serviços. Identificadores de APIs, dependências e licenças permanecem exatos no código e na documentação técnica; a identificação de operadores/suboperadores não deve ser omitida dos registros de privacidade. Login federado, quando habilitado, precisa identificar corretamente a conta de destino.

Fontes tipográficas são distribuídas pelo próprio portal, sem requisições do navegador a serviços externos de fontes. Isso reduz o compartilhamento desnecessário de IP e metadados de navegação.

O rodapé apresenta a assinatura “Qual é o próximo passo? Você decide. A gente faz acontecer.” entre a marca e os direitos reservados, com adaptação para telas menores.
