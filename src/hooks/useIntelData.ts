import { useQuery } from "@tanstack/react-query";

const API_BASE = "https://ethernet-qualified-nomination-remembered.trycloudflare.com";

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

export function useDatasDisponiveis() {
  return useQuery({
    queryKey: ["intel", "datas"],
    queryFn: async (): Promise<string[]> => {
      const res = await fetch(`${API_BASE}/api/datas-disponiveis`);
      if (!res.ok) throw new Error(`Erro datas (${res.status})`);
      const data = (await res.json()) as string[];
      return [...data].sort().reverse();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useIntelByDate(data: string | undefined) {
  return useQuery({
    queryKey: ["intel", "campaigns", data],
    enabled: !!data,
    queryFn: async (): Promise<IntelCampaign[]> => {
      const res = await fetch(`${API_BASE}/api/inteligencia?data=${data}`);
      if (!res.ok) throw new Error(`Erro inteligência (${res.status})`);
      return res.json();
    },
    staleTime: 60 * 1000,
  });
}

export function useConcorrentesAds(data: string | undefined) {
  return useQuery({
    queryKey: ["intel", "ads", data],
    enabled: !!data,
    queryFn: async (): Promise<CompetitorAdRow[]> => {
      const res = await fetch(`${API_BASE}/api/concorrentes?data=${data}`);
      if (!res.ok) throw new Error(`Erro concorrentes (${res.status})`);
      return res.json();
    },
    staleTime: 60 * 1000,
  });
}

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
