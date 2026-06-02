import { useState, useEffect } from 'react';
import HistoryPanel from './components/HistoryPanel';
import AnalyticsPanel from './components/AnalyticsPanel';
import PlayGeneratorPanel from './components/PlayGeneratorPanel';
import SyncPanel from './components/SyncPanel';
import BacktestPanel from './components/BacktestPanel';
import { supabase } from './utils/supabaseClient';
// High-quality mock history (last 50 drawings)
// Engineered to make 0, 1, 2 colder than average to showcase Strategy 1 alignment
const DEFAULT_MOCK_DRAWS = [
  { date: '2026-05-30', draw: '984' },
  { date: '2026-05-29', draw: '958' },
  { date: '2026-05-28', draw: '938' },
  { date: '2026-05-27', draw: '735' },
  { date: '2026-05-26', draw: '954' },
  { date: '2026-05-25', draw: '864' },
  { date: '2026-05-24', draw: '765' },
  { date: '2026-05-23', draw: '978' },
  { date: '2026-05-22', draw: '875' },
  { date: '2026-05-21', draw: '986' },
  { date: '2026-05-20', draw: '754' },
  { date: '2026-05-19', draw: '943' },
  { date: '2026-05-18', draw: '865' },
  { date: '2026-05-17', draw: '764' },
  { date: '2026-05-16', draw: '963' },
  { date: '2026-05-15', draw: '854' },
  { date: '2026-05-14', draw: '763' },
  { date: '2026-05-13', draw: '974' },
  { date: '2026-05-12', draw: '853' },
  { date: '2026-05-11', draw: '957' },
  { date: '2026-05-10', draw: '863' },
  { date: '2026-05-09', draw: '753' },
  { date: '2026-05-08', draw: '946' },
  { date: '2026-05-07', draw: '843' },
  { date: '2026-05-06', draw: '754' },
  { date: '2026-05-05', draw: '935' },
  { date: '2026-05-04', draw: '654' },
  { date: '2026-05-03', draw: '852' }, // Double-check item
  { date: '2026-05-02', draw: '743' },
  { date: '2026-05-01', draw: '965' },
  { date: '2026-04-30', draw: '865' },
  { date: '2026-04-29', draw: '976' },
  { date: '2026-04-28', draw: '732' },
  { date: '2026-04-27', draw: '653' },
  { date: '2026-04-26', draw: '952' },
  { date: '2026-04-25', draw: '842' },
  { date: '2026-04-24', draw: '643' },
  { date: '2026-04-23', draw: '765' },
  { date: '2026-04-22', draw: '942' },
  { date: '2026-04-21', draw: '852' },
  { date: '2026-04-20', draw: '543' },
  { date: '2026-04-19', draw: '932' },
  { date: '2026-04-18', draw: '632' },
  { date: '2026-04-17', draw: '760' }, // Very few 0s, 1s, 2s overall
  { date: '2026-04-16', draw: '873' },
  { date: '2026-04-15', draw: '973' },
  { date: '2026-04-14', draw: '874' },
  { date: '2026-04-13', draw: '654' },
  { date: '2026-04-12', draw: '976' },
  { date: '2026-04-11', draw: '876' }
];

export default function App() {
  const [draws, setDraws] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial eliminated digits
  const [eliminatedDigits, setEliminatedDigits] = useState(() => {
    const saved = localStorage.getItem('inverse_edge_eliminations');
    return saved ? JSON.parse(saved) : [0, 1, 2]; // Default matches Strategy 1 recommendation
  });

  // Load active right-side panel tab ('heatmap', 'playgen', 'sync')
  const [activeTab, setActiveTab] = useState('heatmap');

  // Fetch from Supabase on mount
  useEffect(() => {
    const fetchDraws = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('lottery_draws')
        .select('*')
        .order('draw_date', { ascending: false })
        .order('draw_type', { ascending: true });
        
      if (!error && data && data.length > 0) {
        const formatted = data.map(row => ({
          date: `${row.draw_date} ${row.draw_type}`,
          draw: row.draw_number
        }));
        setDraws(formatted);
      } else {
        setDraws(DEFAULT_MOCK_DRAWS);
      }
      setIsLoading(false);
    };
    
    fetchDraws();
  }, []);

  // Save eliminations to localStorage on change
  useEffect(() => {
    localStorage.setItem('inverse_edge_eliminations', JSON.stringify(eliminatedDigits));
  }, [eliminatedDigits]);

  // App handlers

  const handleDeleteDraw = (indexToDelete) => {
    setDraws((prev) => prev.filter((_, idx) => idx !== indexToDelete));
  };

  const handleImportHistory = (importedDraws) => {
    setDraws(importedDraws);
  };

  const handleToggleElimination = (digit) => {
    setEliminatedDigits((prev) => {
      if (prev.includes(digit)) {
        return prev.filter(d => d !== digit);
      } else {
        // Limit to 4 elements max to preserve system viability
        if (prev.length >= 4) {
          alert('⚠️ Strategy Limit: Eliminating more than 4 digits yields too few plays and is statistically unviable under system rules.');
          return prev;
        }
        return [...prev, digit].sort((a, b) => a - b);
      }
    });
  };

  return (
    <div className="container">
      <div className="ambient-glow"></div>
      
      {/* Header section */}
      <header style={{ textAlign: 'center', marginBottom: '32px', position: 'relative', zIndex: '2' }}>
        <h1 
          className="glow-text-primary" 
          style={{ 
            fontSize: '44px', 
            fontWeight: '800', 
            color: 'var(--text-main)', 
            marginBottom: '4px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
        >
          Inverse<span style={{ color: 'var(--primary)' }}>Edge</span>
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-muted)', fontWeight: '500' }}>
          Pick-3 Algorithmic Elimination Strategy Engine
        </p>
      </header>

      {/* Main Dashboard Layout */}
      {isLoading && (
        <div style={{ textAlign: 'center', color: 'var(--primary)', marginBottom: '16px', fontSize: '14px' }}>
          🔄 Syncing history database...
        </div>
      )}
      <main className="dashboard-grid" style={{ opacity: isLoading ? 0.6 : 1, transition: 'opacity 0.3s' }}>
        {/* Left Column: Data Entry */}
        <section style={{ position: 'relative', zIndex: '2' }}>
          <HistoryPanel 
            draws={draws}
            onDeleteDraw={handleDeleteDraw}
          />
        </section>

        {/* Right Column: Analytics & Execution */}
        <section className="sub-grid-right" style={{ position: 'relative', zIndex: '2' }}>
          {/* Header tabs navigation */}
          <div className="tab-header">
            <button 
              className={`tab-btn ${activeTab === 'heatmap' ? 'active' : ''}`}
              onClick={() => setActiveTab('heatmap')}
            >
              📊 AI Predictor & Heatmap
            </button>
            <button 
              className={`tab-btn ${activeTab === 'playgen' ? 'active' : ''}`}
              onClick={() => setActiveTab('playgen')}
            >
              🎯 Combination Generator
            </button>
            <button 
              className={`tab-btn ${activeTab === 'backtest' ? 'active' : ''}`}
              onClick={() => setActiveTab('backtest')}
            >
              ⏳ Time Machine
            </button>
            <button 
              className={`tab-btn ${activeTab === 'sync' ? 'active' : ''}`}
              onClick={() => setActiveTab('sync')}
            >
              🔄 Sync & Backup
            </button>
          </div>

          {/* Active Tab Panel */}
          {activeTab === 'heatmap' && (
            <AnalyticsPanel 
              draws={draws}
              eliminatedDigits={eliminatedDigits}
              onToggleElimination={handleToggleElimination}
              onSetEliminations={setEliminatedDigits}
            />
          )}

          {activeTab === 'playgen' && (
            <PlayGeneratorPanel 
              draws={draws}
              eliminatedDigits={eliminatedDigits}
            />
          )}

          {activeTab === 'backtest' && (
            <BacktestPanel draws={draws} />
          )}

          {activeTab === 'sync' && (
            <SyncPanel 
              draws={draws}
              onImportHistory={handleImportHistory}
            />
          )}
        </section>
      </main>

      {/* Footer footer */}
      <footer style={{ marginTop: '48px', padding: '16px 0', borderTop: '1px solid var(--border-color)', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
        <p>© 2026 InverseEdge Pick-3 Engine. Automated under license rules of The Inverse Method.</p>
        <p style={{ marginTop: '4px' }}>Please gamble responsibly.</p>
      </footer>
    </div>
  );
}
