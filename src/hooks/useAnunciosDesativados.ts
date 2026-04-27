import { useQuery } from "@tanstack/react-query";
import Papa from "papaparse";

const SHEET_ID =
  (import.meta.env.VITE_SHEET_ID as string) || "1my3EGzjPQgHKX_Q1WUr3PhWSDvODVUFKISIC2gDz5p8";

const REFETCH_INTERVAL = 5 * 60 * 1000;

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

export function useAnunciosDesativados() {
  return useQuery({
    queryKey: ["anuncios-desativados", SHEET_ID],
    queryFn: async (): Promise<AnuncioDesativado[]> => {
      const encoded = encodeURIComponent("Anuncios Desativados");
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encoded}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Erro ao carregar desativados (${res.status})`);
      const text = await res.text();
      const parsed = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
      });
      return parsed.data.map((r) => ({
        data_desativacao: (r["Data Desativacao"] || r["Data Desativação"] || "").slice(0, 10),
        concorrente:      (r["Concorrente"] || "").trim(),
        pagina:           (r["Pagina"] || r["Página"] || "").trim(),
        inicio:           (r["Inicio Anuncio"] || r["Início Anúncio"] || "").trim(),
        ultima_vez_ativo: (r["Ultima Vez Ativo"] || r["Última Vez Ativo"] || "").trim(),
        dias_ativo:       r["Dias Ativo"] || "",
        titulo:           (r["Titulo"] || r["Título"] || "").trim(),
        texto:            (r["Texto"] || "").trim(),
        link_adlib:       (r["Link Ad Library"] || r["Link Prévia"] || "").trim(),
        link_drive:       (r["Link Drive"] || "").trim(),
      }));
    },
    staleTime: 60 * 1000,
    refetchInterval: REFETCH_INTERVAL,
    refetchOnWindowFocus: true,
  });
}
