import { useState, useEffect, useMemo } from 'react';
import DrawEntryPanel from './components/DrawEntryPanel';
import BestExactPanel from './components/BestExactPanel';
import FrequencyPanel from './components/FrequencyPanel';
import HistoryPanel from './components/HistoryPanel';
import PlayGeneratorPanel from './components/PlayGeneratorPanel';
import PatternScanPanel from './components/PatternScanPanel';
import PredictionPanel from './components/PredictionPanel';
import TimeMachinePanel from './components/TimeMachinePanel';
import WinLogPanel from './components/WinLogPanel';
import { supabase } from './utils/supabaseClient';

export default function App() {
  const [supabaseDraws, setSupabaseDraws] = useState([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [showHistory, setShowHistory]     = useState(false);

  // User-entered draws — persisted to localStorage indefinitely
  const [userDraws, setUserDraws] = useState(() => {
    try { return JSON.parse(localStorage.getItem('inverse_edge_user_draws') || '[]'); }
    catch { return []; }
  });

  const [historyFilterDays, setHistoryFilterDays] = useState(() => {
    const saved = localStorage.getItem('inverse_edge_history_days');
    return saved ? parseInt(saved, 10) : 14;
  });

  // Persist user draws any time they change
  useEffect(() => {
    localStorage.setItem('inverse_edge_user_draws', JSON.stringify(userDraws));
  }, [userDraws]);

  // Real draw data only — Supabase + user-entered draws. User draws win deduplication
  // over Supabase on a shared date key. There is no fallback dataset: with no real data
  // the app shows an empty state prompting the user to add draws.
  const draws = useMemo(() => {
    const map = new Map();
    supabaseDraws.forEach(d => map.set(d.date, d));
    userDraws.forEach(d => map.set(d.date, d));
    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [supabaseDraws, userDraws]);

  const hasData = draws.length > 0;

  // Set of dates the user personally entered — drives delete-button visibility
  const userDrawDates = useMemo(() => new Set(userDraws.map(d => d.date)), [userDraws]);

  const fetchDraws = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('lottery_draws')
      .select('*')
      .order('draw_date', { ascending: false })
      .order('draw_type', { ascending: true });

    if (!error && data && data.length > 0) {
      setSupabaseDraws(data.map(row => ({
        date: `${row.draw_date} ${row.draw_type}`,
        draw: row.draw_number,
      })));
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchDraws(); }, []);

  useEffect(() => {
    localStorage.setItem('inverse_edge_history_days', historyFilterDays);
  }, [historyFilterDays]);

  // Permanently delete a user-entered draw by its date key
  const handleDeleteUserDraw = date => {
    setUserDraws(prev => prev.filter(d => d.date !== date));
  };

  // HistoryPanel compat: delete by index from merged draws; only persists for user draws
  const handleDeleteDraw = idx => {
    const target = draws[idx];
    if (target) handleDeleteUserDraw(target.date);
  };

  const handleAddDraw = newDraw => {
    setUserDraws(prev => [newDraw, ...prev.filter(d => d.date !== newDraw.date)]);
  };

  return (
    <div className="container">
      <div className="ambient-glow"></div>

      <header style={{ textAlign: 'center', marginBottom: '32px', position: 'relative', zIndex: 2 }}>
        <h1
          className="glow-text-primary"
          style={{ fontSize: '44px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}
        >
          Inverse<span style={{ color: 'var(--primary)' }}>Edge</span>
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-muted)', fontWeight: '500' }}>
          The 120-Combination Pick-3 Strategy System
        </p>
      </header>

      {isLoading && (
        <div style={{ textAlign: 'center', color: 'var(--primary)', marginBottom: '16px', fontSize: '14px' }}>
          🔄 Loading draw history...
        </div>
      )}

      {/* Data-source banner — analysis always runs on real draw data only */}
      {!isLoading && hasData && (
        <div style={{
          maxWidth: '920px', margin: '0 auto 16px', position: 'relative', zIndex: 2,
          padding: '10px 14px', borderRadius: '9px', fontSize: '12px', lineHeight: '1.5',
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--primary)',
        }}>
          ✅ <strong>Live data</strong> — analyzing <strong>{draws.length}</strong> real draws
          {draws[0] && <> (newest <strong style={{ fontFamily: 'var(--font-mono)' }}>{draws[0].date}</strong>)</>}.
        </div>
      )}

      {!isLoading && !hasData && (
        <div style={{
          maxWidth: '920px', margin: '0 auto 16px', position: 'relative', zIndex: 2,
          padding: '10px 14px', borderRadius: '9px', fontSize: '12px', lineHeight: '1.5',
          background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.4)', color: 'var(--secondary)',
        }}>
          📭 <strong>No draws loaded yet.</strong> Add your winning numbers below (or connect your data source) to begin analysis.
        </div>
      )}

      <main style={{
        maxWidth: '920px', margin: '0 auto',
        display: 'flex', flexDirection: 'column', gap: '24px',
        position: 'relative', zIndex: 2,
        opacity: isLoading ? 0.6 : 1, transition: 'opacity 0.3s'
      }}>
        <DrawEntryPanel
          draws={draws}
          userDraws={userDraws}
          onAddDraw={handleAddDraw}
          onDeleteUserDraw={handleDeleteUserDraw}
          historyFilterDays={historyFilterDays}
        />

        <BestExactPanel
          draws={draws}
          historyFilterDays={historyFilterDays}
        />

        <PlayGeneratorPanel
          draws={draws}
          historyFilterDays={historyFilterDays}
          setHistoryFilterDays={setHistoryFilterDays}
        />

        <FrequencyPanel draws={draws} />

        <PatternScanPanel draws={draws} />

        <PredictionPanel draws={draws} historyFilterDays={historyFilterDays} />

        <WinLogPanel draws={draws} />

        <TimeMachinePanel draws={draws} historyFilterDays={historyFilterDays} />

        {/* Collapsible draw history */}
        <div className="glass-card" style={{ padding: '14px 18px' }}>
          <button
            onClick={() => setShowHistory(v => !v)}
            style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', fontWeight: '600', padding: 0 }}
          >
            📋 Draw History
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'normal' }}>
              ({draws.length} draws loaded)
            </span>
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}>
              {showHistory ? '▲ Hide' : '▼ Show'}
            </span>
          </button>
          {showHistory && (
            <div style={{ marginTop: '14px' }}>
              <HistoryPanel draws={draws} onDeleteDraw={handleDeleteDraw} userDrawDates={userDrawDates} />
            </div>
          )}
        </div>
      </main>

      <footer style={{ marginTop: '48px', padding: '16px 0', borderTop: '1px solid var(--border-color)', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
        <p>© 2026 InverseEdge. The 120-Combination Pick-3 Strategy. Please gamble responsibly.</p>
      </footer>
    </div>
  );
}
