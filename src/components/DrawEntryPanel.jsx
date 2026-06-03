import { useState, useRef, useEffect } from 'react';
import {
  generateMasterList,
  normalizeDraw,
  isDoubleOrTriple,
  applyHistoryFilter,
  scoreComboGaps,
  toGuideForm,
} from '../utils/AIEngine';
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

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// Returns top N combo picks based on current draws + settings
function getTopPicks(draws, historyFilterDays, n = 5) {
  const drawStrings = draws.map(d => d.draw);
  const masterList = generateMasterList();
  const active = applyHistoryFilter(masterList, drawStrings, historyFilterDays);
  const scored = scoreComboGaps(active, drawStrings, 60);
  return scored.slice(0, n).map((s, i) => ({ ...s, rank: i + 1 }));
}

export default function DrawEntryPanel({ draws, onAddDraw, historyFilterDays }) {
  const [date, setDate] = useState(todayStr());
  const [drawType, setDrawType] = useState('Midday');
  const [drawNumber, setDrawNumber] = useState('');
  const [error, setError] = useState('');
  const [lastResult, setLastResult] = useState(null);
  const [isOpen, setIsOpen] = useState(true);
  const inputRef = useRef(null);

  // Auto-focus the draw input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  // Show last 5 draws as a mini recap
  const recentDraws = draws.slice(0, 5);

  const validate = () => {
    if (!/^\d{3}$/.test(drawNumber)) return 'Enter exactly 3 digits (e.g. 013 or 759).';
    const key = `${date} ${drawType}`;
    if (draws.some(d => d.date === key)) {
      return `A ${drawType} draw for ${date} is already recorded. Check Draw History below if you need to remove it first.`;
    }
    return null;
  };

  const handleSubmit = e => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError('');

    const isDouble = isDoubleOrTriple(drawNumber);
    const normalized = !isDouble ? normalizeDraw(drawNumber) : null;
    const onMasterList = !!normalized && masterSet.has(normalized);

    // Check top picks BEFORE adding so we see if this draw was a predicted pick
    const topPicks = onMasterList ? getTopPicks(draws, historyFilterDays) : [];
    const matchedPick = topPicks.find(p => p.combo === normalized);

    onAddDraw({ date: `${date} ${drawType}`, draw: drawNumber });

    setLastResult({ draw: drawNumber, date, drawType, isDouble, onMasterList, normalized, matchedPick });
    setDrawNumber('');
    // Keep date & drawType so user can quickly enter the next draw in sequence
    if (inputRef.current) inputRef.current.focus();
  };

  const handleDrawInput = e => {
    // Only digits, max 3 chars; auto-submit at 3 digits for speed
    const val = e.target.value.replace(/\D/g, '').slice(0, 3);
    setDrawNumber(val);
    setError('');
  };

  return (
    <div className="glass-card">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
          ✏️ Enter Draw Result
          <Tooltip text="Add today's (or any past) Pick-3 draw result here. The analysis on the 120 master list updates immediately after you submit. Enter Midday and Evening separately.">
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
          {/* Entry form */}
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-end', marginTop: '14px' }}
          >
            {/* Date */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Date</label>
              <input
                type="date"
                value={date}
                onChange={e => { setDate(e.target.value); setError(''); }}
                style={{
                  padding: '8px 10px', background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-color)', color: 'var(--text-main)',
                  borderRadius: '6px', fontSize: '13px', colorScheme: 'dark',
                }}
              />
            </div>

            {/* Draw type toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Draw Type</label>
              <div style={{ display: 'flex', gap: '0' }}>
                {['Midday', 'Evening'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => { setDrawType(type); setError(''); }}
                    style={{
                      padding: '8px 14px', fontSize: '13px', cursor: 'pointer',
                      border: `1px solid ${drawType === type ? 'var(--primary)' : 'var(--border-color)'}`,
                      background: drawType === type ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)',
                      color: drawType === type ? 'var(--primary)' : 'var(--text-muted)',
                      fontWeight: drawType === type ? '600' : 'normal',
                      borderRadius: type === 'Midday' ? '6px 0 0 6px' : '0 6px 6px 0',
                      marginLeft: type === 'Evening' ? '-1px' : 0,
                    }}
                  >
                    {type === 'Midday' ? '☀️ Midday' : '🌙 Evening'}
                  </button>
                ))}
              </div>
            </div>

            {/* Draw number */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center' }}>
                Draw Number
                <Tooltip direction="down" text="Type all 3 digits of the winning draw result — exactly as drawn (e.g. 047, 589, 312). Leading zeros count (047 ≠ 47).">
                  <HelpIcon />
                </Tooltip>
              </label>
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                placeholder="e.g. 013"
                value={drawNumber}
                onChange={handleDrawInput}
                maxLength={3}
                style={{
                  width: '90px', padding: '8px 10px', textAlign: 'center',
                  background: 'rgba(0,0,0,0.3)',
                  border: `1px solid ${error ? 'var(--danger)' : drawNumber.length === 3 ? 'var(--primary)' : 'var(--border-color)'}`,
                  color: 'var(--text-main)', borderRadius: '6px',
                  fontSize: '20px', fontFamily: 'var(--font-mono)', fontWeight: 'bold',
                  letterSpacing: '4px',
                }}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                padding: '8px 20px', fontSize: '13px', fontWeight: '600',
                opacity: drawNumber.length !== 3 ? 0.5 : 1,
              }}
            >
              Add Draw ✓
            </button>
          </form>

          {/* Validation error */}
          {error && (
            <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', fontSize: '12px', color: 'var(--danger)' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Result card — shown after submission */}
          {lastResult && (
            <div style={{
              marginTop: '14px', padding: '14px 16px', borderRadius: '10px',
              background: lastResult.matchedPick
                ? 'rgba(16,185,129,0.1)'
                : lastResult.onMasterList
                  ? 'rgba(255,255,255,0.03)'
                  : 'rgba(234,179,8,0.06)',
              border: lastResult.matchedPick
                ? '1px solid rgba(16,185,129,0.5)'
                : lastResult.onMasterList
                  ? '1px solid var(--border-color)'
                  : '1px solid rgba(234,179,8,0.3)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

                {/* The draw */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    {lastResult.drawType} · {lastResult.date}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '32px', fontWeight: 'bold', color: 'var(--text-main)', letterSpacing: '5px', lineHeight: 1 }}>
                    {lastResult.draw}
                  </div>
                </div>

                {/* Divider */}
                <div style={{ width: '1px', height: '48px', background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />

                {/* Result */}
                <div style={{ flex: 1, minWidth: '160px' }}>
                  {lastResult.isDouble ? (
                    <>
                      <div style={{ fontSize: '14px', color: 'var(--secondary)', fontWeight: '700', marginBottom: '2px' }}>
                        ⚠️ Double / Triple
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                        Not on the 120 master list — doubles and triples are outside the system universe. Your plays were safe.
                      </div>
                    </>
                  ) : lastResult.matchedPick ? (
                    <>
                      <div style={{ fontSize: '15px', color: 'var(--primary)', fontWeight: '700', marginBottom: '3px' }}>
                        🎉 Top Pick #{lastResult.matchedPick.rank} Hit!
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                        <strong style={{ color: 'var(--text-main)' }}>{toGuideForm(lastResult.normalized)}</strong> was your <strong>#{lastResult.matchedPick.rank} most overdue pick</strong>. If you played it, you collected on the box — and on the straight if your exact ordering matched.
                      </div>
                    </>
                  ) : lastResult.onMasterList ? (
                    <>
                      <div style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: '600', marginBottom: '2px' }}>
                        ✓ On the 120 Master List
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                        Box combo: <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>{toGuideForm(lastResult.normalized)}</strong> — this combination is in the system. It was not a current top pick but is tracked in the master list.
                      </div>
                    </>
                  ) : null}
                </div>

                {/* Analysis update nudge */}
                <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '600', textAlign: 'center', flexShrink: 0 }}>
                  ↓ Analysis<br />updated
                </div>
              </div>
            </div>
          )}

          {/* Recent draws mini-recap */}
          {recentDraws.length > 0 && (
            <div style={{ marginTop: '14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Last {recentDraws.length} Draws
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {recentDraws.map((d, i) => {
                  const isDouble = isDoubleOrTriple(d.draw);
                  const normalized = !isDouble ? normalizeDraw(d.draw) : null;
                  const onList = !!normalized && masterSet.has(normalized);

                  // Parse "2026-06-02 Midday" → dateStr + drawTypeStr
                  const spaceIdx = d.date.indexOf(' ');
                  const dateStr     = spaceIdx > -1 ? d.date.slice(0, spaceIdx) : d.date;
                  const drawTypeStr = spaceIdx > -1 ? d.date.slice(spaceIdx + 1) : '';

                  // Format "2026-06-02" → "Jun 2" without timezone shifting
                  const [, mo, dy] = dateStr.split('-');
                  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                  const formattedDate = `${MONTHS[parseInt(mo, 10) - 1]} ${parseInt(dy, 10)}`;

                  const typeIcon  = drawTypeStr === 'Midday' ? '☀️' : drawTypeStr === 'Evening' ? '🌙' : '';
                  const typeColor = drawTypeStr === 'Midday' ? '#fbbf24' : drawTypeStr === 'Evening' ? '#818cf8' : 'var(--text-muted)';

                  return (
                    <div
                      key={i}
                      style={{
                        padding: '7px 12px', borderRadius: '6px', textAlign: 'center',
                        background: isDouble ? 'rgba(234,179,8,0.08)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isDouble ? 'rgba(234,179,8,0.25)' : 'rgba(255,255,255,0.07)'}`,
                        minWidth: '72px',
                      }}
                    >
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 'bold', color: 'var(--text-main)', letterSpacing: '3px' }}>
                        {d.draw}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '500' }}>
                        {formattedDate}
                      </div>
                      {drawTypeStr && (
                        <div style={{ fontSize: '10px', color: typeColor, marginTop: '1px', fontWeight: '600' }}>
                          {typeIcon} {drawTypeStr}
                        </div>
                      )}
                      <div style={{ fontSize: '9px', color: isDouble ? 'var(--secondary)' : 'var(--text-muted)', marginTop: '3px', fontFamily: 'var(--font-mono)', letterSpacing: '1px' }}>
                        {isDouble ? 'dbl/trpl' : onList ? toGuideForm(normalized) : '?'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
