import { useQuery } from "@tanstack/react-query";
import Papa from "papaparse";

const SHEET_ID =
  (import.meta.env.VITE_SHEET_ID as string) || "1my3EGzjPQgHKX_Q1WUr3PhWSDvODVUFKISIC2gDz5p8";

const REFETCH_INTERVAL = 5 * 60 * 1000;

export interface Comparacao {
  data: string;
  concorrente: string;
  diferenciais_nossos: string[];
  diferenciais_concorrente: string[];
  oportunidades: string[];
  resumo_comparativo: string;
}

export function useComparacoes() {
  return useQuery({
    queryKey: ["comparacoes", SHEET_ID],
    queryFn: async (): Promise<Map<string, Comparacao>> => {
      const encoded = encodeURIComponent("Comparacoes");
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encoded}`;
      const res = await fetch(url);
      // Aba pode não existir ainda — retorna mapa vazio em caso de erro
      if (!res.ok) return new Map();
      const text = await res.text();
      const parsed = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
      });

      // Agrupa por concorrente — mantém a entrada mais recente
      const map = new Map<string, Comparacao>();
      for (const r of parsed.data) {
        const concorrente = (r["Concorrente"] || "").trim();
        if (!concorrente) continue;
        const data = (r["Data"] || "").slice(0, 10);
        const cur = map.get(concorrente);
        if (cur && cur.data >= data) continue; // já temos uma mais recente

        map.set(concorrente, {
          data,
          concorrente,
          diferenciais_nossos:      splitLines(r["Diferenciais Nossos"]),
          diferenciais_concorrente: splitLines(r["Diferenciais Concorrente"]),
          oportunidades:            splitLines(r["Oportunidades"]),
          resumo_comparativo:       (r["Resumo Comparativo"] || "").trim(),
        });
      }
      return map;
    },
    staleTime: 60 * 1000,
    refetchInterval: REFETCH_INTERVAL,
    refetchOnWindowFocus: true,
  });
}

function splitLines(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}
