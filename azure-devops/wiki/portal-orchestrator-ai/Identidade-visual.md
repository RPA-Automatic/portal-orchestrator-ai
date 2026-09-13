> Fonte canônica: `docs/product/brand.md`

# Identidade visual — RPA Automatic

> Status: Aplicado  
> Responsável: @RodrigoFreitas16n91  
> Última revisão: 2026-09-13

Os produtos da RPA Automatic utilizam as mesmas três imagens, preservando seus arquivos, cores, proporções e fundo branco.

| Papel | Arquivo |
|---|---|
| Topo do portal e login | `rpa-automatic-primary.png` |
| Chat, assistência inteligente e monitoramento | `rpa-automatic-icon.png` |
| Rodapé com direitos reservados | `rpa-automatic-horizontal.png` |

O rodapé apresenta “© ANO RPA Automatic. Todos os direitos reservados.”. Nos portais, o ano é calculado automaticamente. O `brand-manifest.json` registra os papéis e hashes para manter as cópias consistentes entre projetos.

As imagens são recursos de identidade; sua aplicação não cria integrações, chats ou agentes adicionais. Usar o robô nos recursos realmente disponíveis e registrar separadamente funcionalidades ainda planejadas. Não reutilizar nomes, logotipos, imagens ou referências de clientes.

Neste portal, a marca completa aparece no topo e no login; o robô identifica o assistente de tarefas, Code Assist e o histórico de monitoramento; a marca horizontal aparece no rodapé. O código atual não contém um chat dedicado chamado Monitoring. Os assets são servidos localmente de `public/brand/`.
