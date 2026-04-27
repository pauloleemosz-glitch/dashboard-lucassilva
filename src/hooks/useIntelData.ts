import { useQuery } from "@tanstack/react-query";
import Papa from "papaparse";

const SHEET_ID =
  (import.meta.env.VITE_SHEET_ID as string) || "1my3EGzjPQgHKX_Q1WUr3PhWSDvODVUFKISIC2gDz5p8";

const REFETCH_INTERVAL = 5 * 60 * 1000;

// ─── Shared CSV fetcher ──────────────────────────────────────────

async function fetchSheetCSV(sheet: string): Promise<Record<string, string>[]> {
  const encoded = encodeURIComponent(sheet);
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encoded}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ao carregar aba "${sheet}" (${res.status})`);
  const text = await res.text();
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });
  return parsed.data;
}

// ─── Types ───────────────────────────────────────────────────────

export interface IntelCampaign {
  concorrente: string;
  cta: string;
  data_analise: string;
  data_anuncios: string;
  detalhes: string;
  nr_anuncios: number;
  produto_oferta: string;
  resumo_executivo: string;
  tipo_campanha: string;
  tom: string;
}

export interface CompetitorAdRow {
  concorrente: string;
  data: string;
  descricao: string;
  impressoes: string;
  inicio: string;
  link_adlib: string;
  link_drive: string;
  pagina: string;
  plataformas: string;
  texto: string;
  titulo: string;
}

// ─── Datas disponíveis — lidas da aba Concorrentes ───────────────

export function useDatasDisponiveis() {
  return useQuery({
    queryKey: ["intel", "datas", SHEET_ID],
    queryFn: async (): Promise<string[]> => {
      const rows = await fetchSheetCSV("Concorrentes");
      const datas = new Set<string>();
      for (const row of rows) {
        const d = (row["Data Extração"] || row["Data Extracao"] || row["Data"] || "").slice(0, 10);
        if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) datas.add(d);
      }
      return [...datas].sort().reverse();
    },
    staleTime: 60 * 1000,
    refetchInterval: REFETCH_INTERVAL,
    refetchOnWindowFocus: true,
  });
}

// ─── Análise IA por data — lida da aba Inteligencia Concorrentes ─

export function useIntelByDate(data: string | undefined) {
  return useQuery({
    queryKey: ["intel", "campaigns", data, SHEET_ID],
    enabled: !!data,
    queryFn: async (): Promise<IntelCampaign[]> => {
      const rows = await fetchSheetCSV("Inteligencia Concorrentes");
      return rows
        .filter((r) => {
          const d = (r["Data Anuncios"] || r["Data Análise"] || "").slice(0, 10);
          return d === data;
        })
        .map((r) => ({
          concorrente:      (r["Concorrente"] || "").trim(),
          tipo_campanha:    (r["Tipo de Campanha"] || "").trim(),
          produto_oferta:   (r["Produto / Oferta"] || "").trim(),
          cta:              (r["CTA Principal"] || "").trim(),
          tom:              (r["Tom da Comunicacao"] || r["Tom da Comunicação"] || "").trim(),
          nr_anuncios:      Number(r["Nr Anuncios Analisados"] || r["Nr Anúncios Analisados"] || 0),
          resumo_executivo: (r["Resumo Executivo"] || r["Resumo Executivo"] || "").trim(),
          data_analise:     (r["Data Analise"] || r["Data Análise"] || "").trim(),
          data_anuncios:    (r["Data Anuncios"] || "").slice(0, 10),
          detalhes:         (r["Detalhes por Campanha"] || "").trim(),
        }));
    },
    staleTime: 30 * 1000,
    refetchInterval: REFETCH_INTERVAL,
    refetchOnWindowFocus: true,
  });
}

// ─── Anúncios brutos por data — lidos da aba Concorrentes ────────

export function useConcorrentesAds(data: string | undefined) {
  return useQuery({
    queryKey: ["intel", "ads", data, SHEET_ID],
    enabled: !!data,
    queryFn: async (): Promise<CompetitorAdRow[]> => {
      const rows = await fetchSheetCSV("Concorrentes");
      return rows
        .filter((r) => {
          const d = (r["Data Extração"] || r["Data Extracao"] || r["Data"] || "").slice(0, 10);
          return d === data;
        })
        .map((r) => ({
          concorrente: (r["Concorrente"] || "").trim(),
          data:        (r["Data Extração"] || r["Data Extracao"] || r["Data"] || "").slice(0, 10),
          pagina:      (r["Página"] || r["Pagina"] || "").trim(),
          inicio:      (r["Início Anúncio"] || r["Inicio Anuncio"] || "").trim(),
          titulo:      (r["Título"] || r["Titulo"] || "").trim(),
          texto:       (r["Texto"] || "").trim(),
          descricao:   (r["Descrição"] || r["Descricao"] || "").trim(),
          plataformas: (r["Plataformas"] || "").trim(),
          impressoes:  (r["Impressões"] || r["Impressoes"] || "").trim(),
          link_adlib:  (r["Link Ad Library"] || r["Link Prévia"] || r["Link Previa"] || "").trim(),
          link_drive:  (r["Link Drive"] || "").trim(),
        }));
    },
    staleTime: 30 * 1000,
    refetchInterval: REFETCH_INTERVAL,
    refetchOnWindowFocus: true,
  });
}

// ─── Helpers mantidos por compatibilidade ────────────────────────

export function extractDriveId(url: string): string | null {
  if (!url) return null;
  const m = /\/file\/d\/([^/]+)/.exec(url);
  return m ? m[1] : null;
}

export function firstDriveLink(raw: string): string | null {
  if (!raw) return null;
  const first = raw.split(/[|\n]/).map((s) => s.trim()).filter(Boolean)[0];
  return first || null;
}
