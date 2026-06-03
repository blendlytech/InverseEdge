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
