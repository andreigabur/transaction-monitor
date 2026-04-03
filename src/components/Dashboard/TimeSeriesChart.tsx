"use client";

import React, { useMemo } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export function TimeSeriesChart() {
  const { filteredTransactions } = useTransactions();

  const chartData = useMemo(() => {
    // Group transactions by minute intervals
    const grouped = new Map<number, { total: number; approved: number }>();

    filteredTransactions.forEach(t => {
      // nearest minute
      const minuteMs = Math.floor(t.timestamp / 60000) * 60000;
      if (!grouped.has(minuteMs)) {
        grouped.set(minuteMs, { total: 0, approved: 0 });
      }
      const g = grouped.get(minuteMs)!;
      g.total++;
      if (t.status === 'approved') g.approved++;
    });

    return Array.from(grouped.entries())
      .map(([time, stats]) => ({
        time,
        timeFormatted: format(new Date(time), 'HH:mm'),
        authRate: stats.total > 0 ? (stats.approved / stats.total) * 100 : 0,
        volume: stats.total
      }))
      .sort((a, b) => a.time - b.time);
  }, [filteredTransactions]);

  if (chartData.length === 0) return <div className="h-64 flex items-center justify-center text-foreground/50">No data available</div>;

  return (
    <div className="bg-panel border border-panel-border rounded-xl p-6 h-96 flex flex-col">
      <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-accent animate-pulse inline-block" /> 
        Global Auth Rate Trend
      </h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a304a" vertical={false} />
            <XAxis 
                dataKey="timeFormatted" 
                stroke="#64748b" 
                tick={{fill: '#64748b', fontSize: 12}}
                axisLine={false}
                tickLine={false}
                dy={10}
                minTickGap={20}
            />
            <YAxis 
                domain={[0, 100]} 
                stroke="#64748b" 
                tick={{fill: '#64748b', fontSize: 12}}
                axisLine={false}
                tickLine={false}
                dx={-10}
                tickFormatter={(val) => `${val}%`}
            />
            <Tooltip 
                contentStyle={{ backgroundColor: '#161a2b', borderColor: '#2a304a', borderRadius: '8px', color: '#e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                itemStyle={{ color: '#6366f1', fontWeight: 600 }}
                labelStyle={{ color: '#94a3b8', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                formatter={(value: any) => [`${Number(value).toFixed(1)}%`, 'Auth Rate']}
                labelFormatter={(label) => `Time: ${label}`}
                cursor={{ stroke: '#2a304a', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Line 
                type="monotone" 
                dataKey="authRate" 
                stroke="#6366f1" 
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: '#6366f1', stroke: '#0b0d17', strokeWidth: 2 }}
                animationDuration={300}
            />
            </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
