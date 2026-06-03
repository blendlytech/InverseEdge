
import { isDoubleOrTriple } from '../utils/AIEngine';

export default function HistoryPanel({ draws, onDeleteDraw, userDrawDates = new Set() }) {
  return (
    <div className="glass-card">

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '18px', color: 'var(--text-main)', margin: 0 }}>
          Draw History
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 'normal', marginLeft: '8px' }}>({draws.length} total)</span>
        </h3>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--primary)', fontWeight: '600' }}>●</span> your entry &nbsp;·&nbsp; ✕ = permanent delete
        </div>
      </div>

      <div style={{ maxHeight: '320px', overflowY: 'auto', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(15, 23, 42, 0.4)' }}>
        {draws.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
            No draw history yet. Enter results above to begin.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0 }}>
                <th style={{ padding: '9px 14px', color: 'var(--text-muted)', fontWeight: '500' }}></th>
                <th style={{ padding: '9px 14px', color: 'var(--text-muted)', fontWeight: '500' }}>Date</th>
                <th style={{ padding: '9px 14px', color: 'var(--text-muted)', fontWeight: '500', textAlign: 'center' }}>Draw</th>
                <th style={{ padding: '9px 14px', textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {draws.map((d, index) => {
                const doubleOrTriple = isDoubleOrTriple(d.draw);
                const isUserDraw     = userDrawDates.has(d.date);
                return (
                  <tr
                    key={index}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      background: isUserDraw
                        ? 'rgba(16,185,129,0.04)'
                        : doubleOrTriple
                          ? 'rgba(239,68,68,0.02)'
                          : 'transparent',
                    }}
                  >
                    {/* Source indicator */}
                    <td style={{ padding: '9px 8px 9px 14px', width: '8px' }}>
                      {isUserDraw && (
                        <span
                          title="Your saved draw"
                          style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', verticalAlign: 'middle' }}
                        />
                      )}
                    </td>

                    <td style={{ padding: '9px 14px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                      {d.date}
                    </td>

                    <td style={{ padding: '9px 14px', textAlign: 'center', fontWeight: 'bold', fontFamily: 'var(--font-mono)', letterSpacing: '2px', color: doubleOrTriple ? 'rgba(239,68,68,0.7)' : 'var(--text-main)' }}>
                      {d.draw}
                      {doubleOrTriple && (
                        <span style={{ fontSize: '9px', verticalAlign: 'middle', background: 'rgba(239,68,68,0.1)', padding: '2px 4px', borderRadius: '4px', marginLeft: '4px' }}>D/T</span>
                      )}
                    </td>

                    <td style={{ padding: '9px 14px', textAlign: 'right', width: '32px' }}>
                      {isUserDraw ? (
                        <button
                          onClick={() => onDeleteDraw(index)}
                          title="Permanently delete this draw"
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px', padding: '2px 4px', borderRadius: '3px', lineHeight: 1 }}
                          onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                        >
                          ✕
                        </button>
                      ) : (
                        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.12)', padding: '2px 4px' }} title="System draw — cannot be permanently deleted">sys</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {draws.length > 0 && (
        <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{userDrawDates.size}</span> of {draws.length} draws are yours (saved permanently). System draws reload on each visit.
        </div>
      )}
    </div>
  );
}
