"use client";

import { useState } from 'react';
import { TransactionProvider, useTransactions } from '@/context/TransactionContext';
import { HealthGrid } from '@/components/Dashboard/HealthGrid';
import { Controls } from '@/components/Dashboard/Controls';
import { TimeSeriesChart } from '@/components/Dashboard/TimeSeriesChart';
import { PlaybackScrubber } from '@/components/Dashboard/PlaybackScrubber';
import { Activity, AlertOctagon, History } from 'lucide-react';

function DashboardContent() {
  const { stats } = useTransactions();
  const failingProcessors = stats.filter(s => s.status === 'failing');
  
  const [isPlaybackMode, setIsPlaybackMode] = useState(false);

  return (
    <div className="min-h-screen p-6 pb-20 sm:p-10 max-w-7xl mx-auto space-y-8">
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 pb-6 border-b border-panel-border">
        <div>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-3 tracking-tight">
            <div className="bg-accent/20 p-2 rounded-xl text-accent">
              <Activity size={28} />
            </div>
            SiamTravel Monitor
          </h1>
          <p className="text-foreground/60 mt-2 text-sm max-w-xl leading-relaxed">
            Real-time payment transaction health dashboard. Identifying anomalies and authorization drops instantly.
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2 bg-panel px-4 py-2 rounded-full border border-status-healthy/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
             <div className="w-2 h-2 rounded-full bg-status-healthy animate-pulse" />
             <span className="text-sm font-medium text-status-healthy">System Operational</span>
          </div>
          {!isPlaybackMode && (
            <button 
              onClick={() => setIsPlaybackMode(true)}
              className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full border bg-accent/20 text-accent border-accent/30 hover:bg-accent hover:text-white transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)]"
              title="Replay historical performance data"
            >
              <History size={14} /> Enter Historical Playback
            </button>
          )}
        </div>
      </header>

      {isPlaybackMode && (
        <div className="mb-8">
          <PlaybackScrubber onClose={() => setIsPlaybackMode(false)} />
        </div>
      )}

      <Controls />
      <HealthGrid />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <TimeSeriesChart />
        </div>
        <div className="bg-panel border border-panel-border rounded-xl flex flex-col items-center justify-center text-center overflow-hidden">
          {failingProcessors.length > 0 ? (
            <div className="w-full h-full p-6 bg-status-failing/10 flex flex-col items-center justify-center">
                <AlertOctagon size={48} className="text-status-failing mb-4 animate-pulse" />
                <h3 className="text-xl font-bold text-status-failing mb-2">Critical Alerts</h3>
                <p className="text-status-failing/80 text-sm mb-4">
                  {failingProcessors.length} processor(s) experiencing severe degradation and massive drops in authorization rates.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {failingProcessors.map(p => (
                    <span key={p.id} className="px-3 py-1 bg-status-failing text-white rounded-full text-xs font-bold shadow-lg">
                      {p.name}
                    </span>
                  ))}
                </div>
            </div>
          ) : (
            <div className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Traffic Insights</h3>
              <p className="text-foreground/50 text-sm mb-6">Select specific payment methods or regions to automatically recalculate performance.</p>
              <div className="w-full bg-background rounded-lg border border-panel-border p-4 text-left">
                <p className="text-xs text-foreground/40 mb-2 uppercase font-semibold">Tip</p>
                <p className="text-sm text-foreground/80">Hover over a processor card and click <span className="text-status-failing font-semibold">"Simulate Outage"</span> to inject an anomaly into the system stream.</p>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

export default function Home() {
  return (
    <TransactionProvider>
      <DashboardContent />
    </TransactionProvider>
  );
}
