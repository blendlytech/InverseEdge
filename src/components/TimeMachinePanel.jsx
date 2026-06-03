import { useState, useMemo } from 'react';
import { replaySystemPick, toGuideForm } from '../utils/AIEngine';
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

// "2026-05-30 Midday" → "May 30, 2026 · ☀️ Midday"
function formatDrawLabel(dateStr) {
  const spaceIdx = dateStr.indexOf(' ');
  const datePart = spaceIdx > -1 ? dateStr.slice(0, spaceIdx) : dateStr;
  const typePart = spaceIdx > -1 ? dateStr.slice(spaceIdx + 1) : '';
  const [y, mo, dy] = datePart.split('-');
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const base = `${MONTHS[parseInt(mo, 10) - 1]} ${parseInt(dy, 10)}, ${y}`;
  if (!typePart) return base;
  const icon = typePart === 'Midday' ? '☀️' : typePart === 'Evening' ? '🌙' : '';
  return `${base} · ${icon} ${typePart}`;
}

const LOOKBACK_PRESETS = [
  { label: '7 days', value: 14 },
  { label: '14 days', value: 28 },
  { label: '30 days', value: 60 },
  { label: '60 days', value: 120 },
];

// Grade the replay into a single verdict banner
function getVerdict(r) {
  if (r.pastCount === 0) {
    return { label: 'No prior data', icon: '⏳', color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.04)', bd: 'var(--border-color)',
      detail: 'There were no earlier draws on record before this one, so the system had nothing to base a pick on.' };
  }
  if (r.isDoubleTriple) {
    return { label: 'Out of universe', icon: '⚪', color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.04)', bd: 'var(--border-color)',
      detail: `This was a double/triple (${r.actual.draw}). The 120-combo strategy never covers these by design, so it could not have been a hit.` };
  }
  if (r.exactHit) {
    return { label: 'STRAIGHT HIT', icon: '🎯', color: 'var(--primary)', bg: 'rgba(16,185,129,0.15)', bd: 'rgba(16,185,129,0.5)',
      detail: 'The system listed this exact number as a Best Exact Play — a straight win (~$500).' };
  }
  if (r.exactBoxHit || r.boxPickHit) {
    return { label: 'TOP-PICK BOX HIT', icon: '✅', color: 'var(--primary)', bg: 'rgba(16,185,129,0.12)', bd: 'rgba(16,185,129,0.4)',
      detail: 'The winning box was among the system\'s top picks (box win ~$80), though not in the exact order suggested.' };
  }
  if (r.inActive) {
    return { label: 'ON THE SHEET', icon: '🟡', color: 'var(--secondary)', bg: 'rgba(234,179,8,0.12)', bd: 'rgba(234,179,8,0.4)',
      detail: 'The winning box was on the active 120 play sheet but not ranked into the top picks. Playing the full sheet would have hit it; the top-pick shortlist missed it.' };
  }
  return { label: 'MISS', icon: '❌', color: 'var(--danger)', bg: 'rgba(239,68,68,0.1)', bd: 'rgba(239,68,68,0.4)',
    detail: 'The winning box was filtered out (drawn within the recent history-filter window), so it was not on the play sheet for this draw.' };
}

export default function TimeMachinePanel({ draws, historyFilterDays = 14 }) {
  const [isOpen, setIsOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [lookback, setLookback] = useState(28);
  const [exactCount, setExactCount] = useState(3);

  const total = draws.length;
  const safeIndex = Math.min(index, Math.max(0, total - 1));

  const result = useMemo(
    () => (total ? replaySystemPick(draws, safeIndex, { lookback, historyFilterDays, exactCount, boxCount: 3 }) : null),
    [draws, safeIndex, lookback, historyFilterDays, exactCount, total]
  );

  if (total === 0) return null;

  const verdict = result ? getVerdict(result) : null;
  const actualDraw = result?.actual?.draw || '';
  const limitedHistory = result && result.pastCount > 0 && result.pastCount < lookback;

  return (
    <div className="glass-card">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
          🕰️ Time Machine
          <Tooltip text="Rewinds the system to any past draw and shows what it WOULD have recommended using only the data available before that draw — then checks it against the actual winning number. A no-look-ahead reality check on how the picks would have performed.">
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

      {isOpen && result && (
        <>
          {/* ── DRAW SELECTOR ───────────────────────────────────────────── */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center',
            marginTop: '14px', marginBottom: '12px',
            padding: '11px 14px', background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-color)', borderRadius: '9px',
          }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
              Travel to
              <Tooltip direction="down" text="Pick which past draw to evaluate. Step with ◀ Newer / Older ▶, or jump to any draw in the list. The system is rebuilt from only the draws older than this one.">
                <HelpIcon />
              </Tooltip>:
            </span>

            <button
              onClick={() => setIndex(i => Math.max(0, Math.min(i, total - 1) - 1))}
              disabled={safeIndex <= 0}
              style={{
                padding: '4px 10px', borderRadius: '6px', fontSize: '12px',
                cursor: safeIndex <= 0 ? 'not-allowed' : 'pointer', opacity: safeIndex <= 0 ? 0.4 : 1,
                border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)',
              }}
            >
              ◀ Newer
            </button>

            <select
              value={safeIndex}
              onChange={e => setIndex(parseInt(e.target.value, 10))}
              style={{
                flex: 1, minWidth: '200px', padding: '5px 8px', fontSize: '12px',
                background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)',
                color: 'var(--text-main)', borderRadius: '6px', fontFamily: 'var(--font-mono)',
              }}
            >
              {draws.map((d, i) => (
                <option key={d.date} value={i}>
                  {formatDrawLabel(d.date)} — {d.draw}
                </option>
              ))}
            </select>

            <button
              onClick={() => setIndex(i => Math.min(total - 1, Math.min(i, total - 1) + 1))}
              disabled={safeIndex >= total - 1}
              style={{
                padding: '4px 10px', borderRadius: '6px', fontSize: '12px',
                cursor: safeIndex >= total - 1 ? 'not-allowed' : 'pointer', opacity: safeIndex >= total - 1 ? 0.4 : 1,
                border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)',
              }}
            >
              Older ▶
            </button>

            <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {safeIndex === 0 ? 'most recent' : `${safeIndex} draw${safeIndex > 1 ? 's' : ''} ago`}
            </span>
          </div>

          {/* ── REPLAY SETTINGS ─────────────────────────────────────────── */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center',
            marginBottom: '16px', padding: '11px 14px',
            background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '9px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                Scan window
                <Tooltip direction="down" text="The lookback window the system uses to judge overdue status and position trends — matched to the live Best Exact Plays setting.">
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
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Exact plays</span>
              {[3, 5, 8].map(n => (
                <button
                  key={n}
                  onClick={() => setExactCount(n)}
                  style={{
                    padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                    border: `1px solid ${exactCount === n ? 'var(--primary)' : 'var(--border-color)'}`,
                    background: exactCount === n ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)',
                    color: exactCount === n ? 'var(--primary)' : 'var(--text-muted)',
                    fontWeight: exactCount === n ? '600' : 'normal',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>

            <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>
              Built from <strong style={{ color: 'var(--text-main)' }}>{result.pastCount}</strong> prior draws ·
              <strong style={{ color: 'var(--text-main)' }}> {result.activeCount}</strong> combos on the sheet
            </span>
          </div>

          {limitedHistory && (
            <div style={{ marginBottom: '14px', fontSize: '11px', color: 'var(--secondary)', background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)', borderRadius: '7px', padding: '8px 12px' }}>
              ⚠️ Only {result.pastCount} draws existed before this one (less than the {lookback}-draw window), so this replay used a shorter history than the live system normally would.
            </div>
          )}

          {/* ── VERDICT + ACTUAL RESULT ─────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '14px', marginBottom: '18px' }}>
            {/* Verdict banner */}
            <div style={{ background: verdict.bg, border: `1px solid ${verdict.bd}`, borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '28px', lineHeight: 1 }}>{verdict.icon}</span>
                <span style={{ fontSize: '20px', fontWeight: '800', color: verdict.color, letterSpacing: '0.5px' }}>{verdict.label}</span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>{verdict.detail}</p>
            </div>

            {/* Actual winning number */}
            <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Actual winning number
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '40px', fontWeight: 'bold', color: 'var(--text-main)', letterSpacing: '6px', lineHeight: 1 }}>
                {actualDraw}
              </div>
              {!result.isDoubleTriple && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  box <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>{toGuideForm(result.actualBox)}</strong>
                </div>
              )}
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>{formatDrawLabel(result.actual.date)}</div>
            </div>
          </div>

          {/* ── WHAT THE SYSTEM SUGGESTED ───────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Best Exact Plays */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px 16px' }}>
              <h4 style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                🎯 It would have suggested (straight)
              </h4>
              {result.exactPlays.length === 0 ? (
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Not enough prior data to suggest exact plays.</p>
              ) : result.exactPlays.map((p, i) => {
                const straight = p.exact === actualDraw;
                const box = !result.isDoubleTriple && p.combo === result.actualBox;
                const hit = straight || box;
                return (
                  <div key={p.exact} style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', marginBottom: '5px',
                    borderRadius: '6px',
                    background: hit ? 'rgba(16,185,129,0.1)' : 'transparent',
                    border: `1px solid ${hit ? 'rgba(16,185,129,0.35)' : 'transparent'}`,
                  }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', width: '16px', flexShrink: 0 }}>#{i + 1}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', letterSpacing: '2px' }}>{p.exact}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: 'auto' }}>box {toGuideForm(p.combo)}</span>
                    {straight && <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--primary)' }}>🎯 STRAIGHT</span>}
                    {!straight && box && <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--primary)' }}>✅ BOX</span>}
                  </div>
                );
              })}
            </div>

            {/* Top Picks (box) */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px 16px' }}>
              <h4 style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: '700', color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                🏆 Top Picks (box)
              </h4>
              {result.boxPicks.length === 0 ? (
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Not enough prior data to rank top picks.</p>
              ) : result.boxPicks.map((p, i) => {
                const hit = !result.isDoubleTriple && p.combo === result.actualBox;
                return (
                  <div key={p.combo} style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', marginBottom: '5px',
                    borderRadius: '6px',
                    background: hit ? 'rgba(16,185,129,0.1)' : 'transparent',
                    border: `1px solid ${hit ? 'rgba(16,185,129,0.35)' : 'transparent'}`,
                  }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', width: '16px', flexShrink: 0 }}>#{i + 1}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', letterSpacing: '2px' }}>{toGuideForm(p.combo)}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                      {p.lastHit === 999 ? '∞ never in window' : `${p.lastHit} draws overdue`}
                    </span>
                    {hit && <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--primary)' }}>✅ HIT</span>}
                  </div>
                );
              })}
            </div>
          </div>

          <p style={{ marginTop: '14px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
            💡 <strong style={{ color: 'var(--text-main)' }}>How to read this:</strong> The suggestions above were rebuilt using <strong>only</strong> the {result.pastCount} draws that occurred before {formatDrawLabel(result.actual.date)} — no peeking at the result. Step through several draws to get a feel for how often the top picks land. Remember a single draw is mostly luck; patterns only mean something across many.
          </p>
        </>
      )}
    </div>
  );
}
