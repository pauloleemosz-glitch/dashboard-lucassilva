import { useQuery } from "@tanstack/react-query";
import Papa from "papaparse";

const SHEET_ID = (import.meta.env.VITE_SHEET_ID as string) || "1my3EGzjPQgHKX_Q1WUr3PhWSDvODVUFKISIC2gDz5p8";

export type Publico = "Quente" | "Frio";

export interface PesquisaPergunta {
  ordem: number;
  pergunta: string;
  respostas: { resposta: string; qtd: number }[];
}

export interface PesquisaPublico {
  respostas: number;
  inscritos: number;
  atualizado: string;
  /** Lead scoring (29/10): quantos respondentes caíram em cada faixa A/B/C/D no período. */
  faixas: Record<string, number>;
  perguntas: PesquisaPergunta[];
}

export type PesquisaMA0911 = Partial<Record<Publico, PesquisaPublico>>;

interface Linha { lanc: string; pub: Publico; ordem: number; pergunta: string; resposta: string; qtd: number; dia: Date | null }

/**
 * Pesquisa dos leads da Missão ANBIMA 09/11 (28/10/2026). Aba "Pesquisa MA-0911" da planilha do dashboard,
 * gravada de hora em hora por pesquisa_ma0911/atualizar.py: só contagens agregadas, nenhum dado pessoal.
 * Desde 29/10 cada contagem vem POR DIA (coluna Data, dia da resposta) e o bloco acompanha o filtro de datas.
 */
async function fetchPesquisa(): Promise<Linha[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent("Pesquisa MA-0911")}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ao carregar a pesquisa (${res.status})`);
  const parsed = Papa.parse<Record<string, string>>(await res.text(), { header: true, skipEmptyLines: true });
  // o gviz devolve a PRIMEIRA aba quando a pedida não existe: confere o cabeçalho
  if (!parsed.meta.fields?.includes("Pergunta")) return [];
  const out: Linha[] = [];
  for (const r of parsed.data) {
    const pub = r["Publico"] as Publico;
    if (pub !== "Quente" && pub !== "Frio") continue;
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(r["Data"] || "");
    out.push({
      lanc: r["Lancamento"] || "MA-0911", pub, ordem: Number(r["Ordem"]) || 0, pergunta: r["Pergunta"], resposta: r["Resposta"],
      qtd: Number(String(r["Qtd"] || "0").replace(",", ".")) || 0,
      dia: m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null,
    });
  }
  return out;
}

/** Soma as contagens dos dias dentro do período escolhido (sem período = tudo). */
export function pesquisaNoPeriodo(linhas: Linha[] | undefined, lanc: string | null, de?: Date, ate?: Date): PesquisaMA0911 | undefined {
  if (!linhas || !lanc) return undefined;
  const out: PesquisaMA0911 = {};
  for (const r of linhas) {
    if (r.lanc !== lanc) continue;
    const p = (out[r.pub] ??= { respostas: 0, inscritos: 0, atualizado: "", perguntas: [], faixas: {} });
    if (r.pergunta === "_meta" && r.resposta?.startsWith("atualizado")) {
      p.atualizado = r.resposta.replace("atualizado ", "");
      continue;
    }
    if (r.dia && ((de && r.dia < de) || (ate && r.dia > ate))) continue;
    if (r.pergunta === "_score") {
      p.faixas[r.resposta] = (p.faixas[r.resposta] || 0) + r.qtd;
      continue;
    }
    if (r.pergunta === "_meta") {
      if (r.resposta === "respostas") p.respostas += r.qtd;
      else if (r.resposta === "inscritos no formulário") p.inscritos += r.qtd;
      continue;
    }
    let q = p.perguntas.find((x) => x.ordem === r.ordem);
    if (!q) p.perguntas.push((q = { ordem: r.ordem, pergunta: r.pergunta, respostas: [] }));
    const a = q.respostas.find((x) => x.resposta === r.resposta);
    if (a) a.qtd += r.qtd;
    else q.respostas.push({ resposta: r.resposta, qtd: r.qtd });
  }
  for (const k of Object.keys(out) as Publico[]) {
    const p = out[k]!;
    if (!p.respostas) delete out[k];   // ninguém desse público respondeu no período
    else p.perguntas.sort((a, b) => a.ordem - b.ordem);
  }
  return out;
}

export function usePesquisaMA0911(ativo: boolean) {
  return useQuery({
    queryKey: ["pesquisa-ma0911-dia", SHEET_ID],
    queryFn: fetchPesquisa,
    enabled: ativo,
    refetchInterval: 10 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 29/10 (Paulo): a pesquisa vale para os lançamentos anteriores também. Rótulo da campanha (começo) → lançamento
 * (a mesma chave da coluna Lancamento que o pesquisa_ma0911/atualizar.py grava). Rótulo de carrinho, lembrete e
 * vídeos do lançamento caem no mesmo lançamento.
 */
export const LANCAMENTOS: { prefixo: string; chave: string; nome: string }[] = [
  { prefixo: "Família LS LS1201", chave: "Vitalício 12/01", nome: "Vitalício 12/01" },
  { prefixo: "Formação CFP LS2704", chave: "CFP 27/04", nome: "CFP® 27/04" },
  { prefixo: "MANBIMA 1105", chave: "Missão ANBIMA 11/05", nome: "Missão ANBIMA 11/05" },
  { prefixo: "CNPI 2505", chave: "CNPI 25/05", nome: "CNPI 25/05" },
  { prefixo: "CFP 0806", chave: "CFP 08/06", nome: "CFP® 08/06" },
  { prefixo: "MCPA-0607", chave: "Missão CPA 06/07", nome: "Missão CPA 06/07" },
  { prefixo: "CFP 2707", chave: "CFP 27/07", nome: "CFP® 27/07" },
  { prefixo: "MA 1008", chave: "Missão ANBIMA 10/08", nome: "Missão ANBIMA 10/08" },
  { prefixo: "VIT 1409", chave: "Vitalício 14/09", nome: "Vitalício 14/09" },
  { prefixo: "MCPA-0510", chave: "Missão CPA 05/10", nome: "Missão CPA 05/10" },
  { prefixo: "CFP-1910", chave: "CFP 19/10", nome: "CFP® 19/10" },
  { prefixo: "MA-0911", chave: "MA-0911", nome: "Missão ANBIMA 09/11" },
];

/** O bloco só aparece quando TODAS as campanhas do filtro são do mesmo lançamento; devolve qual (ou null). */
export function lancamentoDoFiltro(cursos: string[]) {
  if (!cursos.length) return null;
  const ls = cursos.map((c) => LANCAMENTOS.find((l) => c.startsWith(l.prefixo)));
  const l = ls[0];
  return l && ls.every((x) => x === l) ? l : null;
}

/**
 * Qual público da pesquisa acompanha o filtro: campanha com "Frios" no rótulo = frio; qualquer outra do lançamento
 * (quente, Higgsfield, vídeos das entregas) = quente. Os dois tipos marcados juntos = mostra os dois.
 */
export function publicosDoFiltro(cursos: string[]): Publico[] {
  const frio = cursos.some((c) => /frio/i.test(c));
  const quente = cursos.some((c) => !/frio/i.test(c));
  return [...(quente ? (["Quente"] as Publico[]) : []), ...(frio ? (["Frio"] as Publico[]) : [])];
}
