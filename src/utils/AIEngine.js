/**
 * AIEngine.js
 * Implements the mathematical combinatorics and predictive data analysis
 * for "The Inverse Method: Pick-3 Box Strategy".
 */

/**
 * Generates all 120 unique Pick-3 combinations with non-repeating digits.
 * Sorted internally (e.g. "012") to standardize Box matching.
 * @returns {string[]} Standardized 3-digit strings
 */
export function generateMasterList() {
  const list = [];
  for (let i = 0; i <= 7; i++) {
    for (let j = i + 1; j <= 8; j++) {
      for (let k = j + 1; k <= 9; k++) {
        list.push(`${i}${j}${k}`);
      }
    }
  }
  return list;
}

/**
 * Checks if a string has repeating digits (doubles or triples).
 * @param {string} draw 
 * @returns {boolean} True if repeating
 */
export function isDoubleOrTriple(draw) {
  if (!draw || draw.length !== 3) return false;
  return draw[0] === draw[1] || draw[1] === draw[2] || draw[0] === draw[2];
}

/**
 * Analyzes the frequency of each digit (0-9) over the provided history.
 * @param {string[]} draws Array of 3-digit draw strings
 * @returns {Record<number, number>} Digit frequency map
 */
export function calculateFrequencies(draws) {
  const freq = {};
  for (let i = 0; i <= 9; i++) freq[i] = 0;
  
  // Count frequency in non-double/triple draws to align with the core system
  draws.forEach(draw => {
    if (isDoubleOrTriple(draw)) return;
    const digits = new Set(draw.split(''));
    digits.forEach(d => {
      const num = parseInt(d, 10);
      if (!isNaN(num)) freq[num]++;
    });
  });
  
  return freq;
}

/**
 * Calculates how many draws ago each digit (0-9) was last seen.
 * Larger numbers mean the digit is "colder" (overdue).
 * @param {string[]} draws Array of 3-digit draw strings
 * @returns {Record<number, number>} Digit gap map
 */
export function calculateGapTimes(draws) {
  const gaps = {};
  for (let i = 0; i <= 9; i++) gaps[i] = 999; // Default highly overdue
  
  // Iterate from newest (index 0) to oldest
  for (let step = 0; step < draws.length; step++) {
    const draw = draws[step];
    if (isDoubleOrTriple(draw)) continue;
    
    const digits = draw.split('');
    digits.forEach(d => {
      const num = parseInt(d, 10);
      if (!isNaN(num) && gaps[num] === 999) {
        gaps[num] = step; // Gap is index of first occurrence
      }
    });
  }
  
  return gaps;
}

/**
 * Suggests the top cold digits to eliminate.
 * Prioritizes high Gap Time (overdue), then low Frequency.
 * @param {Record<number, number>} frequencies
 * @param {Record<number, number>} gapTimes
 * @param {number} count Number of digits to recommend (2, 3, or 4)
 * @returns {number[]} Digits recommended for elimination
 */
export function getAIRecommendations(frequencies, gapTimes, count = 3) {
  const digits = Array.from({ length: 10 }, (_, i) => i);
  
  // Sort digits: coldest first (largest gap, then lowest frequency)
  digits.sort((a, b) => {
    // Primary sort: gap time (descending - larger gap is colder)
    if (gapTimes[a] !== gapTimes[b]) {
      return gapTimes[b] - gapTimes[a];
    }
    // Secondary sort: frequency (ascending - lower frequency is colder)
    return frequencies[a] - frequencies[b];
  });
  
  return digits.slice(0, count);
}

/**
 * Filters combinations by eliminating those containing any specified digits.
 * @param {string[]} masterList
 * @param {number[]} eliminatedDigits
 * @returns {string[]} Filtered combinations
 */
export function eliminateCombinations(masterList, eliminatedDigits) {
  const elimSet = new Set(eliminatedDigits.map(String));
  return masterList.filter(comb => {
    const digits = comb.split('');
    return !digits.some(d => elimSet.has(d));
  });
}

/**
 * Normalizes a 3-digit draw to a sorted string (e.g. "312" -> "123").
 * @param {string} draw 
 * @returns {string} Standardized sorted string
 */
export function normalizeDraw(draw) {
  if (!draw || draw.length !== 3) return '';
  return draw.split('').sort().join('');
}

/**
 * Applies the 14-day history filter (removes any combinations drawn in the last 14 unique runs).
 * @param {string[]} combinations Active combinations to filter
 * @param {string[]} recentDraws Array of past drawings
 * @returns {string[]} Filtered play list
 */
export function applyHistoryFilter(combinations, recentDraws, days = 14) {
  // Grab the last 'days' non-double/triple draws
  const filterList = recentDraws
    .filter(draw => !isDoubleOrTriple(draw))
    .slice(0, days)
    .map(normalizeDraw);
    
  const filterSet = new Set(filterList);
  
  return combinations.filter(comb => !filterSet.has(comb));
}

/**
 * Runs a historical backtest simulation over the dataset.
 * @param {Array<{date: string, draw: string}>} draws Reverse-chronological draws
 * @param {Object} config Simulation parameters
 * @returns {Object} Simulation results including timeline and summary stats
 */
export function runBacktest(draws, config) {
  const { lookbackWindow = 50, elimCount = 3, useHistoryFilter = true, historyFilterDays = 14, wager = 1.00, payout = 80.00 } = config;
  
  let totalWins = 0;
  let totalLosses = 0;
  let totalSpend = 0;
  let totalReturn = 0;
  const timeline = [];

  const maxStartIndex = draws.length - 1 - lookbackWindow;
  
  // Iterate from oldest playable draw to newest
  for (let i = maxStartIndex; i >= 0; i--) {
    const currentDraw = draws[i];
    
    // The "past" is the window strictly before the current draw
    const pastDraws = draws.slice(i + 1, i + 1 + lookbackWindow).map(d => d.draw);
    
    // Calculate AI state based ONLY on the past
    const freqs = calculateFrequencies(pastDraws);
    const gaps = calculateGapTimes(pastDraws);
    const elims = getAIRecommendations(freqs, gaps, elimCount);
    
    // Generate plays
    let combinations = generateMasterList();
    combinations = eliminateCombinations(combinations, elims);
    if (useHistoryFilter) {
      combinations = applyHistoryFilter(combinations, pastDraws, historyFilterDays);
    }
    
    const cost = combinations.length * wager;
    totalSpend += cost;
    
    // Evaluate outcome
    const isDoubleTriple = isDoubleOrTriple(currentDraw.draw);
    const actualNorm = normalizeDraw(currentDraw.draw);
    
    const isHit = !isDoubleTriple && combinations.includes(actualNorm);
    
    let drawProfit = 0;
    if (isHit) {
      totalWins++;
      totalReturn += payout;
      drawProfit = payout - cost;
    } else {
      totalLosses++;
      drawProfit = -cost;
    }
    
    timeline.push({
      date: currentDraw.date,
      draw: currentDraw.draw,
      isHit,
      cost,
      combinations: combinations,
      elims,
      profit: drawProfit,
      cumulativeProfit: totalReturn - totalSpend
    });
  }
  
  return {
    totalWins,
    totalLosses,
    totalSpend,
    totalReturn,
    netProfit: totalReturn - totalSpend,
    winRate: (totalWins / (totalWins + totalLosses)) * 100,
    totalDraws: totalWins + totalLosses,
    timeline
  };
}

/**
 * Scores each combo in the active list by draws since its last box hit.
 * Most overdue combos are ranked first. Powers Sniper Mode and Top Picks.
 * @param {string[]} combinations Active combo list (sorted box strings e.g. "345")
 * @param {string[]} draws Raw draw strings newest-first
 * @param {number} lookback Number of draws to scan back
 * @returns {Array<{combo: string, lastHit: number, frequency: number}>} Sorted most-overdue first
 */
export function scoreComboGaps(combinations, draws, lookback = 200) {
  const recent = draws.slice(0, lookback);
  return combinations.map(combo => {
    let lastHit = 999;
    let frequency = 0;
    for (let i = 0; i < recent.length; i++) {
      if (!isDoubleOrTriple(recent[i]) && normalizeDraw(recent[i]) === combo) {
        frequency++;
        if (lastHit === 999) lastHit = i;
      }
    }
    return { combo, lastHit, frequency };
  }).sort((a, b) => b.lastHit - a.lastHit);
}

/**
 * Counts how often each digit (0-9) appears in each draw position over recent draws.
 * Skips doubles/triples to keep analysis aligned with the master list universe.
 * @param {string[]} draws Raw draw strings newest-first
 * @param {number} lookback Number of recent draws to analyze
 * @returns {Array<Record<number, number>>} 3-element array [pos0, pos1, pos2] of digit→count maps
 */
export function getPositionFrequencies(draws, lookback = 14) {
  const recent = draws.slice(0, lookback).filter(d => !isDoubleOrTriple(d));
  const positions = [0, 1, 2].map(() => {
    const freq = {};
    for (let i = 0; i <= 9; i++) freq[i] = 0;
    return freq;
  });
  recent.forEach(draw => {
    if (draw && draw.length === 3) {
      draw.split('').forEach((digit, pos) => {
        const num = parseInt(digit, 10);
        if (!isNaN(num)) positions[pos][num]++;
      });
    }
  });
  return positions;
}

/**
 * Generates all 6 exact-order permutations of a 3-digit combination.
 * All master list combos have non-repeating digits, so there are always exactly 6.
 * @param {string} combo A 3-digit combination (e.g. "345")
 * @returns {string[]} All 6 orderings
 */
export function getPermutations(combo) {
  const [a, b, c] = combo.split('');
  return [
    `${a}${b}${c}`, `${a}${c}${b}`,
    `${b}${a}${c}`, `${b}${c}${a}`,
    `${c}${a}${b}`, `${c}${b}${a}`
  ];
}

/**
 * Scores all 6 straight (exact-order) permutations of a box combination against recent draws.
 * Returns them sorted most-overdue first to guide straight/exact betting selection.
 * @param {string} combo Sorted box combo (e.g. "345")
 * @param {string[]} draws Raw draw strings newest-first (e.g. ["543", "876", ...])
 * @param {number} lookback How many recent draws to scan
 * @returns {Array<{perm: string, lastHit: number, frequency: number}>}
 */
export function scoreStraightPermutations(combo, draws, lookback = 100) {
  const perms = getPermutations(combo);
  const recent = draws.slice(0, lookback);

  return perms.map(perm => {
    let lastHit = 999;
    let frequency = 0;
    for (let i = 0; i < recent.length; i++) {
      if (recent[i] === perm) {
        frequency++;
        if (lastHit === 999) lastHit = i;
      }
    }
    return { perm, lastHit, frequency };
  }).sort((a, b) => b.lastHit - a.lastHit);
}

/**
 * Counts how many times each combo in the master list has appeared as a box hit
 * within the most recent `lookback` draws. Skips doubles/triples.
 * Returns combos ranked most-frequent first, plus metadata used for pattern analysis.
 *
 * @param {string[]} masterList  All 120 non-repeating combos
 * @param {string[]} draws       Raw draw strings newest-first
 * @param {number}   lookback    How many draws to scan (use draws.length for all data)
 * @returns {{ ranked: Array<{combo,hits}>, validDrawCount: number, expectedHits: number }}
 */
export function scoreComboFrequency(masterList, draws, lookback) {
  const recent = draws.slice(0, lookback);
  const validDraws = recent.filter(d => !isDoubleOrTriple(d));

  const counts = Object.fromEntries(masterList.map(c => [c, 0]));
  validDraws.forEach(draw => {
    const norm = normalizeDraw(draw);
    if (Object.prototype.hasOwnProperty.call(counts, norm)) counts[norm]++;
  });

  const ranked = masterList
    .map(combo => ({ combo, hits: counts[combo] }))
    .sort((a, b) => b.hits - a.hits);

  return {
    ranked,
    validDrawCount: validDraws.length,
    expectedHits: validDraws.length / 120,
  };
}

/**
 * True only when all three digits are identical (e.g. "333").
 * @param {string} draw
 * @returns {boolean}
 */
export function isTriple(draw) {
  if (!draw || draw.length !== 3) return false;
  return draw[0] === draw[1] && draw[1] === draw[2];
}

/**
 * True only when exactly two of the three digits match (e.g. "112", "522").
 * Triples ("333") are NOT doubles.
 * @param {string} draw
 * @returns {boolean}
 */
export function isDouble(draw) {
  return isDoubleOrTriple(draw) && !isTriple(draw);
}

/**
 * Given a sorted index list of where an event occurred within a newest-first
 * window, derive its gap statistics. Index 0 = most recent draw.
 *
 * @param {number[]} idxArray  Indices (draws-ago) where the event occurred, ascending
 * @param {number}   total     Total draws scanned in the window
 * @returns {{count:number, rate:number, currentGap:number, avgGap:(number|null), maxDrought:number}}
 *   currentGap — draws since the event last occurred (=total if it never did)
 *   avgGap     — average draws between occurrences (null if it never occurred)
 *   maxDrought — longest run of consecutive draws without the event
 */
export function computeGapStats(idxArray, total) {
  const count = idxArray.length;
  const rate = total ? count / total : 0;
  const currentGap = count ? idxArray[0] : total;
  const avgGap = count ? total / count : null;

  let maxDrought = 0;
  let prev = -1;
  idxArray.forEach(idx => {
    const gap = idx - prev - 1; // draws strictly between this and the previous occurrence
    if (gap > maxDrought) maxDrought = gap;
    prev = idx;
  });
  const trailing = total - 1 - prev; // run from the oldest occurrence to the window edge
  if (trailing > maxDrought) maxDrought = trailing;

  return { count, rate, currentGap, avgGap, maxDrought };
}

/**
 * Scans a window of draws for double/triple patterns — the structural events the
 * core Inverse Method deliberately excludes. Powers PatternScanPanel.
 *
 * Pick-3 straight baselines (for reference, true random draw):
 *   • single (no repeat) = 720/1000 = 72%
 *   • double             = 270/1000 = 27%
 *   • triple             =  10/1000 =  1%
 *
 * @param {string[]} draws  Raw draw strings, newest-first, already windowed by the caller
 * @returns {{
 *   total:number, doubleCount:number, tripleCount:number, singleCount:number,
 *   doubleStats:object, tripleStats:object, anyStats:object,
 *   doubleDigitFreq:Record<number,number>, topPairs:Array<[string,number]>
 * }}
 */
export function scanDoubleTriplePatterns(draws) {
  const valid = draws.filter(d => d && d.length === 3);
  const total = valid.length;

  const doubleDigitFreq = {};
  for (let i = 0; i <= 9; i++) doubleDigitFreq[i] = 0;
  const pairFreq = {};

  const doubleIdx = [];
  const tripleIdx = [];
  const anyIdx = [];

  let doubleCount = 0;
  let tripleCount = 0;
  let singleCount = 0;

  valid.forEach((draw, i) => {
    if (isTriple(draw)) {
      tripleCount++;
      tripleIdx.push(i);
      anyIdx.push(i);
      const d = draw[0];
      doubleDigitFreq[d]++;
      const key = `${d}${d}${d}`;
      pairFreq[key] = (pairFreq[key] || 0) + 1;
    } else if (isDouble(draw)) {
      doubleCount++;
      doubleIdx.push(i);
      anyIdx.push(i);
      const counts = {};
      draw.split('').forEach(c => { counts[c] = (counts[c] || 0) + 1; });
      const repeated = Object.keys(counts).find(k => counts[k] === 2);
      doubleDigitFreq[repeated]++;
      const key = `${repeated}${repeated}`;
      pairFreq[key] = (pairFreq[key] || 0) + 1;
    } else {
      singleCount++;
    }
  });

  return {
    total,
    doubleCount,
    tripleCount,
    singleCount,
    doubleStats: computeGapStats(doubleIdx, total),
    tripleStats: computeGapStats(tripleIdx, total),
    anyStats: computeGapStats(anyIdx, total),
    doubleDigitFreq,
    topPairs: Object.entries(pairFreq).sort((a, b) => b[1] - a[1]),
  };
}

/**
 * Sum of a draw's three digits (0–27).
 * @param {string} draw
 * @returns {number}
 */
export function digitSum(draw) {
  if (!draw || draw.length !== 3) return 0;
  return draw.split('').reduce((s, c) => s + (parseInt(c, 10) || 0), 0);
}

/**
 * Scans a window of draws for sum and structure patterns:
 *   • digit-sum distribution (0–27) + average and most common sum
 *   • high/low split — digits 5–9 are "high", 0–4 are "low" (count of high digits 0–3)
 *   • even/odd split — count of even digits 0–3
 *
 * Analyzes every valid 3-digit draw (doubles/triples included — sum and parity
 * apply to any draw). Powers the Sum & Structure section of PatternScanPanel.
 *
 * @param {string[]} draws  Raw draw strings, newest-first, already windowed by the caller
 * @returns {{
 *   total:number, sumCounts:number[], avgSum:number,
 *   mostCommonSum:number, mostCommonSumCount:number,
 *   highCounts:number[], evenCounts:number[]
 * }}  highCounts/evenCounts are length-4 arrays indexed by how many digits qualify (0–3)
 */
export function scanSumStructurePatterns(draws) {
  const valid = draws.filter(d => d && d.length === 3);
  const total = valid.length;

  const sumCounts = new Array(28).fill(0);
  const highCounts = [0, 0, 0, 0];
  const evenCounts = [0, 0, 0, 0];
  let sumTotal = 0;

  valid.forEach(draw => {
    const digits = draw.split('').map(Number);
    const s = digits.reduce((a, b) => a + b, 0);
    sumCounts[s]++;
    sumTotal += s;
    highCounts[digits.filter(d => d >= 5).length]++;
    evenCounts[digits.filter(d => d % 2 === 0).length]++;
  });

  let mostCommonSum = 0;
  let mostCommonSumCount = 0;
  sumCounts.forEach((c, s) => {
    if (c > mostCommonSumCount) { mostCommonSumCount = c; mostCommonSum = s; }
  });

  return {
    total,
    sumCounts,
    avgSum: total ? sumTotal / total : 0,
    mostCommonSum,
    mostCommonSumCount,
    highCounts,
    evenCounts,
  };
}

/**
 * Scans a window of draws for repeat and run patterns:
 *   • digit carryover — how many digits a draw shares with the one immediately before it
 *   • carryover streaks — consecutive draws that each share ≥1 digit with the prior draw
 *   • back-to-back repeats — the same box combo (or exact number) twice in a row
 *   • quick returns — a box combo that reappears within `quickWindow` draws
 *
 * Draws are newest-first; the "previous draw" for valid[i] is valid[i+1].
 * Powers the Repeats & Runs section of PatternScanPanel.
 *
 * @param {string[]} draws       Raw draw strings, newest-first, already windowed
 * @param {number}   quickWindow How close a box repeat must be to count as a "quick return"
 * @returns {{
 *   total:number, transitions:number,
 *   carryoverCounts:number[], avgCarryover:number,
 *   currentCarryStreak:number, longestCarryStreak:number,
 *   backToBackBox:number, backToBackExact:number,
 *   quickWindow:number, quickReturns:number,
 *   quickExamples:Array<{draw:string, gap:number}>
 * }}  carryoverCounts is length-4, indexed by shared-digit count (0–3)
 */
export function scanRepeatsAndRuns(draws, quickWindow = 5) {
  const valid = draws.filter(d => d && d.length === 3);
  const total = valid.length;
  const transitions = Math.max(0, total - 1);

  const carryoverCounts = [0, 0, 0, 0];
  const carryFlags = []; // newest-first, true when a transition shares ≥1 digit
  let carrySum = 0;

  for (let i = 0; i < total - 1; i++) {
    const cur = new Set(valid[i].split(''));
    const prev = new Set(valid[i + 1].split(''));
    let shared = 0;
    cur.forEach(d => { if (prev.has(d)) shared++; });
    carryoverCounts[shared]++;
    carrySum += shared;
    carryFlags.push(shared >= 1);
  }

  const avgCarryover = transitions ? carrySum / transitions : 0;

  let currentCarryStreak = 0;
  for (let i = 0; i < carryFlags.length; i++) {
    if (carryFlags[i]) currentCarryStreak++; else break;
  }

  let longestCarryStreak = 0;
  let run = 0;
  carryFlags.forEach(f => {
    if (f) { run++; if (run > longestCarryStreak) longestCarryStreak = run; } else { run = 0; }
  });

  let backToBackBox = 0;
  let backToBackExact = 0;
  for (let i = 0; i < total - 1; i++) {
    if (valid[i] === valid[i + 1]) backToBackExact++;
    if (normalizeDraw(valid[i]) === normalizeDraw(valid[i + 1])) backToBackBox++;
  }

  let quickReturns = 0;
  const quickExamples = [];
  for (let i = 0; i < total; i++) {
    const norm = normalizeDraw(valid[i]);
    for (let j = i + 1; j <= i + quickWindow && j < total; j++) {
      if (normalizeDraw(valid[j]) === norm) {
        quickReturns++;
        if (quickExamples.length < 8) quickExamples.push({ draw: valid[i], gap: j - i });
        break; // count each draw at most once
      }
    }
  }

  return {
    total,
    transitions,
    carryoverCounts,
    avgCarryover,
    currentCarryStreak,
    longestCarryStreak,
    backToBackBox,
    backToBackExact,
    quickWindow,
    quickReturns,
    quickExamples,
  };
}

/**
 * The Master List exactly as printed in "The Inverse Method Guide" — each of the
 * 120 box combinations in the guide's specific permutation AND print order.
 *
 * DISPLAY ONLY. Every entry normalizes (sorts) to one of the 120 box combos from
 * generateMasterList(). All matching/scoring/state must use the sorted box form;
 * never key data off these strings. Verified identical set to generateMasterList().
 */
export const GUIDE_MASTER_LIST = [
  '210', '310', '203', '321', '410', '402', '421', '403', '413', '432',
  '510', '502', '521', '530', '513', '532', '540', '541', '542', '543',
  '610', '602', '621', '630', '631', '632', '604', '641', '642', '643',
  '650', '615', '652', '653', '654', '701', '720', '721', '730', '713',
  '732', '740', '714', '742', '743', '750', '751', '752', '735', '754',
  '760', '761', '726', '763', '764', '765', '810', '802', '812', '830',
  '831', '832', '804', '841', '842', '843', '850', '851', '852', '853',
  '854', '860', '861', '826', '863', '864', '865', '807', '871', '827',
  '873', '874', '875', '876', '910', '902', '921', '930', '931', '932',
  '940', '941', '942', '943', '950', '951', '952', '935', '954', '960',
  '961', '962', '982', '938', '984', '958', '986', '978', '963', '946',
  '965', '970', '971', '927', '973', '974', '957', '976', '908', '981',
];

// sorted box form -> guide's printed form (e.g. "012" -> "210")
const GUIDE_FORM_MAP = Object.fromEntries(
  GUIDE_MASTER_LIST.map(n => [normalizeDraw(n), n])
);

/**
 * Converts a sorted box combo ("012") to the form printed in the guide ("210")
 * for display / cross-reference. Falls back to the input if not found.
 * @param {string} sortedCombo
 * @returns {string}
 */
export function toGuideForm(sortedCombo) {
  return GUIDE_FORM_MAP[sortedCombo] || sortedCombo;
}

/**
 * Finds the single most-likely EXACT ordering of a box combo, based on which
 * digit appears most often in each draw position. Because the combo's 3 digits
 * are all distinct, the result is always a valid non-repeating straight number.
 *
 * @param {string} combo  Sorted box combo (e.g. "138")
 * @param {Array<Record<number,number>>} posFreq  From getPositionFrequencies
 * @param {number[]} maxPos  Per-position max count (for normalization)
 * @returns {{ perm: string, posScore: number }}  posScore is 0..1 (higher = more likely order)
 */
export function getBestExactOrdering(combo, posFreq, maxPos) {
  let best = null;
  getPermutations(combo).forEach(perm => {
    let posScore = 0;
    for (let i = 0; i < 3; i++) {
      posScore += (posFreq[i][perm[i]] || 0) / (maxPos[i] || 1);
    }
    posScore /= 3;
    if (!best || posScore > best.posScore) best = { perm, posScore };
  });
  return best;
}

/**
 * Ranks the best EXACT (straight) plays across the supplied combos — the highest
 * payout target. Each combo contributes its single most position-likely ordering.
 * Score blends:
 *   • dueScore   — how overdue the box combo is (likely to hit soon)
 *   • posScore   — how well the chosen order matches recent position trends (likely arrangement)
 *
 * @param {string[]} combos    Active box combos (sorted form)
 * @param {string[]} draws     Raw draw strings newest-first
 * @param {number}   lookback  Draws to scan
 * @returns {Array<{exact,combo,boxGap,boxFreq,posScore,dueScore,score}>} best-first
 */
export function scoreExactPlays(combos, draws, lookback = 60) {
  const posFreq = getPositionFrequencies(draws, lookback);
  const maxPos = posFreq.map(f => Math.max(1, ...Object.values(f)));

  const gapMap = {};
  scoreComboGaps(combos, draws, lookback).forEach(s => { gapMap[s.combo] = s; });

  return combos.map(combo => {
    const g = gapMap[combo] || { lastHit: 999, frequency: 0 };
    const boxGap = g.lastHit;
    const dueScore = boxGap === 999 ? 1 : Math.min(boxGap / lookback, 1);
    const best = getBestExactOrdering(combo, posFreq, maxPos);
    const score = dueScore * 0.6 + best.posScore * 0.4;
    return {
      exact: best.perm,
      combo,
      boxGap,
      boxFreq: g.frequency,
      posScore: best.posScore,
      dueScore,
      score,
    };
  }).sort((a, b) => b.score - a.score);
}

/**
 * TIME MACHINE — replays the live recommendation engine as it would have stood
 * immediately BEFORE the draw at `index`, then grades it against the actual result.
 *
 * Only draws strictly older than `index` are used (draws.slice(index + 1)) — exactly
 * what the system would have known at the time, with no look-ahead. Mirrors the live
 * panels: BestExactPanel (applyHistoryFilter → scoreExactPlays) and PlayGeneratorPanel's
 * Today's Top Picks (scoreComboGaps over the same active list).
 *
 * @param {Array<{date:string, draw:string}>} draws  Newest-first
 * @param {number} index  Index of the draw to evaluate (0 = most recent)
 * @param {Object} config { lookback=28, historyFilterDays=14, exactCount=3, boxCount=3 }
 * @returns {{
 *   actual:object|null, actualBox:string, isDoubleTriple:boolean, pastCount:number,
 *   lookback:number, historyFilterDays:number, activeCount:number,
 *   exactPlays:Array, boxPicks:Array,
 *   exactHit:boolean, exactBoxHit:boolean, boxPickHit:boolean, inActive:boolean
 * }}
 */
export function replaySystemPick(draws, index, config = {}) {
  const { lookback = 28, historyFilterDays = 14, exactCount = 3, boxCount = 3 } = config;

  const actual = draws[index] || null;
  const pastStrings = draws.slice(index + 1).map(d => d.draw);

  const masterList = generateMasterList();
  const active = applyHistoryFilter(masterList, pastStrings, historyFilterDays);
  const activeSet = new Set(active);

  const exactPlays = scoreExactPlays(active, pastStrings, lookback).slice(0, exactCount);
  const boxPicks = scoreComboGaps(active, pastStrings, lookback).slice(0, boxCount);

  const actualDraw = actual ? actual.draw : '';
  const isDoubleTriple = isDoubleOrTriple(actualDraw);
  const actualBox = isDoubleTriple ? '' : normalizeDraw(actualDraw);

  return {
    actual,
    actualBox,
    isDoubleTriple,
    pastCount: pastStrings.length,
    lookback,
    historyFilterDays,
    activeCount: active.length,
    exactPlays,
    boxPicks,
    exactHit: exactPlays.some(p => p.exact === actualDraw),
    exactBoxHit: !isDoubleTriple && exactPlays.some(p => p.combo === actualBox),
    boxPickHit: !isDoubleTriple && boxPicks.some(p => p.combo === actualBox),
    inActive: !isDoubleTriple && activeSet.has(actualBox),
  };
}

/** Index of the largest value in an array (first on ties). */
function argMaxIndex(arr) {
  let bi = 0;
  let bv = -Infinity;
  arr.forEach((v, i) => { if (v > bv) { bv = v; bi = i; } });
  return bi;
}

/**
 * PATTERN-INFORMED PREDICTION — blends the app's overdue/gap thesis with the
 * Winning-Number Pattern Scanner profile to produce a ranked shortlist.
 *
 * HONESTY NOTE: a legitimate Pick-3 draw is independent and uniform, so this does
 * NOT raise the true probability of any combo (every box stays 6/1000). It is a
 * disciplined, transparent way to choose IF playing anyway — `dueScore` carries the
 * product thesis; the scanner profile (sum band, high/low & even/odd shape, digit
 * carryover) only re-ranks within it.
 *
 * @param {Array<{date:string, draw:string}>} draws  Newest-first
 * @param {Object} config { lookback=60, historyFilterDays=14, dueWeight=0.65, count=3 }
 * @returns {{ predictions:Array, profile:Object, doublesSideBet:Object }}
 */
export function predictNextCombo(draws, config = {}) {
  const { lookback = 60, historyFilterDays = 14, dueWeight = 0.65, count = 3 } = config;

  const drawStrings = draws.map(d => d.draw);
  const windowStrings = drawStrings.slice(0, lookback);
  const masterList = generateMasterList();
  const active = applyHistoryFilter(masterList, drawStrings, historyFilterDays);

  // --- Profile derived from the scanner over the window ---
  const sumStruct = scanSumStructurePatterns(windowStrings);
  const repeats = scanRepeatsAndRuns(windowStrings);
  const dt = scanDoubleTriplePatterns(windowStrings);

  // Sum mean & spread from the observed distribution
  let n = 0;
  let sAccum = 0;
  sumStruct.sumCounts.forEach((c, s) => { n += c; sAccum += c * s; });
  const sumMean = n ? sAccum / n : 13.5;
  let varAccum = 0;
  sumStruct.sumCounts.forEach((c, s) => { varAccum += c * (s - sumMean) ** 2; });
  const sumStd = n ? Math.max(2, Math.sqrt(varAccum / n)) : 5;

  const dominantHigh = argMaxIndex(sumStruct.highCounts); // 0..3 high digits
  const dominantEven = argMaxIndex(sumStruct.evenCounts); // 0..3 even digits

  // Carryover only matters if recent draws actually carry digits forward
  const carryWeight = Math.min(1, repeats.avgCarryover / 1.5);
  const lastDigits = new Set((drawStrings[0] || '').split(''));

  // Overdue scores over the active list
  const gapMap = {};
  scoreComboGaps(active, drawStrings, lookback).forEach(g => { gapMap[g.combo] = g; });

  // Position trends for the most-likely exact ordering
  const posFreq = getPositionFrequencies(drawStrings, lookback);
  const posMax = posFreq.map(f => Math.max(1, ...Object.values(f)));

  const wSum = 0.35;
  const wHigh = 0.2;
  const wEven = 0.2;
  const wCarry = 0.25 * carryWeight;
  const wTotal = wSum + wHigh + wEven + wCarry;

  const scored = active.map(combo => {
    const digits = combo.split('').map(Number);
    const s = digits.reduce((a, b) => a + b, 0);
    const hc = digits.filter(d => d >= 5).length;
    const ec = digits.filter(d => d % 2 === 0).length;
    const shared = digits.filter(d => lastDigits.has(String(d))).length;

    const sumScore = Math.exp(-((s - sumMean) ** 2) / (2 * sumStd * sumStd));
    const highScore = 1 - Math.abs(hc - dominantHigh) / 3;
    const evenScore = 1 - Math.abs(ec - dominantEven) / 3;
    const carryScore = shared / 3;

    const profileMatch = (sumScore * wSum + highScore * wHigh + evenScore * wEven + carryScore * wCarry) / wTotal;

    const g = gapMap[combo] || { lastHit: 999, frequency: 0 };
    const dueScore = g.lastHit === 999 ? 1 : Math.min(g.lastHit / lookback, 1);

    const final = dueWeight * dueScore + (1 - dueWeight) * profileMatch;
    const best = getBestExactOrdering(combo, posFreq, posMax);

    return {
      combo,
      exact: best.perm,
      sum: s,
      highCount: hc,
      evenCount: ec,
      carryShared: shared,
      sumScore,
      highScore,
      evenScore,
      carryScore,
      posScore: best.posScore,
      dueScore,
      profileMatch,
      final,
      lastHit: g.lastHit,
    };
  }).sort((a, b) => b.final - a.final);

  const hotDigit = argMaxIndex(Object.values(dt.doubleDigitFreq));

  return {
    predictions: scored.slice(0, count),
    profile: {
      sumMean,
      sumStd,
      targetSum: Math.round(sumMean),
      dominantHigh,
      dominantEven,
      avgCarryover: repeats.avgCarryover,
      carryWeight,
      lastDraw: drawStrings[0] || '',
      windowCount: windowStrings.length,
      activeCount: active.length,
      dueWeight,
    },
    doublesSideBet: {
      currentGap: dt.doubleStats.currentGap,
      avgGap: dt.doubleStats.avgGap,
      overdue: dt.doubleStats.avgGap != null && dt.doubleStats.currentGap > dt.doubleStats.avgGap,
      hotDigit,
      suggestedDouble: `${hotDigit}${hotDigit}`,
      count: dt.doubleStats.count,
    },
  };
}

/**
 * BATCH TIME MACHINE — replays both the live system (Best Exact Plays + Top Picks)
 * and the Pattern-Informed Prediction over the most recent `count` draws, each with
 * no look-ahead, and tallies actual hit rates against the random baseline.
 *
 * Baselines reflect that draws are uniform: any fixed-size selection has the same
 * expected hit rate, so a strategy "working" means beating these — which over a small
 * sample is usually just noise. That comparison is the whole point of the tool.
 *
 * @param {Array<{date:string, draw:string}>} draws  Newest-first
 * @param {Object} config { count=30, lookback=28, historyFilterDays=14, exactCount=3, boxCount=3, dueWeight=0.65, minHistory=10 }
 * @returns {{
 *   evaluated:number, outOfUniverse:number, avgActive:number,
 *   system:{straight:number, box:number, sheet:number},
 *   prediction:{straight:number, box:number},
 *   baseline:{straightRate:number, boxRate:number, sheetRate:number},
 *   exactCount:number, boxCount:number
 * }}
 */
export function batchReplay(draws, config = {}) {
  const {
    count = 30, lookback = 28, historyFilterDays = 14,
    exactCount = 3, boxCount = 3, dueWeight = 0.65, minHistory = 10,
  } = config;

  let evaluated = 0;
  let outOfUniverse = 0;
  let activeSum = 0;
  let sysStraight = 0;
  let sysBox = 0;
  let sysSheet = 0;
  let predStraight = 0;
  let predBox = 0;

  const limit = Math.min(count, draws.length);
  for (let i = 0; i < limit; i++) {
    const pastLen = draws.length - (i + 1);
    if (pastLen < minHistory) break; // older draws lack enough history for a fair test

    const actual = draws[i].draw;
    const isDT = isDoubleOrTriple(actual);
    const actualBox = isDT ? '' : normalizeDraw(actual);

    const r = replaySystemPick(draws, i, { lookback, historyFilterDays, exactCount, boxCount });
    evaluated++;
    activeSum += r.activeCount;
    if (isDT) outOfUniverse++;
    if (r.exactHit) sysStraight++;
    if (r.exactBoxHit || r.boxPickHit) sysBox++;
    if (r.inActive) sysSheet++;

    const pred = predictNextCombo(draws.slice(i + 1), {
      lookback, historyFilterDays, dueWeight, count: Math.max(exactCount, boxCount),
    });
    if (pred.predictions.slice(0, exactCount).some(p => p.exact === actual)) predStraight++;
    if (!isDT && pred.predictions.slice(0, boxCount).some(p => p.combo === actualBox)) predBox++;
  }

  const avgActive = evaluated ? activeSum / evaluated : 0;

  return {
    evaluated,
    outOfUniverse,
    avgActive,
    system: { straight: sysStraight, box: sysBox, sheet: sysSheet },
    prediction: { straight: predStraight, box: predBox },
    baseline: {
      straightRate: exactCount / 1000,
      boxRate: (boxCount * 6) / 1000,
      sheetRate: (avgActive * 6) / 1000,
    },
    exactCount,
    boxCount,
  };
}
