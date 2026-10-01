import { useQuery } from "@tanstack/react-query";
import Papa from "papaparse";
import { parseBRNumber, parseDate } from "@/utils/parsers";

// Faturamento REAL (vendas pagas, todas as origens) por dia x curso, extraído do Looker
// "Indicadores de Performance [Lucas Silva] v2" e gravado na aba "Faturamento real"
// por faturamento_real/gravar_aba.py. Não é atribuição: inclui Google, orgânico, e-mail etc.
export interface FatRealRow {
  date: Date | null;
  curso: string;
  receita: number;
  grupo: string;
}

const SHEET_ID = (import.meta.env.VITE_SHEET_ID as string) || "1my3EGzjPQgHKX_Q1WUr3PhWSDvODVUFKISIC2gDz5p8";

async function fetchFatReal(): Promise<FatRealRow[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent("Faturamento real")}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const parsed = Papa.parse<Record<string, string>>(await res.text(), { header: true, skipEmptyLines: true });
  return parsed.data
    .map((r) => ({
      date: parseDate(r["Date"]),
      curso: r["Curso"] || "",
      receita: parseBRNumber(r["Receita"]) ?? 0,
      grupo: r["Grupo"] || "Outros",
    }))
    .filter((r) => r.date && r.curso);
}

export function useFaturamentoReal() {
  return useQuery({
    queryKey: ["faturamento-real", SHEET_ID],
    queryFn: fetchFatReal,
    refetchInterval: 30 * 60 * 1000,
    staleTime: 10 * 60 * 1000,
  });
}

// Rótulo do painel (o que vem em PRODUTO: [...] da campanha) -> grupo do faturamento real.
// null = rótulo sem curso vendável correspondente (ex.: In-Company, IAMF).
export function grupoDoRotulo(rotulo: string): string | null {
  const s = rotulo.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();
  if (/^MCPA|MISSAO CPA/.test(s)) return "Missão CPA";
  if (/^MA \d|MANBIMA|MISSAO ANBIMA/.test(s)) return "Missão Anbima";
  if (/^VIT|FAMILIA LS/.test(s)) return "Vitalício";
  if (/^BSM|BATA SUAS METAS/.test(s)) return "Bata Suas Metas";
  if (/CFP/.test(s)) return "CFP®";
  if (/C-PRO R|CPA-20/.test(s)) return "C-PRO R"; // a antiga CPA-20 equivale à C-PRO R
  if (/C-PRO I/.test(s)) return "C-PRO I";
  if (/CPA/.test(s)) return "CPA"; // CPA, CPA-10, Apostila, Prova completa, testes...
  if (/ANEPS/.test(s)) return "Aneps";
  if (/ANCORD/.test(s)) return "ANCORD";
  if (/PQO/.test(s)) return "PQO B3";
  if (/MBA/.test(s)) return "MBA";
  if (/FBB/.test(s)) return "FBB-100";
  return null;
}
