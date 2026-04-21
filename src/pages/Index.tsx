import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { DollarSign, Eye, MousePointer, ShoppingCart, TrendingUp, BarChart3, Percent, Target, AlertCircle, UserPlus } from "lucide-react";
import { useSheetData, AdRow } from "@/hooks/useSheetData";
import { FilterProvider, useFilters } from "@/context/FilterContext";
import { GlobalFilters } from "@/components/GlobalFilters";
import { KPICard } from "@/components/KPICard";
import { ConversionFunnel } from "@/components/ConversionFunnel";
import { CreativeTable } from "@/components/CreativeTable";
import { InvestmentClicks } from "@/components/Charts/InvestmentClicks";
import { ReachFrequency } from "@/components/Charts/ReachFrequency";
import { SpendPurchasesCPA } from "@/components/Charts/SpendPurchasesCPA";
import { LeadsSpendCPA } from "@/components/Charts/LeadsSpendCPA";
import { LPViewsClicksLeads } from "@/components/Charts/LPViewsClicksLeads";
import { cpc, cpm, ctr, cpaPerpetuo, cpaLancamento, variacaoPct } from "@/utils/metrics";
import { formatBRL, formatNumber, formatPct } from "@/utils/parsers";
import { format } from "date-fns";

function aggregate(rows: AdRow[]) {
  return rows.reduce(
    (acc, r) => {
      acc.spend += r.spend;
      acc.impressions += r.impressions;
      acc.clicks += r.clicks;
      acc.compras += r.compras;
      acc.leads += r.leads;
      acc.reach += r.reach;
      acc.landingPageViews += r.landingPageViews;
      acc.valorCompra += r.valorCompra;
      acc.valorCheckout += r.valorCheckout;
      return acc;
    },
    { spend: 0, impressions: 0, clicks: 0, compras: 0, leads: 0, reach: 0, landingPageViews: 0, valorCompra: 0, valorCheckout: 0 },
  );
}

function Dashboard() {
  const { data, isLoading, isFetching, refetch, dataUpdatedAt, error } = useSheetData();
  const { dateRange, setDateRange, curso, modo } = useFilters();

  const allRows = data ?? [];

  // Determine min/max date in data for default range
  const { minDate, maxDate } = useMemo(() => {
    let min: Date | null = null;
    let max: Date | null = null;
    for (const r of allRows) {
      if (!r.date) continue;
      if (!min || r.date < min) min = r.date;
      if (!max || r.date > max) max = r.date;
    }
    return { minDate: min, maxDate: max };
  }, [allRows]);

  // Set default date range to last 30 days of data on first load
  useEffect(() => {
    if (!dateRange && maxDate) {
      const from = new Date(maxDate);
      from.setDate(from.getDate() - 29);
      setDateRange({ from: from < (minDate ?? from) ? minDate ?? from : from, to: maxDate });
    }
  }, [maxDate, minDate, dateRange, setDateRange]);

  const cursos = useMemo(() => {
    const set = new Set<string>();
    for (const r of allRows) if (r.curso) set.add(r.curso);
    return Array.from(set).sort();
  }, [allRows]);

  // Filtering
  const filtered = useMemo(() => {
    return allRows.filter((r) => {
      if (curso !== "all" && r.curso !== curso) return false;
      if (dateRange?.from && r.date && r.date < dateRange.from) return false;
      if (dateRange?.to && r.date && r.date > dateRange.to) return false;
      return true;
    });
  }, [allRows, curso, dateRange]);

  // Previous period for variation
  const previousFiltered = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return [];
    const span = dateRange.to.getTime() - dateRange.from.getTime();
    const prevTo = new Date(dateRange.from.getTime() - 1);
    const prevFrom = new Date(prevTo.getTime() - span);
    return allRows.filter((r) => {
      if (curso !== "all" && r.curso !== curso) return false;
      if (!r.date) return false;
      return r.date >= prevFrom && r.date <= prevTo;
    });
  }, [allRows, curso, dateRange]);

  const agg = aggregate(filtered);
  const prevAgg = aggregate(previousFiltered);

  const cpaCurrent = modo === "perpetuo" ? cpaPerpetuo(agg.spend, agg.compras) : cpaLancamento(agg.spend, agg.leads);
  const cpaPrev = modo === "perpetuo" ? cpaPerpetuo(prevAgg.spend, prevAgg.compras) : cpaLancamento(prevAgg.spend, prevAgg.leads);

  const ctrCurrent = ctr(agg.clicks, agg.impressions);
  const ctrPrev = ctr(prevAgg.clicks, prevAgg.impressions);
  const cpcCurrent = cpc(agg.spend, agg.clicks);
  const cpcPrev = cpc(prevAgg.spend, prevAgg.clicks);
  const cpmCurrent = cpm(agg.spend, agg.impressions);
  const cpmPrev = cpm(prevAgg.spend, prevAgg.impressions);

  // Daily series
  const daily = useMemo(() => {
    const map = new Map<string, { date: string; raw: Date; spend: number; clicks: number; impressions: number; reach: number; purchases: number; leads: number; lpViews: number }>();
    for (const r of filtered) {
      if (!r.date) continue;
      const k = format(r.date, "yyyy-MM-dd");
      const e = map.get(k) || { date: format(r.date, "dd/MM"), raw: r.date, spend: 0, clicks: 0, impressions: 0, reach: 0, purchases: 0, leads: 0, lpViews: 0 };
      e.spend += r.spend;
      e.clicks += r.clicks;
      e.impressions += r.impressions;
      e.reach += r.reach;
      e.purchases += r.compras;
      e.leads += r.leads;
      e.lpViews += r.landingPageViews;
      map.set(k, e);
    }
    return Array.from(map.values()).sort((a, b) => a.raw.getTime() - b.raw.getTime());
  }, [filtered]);

  const investClicksData = daily.map((d) => ({ date: d.date, spend: Number(d.spend.toFixed(2)), clicks: d.clicks }));
  const reachFreqData = daily.map((d) => ({
    date: d.date,
    reach: d.reach,
    frequency: d.reach > 0 ? Number((d.impressions / d.reach).toFixed(2)) : 0,
  }));
  const spendPurchData = daily.map((d) => ({
    date: d.date,
    spend: Number(d.spend.toFixed(2)),
    purchases: d.purchases,
    cpa: d.purchases > 0 ? Number((d.spend / d.purchases).toFixed(2)) : null,
  }));
  const leadsSpendData = daily.map((d) => ({
    date: d.date,
    spend: Number(d.spend.toFixed(2)),
    leads: d.leads,
    cpl: d.leads > 0 ? Number((d.spend / d.leads).toFixed(2)) : null,
  }));
  const lpClicksLeadsData = daily.map((d) => ({
    date: d.date,
    lpViews: d.lpViews,
    clicks: d.clicks,
    leads: d.leads,
  }));

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-card rounded-xl p-8 max-w-md text-center">
          <AlertCircle className="h-10 w-10 text-neon-orange mx-auto mb-3" />
          <h2 className="text-xl mb-2">Erro ao carregar dados</h2>
          <p className="text-sm text-muted-foreground mb-4">{(error as Error).message}</p>
          <button onClick={() => refetch()} className="px-4 py-2 rounded border border-primary/40 text-neon-cyan hover:bg-primary/10">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-5">
      {/* Header */}
      <motion.header initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-light tracking-tight">
            <span className="neon-text-cyan">META</span>
            <span className="text-muted-foreground mx-2">//</span>
            <span className="neon-text-purple">ADS</span>
            <span className="text-muted-foreground"> dashboard</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1 tracking-wider uppercase">
            Performance em tempo real · auto-refresh 5min
          </p>
        </div>
      </motion.header>

      {/* Filters */}
      <GlobalFilters
        cursos={cursos}
        lastUpdated={dataUpdatedAt ? new Date(dataUpdatedAt) : null}
        onRefresh={() => refetch()}
        isFetching={isFetching}
        minDate={minDate}
        maxDate={maxDate}
      />

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl skeleton-shimmer" />
          ))}
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard label="Investimento" value={agg.spend} variation={variacaoPct(agg.spend, prevAgg.spend)} icon={DollarSign} color="cyan" format={(v) => formatBRL(v)} delay={0} />
            <KPICard label="Impressões" value={agg.impressions} variation={variacaoPct(agg.impressions, prevAgg.impressions)} icon={Eye} color="purple" delay={0.05} />
            <KPICard label="Cliques" value={agg.clicks} variation={variacaoPct(agg.clicks, prevAgg.clicks)} icon={MousePointer} color="cyan" delay={0.1} />
            {modo === "lancamento" ? (
              <KPICard label="Leads" value={agg.leads} variation={variacaoPct(agg.leads, prevAgg.leads)} icon={UserPlus} color="orange" delay={0.15} />
            ) : (
              <KPICard label="Vendas" value={agg.compras} variation={variacaoPct(agg.compras, prevAgg.compras)} icon={ShoppingCart} color="orange" delay={0.15} />
            )}
            <KPICard label="CPC" value={cpcCurrent} variation={variacaoPct(cpcCurrent, cpcPrev)} icon={MousePointer} color="purple" format={(v) => formatBRL(v)} delay={0.2} />
            <KPICard label="CPM" value={cpmCurrent} variation={variacaoPct(cpmCurrent, cpmPrev)} icon={BarChart3} color="cyan" format={(v) => formatBRL(v)} delay={0.25} />
            <KPICard label="CTR" value={ctrCurrent} variation={variacaoPct(ctrCurrent, ctrPrev)} icon={Percent} color="gold" format={(v) => formatPct(v)} delay={0.3} />
            <KPICard
              label={modo === "perpetuo" ? "CPA (Perpétuo)" : "CPA (Lançamento)"}
              value={cpaCurrent}
              variation={variacaoPct(cpaCurrent, cpaPrev)}
              icon={Target}
              color="orange"
              format={(v) => formatBRL(v)}
              delay={0.35}
            />
          </div>

          {/* Charts + Funnel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <InvestmentClicks data={investClicksData} />
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <ReachFrequency data={reachFreqData} />
                {modo === "lancamento" ? (
                  <LeadsSpendCPA data={leadsSpendData} />
                ) : (
                  <SpendPurchasesCPA data={spendPurchData} />
                )}
              </div>
              {modo === "lancamento" && <LPViewsClicksLeads data={lpClicksLeadsData} />}
            </div>
            <div className="lg:col-span-1">
              <ConversionFunnel
                cliques={agg.clicks}
                visitas={agg.landingPageViews}
                compras={agg.compras}
                valorCompra={agg.valorCompra}
                checkout={agg.valorCheckout}
                leads={agg.leads}
                showLeads={modo === "lancamento"}
              />
            </div>
          </div>

          {/* Creatives table */}
          <CreativeTable rows={filtered} />

          {/* Footer */}
          <div className="text-center text-[10px] text-muted-foreground pt-4 tracking-widest uppercase">
            <TrendingUp className="inline h-3 w-3 mr-1 text-neon-cyan" />
            {filtered.length.toLocaleString("pt-BR")} registros · {formatNumber(agg.impressions)} impressões totais
          </div>
        </>
      )}
    </div>
  );
}

const Index = () => (
  <FilterProvider>
    <Dashboard />
  </FilterProvider>
);

export default Index;
