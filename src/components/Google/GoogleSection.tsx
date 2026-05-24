import { useMemo } from "react";
import { format } from "date-fns";
import { ExternalLink } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { ProductSharePie } from "@/components/Charts/ProductSharePie";
import { GoogleInvestmentConversions } from "@/components/Charts/GoogleInvestmentConversions";
import { DataTable, Column } from "./DataTable";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { GoogleAdRow, GoogleKeywordRow, GoogleSearchTermRow } from "@/hooks/useGoogleAdsData";
import { ctr as ctrFn, cpc as cpcFn, cpaPerpetuo } from "@/utils/metrics";
import { formatBRL, formatNumber, formatPct } from "@/utils/parsers";

interface Props {
  ads: GoogleAdRow[];
  keywords: GoogleKeywordRow[];
  searchTerms: GoogleSearchTermRow[];
}

interface AdAgg {
  adId: string;
  headline: string;
  headlines: string[];
  descriptions: string[];
  finalUrl: string;
  campaign: string;
  campaignType: string;
  adGroup: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  ctr: number | null;
  cpc: number | null;
  cpa: number | null;
}

interface KwAgg {
  keyword: string;
  matchType: string;
  curso: string;
  qualityScore: number;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  ctr: number | null;
  cpc: number | null;
  cpa: number | null;
}

interface TermAgg {
  term: string;
  keyword: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  ctr: number | null;
  cpa: number | null;
}

export function GoogleSection({ ads, keywords, searchTerms }: Props) {
  // Série diária
  const daily = useMemo(() => {
    const map = new Map<string, { raw: Date; date: string; spend: number; clicks: number; conversions: number }>();
    for (const r of ads) {
      if (!r.date) continue;
      const k = format(r.date, "yyyy-MM-dd");
      const e = map.get(k) || { raw: r.date, date: format(r.date, "dd/MM"), spend: 0, clicks: 0, conversions: 0 };
      e.spend += r.cost;
      e.clicks += r.clicks;
      e.conversions += r.conversions;
      map.set(k, e);
    }
    return Array.from(map.values())
      .sort((a, b) => a.raw.getTime() - b.raw.getTime())
      .map((d) => ({ date: d.date, spend: Number(d.spend.toFixed(2)), clicks: d.clicks, conversions: Number(d.conversions.toFixed(1)) }));
  }, [ads]);

  // Conversões por curso (pie)
  const cursoShare = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of ads) m.set(r.curso, (m.get(r.curso) || 0) + r.conversions);
    return Array.from(m, ([name, value]) => ({ name, value: Number(value.toFixed(0)) }));
  }, [ads]);

  // Anúncios agregados por adId
  const adRows = useMemo<AdAgg[]>(() => {
    const m = new Map<string, AdAgg>();
    for (const r of ads) {
      let e = m.get(r.adId);
      if (!e) {
        e = {
          adId: r.adId,
          headline: r.headlines[0] || "(sem título)",
          headlines: r.headlines,
          descriptions: r.descriptions,
          finalUrl: r.finalUrl,
          campaign: r.campaign,
          campaignType: r.campaignType,
          adGroup: r.adGroup,
          impressions: 0, clicks: 0, cost: 0, conversions: 0,
          ctr: null, cpc: null, cpa: null,
        };
        m.set(r.adId, e);
      }
      e.impressions += r.impressions;
      e.clicks += r.clicks;
      e.cost += r.cost;
      e.conversions += r.conversions;
    }
    for (const e of m.values()) {
      e.ctr = ctrFn(e.clicks, e.impressions);
      e.cpc = cpcFn(e.cost, e.clicks);
      e.cpa = cpaPerpetuo(e.cost, e.conversions);
    }
    return Array.from(m.values());
  }, [ads]);

  // Keywords agregadas
  const kwRows = useMemo<KwAgg[]>(() => {
    const m = new Map<string, KwAgg>();
    for (const r of keywords) {
      const key = r.campaign + "|" + r.adGroup + "|" + r.keyword + "|" + r.matchType;
      let e = m.get(key);
      if (!e) {
        e = {
          keyword: r.keyword, matchType: r.matchType, curso: r.curso, qualityScore: r.qualityScore,
          impressions: 0, clicks: 0, cost: 0, conversions: 0, ctr: null, cpc: null, cpa: null,
        };
        m.set(key, e);
      }
      e.impressions += r.impressions;
      e.clicks += r.clicks;
      e.cost += r.cost;
      e.conversions += r.conversions;
      if (r.qualityScore > 0) e.qualityScore = r.qualityScore;
    }
    for (const e of m.values()) {
      e.ctr = ctrFn(e.clicks, e.impressions);
      e.cpc = cpcFn(e.cost, e.clicks);
      e.cpa = cpaPerpetuo(e.cost, e.conversions);
    }
    return Array.from(m.values());
  }, [keywords]);

  // Termos de busca agregados
  const termRows = useMemo<TermAgg[]>(() => {
    const m = new Map<string, TermAgg>();
    for (const r of searchTerms) {
      const key = r.term + "|" + r.keyword;
      let e = m.get(key);
      if (!e) {
        e = { term: r.term, keyword: r.keyword, impressions: 0, clicks: 0, cost: 0, conversions: 0, ctr: null, cpa: null };
        m.set(key, e);
      }
      e.impressions += r.impressions;
      e.clicks += r.clicks;
      e.cost += r.cost;
      e.conversions += r.conversions;
    }
    for (const e of m.values()) {
      e.ctr = ctrFn(e.clicks, e.impressions);
      e.cpa = cpaPerpetuo(e.cost, e.conversions);
    }
    return Array.from(m.values());
  }, [searchTerms]);

  const num = (v: any) => (v === null || v === undefined ? "—" : formatNumber(v, 0));
  const brl = (v: any) => (v === null || v === undefined ? "—" : formatBRL(v));
  const pct = (v: any) => (v === null || v === undefined ? "—" : formatPct(v));

  const adColumns: Column<AdAgg>[] = [
    {
      key: "headline", label: "Anúncio", align: "left", minWidth: 220,
      render: (r) => (
        <HoverCard openDelay={150} closeDelay={80}>
          <HoverCardTrigger asChild>
            <span className="inline-flex items-center gap-1 max-w-[280px] truncate text-foreground hover:text-neon-cyan transition-colors cursor-default">
              <span className="truncate">{r.headline}</span>
              {r.headlines.length > 1 && <span className="text-[10px] text-neon-cyan/70 shrink-0">+{r.headlines.length - 1}</span>}
            </span>
          </HoverCardTrigger>
          <HoverCardContent
            side="right" align="start"
            className="p-3 w-[340px] bg-[hsl(220_60%_6%/0.95)] border border-neon-cyan/40 backdrop-blur-md"
            style={{ boxShadow: "0 0 24px hsl(var(--neon-cyan) / 0.25)" }}
          >
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Títulos</div>
            <ul className="text-xs space-y-0.5 mb-2 list-disc list-inside text-foreground/90">
              {r.headlines.slice(0, 15).map((h, i) => <li key={i} className="truncate">{h}</li>)}
            </ul>
            {r.descriptions.length > 0 && (
              <>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Descrições</div>
                <ul className="text-xs space-y-0.5 mb-2 list-disc list-inside text-muted-foreground">
                  {r.descriptions.slice(0, 6).map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </>
            )}
            {r.finalUrl && (
              <a href={r.finalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-neon-cyan hover:underline">
                {r.finalUrl} <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
          </HoverCardContent>
        </HoverCard>
      ),
    },
    { key: "campaignType", label: "Tipo", align: "left", format: (v) => String(v || "—") },
    { key: "adGroup", label: "Grupo", align: "left", minWidth: 140, format: (v) => String(v || "—") },
    { key: "impressions", label: "Impressões", format: num },
    { key: "clicks", label: "Cliques", format: num },
    { key: "ctr", label: "CTR", format: pct },
    { key: "cpc", label: "CPC", format: brl },
    { key: "cost", label: "Custo", format: brl },
    { key: "conversions", label: "Conversões", format: num },
    { key: "cpa", label: "Custo / Conv.", format: brl },
  ];

  const kwColumns: Column<KwAgg>[] = [
    { key: "keyword", label: "Palavra-chave", align: "left", minWidth: 180 },
    { key: "matchType", label: "Correspondência", align: "left" },
    { key: "qualityScore", label: "QS", format: (v) => (v > 0 ? String(v) : "—") },
    { key: "impressions", label: "Impressões", format: num },
    { key: "clicks", label: "Cliques", format: num },
    { key: "ctr", label: "CTR", format: pct },
    { key: "cpc", label: "CPC", format: brl },
    { key: "cost", label: "Custo", format: brl },
    { key: "conversions", label: "Conversões", format: num },
    { key: "cpa", label: "Custo / Conv.", format: brl },
  ];

  const termColumns: Column<TermAgg>[] = [
    { key: "term", label: "Termo de busca", align: "left", minWidth: 220 },
    { key: "keyword", label: "Palavra-chave", align: "left", minWidth: 140 },
    { key: "impressions", label: "Impressões", format: num },
    { key: "clicks", label: "Cliques", format: num },
    { key: "ctr", label: "CTR", format: pct },
    { key: "cost", label: "Custo", format: brl },
    { key: "conversions", label: "Conversões", format: num },
    { key: "cpa", label: "Custo / Conv.", format: brl },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Reveal direction="up" delay={0.05}>
            <GoogleInvestmentConversions data={daily} />
          </Reveal>
        </div>
        <div className="lg:col-span-1">
          <Reveal direction="left" delay={0.1}>
            <ProductSharePie title="Google · Conversões por Produto" data={cursoShare} />
          </Reveal>
        </div>
      </div>

      <Reveal direction="up" amount={0.1}>
        <DataTable title="Google Ads · Anúncios" columns={adColumns} rows={adRows} initialSortKey="cost" />
      </Reveal>

      <Reveal direction="up" amount={0.1}>
        <DataTable title="Google Ads · Palavras-chave" columns={kwColumns} rows={kwRows} initialSortKey="cost" />
      </Reveal>

      <Reveal direction="up" amount={0.1}>
        <DataTable title="Google Ads · Termos de Busca" columns={termColumns} rows={termRows} initialSortKey="clicks" />
      </Reveal>
    </div>
  );
}
