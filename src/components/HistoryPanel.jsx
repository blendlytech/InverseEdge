import React, { useState } from 'react';
import { isDoubleOrTriple } from '../utils/AIEngine';

export default function HistoryPanel({ draws, onAddDraw, onDeleteDraw, onClearHistory }) {
  const [newDraw, setNewDraw] = useState('');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validate 3-digit input
    const cleanDraw = newDraw.trim();
    if (!/^\d{3}$/.test(cleanDraw)) {
      setError('Draw must be exactly 3 digits (e.g., 210, 059).');
      return;
    }

    onAddDraw({ date: newDate, draw: cleanDraw });
    setNewDraw('');
  };

  return (
    <div className="glass-card">
      <h2 style={{ marginBottom: '16px' }} className="glow-text-primary">Daily Draw Entry</h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="input-group">
          <label htmlFor="draw-date">Draw Date</label>
          <input
            id="draw-date"
            type="date"
            className="custom-input"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="draw-digits">Draw Digits (3-Digits)</label>
          <input
            id="draw-digits"
            type="text"
            pattern="\d*"
            maxLength={3}
            placeholder="e.g. 543"
            className="custom-input"
            value={newDraw}
            onChange={(e) => setNewDraw(e.target.value.replace(/\D/g, ''))}
            required
            style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '20px', fontWeight: 'bold' }}
          />
        </div>

        {error && (
          <div style={{ color: 'var(--danger)', fontSize: '13px', textAlign: 'left', fontWeight: '500' }}>
            ⚠️ {error}
          </div>
        )}

        {newDraw.length === 3 && isDoubleOrTriple(newDraw) && (
          <div style={{ color: 'var(--secondary)', fontSize: '12px', textAlign: 'left', background: 'rgba(234, 179, 8, 0.1)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
            ℹ️ <strong>Double/Triple Detected!</strong> This draw will be saved to your history, but our AI automatically filters it out from calculations (per system rules).
          </div>
        )}

        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
          Add Daily Draw
        </button>
      </form>

      <hr style={{ border: '0', borderTop: '1px solid var(--border-color)', margin: '24px 0' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '18px', color: 'var(--text-main)' }}>Draw History ({draws.length})</h3>
      </div>

      <div style={{ maxHeight: '280px', overflowY: 'auto', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(15, 23, 42, 0.4)' }}>
        {draws.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
            No draw history entered yet.<br />
            Enter a few drawings above to begin analysis!
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '10px 16px', color: 'var(--text-muted)', fontWeight: '500' }}>Date</th>
                <th style={{ padding: '10px 16px', color: 'var(--text-muted)', fontWeight: '500', textAlign: 'center' }}>Draw</th>
                <th style={{ padding: '10px 16px', textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {draws.map((d, index) => {
                const doubleOrTriple = isDoubleOrTriple(d.draw);
                return (
                  <tr 
                    key={index} 
                    style={{ 
                      borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                      background: doubleOrTriple ? 'rgba(239, 68, 68, 0.02)' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '10px 16px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {d.date}
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 'bold', fontFamily: 'var(--font-mono)', letterSpacing: '2px', color: doubleOrTriple ? 'rgba(239, 68, 68, 0.7)' : 'var(--text-main)' }}>
                      {d.draw} {doubleOrTriple && <span style={{ fontSize: '10px', verticalAlign: 'middle', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 4px', borderRadius: '4px', marginLeft: '4px' }}>D/T</span>}
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                      <button 
                        onClick={() => onDeleteDraw(index)} 
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }}
                        title="Delete draw"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {draws.length > 50 && (
        <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'left' }}>
          💡 History auto-rolls. Calculations use the last 50 draws.
        </div>
      )}
    </div>
  );
}
