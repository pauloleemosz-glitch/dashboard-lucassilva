// Centralized metric formulas. Divisor zero/null -> null.

const safeDiv = (a: number | null | undefined, b: number | null | undefined): number | null => {
  if (a === null || a === undefined || b === null || b === undefined) return null;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  if (b === 0) return null;
  return a / b;
};

export const cpaPerpetuo = (spend: number, purchases: number) => safeDiv(spend, purchases);
export const cpaLancamento = (spend: number, leads: number) => safeDiv(spend, leads);

export const ctr = (clicks: number, impressions: number) => {
  const r = safeDiv(clicks, impressions);
  return r === null ? null : r * 100;
};

export const hookRate = (videoPlays3s: number, impressions: number) => {
  const r = safeDiv(videoPlays3s, impressions);
  return r === null ? null : r * 100;
};

export const cpc = (spend: number, clicks: number) => safeDiv(spend, clicks);
export const cpm = (spend: number, impressions: number) => {
  const r = safeDiv(spend, impressions);
  return r === null ? null : r * 1000;
};

export const taxaConversao = (a: number, b: number) => {
  const r = safeDiv(a, b);
  return r === null ? null : r * 100;
};

export const valorMedioVenda = (valorTotal: number, vendas: number) => safeDiv(valorTotal, vendas);

export const variacaoPct = (atual: number | null, anterior: number | null): number | null => {
  if (atual === null || anterior === null) return null;
  if (anterior === 0) return null;
  return ((atual - anterior) / Math.abs(anterior)) * 100;
};
