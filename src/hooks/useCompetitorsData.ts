import { useQuery } from "@tanstack/react-query";
import Papa from "papaparse";
import { parseDate, extractAdId, parsePlatforms, daysBetween } from "@/utils/parsers";

export type CompetitorAdStatus = "ativo" | "desativado";

export interface CompetitorAd {
  adId: string;
  concorrente: string;
  pagina: string;
  inicioAnuncio: Date | null;
  titulo: string;
  texto: string;
  descricao: string;
  plataformas: string[];
  link: string;
  driveLink: string;
  firstSeen: Date | null;
  lastSeen: Date | null;
  status: CompetitorAdStatus;
  diasAtivo: number;
}

export interface CompetitorGroup {
  concorrente: string;
  pagina: string;
  ativos: CompetitorAd[];
  desativados: CompetitorAd[];
}

const SHEET_ID =
  (import.meta.env.VITE_SHEET_ID as string) || "1my3EGzjPQgHKX_Q1WUr3PhWSDvODVUFKISIC2gDz5p8";

async function fetchCompetitors(): Promise<{
  groups: CompetitorGroup[];
  totals: { total: number; ativos: number; desativados: number; concorrentes: number };
  latestExtraction: Date | null;
}> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Concorrentes`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ao carregar concorrentes (${res.status})`);
  const text = await res.text();

  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  // First pass: group rows by adId, track all extraction dates per ad
  const adMap = new Map<string, { rows: Record<string, string>[]; extractionDates: Date[] }>();
  let maxExtraction: Date | null = null;

  for (const row of parsed.data) {
    const link = row["Link Prévia"] || "";
    const adId = extractAdId(link);
    if (!adId) continue;

    const ext = parseDate(row["Data Extração"]);
    if (ext && (!maxExtraction || ext > maxExtraction)) maxExtraction = ext;

    const entry = adMap.get(adId);
    if (entry) {
      entry.rows.push(row);
      if (ext) entry.extractionDates.push(ext);
    } else {
      adMap.set(adId, {
        rows: [row],
        extractionDates: ext ? [ext] : [],
      });
    }
  }

  const today = new Date();
  const ads: CompetitorAd[] = [];

  for (const [adId, { rows, extractionDates }] of adMap) {
    // Use the most recent row as the canonical record
    const latest = rows.reduce((acc, r) => {
      const a = parseDate(acc["Data Extração"]);
      const b = parseDate(r["Data Extração"]);
      if (!a) return r;
      if (!b) return acc;
      return b > a ? r : acc;
    }, rows[0]);

    const firstSeen = extractionDates.length
      ? new Date(Math.min(...extractionDates.map((d) => d.getTime())))
      : null;
    const lastSeen = extractionDates.length
      ? new Date(Math.max(...extractionDates.map((d) => d.getTime())))
      : null;

    const isActive =
      lastSeen && maxExtraction ? lastSeen.getTime() === maxExtraction.getTime() : false;

    const inicio = parseDate(latest["Início Anúncio"]);
    const referenceEnd = isActive ? today : lastSeen ?? today;
    const dias = inicio ? daysBetween(referenceEnd, inicio) : 0;

    ads.push({
      adId,
      concorrente: (latest["Concorrente"] || "Sem nome").trim(),
      pagina: (latest["Página"] || "").trim(),
      inicioAnuncio: inicio,
      titulo: (latest["Título"] || "").trim(),
      texto: cleanAdText(latest["Texto"] || ""),
      descricao: (latest["Descrição"] || "").trim(),
      plataformas: parsePlatforms(latest["Plataformas"]),
      link: latest["Link Prévia"] || "",
      firstSeen,
      lastSeen,
      status: isActive ? "ativo" : "desativado",
      diasAtivo: dias,
    });
  }

  // Group by concorrente
  const groupMap = new Map<string, CompetitorGroup>();
  for (const ad of ads) {
    const g = groupMap.get(ad.concorrente);
    if (g) {
      (ad.status === "ativo" ? g.ativos : g.desativados).push(ad);
    } else {
      groupMap.set(ad.concorrente, {
        concorrente: ad.concorrente,
        pagina: ad.pagina,
        ativos: ad.status === "ativo" ? [ad] : [],
        desativados: ad.status === "desativado" ? [ad] : [],
      });
    }
  }

  // Sort: ativos by start date desc, desativados by lastSeen desc
  const groups = Array.from(groupMap.values()).map((g) => ({
    ...g,
    ativos: g.ativos.sort(
      (a, b) => (b.inicioAnuncio?.getTime() ?? 0) - (a.inicioAnuncio?.getTime() ?? 0),
    ),
    desativados: g.desativados.sort(
      (a, b) => (b.lastSeen?.getTime() ?? 0) - (a.lastSeen?.getTime() ?? 0),
    ),
  }));

  // Order groups: more ativos first, then alphabetical
  groups.sort((a, b) => {
    if (b.ativos.length !== a.ativos.length) return b.ativos.length - a.ativos.length;
    return a.concorrente.localeCompare(b.concorrente);
  });

  const totalAds = ads.length;
  const ativos = ads.filter((a) => a.status === "ativo").length;

  return {
    groups,
    totals: {
      total: totalAds,
      ativos,
      desativados: totalAds - ativos,
      concorrentes: groups.length,
    },
    latestExtraction: maxExtraction,
  };
}

/** Removes the {'text': '...'} python-dict wrapping that comes from the scraper. */
function cleanAdText(raw: string): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  // Match {'text': '...'} or {"text": "..."}
  const m = /^\{['"]text['"]\s*:\s*['"]([\s\S]*)['"]\s*\}$/.exec(trimmed);
  if (m) return m[1];
  return trimmed;
}

export function useCompetitorsData() {
  return useQuery({
    queryKey: ["competitors-data", SHEET_ID],
    queryFn: fetchCompetitors,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 60 * 1000,
  });
}
