import React, { useState } from 'react';
import { runBacktest, normalizeDraw, isDoubleOrTriple } from '../utils/AIEngine';
import OptimizerWorker from '../utils/optimizer.worker.js?worker';
import Tooltip from './Tooltip';

const HelpIcon = () => (
  <span style={{ cursor: 'help', color: 'var(--primary)', opacity: 0.8, fontSize: '12px', marginLeft: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', border: '1px solid var(--primary)', borderRadius: '50%', fontWeight: 'bold' }}>?</span>
);

export default function BacktestPanel({ draws, initialHistoryFilterDays = 14 }) {
  const [lookbackWindow, setLookbackWindow] = useState(50);
  const [elimCount, setElimCount] = useState(3);
  const [useHistoryFilter, setUseHistoryFilter] = useState(true);
  const [historyFilterDays, setHistoryFilterDays] = useState(initialHistoryFilterDays);
  const [drawFilter, setDrawFilter] = useState('All');
  
  const [timeRangeType, setTimeRangeType] = useState('recent'); // 'recent', 'date', 'all'
  const [recentDrawsCount, setRecentDrawsCount] = useState(50);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [results, setResults] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeProgress, setOptimizeProgress] = useState(0);

  const handleRunSimulation = () => {
    let filteredByDrawType = draws.filter(d => {
      if (drawFilter === 'All') return true;
      return d.date.includes(drawFilter);
    });

    let finalDraws = [];

    if (timeRangeType === 'all') {
      finalDraws = filteredByDrawType;
    } else if (timeRangeType === 'recent') {
      finalDraws = filteredByDrawType.slice(0, recentDrawsCount + lookbackWindow);
    } else if (timeRangeType === 'date') {
      let startIndex = -1;
      let endIndex = -1;

      for (let i = 0; i < filteredByDrawType.length; i++) {
        const drawDate = filteredByDrawType[i].date.substring(0, 10);
        let inRange = true;
        if (startDate && drawDate < startDate) inRange = false;
        if (endDate && drawDate > endDate) inRange = false;
        
        if (inRange) {
          if (startIndex === -1) startIndex = i;
          endIndex = i;
        }
      }

      if (startIndex !== -1 && endIndex !== -1) {
        finalDraws = filteredByDrawType.slice(startIndex, endIndex + 1 + lookbackWindow);
      }
    }

    if (!finalDraws || finalDraws.length < lookbackWindow + 1) {
      alert(`Not enough data. You need at least ${lookbackWindow + 1} ${drawFilter === 'All' ? '' : drawFilter + ' '}draws to run this backtest.`);
      return;
    }

    const config = {
      lookbackWindow,
      elimCount,
      useHistoryFilter,
      historyFilterDays,
      wager: 1.00,
      payout: 80.00
    };

    const simResults = runBacktest(finalDraws, config);
    
    // The timeline is generated chronologically, so we reverse it to show newest at the top
    simResults.timeline.reverse();
    setResults(simResults);
    setExpandedRow(null);
  };

  const handleAutoTune = () => {
    let filteredByDrawType = draws.filter(d => {
      if (drawFilter === 'All') return true;
      return d.date.includes(drawFilter);
    });

    let finalDraws = [];

    if (timeRangeType === 'all') {
      finalDraws = filteredByDrawType;
    } else if (timeRangeType === 'recent') {
      finalDraws = filteredByDrawType.slice(0, recentDrawsCount + 100); // Pass a large enough buffer for optimizer max lookback of 100
    } else if (timeRangeType === 'date') {
      let startIndex = -1;
      let endIndex = -1;

      for (let i = 0; i < filteredByDrawType.length; i++) {
        const drawDate = filteredByDrawType[i].date.substring(0, 10);
        let inRange = true;
        if (startDate && drawDate < startDate) inRange = false;
        if (endDate && drawDate > endDate) inRange = false;
        
        if (inRange) {
          if (startIndex === -1) startIndex = i;
          endIndex = i;
        }
      }

      if (startIndex !== -1 && endIndex !== -1) {
        finalDraws = filteredByDrawType.slice(startIndex, endIndex + 1 + 100);
      }
    }

    if (!finalDraws || finalDraws.length < 11) {
      alert(`Not enough data to optimize. Please select a larger date range or more recent draws.`);
      return;
    }

    setIsOptimizing(true);
    setOptimizeProgress(0);

    const worker = new OptimizerWorker();

    worker.onmessage = (e) => {
      const data = e.data;
      if (data.type === 'progress') {
        setOptimizeProgress(data.progress);
      } else if (data.type === 'complete') {
        const bestConfig = data.bestConfig;
        
        // Update UI states
        setLookbackWindow(bestConfig.lookbackWindow);
        setElimCount(bestConfig.elimCount);
        setUseHistoryFilter(bestConfig.useHistoryFilter);
        setHistoryFilterDays(bestConfig.historyFilterDays);

        worker.terminate();
        setIsOptimizing(false);
        
        // Re-slice with the newly discovered lookback window to simulate exactly the requested range
        let preciseDraws = [];
        if (timeRangeType === 'all') {
          preciseDraws = filteredByDrawType;
        } else if (timeRangeType === 'recent') {
          preciseDraws = filteredByDrawType.slice(0, recentDrawsCount + bestConfig.lookbackWindow);
        } else if (timeRangeType === 'date') {
            let startIndex = -1, endIndex = -1;
            for (let i = 0; i < filteredByDrawType.length; i++) {
                const drawDate = filteredByDrawType[i].date.substring(0, 10);
                let inRange = true;
                if (startDate && drawDate < startDate) inRange = false;
                if (endDate && drawDate > endDate) inRange = false;
                if (inRange) {
                  if (startIndex === -1) startIndex = i;
                  endIndex = i;
                }
            }
            if (startIndex !== -1 && endIndex !== -1) {
              preciseDraws = filteredByDrawType.slice(startIndex, endIndex + 1 + bestConfig.lookbackWindow);
            }
        }
        
        const simResults = runBacktest(preciseDraws, bestConfig);
        simResults.timeline.reverse();
        setResults(simResults);
        setExpandedRow(null);
        
      } else if (data.error) {
        alert(data.error);
        worker.terminate();
        setIsOptimizing(false);
      }
    };

    worker.postMessage({ draws: finalDraws });
  };

  return (
    <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }} className="glow-text-secondary">
        Time Machine Backtester
        <Tooltip text="Simulates exactly how much profit you would have made using historical data. Re-runs the AI algorithm dynamically at every step without looking into the future."><HelpIcon /></Tooltip>
      </h2>
      <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>
        Simulate strategies against historical data to prove profitability.
      </p>

      {/* Configuration */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        
        <div className="input-group" style={{ gridColumn: '1 / -1' }}>
          <label>Time Range</label>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap', padding: '8px 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-main)' }}>
              <input 
                type="radio" 
                name="timeRangeType" 
                value="recent" 
                checked={timeRangeType === 'recent'} 
                onChange={() => setTimeRangeType('recent')} 
              />
              Recent Draws
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-main)' }}>
              <input 
                type="radio" 
                name="timeRangeType" 
                value="date" 
                checked={timeRangeType === 'date'} 
                onChange={() => setTimeRangeType('date')} 
              />
              Date Range
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-main)' }}>
              <input 
                type="radio" 
                name="timeRangeType" 
                value="all" 
                checked={timeRangeType === 'all'} 
                onChange={() => setTimeRangeType('all')} 
              />
              All History
            </label>
          </div>
        </div>

        {timeRangeType === 'recent' && (
          <div className="input-group">
            <label>Draws to Simulate</label>
            <input 
              type="number" 
              className="custom-input" 
              value={recentDrawsCount} 
              onChange={(e) => setRecentDrawsCount(Number(e.target.value))}
              min="1"
            />
          </div>
        )}

        {timeRangeType === 'date' && (
          <>
            <div className="input-group">
              <label>Start Date</label>
              <input 
                type="date" 
                className="custom-input" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>End Date</label>
              <input 
                type="date" 
                className="custom-input" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </>
        )}

        {/* Keeping dummy div to preserve grid flow if neither recent nor date inputs take up space */}
        {timeRangeType === 'all' && <div />}

        <div className="input-group">
          <label>Lookback Window</label>
          <input 
            type="number" 
            min="10" 
            max="100" 
            className="custom-input" 
            value={lookbackWindow} 
            onChange={(e) => setLookbackWindow(Number(e.target.value))}
          />
        </div>
        <div className="input-group">
          <label>Eliminate Digits</label>
          <select 
            className="custom-input" 
            value={elimCount} 
            onChange={(e) => setElimCount(Number(e.target.value))}
          >
            <option value={2}>2 Digits (Safest)</option>
            <option value={3}>3 Digits (Balanced)</option>
            <option value={4}>4 Digits (Aggressive)</option>
          </select>
        </div>
        <div className="input-group">
          <label>History Filter</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select 
              className="custom-input" 
              style={{ flex: 1 }}
              value={useHistoryFilter ? 'yes' : 'no'} 
              onChange={(e) => setUseHistoryFilter(e.target.value === 'yes')}
            >
              <option value="yes">Enabled</option>
              <option value="no">Disabled</option>
            </select>
            {useHistoryFilter && (
              <input 
                type="number"
                className="custom-input"
                style={{ width: '100px' }}
                value={historyFilterDays}
                onChange={(e) => setHistoryFilterDays(Number(e.target.value))}
                min="0"
                max="100"
                title="Days to filter"
              />
            )}
          </div>
        </div>
        <div className="input-group">
          <label>Draw Filter</label>
          <select 
            className="custom-input" 
            value={drawFilter} 
            onChange={(e) => setDrawFilter(e.target.value)}
          >
            <option value="All">All Draws</option>
            <option value="Midday">Midday Only</option>
            <option value="Evening">Evening Only</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
        <button 
          onClick={handleRunSimulation} 
          className="btn btn-secondary" 
          style={{ flex: 1 }}
          disabled={isOptimizing}
        >
          Run Simulation
        </button>
        <button 
          onClick={handleAutoTune} 
          className="btn btn-primary" 
          style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
          disabled={isOptimizing}
        >
          {isOptimizing ? `🤖 Optimizing... ${optimizeProgress}%` : '🤖 Auto-Tune AI'}
          {isOptimizing && (
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: '4px',
              background: '#fff',
              width: `${optimizeProgress}%`,
              transition: 'width 0.1s linear'
            }} />
          )}
        </button>
      </div>

      {/* Results Scoreboard */}
      {results && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Simulated Draws</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-main)' }}>{results.totalDraws}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Win Rate</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-main)' }}>{results.winRate.toFixed(1)}%</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Spend</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--danger)' }}>${results.totalSpend}</div>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Net Profit</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: results.netProfit >= 0 ? 'var(--primary)' : 'var(--danger)' }}>
                {results.netProfit >= 0 ? '+' : '-'}${Math.abs(results.netProfit)}
              </div>
            </div>
          </div>

          {/* Timeline Table */}
          <h3 style={{ fontSize: '16px', marginBottom: '12px', color: 'var(--text-main)' }}>Simulation History (Reverse Chronological)</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, background: 'rgba(15, 23, 42, 0.95)', zIndex: 1 }}>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '500' }}>Date</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '500' }}>Actual Draw</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '500' }}>Tickets Played</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '500', textAlign: 'right' }}>
                    Draw PnL
                    <Tooltip direction="down" text="Profit or Loss for this specific draw. Calculated as the payout (if you won) minus the total cost of all tickets played."><HelpIcon /></Tooltip>
                  </th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '500', textAlign: 'right' }}>
                    Cumulative
                    <Tooltip direction="down" text="Your running total net profit or loss up to this point in the simulation."><HelpIcon /></Tooltip>
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.timeline.map((item, idx) => (
                  <React.Fragment key={idx}>
                    <tr 
                      onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                      style={{ 
                        borderBottom: expandedRow === idx ? 'none' : '1px solid rgba(255,255,255,0.05)', 
                        background: item.isHit ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                        cursor: 'pointer'
                      }}
                      title="Click to view plays"
                    >
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{item.date}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 'bold', letterSpacing: '1px', color: 'var(--text-main)' }}>{item.draw}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{item.combinations.length}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold', color: item.isHit ? 'var(--primary)' : 'var(--danger)' }}>
                        {item.profit >= 0 ? '+$' : '-$'}{Math.abs(item.profit).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold', color: item.cumulativeProfit >= 0 ? 'var(--primary)' : 'var(--danger)' }}>
                        {item.cumulativeProfit >= 0 ? '+$' : '-$'}{Math.abs(item.cumulativeProfit).toFixed(2)}
                      </td>
                    </tr>
                    {expandedRow === idx && (
                      <tr style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td colSpan="5" style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Eliminated Digits</span>
                              <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--danger)', fontFamily: 'var(--font-mono)' }}>
                                {item.elims && item.elims.length > 0 ? item.elims.join(', ') : 'None'}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</span>
                              <div style={{ fontSize: '16px', fontWeight: 'bold', color: item.isHit ? 'var(--primary)' : 'var(--danger)' }}>
                                {item.isHit ? 'WIN' : 'LOSS'}
                              </div>
                            </div>
                          </div>
                          
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Played Combinations ({item.combinations.length})</span>
                          <div className="comb-list-container" style={{ marginTop: '8px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                            {item.combinations.map(comb => {
                              const isWinningComb = normalizeDraw(item.draw) === comb && !isDoubleOrTriple(item.draw);
                              return (
                                <div key={comb} className="comb-badge" style={isWinningComb ? { background: 'var(--primary)', color: '#000', borderColor: 'var(--primary)' } : {}}>
                                  {comb}
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
