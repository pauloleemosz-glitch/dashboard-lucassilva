// Análise de palavras-chave e termos de busca do Google Ads (aba "Palavras e buscas", 04/10/2026).
// Custo/cliques vêm das abas "Google Search Terms" e "Google Keywords"; compra/visita/checkout
// vêm das abas de conversão por tipo ("Google Conv Termos" / "Google Conv Palavras").
import type { GoogleConvRow, GoogleKeywordRow, GoogleSearchTermRow } from "@/hooks/useGoogleAdsData";

export const MARCA = /lucas|silva|\bls\b|lsmc/i;

const STOP = new Set(
  "de da do das dos e o a os as em no na nos nas para pra por com sem um uma que como qual quais onde quando é ser ter mais muito pelo pela ao aos à às se ou sobre até".split(
    " ",
  ),
);

export const norm = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export function palavrasDe(term: string): string[] {
  return Array.from(
    new Set(
      norm(term)
        .split(/[^a-z0-9]+/)
        .filter((w) => w.length >= 2 && !STOP.has(w)),
    ),
  );
}

export interface Janela {
  ini: Date;
  fim: Date;
}

const dentro = (d: Date | null, j: Janela) => !!d && d >= j.ini && d <= j.fim;

export interface TermoAgg {
  term: string;
  marca: boolean;
  impressions: number;
  clicks: number;
  cost: number;
  compras: number;
  receita: number;
  checkout: number;
  visitas: number;
  cursos: string;
  keywords: string;
  ctr: number | null;
  cpc: number | null;
  custoCompra: number | null;
}

export function agregarTermos(st: GoogleSearchTermRow[], conv: GoogleConvRow[], j: Janela): TermoAgg[] {
  const m = new Map<string, TermoAgg & { _c: Set<string>; _k: Set<string> }>();
  const get = (term: string) => {
    const k = norm(term);
    let e = m.get(k);
    if (!e) {
      e = {
        term: term.trim(), marca: MARCA.test(term), impressions: 0, clicks: 0, cost: 0, compras: 0, receita: 0,
        checkout: 0, visitas: 0, cursos: "", keywords: "", ctr: null, cpc: null, custoCompra: null,
        _c: new Set(), _k: new Set(),
      };
      m.set(k, e);
    }
    return e;
  };
  for (const r of st) {
    if (!dentro(r.date, j)) continue;
    const e = get(r.term);
    e.impressions += r.impressions;
    e.clicks += r.clicks;
    e.cost += r.cost;
    e._c.add(r.curso);
    if (r.keyword) e._k.add(r.keyword);
  }
  for (const r of conv) {
    if (!dentro(r.date, j)) continue;
    const e = get(r.term);
    e._c.add(r.curso);
    if (r.tipo === "compra") {
      e.compras += r.conversions;
      e.receita += r.value;
    } else if (r.tipo === "checkout") e.checkout += r.conversions;
    else if (r.tipo === "visita") e.visitas += r.conversions;
  }
  return Array.from(m.values()).map(({ _c, _k, ...e }) => ({
    ...e,
    cursos: Array.from(_c).sort().join(", "),
    keywords: Array.from(_k).slice(0, 3).join(", "),
    ctr: e.impressions ? (e.clicks / e.impressions) * 100 : null,
    cpc: e.clicks ? e.cost / e.clicks : null,
    custoCompra: e.compras > 0 ? e.cost / e.compras : null,
  }));
}

export interface PalavraAgg {
  palavra: string;
  buscas: number;
  clicks: number;
  cost: number;
  compras: number;
  receita: number;
}

export function agregarPalavras(termos: TermoAgg[]): PalavraAgg[] {
  const m = new Map<string, PalavraAgg>();
  for (const t of termos) {
    for (const w of palavrasDe(t.term)) {
      const e = m.get(w) || { palavra: w, buscas: 0, clicks: 0, cost: 0, compras: 0, receita: 0 };
      e.buscas += 1;
      e.clicks += t.clicks;
      e.cost += t.cost;
      e.compras += t.compras;
      e.receita += t.receita;
      m.set(w, e);
    }
  }
  return Array.from(m.values());
}

export interface Tendencia {
  term: string;
  antes: number;
  agora: number;
  variacao: number; // diferença absoluta de impressões
  cliquesAgora: number;
  custoAgora: number;
}

// Compara os últimos 7 dias da janela com os 7 anteriores, por impressões.
export function tendencias(st: GoogleSearchTermRow[], fim: Date): { alta: Tendencia[]; queda: Tendencia[] } {
  const dia = 86400000;
  const a1 = new Date(fim.getTime() - 6 * dia);
  const a0 = new Date(fim.getTime() - 13 * dia);
  const m = new Map<string, Tendencia>();
  for (const r of st) {
    if (!r.date || r.date < a0 || r.date > fim) continue;
    const k = norm(r.term);
    const e = m.get(k) || { term: r.term.trim(), antes: 0, agora: 0, variacao: 0, cliquesAgora: 0, custoAgora: 0 };
    if (r.date >= a1) {
      e.agora += r.impressions;
      e.cliquesAgora += r.clicks;
      e.custoAgora += r.cost;
    } else e.antes += r.impressions;
    m.set(k, e);
  }
  const arr = Array.from(m.values()).map((e) => ({ ...e, variacao: e.agora - e.antes }));
  return {
    alta: arr.filter((e) => e.variacao > 0).sort((a, b) => b.variacao - a.variacao).slice(0, 10),
    queda: arr.filter((e) => e.variacao < 0).sort((a, b) => a.variacao - b.variacao).slice(0, 10),
  };
}

export interface KwAgg {
  keyword: string;
  matchType: string;
  curso: string;
  qualityScore: number;
  impressions: number;
  clicks: number;
  cost: number;
  cpc: number | null;
  compras: number;
  receita: number;
  visitas: number;
  custoCompra: number | null;
}

export function agregarKeywords(kw: GoogleKeywordRow[], conv: GoogleConvRow[], j: Janela): KwAgg[] {
  const m = new Map<string, KwAgg>();
  const chave = (campaign: string, adGroup: string, keyword: string, match: string) =>
    [campaign, adGroup, norm(keyword), match].join("|");
  for (const r of kw) {
    if (!dentro(r.date, j)) continue;
    const k = chave(r.campaign, r.adGroup, r.keyword, r.matchType);
    const e = m.get(k) || {
      keyword: r.keyword, matchType: r.matchType, curso: r.curso, qualityScore: 0, impressions: 0, clicks: 0,
      cost: 0, cpc: null, compras: 0, receita: 0, visitas: 0, custoCompra: null,
    };
    e.impressions += r.impressions;
    e.clicks += r.clicks;
    e.cost += r.cost;
    if (r.qualityScore > 0) e.qualityScore = r.qualityScore;
    m.set(k, e);
  }
  for (const r of conv) {
    if (!dentro(r.date, j)) continue;
    const e = m.get(chave(r.campaign, r.adGroup, r.term, r.matchType));
    if (!e) continue;
    if (r.tipo === "compra") {
      e.compras += r.conversions;
      e.receita += r.value;
    } else if (r.tipo === "visita") e.visitas += r.conversions;
  }
  return Array.from(m.values()).map((e) => ({
    ...e,
    cpc: e.clicks ? e.cost / e.clicks : null,
    custoCompra: e.compras > 0 ? e.cost / e.compras : null,
  }));
}

export interface Diario {
  date: string;
  raw: number;
  custo: number;
  compras: number;
  visitas: number;
}

export function serieDiaria(st: GoogleSearchTermRow[], conv: GoogleConvRow[], j: Janela): Diario[] {
  const m = new Map<number, Diario>();
  const get = (d: Date) => {
    const k = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    let e = m.get(k);
    if (!e) {
      e = {
        date: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
        raw: k, custo: 0, compras: 0, visitas: 0,
      };
      m.set(k, e);
    }
    return e;
  };
  for (const r of st) if (dentro(r.date, j)) get(r.date!).custo += r.cost;
  for (const r of conv) {
    if (!dentro(r.date, j)) continue;
    if (r.tipo === "compra") get(r.date!).compras += r.conversions;
    else if (r.tipo === "visita") get(r.date!).visitas += r.conversions;
  }
  return Array.from(m.values())
    .sort((a, b) => a.raw - b.raw)
    .map((d) => ({ ...d, custo: Number(d.custo.toFixed(2)), compras: Number(d.compras.toFixed(2)), visitas: Math.round(d.visitas) }));
}

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const pct = (n: number) => `${n.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%`;
const num = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 0 });

// Leituras em texto: só afirma o que os números mostram.
export function leituras(termos: TermoAgg[], palavras: PalavraAgg[], tend: { alta: Tendencia[] }, kws: Set<string>): string[] {
  const out: string[] = [];
  const custo = termos.reduce((s, t) => s + t.cost, 0);
  const compras = termos.reduce((s, t) => s + t.compras, 0);
  const visitas = termos.reduce((s, t) => s + t.visitas, 0);
  if (custo <= 0) return out;
  const marca = termos.filter((t) => t.marca);
  const cMarca = marca.reduce((s, t) => s + t.cost, 0);
  const vMarca = marca.reduce((s, t) => s + t.compras, 0);
  const vGen = compras - vMarca;
  out.push(
    `Buscas com o nome do Lucas levaram ${pct((cMarca / custo) * 100)} do gasto (${brl(cMarca)}) e ${num(vMarca)} de ${num(compras)} compras. ` +
      `As buscas genéricas gastaram ${brl(custo - cMarca)} e ${vGen < 0.5 ? "não trouxeram nenhuma compra" : `trouxeram ${num(vGen)} compra${Math.round(vGen) === 1 ? "" : "s"}`}.`,
  );
  if (visitas > 0)
    out.push(
      `O Google registrou ${num(visitas)} visitas de página e ${num(compras)} compras no período: ${num(visitas / Math.max(compras, 1))} visitas para cada compra. ` +
        `Até 04/10 as campanhas otimizavam por essas visitas; a partir de 04/10 otimizam por compra.`,
    );
  const semRetorno = termos.filter((t) => t.compras === 0 && t.cost >= 5);
  if (semRetorno.length)
    out.push(
      `${num(semRetorno.length)} termos gastaram pelo menos R$ 5 sem nenhuma compra, somando ${brl(semRetorno.reduce((s, t) => s + t.cost, 0))}. São os candidatos a palavra negativa.`,
    );
  const op = termos.filter((t) => t.compras > 0 && !kws.has(norm(t.term)));
  if (op.length)
    out.push(
      `${num(op.length)} ${op.length === 1 ? "busca vendeu e ainda não é palavra-chave" : "buscas venderam e ainda não são palavras-chave"}: ${op
        .sort((a, b) => b.compras - a.compras)
        .slice(0, 3)
        .map((t) => `"${t.term}"`)
        .join(", ")}.`,
    );
  const gastam = palavras.filter((p) => p.compras === 0 && p.cost >= 30).sort((a, b) => b.cost - a.cost).slice(0, 5);
  if (gastam.length)
    out.push(`Palavras que aparecem só em buscas sem venda: ${gastam.map((p) => `"${p.palavra}" (${brl(p.cost)})`).join(", ")}.`);
  const sobe = tend.alta.filter((t) => t.agora >= 200).slice(0, 3);
  if (sobe.length)
    out.push(`Em alta na última semana: ${sobe.map((t) => `"${t.term}" (${num(t.antes)} → ${num(t.agora)} impressões)`).join(", ")}.`);
  return out;
}
