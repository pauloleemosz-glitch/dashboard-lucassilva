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
  perguntas: PesquisaPergunta[];
}

export type PesquisaMA0911 = Partial<Record<Publico, PesquisaPublico>>;

/**
 * Pesquisa dos leads da Missão ANBIMA 09/11 (28/10/2026). Aba "Pesquisa MA-0911" da planilha do dashboard,
 * gravada de hora em hora por pesquisa_ma0911/atualizar.py: só contagens agregadas, nenhum dado pessoal.
 */
async function fetchPesquisa(): Promise<PesquisaMA0911> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent("Pesquisa MA-0911")}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ao carregar a pesquisa (${res.status})`);
  const parsed = Papa.parse<Record<string, string>>(await res.text(), { header: true, skipEmptyLines: true });
  // o gviz devolve a PRIMEIRA aba quando a pedida não existe: confere o cabeçalho
  if (!parsed.meta.fields?.includes("Pergunta")) return {};
  const out: PesquisaMA0911 = {};
  for (const r of parsed.data) {
    const pub = r["Publico"] as Publico;
    if (pub !== "Quente" && pub !== "Frio") continue;
    const p = (out[pub] ??= { respostas: 0, inscritos: 0, atualizado: "", perguntas: [] });
    const qtd = Number(String(r["Qtd"] || "0").replace(",", ".")) || 0;
    if (r["Pergunta"] === "_meta") {
      if (r["Resposta"] === "respostas") p.respostas = qtd;
      else if (r["Resposta"] === "inscritos no formulário") p.inscritos = qtd;
      else if (r["Resposta"]?.startsWith("atualizado")) p.atualizado = r["Resposta"].replace("atualizado ", "");
      continue;
    }
    const ordem = Number(r["Ordem"]) || 0;
    let q = p.perguntas.find((x) => x.ordem === ordem);
    if (!q) p.perguntas.push((q = { ordem, pergunta: r["Pergunta"], respostas: [] }));
    q.respostas.push({ resposta: r["Resposta"], qtd });
  }
  for (const p of Object.values(out)) p?.perguntas.sort((a, b) => a.ordem - b.ordem);
  return out;
}

export function usePesquisaMA0911(ativo: boolean) {
  return useQuery({
    queryKey: ["pesquisa-ma0911", SHEET_ID],
    queryFn: fetchPesquisa,
    enabled: ativo,
    refetchInterval: 10 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
  });
}

/** O bloco só aparece quando o filtro de curso tem SÓ campanhas da MA-0911 (quente, frio, testes). */
export const filtroSoMA0911 = (cursos: string[]) => cursos.length > 0 && cursos.every((c) => c.startsWith("MA-0911"));
