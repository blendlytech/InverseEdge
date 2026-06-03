import { useState } from 'react';
import {
  generateMasterList,
  applyHistoryFilter,
  scoreExactPlays,
  getPositionFrequencies,
  toGuideForm,
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
  { label: '7 days',  draws: 14 },
  { label: '14 days', draws: 28 },
  { label: '30 days', draws: 60 },
  { label: '60 days', draws: 120 },
];

// Confidence tier from composite score (0..1)
function tier(score) {
  if (score >= 0.7)  return { label: 'High',        color: 'var(--primary)',   bg: 'rgba(16,185,129,0.15)', bd: 'rgba(16,185,129,0.5)' };
  if (score >= 0.5)  return { label: 'Medium',      color: 'var(--secondary)', bg: 'rgba(234,179,8,0.12)',  bd: 'rgba(234,179,8,0.4)' };
  return               { label: 'Speculative', color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.04)', bd: 'rgba(255,255,255,0.1)' };
}

export default function BestExactPanel({ draws, historyFilterDays }) {
  const [lookback, setLookback] = useState(28);
  const [showCount, setShowCount] = useState(3);

  const drawStrings = draws.map(d => d.draw);
  const masterList = generateMasterList();

  // Only consider combos not drawn recently (history filter), same as the play sheet
  const active = applyHistoryFilter(masterList, drawStrings, historyFilterDays);

  const plays = scoreExactPlays(active, drawStrings, lookback).slice(0, showCount);

  // Position frequencies for the per-play "why" breakdown
  const posFreq = getPositionFrequencies(drawStrings, lookback);
  const posMax = posFreq.map(f => Math.max(1, ...Object.values(f)));

  const allExact = plays.map(p => p.exact).join(', ');

  return (
    <div className="glass-card" style={{ border: '1px solid rgba(16,185,129,0.35)' }}>
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }} className="glow-text-primary">
          🎯 Best Exact Plays
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--bg-base)', background: 'var(--primary)', padding: '2px 8px', borderRadius: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Highest Payout
          </span>
          <Tooltip text="A STRAIGHT (exact-order) Pick-3 bet pays roughly $500 on $1 — about 6× more than a box (any-order) bet. This section finds your strongest exact plays: combinations that are overdue to hit, shown in the specific order they're most likely to land based on recent position trends. These are the numbers to play straight for the big win.">
            <HelpIcon />
          </Tooltip>
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
          Your top exact-order numbers — <strong style={{ color: 'var(--text-main)' }}>overdue combinations</strong> shown in their <strong style={{ color: 'var(--text-main)' }}>most likely exact order</strong>. Play these as <strong style={{ color: 'var(--primary)' }}>straight bets</strong> for the ~$500 payout.
        </p>
      </div>

      {/* ── CONTROLS ───────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center',
        padding: '11px 14px', marginBottom: '18px',
        background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '9px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
            Scan last
            <Tooltip direction="down" text="How many recent draws to analyze for overdue status and position trends. Shorter windows react to hot streaks; longer windows reveal deeper patterns.">
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
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Show top</span>
          {[3, 5, 8].map(n => (
            <button
              key={n}
              onClick={() => setShowCount(n)}
              style={{
                padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                border: `1px solid ${showCount === n ? 'var(--primary)' : 'var(--border-color)'}`,
                background: showCount === n ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)',
                color: showCount === n ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: showCount === n ? '600' : 'normal',
              }}
            >
              {n}
            </button>
          ))}
        </div>

        {plays.length > 0 && (
          <button
            onClick={() => { navigator.clipboard.writeText(allExact); alert(`📋 Copied ${plays.length} exact plays:\n${allExact}`); }}
            className="btn btn-primary btn-small"
            style={{ marginLeft: 'auto', fontSize: '12px', padding: '5px 12px' }}
          >
            📋 Copy All Exact Plays
          </button>
        )}
      </div>

      {/* ── PLAY CARDS ─────────────────────────────────────────────────── */}
      {plays.length === 0 ? (
        <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          Enter more draw results to generate exact-play recommendations.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {plays.map((p, idx) => {
            const t = tier(p.score);
            const isOverdue = p.boxGap === 999;
            const isAllHigh = p.combo.split('').every(d => parseInt(d, 10) >= 5);

            return (
              <div key={p.exact} style={{
                background: idx === 0 ? 'rgba(16,185,129,0.08)' : 'rgba(0,0,0,0.25)',
                border: idx === 0 ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px', padding: '16px',
              }}>
                {/* Rank + confidence */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', color: idx === 0 ? 'var(--primary)' : 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    #{idx + 1} Exact Play
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: t.color, background: t.bg, border: `1px solid ${t.bd}`, padding: '2px 8px', borderRadius: '5px', textTransform: 'uppercase' }}>
                    {t.label} confidence
                  </span>
                </div>

                {/* The exact number — hero */}
                <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '46px', fontWeight: 'bold', color: 'var(--text-main)', letterSpacing: '8px', lineHeight: 1 }}>
                    {p.exact}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
                    ▸ Play STRAIGHT ◂
                  </div>
                </div>

                {/* Tags */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    Box: <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>{toGuideForm(p.combo)}</strong>
                  </span>
                  {isAllHigh && (
                    <span style={{ fontSize: '10px', color: 'var(--secondary)', fontWeight: '600' }}>⬆ high-digit</span>
                  )}
                </div>

                {/* Why — transparency */}
                <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '8px', padding: '10px', marginBottom: '10px' }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '7px', fontWeight: '600' }}>
                    Why this play
                  </div>

                  {/* Overdue */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Box overdue</span>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: isOverdue ? 'var(--primary)' : 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                      {isOverdue ? '∞ never in window' : `${p.boxGap} draws ago`}
                    </span>
                  </div>

                  {/* Order match */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Order likelihood
                      <Tooltip direction="up" text="How strongly this exact ordering matches which digit lands in each position most often in recent draws. Higher = this is the most probable arrangement when the combo hits.">
                        <HelpIcon />
                      </Tooltip>
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                      {Math.round(p.posScore * 100)}%
                    </span>
                  </div>

                  {/* Per-position breakdown */}
                  <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                    {p.exact.split('').map((digit, i) => {
                      const cnt = posFreq[i][digit] || 0;
                      const pct = (cnt / posMax[i]) * 100;
                      const isHotHere = cnt === posMax[i] && cnt > 0;
                      return (
                        <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                          <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '2px' }}>Pos {i + 1}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 'bold', color: isHotHere ? 'var(--primary)' : 'var(--text-main)' }}>{digit}</div>
                          <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden', marginTop: '2px' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: isHotHere ? 'var(--primary)' : 'rgba(16,185,129,0.35)' }} />
                          </div>
                          <div style={{ fontSize: '8px', color: 'var(--text-muted)', marginTop: '1px' }}>{cnt}×</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => { navigator.clipboard.writeText(p.exact); alert(`📋 ${p.exact} (straight) copied!`); }}
                    className="btn btn-primary btn-small"
                    style={{ flex: 1, fontSize: '11px', padding: '6px' }}
                  >
                    📋 Copy {p.exact} Straight
                  </button>
                  <button
                    onClick={() => { navigator.clipboard.writeText(toGuideForm(p.combo)); alert(`📋 ${toGuideForm(p.combo)} (box) copied!`); }}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}
                  >
                    + Box
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── BET STRATEGY ───────────────────────────────────────────────── */}
      <div style={{ marginTop: '16px', padding: '12px 14px', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.7' }}>
        💡 <strong style={{ color: 'var(--text-main)' }}>How to bet these:</strong> Play the big number as a <strong style={{ color: 'var(--primary)' }}>$0.50–$1 STRAIGHT</strong> (exact order) for the ~$500 payout. Optionally add a small <strong>box</strong> bet on the same combo as backup — that pays ~$80 if the digits come in any order. <strong style={{ color: 'var(--text-main)' }}>#1 has the strongest signal;</strong> start there and work down to your budget.
      </div>
    </div>
  );
}
