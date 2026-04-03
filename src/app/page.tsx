"use client";

import { useState } from 'react';
import { TransactionProvider, useTransactions } from '@/context/TransactionContext';
import { HealthGrid } from '@/components/Dashboard/HealthGrid';
import { Controls } from '@/components/Dashboard/Controls';
import { TimeSeriesChart } from '@/components/Dashboard/TimeSeriesChart';
import { PlaybackScrubber } from '@/components/Dashboard/PlaybackScrubber';
import { SidePanel } from '@/components/Dashboard/SidePanel';
import { Activity, AlertOctagon } from 'lucide-react';

function DashboardContent() {
  const { stats } = useTransactions();
  const failingProcessors = stats.filter(s => s.status === 'failing');
  const [isPlaybackMode, setIsPlaybackMode] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Sidebar Menu */}
      <aside className="w-80 flex-shrink-0 border-r border-panel-border bg-panel/30 h-screen sticky top-0 overflow-y-auto hidden lg:flex flex-col">
        <div className="p-6 border-b border-panel-border">
          <h1 className="text-xl font-black text-foreground flex items-center gap-3 tracking-tight">
            <div className="bg-accent/20 p-2 rounded-xl text-accent">
              <Activity size={20} />
            </div>
            SiamTravel Monitor
          </h1>
          <p className="text-foreground/50 mt-3 text-xs leading-relaxed">
            Real-time payment transaction health dashboard. Identifying anomalies and authorization drops instantly.
          </p>
        </div>
        
        <div className="p-6 flex-1">
          <SidePanel isPlaybackMode={isPlaybackMode} setIsPlaybackMode={setIsPlaybackMode} />
        </div>
        
        <div className="p-6 border-t border-panel-border flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-status-healthy animate-pulse" />
             <span className="text-xs font-medium text-status-healthy uppercase tracking-wide">System Operational</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden p-6 sm:p-10">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Mobile Header (Only shows on small screens when Sidebar is hidden) */}
          <header className="lg:hidden flex justify-between items-center pb-6 border-b border-panel-border mb-6">
            <h1 className="text-xl font-black text-foreground flex items-center gap-2">
              <div className="bg-accent/20 p-1.5 rounded-lg text-accent">
                <Activity size={18} />
              </div>
              SiamTravel
            </h1>
            <div className="flex items-center gap-2 bg-panel px-3 py-1.5 rounded-full border border-status-healthy/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
               <div className="w-2 h-2 rounded-full bg-status-healthy animate-pulse" />
               <span className="text-xs font-medium text-status-healthy">Operational</span>
            </div>
          </header>

          {isPlaybackMode && (
            <div className="mb-4">
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
      </main>
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
