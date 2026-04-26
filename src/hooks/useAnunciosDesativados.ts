import { useQuery } from "@tanstack/react-query";

const API_BASE = "https://ethernet-qualified-nomination-remembered.trycloudflare.com";

export interface AnuncioDesativado {
  data_desativacao: string;
  concorrente: string;
  pagina: string;
  inicio: string;
  ultima_vez_ativo: string;
  dias_ativo: number | string;
  titulo: string;
  texto: string;
  link_adlib: string;
  link_drive: string;
}

const REFETCH_INTERVAL = 2 * 60 * 1000;

export function useAnunciosDesativados() {
  return useQuery({
    queryKey: ["anuncios-desativados"],
    queryFn: async (): Promise<AnuncioDesativado[]> => {
      const res = await fetch(`${API_BASE}/api/anuncios-desativados`);
      if (!res.ok) throw new Error(`Erro anúncios desativados (${res.status})`);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 60 * 1000,
    refetchInterval: REFETCH_INTERVAL,
    refetchOnWindowFocus: true,
  });
}
