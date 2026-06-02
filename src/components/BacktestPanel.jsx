import { useState } from 'react';
import { runBacktest } from '../utils/AIEngine';
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
  const [results, setResults] = useState(null);

  const handleRunSimulation = () => {
    const filteredDraws = draws.filter(d => {
      if (drawFilter === 'All') return true;
      return d.date.includes(drawFilter);
    });

    if (!filteredDraws || filteredDraws.length < lookbackWindow + 1) {
      alert(`Not enough data. You need at least ${lookbackWindow + 1} ${drawFilter} draws to run a backtest with a lookback of ${lookbackWindow}.`);
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

    const simResults = runBacktest(filteredDraws, config);
    
    // The timeline is generated chronologically, so we reverse it to show newest at the top
    simResults.timeline.reverse();
    setResults(simResults);
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
                style={{ width: '60px' }}
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

      <button onClick={handleRunSimulation} className="btn btn-secondary" style={{ width: '100%', marginBottom: '32px' }}>
        Run Simulation
      </button>

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
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '500', textAlign: 'right' }}>Draw PnL</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '500', textAlign: 'right' }}>Cumulative</th>
                </tr>
              </thead>
              <tbody>
                {results.timeline.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: item.isHit ? 'rgba(16, 185, 129, 0.05)' : 'transparent' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{item.date}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 'bold', letterSpacing: '1px', color: 'var(--text-main)' }}>{item.draw}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{item.combinations}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold', color: item.isHit ? 'var(--primary)' : 'var(--danger)' }}>
                      {item.isHit ? '+' : ''}{item.profit}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold', color: item.cumulativeProfit >= 0 ? 'var(--primary)' : 'var(--danger)' }}>
                      {item.cumulativeProfit >= 0 ? '+' : ''}{item.cumulativeProfit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
