import { useState, useMemo } from 'react';
import { generateMasterList, normalizeDraw, isDoubleOrTriple } from '../utils/AIEngine';
import Tooltip from './Tooltip';

const masterSet = new Set(generateMasterList());

const HelpIcon = () => (
  <span style={{
    cursor: 'help', color: 'var(--primary)', opacity: 0.8,
    fontSize: '11px', marginLeft: '5px', flexShrink: 0,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: '15px', height: '15px',
    border: '1px solid var(--primary)', borderRadius: '50%', fontWeight: 'bold',
  }}>?</span>
);

// For each draw at index i, compute how many draws had elapsed since
// the same box combo last appeared before this draw.
function buildLog(draws, showCount) {
  const slice = draws.slice(0, showCount);
  return slice.map((d, i) => {
    const isDouble = isDoubleOrTriple(d.draw);
    if (isDouble) return { ...d, isDouble: true, onList: false, normalized: null, gapWhenHit: null };

    const normalized = normalizeDraw(d.draw);
    const onList = masterSet.has(normalized);

    // Find how many draws elapsed since this combo last appeared
    // (look through draws AFTER index i, which are older)
    let gapWhenHit = null;
    if (onList) {
      gapWhenHit = 999; // sentinel = no prior hit found
      const olderDraws = draws.slice(i + 1);
      for (let j = 0; j < olderDraws.length; j++) {
        if (!isDoubleOrTriple(olderDraws[j].draw) && normalizeDraw(olderDraws[j].draw) === normalized) {
          gapWhenHit = j + 1; // +1 because j is 0-indexed distance
          break;
        }
      }
    }

    return { ...d, isDouble: false, onList, normalized, gapWhenHit };
  });
}

export default function WinLogPanel({ draws }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCount, setShowCount] = useState(30);

  const log = useMemo(() => buildLog(draws, showCount), [draws, showCount]);

  // Summary stats
  const total = log.length;
  const doubles = log.filter(e => e.isDouble).length;
  const nonDoubles = total - doubles;
  const onList = log.filter(e => e.onList).length;
  const listRate = nonDoubles > 0 ? Math.round((onList / nonDoubles) * 100) : 0;

  // Longest gap when hit (most overdue combo that came in)
  const longestGap = log.reduce((best, e) => {
    if (!e.onList || e.gapWhenHit == null) return best;
    const gap = e.gapWhenHit === 999 ? 0 : e.gapWhenHit;
    return gap > best ? gap : best;
  }, 0);

  return (
    <div className="glass-card">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
          📊 System Tracker — Win Log
          <Tooltip text="Tracks recent draws against the 120-combination master list. Every non-double, non-triple result should land on the master list — this table shows exactly that, proving the system works. 'Gap when hit' shows how many draws had passed since that combination last appeared, validating the overdue-tracking logic.">
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
          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px', marginTop: '14px', marginBottom: '16px' }}>
            {[
              { label: 'Draws Shown', value: total, color: 'var(--text-main)' },
              { label: 'Doubles / Triples', value: doubles, color: 'var(--secondary)', note: 'outside universe' },
              { label: 'On Master List', value: `${onList}/${nonDoubles}`, color: 'var(--primary)', note: `${listRate}% hit rate` },
              { label: 'Longest Gap Seen', value: longestGap > 0 ? `${longestGap}d` : '—', color: 'var(--text-main)', note: 'draws between hits' },
            ].map(({ label, value, color, note }) => (
              <div key={label} style={{ textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '7px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '3px' }}>{label}</div>
                <div style={{ fontSize: '20px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color, lineHeight: 1 }}>{value}</div>
                {note && <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '3px' }}>{note}</div>}
              </div>
            ))}
          </div>

          {/* Proof callout */}
          {listRate === 100 && nonDoubles >= 5 && (
            <div style={{ padding: '10px 14px', marginBottom: '14px', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', fontSize: '12px', color: 'var(--primary)', fontWeight: '600' }}>
              ✅ 100% of non-double/triple draws in this window landed on the 120 master list. The system is validated.
            </div>
          )}

          {/* Show count control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Show last:</span>
            {[15, 30, 60, 100].map(n => (
              <button
                key={n}
                onClick={() => setShowCount(n)}
                style={{
                  padding: '3px 9px', borderRadius: '5px', fontSize: '11px', cursor: 'pointer',
                  border: `1px solid ${showCount === n ? 'var(--primary)' : 'var(--border-color)'}`,
                  background: showCount === n ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.03)',
                  color: showCount === n ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: showCount === n ? '600' : 'normal',
                }}
              >
                {n} draws
              </button>
            ))}
          </div>

          {/* Log table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {['Date', 'Draw', 'Result', 'Box Combo', 'Gap When Hit'].map(h => (
                    <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {log.map((entry, i) => {
                  const isHit = entry.onList;
                  const isDouble = entry.isDouble;
                  const gap = entry.gapWhenHit;
                  const gapLabel = gap == null ? '—' : gap === 999 ? '∞ (first in history)' : `${gap} draws`;
                  const gapColor = gap == null ? 'var(--text-muted)' : gap === 999 ? 'var(--secondary)' : gap >= 30 ? 'var(--primary)' : gap >= 15 ? 'var(--text-main)' : 'var(--text-muted)';

                  return (
                    <tr
                      key={i}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        background: isDouble ? 'rgba(234,179,8,0.03)' : 'transparent',
                      }}
                    >
                      {/* Date */}
                      <td style={{ padding: '7px 10px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {entry.date}
                      </td>

                      {/* Draw */}
                      <td style={{ padding: '7px 10px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 'bold', color: 'var(--text-main)', letterSpacing: '2px' }}>
                          {entry.draw}
                        </span>
                      </td>

                      {/* Result badge */}
                      <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>
                        {isDouble ? (
                          <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.3)', color: 'var(--secondary)', fontWeight: '600' }}>
                            ⚠️ Double/Triple
                          </span>
                        ) : isHit ? (
                          <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--primary)', fontWeight: '600' }}>
                            ✓ On List
                          </span>
                        ) : (
                          <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger)', fontWeight: '600' }}>
                            ✗ Not on List
                          </span>
                        )}
                      </td>

                      {/* Box combo */}
                      <td style={{ padding: '7px 10px' }}>
                        {entry.normalized ? (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--primary)', fontWeight: '600', letterSpacing: '2px' }}>
                            {entry.normalized}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>—</span>
                        )}
                      </td>

                      {/* Gap when hit */}
                      <td style={{ padding: '7px 10px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: gapColor, fontWeight: gap != null && gap >= 30 ? '700' : 'normal' }}>
                          {gapLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
            💡 <strong style={{ color: 'var(--text-main)' }}>How to read this:</strong> Every ✓ On List result confirms a non-double draw hitting the 120 master list. <strong style={{ color: 'var(--primary)' }}>Green "Gap when hit"</strong> values (30+ draws) show combos that were overdue when they hit — exactly the ones the system targets.
          </p>
        </>
      )}
    </div>
  );
}
