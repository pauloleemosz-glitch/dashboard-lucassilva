

# Dashboard Meta Ads Futurista

Dashboard frontend-only que lê dados da planilha Google Sheets pública e exibe métricas de campanhas Meta Ads com visual neon dark (ciano/roxo/laranja, tipografia leve sem bold).

## Conexão com dados
- Hook `useSheetData.ts` busca o CSV via endpoint `gviz/tq?tqx=out:csv` (sem necessidade de API Key, planilha já é pública)
- Sheet ID configurável via `VITE_SHEET_ID` (.env), com fallback para o ID fornecido
- Parse CSV com PapaParse, conversão de números no formato BR (vírgula decimal)
- Auto-refresh a cada 5 min com badge "Última atualização: HH:MM"
- React Query para cache, retry e loading states

## Filtros globais (FilterContext)
- Date range picker (shadcn Calendar) — default: últimos 30 dias presentes nos dados
- Dropdown "Curso / Produto" populado dinamicamente a partir da coluna `Curso / Produto`
- Toggle "Perpétuo / Lançamento" — controla a fórmula do CPA principal
- Filtros aplicados reativamente em todos os KPIs, gráficos, funil e tabela

## KPI Cards (linha superior)
8 cards com glassmorphism, ícones Lucide neon, animação counter-up (Framer Motion), variação % vs período anterior com seta:
Investimento, Impressões, Cliques, Vendas, CPC, CPM, CTR, CPA (dinâmico via toggle).

## Funil de conversão (lateral direita)
Camadas decrescentes animadas (preenchimento top-down):
Cliques → Visitou Site (Landing Page Views) → Compra → Valor de Compra R$
Initiate Checkout exibido à direita como métrica auxiliar. Cada camada mostra valor + taxa de conversão da etapa anterior.

## Gráficos centrais (Recharts, slide-up + fade)
1. Investimento diário (barras) + Cliques (linha) — dual axis
2. Alcance e Frequência por dia — barras agrupadas (frequência calculada como Impressões/Reach)
3. Gastos, Compras e CPA ao longo do tempo — multi-linha
- Grid lines opacity 0.1 ciano, tooltips dark com borda neon

## Tabela de criativos (inferior)
Agregada por `Ad Name`, filtrada pelo Curso selecionado.
Colunas: #, Thumbnail, Link, Leads, Impressões, Reproduções (3s), Cliques, CTR, Hook Rate, CPM, Reprod. 25%, Reprod. 100% (95%), Investido, Valor Conversão.
- Ordenação por header (default: Impressões desc), paginação 10/página
- Nulls → "—"
- Linha com maior Valor Conversão com borda neon ciano pulsante
- Thumbnail: preview do Drive via `https://drive.google.com/thumbnail?id=...` com fallback de ícone

## Métricas calculadas (`src/utils/metrics.ts`)
Funções centralizadas: cpaPerpetuo, cpaLancamento, ctr, hookRate, taxaConversaoFunil, valorMedioVenda. Divisor zero/null → null.

## Visual / Tema
- Background `#050A14`, accents `#00F0FF`, `#B44FFF`, `#FF6B35` adicionados ao design system (HSL em `index.css` + `tailwind.config.ts`)
- Inter via Google Fonts, pesos 300/400 apenas; CSS global removendo `font-bold`
- Scrollbar customizada fina ciano, skeleton shimmer neon para loading

## Estrutura de arquivos
```
src/
  hooks/useSheetData.ts
  context/FilterContext.tsx
  utils/metrics.ts, parsers.ts
  components/
    KPICard.tsx
    ConversionFunnel.tsx
    CreativeTable.tsx
    GlobalFilters.tsx
    Charts/{InvestmentClicks,ReachFrequency,SpendPurchasesCPA}.tsx
  pages/Index.tsx (compõe o dashboard)
.env.example (VITE_SHEET_ID)
```

Dependências a adicionar: `papaparse`, `framer-motion`, `recharts`, `date-fns` (já comum em shadcn).

