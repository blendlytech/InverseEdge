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
      combinations: combinations.length,
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
