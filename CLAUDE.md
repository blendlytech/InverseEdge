# CLAUDE.md — InverseEdge Pick-3 Strategy App

## Project Purpose

**InverseEdge** implements "The Inverse Method" — a Pick-3 lottery box elimination strategy.
Core idea: eliminate the 2–4 coldest digits from the 120 non-repeating 3-digit combinations,
play the surviving combos daily, and use gap analysis to rank the most overdue ones as top picks.

---

## Tech Stack

| Layer | Tool |
| --- | --- |
| Build | Vite 8 (base: `'./'` for flexible deployment) |
| UI | React 19 + JSX (no TypeScript) |
| Charts | Recharts 3 |
| Database | Supabase (PostgreSQL BaaS) |
| Web Worker | `optimizer.worker.js` (backtest grid search) |
| Styling | Custom CSS design tokens + inline styles |
| Fonts | Inter (body), Outfit (display), Roboto Mono (numbers) |

No Redux, no Zustand, no CSS framework (Tailwind/Bootstrap). Pure React hooks + CSS custom properties.

---

## File Map

```text
src/
  main.jsx                  React entry point
  App.jsx                   Root — draws state, Supabase fetch, single-column layout
  index.css                 Global CSS design tokens (edit tokens here; never add a new token file)
  App.css                   Empty; ignore

  components/   (rendered top → bottom in App.jsx, single scrollable column)
    DrawEntryPanel.jsx      Manual draw entry form + 120-list hit detection + recent-draws recap
    BestExactPanel.jsx      HEADLINE — best STRAIGHT/EXACT plays (highest payout). Client's #1 priority
    PlayGeneratorPanel.jsx  The 120 master list, gap ranking, Top Picks, high-digit picks, exact analyzer
    FrequencyPanel.jsx      Combo frequency ranking + digit-range (high/low) bias analysis; configurable lookback
    WinLogPanel.jsx         System tracker — validates draws against the 120 list, gap-when-hit
    HistoryPanel.jsx        Collapsible raw draw history table
    Tooltip.jsx             Reusable hover tooltip with directional arrow

  utils/
    AIEngine.js             ALL combinatorics math — import from here; never duplicate logic
    supabaseClient.js       Supabase SDK init (credentials hardcoded — no .env.local)
    optimizer.worker.js     Web Worker — unused in current simplified version; kept for future use
```

### Removed from active use (files still exist but are no longer imported)

- `AnalyticsPanel.jsx` — digit heatmap + cold digit recommender (removed per client brief)
- `BacktestPanel.jsx` — historical simulation (removed per client brief)
- `SyncPanel.jsx` — cloud import/export (removed per client brief)
- `TemperatureChart.jsx` — digit frequency chart (removed per client brief)

### Product priority

The client (Lawrence) plays **box + straight**, but the **straight/exact bet is the goal** — it pays ~$500 vs ~$80 box. `BestExactPanel` is therefore the headline feature: it surfaces the best specific exact numbers to play straight. Everything else supports that decision.

---

## State Architecture

All primary state lives in **App.jsx** (no global store):

| State | Type | Persisted |
| --- | --- | --- |
| `draws` | `Array<{date, draw}>` | Supabase (falls back to `DEFAULT_MOCK_DRAWS`) |
| `historyFilterDays` | `number` | `localStorage` key `"inverse_edge_history_days"` |
| `showHistory` | `boolean` | None (collapsible draw history panel) |
| `isLoading` | `boolean` | None |

**PlayGeneratorPanel local state** (component-owned):

| State | Default | Purpose |
| --- | --- | --- |
| `lookback` | `28` draws | How many recent draws to scan for gap ranking (~14 days) |
| `selectedCombo` | `null` | Which combo tile is selected for exact-bet analysis |
| `showRecentlyDrawn` | `false` | Toggle to show/hide excluded combos in the grid |

Component-level state stays local. Only `historyFilterDays` is lifted to App because it persists to localStorage.

**Draw format:** `{ date: "YYYY-MM-DD Midday|Evening", draw: "NNN" }` — always a 3-digit string, newest-first.

---

## AIEngine.js — Core Functions

Always import from `../utils/AIEngine`. Never reimplement these:

| Function | Purpose |
| --- | --- |
| `generateMasterList()` | 120 unique non-repeating combos (sorted digits, e.g. `"013"`) |
| `eliminateCombinations(master, digits)` | Remove combos containing any eliminated digit |
| `applyHistoryFilter(combos, draws, days)` | Remove combos drawn in the last N draws |
| `scoreComboGaps(combos, draws, lookback)` | Rank combos by draws-since-last-box-hit; `lastHit=999` = overdue |
| `scoreStraightPermutations(combo, draws, lookback)` | Rank all 6 orderings of a combo by exact-hit recency |
| `calculateFrequencies(draws)` | Per-digit occurrence counts (skips doubles/triples) |
| `calculateGapTimes(draws)` | Draws since each digit (0–9) last appeared |
| `getAIRecommendations(freqs, gaps, count)` | Returns coldest N digits (sorted by gap then frequency) |
| `getPositionFrequencies(draws, lookback)` | Digit counts per draw position `[pos0, pos1, pos2]` |
| `scoreComboFrequency(master, draws, lookback)` | Ranks 120 combos by box-hit count; returns `{ranked, validDrawCount, expectedHits}` |
| `getBestExactOrdering(combo, posFreq, maxPos)` | The single most position-likely exact ordering of a combo |
| `scoreExactPlays(combos, draws, lookback)` | **Ranks best STRAIGHT plays** — overdue box × most-likely order. Powers BestExactPanel |
| `runBacktest(draws, config)` | Full historical simulation returning win/loss timeline |

**Doubles/triples** (`"112"`, `"333"`, etc.) are excluded from all analysis — `isDoubleOrTriple(draw)` and `normalizeDraw(draw)` are the guards.

### Box vs Exact (critical distinction)

- **Box combo** = a *set* of 3 distinct digits (order doesn't matter). Internal canonical form is the **sorted** string (`"012"`). All scoring, gap tracking, state, Set/Map keys, and matching use this form.
- **Exact / straight** = a *specific ordering* (`"210"`, `"021"`…). The 6 permutations are real, meaningful plays — never normalize or guide-map them.

### Display convention: `toGuideForm()` / `GUIDE_MASTER_LIST`

The printed *Inverse Method Guide* lists each box combo as a specific permutation (e.g. `012` is printed `210`). Verified: the guide's 120 normalize to exactly our 120 — identical set, display only.

- **Logic stays on sorted form.** Never key data, state, or lookups off guide form.
- **Display box combos via `toGuideForm(sortedCombo)`** so the client can cross-reference his printed sheet. Applied in every panel's box-combo display + copy buttons.
- The 120-list grid in PlayGeneratorPanel iterates **`GUIDE_MASTER_LIST`** (guide order + form); it maps each entry back with `normalizeDraw()` for state lookups.
- **Exact orderings are shown as-is** (they're the actual straight numbers) — do NOT pass perms through `toGuideForm`.

---

## Styling System

### Design Tokens (index.css — ONLY place to change these)

```css
--bg-base: #080b11              /* Page background */
--bg-card: rgba(15,23,42,0.65) /* Glassmorphism card */
--primary: #10b981              /* Neon emerald — positive, active */
--secondary: #eab308            /* Gold — strategy labels */
--danger: #ef4444               /* Red — warnings, recent hits */
--text-main: #f8fafc            /* Body text */
--text-muted: #94a3b8           /* Labels, secondary text */
--font-mono: 'Roboto Mono'      /* ALL number/digit display */
--border-color: rgba(255,255,255,0.06)
```

### CSS Class Conventions

| Class | Usage |
| --- | --- |
| `.glass-card` | Every panel wrapper (backdrop-filter blur) |
| `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger` | All buttons |
| `.glow-text-primary` | Section headings |
| `.digit-card`, `.digit-card.eliminated` | Heatmap digit tiles |
| `.comb-badge`, `.comb-badge.filtered` | Combination tiles in PlayGeneratorPanel |
| `.tab-btn`, `.tab-btn.active` | Tab navigation |

### Inline Style Conventions

- All component-level layout uses **inline `style={{...}}`** — do not add CSS classes for one-off component styles
- Use `var(--token)` for all colors, never raw hex inside components
- Numbers and draws: always use `fontFamily: 'var(--font-mono)'`

---

## Tooltip & HelpIcon Pattern

Both are defined at the top of **PlayGeneratorPanel.jsx** and used throughout that file:

```jsx
const HelpIcon = () => (
  <span style={{ cursor: 'help', color: 'var(--primary)', opacity: 0.8, ... }}>?</span>
);

// Always wrap HelpIcon in Tooltip:
<Tooltip text="Explanation here." direction="down"><HelpIcon /></Tooltip>
```

`Tooltip` props: `text` (string), `direction` (`'up'` default | `'down'`), `children`.
Use `direction="down"` when the tooltip is near the top of a section to avoid clipping.

---

## The Inverse Method — Business Logic Summary

1. **Master List**: 120 combos (3 unique digits, sorted ascending)
2. **Eliminate cold digits**: AI picks 2–4 digits with highest gap time + lowest frequency
3. **History filter**: Remove combos drawn in last `historyFilterDays` draws (default 14)
4. **Gap window** (`comboLookback`, default 200): Scan last N draws → rank survivors by how long since each last appeared as a box hit → most overdue = Top Picks
5. **Sniper Mode**: Narrows display to top N most overdue combos
6. **Position Heat Map**: Shows hottest digit per draw position → use for straight bet targeting
7. **Straight Analyzer**: Click any combo → see all 6 orderings ranked by exact-hit recency
8. **Wager calc**: `displayCount × wagerPerCombo` = cost; payout = `$80 × wagerPerCombo`

**Strategy tiers** (by eliminated digit count):

- 2 digits = Strategy 3 (recommended baseline)
- 3 digits = Strategy 1 or 2 (best net profit)
- 4 digits = Strategy 5 (aggressive reduction)
- 1 digit = Strategy 4 (not recommended — poor ROI)

---

## Development Commands

```bash
npm run dev       # Start Vite dev server (localhost:5173)
npm run build     # Production build → dist/
npm run preview   # Preview production build
npm run lint      # ESLint (flat config)
```

---

## Key Constraints & Conventions

- **No TypeScript** — stay in `.jsx` / `.js`
- **No new dependencies** without a clear need; the stack is intentionally minimal
- **Dark theme only** — no light mode
- **`DEFAULT_MOCK_DRAWS`** in App.jsx is the fallback dataset; Supabase data overrides it on load
- **Supabase table**: `lottery_draws` — columns match the draw object shape
- **Never modify `generateMasterList()`** — the 120-combo universe is the invariant the whole strategy depends on
- The app is a **static SPA**; no server-side code, no API routes
- `isDoubleOrTriple()` must gate every draw-analysis loop — doubles/triples are out of universe
- `normalizeDraw()` must be applied before any combo comparison (sorts digits ascending)
- **No digit elimination feature** — the app works on all 120 combos; the history filter and lookback window are the only user controls that narrow results
- **Always add `<Tooltip><HelpIcon /></Tooltip>`** next to every user-facing control — client requires all features to be self-explanatory

---

## Common Task Patterns

**Adding a new control to PlayGeneratorPanel:**

1. Add `useState` hook near top of component
2. Add the control in the Settings row (or a new section), using existing inline-style patterns
3. If it affects gap ranking, pass it to the relevant `AIEngine` function
4. Add a `<Tooltip direction="down"><HelpIcon /></Tooltip>` explaining the control

**Adding a new AIEngine function:**

- Export from `AIEngine.js`; import in the component that needs it
- Skip doubles/triples using `isDoubleOrTriple(draw)`
- Normalize combos with `normalizeDraw(draw)` before comparison
- Always accept `lookback` as a param so the caller can control window size

**Adding a new section below PlayGeneratorPanel:**

- Create `src/components/NewPanel.jsx`
- Import and render it in `App.jsx` inside the `<main>` flex column, below `<PlayGeneratorPanel>`
- Pass `draws` and any needed callbacks as props
- Do NOT add tabs — the app uses a single scrollable page layout
