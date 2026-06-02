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
