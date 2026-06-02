import { useState } from 'react';
import {
  generateMasterList,
  eliminateCombinations,
  applyHistoryFilter,
  normalizeDraw,
  isDoubleOrTriple,
  scoreStraightPermutations
} from '../utils/AIEngine';
import Tooltip from './Tooltip';

const HelpIcon = () => (
  <span style={{ cursor: 'help', color: 'var(--primary)', opacity: 0.8, fontSize: '12px', marginLeft: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', border: '1px solid var(--primary)', borderRadius: '50%', fontWeight: 'bold' }}>?</span>
);

export default function PlayGeneratorPanel({ draws, eliminatedDigits, historyFilterDays = 14, setHistoryFilterDays }) {
  const [showOnlyFiltered, setShowOnlyFiltered] = useState(true);
  const [selectedCombo, setSelectedCombo] = useState(null);
  const [straightLookback, setStraightLookback] = useState(14);

  // 1. Generate core 120 master list (the fixed universe — all analysis is locked to this)
  const masterList = generateMasterList();

  // 2. Filter out eliminated digits
  const baseCombinations = eliminateCombinations(masterList, eliminatedDigits);

  // 3. Extract draw strings for the history filter
  const drawStrings = draws.map(d => d.draw);

  // 4. Apply history filter
  const filteredCombinations = applyHistoryFilter(baseCombinations, drawStrings, historyFilterDays);

  // 5. Score straight permutations for the currently selected combo
  const straightPerms = selectedCombo
    ? scoreStraightPermutations(selectedCombo, drawStrings, straightLookback)
    : [];

  // Draws that caused exclusions (for badge styling)
  const lastDrawsStandardized = new Set(
    drawStrings
      .filter(draw => !isDoubleOrTriple(draw))
      .slice(0, historyFilterDays)
      .map(normalizeDraw)
  );

  // Stats
  const totalCombos = baseCombinations.length;
  const activeCombos = filteredCombinations.length;
  const filteredCount = totalCombos - activeCombos;
  const totalInvestment = activeCombos * 1.00;
  const expectedPayout = 80.00;
  const netProfit = expectedPayout - totalInvestment;

  const handleCopy = () => {
    if (filteredCombinations.length === 0) return;
    navigator.clipboard.writeText(filteredCombinations.join(', '));
    alert('📋 Play list copied to clipboard!');
  };

  return (
    <div className="glass-card">
      <h2 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }} className="glow-text-primary">
        Optimized Combinations Generator
        <Tooltip text="All plays are locked to the 120-combination non-repeating Master List. Click any combination to open the Straight/Exact Bet Analyzer and rank all 6 exact orderings by how overdue they are."><HelpIcon /></Tooltip>
      </h2>

      {eliminatedDigits.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎯</div>
          <h3>Select cold digits to generate your plays</h3>
          <p style={{ fontSize: '13px', marginTop: '6px' }}>
            Use the AI Cold Digit Recommender or tap digits in the interactive heatmap above to see play sheets.
          </p>
        </div>
      ) : (
        <div>
          {/* Active Strategy Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '20px'
          }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Active Strategy</span>
              <strong style={{ fontSize: '16px', color: 'var(--secondary)' }}>
                {eliminatedDigits.length === 3 ? 'Strategy 1/2: ' : ''}
                {eliminatedDigits.length === 2 ? 'Strategy 3: ' : ''}
                {eliminatedDigits.length === 1 ? 'Strategy 4: ' : ''}
                {eliminatedDigits.length === 4 ? 'Strategy 5: ' : ''}
                {eliminatedDigits.length}-Digit Elimination ({10 - eliminatedDigits.length} remaining)
              </strong>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Eliminated Digits</span>
              <strong style={{ fontSize: '16px', color: 'var(--danger)', fontFamily: 'var(--font-mono)' }}>
                {eliminatedDigits.map(String).join(', ')}
              </strong>
            </div>
          </div>

          {/* Strategy 4 Warning */}
          {eliminatedDigits.length === 1 && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              fontSize: '13px',
              color: 'var(--danger)',
              textAlign: 'left'
            }}>
              ⚠️ <strong>Not Recommended:</strong> Strategy 4 (Single-Digit Elimination) yields a significantly lower net profit margin. Two-digit, three-digit, or four-digit eliminations provide a much better risk-to-reward ratio according to The Inverse Method Guide.
            </div>
          )}

          {/* Profit margins */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
            marginBottom: '24px'
          }}>
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tickets to Buy</span>
              <h3 style={{ fontSize: '22px', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{activeCombos}</h3>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Daily Cost ($1/ea)</span>
              <h3 style={{ fontSize: '22px', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>${totalInvestment.toFixed(2)}</h3>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Expected Payout</span>
              <h3 style={{ fontSize: '22px', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>${expectedPayout.toFixed(2)}</h3>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--primary)' }}>Net Profit on Win</span>
              <h3 style={{ fontSize: '22px', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>${netProfit.toFixed(2)}</h3>
            </div>
          </div>

          {/* History filter savings alert */}
          {filteredCount > 0 && (
            <div style={{
              background: 'rgba(234, 179, 8, 0.05)',
              border: '1px solid rgba(234, 179, 8, 0.15)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              fontSize: '13px',
              color: 'var(--text-main)',
              textAlign: 'left'
            }}>
              🔥 <strong>History Filter Advantage<Tooltip text={`Combinations drawn in the last ${historyFilterDays} draws are statistically unlikely to repeat so soon. Automatically filtered to save capital and increase net profit.`}><HelpIcon /></Tooltip>:</strong> Removed <strong>{filteredCount} combinations</strong> that matched draws from the last {historyFilterDays} draws — saved ${filteredCount.toFixed(2)} in capital and pushed net profit from ${(expectedPayout - totalCombos).toFixed(2)} to <strong>${netProfit.toFixed(2)}</strong>!
            </div>
          )}

          {/* Controls */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                History Filter Draws:
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={historyFilterDays}
                  onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v)) setHistoryFilterDays(v); }}
                  style={{ width: '55px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '4px', padding: '4px 8px' }}
                />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showOnlyFiltered}
                  onChange={(e) => setShowOnlyFiltered(e.target.checked)}
                  style={{ accentColor: 'var(--primary)', width: '15px', height: '15px' }}
                />
                Hide history-filtered combinations
              </label>
            </div>
            <button onClick={handleCopy} className="btn btn-secondary btn-small" style={{ fontSize: '12px', padding: '6px 12px' }}>
              📋 Copy Play List
            </button>
          </div>

          {/* Master list lock indicator */}
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--primary)', display: 'inline-block', flexShrink: 0 }}></span>
            All plays drawn exclusively from the <strong style={{ color: 'var(--text-main)' }}>120 non-repeating Master List</strong>. <span style={{ color: 'var(--primary)', fontWeight: '500' }}>Click any combination to analyze exact/straight bet orderings.</span>
          </div>

          {/* Combinations grid */}
          <div className="comb-list-container">
            {baseCombinations.map((comb) => {
              const isFiltered = lastDrawsStandardized.has(comb);
              if (isFiltered && showOnlyFiltered) return null;
              const isSelected = selectedCombo === comb;

              return (
                <div
                  key={comb}
                  className={`comb-badge ${isFiltered ? 'filtered' : ''}`}
                  title={isFiltered ? 'Filtered: appeared in recent draw history' : 'Click to analyze exact/straight bet permutations'}
                  onClick={() => { if (!isFiltered) setSelectedCombo(isSelected ? null : comb); }}
                  style={{
                    cursor: isFiltered ? 'default' : 'pointer',
                    ...(isSelected ? {
                      borderColor: 'var(--primary)',
                      boxShadow: '0 0 8px rgba(16,185,129,0.5)',
                      color: 'var(--primary)'
                    } : {})
                  }}
                >
                  {comb}
                </div>
              );
            })}
          </div>

          {/* ── Straight / Exact Bet Analyzer ────────────────────────────── */}
          {selectedCombo && (
            <div style={{
              marginTop: '20px',
              background: 'rgba(16, 185, 129, 0.03)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ color: 'var(--primary)', fontSize: '15px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  🎯 Straight/Exact Bet Analyzer
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', color: 'var(--text-main)', background: 'rgba(255,255,255,0.06)', padding: '2px 10px', borderRadius: '6px', letterSpacing: '2px' }}>
                    {selectedCombo}
                  </span>
                </h3>
                <button
                  onClick={() => setSelectedCombo(null)}
                  style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                >
                  ✕ Clear
                </button>
              </div>

              {/* Window control */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', fontSize: '12px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                Scan last
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={straightLookback}
                  onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v > 0) setStraightLookback(v); }}
                  style={{ width: '55px', padding: '3px 6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '4px', fontSize: '12px' }}
                />
                draws for exact-order history.
                <strong style={{ color: 'var(--text-main)' }}>Most overdue shown first.</strong>
              </div>

              {/* 6 permutation cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(115px, 1fr))', gap: '8px' }}>
                {straightPerms.map(({ perm, lastHit, frequency }) => {
                  const isOverdue = lastHit === 999;
                  const isHot = !isOverdue && lastHit <= 10;
                  const borderColor = isOverdue
                    ? 'rgba(16,185,129,0.5)'
                    : isHot
                      ? 'rgba(239,68,68,0.35)'
                      : 'rgba(255,255,255,0.07)';
                  const bgColor = isOverdue
                    ? 'rgba(16,185,129,0.07)'
                    : isHot
                      ? 'rgba(239,68,68,0.05)'
                      : 'rgba(255,255,255,0.02)';
                  const statusLabel = isOverdue
                    ? '★ OVERDUE'
                    : isHot
                      ? `⚡ ${lastHit} AGO`
                      : `${lastHit} draws ago`;
                  const statusColor = isOverdue
                    ? 'var(--primary)'
                    : isHot
                      ? 'var(--danger)'
                      : 'var(--text-muted)';

                  return (
                    <div key={perm} style={{ background: bgColor, border: `1px solid ${borderColor}`, borderRadius: '8px', padding: '10px 8px', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 'bold', color: 'var(--text-main)', letterSpacing: '3px' }}>
                        {perm}
                      </div>
                      <div style={{ fontSize: '10px', color: statusColor, marginTop: '4px', fontWeight: '600', textTransform: 'uppercase', lineHeight: '1.3' }}>
                        {statusLabel}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {frequency === 0 ? 'No exact hits' : `${frequency}x exact`}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(perm); alert(`📋 ${perm} copied!`); }}
                        style={{ marginTop: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', width: '100%' }}
                      >
                        📋 Copy
                      </button>
                    </div>
                  );
                })}
              </div>

              <p style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                💡 <strong style={{ color: 'var(--text-main)' }}>Strategy:</strong> Green <strong>"OVERDUE"</strong> cards show exact orderings that have never appeared in the last {straightLookback} draws — these are your top straight bet candidates. Red <strong>"HOT"</strong> cards hit within the last 10 draws and are less favorable. Play <strong>$0.50 straight</strong> on the most overdue order + <strong>$0.50 box</strong> on the combination for full coverage.
              </p>
            </div>
          )}

          <div style={{ marginTop: '16px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'left' }}>
            📝 <strong>How to play:</strong> Write down or copy these {activeCombos} combinations. Place a <strong>$0.50 Box Bet</strong> on each at your local retailer. <strong>Click any combination</strong> above to open the Straight/Exact Bet Analyzer — it ranks all 6 exact orderings by how overdue they are so you can add a <strong>$0.50 Straight Bet</strong> on the most promising order for the big payout.
          </div>
        </div>
      )}
    </div>
  );
}
