import { useState, useMemo } from 'react';
import { generateMasterList, scoreComboFrequency } from '../utils/AIEngine';
import Tooltip from './Tooltip';

const masterList = generateMasterList();

const HelpIcon = () => (
  <span style={{
    cursor: 'help', color: 'var(--primary)', opacity: 0.8,
    fontSize: '11px', marginLeft: '5px', flexShrink: 0,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: '15px', height: '15px',
    border: '1px solid var(--primary)', borderRadius: '50%', fontWeight: 'bold',
  }}>?</span>
);

// Classify a combo by its digit range for Lawrence's pattern observation
function digitRangeLabel(combo) {
  const digits = combo.split('').map(Number);
  const max = Math.max(...digits);
  const min = Math.min(...digits);
  if (min >= 5) return 'high';    // all digits 5–9
  if (max <= 4) return 'low';     // all digits 0–4
  return 'mixed';                  // spans both ranges
}

const LOOKBACK_PRESETS = [
  { label: '50 draws',  value: 50 },
  { label: '100 draws', value: 100 },
  { label: '200 draws', value: 200 },
  { label: '500 draws', value: 500 },
];

export default function FrequencyPanel({ draws }) {
  const [isOpen, setIsOpen]           = useState(false);
  const [lookback, setLookback]       = useState(200);
  const [showFullList, setShowFullList] = useState(false);
  const [sortMode, setSortMode]       = useState('freq'); // 'freq' | 'combo'

  const totalDraws = draws.length;
  const effectiveLookback = Math.min(lookback, totalDraws);

  const { ranked, validDrawCount, expectedHits } = useMemo(
    () => scoreComboFrequency(masterList, draws.map(d => d.draw), effectiveLookback),
    [draws, effectiveLookback]
  );

  const displayList = sortMode === 'combo'
    ? [...ranked].sort((a, b) => a.combo.localeCompare(b.combo))
    : ranked;

  // Top / bottom slices
  const topHitters  = ranked.slice(0, 10);
  const coldest     = [...ranked].reverse().slice(0, 10);

  // Digit-range group averages (Lawrence's observation)
  const groups = { high: [], low: [], mixed: [] };
  ranked.forEach(({ combo, hits }) => groups[digitRangeLabel(combo)].push(hits));

  const groupAvg = grp => {
    const arr = groups[grp];
    return arr.length ? (arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(2) : '0.00';
  };
  const groupMax = grp => Math.max(...(groups[grp].length ? groups[grp] : [0]));

  const highAvg  = parseFloat(groupAvg('high'));
  const lowAvg   = parseFloat(groupAvg('low'));
  const mixedAvg = parseFloat(groupAvg('mixed'));
  const overallMax = Math.max(highAvg, lowAvg, mixedAvg) || 1;

  const biasConfirmed = highAvg > lowAvg * 1.15; // 15% higher = meaningful difference

  // Color for hit count relative to expected
  function hitColor(hits) {
    if (hits === 0) return 'var(--danger)';
    if (hits >= expectedHits * 1.5) return 'var(--primary)';
    if (hits >= expectedHits * 0.8) return 'var(--text-main)';
    return 'var(--text-muted)';
  }

  return (
    <div className="glass-card">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
          📈 Combo Frequency Ranking
          <Tooltip text="Counts how many times each of the 120 combinations has appeared as a box hit within your chosen draw window. Answers the question: 'Are there numbers that come in more than others?' Also tests whether high-digit combos (5–9) genuinely hit more often than low-digit combos (0–4) — an observation Lawrence made from watching actual draws.">
            <HelpIcon />
          </Tooltip>
        </h3>
        <button
          onClick={() => setIsOpen(v => !v)}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}
        >
          {isOpen ? '▲ Collapse' : '▼ Expand'}
        </button>
      </div>

      {isOpen && (
        <>
          {/* ── LOOKBACK CONTROL ───────────────────────────────────────── */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center',
            marginTop: '14px', marginBottom: '16px',
            padding: '11px 14px', background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-color)', borderRadius: '9px',
          }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
              Include last
              <Tooltip direction="down" text="How many recent draws to include in the frequency count. Larger windows reveal long-term patterns across hundreds of draws. Smaller windows show what's been hitting lately. Use 'All data' to see the full historical picture since your first recorded draw.">
                <HelpIcon />
              </Tooltip>:
            </span>

            {LOOKBACK_PRESETS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setLookback(value)}
                style={{
                  padding: '4px 11px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                  border: `1px solid ${lookback === value ? 'var(--primary)' : 'var(--border-color)'}`,
                  background: lookback === value ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)',
                  color: lookback === value ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: lookback === value ? '600' : 'normal',
                }}
              >
                {label}
              </button>
            ))}

            <button
              onClick={() => setLookback(totalDraws)}
              style={{
                padding: '4px 11px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                border: `1px solid ${lookback >= totalDraws ? 'var(--secondary)' : 'var(--border-color)'}`,
                background: lookback >= totalDraws ? 'rgba(234,179,8,0.12)' : 'rgba(255,255,255,0.03)',
                color: lookback >= totalDraws ? 'var(--secondary)' : 'var(--text-muted)',
                fontWeight: lookback >= totalDraws ? '600' : 'normal',
              }}
            >
              All data ({totalDraws})
            </button>

            <input
              type="number" min="20" max={totalDraws} value={lookback}
              onChange={e => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v > 0) setLookback(v); }}
              style={{ width: '70px', padding: '4px 7px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '4px', fontSize: '12px' }}
            />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>draws</span>

            <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>
              Scanning <strong style={{ color: 'var(--text-main)' }}>{effectiveLookback}</strong> draws ·
              <strong style={{ color: 'var(--text-main)' }}> {validDrawCount}</strong> non-double results ·
              expected <strong style={{ color: 'var(--text-main)' }}>{expectedHits.toFixed(1)}×</strong> per combo
            </span>
          </div>

          {/* ── DIGIT-RANGE BIAS ANALYSIS ──────────────────────────────── */}
          <div style={{ marginBottom: '20px', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
              🔬 Digit-Range Pattern Analysis
              <Tooltip text="Tests the observation that high-digit combos (all digits 5–9, like 678 or 789) appear more often than low-digit combos (all digits 0–4, like 012 or 134). The bar lengths show average hits per group — if 'High (5–9)' is noticeably longer, the pattern is confirmed in your data window.">
                <HelpIcon />
              </Tooltip>
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { key: 'high',  label: 'High digits (5–9 only)', count: groups.high.length,  avg: highAvg,  color: 'var(--primary)',   desc: 'e.g. 567, 678, 789' },
                { key: 'mixed', label: 'Mixed digits (spans both ranges)', count: groups.mixed.length, avg: mixedAvg, color: 'var(--secondary)', desc: 'e.g. 013, 245, 469' },
                { key: 'low',   label: 'Low digits (0–4 only)',  count: groups.low.length,   avg: lowAvg,   color: '#94a3b8',          desc: 'e.g. 012, 123, 234' },
              ].map(({ key, label, count, avg, color, desc }) => (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: '600' }}>
                      {label}
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'normal', marginLeft: '6px' }}>
                        ({count} combos · {desc})
                      </span>
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color, fontWeight: '700' }}>
                      avg {avg.toFixed(2)}× hits
                    </span>
                  </div>
                  <div style={{ height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${(avg / overallMax) * 100}%`, height: '100%',
                      background: color, borderRadius: '5px', transition: 'width 0.4s',
                    }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: '12px', padding: '8px 12px', borderRadius: '7px', fontSize: '12px', lineHeight: '1.5',
              background: biasConfirmed ? 'rgba(16,185,129,0.07)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${biasConfirmed ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.07)'}`,
              color: biasConfirmed ? 'var(--primary)' : 'var(--text-muted)',
            }}>
              {biasConfirmed
                ? `✅ Pattern confirmed in this window: high-digit combos average ${highAvg.toFixed(2)}× hits vs ${lowAvg.toFixed(2)}× for low-digit combos — a ${((highAvg / lowAvg - 1) * 100).toFixed(0)}% difference. Prioritize high-digit overdue combos for stronger picks.`
                : `ℹ️ No significant digit-range bias in this window (high avg ${highAvg.toFixed(2)}× vs low avg ${lowAvg.toFixed(2)}×). The pattern may appear over a larger draw window — try "All data" to see the full picture.`
              }
            </div>
          </div>

          {/* ── TOP & BOTTOM HITTERS ────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>

            {/* Top 10 most frequent */}
            <div style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '9px', padding: '12px' }}>
              <h4 style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center' }}>
                🔥 Top 10 — Most Frequent
                <Tooltip text="These 10 combos have appeared most often in the selected draw window. They are 'proven hitters' — the system keeps drawing them. When one of these is also currently overdue, that's a high-confidence pick.">
                  <HelpIcon />
                </Tooltip>
              </h4>
              {topHitters.map(({ combo, hits }, i) => (
                <div key={combo} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', width: '16px', textAlign: 'right', flexShrink: 0 }}>#{i + 1}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', letterSpacing: '2px', width: '34px', flexShrink: 0 }}>{combo}</span>
                  <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${topHitters[0].hits > 0 ? (hits / topHitters[0].hits) * 100 : 0}%`, height: '100%', background: 'var(--primary)', borderRadius: '3px' }} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: hitColor(hits), fontWeight: '600', flexShrink: 0, width: '24px', textAlign: 'right' }}>{hits}×</span>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', flexShrink: 0 }}>{digitRangeLabel(combo) === 'high' ? '⬆' : digitRangeLabel(combo) === 'low' ? '⬇' : '↔'}</span>
                </div>
              ))}
            </div>

            {/* Bottom 10 coldest */}
            <div style={{ background: 'rgba(239,68,68,0.03)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '9px', padding: '12px' }}>
              <h4 style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: '700', color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center' }}>
                🧊 Bottom 10 — Least Frequent
                <Tooltip text="These combos have appeared the fewest times (or never) in the selected draw window. Combos with 0 hits have never appeared in this window — they may be long overdue, or they may just be statistical outliers in smaller windows.">
                  <HelpIcon />
                </Tooltip>
              </h4>
              {coldest.map(({ combo, hits }, i) => (
                <div key={combo} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', width: '16px', textAlign: 'right', flexShrink: 0 }}>#{ranked.length - i}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: '700', color: hits === 0 ? 'var(--danger)' : 'var(--text-main)', letterSpacing: '2px', width: '34px', flexShrink: 0 }}>{combo}</span>
                  <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${topHitters[0].hits > 0 ? (hits / topHitters[0].hits) * 100 : 0}%`, height: '100%', background: hits === 0 ? 'var(--danger)' : 'rgba(239,68,68,0.5)', borderRadius: '3px' }} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: hits === 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: hits === 0 ? '700' : 'normal', flexShrink: 0, width: '24px', textAlign: 'right' }}>{hits}×</span>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', flexShrink: 0 }}>{digitRangeLabel(combo) === 'high' ? '⬆' : digitRangeLabel(combo) === 'low' ? '⬇' : '↔'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── FULL RANKED LIST ────────────────────────────────────────── */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <button
                onClick={() => setShowFullList(v => !v)}
                style={{ background: 'none', border: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '12px', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer' }}
              >
                {showFullList ? '▲ Hide full ranking' : '▼ Show all 120 ranked'}
              </button>
              {showFullList && (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sort:</span>
                  {[['freq', 'By frequency'], ['combo', 'By combo']].map(([mode, label]) => (
                    <button
                      key={mode}
                      onClick={() => setSortMode(mode)}
                      style={{
                        padding: '3px 9px', borderRadius: '5px', fontSize: '11px', cursor: 'pointer',
                        border: `1px solid ${sortMode === mode ? 'var(--primary)' : 'var(--border-color)'}`,
                        background: sortMode === mode ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.03)',
                        color: sortMode === mode ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: sortMode === mode ? '600' : 'normal',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {showFullList && (
              <>
                {/* Legend */}
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  <span>⬆ High digits (5–9)</span>
                  <span>⬇ Low digits (0–4)</span>
                  <span>↔ Mixed</span>
                  <span style={{ color: 'var(--primary)' }}>■ Above average ({expectedHits.toFixed(1)}+ hits)</span>
                  <span style={{ color: 'var(--danger)' }}>■ Never hit (0×)</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '5px' }}>
                  {displayList.map(({ combo, hits }, i) => {
                    const rank = sortMode === 'freq' ? i + 1 : ranked.findIndex(r => r.combo === combo) + 1;
                    const rangeLabel = digitRangeLabel(combo);
                    const aboveAvg = hits >= expectedHits;
                    const neverHit = hits === 0;
                    return (
                      <div
                        key={combo}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '5px 8px', borderRadius: '6px',
                          background: neverHit ? 'rgba(239,68,68,0.06)' : aboveAvg ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${neverHit ? 'rgba(239,68,68,0.2)' : aboveAvg ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)'}`,
                        }}
                      >
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)', width: '22px', textAlign: 'right', flexShrink: 0 }}>#{rank}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', letterSpacing: '2px', flexShrink: 0 }}>{combo}</span>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)', flexShrink: 0 }}>
                          {rangeLabel === 'high' ? '⬆' : rangeLabel === 'low' ? '⬇' : '↔'}
                        </span>
                        <div style={{ flex: 1, height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${topHitters[0].hits > 0 ? (hits / topHitters[0].hits) * 100 : 0}%`, height: '100%', background: neverHit ? 'transparent' : aboveAvg ? 'var(--primary)' : 'rgba(255,255,255,0.2)', borderRadius: '2px' }} />
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: hitColor(hits), fontWeight: neverHit || aboveAvg ? '700' : 'normal', flexShrink: 0 }}>{hits}×</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <p style={{ marginTop: '14px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
            💡 <strong style={{ color: 'var(--text-main)' }}>How to use this:</strong> Cross-reference with Today's Top Picks — a combo that ranks in the <strong style={{ color: 'var(--primary)' }}>Top 10 most frequent</strong> AND is currently <strong style={{ color: 'var(--primary)' }}>overdue</strong> is your highest-confidence play. It's a proven hitter that's currently due to come back.
          </p>
        </>
      )}
    </div>
  );
}
