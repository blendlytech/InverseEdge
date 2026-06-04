import { useState, useMemo } from 'react';
import { predictNextCombo, toGuideForm } from '../utils/AIEngine';
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
  { label: '14 days', value: 28 },
  { label: '30 days', value: 60 },
  { label: '60 days', value: 120 },
  { label: '100 days', value: 200 },
];

// dueWeight per mode (overdue logic vs. scanner profile)
const WEIGHT_MODES = [
  { key: 'overdue', label: 'Overdue-led', dueWeight: 0.65 },
  { key: 'even', label: 'Even blend', dueWeight: 0.5 },
  { key: 'profile', label: 'Profile-led', dueWeight: 0.35 },
];

function tier(score) {
  if (score >= 0.66) return { label: 'Strong', color: 'var(--primary)', bg: 'rgba(16,185,129,0.15)', bd: 'rgba(16,185,129,0.5)' };
  if (score >= 0.5) return { label: 'Moderate', color: 'var(--secondary)', bg: 'rgba(234,179,8,0.12)', bd: 'rgba(234,179,8,0.4)' };
  return { label: 'Speculative', color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.04)', bd: 'rgba(255,255,255,0.1)' };
}

// A labeled mini score bar for the "why" breakdown
function WhyBar({ label, value, display }) {
  const pct = Math.round(value * 100);
  return (
    <div style={{ marginBottom: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{display}</span>
      </div>
      <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary)', borderRadius: '3px', transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

export default function PredictionPanel({ draws, historyFilterDays = 14 }) {
  const [isOpen, setIsOpen] = useState(true);
  const [lookback, setLookback] = useState(60);
  const [weightMode, setWeightMode] = useState('overdue');

  const dueWeight = WEIGHT_MODES.find(m => m.key === weightMode).dueWeight;

  const result = useMemo(
    () => (draws.length ? predictNextCombo(draws, { lookback, historyFilterDays, dueWeight, count: 3 }) : null),
    [draws, lookback, historyFilterDays, dueWeight]
  );

  if (!result || result.predictions.length === 0) return null;

  const { predictions, profile, doublesSideBet: side } = result;
  const top = predictions[0];
  const alts = predictions.slice(1);
  const t = tier(top.final);

  return (
    <div className="glass-card" style={{ border: '1px solid rgba(168,85,247,0.3)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
          🔮 Pattern-Informed Prediction
          <Tooltip text="Blends the overdue/gap logic (the core strategy) with the Winning-Number Pattern Scanner profile — typical sum, high/low and even/odd shape, and digit carryover — into one ranked shortlist. It's a disciplined way to choose, not a probability edge.">
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
          {/* Honest disclaimer */}
          <div style={{ marginTop: '14px', marginBottom: '14px', padding: '9px 12px', background: 'rgba(234,179,8,0.07)', border: '1px solid rgba(234,179,8,0.25)', borderRadius: '8px', fontSize: '11px', color: 'var(--secondary)', lineHeight: '1.55' }}>
            ⚠️ <strong>Heuristic, not an edge.</strong> Pick-3 draws are independent and random — every box combo stays 6-in-1000 no matter the history. This ranks combos by overdue status and how well they fit recent patterns to give you a structured pick, but it cannot make any number more likely to hit.
          </div>

          {/* Controls */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center',
            marginBottom: '16px', padding: '11px 14px',
            background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '9px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                Pattern window
                <Tooltip direction="down" text="How many recent draws to build the pattern profile and overdue status from. Larger windows give a more stable profile; smaller windows react to recent shifts.">
                  <HelpIcon />
                </Tooltip>:
              </span>
              {LOOKBACK_PRESETS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setLookback(value)}
                  style={{
                    padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                    border: `1px solid ${lookback === value ? 'var(--primary)' : 'var(--border-color)'}`,
                    background: lookback === value ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)',
                    color: lookback === value ? 'var(--primary)' : 'var(--text-muted)',
                    fontWeight: lookback === value ? '600' : 'normal',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                Balance
                <Tooltip direction="down" text="How much the overdue/gap logic vs. the scanner profile drives the ranking. Overdue-led (recommended) keeps the core strategy in charge; Profile-led leans hardest on the pattern findings.">
                  <HelpIcon />
                </Tooltip>:
              </span>
              {WEIGHT_MODES.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setWeightMode(key)}
                  style={{
                    padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                    border: `1px solid ${weightMode === key ? 'var(--primary)' : 'var(--border-color)'}`,
                    background: weightMode === key ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)',
                    color: weightMode === key ? 'var(--primary)' : 'var(--text-muted)',
                    fontWeight: weightMode === key ? '600' : 'normal',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>
              {profile.windowCount} draws · {profile.activeCount} on sheet
            </span>
          </div>

          {/* Profile summary chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            {[
              { lbl: 'Typical sum', val: `~${profile.targetSum} (±${Math.round(profile.sumStd)})` },
              { lbl: 'Usual shape', val: `${profile.dominantHigh} high · ${profile.dominantEven} even` },
              { lbl: 'Avg carryover', val: `${profile.avgCarryover.toFixed(2)} digit${profile.avgCarryover === 1 ? '' : 's'}` },
              { lbl: 'Last draw', val: profile.lastDraw || '—' },
            ].map(({ lbl, val }) => (
              <div key={lbl} style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '7px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{lbl}: </span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{val}</span>
              </div>
            ))}
          </div>

          {/* Headline prediction + alternates */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: '14px' }}>
            {/* Top pick */}
            <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top prediction</span>
                <span style={{ fontSize: '10px', fontWeight: '700', color: t.color, background: t.bg, border: `1px solid ${t.bd}`, padding: '2px 8px', borderRadius: '5px', textTransform: 'uppercase' }}>
                  {t.label} · {Math.round(top.final * 100)}
                </span>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '46px', fontWeight: 'bold', color: 'var(--text-main)', letterSpacing: '8px', lineHeight: 1 }}>{top.exact}</div>
                <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>▸ Play STRAIGHT ◂</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>box <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>{toGuideForm(top.combo)}</strong></div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '8px', padding: '10px 12px', marginTop: '10px' }}>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px', fontWeight: '600' }}>Why this pick</div>
                <WhyBar label="Overdue (core strategy)" value={top.dueScore} display={top.lastHit === 999 ? '∞ never in window' : `${top.lastHit} draws`} />
                <WhyBar label="Pattern-profile match" value={top.profileMatch} display={`${Math.round(top.profileMatch * 100)}%`} />
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>sum <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{top.sum}</strong></span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>· <strong style={{ color: 'var(--text-main)' }}>{top.highCount}</strong> high / <strong style={{ color: 'var(--text-main)' }}>{top.evenCount}</strong> even</span>
                  {top.carryShared > 0 && <span style={{ fontSize: '10px', color: 'var(--secondary)', fontWeight: '600' }}>· ↩ {top.carryShared} carry-over</span>}
                </div>
              </div>

              <button
                onClick={() => { navigator.clipboard.writeText(top.exact); alert(`📋 ${top.exact} (straight) copied!`); }}
                className="btn btn-primary btn-small"
                style={{ width: '100%', marginTop: '10px', fontSize: '11px', padding: '7px' }}
              >
                📋 Copy {top.exact} Straight
              </button>
            </div>

            {/* Alternates + doubles side bet */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px 14px' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Backup picks</h4>
                {alts.map((p, i) => (
                  <div key={p.combo} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', borderBottom: i < alts.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', width: '16px' }}>#{i + 2}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', letterSpacing: '2px' }}>{p.exact}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: 'auto' }}>box {toGuideForm(p.combo)} · {Math.round(p.final * 100)}</span>
                  </div>
                ))}
              </div>

              {/* Doubles side bet — kept separate from the 120 sheet */}
              <div style={{ background: side.overdue ? 'rgba(234,179,8,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${side.overdue ? 'rgba(234,179,8,0.3)' : 'var(--border-color)'}`, borderRadius: '10px', padding: '12px 14px' }}>
                <h4 style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: '700', color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center' }}>
                  🎲 Doubles side bet
                  <Tooltip text="The 120 master list contains no doubles, so this is a separate optional bet. It flags when a double is past its average gap and which digit has been doubling most — purely a timing cue for an independent side play.">
                    <HelpIcon />
                  </Tooltip>
                </h4>
                {side.count === 0 ? (
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>No doubles in this window to profile.</p>
                ) : (
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.55' }}>
                    Doubles are <strong style={{ color: side.overdue ? 'var(--secondary)' : 'var(--text-main)' }}>{side.currentGap} draws</strong> since the last, vs a <strong style={{ color: 'var(--text-main)' }}>{side.avgGap ? side.avgGap.toFixed(1) : '—'}</strong> average{side.overdue ? ' (overdue)' : ''}. Most frequent repeat digit: <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{side.hotDigit}</strong>. If playing a double, <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{side.suggestedDouble}x</strong> fits the pattern.
                  </p>
                )}
              </div>
            </div>
          </div>

          <p style={{ marginTop: '14px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
            💡 <strong style={{ color: 'var(--text-main)' }}>How to use this:</strong> Treat the top pick as a focused straight play and the backups as box-bet alternates within budget. The score is a ranking aid, not a probability — use the <strong style={{ color: 'var(--text-main)' }}>🕰️ Time Machine</strong> to see how this style of pick has actually landed over past draws before trusting it.
          </p>
        </>
      )}
    </div>
  );
}
