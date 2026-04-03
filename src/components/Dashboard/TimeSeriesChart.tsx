"use client";

import React, { useMemo, useState, useCallback } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { PROCESSORS, PROCESSOR_CONFIG } from '../../lib/mockData';

// One colour per processor (+ overall)
const PROCESSOR_COLORS: Record<string, string> = {
  overall:   '#6366f1', // indigo   – overall
  stripe:    '#f59e0b', // amber
  adyen:     '#10b981', // emerald
  promptpay: '#3b82f6', // blue
  grabpay:   '#ec4899', // pink
  shopeepay: '#f97316', // orange
  '2c2p':    '#a855f7', // purple
  midtrans:  '#14b8a6', // teal
  xendit:    '#ef4444', // red
};

export function TimeSeriesChart() {
  const { filteredTransactions, playbackTime } = useTransactions();
  const [hiddenLines, setHiddenLines] = useState<Set<string>>(new Set());

  const toggleLine = useCallback((key: string) => {
    setHiddenLines(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const chartData = useMemo(() => {
    const VISIBLE_WINDOW_MS = 10 * 60 * 1000;
    const intervalMs = 10000;
    // In playback mode use the scrubber position as the clock; live mode uses wall time
    const now = playbackTime ?? Date.now();
    const currentBucket = Math.floor(now / intervalMs) * intervalMs;

    const windowStart = (filteredTransactions.at(-1)?.timestamp ?? now) - VISIBLE_WINDOW_MS;
    const visibleTransactions = filteredTransactions.filter(t => t.timestamp >= windowStart);

    // bucket shape: { total, approved, [processorId]: { total, approved } }
    type BucketStats = { total: number; approved: number; [key: string]: unknown };
    const grouped = new Map<number, BucketStats>();

    visibleTransactions.forEach(t => {
      const roundedMs = Math.floor(t.timestamp / intervalMs) * intervalMs;
      if (!grouped.has(roundedMs)) {
        const bucket: BucketStats = { total: 0, approved: 0 };
        PROCESSORS.forEach(p => { bucket[p] = { total: 0, approved: 0 }; });
        grouped.set(roundedMs, bucket);
      }
      const g = grouped.get(roundedMs)!;
      g.total++;
      if (t.status === 'approved') g.approved++;
      const ps = g[t.processor] as { total: number; approved: number };
      ps.total++;
      if (t.status === 'approved') ps.approved++;
    });

    return Array.from(grouped.entries())
      .map(([time, b]) => {
        const row: Record<string, unknown> = {
          time,
          timeFormatted: format(new Date(time), 'HH:mm:ss'),
          overall: b.total > 0 ? +((b.approved as number / b.total) * 100).toFixed(1) : null,
        };
        PROCESSORS.forEach(p => {
          const ps = b[p] as { total: number; approved: number };
          row[p] = ps.total > 0 ? +((ps.approved / ps.total) * 100).toFixed(1) : null;
        });
        return row;
      })
      .sort((a, b) => (a.time as number) - (b.time as number))
      // Drop the currently-accumulating bucket
      .filter(d => (d.time as number) < currentBucket);
  }, [filteredTransactions, playbackTime]);

  return (
    <div className="bg-panel border border-panel-border rounded-xl p-6 flex flex-col" style={{ height: '28rem' }}>
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-accent animate-pulse inline-block" />
        Auth Rate Trend — Overall &amp; Per Provider
      </h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a304a" vertical={false} />
            <XAxis
              dataKey="timeFormatted"
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              dy={10}
              minTickGap={40}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              dx={-10}
              tickFormatter={(val) => `${val}%`}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#161a2b', borderColor: '#2a304a', borderRadius: '8px', color: '#e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
              labelStyle={{ color: '#94a3b8', marginBottom: '8px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              formatter={(value: unknown, name: string | number | undefined) => [
                value !== null ? `${value}%` : '—',
                name === 'overall'
                  ? 'Overall'
                  : PROCESSOR_CONFIG[name as keyof typeof PROCESSOR_CONFIG]?.name ?? String(name ?? ''),
              ]}
              labelFormatter={(label) => `Time: ${label}`}
              cursor={{ stroke: '#2a304a', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '12px', cursor: 'pointer' }}
              onClick={(e) => toggleLine(e.dataKey as string)}
              formatter={(value) => {
                const label = value === 'overall'
                  ? 'Overall'
                  : PROCESSOR_CONFIG[value as keyof typeof PROCESSOR_CONFIG]?.name ?? value;
                const hidden = hiddenLines.has(value);
                return (
                  <span style={{
                    color: hidden ? '#475569' : undefined,
                    textDecoration: hidden ? 'line-through' : undefined,
                    transition: 'all 0.15s',
                  }}>
                    {label}
                  </span>
                );
              }}
            />

            {/* Overall — thicker, always on top visually */}
            <Line
              type="monotone"
              dataKey="overall"
              stroke={PROCESSOR_COLORS.overall}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
              connectNulls
              hide={hiddenLines.has('overall')}
            />

            {/* One line per processor */}
            {PROCESSORS.map(p => (
              <Line
                key={p}
                type="monotone"
                dataKey={p}
                stroke={PROCESSOR_COLORS[p]}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
                connectNulls
                opacity={0.75}
                hide={hiddenLines.has(p)}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
