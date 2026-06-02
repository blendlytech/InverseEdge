import { runBacktest } from './AIEngine.js';

self.onmessage = (e) => {
  const { draws } = e.data;
  
  if (!draws || draws.length === 0) {
    self.postMessage({ error: 'No data provided.' });
    return;
  }

  const lookbackWindows = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const elimCounts = [2, 3, 4];
  const historyFilters = [0, 7, 10, 14, 21, 28]; // 0 means useHistoryFilter = false

  let bestConfig = null;
  let highestProfit = -Infinity;
  let totalSimulations = lookbackWindows.length * elimCounts.length * historyFilters.length;
  let completedSimulations = 0;

  for (let lookback of lookbackWindows) {
    // If not enough data for this lookback, skip
    if (draws.length < lookback + 1) continue;

    for (let elim of elimCounts) {
      for (let filterDays of historyFilters) {
        
        const config = {
          lookbackWindow: lookback,
          elimCount: elim,
          useHistoryFilter: filterDays > 0,
          historyFilterDays: filterDays > 0 ? filterDays : 0,
          wager: 1.00,
          payout: 80.00
        };

        const results = runBacktest(draws, config);
        
        if (results.netProfit > highestProfit) {
          highestProfit = results.netProfit;
          bestConfig = { ...config, netProfit: results.netProfit, winRate: results.winRate, totalDraws: results.totalDraws };
        }
        
        completedSimulations++;
        
        // Post progress to avoid freezing and show updates
        if (completedSimulations % 10 === 0) {
          self.postMessage({ type: 'progress', progress: Math.round((completedSimulations / totalSimulations) * 100) });
        }
      }
    }
  }

  if (bestConfig) {
    self.postMessage({ type: 'complete', bestConfig });
  } else {
    self.postMessage({ error: 'Could not find a valid configuration. Ensure you have enough historical draws.' });
  }
};
