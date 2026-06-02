import React from 'react';
import { calculateFrequencies, calculateGapTimes, getAIRecommendations } from '../utils/AIEngine';

export default function AnalyticsPanel({ draws, eliminatedDigits, onToggleElimination, onSetEliminations }) {
  const [lookbackCount, setLookbackCount] = React.useState(50);
  const [drawFilter, setDrawFilter] = React.useState('All');
  
  // Filter draws by Midday/Evening
  const filteredDraws = draws.filter(d => {
    if (drawFilter === 'All') return true;
    return d.date.includes(drawFilter);
  });

  // Constrain lookback to actual available data
  const maxDraws = filteredDraws.length;
  const validLookback = Math.min(Math.max(1, lookbackCount || 1), maxDraws > 0 ? maxDraws : 50);
  
  // Extract just the draw strings for calculations, sliced by the lookback window
  const drawStrings = filteredDraws.slice(0, validLookback).map(d => d.draw);
  
  // Calculate analytics
  const frequencies = calculateFrequencies(drawStrings);
  const gapTimes = calculateGapTimes(drawStrings);

  const [showScoreboardDetails, setShowScoreboardDetails] = React.useState(null);

  // Calculate Doubles and Triples in the current lookback window
  const doublesList = [];
  const triplesList = [];
  const doubleFrequencies = {};
  const tripleFrequencies = {};
  
  filteredDraws.slice(0, validLookback).forEach(d => {
    const draw = d.draw;
    if (draw && draw.length === 3) {
      if (draw[0] === draw[1] && draw[1] === draw[2]) {
        triplesList.push(d);
        tripleFrequencies[draw] = (tripleFrequencies[draw] || 0) + 1;
      } else if (draw[0] === draw[1] || draw[1] === draw[2] || draw[0] === draw[2]) {
        doublesList.push(d);
        doubleFrequencies[draw] = (doubleFrequencies[draw] || 0) + 1;
      }
    }
  });

  const doubleCount = doublesList.length;
  const tripleCount = triplesList.length;

  // Auto-prediction trigger
  const runAIPrediction = (count) => {
    const recommendations = getAIRecommendations(frequencies, gapTimes, count);
    onSetEliminations(recommendations);
  };

  // Find coldest digits overall to list in analysis text
  const sortedDigits = Array.from({ length: 10 }, (_, i) => i)
    .sort((a, b) => {
      if (gapTimes[a] !== gapTimes[b]) return gapTimes[b] - gapTimes[a];
      return frequencies[a] - frequencies[b];
    });

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '8px' }}>
        <h2 className="glow-text-secondary" style={{ margin: 0 }}>AI Prediction Engine</h2>
        
        {/* Midday/Evening Toggle */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setDrawFilter('All')}
            style={{ background: drawFilter === 'All' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', border: 'none', color: drawFilter === 'All' ? '#000' : 'var(--text-muted)', padding: '6px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '0.5px' }}
          >
            All
          </button>
          <button 
            onClick={() => setDrawFilter('Midday')}
            style={{ background: drawFilter === 'Midday' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', border: 'none', color: drawFilter === 'Midday' ? '#000' : 'var(--text-muted)', padding: '6px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '0.5px' }}
          >
            Midday
          </button>
          <button 
            onClick={() => setDrawFilter('Evening')}
            style={{ background: drawFilter === 'Evening' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', border: 'none', color: drawFilter === 'Evening' ? '#000' : 'var(--text-muted)', padding: '6px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '0.5px' }}
          >
            Evening
          </button>
        </div>
      </div>

      <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        Analyzing occurrences over your last 
        <input 
          type="number" 
          min="1" 
          max={maxDraws > 0 ? maxDraws : 50} 
          value={lookbackCount} 
          onChange={(e) => setLookbackCount(Number(e.target.value))}
          style={{ width: '60px', padding: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '4px' }}
        /> 
        drawings. {maxDraws > 0 && <span style={{fontSize: '12px', opacity: 0.7}}>(Max: {maxDraws})</span>}
      </p>

      {/* Doubles / Triples Scoreboard */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: showScoreboardDetails ? '16px' : '24px' }}>
        <div 
          onClick={() => setShowScoreboardDetails(showScoreboardDetails === 'doubles' ? null : 'doubles')}
          style={{ background: showScoreboardDetails === 'doubles' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '8px', flex: 1, textAlign: 'center', border: showScoreboardDetails === 'doubles' ? '1px solid var(--primary)' : '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Doubles</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-main)', lineHeight: '1' }}>{doubleCount}</div>
        </div>
        <div 
          onClick={() => setShowScoreboardDetails(showScoreboardDetails === 'triples' ? null : 'triples')}
          style={{ background: showScoreboardDetails === 'triples' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '8px', flex: 1, textAlign: 'center', border: showScoreboardDetails === 'triples' ? '1px solid var(--primary)' : '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Triples</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-main)', lineHeight: '1' }}>{tripleCount}</div>
        </div>
      </div>

      {/* Expanded Details View */}
      {showScoreboardDetails && (
        <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', marginBottom: '24px', maxHeight: '240px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ color: 'var(--text-main)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Detailed {showScoreboardDetails} History
            </h4>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Showing {showScoreboardDetails === 'doubles' ? doubleCount : tripleCount} hits</span>
          </div>
          
          {(showScoreboardDetails === 'doubles' ? doublesList : triplesList).length === 0 ? (
            <p style={{fontSize: '12px', color: 'var(--text-muted)'}}>No {showScoreboardDetails} found in this range.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {(showScoreboardDetails === 'doubles' ? doublesList : triplesList).map((d, i) => {
                const freqMap = showScoreboardDetails === 'doubles' ? doubleFrequencies : tripleFrequencies;
                const freq = freqMap[d.draw];
                return (
                  <li key={i} style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span>{d.date}</span>
                    <span>
                      <strong style={{ color: 'var(--text-main)', fontSize: '13px', letterSpacing: '2px' }}>{d.draw}</strong> 
                      {freq > 1 && (
                        <span style={{ color: 'var(--primary)', marginLeft: '8px', fontSize: '10px', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                          Hit {freq}x
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* AI Recommendation Card */}
      <div style={{ 
        background: 'rgba(16, 185, 129, 0.05)', 
        border: '1px solid rgba(16, 185, 129, 0.15)', 
        borderRadius: '12px', 
        padding: '16px',
        marginBottom: '24px',
        textAlign: 'left'
      }} className="pulse-glow">
        <h4 style={{ color: 'var(--primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px' }}>
          🧠 AI Engine Cold Digit Recommender
        </h4>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Our neural filter traces digit gap-spacing and frequency weights to find the safest numbers to eliminate.
        </p>
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            disabled={draws.length === 0}
            onClick={() => runAIPrediction(2)} 
            className="btn btn-secondary btn-small"
            style={{ borderColor: 'rgba(16, 185, 129, 0.3)', color: 'var(--text-main)' }}
          >
            Predict Cold 2
          </button>
          <button 
            disabled={draws.length === 0}
            onClick={() => runAIPrediction(3)} 
            className="btn btn-secondary btn-small"
            style={{ borderColor: 'rgba(16, 185, 129, 0.3)', color: 'var(--text-main)' }}
          >
            Predict Cold 3
          </button>
          <button 
            disabled={draws.length === 0}
            onClick={() => runAIPrediction(4)} 
            className="btn btn-secondary btn-small"
            style={{ borderColor: 'rgba(16, 185, 129, 0.3)', color: 'var(--text-main)' }}
          >
            Predict Cold 4
          </button>
        </div>
      </div>

      {/* Digit Grid Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h3 style={{ fontSize: '16px', color: 'var(--text-main)' }}>Interactive Digit Heatmap</h3>
        {eliminatedDigits.length > 0 && (
          <button 
            onClick={() => onSetEliminations([])} 
            style={{ background: 'transparent', border: 'none', color: 'var(--danger)', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}
          >
            Reset Eliminations
          </button>
        )}
      </div>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'left', marginBottom: '12px' }}>
        Digits are labeled with their occurrence frequency. <strong>Tap any digit</strong> to manually override and eliminate/restore it from play lists.
      </p>

      {/* Interactive Grid */}
      <div className="digit-grid">
        {Array.from({ length: 10 }).map((_, digit) => {
          const freq = frequencies[digit];
          const gap = gapTimes[digit];
          const isEliminated = eliminatedDigits.includes(digit);
          
          // Determine styling state
          let cardClass = "digit-card";
          if (isEliminated) {
            cardClass += " eliminated";
          } else if (sortedDigits.slice(0, 3).includes(digit) && draws.length > 0) {
            cardClass += " coldest"; // cold hints
          }

          return (
            <div 
              key={digit} 
              className={cardClass}
              onClick={() => onToggleElimination(digit)}
              title={`Digit ${digit}: Drawn ${freq} times. Last seen ${gap === 999 ? 'never' : `${gap} draws ago`}.`}
            >
              <span className="num">{digit}</span>
              <span className="freq">{freq}x</span>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '1px' }}>
                {gap === 999 ? 'seen' : `${gap}d ago`}
              </span>
            </div>
          );
        })}
      </div>

      {/* Narrative analysis breakdown */}
      {draws.length > 0 && (
        <div style={{ marginTop: '24px', padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', textAlign: 'left' }}>
          <h4 style={{ fontSize: '13px', color: 'var(--text-main)', marginBottom: '6px' }}>📉 Local Heat Analysis</h4>
          <ul style={{ fontSize: '12px', color: 'var(--text-muted)', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li>
              Coldest Digit: <strong>{sortedDigits[0]}</strong> (Last seen <strong>{gapTimes[sortedDigits[0]] === 999 ? 'never' : `${gapTimes[sortedDigits[0]]} drawings ago`}</strong>).
            </li>
            <li>
              Second Coldest: <strong>{sortedDigits[1]}</strong> (Last seen <strong>{gapTimes[sortedDigits[1]] === 999 ? 'never' : `${gapTimes[sortedDigits[1]]} drawings ago`}</strong>).
            </li>
            <li>
              Highest Spike: <strong>{Array.from({ length: 10 }, (_, i) => i).sort((a,b) => frequencies[b] - frequencies[a])[0]}</strong> with <strong>{Math.max(...Object.values(frequencies))} hits</strong>.
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
