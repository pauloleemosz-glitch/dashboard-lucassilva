import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { DollarSign, Eye, MousePointer, ShoppingCart, TrendingUp, BarChart3, Percent, Target, AlertCircle, UserPlus, FileText, MousePointerClick, Zap } from "lucide-react";
import { useSheetData, AdRow } from "@/hooks/useSheetData";
import { FilterProvider, useFilters } from "@/context/FilterContext";
import { GlobalFilters } from "@/components/GlobalFilters";
import { KPICard } from "@/components/KPICard";
import { ConversionFunnel } from "@/components/ConversionFunnel";

import { Reveal } from "@/components/Reveal";
import { CreativeTable } from "@/components/CreativeTable";
import { TopNav } from "@/components/TopNav";
import { InvestmentClicks } from "@/components/Charts/InvestmentClicks";
import { ReachFrequency } from "@/components/Charts/ReachFrequency";
import { SpendPurchasesCPA } from "@/components/Charts/SpendPurchasesCPA";
import { LeadsSpendCPA } from "@/components/Charts/LeadsSpendCPA";
import { LPViewsClicksLeads } from "@/components/Charts/LPViewsClicksLeads";
import { ProductSharePie } from "@/components/Charts/ProductSharePie";
import { AnguloMecanismoPie } from "@/components/Charts/AnguloMecanismoPie";
import { cpc, cpm, ctr, cpaPerpetuo, cpaLancamento, variacaoPct } from "@/utils/metrics";
import { formatBRL, formatNumber, formatPct } from "@/utils/parsers";
import { format } from "date-fns";
import logo from "@/assets/logo.svg";

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
      acc.initiateCheckout += r.initiateCheckout;
      return acc;
    },
    { spend: 0, impressions: 0, clicks: 0, compras: 0, leads: 0, reach: 0, landingPageViews: 0, valorCompra: 0, valorCheckout: 0, initiateCheckout: 0 },
  );
}

function Dashboard() {
  const { data, isLoading, isFetching, refetch, dataUpdatedAt, error } = useSheetData();
  const { dateRange, setDateRange, cursos: cursosSelecionados, setCursos, modo, angulo, mecanismo } = useFilters();

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
    for (const r of allRows) {
      if (!r.curso) continue;
      // Apenas cursos com dados no período selecionado
      if (dateRange?.from && r.date && r.date < dateRange.from) continue;
      if (dateRange?.to && r.date && r.date > dateRange.to) continue;
      set.add(r.curso);
    }
    return Array.from(set).sort();
  }, [allRows, dateRange]);

  // Remove cursos selecionados que sumiram do período
  useEffect(() => {
    if (cursosSelecionados.length === 0 || cursos.length === 0) return;
    const filtrados = cursosSelecionados.filter((c) => cursos.includes(c));
    if (filtrados.length !== cursosSelecionados.length) {
      setCursos(filtrados);
    }
  }, [cursos, cursosSelecionados, setCursos]);

  const cursoMatch = (c?: string) =>
    cursosSelecionados.length === 0 || (c ? cursosSelecionados.includes(c) : false);

  // Filtering
  const filtered = useMemo(() => {
    return allRows.filter((r) => {
      if (!cursoMatch(r.curso)) return false;
      if (dateRange?.from && r.date && r.date < dateRange.from) return false;
      if (dateRange?.to && r.date && r.date > dateRange.to) return false;
      if (angulo !== "all" && r.angulo !== angulo) return false;
      if (mecanismo !== "all" && r.mecanismo !== mecanismo) return false;
      return true;
    });
  }, [allRows, cursosSelecionados, dateRange, angulo, mecanismo]);

  // Ângulos e mecanismos disponíveis no subset curso+data (sem filtrar por ângulo/mecanismo)
  const rowsForOptions = useMemo(() => {
    return allRows.filter((r) => {
      if (!cursoMatch(r.curso)) return false;
      if (dateRange?.from && r.date && r.date < dateRange.from) return false;
      if (dateRange?.to && r.date && r.date > dateRange.to) return false;
      return true;
    });
  }, [allRows, cursosSelecionados, dateRange]);

  const angulos = useMemo(() => {
    const set = new Set<string>();
    for (const r of rowsForOptions) if (r.angulo) set.add(r.angulo);
    return Array.from(set).sort();
  }, [rowsForOptions]);

  const mecanismos = useMemo(() => {
    const set = new Set<string>();
    for (const r of rowsForOptions) if (r.mecanismo) set.add(r.mecanismo);
    return Array.from(set).sort();
  }, [rowsForOptions]);

  // Previous period for variation
  const previousFiltered = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return [];
    const span = dateRange.to.getTime() - dateRange.from.getTime();
    const prevTo = new Date(dateRange.from.getTime() - 1);
    const prevFrom = new Date(prevTo.getTime() - span);
    return allRows.filter((r) => {
      if (!cursoMatch(r.curso)) return false;
      if (!r.date) return false;
      return r.date >= prevFrom && r.date <= prevTo;
    });
  }, [allRows, cursosSelecionados, dateRange]);

  const agg = aggregate(filtered);
  const prevAgg = aggregate(previousFiltered);

  const cpaCurrent = modo === "lead" ? cpaLancamento(agg.spend, agg.leads) : cpaPerpetuo(agg.spend, agg.compras);
  const cpaPrev = modo === "lead" ? cpaLancamento(prevAgg.spend, prevAgg.leads) : cpaPerpetuo(prevAgg.spend, prevAgg.compras);

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

  // Product share (sales count + revenue + leads count) by curso
  const { salesShare, leadsShare } = useMemo(() => {
    const sMap = new Map<string, number>();
    const revMap = new Map<string, number>();
    const lMap = new Map<string, number>();
    for (const r of filtered) {
      const k = r.curso || "Sem categoria";
      sMap.set(k, (sMap.get(k) || 0) + r.compras);
      revMap.set(k, (revMap.get(k) || 0) + r.valorCompra);
      lMap.set(k, (lMap.get(k) || 0) + r.leads);
    }
    return {
      salesShare: Array.from(sMap, ([name, value]) => ({ name, value, revenue: revMap.get(name) || 0 })),
      leadsShare: Array.from(lMap, ([name, value]) => ({ name, value })),
    };
  }, [filtered]);

  const { anguloSalesShare, anguloLeadsShare, mecanismoSalesShare, mecanismoLeadsShare } = useMemo(() => {
    const aS = new Map<string, number>(); const aR = new Map<string, number>(); const aL = new Map<string, number>();
    const mS = new Map<string, number>(); const mR = new Map<string, number>(); const mL = new Map<string, number>();
    for (const r of filtered) {
      const ang = r.angulo || "outro";
      const mec = r.mecanismo || "outro";
      aS.set(ang, (aS.get(ang) || 0) + r.compras);
      aR.set(ang, (aR.get(ang) || 0) + r.valorCompra);
      aL.set(ang, (aL.get(ang) || 0) + r.leads);
      mS.set(mec, (mS.get(mec) || 0) + r.compras);
      mR.set(mec, (mR.get(mec) || 0) + r.valorCompra);
      mL.set(mec, (mL.get(mec) || 0) + r.leads);
    }
    return {
      anguloSalesShare:    Array.from(aS, ([name, value]) => ({ name, value, revenue: aR.get(name) || 0 })),
      anguloLeadsShare:    Array.from(aL, ([name, value]) => ({ name, value })),
      mecanismoSalesShare: Array.from(mS, ([name, value]) => ({ name, value, revenue: mR.get(name) || 0 })),
      mecanismoLeadsShare: Array.from(mL, ([name, value]) => ({ name, value })),
    };
  }, [filtered]);

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
    <div className="min-h-screen p-4 md:p-6 space-y-5 relative">
      {/* Header */}
      <motion.header initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-light tracking-tight gradient-text-anim">
            META // ADS dashboard
          </h1>
        </div>
        <motion.img
          src={logo}
          alt="LS Certificações"
          className="h-10 md:h-12 w-auto float-soft glow-breathe"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </motion.header>

      <TopNav />

      {/* Filters */}
      <GlobalFilters
        cursos={cursos}
        angulos={angulos}
        mecanismos={mecanismos}
        lastUpdated={dataUpdatedAt ? new Date(dataUpdatedAt) : null}
        onRefresh={() => refetch()}
        isFetching={isFetching}
        minDate={minDate}
        maxDate={maxDate}
      />

      {isLoading ? (
        <div className="space-y-5 animate-fade-in">
          {/* KPI skeletons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="glass-card rounded-xl p-5 h-28 relative overflow-hidden"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="h-3 w-20 rounded skeleton-shimmer mb-4" />
                <div className="h-7 w-28 rounded skeleton-shimmer mb-3" />
                <div className="h-2 w-16 rounded skeleton-shimmer" />
              </div>
            ))}
          </div>
          {/* Charts + funnel skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <div className="glass-card rounded-xl h-64 skeleton-shimmer" />
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="glass-card rounded-xl h-56 skeleton-shimmer" />
                <div className="glass-card rounded-xl h-56 skeleton-shimmer" />
              </div>
            </div>
            <div className="glass-card rounded-xl h-[30rem] skeleton-shimmer" />
          </div>
          {/* Table skeleton */}
          <div className="glass-card rounded-xl h-72 skeleton-shimmer" />
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard label="Investimento" value={agg.spend} variation={variacaoPct(agg.spend, prevAgg.spend)} icon={DollarSign} color="cyan" format={(v) => formatBRL(v)} delay={0} />
            <KPICard label="Impressões" value={agg.impressions} variation={variacaoPct(agg.impressions, prevAgg.impressions)} icon={Eye} color="purple" delay={0.05} />
            <KPICard label="Cliques" value={agg.clicks} variation={variacaoPct(agg.clicks, prevAgg.clicks)} icon={MousePointer} color="cyan" delay={0.1} />
            {modo === "lead" ? (
              <KPICard label="Leads" value={agg.leads} variation={variacaoPct(agg.leads, prevAgg.leads)} icon={UserPlus} color="orange" delay={0.15} />
            ) : modo === "geral" ? (
              <>
                <KPICard label="Vendas" value={agg.compras} variation={variacaoPct(agg.compras, prevAgg.compras)} icon={ShoppingCart} color="orange" delay={0.15} />
                <KPICard label="Leads" value={agg.leads} variation={variacaoPct(agg.leads, prevAgg.leads)} icon={UserPlus} color="gold" delay={0.18} />
              </>
            ) : (
              <KPICard label="Vendas" value={agg.compras} variation={variacaoPct(agg.compras, prevAgg.compras)} icon={ShoppingCart} color="orange" delay={0.15} />
            )}
            <KPICard label="CPC" value={cpcCurrent} variation={variacaoPct(cpcCurrent, cpcPrev)} icon={MousePointer} color="purple" format={(v) => formatBRL(v)} delay={0.2} />
            <KPICard label="CPM" value={cpmCurrent} variation={variacaoPct(cpmCurrent, cpmPrev)} icon={BarChart3} color="cyan" format={(v) => formatBRL(v)} delay={0.25} />
            <KPICard label="CTR" value={ctrCurrent} variation={variacaoPct(ctrCurrent, ctrPrev)} icon={Percent} color="gold" format={(v) => formatPct(v)} delay={0.3} />
            <KPICard
              label={modo === "lead" ? "CPA (Lead)" : modo === "geral" ? "CPA (Venda)" : "CPA (Perpétuo)"}
              value={cpaCurrent}
              variation={variacaoPct(cpaCurrent, cpaPrev)}
              icon={Target}
              color="orange"
              format={(v) => formatBRL(v)}
              delay={0.35}
            />
          </div>

          {modo === "lead" && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard
                label="Visualizações da Página"
                value={agg.landingPageViews}
                variation={variacaoPct(agg.landingPageViews, prevAgg.landingPageViews)}
                icon={FileText}
                color="cyan"
                delay={0}
              />
              <KPICard
                label="Connect Rate"
                value={agg.clicks > 0 ? (agg.landingPageViews / agg.clicks) * 100 : null}
                variation={variacaoPct(
                  agg.clicks > 0 ? (agg.landingPageViews / agg.clicks) * 100 : null,
                  prevAgg.clicks > 0 ? (prevAgg.landingPageViews / prevAgg.clicks) * 100 : null,
                )}
                icon={MousePointerClick}
                color="cyan"
                format={(v) => formatPct(v)}
                delay={0.05}
              />
              <KPICard
                label="Conversão Página"
                value={agg.landingPageViews > 0 ? (agg.leads / agg.landingPageViews) * 100 : null}
                variation={variacaoPct(
                  agg.landingPageViews > 0 ? (agg.leads / agg.landingPageViews) * 100 : null,
                  prevAgg.landingPageViews > 0 ? (prevAgg.leads / prevAgg.landingPageViews) * 100 : null,
                )}
                icon={Target}
                color="gold"
                format={(v) => formatPct(v)}
                delay={0.1}
              />
              <KPICard
                label="Conversão do Clique"
                value={agg.clicks > 0 ? (agg.leads / agg.clicks) * 100 : null}
                variation={variacaoPct(
                  agg.clicks > 0 ? (agg.leads / agg.clicks) * 100 : null,
                  prevAgg.clicks > 0 ? (prevAgg.leads / prevAgg.clicks) * 100 : null,
                )}
                icon={Zap}
                color="purple"
                format={(v) => formatPct(v)}
                delay={0.15}
              />
            </div>
          )}

          {modo === "perpetuo" && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard
                label="Visualizações da Página"
                value={agg.landingPageViews}
                variation={variacaoPct(agg.landingPageViews, prevAgg.landingPageViews)}
                icon={FileText}
                color="cyan"
                delay={0}
              />
              <KPICard
                label="Connect Rate"
                value={agg.clicks > 0 ? (agg.landingPageViews / agg.clicks) * 100 : null}
                variation={variacaoPct(
                  agg.clicks > 0 ? (agg.landingPageViews / agg.clicks) * 100 : null,
                  prevAgg.clicks > 0 ? (prevAgg.landingPageViews / prevAgg.clicks) * 100 : null,
                )}
                icon={MousePointerClick}
                color="cyan"
                format={(v) => formatPct(v)}
                delay={0.05}
              />
              <KPICard
                label="Conversão Página"
                value={agg.landingPageViews > 0 ? (agg.compras / agg.landingPageViews) * 100 : null}
                variation={variacaoPct(
                  agg.landingPageViews > 0 ? (agg.compras / agg.landingPageViews) * 100 : null,
                  prevAgg.landingPageViews > 0 ? (prevAgg.compras / prevAgg.landingPageViews) * 100 : null,
                )}
                icon={Target}
                color="gold"
                format={(v) => formatPct(v)}
                delay={0.1}
              />
              <KPICard
                label="Conversão do Clique"
                value={agg.clicks > 0 ? (agg.compras / agg.clicks) * 100 : null}
                variation={variacaoPct(
                  agg.clicks > 0 ? (agg.compras / agg.clicks) * 100 : null,
                  prevAgg.clicks > 0 ? (prevAgg.compras / prevAgg.clicks) * 100 : null,
                )}
                icon={Zap}
                color="purple"
                format={(v) => formatPct(v)}
                delay={0.15}
              />
            </div>
          )}

          {/* Charts + Funnel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <Reveal direction="up" delay={0.05}>
                <InvestmentClicks data={investClicksData} />
              </Reveal>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Reveal direction="left">
                  <ReachFrequency data={reachFreqData} />
                </Reveal>
                <Reveal direction="right" delay={0.1}>
                  {modo === "lead" ? (
                    <LeadsSpendCPA data={leadsSpendData} />
                  ) : (
                    <SpendPurchasesCPA data={spendPurchData} />
                  )}
                </Reveal>
              </div>
              {modo === "lead" && (
                <Reveal direction="up">
                  <LPViewsClicksLeads data={lpClicksLeadsData} />
                </Reveal>
              )}
              {modo === "geral" && (
                <>
                  <Reveal direction="up">
                    <LeadsSpendCPA data={leadsSpendData} />
                  </Reveal>
                  <Reveal direction="up" delay={0.1}>
                    <LPViewsClicksLeads data={lpClicksLeadsData} />
                  </Reveal>
                </>
              )}
            </div>
            <div className="lg:col-span-1">
              <Reveal direction="left" delay={0.15}>
                <ConversionFunnel
                  cliques={agg.clicks}
                  visitas={agg.landingPageViews}
                  compras={agg.compras}
                  valorCompra={agg.valorCompra}
                  checkout={agg.initiateCheckout}
                  leads={agg.leads}
                  showLeads={modo === "lead" || modo === "geral"}
                />
              </Reveal>
            </div>
          </div>

          {/* Product share pies */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Reveal direction="left">
              <ProductSharePie title="Participação dos Produtos · Vendas" data={salesShare} />
            </Reveal>
            <Reveal direction="right" delay={0.1}>
              <ProductSharePie title="Participação dos Produtos · Leads" data={leadsShare} delay={0.05} />
            </Reveal>
          </div>

          {/* Ângulo share pies */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Reveal direction="left">
              <AnguloMecanismoPie title="Ângulo · Vendas" data={anguloSalesShare} mode="vendas" />
            </Reveal>
            <Reveal direction="right" delay={0.1}>
              <AnguloMecanismoPie title="Ângulo · Leads" data={anguloLeadsShare} mode="leads" delay={0.05} />
            </Reveal>
          </div>

          {/* Mecanismo share pies */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Reveal direction="left">
              <AnguloMecanismoPie title="Mecanismo · Vendas" data={mecanismoSalesShare} mode="vendas" />
            </Reveal>
            <Reveal direction="right" delay={0.1}>
              <AnguloMecanismoPie title="Mecanismo · Leads" data={mecanismoLeadsShare} mode="leads" delay={0.05} />
            </Reveal>
          </div>

          {/* Creatives table */}
          <Reveal direction="up" amount={0.1}>
            <CreativeTable rows={filtered} />
          </Reveal>

          {/* Footer */}
          <Reveal direction="up">
            <div className="text-center text-[10px] text-muted-foreground pt-4 tracking-widest uppercase">
              <TrendingUp className="inline h-3 w-3 mr-1 text-neon-cyan" />
              {filtered.length.toLocaleString("pt-BR")} registros · {formatNumber(agg.impressions)} impressões totais
            </div>
          </Reveal>
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
