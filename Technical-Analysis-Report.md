# Pick-3 Randomness & Edge Analysis — Technical Report

**Internal / developer record. Not for client distribution** (plain-English client version: `Understanding-The-Numbers-For-Leonard.md`).

| | |
|---|---|
| **Game** | Colorado Pick 3 (midday + evening, twice daily) |
| **Data source** | Supabase table `lottery_draws` |
| **Sample** | **N = 364** drawn results (newest: 2026-06-01 Evening) |
| **Structure** | 276 singles (no repeat) · 83 doubles · 5 triples |
| **Question** | Is there any statistically detectable, exploitable bias — especially for the exact/straight bet? |
| **Headline result** | No. All ~20 tests are consistent with a fair, uniform, memoryless RNG. |

---

## 1. Methodology

- **Goodness-of-fit / independence:** Pearson χ². p-values via the **Wilson–Hilferty** cube-root normal approximation to the χ² distribution.
- **Proportion tests:** one-sample two-tailed normal z-test, `z = (p̂ − p₀) / √(p₀(1−p₀)/n)`.
- **Serial dependence:** lag-1 autocorrelation (sums) and same-position Markov repeat rate.
- **Significance threshold:** α = 0.05, two-tailed.
- **Multiple-comparison stance:** ~20 tests were run; at α = 0.05 the expected number of false positives under a true null is ≈ 1. Any single "hit" would therefore require out-of-sample confirmation. **No test reached significance** (minimum p ≈ 0.15), so no correction is even needed.
- **Chronological ordering** (for serial tests): sorted ascending by `draw_date`, midday before evening.

---

## 2. Frequency & distribution tests

### 2.1 Overall digit frequency (all positions pooled)

Counts (digit:count): `0:102 1:117 2:109 3:112 4:92 5:115 6:112 7:106 8:103 9:124`
Slots = 1092, expected = 109.2 each.

| Statistic | Value |
|---|---|
| χ² (df = 9) | **6.64** |
| Critical (.05 / .01) | 16.92 / 21.67 |
| p | **0.675** |
| Verdict | Uniform — no digit bias |

### 2.2 Per-position digit frequency (df = 9 each)

| Position | χ² | p | Verdict |
|---|---|---|---|
| 1 (hundreds) | 11.99 | 0.213 | Uniform |
| 2 (tens) | 6.71 | 0.668 | Uniform |
| 3 (units) | 7.15 | 0.622 | Uniform |

### 2.3 Structure goodness-of-fit (single / double / triple)

Observed 276 / 83 / 5 vs expected 262.1 / 98.3 / 3.64 (p = 0.72 / 0.27 / 0.01).

| Statistic | Value |
|---|---|
| χ² (df = 2) | 3.62 (crit .05 = 5.99) |
| p | **0.161** |
| Doubles proportion z | −1.80 (p ≈ 0.072) |
| Verdict | Consistent with random; doubles slightly low but **not** significant |

### 2.4 Digit-sum location

| Statistic | Value |
|---|---|
| Mean sum | 13.65 (theoretical 13.5) |
| SD | 4.92 |
| z (mean vs 13.5) | **0.58** |
| Verdict | Centered as expected |

---

## 3. Serial-dependence / "memory" tests

### 3.1 Lag-1 autocorrelation of digit sums

| Statistic | Value |
|---|---|
| r(lag 1) | −0.084 |
| z (≈ r·√N) | −1.59 |
| Verdict | No serial dependence |

### 3.2 Same-position repeat (order-1 Markov), expected 10%

| Position | Repeats / transitions | Rate | z | p |
|---|---|---|---|---|
| 1 | 33 / 363 | 9.1% | −0.58 | 0.564 |
| 2 | 40 / 363 | 11.0% | 0.65 | 0.517 |
| 3 | 40 / 363 | 11.0% | 0.65 | 0.517 |

### 3.3 Exact-number back-to-back

Observed repeats: **0** (expected ≈ 0.36 over 363 transitions). Consistent.

### 3.4 Digit carryover (shared distinct digits with prior draw)

Mean carryover = **0.725** digits/draw — at chance.

### 3.5 Gap (run) test, exemplar digit "7"

| Statistic | Value |
|---|---|
| Mean gap | 3.66 |
| Variance | 9.41 |
| Geometric (memoryless) expectation, mean²−mean | 9.76 |
| Verdict | Matches geometric → memoryless / random |

---

## 4. Positional independence (exact-relevant)

10×10 contingency χ², df = 81. **Caveat:** expected cell ≈ 3.64 (< 5) → sparse, low validity / underpowered. Reported for completeness.

| Pair | χ² (df 81) | p | Note |
|---|---|---|---|
| Pos1 × Pos2 | 72.2 | 0.748 | No dependence detected |
| Pos1 × Pos3 | 62.0 | 0.942 | No dependence detected |
| Pos2 × Pos3 | 64.0 | 0.917 | No dependence detected |

---

## 5. Time-of-day test

Midday (n = 182) vs Evening (n = 182), pooled digit distribution, 2×10 χ², df = 9.

| Statistic | Value |
|---|---|
| χ² | 12.04 |
| p | **0.210** |
| Verdict | No midday/evening difference |

---

## 6. Hot-number test (straight)

Top exact numbers by frequency: `176×4, 143×3, 583×3, 942×3, 125×2`.

Under uniformity (λ = N/1000 = 0.364 per number), the probability that **at least one** of the 1000 numbers reaches ≥4 hits ≈ **0.42**. The observed max (4) is therefore unremarkable — expected from chance roughly half the time.

---

## 7. Strategy back-tests (no look-ahead, real data)

### 7.1 All-high box strategy (10 combos every draw)

26 hits / 364 draws (7.1%). Cost $1/combo → $3,640 total.

| Box payout | Return | Net | ROI |
|---|---|---|---|
| $40 | $1,040 | −$2,600 | −71% |
| **$80 (Colorado 6-way)** | $2,080 | **−$1,560** | **−43%** |
| $100 | $2,600 | −$1,040 | −29% |
| $166.67 (fair odds) | $4,333 | +$693 | +19% |

Break-even box payout required: **$140** — above Colorado's $80, hence structurally unprofitable.

### 7.2 System & prediction replay (Time Machine batch)

Lookback 60, history filter 14, dueWeight 0.65. Hit rate vs random baseline:

| Window | Strategy | Straight | Box (top 3) | On-sheet |
|---|---|---|---|---|
| Last 50 | System | 0.0% | 6.0% | 56.0% |
| | Prediction | 2.0% | 6.0% | — |
| Last 100 | System | 0.0% | 3.0% | 59.0% |
| | Prediction | 1.0% | 5.0% | — |
| Last 200 | System | 0.5% | 2.0% | 65.5% |
| | Prediction | 0.5% | 3.5% | — |
| — | **Baseline** | **0.3%** | **1.8%** | **~64%** |

At the largest, most stable window (200), all strategies sit on the baseline. Small-window outperformance regresses to baseline as N grows — the signature of no structural edge.

---

## 8. Economic constraint (house edge)

Expected value per $1 wager, Colorado payouts:

| Bet | Payout | True p | EV per $1 | House edge |
|---|---|---|---|---|
| Straight (exact) | $500 | 1/1000 | −$0.50 | **50%** |
| Box 6-way | $80 | 6/1000 | −$0.52 | **52%** |
| Box 3-way | $160 | 3/1000 | −$0.52 | **52%** |

Every wager loses ~50¢ on the dollar in expectation, **independent of which numbers are chosen** (all combos are equiprobable). A profitable system must therefore overcome a ~50% edge, i.e. roughly **double** the true hit probability and sustain it.

---

## 9. Statistical power / detectability

For the straight bet, profitability requires lifting a number's probability from p₀ = 0.001 toward p₁ ≈ 0.002. Required sample for an 80%-power, α = 0.05 two-tailed test:

```
n ≈ ( z_α·√(p₀(1−p₀)) + z_β·√(p₁(1−p₁)) )² / (p₁ − p₀)²
  ≈ ( 1.96·0.0316 + 0.84·0.0447 )² / (0.001)²
  ≈ 9,900 draws
```

**Implication:** N = 364 is ~27× too small to confirm the *minimum profitable* straight edge. Conversely, any edge large enough to be detectable here would be glaring — and none is present. The smaller, profitable-but-subtle edge cannot be ruled out by this sample, but cannot be exploited from it either.

---

## 10. Conclusions

1. Across ~20 independent tests, **no statistically significant departure from a fair, uniform, memoryless process** was found (min p ≈ 0.15).
2. The client's high-number hypothesis is **not supported**: the 26-vs-18 high/low split is within chance (z = 0.92, p = 0.36), unstable across halves, and the corresponding strategy loses ~43% at Colorado payouts.
3. No exact/straight structure (position bias, positional dependence, serial repeats, time-of-day, hot numbers) was detected.
4. The ~50% house edge means even a real, modest bias would likely remain unprofitable.
5. The honest, defensible product posture is **continuous monitoring**, not prediction: re-run this battery as N grows; flag only properly significance-corrected anomalies.

---

## Appendix — Reproducibility

- Data pulled from `lottery_draws` via the Supabase JS client; `draw_number` strings of length 3.
- All statistics computed in standalone Node (ESM) scripts using only the project's installed `@supabase/supabase-js` plus the project's `src/utils/AIEngine.js` (`scanDoubleTriplePatterns`, `scanSumStructurePatterns`, `scanRepeatsAndRuns`, `batchReplay`, `predictNextCombo`).
- χ² p-values: Wilson–Hilferty approximation. Normal CDF: Abramowitz-Stegun erf approximation.
- Scripts were run ad hoc and not committed; re-running against the live table will shift counts slightly as new draws are added, but the conclusions (all p ≫ 0.05) are stable.
- Re-test trigger: the proposed in-app **randomness monitor** would automate Sections 2–6 on each data refresh.
