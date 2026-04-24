## Objetivo
Adicionar uma nova seção no dashboard que exibe os anúncios ativos e desativados de cada concorrente, com base na aba "Concorrentes" da planilha.

## Implementação

### 1. Hook de dados — `src/hooks/useCompetitorsData.ts`
- Fetch da aba "Concorrentes" via `gviz/tq?tqx=out:csv&sheet=Concorrentes`.
- Parse com PapaParse.
- Extrair `adId` único de cada anúncio via regex no link da Ad Library.
- Para cada `adId`, calcular:
  - `firstSeen` / `lastSeen` (datas de extração)
  - `status`: **Ativo** se `lastSeen === maxExtractionDate`, senão **Desativado**
  - `diasAtivo`: dias entre `Início Anúncio` e (hoje | data de desativação)
- Agrupar resultado por `concorrente`.

### 2. Utilitários — `src/utils/parsers.ts`
- `extractAdId(url)` — regex sobre links da Biblioteca de Anúncios.
- `parsePlatforms(str)` — normaliza "Facebook, Instagram" em array.
- `daysBetween(a, b)` — diferença em dias inteiros.

### 3. Componentes UI
- **`CompetitorAdCard.tsx`**: card com badge de status (verde "Ativo há X dias" ou vermelho "Desativado em DD/MM"), data de início formatada, ícones de plataforma, texto do anúncio truncado, link externo para a Ad Library.
- **`CompetitorGroup.tsx`**: usa `Accordion` shadcn para agrupar por concorrente, com contadores no header (ex.: "5 ativos · 2 desativados").
- **`CompetitorsSection.tsx`**: container com KPIs de resumo (total monitorado, ativos, desativados) + lista de grupos. Trata loading/erro.

### 4. Integração
- Adicionar `<CompetitorsSection />` em `src/pages/Index.tsx` envolvido em `<Reveal>` para manter o padrão de animação do dashboard.

## Estilo
Mantém o visual futurista existente (cards com borda neon, badges arredondados, tipografia consistente).