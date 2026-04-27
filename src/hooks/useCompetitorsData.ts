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
  tipo: "proprio" | "concorrente";
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
  ownGroup: CompetitorGroup | null;
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

  // Primeira passagem: encontrar a data mais recente POR CONCORRENTE
  // (cada concorrente pode ter sido capturado em datas diferentes)
  let maxExtraction: Date | null = null;
  const compMaxDate = new Map<string, Date>();

  for (const row of parsed.data) {
    const ext  = parseDate(row["Data Extração"] || row["Data Extracao"] || row["Data"]);
    const nome = (row["Concorrente"] || "").trim();
    if (!ext || !nome) continue;
    if (!maxExtraction || ext > maxExtraction) maxExtraction = ext;
    const cur = compMaxDate.get(nome);
    if (!cur || ext > cur) compMaxDate.set(nome, ext);
  }

  // Segunda passagem: para cada concorrente, carregar só os anúncios
  // da SUA data mais recente (todos ativos — Apify usa active_status=active).
  // Concorrentes sem captura hoje aparecem com os dados do último dia disponível.
  // Desativados reais ficam na aba "Anuncios Desativados" via useAnunciosDesativados.
  const adMap = new Map<string, Record<string, string>>();

  for (const row of parsed.data) {
    const ext  = parseDate(row["Data Extração"] || row["Data Extracao"] || row["Data"]);
    const nome = (row["Concorrente"] || "").trim();
    if (!ext || !nome) continue;

    // Só inclui se for a data mais recente deste concorrente
    const compMax = compMaxDate.get(nome);
    if (!compMax || ext.getTime() !== compMax.getTime()) continue;

    const link =
      row["Link Ad Library"] ||
      row["Link Prévia"] ||
      row["Link Previa"] ||
      row["Link Preview"] ||
      "";
    const tipoRaw = (row["Tipo"] || "concorrente").trim().toLowerCase();
    const adId = extractAdId(link) || (link ? `manual_${link.slice(-12)}` : `noid_${nome}_${ext.getTime()}_${Math.random().toString(36).slice(2,7)}`);
    if (!adId) continue;

    if (!adMap.has(adId)) adMap.set(adId, { ...row, _tipo: tipoRaw });
  }

  const today = new Date();
  const ads: CompetitorAd[] = [];

  for (const [adId, row] of adMap) {
    const inicio = parseDate(row["Início Anúncio"] || row["Inicio Anuncio"]);
    const dias = inicio ? daysBetween(today, inicio) : 0;
    const tipoVal = ((row as Record<string, string>)["_tipo"] || "concorrente") as "proprio" | "concorrente";

    ads.push({
      adId,
      concorrente: (row["Concorrente"] || "Sem nome").trim(),
      pagina:      (row["Página"] || row["Pagina"] || "").trim(),
      inicioAnuncio: inicio,
      titulo:      (row["Título"] || row["Titulo"] || "").trim(),
      texto:       cleanAdText(row["Texto"] || ""),
      descricao:   (row["Descrição"] || row["Descricao"] || "").trim(),
      plataformas: parsePlatforms(row["Plataformas"]),
      link:        row["Link Ad Library"] || row["Link Prévia"] || row["Link Previa"] || "",
      driveLink:   (row["Link Drive"] || "").trim(),
      firstSeen:   maxExtraction,
      lastSeen:    maxExtraction,
      status:      "ativo",   // todos da última extração são ativos
      diasAtivo:   dias,
      tipo:        tipoVal,
    });
  }

  // Group by concorrente — separate "proprio" from competitors
  const groupMap = new Map<string, CompetitorGroup>();
  const ownMap   = new Map<string, CompetitorGroup>();

  for (const ad of ads) {
    const target = ad.tipo === "proprio" ? ownMap : groupMap;
    const g = target.get(ad.concorrente);
    if (g) {
      (ad.status === "ativo" ? g.ativos : g.desativados).push(ad);
    } else {
      target.set(ad.concorrente, {
        concorrente: ad.concorrente,
        pagina: ad.pagina,
        ativos: ad.status === "ativo" ? [ad] : [],
        desativados: ad.status === "desativado" ? [ad] : [],
      });
    }
  }

  const sortGroup = (g: CompetitorGroup): CompetitorGroup => ({
    ...g,
    ativos: [...g.ativos].sort(
      (a, b) => (b.inicioAnuncio?.getTime() ?? 0) - (a.inicioAnuncio?.getTime() ?? 0),
    ),
    desativados: [...g.desativados].sort(
      (a, b) => (b.lastSeen?.getTime() ?? 0) - (a.lastSeen?.getTime() ?? 0),
    ),
  });

  // Sort: more ativos first, then alphabetical
  const groups = Array.from(groupMap.values()).map(sortGroup);
  groups.sort((a, b) => {
    if (b.ativos.length !== a.ativos.length) return b.ativos.length - a.ativos.length;
    return a.concorrente.localeCompare(b.concorrente);
  });

  const ownGroups = Array.from(ownMap.values()).map(sortGroup);
  const ownGroup = ownGroups[0] ?? null;

  // Todos os anúncios da última extração são ativos
  const competitorAds = ads.filter((a) => a.tipo !== "proprio");

  return {
    groups,
    ownGroup,
    totals: {
      total:        competitorAds.length,
      ativos:       competitorAds.length,
      desativados:  0,   // desativados reais vêm de useAnunciosDesativados
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
