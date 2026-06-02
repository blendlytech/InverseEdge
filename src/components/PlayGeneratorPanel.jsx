import { useState } from 'react';
import {
  generateMasterList,
  eliminateCombinations,
  applyHistoryFilter,
  normalizeDraw,
  isDoubleOrTriple,
  scoreStraightPermutations,
  scoreComboGaps,
  getPositionFrequencies
} from '../utils/AIEngine';
import Tooltip from './Tooltip';

const HelpIcon = () => (
  <span style={{ cursor: 'help', color: 'var(--primary)', opacity: 0.8, fontSize: '12px', marginLeft: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', border: '1px solid var(--primary)', borderRadius: '50%', fontWeight: 'bold' }}>?</span>
);

export default function PlayGeneratorPanel({ draws, eliminatedDigits, historyFilterDays = 14, setHistoryFilterDays }) {
  const [showOnlyFiltered, setShowOnlyFiltered] = useState(true);
  const [selectedCombo, setSelectedCombo] = useState(null);
  const [straightLookback, setStraightLookback] = useState(14);
  const [sniperMode, setSniperMode] = useState(false);
  const [sniperCount, setSniperCount] = useState(5);
  const [comboLookback, setComboLookback] = useState(200);
  const [showPositionMap, setShowPositionMap] = useState(true);

  // ── Core 120 Master List pipeline ──────────────────────────────
  const masterList = generateMasterList();
  const baseCombinations = eliminateCombinations(masterList, eliminatedDigits);
  const drawStrings = draws.map(d => d.draw);
  const filteredCombinations = applyHistoryFilter(baseCombinations, drawStrings, historyFilterDays);

  // Combo-level overdue ranking (powers Top Picks, Sniper Mode, gap badges)
  const filteredScored = scoreComboGaps(filteredCombinations, drawStrings, comboLookback);
  const comboGapMap = new Map(filteredScored.map(s => [s.combo, s]));
  const sniperSet = new Set(filteredScored.slice(0, sniperCount).map(s => s.combo));

  // Daily Top Picks: 3 most overdue combos each with their best straight ordering
  const topPicks = filteredScored.slice(0, 3).map(({ combo, lastHit, frequency }) => {
    const perms = scoreStraightPermutations(combo, drawStrings, straightLookback);
    return { combo, lastHit, frequency, bestStraight: perms[0].perm, straightLastHit: perms[0].lastHit };
  });

  // Position frequency heat map data
  const positionFreqs = getPositionFrequencies(drawStrings, historyFilterDays || 14);

  // Straight permutation analysis for the selected combo
  const straightPerms = selectedCombo
    ? scoreStraightPermutations(selectedCombo, drawStrings, straightLookback)
    : [];

  // Recently drawn combos (for history filter badge marking)
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
  const displayCount = sniperMode ? Math.min(sniperCount, activeCombos) : activeCombos;
  const totalInvestment = displayCount * 1.00;
  const expectedPayout = 80.00;
  const netProfit = expectedPayout - totalInvestment;

  const handleCopy = () => {
    const list = sniperMode
      ? filteredScored.slice(0, sniperCount).map(s => s.combo)
      : filteredCombinations;
    if (list.length === 0) return;
    navigator.clipboard.writeText(list.join(', '));
    alert('📋 Play list copied to clipboard!');
  };

  const handleCopyTopPicks = () => {
    if (topPicks.length === 0) return;
    const text = topPicks.map((p, i) => `#${i + 1}: ${p.bestStraight} straight / ${p.combo} box`).join('\n');
    navigator.clipboard.writeText(text);
    alert('📋 Top picks copied!');
  };

  return (
    <div className="glass-card">
      <h2 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }} className="glow-text-primary">
        Optimized Combinations Generator
        <Tooltip text="Locked to the 120-combination non-repeating Master List. Includes Daily Top Picks, Sniper Mode to focus on the most overdue combos, a Position Heat Map for exact bet targeting, and per-combo gap tracking."><HelpIcon /></Tooltip>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px' }}>
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

          {eliminatedDigits.length === 1 && (
            <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '12px', marginBottom: '20px', fontSize: '13px', color: 'var(--danger)' }}>
              ⚠️ <strong>Not Recommended:</strong> Strategy 4 (Single-Digit Elimination) yields a significantly lower net profit margin. Two-digit, three-digit, or four-digit eliminations provide a much better risk-to-reward ratio.
            </div>
          )}

          {/* ── TODAY'S TOP PICKS ──────────────────────────────────────── */}
          {filteredCombinations.length > 0 && (
            <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.04))', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h3 style={{ color: 'var(--primary)', fontSize: '14px', margin: 0, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    🏆 Today's Top Picks
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Gap window:
                    <input
                      type="number" min="20" max="999" value={comboLookback}
                      onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v > 0) setComboLookback(v); }}
                      style={{ width: '50px', padding: '2px 5px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '4px', fontSize: '11px' }}
                    />
                    draws
                  </span>
                </div>
                <button onClick={handleCopyTopPicks} className="btn btn-secondary btn-small" style={{ fontSize: '11px', padding: '5px 10px' }}>
                  📋 Copy All 3 Picks
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(topPicks.length, 3)}, 1fr)`, gap: '8px' }}>
                {topPicks.map(({ combo, lastHit, bestStraight, straightLastHit }, idx) => (
                  <div key={combo} style={{ textAlign: 'center', background: idx === 0 ? 'rgba(16,185,129,0.1)' : 'rgba(0,0,0,0.25)', border: idx === 0 ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px 8px' }}>
                    <div style={{ fontSize: '10px', color: idx === 0 ? 'var(--primary)' : 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                      #{idx + 1} Pick
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 'bold', color: 'var(--text-main)', letterSpacing: '2px' }}>
                      {combo}
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Box: {lastHit === 999
                        ? <span style={{ color: 'var(--primary)' }}>OVERDUE</span>
                        : `${lastHit} draws ago`}
                    </div>
                    <div style={{ margin: '8px 0 4px', height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '2px' }}>Best Straight</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 'bold', color: 'var(--primary)', letterSpacing: '3px' }}>
                      {bestStraight}
                    </div>
                    <div style={{ fontSize: '9px', marginTop: '2px', color: straightLastHit === 999 ? 'var(--primary)' : 'var(--text-muted)', fontWeight: straightLastHit === 999 ? '600' : 'normal' }}>
                      {straightLastHit === 999 ? '★ Never hit exact' : `${straightLastHit} draws ago`}
                    </div>
                    <button
                      onClick={() => { navigator.clipboard.writeText(`${bestStraight} / ${combo}`); alert(`📋 ${bestStraight} (box: ${combo}) copied!`); }}
                      style={{ marginTop: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', width: '100%' }}
                    >
                      📋 Copy
                    </button>
                  </div>
                ))}
              </div>

              <p style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                💰 $0.50 straight + $0.50 box on each = <strong style={{ color: 'var(--text-main)' }}>${(topPicks.length * 1).toFixed(2)}</strong> total. These are the most overdue combinations from the Master List — your highest-priority plays every draw.
              </p>
            </div>
          )}

          {/* Profit margins */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sniperMode ? 'Sniper Picks' : 'Tickets to Buy'}</span>
              <h3 style={{ fontSize: '22px', color: sniperMode ? 'var(--primary)' : 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{displayCount}</h3>
              {sniperMode && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>of {activeCombos} active</span>}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Daily Cost ($1/ea)</span>
              <h3 style={{ fontSize: '22px', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>${totalInvestment.toFixed(2)}</h3>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Expected Payout</span>
              <h3 style={{ fontSize: '22px', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>${expectedPayout.toFixed(2)}</h3>
            </div>
            <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--primary)' }}>Net Profit on Win</span>
              <h3 style={{ fontSize: '22px', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>${netProfit.toFixed(2)}</h3>
            </div>
          </div>

          {filteredCount > 0 && (
            <div style={{ background: 'rgba(234,179,8,0.05)', border: '1px solid rgba(234,179,8,0.15)', borderRadius: '8px', padding: '12px', marginBottom: '20px', fontSize: '13px', color: 'var(--text-main)' }}>
              🔥 <strong>History Filter Advantage<Tooltip text={`Combinations drawn in the last ${historyFilterDays} draws are statistically unlikely to repeat so soon.`}><HelpIcon /></Tooltip>:</strong> Removed <strong>{filteredCount} combinations</strong> matching the last {historyFilterDays} draws — saved ${filteredCount.toFixed(2)}, net profit up to <strong>${netProfit.toFixed(2)}</strong>!
            </div>
          )}

          {/* Controls */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                History Filter:
                <input
                  type="number" min="0" max="100" value={historyFilterDays}
                  onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v)) setHistoryFilterDays(v); }}
                  style={{ width: '48px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '4px', padding: '4px 6px' }}
                />
                draws
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <input
                  type="checkbox" checked={showOnlyFiltered}
                  onChange={(e) => setShowOnlyFiltered(e.target.checked)}
                  style={{ accentColor: 'var(--primary)', width: '14px', height: '14px' }}
                />
                Hide crossed-out
              </label>
            </div>
            <button onClick={handleCopy} className="btn btn-secondary btn-small" style={{ fontSize: '12px', padding: '6px 12px' }}>
              📋 Copy Play List
            </button>
          </div>

          {/* ── Sniper Mode ────────────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', padding: '8px 12px', background: sniperMode ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.01)', border: `1px solid ${sniperMode ? 'rgba(16,185,129,0.3)' : 'var(--border-color)'}`, borderRadius: '8px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox" checked={sniperMode}
                onChange={(e) => setSniperMode(e.target.checked)}
                style={{ accentColor: 'var(--primary)', width: '15px', height: '15px' }}
              />
              <span style={{ color: sniperMode ? 'var(--primary)' : 'var(--text-muted)', fontWeight: sniperMode ? '600' : 'normal' }}>
                🎯 Sniper Mode
              </span>
            </label>
            {sniperMode ? (
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                — top
                <input
                  type="number" min="1" max="20" value={sniperCount}
                  onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v > 0) setSniperCount(v); }}
                  style={{ width: '44px', padding: '3px 6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--primary)', color: 'var(--primary)', borderRadius: '4px', fontSize: '13px', fontWeight: '600' }}
                />
                most overdue combos only
              </span>
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', opacity: 0.7 }}>
                Narrows to the top N most overdue combos — lower daily cost, concentrated firepower.
              </span>
            )}
          </div>

          {/* Master list indicator */}
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--primary)', display: 'inline-block', flexShrink: 0 }}></span>
            Locked to <strong style={{ color: 'var(--text-main)' }}>120 non-repeating Master List</strong>. Small number = draws since last box hit (<span style={{ color: 'var(--primary)' }}>∞ = overdue</span>, <span style={{ color: 'var(--danger)' }}>red = recent</span>). <span style={{ color: 'var(--primary)', fontWeight: '500' }}>Click any combo for exact bet analysis.</span>
          </div>

          {/* ── Combo Badges ───────────────────────────────────────────── */}
          <div className="comb-list-container">
            {baseCombinations.map((comb) => {
              const isFiltered = lastDrawsStandardized.has(comb);
              if (isFiltered && showOnlyFiltered) return null;
              if (sniperMode && !isFiltered && !sniperSet.has(comb)) return null;
              const isSelected = selectedCombo === comb;
              const isSniperPick = sniperMode && sniperSet.has(comb);
              const gapEntry = comboGapMap.get(comb);

              return (
                <div
                  key={comb}
                  className={`comb-badge ${isFiltered ? 'filtered' : ''}`}
                  title={isFiltered ? 'Filtered: appeared in recent draw history' : 'Click to analyze exact/straight bet permutations'}
                  onClick={() => { if (!isFiltered) setSelectedCombo(isSelected ? null : comb); }}
                  style={{
                    cursor: isFiltered ? 'default' : 'pointer',
                    display: 'inline-flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...(isSelected ? { borderColor: 'var(--primary)', boxShadow: '0 0 8px rgba(16,185,129,0.5)', color: 'var(--primary)' } : {}),
                    ...(isSniperPick && !isSelected ? { borderColor: 'rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.07)' } : {})
                  }}
                >
                  <span>{comb}</span>
                  {gapEntry && (
                    <span style={{ display: 'block', fontSize: '8px', marginTop: '1px', lineHeight: 1, fontFamily: 'var(--font-mono)', color: gapEntry.lastHit === 999 ? 'var(--primary)' : gapEntry.lastHit <= 10 ? 'var(--danger)' : 'rgba(255,255,255,0.3)', opacity: isFiltered ? 0.4 : 1 }}>
                      {gapEntry.lastHit === 999 ? '∞' : `${gapEntry.lastHit}d`}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Position Frequency Heat Map ─────────────────────────────── */}
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h4 style={{ fontSize: '13px', color: 'var(--text-main)', margin: 0 }}>
                📍 Position Frequency Heat Map
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '6px', fontWeight: 'normal' }}>
                  last {historyFilterDays || 14} draws
                </span>
                <Tooltip text="Shows which digits appear most in each draw position (left, middle, right). Use this alongside the Straight Bet Analyzer to identify the most likely exact ordering — bet the hottest digit in each position."><HelpIcon /></Tooltip>
              </h4>
              <button
                onClick={() => setShowPositionMap(v => !v)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}
              >
                {showPositionMap ? 'Hide ▲' : 'Show ▼'}
              </button>
            </div>

            {showPositionMap && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {['Pos 1 (Left)', 'Pos 2 (Mid)', 'Pos 3 (Right)'].map((label, posIdx) => {
                  const freq = positionFreqs[posIdx];
                  const entries = Object.entries(freq)
                    .map(([d, c]) => [parseInt(d, 10), c])
                    .sort((a, b) => b[1] - a[1]);
                  const maxCount = entries[0]?.[1] || 1;

                  return (
                    <div key={posIdx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {label}
                      </div>
                      {entries.slice(0, 6).map(([digit, count]) => {
                        const isHot = count > 0 && count === maxCount;
                        const isCold = count === 0;
                        return (
                          <div key={digit} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: isHot ? 'var(--primary)' : 'var(--text-main)', width: '14px', textAlign: 'center', fontWeight: isHot ? '700' : 'normal' }}>
                              {digit}
                            </span>
                            <div style={{ flex: 1, height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%`, height: '100%', background: isHot ? 'var(--primary)' : isCold ? 'transparent' : 'rgba(16,185,129,0.35)', borderRadius: '3px' }} />
                            </div>
                            <span style={{ fontSize: '9px', color: isHot ? 'var(--primary)' : 'var(--text-muted)', width: '18px', textAlign: 'right', fontWeight: isHot ? '600' : 'normal' }}>
                              {count}x
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}

            {showPositionMap && (
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.5' }}>
                💡 <strong style={{ color: 'var(--text-main)' }}>How to use:</strong> The hottest (green) digit in each position is what's been appearing most in recent draws. Cross-reference with the Straight Bet Analyzer below to pick the most likely exact ordering for your straight bet.
              </p>
            )}
          </div>

          {/* ── Straight / Exact Bet Analyzer ──────────────────────────── */}
          {selectedCombo && (
            <div style={{ marginTop: '20px', background: 'rgba(16,185,129,0.03)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '16px' }}>
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', fontSize: '12px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                Scan last
                <input
                  type="number" min="1" max="500" value={straightLookback}
                  onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v > 0) setStraightLookback(v); }}
                  style={{ width: '55px', padding: '3px 6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '4px', fontSize: '12px' }}
                />
                draws for exact-order history.
                <strong style={{ color: 'var(--text-main)' }}>Most overdue shown first.</strong>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(115px, 1fr))', gap: '8px' }}>
                {straightPerms.map(({ perm, lastHit, frequency }) => {
                  const isOverdue = lastHit === 999;
                  const isHot = !isOverdue && lastHit <= 10;
                  const borderColor = isOverdue ? 'rgba(16,185,129,0.5)' : isHot ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.07)';
                  const bgColor = isOverdue ? 'rgba(16,185,129,0.07)' : isHot ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.02)';
                  const statusLabel = isOverdue ? '★ OVERDUE' : isHot ? `⚡ ${lastHit} AGO` : `${lastHit} draws ago`;
                  const statusColor = isOverdue ? 'var(--primary)' : isHot ? 'var(--danger)' : 'var(--text-muted)';

                  return (
                    <div key={perm} style={{ background: bgColor, border: `1px solid ${borderColor}`, borderRadius: '8px', padding: '10px 8px', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 'bold', color: 'var(--text-main)', letterSpacing: '3px' }}>{perm}</div>
                      <div style={{ fontSize: '10px', color: statusColor, marginTop: '4px', fontWeight: '600', textTransform: 'uppercase', lineHeight: '1.3' }}>{statusLabel}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{frequency === 0 ? 'No exact hits' : `${frequency}x exact`}</div>
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
                💡 <strong style={{ color: 'var(--text-main)' }}>Strategy:</strong> Green <strong>"OVERDUE"</strong> cards have never appeared in the last {straightLookback} draws — top straight bet candidates. Red <strong>"HOT"</strong> cards hit within the last 10 draws. Play <strong>$0.50 straight</strong> on the most overdue order + <strong>$0.50 box</strong> on the combination.
              </p>
            </div>
          )}

          <div style={{ marginTop: '16px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'left' }}>
            📝 <strong>How to play:</strong> Start with the <strong>Top 3 Picks</strong> above ($0.50 straight + $0.50 box each = $3 total). Enable <strong>Sniper Mode</strong> to focus on the top N most overdue for a controlled daily budget. Click any combination for the full straight-bet permutation analysis.
          </div>
        </div>
      )}
    </div>
  );
}
