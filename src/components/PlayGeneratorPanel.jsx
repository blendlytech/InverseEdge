import { useState } from 'react';
import {
  generateMasterList,
  normalizeDraw,
  isDoubleOrTriple,
  scoreStraightPermutations,
  scoreComboGaps,
} from '../utils/AIEngine';
import Tooltip from './Tooltip';

const HelpIcon = () => (
  <span style={{
    cursor: 'help', color: 'var(--primary)', opacity: 0.8,
    fontSize: '11px', marginLeft: '5px', flexShrink: 0,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: '15px', height: '15px',
    border: '1px solid var(--primary)', borderRadius: '50%', fontWeight: 'bold',
  }}>?</span>
);

const LOOKBACK_PRESETS = [
  { label: '7 days', draws: 14 },
  { label: '14 days', draws: 28 },
  { label: '30 days', draws: 60 },
  { label: '60 days', draws: 120 },
];

export default function PlayGeneratorPanel({ draws, historyFilterDays, setHistoryFilterDays }) {
  const [lookback, setLookback] = useState(28);
  const [selectedCombo, setSelectedCombo] = useState(null);
  const [showRecentlyDrawn, setShowRecentlyDrawn] = useState(false);

  const drawStrings = draws.map(d => d.draw);
  const masterList = generateMasterList();

  // Score all 120 by gap (draws since last box hit within the lookback window)
  const scored = scoreComboGaps(masterList, drawStrings, lookback);
  const gapMap = new Map(scored.map(s => [s.combo, s]));

  // Combos drawn in the history filter window — exclude from play sheet
  const recentlyDrawn = new Set(
    drawStrings
      .filter(d => !isDoubleOrTriple(d))
      .slice(0, historyFilterDays)
      .map(normalizeDraw)
  );

  const activeCombos = masterList.filter(c => !recentlyDrawn.has(c));
  const excludedCount = masterList.length - activeCombos.length;

  // Top 3 picks: most overdue among active combos
  const scoredActive = scored.filter(s => !recentlyDrawn.has(s.combo));
  const topPicks = scoredActive.slice(0, 3).map(({ combo, lastHit }) => ({
    combo,
    lastHit,
    perms: scoreStraightPermutations(combo, drawStrings, lookback),
  }));

  // Exact orderings for selected combo
  const straightPerms = selectedCombo
    ? scoreStraightPermutations(selectedCombo, drawStrings, lookback)
    : [];

  return (
    <div className="glass-card">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }} className="glow-text-primary">
          The 120-Combination System
          <Tooltip text="Pick-3 has 1,000 possible outcomes (000–999). Remove all doubles (112, 334…) and triples (111, 999…) and only 120 combinations remain — where all 3 digits are different. Research shows every non-double, non-triple drawing lands on this master list. That shrinks your universe from 1-in-1,000 to 1-in-120 — like stacking the deck in your favor.">
            <HelpIcon />
          </Tooltip>
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
          Every non-double, non-triple Pick-3 result lands on this list. Find which combinations are most overdue, then bet the most overdue <strong style={{ color: 'var(--text-main)' }}>exact ordering</strong> for the highest payout.
        </p>
      </div>

      {/* ── SETTINGS ───────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center',
        padding: '12px 16px', marginBottom: '20px',
        background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px',
      }}>

        {/* Lookback */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
            Scan last
            <Tooltip direction="down" text="How many recent drawings to look back when checking if a combination is overdue. 14 days = 28 draws (twice daily). Smaller windows focus on very recent patterns. Larger windows reveal longer-term overdue combos. Start with 14 days — adjust based on what patterns you're seeing.">
              <HelpIcon />
            </Tooltip>:
          </span>
          {LOOKBACK_PRESETS.map(({ label, draws: d }) => (
            <button
              key={label}
              onClick={() => setLookback(d)}
              style={{
                padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                border: `1px solid ${lookback === d ? 'var(--primary)' : 'var(--border-color)'}`,
                background: lookback === d ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)',
                color: lookback === d ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: lookback === d ? '600' : 'normal',
              }}
            >
              {label}
            </button>
          ))}
          <input
            type="number" min="7" max="500" value={lookback}
            onChange={e => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v > 0) setLookback(v); }}
            style={{ width: '55px', padding: '4px 6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '4px', fontSize: '12px' }}
          />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>draws (~2/day)</span>
        </div>

        {/* History filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
            Exclude last
            <Tooltip direction="down" text="Combinations drawn in this many recent drawings are unlikely to repeat so soon — remove them from your play sheet to cut cost and improve odds. Default 14 draws ≈ 1 week of drawings. Set to 0 to disable.">
              <HelpIcon />
            </Tooltip>:
          </span>
          <input
            type="number" min="0" max="100" value={historyFilterDays}
            onChange={e => { const v = parseInt(e.target.value, 10); if (!isNaN(v)) setHistoryFilterDays(v); }}
            style={{ width: '52px', padding: '4px 6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '4px', fontSize: '12px' }}
          />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>draws</span>
        </div>
      </div>

      {/* ── STATS BAR ──────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Total Master List', value: '120', color: 'var(--text-main)', note: 'non-repeating combos' },
          { label: 'Recently Drawn', value: excludedCount, color: 'var(--danger)', note: 'excluded from play sheet' },
          { label: 'Active Today', value: activeCombos.length, color: 'var(--primary)', note: 'ready to play' },
        ].map(({ label, value, color, note }) => (
          <div key={label} style={{ textAlign: 'center', padding: '10px 8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
            <div style={{ fontSize: '26px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>{note}</div>
          </div>
        ))}
      </div>

      {/* ── TODAY'S TOP PICKS ──────────────────────────────────────────── */}
      {topPicks.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.04))',
          border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px',
          padding: '16px', marginBottom: '24px',
        }}>
          <h3 style={{ color: 'var(--primary)', fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px', display: 'flex', alignItems: 'center' }}>
            🏆 Today's Top Picks
            <Tooltip text="The 3 most overdue combinations from the active list — they haven't appeared as a box hit in the longest time. For each pick you'll see ALL 6 exact orderings ranked most-overdue first. ★ OVERDUE = that exact number has never appeared in your scan window — your highest-value straight bet.">
              <HelpIcon />
            </Tooltip>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
            {topPicks.map(({ combo, lastHit, perms }, pickIdx) => (
              <div key={combo} style={{
                background: pickIdx === 0 ? 'rgba(16,185,129,0.08)' : 'rgba(0,0,0,0.25)',
                border: pickIdx === 0 ? '1px solid rgba(16,185,129,0.35)' : '1px solid rgba(255,255,255,0.07)',
                borderRadius: '10px', padding: '14px',
              }}>

                {/* Pick header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: pickIdx === 0 ? 'var(--primary)' : 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      #{pickIdx + 1} Pick — Box Bet
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '32px', fontWeight: 'bold', color: 'var(--text-main)', letterSpacing: '5px', lineHeight: 1 }}>
                      {combo}
                    </div>
                    <div style={{ fontSize: '11px', marginTop: '4px', color: lastHit === 999 ? 'var(--primary)' : 'var(--text-muted)', fontWeight: lastHit === 999 ? '600' : 'normal' }}>
                      Box overdue: {lastHit === 999 ? '∞ draws — OVERDUE' : `${lastHit} draws ago`}
                    </div>
                  </div>
                  <button
                    onClick={() => { navigator.clipboard.writeText(combo); alert(`📋 ${combo} (box) copied!`); }}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', padding: '4px 8px', borderRadius: '5px', cursor: 'pointer', fontSize: '10px', flexShrink: 0 }}
                  >
                    📋 Copy Box
                  </button>
                </div>

                {/* Section label */}
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px' }}>
                  All 6 Exact Orderings — Most Overdue First
                  <Tooltip direction="down" text="Every combination can be drawn in 6 different exact orders. These are sorted from most overdue (★) to most recently hit. Bet the ★ OVERDUE ordering as a straight bet for the highest payout (~$250 on $0.50). Combine with a box bet for full coverage.">
                    <HelpIcon />
                  </Tooltip>
                </div>

                {/* All 6 exact orderings */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px' }}>
                  {perms.map(({ perm, lastHit: ph }) => {
                    const isOverdue = ph === 999;
                    const isHot = !isOverdue && ph <= 10;
                    return (
                      <div key={perm} style={{
                        textAlign: 'center', padding: '7px 4px', borderRadius: '6px',
                        background: isOverdue ? 'rgba(16,185,129,0.12)' : isHot ? 'rgba(239,68,68,0.07)' : 'rgba(0,0,0,0.2)',
                        border: `1px solid ${isOverdue ? 'rgba(16,185,129,0.45)' : isHot ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.05)'}`,
                      }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 'bold', color: isOverdue ? 'var(--primary)' : 'var(--text-main)', letterSpacing: '2px' }}>
                          {perm}
                        </div>
                        <div style={{ fontSize: '8px', marginTop: '2px', color: isOverdue ? 'var(--primary)' : isHot ? 'var(--danger)' : 'var(--text-muted)', fontWeight: isOverdue ? '700' : 'normal' }}>
                          {isOverdue ? '★ OVERDUE' : isHot ? `⚡ ${ph}d ago` : `${ph}d ago`}
                        </div>
                        <button
                          onClick={() => { navigator.clipboard.writeText(perm); alert(`📋 ${perm} (exact) copied!`); }}
                          style={{ marginTop: '3px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '9px', padding: '1px 4px' }}
                        >
                          📋
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Bet tip */}
                <div style={{ marginTop: '10px', fontSize: '10px', color: 'var(--text-muted)', lineHeight: '1.5', padding: '7px 9px', background: 'rgba(0,0,0,0.2)', borderRadius: '5px' }}>
                  💡 Play <strong style={{ color: 'var(--text-main)' }}>{combo}</strong> as <strong>$0.50 box</strong> (any order) + the <strong style={{ color: 'var(--primary)' }}>★ overdue</strong> ordering as <strong>$0.50 straight</strong> (exact). $1 total — doubles your money on box, ~250× on exact.
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── THE 120 MASTER LIST ─────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', fontWeight: '700' }}>
            📋 The 120-Combination Master List
            <Tooltip text="All 120 Pick-3 combinations where all 3 digits are different. The number under each combo = how many draws ago it last appeared as a box hit within your scan window. ∞ = hasn't hit in the scan window (most overdue). Red number = hit recently. Grayed-out = excluded by your history filter. Click any combo for full exact-order analysis.">
              <HelpIcon />
            </Tooltip>
          </h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
              <input
                type="checkbox" checked={showRecentlyDrawn}
                onChange={e => setShowRecentlyDrawn(e.target.checked)}
                style={{ accentColor: 'var(--primary)' }}
              />
              Show excluded
            </label>
            <button
              onClick={() => { navigator.clipboard.writeText(activeCombos.join(', ')); alert(`📋 ${activeCombos.length} active combos copied!`); }}
              className="btn btn-secondary btn-small"
              style={{ fontSize: '11px', padding: '5px 10px' }}
            >
              📋 Copy Active List
            </button>
          </div>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: '1.6' }}>
          <span style={{ color: 'var(--primary)', fontWeight: '600' }}>∞</span> = overdue (not seen in scan window) &nbsp;·&nbsp;
          <span style={{ color: 'var(--danger)', fontWeight: '600' }}>red</span> = appeared recently &nbsp;·&nbsp;
          <span style={{ color: 'var(--text-main)' }}>click any combo</span> for exact ordering analysis
        </div>

        <div className="comb-list-container">
          {masterList.map(combo => {
            const isExcluded = recentlyDrawn.has(combo);
            if (isExcluded && !showRecentlyDrawn) return null;
            const isSelected = selectedCombo === combo;
            const gap = gapMap.get(combo);
            const isOverdue = gap?.lastHit === 999;
            const isHot = !isOverdue && gap?.lastHit <= 10;

            return (
              <div
                key={combo}
                className={`comb-badge ${isExcluded ? 'filtered' : ''}`}
                title={isExcluded ? 'Recently drawn — excluded from play sheet' : 'Click to analyze all 6 exact orderings'}
                onClick={() => { if (!isExcluded) setSelectedCombo(isSelected ? null : combo); }}
                style={{
                  cursor: isExcluded ? 'default' : 'pointer',
                  display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  ...(isSelected ? { borderColor: 'var(--primary)', boxShadow: '0 0 8px rgba(16,185,129,0.5)', color: 'var(--primary)' } : {}),
                }}
              >
                <span>{combo}</span>
                {gap && (
                  <span style={{
                    display: 'block', fontSize: '8px', marginTop: '1px', lineHeight: 1,
                    fontFamily: 'var(--font-mono)',
                    color: isOverdue ? 'var(--primary)' : isHot ? 'var(--danger)' : 'rgba(255,255,255,0.3)',
                    opacity: isExcluded ? 0.4 : 1,
                  }}>
                    {isOverdue ? '∞' : `${gap.lastHit}d`}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── EXACT BET ANALYZER ─────────────────────────────────────────── */}
      {selectedCombo && (
        <div style={{ marginTop: '24px', background: 'rgba(16,185,129,0.03)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ color: 'var(--primary)', fontSize: '15px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              🎯 Exact Bet Analyzer
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', color: 'var(--text-main)', background: 'rgba(255,255,255,0.06)', padding: '2px 14px', borderRadius: '6px', letterSpacing: '4px' }}>
                {selectedCombo}
              </span>
              <Tooltip text="Pick-3 pays roughly $500 on a $1 straight (exact order) bet vs $80 on a $1 box (any order) bet. All 6 cards below show every possible exact ordering of this combination, ranked from most overdue to most recently hit. Bet the ★ OVERDUE card as your straight to maximize return.">
                <HelpIcon />
              </Tooltip>
            </h3>
            <button
              onClick={() => setSelectedCombo(null)}
              style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
            >
              ✕ Close
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(115px, 1fr))', gap: '8px' }}>
            {straightPerms.map(({ perm, lastHit, frequency }, i) => {
              const isOverdue = lastHit === 999;
              const isHot = !isOverdue && lastHit <= 10;
              return (
                <div key={perm} style={{
                  background: isOverdue ? 'rgba(16,185,129,0.07)' : isHot ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isOverdue ? 'rgba(16,185,129,0.5)' : isHot ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: '8px', padding: '10px 8px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: '600' }}>#{i + 1}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 'bold', color: 'var(--text-main)', letterSpacing: '3px' }}>
                    {perm}
                  </div>
                  <div style={{ fontSize: '10px', color: isOverdue ? 'var(--primary)' : isHot ? 'var(--danger)' : 'var(--text-muted)', marginTop: '5px', fontWeight: '600', textTransform: 'uppercase', lineHeight: 1.3 }}>
                    {isOverdue ? '★ OVERDUE' : isHot ? `⚡ ${lastHit} draws ago` : `${lastHit} draws ago`}
                  </div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '3px' }}>
                    {frequency === 0 ? 'No exact hits' : `${frequency}× exact`}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(perm); alert(`📋 ${perm} copied!`); }}
                    style={{ marginTop: '7px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', width: '100%' }}
                  >
                    📋 Copy Exact
                  </button>
                </div>
              );
            })}
          </div>

          <p style={{ marginTop: '14px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.7', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
            💡 <strong style={{ color: 'var(--text-main)' }}>Bet Strategy:</strong> Play <strong style={{ color: 'var(--primary)' }}>{selectedCombo}</strong> as a <strong>$0.50 box</strong> (any order, ~$40 payout) + the <strong style={{ color: 'var(--primary)' }}>★ OVERDUE</strong> ordering as a <strong>$0.50 straight</strong> (exact order, ~$250 payout). Total cost: <strong>$1.00</strong>. Box hit = double your money. Exact hit = ~250× your straight stake.
          </p>
        </div>
      )}

      {/* ── HOW TO USE ─────────────────────────────────────────────────── */}
      <div style={{ marginTop: '24px', padding: '14px 16px', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.8' }}>
        <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '6px', fontSize: '13px' }}>📖 How to Use This System</strong>
        <ol style={{ margin: 0, paddingLeft: '16px' }}>
          <li>Set <strong style={{ color: 'var(--text-main)' }}>Scan last</strong> to your preferred lookback (14 days is a good starting point).</li>
          <li>Check <strong style={{ color: 'var(--primary)' }}>Today's Top Picks</strong> — these are the most overdue combinations from the 120.</li>
          <li>For each pick, find the <strong style={{ color: 'var(--primary)' }}>★ OVERDUE</strong> exact ordering — that's your straight bet.</li>
          <li>Play: <strong>$0.50 box</strong> on the combination + <strong>$0.50 straight</strong> on the ★ overdue ordering.</li>
          <li>Combos appearing in recent draws are automatically excluded to keep your odds sharp.</li>
        </ol>
      </div>
    </div>
  );
}
