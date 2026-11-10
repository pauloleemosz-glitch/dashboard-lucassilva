import type { AdRow } from "@/hooks/useSheetData";

/**
 * Campanha com objetivo de CONVERSA INICIADA (WhatsApp, Messenger, mensagem no Instagram). Pedido do Paulo, 10/11/2026.
 * A planilha não traz o objetivo da campanha: a marca é o nome — da campanha ("Mensagem WhatsApp", "[Mensagem]") ou da
 * etiqueta PRODUTO ("Prova completa CPA - WhatsApp"). Só nessas campanhas a conversa conta: as outras também registram
 * conversas (gente que chama no Direct depois de ver um anúncio de venda), mas ali é efeito colateral, não resultado.
 * "Direct" ficou fora da regra de propósito: aparece em nome de variação de anúncio de venda.
 */
const RE_CONVERSA = /whats\s?app|\bwpp\b|mensage(m|ns)|conversas?\b|messenger/i;

export const ehCampanhaDeConversa = (r: Pick<AdRow, "campaign" | "curso">) =>
  RE_CONVERSA.test(r.campaign || "") || RE_CONVERSA.test(r.curso || "");

/** Conversas iniciadas da linha: só valem quando a campanha tem esse objetivo. */
export const conversasDaLinha = (r: AdRow) => (ehCampanhaDeConversa(r) ? r.conversations || 0 : 0);

export const custoPorConversa = (gasto: number, conversas: number) => (conversas > 0 ? gasto / conversas : null);
