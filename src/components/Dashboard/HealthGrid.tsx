"use client";

import React from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { cn } from '../../lib/utils';
import { ProcessorId } from '../../lib/types';
import { Activity, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export function HealthGrid() {
  const { stats, toggleAnomaly, resetAnomaly, activeAnomalies, alertThresholds } = useTransactions();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-foreground">Processor Health</h2>
        <button 
          onClick={resetAnomaly}
          className="text-sm px-3 py-1.5 bg-panel-border hover:bg-panel-border/80 rounded-md transition-colors text-foreground"
        >
          Reset All Status
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((processor) => {
          const isHealthy = processor.status === 'healthy';
          const isDegraded = processor.status === 'degraded';
          const isFailing = processor.status === 'failing';

          return (
            <div 
              key={processor.id}
              className={cn(
                "relative overflow-hidden rounded-xl border bg-panel p-5 transition-all duration-500 group",
                isHealthy ? "border-status-healthy/20 shadow-[0_4px_20px_rgba(16,185,129,0.05)]" : "",
                isDegraded ? "border-status-degraded/40 shadow-[0_4px_25px_rgba(245,158,11,0.15)]" : "",
                isFailing ? "border-status-failing/60 shadow-[0_4px_30px_rgba(239,68,68,0.25)]" : "",
                "hover:-translate-y-1 hover:shadow-xl"
              )}
            >
              <div className="absolute top-0 left-0 w-full h-1 z-0">
                  <div className={cn(
                      "h-full w-full transition-colors duration-500",
                      isHealthy && "bg-status-healthy",
                      isDegraded && "bg-status-degraded",
                      isFailing && "bg-status-failing"
                  )} />
              </div>

              <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end z-10 pointer-events-none">
                {processor.alerts.authRateBreached && (
                  <span className="bg-status-failing text-white text-[10px] uppercase font-bold px-2 py-1 rounded shadow-lg shadow-status-failing/50 animate-pulse border border-white/20">
                    Alert: Auth &lt; {(alertThresholds.minAuthRate * 100).toFixed(0)}%
                  </span>
                )}
                {processor.alerts.idleBreached && (
                  <span className="bg-status-degraded text-white text-[10px] uppercase font-bold px-2 py-1 rounded shadow-lg shadow-status-degraded/50 animate-pulse border border-white/20">
                    Alert: Idle &gt; {alertThresholds.maxIdleMinutes}m
                  </span>
                )}
              </div>
              
              <div className="flex justify-between items-start mb-4 mt-1">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{processor.name}</h3>
                  <p className="text-xs text-foreground/50 uppercase tracking-wider mt-0.5">Payment Processor</p>
                </div>
                <div className={cn(
                    "p-2 rounded-full transition-colors duration-500",
                    isHealthy && "bg-status-healthy/10 text-status-healthy",
                    isDegraded && "bg-status-degraded/20 text-status-degraded",
                    isFailing && "bg-status-failing/20 text-status-failing animate-pulse"
                )}>
                  {isHealthy && <CheckCircle2 size={24} />}
                  {isDegraded && <AlertTriangle size={24} />}
                  {isFailing && <XCircle size={24} />}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="flex flex-col">
                      <span className="text-xs uppercase font-semibold text-foreground/50 tracking-wider">Auth Rate</span>
                      <span className={cn(
                          "text-3xl font-black mt-1 tracking-tight transition-colors duration-500",
                          isHealthy && "text-status-healthy",
                          isDegraded && "text-status-degraded",
                          isFailing && "text-status-failing"
                      )}>
                          {(processor.authRate * 100).toFixed(1)}%
                      </span>
                  </div>
                  <div className="flex flex-col">
                      <span className="text-xs uppercase font-semibold text-foreground/50 tracking-wider">Active Vol.</span>
                      <span className="text-3xl font-black mt-1 text-foreground tracking-tight">
                          {processor.volume}
                      </span>
                  </div>
              </div>

              <div className={cn(
                "mt-6 pt-4 border-t border-panel-border flex justify-between items-center transition-opacity duration-300",
                activeAnomalies.includes(processor.id as ProcessorId) ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}>
                {activeAnomalies.includes(processor.id as ProcessorId) ? (
                  <span className="text-xs text-status-failing font-bold flex items-center gap-1.5 animate-pulse flex-shrink-0 mr-2">
                    <AlertTriangle size={14} /> Sim Active
                  </span>
                ) : (
                  <span className="text-xs text-foreground/40 flex items-center gap-1.5">
                    <Activity size={14}/> Live Data
                  </span>
                )}
                <button 
                  onClick={() => toggleAnomaly(processor.id as ProcessorId)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-md transition-colors font-medium border flex-shrink-0",
                    activeAnomalies.includes(processor.id as ProcessorId) 
                      ? "bg-panel-border text-foreground hover:bg-panel-border/80 border-panel-border/50" 
                      : "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border-red-500/20"
                  )}
                  title="Toggle Failure Simulation"
                >
                  {activeAnomalies.includes(processor.id as ProcessorId) ? "Turn off outage" : "Simulate Outage"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
