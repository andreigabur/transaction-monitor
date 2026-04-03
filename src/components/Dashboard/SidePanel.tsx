"use client";

import { useTransactions } from '@/context/TransactionContext';
import { Settings, History, BellRing, Activity } from 'lucide-react';

export function SidePanel({ isPlaybackMode, setIsPlaybackMode }: { isPlaybackMode: boolean, setIsPlaybackMode: (v: boolean) => void }) {
  const { alertThresholds, setAlertThresholds } = useTransactions();

  return (
    <div className="space-y-8 flex flex-col">
      <div className="flex items-center gap-3 border-b border-panel-border pb-4">
        <Settings size={20} className="text-foreground/70" />
        <h2 className="text-lg font-bold text-foreground">Control Panel</h2>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-foreground/80 mb-2">
          <History size={16} className="text-accent" />
          <h3 className="font-semibold text-sm uppercase tracking-wider">Analysis Mode</h3>
        </div>
        
        <p className="text-xs text-foreground/50 mb-3">
          Launch a dedicated incident timeline to analyze past events based on a simulated mock block.
        </p>
        
        {!isPlaybackMode ? (
            <button 
                onClick={() => setIsPlaybackMode(true)}
                className="w-full flex justify-center items-center gap-2 text-sm font-bold px-4 py-3 rounded-lg border bg-accent/20 text-accent border-accent/40 hover:bg-accent hover:text-white transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)]"
            >
                <History size={16} /> Enter Historical Playback
            </button>
        ) : (
            <button 
                onClick={() => setIsPlaybackMode(false)}
                className="w-full flex justify-center items-center gap-2 text-sm font-bold px-4 py-3 rounded-lg border bg-status-failing/20 text-status-failing border-status-failing/40 hover:bg-status-failing hover:text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)]"
            >
                <Activity size={16} /> Return to Live Data
            </button>
        )}
      </div>

      <div className="space-y-5 pt-4 border-t border-panel-border">
        <div className="flex items-center gap-2 text-foreground/80 mb-2">
          <BellRing size={16} className="text-status-failing" />
          <h3 className="font-semibold text-sm uppercase tracking-wider">Alert Thresholds</h3>
        </div>
        
        <p className="text-xs text-foreground/50 mb-4">
          Visual indicator flags will trigger on processors breaking these rules in real-time.
        </p>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center mb-1">
              <label className="text-xs tracking-wider text-foreground/70 font-bold">Min Auth Rate</label>
              <span className="text-xs font-mono text-status-failing font-bold">{(alertThresholds.minAuthRate * 100).toFixed(0)}%</span>
          </div>
          <input 
            type="range" min="0" max="1" step="0.05" 
            value={alertThresholds.minAuthRate}
            onChange={e => setAlertThresholds(prev => ({...prev, minAuthRate: parseFloat(e.target.value)}))}
            className="w-full accent-status-failing cursor-pointer outline-none"
          />
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <div className="flex justify-between items-center mb-1">
              <label className="text-xs tracking-wider text-foreground/70 font-bold">Max Idle Time</label>
              <span className="text-xs font-mono text-status-degraded font-bold">{alertThresholds.maxIdleMinutes} min</span>
          </div>
          <input 
            type="range" min="1" max="60" step="1" 
            value={alertThresholds.maxIdleMinutes}
            onChange={e => setAlertThresholds(prev => ({...prev, maxIdleMinutes: parseInt(e.target.value)}))}
            className="w-full accent-status-degraded cursor-pointer outline-none"
          />
        </div>
      </div>
    </div>
  );
}
