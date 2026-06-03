import { useState, useMemo } from 'react';
import { scanDoubleTriplePatterns, scanSumStructurePatterns, scanRepeatsAndRuns } from '../utils/AIEngine';
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

// "2026-05-30 Midday" → "2026-05-30"
function datePart(dateStr) {
  const i = dateStr.indexOf(' ');
  return i > -1 ? dateStr.slice(0, i) : dateStr;
}

// "2026-05-30" → "May 30, 2026"
function prettyDate(dateStr) {
  const [y, mo, dy] = dateStr.split('-');
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${MONTHS[parseInt(mo, 10) - 1]} ${parseInt(dy, 10)}, ${y}`;
}

const DRAW_PRESETS = [
  { label: '50 draws', value: 50 },
  { label: '100 draws', value: 100 },
  { label: '200 draws', value: 200 },
  { label: '500 draws', value: 500 },
];

const DAY_PRESETS = [
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
  { label: '180 days', value: 180 },
  { label: '365 days', value: 365 },
];

// Pick-3 straight random baselines
const BASELINE = { single: 72, double: 27, triple: 1 };

const fmt = (v, digits = 1) => (v == null ? '—' : v.toFixed(digits));

// Reusable event tracker card (doubles / triples)
function TrackerCard({ title, icon, stats, overdue, accent, baseline, total }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)',
      borderRadius: '10px', padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
          {icon} {title}
        </h4>
        {stats.count > 0 && (
          <span style={{
            fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase', letterSpacing: '0.4px',
            color: overdue ? 'var(--primary)' : 'var(--text-muted)',
            background: overdue ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${overdue ? 'rgba(16,185,129,0.3)' : 'var(--border-color)'}`,
          }}>
            {overdue ? '⏰ Overdue' : '✓ On pace'}
          </span>
        )}
      </div>

      {stats.count === 0 ? (
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
          None appeared in this window ({total} draws). That's itself a drought of at least {total} draws.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 14px' }}>
          {[
            { lbl: 'Appeared', val: `${stats.count}×`, sub: `${fmt(stats.rate * 100)}% of draws · random ≈ ${baseline}%` },
            { lbl: 'Current gap', val: `${stats.currentGap}`, sub: 'draws since the last one', highlight: overdue },
            { lbl: 'Average gap', val: fmt(stats.avgGap), sub: 'typical draws between' },
            { lbl: 'Longest drought', val: `${stats.maxDrought}`, sub: 'max draws without one' },
          ].map(({ lbl, val, sub, highlight }) => (
            <div key={lbl}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' }}>{lbl}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: '700', color: highlight ? 'var(--primary)' : accent, lineHeight: 1.1 }}>{val}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>{sub}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Each digit is independently 50/50 high/low (and even/odd), so the count of
// qualifying digits follows Binomial(3, 0.5): 12.5 / 37.5 / 37.5 / 12.5 %.
const SPLIT_BASELINE = [12.5, 37.5, 37.5, 12.5];

// Horizontal split bars (high/low or even/odd), actual % vs random baseline.
function SplitBars({ title, icon, tooltip, categories }) {
  const total = categories.reduce((s, c) => s + c.count, 0);
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px 16px' }}>
      <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
        {icon} {title}
        <Tooltip text={tooltip}><HelpIcon /></Tooltip>
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
        {categories.map(({ label, count, baseline, color, note }) => {
          const actual = total ? (count / total) * 100 : 0;
          return (
            <div key={label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '3px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: '600' }}>
                  {label}
                  {note && <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'normal', marginLeft: '6px' }}>({note})</span>}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color, fontWeight: '700' }}>
                  {count}× · {actual.toFixed(1)}%
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'normal', marginLeft: '6px' }}>vs {baseline}%</span>
                </span>
              </div>
              <div style={{ position: 'relative', height: '9px', background: 'rgba(255,255,255,0.06)', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ width: `${actual}%`, height: '100%', background: color, borderRadius: '5px', transition: 'width 0.4s' }} />
                <div style={{ position: 'absolute', top: '-2px', bottom: '-2px', left: `${baseline}%`, width: '2px', background: 'var(--text-main)', opacity: 0.5 }} title={`Random baseline ${baseline}%`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PatternScanPanel({ draws }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('draws');   // 'draws' | 'days'
  const [drawCount, setDrawCount] = useState(200);
  const [dayCount, setDayCount] = useState(90);

  const totalDraws = draws.length;

  // Window the draws by the active mode, then hand the strings to the engine.
  const { windowStrings, rangeFrom, rangeTo } = useMemo(() => {
    if (totalDraws === 0) return { windowStrings: [], rangeFrom: null, rangeTo: null };

    let windowed;
    if (mode === 'days') {
      // Anchor "now" to the newest draw so the window is never empty.
      const anchor = new Date(datePart(draws[0].date)).getTime();
      const cutoff = anchor - (dayCount - 1) * 86400000;
      windowed = draws.filter(d => new Date(datePart(d.date)).getTime() >= cutoff);
    } else {
      windowed = draws.slice(0, Math.min(drawCount, totalDraws));
    }

    return {
      windowStrings: windowed.map(d => d.draw),
      rangeFrom: windowed.length ? datePart(windowed[windowed.length - 1].date) : null,
      rangeTo: windowed.length ? datePart(windowed[0].date) : null,
    };
  }, [draws, mode, drawCount, dayCount, totalDraws]);

  const result = useMemo(() => scanDoubleTriplePatterns(windowStrings), [windowStrings]);
  const sumResult = useMemo(() => scanSumStructurePatterns(windowStrings), [windowStrings]);
  const repeatsResult = useMemo(() => scanRepeatsAndRuns(windowStrings), [windowStrings]);

  const { total, doubleCount, tripleCount, singleCount, doubleStats, tripleStats, doubleDigitFreq, topPairs } = result;
  const { sumCounts, avgSum, mostCommonSum, mostCommonSumCount, highCounts, evenCounts } = sumResult;
  const {
    transitions, carryoverCounts, avgCarryover, currentCarryStreak, longestCarryStreak,
    backToBackBox, backToBackExact, quickWindow, quickReturns, quickExamples,
  } = repeatsResult;

  const pct = n => (total ? (n / total) * 100 : 0);

  // Distribution rows (actual vs random baseline)
  const distribution = [
    { key: 'single', label: 'No repeat (singles)', count: singleCount, color: 'var(--text-muted)', baseline: BASELINE.single, note: 'e.g. 312, 957' },
    { key: 'double', label: 'Doubles', count: doubleCount, color: 'var(--secondary)', baseline: BASELINE.double, note: 'e.g. 112, 522' },
    { key: 'triple', label: 'Triples', count: tripleCount, color: 'var(--primary)', baseline: BASELINE.triple, note: 'e.g. 333, 777' },
  ];

  const maxDigitFreq = Math.max(1, ...Object.values(doubleDigitFreq));

  // Overdue when the current gap exceeds the average spacing between events.
  const dblOverdue = doubleStats.avgGap != null && doubleStats.currentGap > doubleStats.avgGap;
  const trpOverdue = tripleStats.avgGap != null && tripleStats.currentGap > tripleStats.avgGap;

  const maxSumCount = Math.max(1, ...sumCounts);

  return (
    <div className="glass-card">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
          🎲 Winning-Number Pattern Scanner
          <Tooltip text="Scans your winning-number history for recurring patterns over a period you choose: how often doubles (112) and triples (333) show up, the digit-sum distribution, and the high/low and even/odd makeup of draws. These are descriptive views of past draws, separate from the core 120-combo strategy.">
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
          {/* ── TIME-PERIOD CONTROL ─────────────────────────────────────── */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center',
            marginTop: '14px', marginBottom: '16px',
            padding: '11px 14px', background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-color)', borderRadius: '9px',
          }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
              Period
              <Tooltip direction="down" text="Choose how to set the analysis window. 'By draws' counts a fixed number of the most recent results. 'By days' includes every draw within the chosen calendar span (measured back from your most recent draw).">
                <HelpIcon />
              </Tooltip>:
            </span>

            {/* Mode toggle */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {[['draws', 'By draws'], ['days', 'By days']].map(([m, label]) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{
                    padding: '4px 11px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                    border: `1px solid ${mode === m ? 'var(--primary)' : 'var(--border-color)'}`,
                    background: mode === m ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)',
                    color: mode === m ? 'var(--primary)' : 'var(--text-muted)',
                    fontWeight: mode === m ? '600' : 'normal',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <span style={{ width: '1px', height: '20px', background: 'var(--border-color)' }} />

            {/* Presets + number input for the active mode */}
            {(mode === 'draws' ? DRAW_PRESETS : DAY_PRESETS).map(({ label, value }) => {
              const active = mode === 'draws' ? drawCount === value : dayCount === value;
              const setter = mode === 'draws' ? setDrawCount : setDayCount;
              return (
                <button
                  key={value}
                  onClick={() => setter(value)}
                  style={{
                    padding: '4px 11px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                    border: `1px solid ${active ? 'var(--primary)' : 'var(--border-color)'}`,
                    background: active ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)',
                    color: active ? 'var(--primary)' : 'var(--text-muted)',
                    fontWeight: active ? '600' : 'normal',
                  }}
                >
                  {label}
                </button>
              );
            })}

            {mode === 'draws' && (
              <button
                onClick={() => setDrawCount(totalDraws)}
                style={{
                  padding: '4px 11px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                  border: `1px solid ${drawCount >= totalDraws ? 'var(--secondary)' : 'var(--border-color)'}`,
                  background: drawCount >= totalDraws ? 'rgba(234,179,8,0.12)' : 'rgba(255,255,255,0.03)',
                  color: drawCount >= totalDraws ? 'var(--secondary)' : 'var(--text-muted)',
                  fontWeight: drawCount >= totalDraws ? '600' : 'normal',
                }}
              >
                All data ({totalDraws})
              </button>
            )}

            <input
              type="number" min="1"
              value={mode === 'draws' ? drawCount : dayCount}
              onChange={e => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v > 0) (mode === 'draws' ? setDrawCount : setDayCount)(v);
              }}
              style={{ width: '70px', padding: '4px 7px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '4px', fontSize: '12px' }}
            />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{mode === 'draws' ? 'draws' : 'days'}</span>

            <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>
              Scanning <strong style={{ color: 'var(--text-main)' }}>{total}</strong> draws
              {rangeFrom && rangeTo && (
                <> · <strong style={{ color: 'var(--text-main)' }}>{prettyDate(rangeFrom)}</strong> → <strong style={{ color: 'var(--text-main)' }}>{prettyDate(rangeTo)}</strong></>
              )}
            </span>
          </div>

          {total === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No draws fall inside this window. Widen the period.</p>
          ) : (
            <>
              {/* ── STRUCTURE DISTRIBUTION (actual vs random) ───────────── */}
              <div style={{ marginBottom: '20px', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
                  🔬 Structure Distribution
                  <Tooltip text="How this window splits across the three draw structures, compared to what a perfectly random Pick-3 would produce over the long run (singles 72%, doubles 27%, triples 1%). A big gap from the baseline is usually small-sample noise rather than a real edge — it tends to fade as you widen the window.">
                    <HelpIcon />
                  </Tooltip>
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {distribution.map(({ key, label, count, color, baseline, note }) => {
                    const actual = pct(count);
                    return (
                      <div key={key}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: '600' }}>
                            {label}
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'normal', marginLeft: '6px' }}>({note})</span>
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color, fontWeight: '700' }}>
                            {count}× · {actual.toFixed(1)}%
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'normal', marginLeft: '6px' }}>vs {baseline}%</span>
                          </span>
                        </div>
                        <div style={{ position: 'relative', height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '5px', overflow: 'hidden' }}>
                          <div style={{ width: `${actual}%`, height: '100%', background: color, borderRadius: '5px', transition: 'width 0.4s' }} />
                          {/* Baseline marker */}
                          <div style={{ position: 'absolute', top: '-2px', bottom: '-2px', left: `${baseline}%`, width: '2px', background: 'var(--text-main)', opacity: 0.5 }} title={`Random baseline ${baseline}%`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: '10px', fontSize: '10px', color: 'var(--text-muted)' }}>
                  The faint vertical line on each bar marks the random-chance baseline.
                </div>
              </div>

              {/* ── TRACKER CARDS ───────────────────────────────────────── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <TrackerCard title="Doubles Tracker" icon="🔁" stats={doubleStats} overdue={dblOverdue} accent="var(--secondary)" baseline={BASELINE.double} total={total} />
                <TrackerCard title="Triples Tracker" icon="💎" stats={tripleStats} overdue={trpOverdue} accent="var(--primary)" baseline={BASELINE.triple} total={total} />
              </div>

              {/* ── HOT DOUBLED DIGIT ───────────────────────────────────── */}
              <div style={{ marginBottom: '16px', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
                  🔥 Which digit doubles up most
                  <Tooltip text="When a double or triple appears, which digit is doing the repeating? Taller bars are the digits that most often show up as a pair (e.g. the '5' in 522). Counts triples toward their digit too.">
                    <HelpIcon />
                  </Tooltip>
                </h4>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '90px' }}>
                  {Object.entries(doubleDigitFreq).map(([digit, freq]) => (
                    <div key={digit} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: freq > 0 ? 'var(--text-main)' : 'var(--text-muted)' }}>{freq}</span>
                      <div style={{
                        width: '100%', height: `${(freq / maxDigitFreq) * 64}px`, minHeight: freq > 0 ? '3px' : '0',
                        background: freq === maxDigitFreq && freq > 0 ? 'var(--primary)' : 'rgba(234,179,8,0.55)',
                        borderRadius: '3px 3px 0 0', transition: 'height 0.4s',
                      }} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>{digit}</span>
                    </div>
                  ))}
                </div>
                {topPairs.length > 0 && (
                  <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    Most frequent repeats:{' '}
                    {topPairs.slice(0, 5).map(([pair, c], i) => (
                      <span key={pair}>
                        <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{pair}</strong> ({c}×){i < Math.min(topPairs.length, 5) - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* ── DIGIT-SUM ANALYSIS ──────────────────────────────────── */}
              <div style={{ marginBottom: '16px', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
                    ➕ Digit-Sum Distribution
                    <Tooltip text="Adds the three digits of each draw (0–27) and shows how often each total appears. Sums cluster in a bell curve around 13–14 because there are far more ways to make a middle total than an extreme one. The tallest bar is the most common sum in this window.">
                      <HelpIcon />
                    </Tooltip>
                  </h4>
                  <div style={{ display: 'flex', gap: '14px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>Average sum <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{avgSum.toFixed(1)}</strong></span>
                    <span>Most common <strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{mostCommonSum}</strong> ({mostCommonSumCount}×)</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '90px' }}>
                  {sumCounts.map((c, s) => (
                    <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }} title={`Sum ${s}: ${c}× (${total ? ((c / total) * 100).toFixed(1) : 0}%)`}>
                      <div style={{
                        width: '100%', height: `${(c / maxSumCount) * 100}%`, minHeight: c > 0 ? '2px' : '0',
                        background: c === mostCommonSumCount && c > 0 ? 'var(--primary)' : 'rgba(234,179,8,0.45)',
                        borderRadius: '2px 2px 0 0', transition: 'height 0.4s',
                      }} />
                    </div>
                  ))}
                </div>
                {/* Sum axis labels at intervals */}
                <div style={{ display: 'flex', gap: '2px', marginTop: '3px' }}>
                  {sumCounts.map((_, s) => (
                    <div key={s} style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '8px', color: 'var(--text-muted)' }}>
                      {s % 3 === 0 ? s : ''}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── HIGH/LOW & EVEN/ODD SPLITS ──────────────────────────── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <SplitBars
                  title="High / Low Split"
                  icon="⚖️"
                  tooltip="Splits each draw by how many of its digits are high (5–9) vs low (0–4). The faint line marks the random baseline — over the long run an even mix (1 or 2 high) is far more common than all-high or all-low draws."
                  categories={[
                    { label: 'All low', note: '0–4, e.g. 312', count: highCounts[0], baseline: SPLIT_BASELINE[0], color: '#94a3b8' },
                    { label: '1 high · 2 low', count: highCounts[1], baseline: SPLIT_BASELINE[1], color: 'var(--secondary)' },
                    { label: '2 high · 1 low', count: highCounts[2], baseline: SPLIT_BASELINE[2], color: 'var(--secondary)' },
                    { label: 'All high', note: '5–9, e.g. 978', count: highCounts[3], baseline: SPLIT_BASELINE[3], color: 'var(--primary)' },
                  ]}
                />
                <SplitBars
                  title="Even / Odd Split"
                  icon="🔢"
                  tooltip="Splits each draw by how many digits are even (0,2,4,6,8) vs odd (1,3,5,7,9). The faint line marks the random baseline — like high/low, a mixed result is the norm and all-even or all-odd draws are the rarer extremes."
                  categories={[
                    { label: 'All odd', note: 'e.g. 135', count: evenCounts[0], baseline: SPLIT_BASELINE[0], color: '#94a3b8' },
                    { label: '1 even · 2 odd', count: evenCounts[1], baseline: SPLIT_BASELINE[1], color: 'var(--secondary)' },
                    { label: '2 even · 1 odd', count: evenCounts[2], baseline: SPLIT_BASELINE[2], color: 'var(--secondary)' },
                    { label: 'All even', note: 'e.g. 246', count: evenCounts[3], baseline: SPLIT_BASELINE[3], color: 'var(--primary)' },
                  ]}
                />
              </div>

              {/* ── REPEATS & RUNS ──────────────────────────────────────── */}
              <div style={{ marginBottom: '16px', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
                  🔗 Repeats &amp; Runs
                  <Tooltip text="Looks at how draws relate to the ones just before them: how many digits 'carry over' from the previous draw, whether the same number repeats back-to-back, and how often a box combo comes back quickly. Carryover (return digits) is a pattern many players watch.">
                    <HelpIcon />
                  </Tooltip>
                </h4>

                {/* Stat tiles */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '14px' }}>
                  {[
                    { lbl: 'Avg carryover', val: avgCarryover.toFixed(2), sub: 'shared digits w/ prev draw' },
                    { lbl: 'Carryover streak', val: `${currentCarryStreak}`, sub: `now · longest ${longestCarryStreak}`, highlight: currentCarryStreak > 0 && currentCarryStreak >= longestCarryStreak },
                    { lbl: 'Box back-to-back', val: `${backToBackBox}`, sub: 'same box twice in a row' },
                    { lbl: 'Exact back-to-back', val: `${backToBackExact}`, sub: 'identical number twice' },
                  ].map(({ lbl, val, sub, highlight }) => (
                    <div key={lbl} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '3px' }}>{lbl}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: '700', color: highlight ? 'var(--primary)' : 'var(--text-main)', lineHeight: 1.1 }}>{val}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{sub}</div>
                    </div>
                  ))}
                </div>

                {/* Carryover distribution */}
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '7px' }}>
                  Digit carryover from the previous draw <span style={{ color: 'var(--text-muted)' }}>({transitions} transitions)</span>:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {['No carryover', '1 digit carried over', '2 digits carried over', '3 digits carried over'].map((label, n) => {
                    const count = carryoverCounts[n];
                    const actual = transitions ? (count / transitions) * 100 : 0;
                    const color = n === 0 ? '#94a3b8' : n === 3 ? 'var(--primary)' : 'var(--secondary)';
                    return (
                      <div key={label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '3px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: '600' }}>{label}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color, fontWeight: '700' }}>{count}× · {actual.toFixed(1)}%</span>
                        </div>
                        <div style={{ height: '9px', background: 'rgba(255,255,255,0.06)', borderRadius: '5px', overflow: 'hidden' }}>
                          <div style={{ width: `${actual}%`, height: '100%', background: color, borderRadius: '5px', transition: 'width 0.4s' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Quick returns */}
                <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  <strong style={{ color: 'var(--text-main)' }}>{quickReturns}</strong> draw{quickReturns !== 1 ? 's' : ''} repeated a box combo that had already hit within the previous <strong style={{ color: 'var(--text-main)' }}>{quickWindow}</strong> draws (a "quick return").
                  {quickExamples.length > 0 && (
                    <> Recent:{' '}
                      {quickExamples.map((e, i) => (
                        <span key={i}>
                          <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>{e.draw}</strong> (+{e.gap}){i < quickExamples.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* ── HONEST FOOTNOTE ─────────────────────────────────────── */}
              <p style={{ marginTop: '14px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                ⚠️ <strong style={{ color: 'var(--text-main)' }}>Read this as history, not a prediction.</strong> A legitimate Pick-3 draw is independent and random — a long drought does <em>not</em> make a double "due" on the next draw. This panel describes what the numbers have <em>done</em> so Lawrence can decide when a pattern is worth a side bet; it can't tell you what they'll do next.
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}
