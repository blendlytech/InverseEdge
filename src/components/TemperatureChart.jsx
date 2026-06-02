import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { isDoubleOrTriple } from '../utils/AIEngine';

const COLORS = [
  '#FF3B30', // 0 Red
  '#FF9500', // 1 Orange
  '#FFCC00', // 2 Yellow
  '#4CD964', // 3 Green
  '#5AC8FA', // 4 Light Blue
  '#007AFF', // 5 Blue
  '#5856D6', // 6 Purple
  '#FF2D55', // 7 Pink
  '#8E8E93', // 8 Gray
  '#E5E5EA', // 9 White
];

export default function TemperatureChart({ draws, lookback }) {
  const [activeDigits, setActiveDigits] = useState({
    0: true, 1: true, 2: true, 3: true, 4: true,
    5: true, 6: true, 7: true, 8: true, 9: true
  });

  const chartData = useMemo(() => {
    // 1. Take the exact draws used for analysis
    const analysisDraws = draws.slice(0, lookback);
    
    // 2. Reverse them to display chronologically (oldest to newest) on the chart
    const chronologicalDraws = [...analysisDraws].reverse();

    const data = [];
    const counts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };

    chronologicalDraws.forEach((d) => {
      // Follow the AI Engine rules: ignore doubles/triples for frequency tracking
      if (!isDoubleOrTriple(d.draw)) {
        const uniqueDigits = new Set(d.draw.split(''));
        uniqueDigits.forEach((digitStr) => {
          const num = parseInt(digitStr, 10);
          if (!isNaN(num)) {
            counts[num]++;
          }
        });
      }

      data.push({
        name: d.date.split(',')[0], // e.g., "June 1"
        fullDate: d.date,
        draw: d.draw,
        '0': counts[0],
        '1': counts[1],
        '2': counts[2],
        '3': counts[3],
        '4': counts[4],
        '5': counts[5],
        '6': counts[6],
        '7': counts[7],
        '8': counts[8],
        '9': counts[9],
      });
    });

    return data;
  }, [draws, lookback]);

  const handleLegendClick = (e) => {
    const dataKey = e.dataKey;
    setActiveDigits(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey]
    }));
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const drawInfo = payload[0].payload;
      return (
        <div style={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>{drawInfo.fullDate}</p>
          <p style={{ color: 'var(--text-main)', fontWeight: 'bold', fontSize: '16px', marginBottom: '12px', letterSpacing: '2px' }}>Draw: {drawInfo.draw}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {payload.map((p, i) => (
              <div key={i} style={{ color: p.color, fontSize: '12px', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                <span>Digit {p.dataKey}:</span>
                <strong>{p.value} hits</strong>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  if (!chartData || chartData.length === 0) return null;

  return (
    <div style={{ width: '100%', height: '350px', background: 'rgba(0,0,0,0.2)', padding: '24px 16px 16px 0', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="var(--text-muted)" 
            fontSize={11}
            tickMargin={10}
            minTickGap={30}
          />
          <YAxis 
            stroke="var(--text-muted)" 
            fontSize={11}
            tickMargin={10}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            onClick={handleLegendClick} 
            wrapperStyle={{ paddingTop: '20px', fontSize: '12px', cursor: 'pointer' }}
          />
          
          {Array.from({ length: 10 }).map((_, i) => (
            <Line
              key={i}
              type="monotone"
              dataKey={i.toString()}
              name={`Digit ${i}`}
              stroke={COLORS[i]}
              strokeWidth={activeDigits[i] ? 2.5 : 0} // Hide line if inactive, but keep in legend
              dot={false}
              activeDot={{ r: 6, fill: COLORS[i], stroke: '#fff', strokeWidth: 2 }}
              hide={!activeDigits[i]}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
