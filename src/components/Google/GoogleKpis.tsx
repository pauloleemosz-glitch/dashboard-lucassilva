import { DollarSign, Eye, MousePointer, Target, BarChart3, Percent, Zap, ShoppingCart } from "lucide-react";
import { KPICard } from "@/components/KPICard";
import { ctr, cpc, cpm, cpaPerpetuo, variacaoPct } from "@/utils/metrics";
import { formatBRL, formatNumber, formatPct } from "@/utils/parsers";

export interface GoogleAgg {
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  convValue: number;
}

export const emptyGoogleAgg = (): GoogleAgg => ({
  spend: 0,
  impressions: 0,
  clicks: 0,
  conversions: 0,
  convValue: 0,
});

export function GoogleKpis({ agg, prev }: { agg: GoogleAgg; prev: GoogleAgg }) {
  const ctrCur = ctr(agg.clicks, agg.impressions);
  const ctrPrev = ctr(prev.clicks, prev.impressions);
  const cpcCur = cpc(agg.spend, agg.clicks);
  const cpcPrev = cpc(prev.spend, prev.clicks);
  const cpmCur = cpm(agg.spend, agg.impressions);
  const cpmPrev = cpm(prev.spend, prev.impressions);
  const cpaCur = cpaPerpetuo(agg.spend, agg.conversions);
  const cpaPrev = cpaPerpetuo(prev.spend, prev.conversions);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <KPICard label="Investimento" value={agg.spend} variation={variacaoPct(agg.spend, prev.spend)} icon={DollarSign} color="cyan" format={(v) => formatBRL(v)} delay={0} />
      <KPICard label="Impressões" value={agg.impressions} variation={variacaoPct(agg.impressions, prev.impressions)} icon={Eye} color="purple" delay={0.05} />
      <KPICard label="Cliques" value={agg.clicks} variation={variacaoPct(agg.clicks, prev.clicks)} icon={MousePointer} color="cyan" delay={0.1} />
      <KPICard label="Conversões" value={agg.conversions} variation={variacaoPct(agg.conversions, prev.conversions)} icon={ShoppingCart} color="orange" format={(v) => formatNumber(v, 0)} delay={0.15} />
      <KPICard label="CPC" value={cpcCur} variation={variacaoPct(cpcCur, cpcPrev)} icon={MousePointer} color="purple" format={(v) => formatBRL(v)} delay={0.2} />
      <KPICard label="CPM" value={cpmCur} variation={variacaoPct(cpmCur, cpmPrev)} icon={BarChart3} color="cyan" format={(v) => formatBRL(v)} delay={0.25} />
      <KPICard label="CTR" value={ctrCur} variation={variacaoPct(ctrCur, ctrPrev)} icon={Percent} color="gold" format={(v) => formatPct(v)} delay={0.3} />
      <KPICard label="Custo / Conversão" value={cpaCur} variation={variacaoPct(cpaCur, cpaPrev)} icon={Target} color="orange" format={(v) => formatBRL(v)} delay={0.35} />
    </div>
  );
}

export interface MetaMini {
  spend: number;
  impressions: number;
  clicks: number;
  compras: number;
}

export function CombinedKpis({
  meta,
  metaPrev,
  google,
  googlePrev,
  children,
}: {
  meta: MetaMini;
  metaPrev: MetaMini;
  google: GoogleAgg;
  googlePrev: GoogleAgg;
  children?: React.ReactNode;
}) {
  const spend = meta.spend + google.spend;
  const spendPrev = metaPrev.spend + googlePrev.spend;
  const impr = meta.impressions + google.impressions;
  const imprPrev = metaPrev.impressions + googlePrev.impressions;
  const clk = meta.clicks + google.clicks;
  const clkPrev = metaPrev.clicks + googlePrev.clicks;
  const conv = meta.compras + google.conversions;
  const convPrev = metaPrev.compras + googlePrev.conversions;

  const ctrCur = ctr(clk, impr);
  const ctrPrev = ctr(clkPrev, imprPrev);
  const cpcCur = cpc(spend, clk);
  const cpcPrev = cpc(spendPrev, clkPrev);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <KPICard label="Investimento Total" value={spend} variation={variacaoPct(spend, spendPrev)} icon={DollarSign} color="cyan" format={(v) => formatBRL(v)} delay={0} />
      <KPICard label="Impressões Total" value={impr} variation={variacaoPct(impr, imprPrev)} icon={Eye} color="purple" delay={0.05} />
      <KPICard label="Cliques Total" value={clk} variation={variacaoPct(clk, clkPrev)} icon={MousePointer} color="cyan" delay={0.1} />
      <KPICard label="Conversões + Vendas" value={conv} variation={variacaoPct(conv, convPrev)} icon={ShoppingCart} color="orange" format={(v) => formatNumber(v, 0)} delay={0.15}
        nota="Vendas da Meta: só compra até 7 dias após o clique; depois disso não entra." />
      <KPICard label="Invest. Meta" value={meta.spend} variation={variacaoPct(meta.spend, metaPrev.spend)} icon={DollarSign} color="gold" format={(v) => formatBRL(v)} delay={0.2} />
      <KPICard label="Invest. Google" value={google.spend} variation={variacaoPct(google.spend, googlePrev.spend)} icon={Zap} color="gold" format={(v) => formatBRL(v)} delay={0.25} />
      <KPICard label="CTR Total" value={ctrCur} variation={variacaoPct(ctrCur, ctrPrev)} icon={Percent} color="gold" format={(v) => formatPct(v)} delay={0.3} />
      <KPICard label="CPC Total" value={cpcCur} variation={variacaoPct(cpcCur, cpcPrev)} icon={MousePointer} color="purple" format={(v) => formatBRL(v)} delay={0.35} />
      {children}
    </div>
  );
}
