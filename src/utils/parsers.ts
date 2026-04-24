// Brazilian-format number parser and currency utilities

export function parseBRNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const s = String(value).trim();
  if (!s) return null;
  // Remove R$, spaces, thin spaces
  let cleaned = s.replace(/[R$\s\u00A0]/g, "");
  // If contains both . and , -> assume . is thousand sep, , is decimal
  if (cleaned.includes(",") && cleaned.includes(".")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(",")) {
    cleaned = cleaned.replace(",", ".");
  }
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function formatBRL(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n as number)) return "—";
  return (n as number).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
}

export function formatNumber(n: number | null | undefined, digits = 0): string {
  if (n === null || n === undefined || !Number.isFinite(n as number)) return "—";
  return (n as number).toLocaleString("pt-BR", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

export function formatPct(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined || !Number.isFinite(n as number)) return "—";
  return `${(n as number).toLocaleString("pt-BR", { maximumFractionDigits: digits, minimumFractionDigits: digits })}%`;
}

export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const s = String(value).trim();
  // Try ISO YYYY-MM-DD first
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return Number.isFinite(d.getTime()) ? d : null;
  }
  // dd/mm/yyyy
  const br = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(s);
  if (br) {
    const d = new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1]));
    return Number.isFinite(d.getTime()) ? d : null;
  }
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d : null;
}

export function extractDriveId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m1 = /\/d\/([a-zA-Z0-9_-]+)/.exec(url);
  if (m1) return m1[1];
  const m2 = /[?&]id=([a-zA-Z0-9_-]+)/.exec(url);
  if (m2) return m2[1];
  return null;
}

/** Extracts the numeric ad id from a Facebook Ad Library link. */
export function extractAdId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = /[?&]id=(\d+)/.exec(url);
  return m ? m[1] : null;
}

/** Splits "FACEBOOK, INSTAGRAM" into a normalized array of platforms. */
export function parsePlatforms(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

/** Whole-day difference between two dates (a - b). Returns 0 if either is null. */
export function daysBetween(a: Date | null, b: Date | null): number {
  if (!a || !b) return 0;
  const ms = a.getTime() - b.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}
