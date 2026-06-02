import React, { useState } from 'react';
import { 
  generateMasterList, 
  eliminateCombinations, 
  applyHistoryFilter, 
  normalizeDraw, 
  isDoubleOrTriple 
} from '../utils/AIEngine';
import Tooltip from './Tooltip';

const HelpIcon = () => (
  <span style={{ cursor: 'help', color: 'var(--primary)', opacity: 0.8, fontSize: '12px', marginLeft: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', border: '1px solid var(--primary)', borderRadius: '50%', fontWeight: 'bold' }}>?</span>
);

export default function PlayGeneratorPanel({ draws, eliminatedDigits }) {
  const [showOnlyFiltered, setShowOnlyFiltered] = useState(true);
  
  // 1. Generate core 120 master list
  const masterList = generateMasterList();
  
  // 2. Filter out eliminated digits
  const baseCombinations = eliminateCombinations(masterList, eliminatedDigits);
  
  // 3. Extract draw strings for the history filter
  const drawStrings = draws.map(d => d.draw);
  
  // 4. Apply 14-day history filter
  const filteredCombinations = applyHistoryFilter(baseCombinations, drawStrings);
  
  // Grab the list of drawings that caused exclusions for labeling
  const last14DrawsStandardized = new Set(
    drawStrings
      .filter(draw => !isDoubleOrTriple(draw))
      .slice(0, 14)
      .map(normalizeDraw)
  );

  // Stats
  const totalCombos = baseCombinations.length;
  const activeCombos = filteredCombinations.length;
  const filteredCount = totalCombos - activeCombos;
  const totalInvestment = activeCombos * 1.00; // $1 per play
  const expectedPayout = 80.00;
  const netProfit = expectedPayout - totalInvestment;

  // Copy-to-clipboard functionality
  const handleCopy = () => {
    if (filteredCombinations.length === 0) return;
    const text = filteredCombinations.join(', ');
    navigator.clipboard.writeText(text);
    alert('📋 Play list copied to clipboard!');
  };

  return (
    <div className="glass-card">
      <h2 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }} className="glow-text-primary">
        Optimized Combinations Generator
        <Tooltip text="Generates a strict mathematical list of plays by subtracting your selected cold digits from the master 120-play non-repeating set."><HelpIcon /></Tooltip>
      </h2>
      
      {eliminatedDigits.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎯</div>
          <h3>Select cold digits to generate your plays</h3>
          <p style={{ fontSize: '13px', marginTop: '6px' }}>
            Use the AI Cold Digit Recommender or tap digits in the interactive heatmap above to see play sheets.
          </p>
        </div>
      ) : (
        <div>
          {/* Active Strategy Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '20px'
          }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Active Strategy</span>
              <strong style={{ fontSize: '16px', color: 'var(--secondary)' }}>
                {eliminatedDigits.length === 3 ? "Strategy 1/2: " : ""}
                {eliminatedDigits.length === 2 ? "Strategy 3: " : ""}
                {eliminatedDigits.length === 1 ? "Strategy 4: " : ""}
                {eliminatedDigits.length === 4 ? "Strategy 5: " : ""}
                {eliminatedDigits.length}-Digit Elimination ({10 - eliminatedDigits.length} remaining)
              </strong>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Eliminated Digits</span>
              <strong style={{ fontSize: '16px', color: 'var(--danger)', fontFamily: 'var(--font-mono)' }}>
                {eliminatedDigits.map(String).join(', ')}
              </strong>
            </div>
          </div>

          {/* Strategy 4 Warning */}
          {eliminatedDigits.length === 1 && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              fontSize: '13px',
              color: 'var(--danger)',
              textAlign: 'left'
            }}>
              ⚠️ <strong>Not Recommended:</strong> Strategy 4 (Single-Digit Elimination) yields a significantly lower net profit margin. Two-digit, three-digit, or four-digit eliminations provide a much better risk-to-reward ratio according to The Inverse Method Guide.
            </div>
          )}

          {/* Profit margins details */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
            gap: '12px',
            marginBottom: '24px' 
          }}>
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tickets to Buy</span>
              <h3 style={{ fontSize: '22px', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{activeCombos}</h3>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Daily Cost ($1/ea)</span>
              <h3 style={{ fontSize: '22px', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>${totalInvestment.toFixed(2)}</h3>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Expected Payout</span>
              <h3 style={{ fontSize: '22px', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>${expectedPayout.toFixed(2)}</h3>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--primary)' }}>Net Profit on Win</span>
              <h3 style={{ fontSize: '22px', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>${netProfit.toFixed(2)}</h3>
            </div>
          </div>

          {/* History savings alert */}
          {filteredCount > 0 && (
            <div style={{ 
              background: 'rgba(234, 179, 8, 0.05)',
              border: '1px solid rgba(234, 179, 8, 0.15)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              fontSize: '13px',
              color: 'var(--text-main)',
              textAlign: 'left'
            }}>
              🔥 <strong>History Filter Advantage:</strong> Automatically removed <strong>{filteredCount} combinations</strong> that matched draws from the last 14 days. This **saved you ${filteredCount.toFixed(2)}** in capital and pushed your net profit up from ${(expectedPayout - totalCombos).toFixed(2)} to **${netProfit.toFixed(2)}**!
            </div>
          )}

          {/* Combinations listing controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={showOnlyFiltered}
                onChange={(e) => setShowOnlyFiltered(e.target.checked)}
                style={{ accentColor: 'var(--primary)', width: '15px', height: '15px' }}
              />
              Hide history-filtered (crossed-out) combinations
            </label>
            
            <button onClick={handleCopy} className="btn btn-secondary btn-small" style={{ fontSize: '12px', padding: '6px 12px' }}>
              📋 Copy Play List
            </button>
          </div>

          {/* Combinations list */}
          <div className="comb-list-container">
            {baseCombinations.map((comb) => {
              const isFiltered = last14DrawsStandardized.has(comb);
              if (isFiltered && showOnlyFiltered) return null;
              
              return (
                <div 
                  key={comb} 
                  className={`comb-badge ${isFiltered ? 'filtered' : ''}`}
                  title={isFiltered ? 'Filtered out because this sequence appeared recently in history' : 'Active recommended play'}
                >
                  {comb}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '16px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'left' }}>
            📝 <strong>How to play:</strong> Write down or copy these {activeCombos} numbers. Place a **$1.00 Box Bet** on each combination at your local retailer. Any order matches (e.g. you have 543 and the draw is 345, you win $100!).
          </div>
        </div>
      )}
    </div>
  );
}
