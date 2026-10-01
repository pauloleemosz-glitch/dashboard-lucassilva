// Texto único do aviso de atribuição da Meta (pedido do Paulo, 01/10/2026).
// As campanhas de venda do Lucas usam janela de 7 dias após o clique, sem visualização:
// compra feita depois disso não é atribuída ao anúncio e não aparece em nenhum número abaixo.
export const AVISO_META_7D =
  "Atribuído pela Meta: só conta compra feita até 7 dias depois do clique no anúncio. Quem comprou depois disso não entra.";

export const AVISO_META_7D_CURTO = "Meta · só compra até 7 dias após o clique; depois disso não entra.";

// Conversões por curso (SKU do checkout) só existem a partir de 20/09/2026 — não são retroativas.
export const VENDA_CURSO_DESDE = new Date(2026, 8, 20);

// Rolagem das páginas dos cursos perpétuos (tag do GTM publicada em 01/10/2026; não é retroativa).
export const ROLAGEM_DESDE = new Date(2026, 9, 1);

// Etiqueta PRODUTO da campanha -> curso cuja página tem rolagem. Mesma regra do extrator (_curso_rolagem):
// Prova completa, MCPA e CPA-10/20 levam para outras páginas e ficam fora.
export function cursoRolagem(rotulo: string): string | null {
  const s = rotulo.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  if (s.startsWith("c-pro r")) return "C-PRO R";
  if (s.startsWith("c-pro i")) return "C-PRO I";
  if (s.startsWith("cfp")) return "CFP®";
  if (/^cpa(\s|$)/.test(s)) return "CPA";
  return null;
}
