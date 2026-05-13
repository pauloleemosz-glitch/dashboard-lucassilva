import { useQuery } from "@tanstack/react-query";
import Papa from "papaparse";
import { parseBRNumber, parseDate } from "@/utils/parsers";

export interface AdRow {
  date: Date | null;
  campaign: string;
  adset: string;
  adName: string;
  spend: number;
  impressions: number;
  clicks: number;
  cpm: number | null;
  cpc: number | null;
  compras: number;
  leads: number;
  reach: number;
  conversations: number;
  actionLeads: number;
  videoPlays3s: number;
  videoPlays25: number;
  videoPlays50: number;
  videoPlays75: number;
  videoPlays95: number;
  valorCompra: number;
  valorCheckout: number;
  initiateCheckout: number;
  landingPageViews: number;
  compraLP: number;
  valorCompraLP: number;
  curso: string;
  angulo?: string;
  mecanismo?: string;
  link?: string;
  thumbnail?: string;
}

const SHEET_ID = (import.meta.env.VITE_SHEET_ID as string) || "1my3EGzjPQgHKX_Q1WUr3PhWSDvODVUFKISIC2gDz5p8";

interface CreativeAnalysis {
  angulo: string;
  mecanismo: string;
}

async function fetchAnalysis(): Promise<Map<string, CreativeAnalysis>> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=criativos_angulos`;
  try {
    const res = await fetch(url);
    if (!res.ok) return new Map();
    const text = await res.text();
    const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
    const map = new Map<string, CreativeAnalysis>();
    for (const r of parsed.data) {
      const id = (r["drive_id"] || "").trim();
      if (id) map.set(id, { angulo: r["angulo"] || "", mecanismo: r["mecanismo"] || "" });
    }
    return map;
  } catch {
    return new Map();
  }
}

async function fetchSheet(): Promise<AdRow[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;
  const [res, analysisMap] = await Promise.all([fetch(url), fetchAnalysis()]);
  if (!res.ok) throw new Error(`Erro ao carregar planilha (${res.status})`);
  const text = await res.text();

  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  const rows: AdRow[] = parsed.data
    .map((r) => {
      const num = (k: string) => parseBRNumber(r[k]) ?? 0;
      const numN = (k: string) => parseBRNumber(r[k]);
      const adName = r["Ad Name"] || "";
      const analysis = analysisMap.get(adName);
      return {
        date: parseDate(r["Date"]),
        campaign: r["Campaign Name"] || "",
        adset: r["Adset Name"] || "",
        adName,
        spend: num("Spend (Cost, Amount Spent)"),
        impressions: num("Impressions"),
        clicks: num("Clicks"),
        cpm: numN("CPM (Cost per 1000 Impressions)"),
        cpc: numN("CPC (Cost per Click)"),
        compras: num("Compra"),
        leads: num("Lead"),
        reach: num("Reach (Estimated)"),
        conversations: num("Action Messaging Conversations Started (Onsite Conversion)"),
        actionLeads: num("Action Leads"),
        videoPlays3s: num("Reproduções do vídeo por no mínimo 3 segundos"),
        videoPlays25: num("Reproduções de 25% do vídeo"),
        videoPlays50: num("Reproduções de 50% do vídeo"),
        videoPlays75: num("Reproduções de 75% do vídeo"),
        videoPlays95: num("Reproduções de 95% do vídeo"),
        valorCompra: num("Valor de conversão da compra"),
        valorCheckout: num("Valor de conversão de finalizações de compra iniciadas"),
        initiateCheckout: num("Initiate Checkout"),
        landingPageViews: num("Visualizações da página de destino"),
        compraLP: num("Compra LP1108 - v3"),
        valorCompraLP: num("Valor de conversão de Compra LP1108 - v3"),
        curso: r["Curso / Produto"] || "Sem categoria",
        angulo: analysis?.angulo || "",
        mecanismo: analysis?.mecanismo || "",
      };
    })
    .filter((r) => r.adName);

  return rows;
}

export function useSheetData() {
  return useQuery({
    queryKey: ["sheet-data", SHEET_ID],
    queryFn: fetchSheet,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 60 * 1000,
  });
}
