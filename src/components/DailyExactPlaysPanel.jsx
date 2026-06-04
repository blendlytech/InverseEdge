import { useState, useMemo } from 'react';
import { recommendExactPlays, backtestRecommender } from '../utils/AIEngine';
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
  { label: '60 draws', value: 60 },
  { label: '120 draws', value: 120 },
  { label: '200 draws', value: 200 },
];

// Generate N unique random straight numbers (equal-odds "fun" picks)
function randomExacts(n) {
  const set = new Set();
  while (set.size < n) set.add(String(Math.floor(Math.random() * 1000)).padStart(3, '0'));
  return [...set];
}

export default function DailyExactPlaysPanel({ draws }) {
  const [lookback, setLookback] = useState(120);
  const [count, setCount] = useState(5);
  const [payout, setPayout] = useState(500);
  const [funPicks, setFunPicks] = useState([]);

  const betCost = 1;

  const rec = useMemo(
    () => (draws.length ? recommendExactPlays(draws, { lookback, count, payout, betCost }) : null),
    [draws, lookback, count, payout]
  );
  const perf = useMemo(
    () => (draws.length ? backtestRecommender(draws, { count: 30, lookback, picks: count, payout, betCost }) : null),
    [draws, lookback, count, payout]
  );

  if (!rec) {
    return (
      <div className="glass-card">
        <h2 className="glow-text-primary" style={{ margin: 0, fontSize: '20px' }}>🎯 Today's Exact Plays</h2>
        <p style={{ marginTop: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>No draw data loaded yet.</p>
      </div>
    );
  }

  const breakevenPct = (rec.breakeven * 100).toFixed(2);

  return (
    <div className="glass-card" style={{ border: '1px solid rgba(16,185,129,0.35)' }}>
      <div style={{ marginBottom: '14px' }}>
        <h2 className="glow-text-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '0 0 6px', fontSize: '22px' }}>
          🎯 Today's Exact Plays
          <Tooltip text="The strongest honest recommendation for a straight (exact-order) play. It only proposes numbers with a real edge when the Fairness Monitor detects genuine bias. When the lottery is fair (the normal case), it tells you so — because no number beats the odds.">
            <HelpIcon />
          </Tooltip>
        </h2>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
          Exact play pays the big prize (<strong style={{ color: 'var(--text-main)' }}>${payout}</strong> on $1). A pick is only worth it if its real chance beats <strong style={{ color: 'var(--text-main)' }}>{breakevenPct}%</strong> — the break-even line.
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', marginBottom: '16px', padding: '11px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '9px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Window:</span>
          {LOOKBACK_PRESETS.map(({ label, value }) => (
            <button key={value} onClick={() => setLookback(value)} style={{
              padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
              border: `1px solid ${lookback === value ? 'var(--primary)' : 'var(--border-color)'}`,
              background: lookback === value ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)',
              color: lookback === value ? 'var(--primary)' : 'var(--text-muted)', fontWeight: lookback === value ? '600' : 'normal',
            }}>{label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Picks:</span>
          {[3, 5, 8].map(n => (
            <button key={n} onClick={() => setCount(n)} style={{
              padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
              border: `1px solid ${count === n ? 'var(--primary)' : 'var(--border-color)'}`,
              background: count === n ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)',
              color: count === n ? 'var(--primary)' : 'var(--text-muted)', fontWeight: count === n ? '600' : 'normal',
            }}>{n}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Payout $</span>
          <input type="number" min="1" value={payout} onChange={e => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v > 0) setPayout(v); }}
            style={{ width: '70px', padding: '4px 7px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '4px', fontSize: '12px' }} />
        </div>
      </div>

      {/* EDGE case */}
      {rec.anyEdge ? (
        <>
          <div style={{ marginBottom: '12px', padding: '10px 14px', borderRadius: '9px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.4)', fontSize: '12px', color: 'var(--primary)', fontWeight: '600' }}>
            ✅ Edge detected — the Fairness Monitor found real bias. These picks reflect it.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
            {rec.picks.map((p, i) => (
              <div key={p.exact} style={{
                background: p.edge ? 'rgba(16,185,129,0.08)' : 'rgba(0,0,0,0.25)',
                border: `1px solid ${p.edge ? 'rgba(16,185,129,0.4)' : 'var(--border-color)'}`,
                borderRadius: '10px', padding: '12px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>#{i + 1}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '30px', fontWeight: 'bold', color: 'var(--text-main)', letterSpacing: '4px' }}>{p.exact}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px', fontFamily: 'var(--font-mono)' }}>
                  chance {(p.p * 100).toFixed(3)}%
                </div>
                <div style={{ fontSize: '11px', fontWeight: '700', marginTop: '2px', color: p.ev >= 0 ? 'var(--primary)' : 'var(--danger)' }}>
                  EV {p.ev >= 0 ? '+' : '−'}${Math.abs(p.ev).toFixed(2)}
                </div>
                <div style={{ fontSize: '9px', fontWeight: '700', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.4px', color: p.edge ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {p.edge ? '▸ positive edge ◂' : 'below break-even'}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* NO-EDGE case — the honest default */
        <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.3)' }}>
          <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--secondary)', marginBottom: '6px' }}>
            No statistical edge today
          </div>
          <p style={{ margin: '0 0 10px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
            The draws are behaving fairly, so every exact number has the same ~0.10% chance and the same expected value of <strong style={{ color: 'var(--danger)' }}>−$0.50</strong> per $1 at a ${payout} payout. The honest recommendation is to <strong style={{ color: 'var(--text-main)' }}>sit this one out</strong> — no number is better than any other.
          </p>
          <p style={{ margin: '0 0 10px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
            If you're playing for fun anyway, pick numbers that mean something to you (a birthday, an address) — they're exactly as good as any "system" pick. Or get some random ones:
          </p>
          <button onClick={() => setFunPicks(randomExacts(count))} className="btn btn-secondary btn-small" style={{ fontSize: '12px', padding: '6px 12px' }}>
            🎲 Give me {count} random fun picks
          </button>
          {funPicks.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
              {funPicks.map(p => (
                <span key={p} style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: '700', color: 'var(--text-main)', letterSpacing: '3px', padding: '6px 12px', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>{p}</span>
              ))}
              <span style={{ alignSelf: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>each ~0.10% · EV −$0.50</span>
            </div>
          )}
        </div>
      )}

      {/* Walk-forward honesty ledger */}
      {perf && perf.evaluated > 0 && (
        <div style={{ marginTop: '16px', padding: '12px 14px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '9px' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
            📒 How this system has actually done
            <Tooltip text="A no-peeking replay over the most recent draws: on each day it rebuilt itself from older draws only. Because it abstains when there's no edge, it risks nothing on a fair lottery — unlike blindly playing every day.">
              <HelpIcon />
            </Tooltip>
          </h4>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.7' }}>
            Over the last <strong style={{ color: 'var(--text-main)' }}>{perf.evaluated}</strong> draws, the system flagged an edge on <strong style={{ color: perf.edgeDays > 0 ? 'var(--primary)' : 'var(--text-main)' }}>{perf.edgeDays}</strong> day{perf.edgeDays === 1 ? '' : 's'} and <strong style={{ color: 'var(--text-main)' }}>recommended playing on {perf.edgeDays}</strong> — risking <strong style={{ color: 'var(--text-main)' }}>${perf.spend}</strong>{perf.edgeDays > 0 ? <>, winning {perf.straightHits} (net <strong style={{ color: perf.net >= 0 ? 'var(--primary)' : 'var(--danger)' }}>${perf.net}</strong>)</> : null}.{' '}
            For contrast, blindly playing {perf.picks} straights every day would have cost <strong style={{ color: 'var(--danger)' }}>${perf.blindSpend}</strong> for an expected <strong style={{ color: 'var(--danger)' }}>${perf.blindExpectedNet.toFixed(0)}</strong> result.
          </p>
        </div>
      )}

      <p style={{ marginTop: '14px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
        This is the most you can honestly ask of a Pick-3 tool: it plays only when the math is in your favor, and it tells you the truth — backed by the Fairness Monitor — when it isn't. Never wager more than you'd spend on entertainment.
      </p>
    </div>
  );
}
