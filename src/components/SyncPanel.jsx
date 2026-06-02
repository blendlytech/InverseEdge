import React, { useState } from 'react';

export default function SyncPanel({ draws, onImportHistory }) {
  const [importCode, setImportCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Generates sync code (Standard Base64 string of JSON data)
  const getExportCode = () => {
    if (draws.length === 0) return 'No history to export.';
    try {
      const jsonStr = JSON.stringify(draws);
      // Basic encoding to keep the text clean
      return btoa(unescape(encodeURIComponent(jsonStr)));
    } catch (e) {
      return 'Error generating export code.';
    }
  };

  const handleImport = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!importCode.trim()) {
      setError('Please paste a sync code.');
      return;
    }

    try {
      // Decode Base64 string back to JSON draws array
      const decodedStr = decodeURIComponent(escape(atob(importCode.trim())));
      const parsedDraws = JSON.parse(decodedStr);

      if (!Array.isArray(parsedDraws)) {
        throw new Error('Invalid format: Sync code must resolve to a list.');
      }

      // Check structure of first item if it exists
      if (parsedDraws.length > 0) {
        const item = parsedDraws[0];
        if (typeof item !== 'object' || !item.date || !item.draw) {
          throw new Error('Invalid format: Draws list has incorrect schema.');
        }
      }

      onImportHistory(parsedDraws);
      setSuccess(`🎉 Success! Loaded ${parsedDraws.length} past drawings into your database!`);
      setImportCode('');
    } catch (err) {
      setError('❌ Invalid Sync Code. Please ensure you copied the entire code block exactly.');
    }
  };

  const copyExportCode = () => {
    const code = getExportCode();
    if (code.startsWith('No') || code.startsWith('Error')) return;
    navigator.clipboard.writeText(code);
    alert('📋 Export Sync Code copied! Paste this on your phone or other device.');
  };

  return (
    <div className="glass-card">
      <h2 style={{ marginBottom: '8px' }} className="glow-text-primary">Cloud-Free Sync & Backups</h2>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
        Move your history between your computer and mobile phone instantly without requiring cloud accounts or internet storage.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        {/* Export Card */}
        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', textAlign: 'left' }}>
          <h3 style={{ fontSize: '15px', color: 'var(--text-main)', marginBottom: '8px' }}>📤 Export Sync Code (This Device)</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Copy this code to transfer your current draw history to another device or save a backup copy.
          </p>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <textarea
              readOnly
              value={getExportCode()}
              style={{
                flex: '1',
                height: '44px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: 'var(--text-muted)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                padding: '6px',
                resize: 'none',
                outline: 'none'
              }}
              onClick={(e) => e.target.select()}
            />
            <button 
              disabled={draws.length === 0}
              onClick={copyExportCode} 
              className="btn btn-secondary"
              style={{ fontSize: '13px', padding: '0 16px' }}
            >
              Copy
            </button>
          </div>
        </div>

        {/* Import Card */}
        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', textAlign: 'left' }}>
          <h3 style={{ fontSize: '15px', color: 'var(--text-main)', marginBottom: '8px' }}>📥 Import Sync Code (Paste Here)</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Paste the code generated on your other device to load its history. 
            <strong style={{ color: 'var(--secondary)' }}> Note: This will overwrite your current draw history!</strong>
          </p>

          <form onSubmit={handleImport} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <textarea
              placeholder="Paste sync code here..."
              value={importCode}
              onChange={(e) => setImportCode(e.target.value)}
              style={{
                height: '60px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: 'var(--text-main)',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                padding: '8px',
                resize: 'none',
                outline: 'none'
              }}
            />

            {error && <div style={{ color: 'var(--danger)', fontSize: '12px', fontWeight: '500' }}>{error}</div>}
            {success && <div style={{ color: 'var(--primary)', fontSize: '12px', fontWeight: '500' }}>{success}</div>}

            <button type="submit" className="btn btn-secondary btn-small" style={{ alignSelf: 'flex-start', marginTop: '4px' }}>
              Import & Overwrite
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
