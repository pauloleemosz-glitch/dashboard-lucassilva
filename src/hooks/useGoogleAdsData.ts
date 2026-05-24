import { useQuery } from "@tanstack/react-query";
import Papa from "papaparse";
import { parseDate } from "@/utils/parsers";

// Planilha dedicada do Google Ads (gerada pelo google_ads_to_sheets.js).
const SHEET_ID =
  (import.meta.env.VITE_GOOGLE_SHEET_ID as string) ||
  "1mraPvhLkJJT8SHrPZZ5g0BITwkEFBXtNBnxWOXAYGzg";

export interface GoogleAdRow {
  date: Date | null;
  campaign: string;
  campaignType: string; // SEARCH | DISPLAY | VIDEO ...
  adGroup: string;
  adId: string;
  adType: string; // RESPONSIVE_SEARCH_AD ...
  headlines: string[];
  descriptions: string[];
  finalUrl: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  convValue: number;
  curso: string; // derivado do nome da campanha
}

export interface GoogleKeywordRow {
  date: Date | null;
  campaign: string;
  adGroup: string;
  keyword: string;
  matchType: string;
  qualityScore: number;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  convValue: number;
  curso: string;
}

export interface GoogleSearchTermRow {
  date: Date | null;
  campaign: string;
  adGroup: string;
  term: string;
  keyword: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  convValue: number;
  curso: string;
}

export interface GoogleData {
  ads: GoogleAdRow[];
  keywords: GoogleKeywordRow[];
  searchTerms: GoogleSearchTermRow[];
}

// Os números vêm em formato US (ponto decimal, sem separador de milhar).
function gnum(v: string | undefined): number {
  if (v === null || v === undefined || v === "") return 0;
  const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

// Deriva um rótulo de curso/produto a partir do nome da campanha.
// Ex.: "[PERPCPA20] - [Lucas] - PL - Vendas CPA20 - [SEARCH] ..." -> "CPA20"
export function cursoFromCampaign(name: string): string {
  const tag = /\[PERP([A-Z0-9]+)\]/i.exec(name || "");
  if (tag) return tag[1].toUpperCase();
  const vendas = /Vendas\s+([A-Z0-9\-]+)/i.exec(name || "");
  if (vendas) return vendas[1].toUpperCase();
  return "Outros";
}

function splitAssets(v: string | undefined): string[] {
  if (!v) return [];
  return v.split(" | ").map((s) => s.trim()).filter(Boolean);
}

async function fetchTab(tab: string): Promise<Record<string, string>[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ao carregar "${tab}" (${res.status})`);
  const text = await res.text();
  return Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true }).data;
}

async function fetchGoogle(): Promise<GoogleData> {
  const [adsRaw, kwRaw, stRaw] = await Promise.all([
    fetchTab("Google Ads"),
    fetchTab("Google Keywords"),
    fetchTab("Google Search Terms"),
  ]);

  const ads: GoogleAdRow[] = adsRaw
    .map((r) => {
      const campaign = r["Campaign Name"] || "";
      return {
        date: parseDate(r["Date"]),
        campaign,
        campaignType: r["Campaign Type"] || "",
        adGroup: r["Ad Group"] || "",
        adId: r["Ad ID"] || "",
        adType: r["Ad Type"] || "",
        headlines: splitAssets(r["Headlines"]),
        descriptions: splitAssets(r["Descriptions"]),
        finalUrl: r["Final URL"] || "",
        impressions: gnum(r["Impressions"]),
        clicks: gnum(r["Clicks"]),
        cost: gnum(r["Cost"]),
        conversions: gnum(r["Conversions"]),
        convValue: gnum(r["Conv Value"]),
        curso: cursoFromCampaign(campaign),
      };
    })
    .filter((r) => r.campaign);

  const keywords: GoogleKeywordRow[] = kwRaw
    .map((r) => {
      const campaign = r["Campaign Name"] || "";
      return {
        date: parseDate(r["Date"]),
        campaign,
        adGroup: r["Ad Group"] || "",
        keyword: r["Keyword"] || "",
        matchType: r["Match Type"] || "",
        qualityScore: gnum(r["Quality Score"]),
        impressions: gnum(r["Impressions"]),
        clicks: gnum(r["Clicks"]),
        cost: gnum(r["Cost"]),
        conversions: gnum(r["Conversions"]),
        convValue: gnum(r["Conv Value"]),
        curso: cursoFromCampaign(campaign),
      };
    })
    .filter((r) => r.keyword);

  const searchTerms: GoogleSearchTermRow[] = stRaw
    .map((r) => {
      const campaign = r["Campaign Name"] || "";
      return {
        date: parseDate(r["Date"]),
        campaign,
        adGroup: r["Ad Group"] || "",
        term: r["Search Term"] || "",
        keyword: r["Keyword"] || "",
        impressions: gnum(r["Impressions"]),
        clicks: gnum(r["Clicks"]),
        cost: gnum(r["Cost"]),
        conversions: gnum(r["Conversions"]),
        convValue: gnum(r["Conv Value"]),
        curso: cursoFromCampaign(campaign),
      };
    })
    .filter((r) => r.term);

  return { ads, keywords, searchTerms };
}

export function useGoogleAdsData() {
  return useQuery({
    queryKey: ["google-ads-data", SHEET_ID],
    queryFn: fetchGoogle,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 60 * 1000,
  });
}
