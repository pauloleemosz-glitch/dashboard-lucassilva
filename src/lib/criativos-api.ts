// API client pro portal de Produção de Criativos.
// Backend roda em Cloudflare Pages (D1 + Pages Functions + Anthropic) e este
// dashboard chama cross-origin (CORS habilitado no middleware do portal).

const API_BASE = "https://criativos-cxl.pages.dev";
// Quando o custom domain `criativos.pages.professorlucassilva.com.br` propagar,
// trocar a constante acima.

export type Vencedor = {
  id: string;
  ad_name: string;
  produto: string;
  score: number;
  spend: number;
  leads: number;
  compras: number;
  cpl: number | null;
  cpa: number | null;
  formato: string | null;
  headline: string | null;
  copy_principal: string | null;
  angulo: string | null;
  mecanismo: string | null;
  promessa: string | null;
};

export type Sugestao = {
  id: string;
  produto: string;
  formato: "imagem" | "video";
  headline: string | null;
  copy_principal: string | null;
  angulo: string | null;
  mecanismo: string | null;
  promessa: string | null;
  tom: string | null;
  freepik_prompt_en: string | null;
  freepik_instrucoes_pt: string | null;
  freepik_ratio: string | null;
  video_roteiro: string | null;
  video_headlines: string | null;
  video_instrucoes_pt: string | null;
  baseado_em: string | null;
  status: "novo" | "aprovado" | "produzido" | "descartado";
  gerado_em: string;
};

export async function fetchBiblioteca(): Promise<Vencedor[]> {
  const r = await fetch(`${API_BASE}/api/biblioteca`);
  if (!r.ok) throw new Error(`biblioteca: ${r.status}`);
  return r.json();
}

export async function fetchSugestoes(): Promise<Sugestao[]> {
  const r = await fetch(`${API_BASE}/api/sugestoes`);
  if (!r.ok) throw new Error(`sugestoes: ${r.status}`);
  return r.json();
}

export async function gerarSugestoes(): Promise<{
  ok: boolean;
  produto: string;
  imagens: number;
  videos: number;
}> {
  const r = await fetch(`${API_BASE}/api/gerar`, { method: "POST" });
  if (!r.ok) throw new Error(`gerar: ${r.status} — ${await r.text()}`);
  return r.json();
}

export async function atualizarStatus(id: string, status: Sugestao["status"]): Promise<void> {
  const r = await fetch(`${API_BASE}/api/sugestoes/${id}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!r.ok) throw new Error(`status: ${r.status}`);
}
