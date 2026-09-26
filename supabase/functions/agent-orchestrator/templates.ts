// Catálogo compartilhado: definições públicas, sem credenciais ou acesso à rede.
export const templates = [
  {
    id: "data-quality",
    name: "Guardião de dados",
    category: "Operações",
    mode: "builtin",
    description:
      "Valida registros JSON, identifica campos vazios e IDs duplicados e calcula a qualidade do lote.",
    input:
      '[{"id":"001","nome":"Ana","email":"ana@example.test"},{"id":"002","nome":"","email":""},{"id":"001","nome":"Ana","email":"ana@example.test"}]',
  },
  {
    id: "text-insights",
    name: "Analista de conteúdo",
    category: "Produtividade",
    mode: "builtin",
    description:
      "Calcula palavras, frases, tempo de leitura e termos mais frequentes do texto informado.",
    input:
      "A equipe precisa automatizar o atendimento. O atendimento recebe solicitações por diferentes canais. A automação deve registrar cada solicitação, acompanhar prazos e organizar as entregas.",
  },
  {
    id: "task-triage",
    name: "Organizador de demandas",
    category: "Atendimento",
    mode: "builtin",
    description:
      "Classifica solicitações por regras explícitas de prioridade e área. Entrega uma fila ordenada para revisão.",
    input:
      "Sistema indisponível para toda a equipe\nSolicitar acesso ao relatório mensal\nDúvida sobre a documentação do projeto\nErro urgente na integração de pedidos",
  },
  {
    id: "process-designer",
    name: "Arquiteto de processos",
    category: "Automação",
    mode: "openai",
    description:
      "Transforma um processo descrito em etapas, exceções e critérios de aceite, com planejamento e revisão por agentes.",
    input:
      "Desenhe um processo para receber pedidos de suporte, classificar a prioridade, consultar uma base de conhecimento e encaminhar casos complexos para revisão humana.",
  },
] as const;
export function getTemplate(id: unknown) {
  return templates.find((t) => t.id === id);
}
export function executeBuiltin(id: string, input: string): string {
  if (id === "data-quality") {
    let rows: unknown;
    try {
      rows = JSON.parse(input);
    } catch {
      throw new Error("Informe uma lista JSON válida.");
    }
    if (
      !Array.isArray(rows) ||
      !rows.length ||
      rows.length > 200 ||
      rows.some((r) => !r || Array.isArray(r) || typeof r !== "object")
    )
      throw new Error("Informe entre 1 e 200 objetos JSON.");
    const fields = [...new Set(rows.flatMap((r) => Object.keys(r)))];
    const seen = new Set<string>();
    const issues: string[] = [];
    let missing = 0;
    rows.forEach((r, i) => {
      for (const f of fields)
        if (r[f] === null || r[f] === undefined || String(r[f]).trim() === "") {
          missing++;
          issues.push(`Registro ${i + 1}: campo “${f}” vazio.`);
        }
      if (r.id !== undefined) {
        const key = String(r.id);
        if (seen.has(key))
          issues.push(`Registro ${i + 1}: ID duplicado (${key}).`);
        seen.add(key);
      }
    });
    return `# Relatório de qualidade\n\nRegistros: ${rows.length}\nCampos: ${fields.length}\nCompletude: ${fields.length ? Math.round((1 - missing / (rows.length * fields.length)) * 100) : 0}%\nOcorrências: ${issues.length}\n\n${issues.length ? issues.map((x) => `- ${x}`).join("\n") : "Nenhuma ocorrência encontrada."}\n\nMétodo: campos presentes no lote são tratados como esperados. Validação determinística, sem IA e sem consultar sistemas externos.`;
  }
  if (id === "text-insights") {
    const words =
      input.toLocaleLowerCase("pt-BR").match(/[\p{L}\p{N}]+/gu) || [];
    const counts = new Map<string, number>();
    const stop = new Set([
      "para",
      "como",
      "pela",
      "pelo",
      "uma",
      "umas",
      "uns",
      "dos",
      "das",
      "que",
      "com",
      "por",
      "não",
      "mais",
      "cada",
    ]);
    for (const w of words)
      if (w.length > 3 && !stop.has(w)) counts.set(w, (counts.get(w) || 0) + 1);
    const top = [...counts]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8);
    return `# Análise de conteúdo\n\nPalavras: ${words.length}\nCaracteres: ${input.length}\nFrases: ${input.split(/[.!?]+/).filter((x) => x.trim()).length}\nTempo estimado de leitura: ${Math.max(1, Math.ceil(words.length / 200))} min\n\n## Termos frequentes\n${top.map(([w, n]) => `- ${w}: ${n}`).join("\n")}\n\nMétodo: contagem determinística; estimativa de 200 palavras por minuto. Não representa análise semântica por IA.`;
  }
  if (id === "task-triage") {
    const items = input
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);
    if (items.length > 100)
      throw new Error("Informe até 100 solicitações, uma por linha.");
    const rows = items
      .map((text, index) => ({
        text,
        index,
        priority: /urgente|indisponível|parado|crítico/i.test(text)
          ? 1
          : /erro|falha|prazo/i.test(text)
            ? 2
            : 3,
        area: /acesso|senha|login/i.test(text)
          ? "Acessos"
          : /erro|sistema|integração|indisponível/i.test(text)
            ? "Tecnologia"
            : "Atendimento",
      }))
      .sort((a, b) => a.priority - b.priority || a.index - b.index);
    return `# Triagem de demandas\n\nTotal: ${rows.length}\n\n${rows.map((r) => `- P${r.priority} · ${r.area} · ${r.text}`).join("\n")}\n\nRegras: P1 = urgente/indisponível/parado/crítico; P2 = erro/falha/prazo; P3 = demais. Classificação por palavras-chave, sujeita à revisão humana. Nenhuma solicitação externa foi criada.`;
  }
  throw new Error("Automação não disponível.");
}
