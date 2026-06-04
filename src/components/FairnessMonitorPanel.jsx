import { useMemo } from 'react';
import { runFairnessTests } from '../utils/AIEngine';
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

const fmtP = p => (p < 0.001 ? '<0.001' : p.toFixed(3));

export default function FairnessMonitorPanel({ draws }) {
  const result = useMemo(() => runFairnessTests(draws), [draws]);

  if (result.insufficient) {
    return (
      <div className="glass-card">
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>🛡️ Fairness Monitor</h3>
        <p style={{ marginTop: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>
          Need at least 20 draws to test for bias. Currently {result.n}.
        </p>
      </div>
    );
  }

  const fair = !result.anyAnomaly;

  return (
    <div className="glass-card" style={{ border: `1px solid ${fair ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.4)'}` }}>
      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
        🛡️ Fairness Monitor
        <Tooltip text="Continuously tests the real draws for any exploitable bias (digit, position, structure, memory, time-of-day). It corrects for the fact that many tests are run at once, so random noise can't fake a signal. If this lottery ever stops being fair, a real edge shows up here first.">
          <HelpIcon />
        </Tooltip>
      </h3>

      {/* Verdict */}
      <div style={{
        marginTop: '14px', marginBottom: '16px', padding: '16px',
        borderRadius: '12px', textAlign: 'center',
        background: fair ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
        border: `1px solid ${fair ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
      }}>
        <div style={{ fontSize: '26px', fontWeight: '800', color: fair ? 'var(--primary)' : 'var(--danger)', letterSpacing: '0.5px' }}>
          {fair ? '✅ FAIR / RANDOM' : '⚠️ ANOMALY DETECTED'}
        </div>
        <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
          {fair
            ? `No exploitable bias across ${result.m} tests on ${result.n} real draws. The draws behave like a fair, random machine — no edge to play. (Smallest p-value ${fmtP(result.minP)}; nothing survives multiple-test correction.)`
            : `${result.anomalies.length} of ${result.m} tests flagged a statistically significant bias after correction. This may be a real, exploitable edge — see the Daily Exact Plays panel, which will now tilt toward it.`}
        </p>
      </div>

      {/* Test table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '360px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ textAlign: 'left', padding: '7px 8px', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Test</th>
              <th style={{ textAlign: 'right', padding: '7px 8px', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Statistic</th>
              <th style={{ textAlign: 'right', padding: '7px 8px', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>p-value</th>
              <th style={{ textAlign: 'right', padding: '7px 8px', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Result</th>
            </tr>
          </thead>
          <tbody>
            {result.tests.map(t => (
              <tr key={t.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '7px 8px', fontSize: '12px', color: 'var(--text-main)' }}>{t.name}</td>
                <td style={{ padding: '7px 8px', fontSize: '12px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  {t.kind === 'z' ? `z=${t.stat.toFixed(2)}` : `χ²=${t.stat.toFixed(1)}`}
                </td>
                <td style={{ padding: '7px 8px', fontSize: '12px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{fmtP(t.p)}</td>
                <td style={{ padding: '7px 8px', fontSize: '12px', textAlign: 'right', fontWeight: '700', color: t.significant ? 'var(--danger)' : 'var(--primary)' }}>
                  {t.significant ? '⚠ flag' : '✓ fair'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
        "Fair" means the numbers did exactly what an honest random draw would do — so no system can predict them. The monitor re-checks every time new draws load and only ever claims an edge when the math truly supports one.
      </p>
    </div>
  );
}
