"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useMemo } from "react";
import { Transaction, PaymentMethod, Country, ProcessorId, ProcessorStats } from "../lib/types";
import { TransactionEmulator, PROCESSORS, PROCESSOR_CONFIG } from "../lib/mockData";

interface TransactionContextType {
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  stats: ProcessorStats[];
  countryFilter: Country | "ALL";
  methodFilter: PaymentMethod | "ALL";
  setCountryFilter: (c: Country | "ALL") => void;
  setMethodFilter: (m: PaymentMethod | "ALL") => void;
  activeAnomalies: ProcessorId[];
  toggleAnomaly: (processor: ProcessorId) => void;
  playbackTime: number | null;
  setPlaybackTime: React.Dispatch<React.SetStateAction<number | null>>;
  loadHistoricalData: (startMs: number, endMs: number) => void;
  clearHistoricalData: () => void;
  historicalTransactions: Transaction[] | null;
  alertThresholds: { minAuthRate: number, maxIdleMinutes: number };
  setAlertThresholds: React.Dispatch<React.SetStateAction<{ minAuthRate: number, maxIdleMinutes: number }>>;
  statsWindowMs: number;
  setStatsWindowMs: (ms: number) => void;
}

const TransactionContext = createContext<TransactionContextType | null>(null);

const MAX_WINDOW_MS = 6 * 60 * 60 * 1000; // 6 hours locally buffered
const BATCH_INTERVAL_MS = 500; // 2 updates per second for real-time feel
const BATCH_SIZE = 15;

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [countryFilter, setCountryFilter] = useState<Country | "ALL">("ALL");
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | "ALL">("ALL");
  const [activeAnomalies, setActiveAnomalies] = useState<ProcessorId[]>([]);
  const [playbackTime, setPlaybackTime] = useState<number | null>(null);
  const [historicalTransactions, setHistoricalTransactions] = useState<Transaction[] | null>(null);
  const [alertThresholds, setAlertThresholds] = useState({ minAuthRate: 0.85, maxIdleMinutes: 10 });
  const [statsWindowMs, setStatsWindowMs] = useState(60 * 1000); // default 1m
  
  const emulatorRef = useRef(new TransactionEmulator());

  useEffect(() => {
    // Generate initial history (6 hours back spanning ~3000 transactions)
    const now = Date.now();
    const initialData = emulatorRef.current.generateHistoricalSequence(now - MAX_WINDOW_MS, now);
    setTransactions(initialData.sort((a,b) => a.timestamp - b.timestamp));

    const interval = setInterval(() => {
      const newTx = emulatorRef.current.generateBatch(BATCH_SIZE);
      setTransactions((prev) => {
        const windowStart = Date.now() - MAX_WINDOW_MS;
        // keep recent data and append new
        return [...prev, ...newTx].filter(t => t.timestamp > windowStart);
      });
    }, BATCH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  const effectiveTransactions = useMemo(() => {
    const baseTx = historicalTransactions || transactions;
    if (playbackTime === null) return baseTx;
    return baseTx.filter(t => t.timestamp <= playbackTime);
  }, [transactions, historicalTransactions, playbackTime]);

  const filteredTransactions = useMemo(() => {
    return effectiveTransactions.filter(t => {
      if (countryFilter !== "ALL" && t.country !== countryFilter) return false;
      if (methodFilter !== "ALL" && t.method !== methodFilter) return false;
      return true;
    });
  }, [effectiveTransactions, countryFilter, methodFilter]);

  const stats = useMemo(() => {
    const statsMap: Record<ProcessorId, { total: number, approved: number, lastTxTime: number }> = PROCESSORS.reduce((acc, p) => {
        acc[p] = { total: 0, approved: 0, lastTxTime: 0 };
        return acc;
    }, {} as Record<ProcessorId, { total: number, approved: number, lastTxTime: number }>);

    const currentTime = playbackTime || Date.now();
    const statsWindowStart = currentTime - statsWindowMs;

    filteredTransactions.forEach(t => {
      // Only include transactions within the dynamic sliding window relative to 'currentTime'
      if (t.timestamp >= statsWindowStart && t.timestamp <= currentTime && statsMap[t.processor]) {
          statsMap[t.processor].total++;
          if (t.status === "approved") {
              statsMap[t.processor].approved++;
          }
          if (t.timestamp > statsMap[t.processor].lastTxTime) {
              statsMap[t.processor].lastTxTime = t.timestamp;
          }
      }
    });

    return PROCESSORS.map(p => {
        const data = statsMap[p];
        const authRate = data.total > 0 ? (data.approved / data.total) : 0;
        
        let status: "healthy" | "degraded" | "failing" = "healthy";
        // Thresholds based on mock data base rates: healthy is typically 91-98%
        if (authRate > 0 && authRate < 0.6) status = "failing";
        else if (authRate > 0 && authRate < 0.85) status = "degraded";

        const idleTimeMs = currentTime - data.lastTxTime;
        const isIdleBreached = (data.lastTxTime === 0 && data.total === 0) || (idleTimeMs > alertThresholds.maxIdleMinutes * 60 * 1000);
        const isAuthBreached = data.total > 0 && authRate < alertThresholds.minAuthRate;

        return {
            id: p,
            name: PROCESSOR_CONFIG[p].name,
            authRate,
            volume: data.total,
            status: data.total === 0 ? "healthy" : status, // "healthy" if no volume, or could be "idle"
            alerts: {
                authRateBreached: isAuthBreached,
                idleBreached: isIdleBreached
            }
        };
    });
  }, [filteredTransactions, playbackTime, alertThresholds]);

  const toggleAnomaly = (p: ProcessorId) => {
    setActiveAnomalies(prev => {
      if (prev.includes(p)) {
        emulatorRef.current.triggerAnomaly(p, 0); // remove drop
        return prev.filter(id => id !== p);
      } else {
        emulatorRef.current.triggerAnomaly(p, 0.6); // 60% drop
        return [...prev, p];
      }
    });
  };

  const loadHistoricalData = (startMs: number, endMs: number) => {
    // Inject anomaly on "stripe" processor perfectly in the middle of our custom range
    const txs = emulatorRef.current.generateHistoricalSequence(startMs, endMs, "stripe");
    setHistoricalTransactions(txs);
    setPlaybackTime(startMs); // Start at the beginning of the bounds
  };

  const clearHistoricalData = () => {
    setHistoricalTransactions(null);
    setPlaybackTime(null);
  };

  return (
    <TransactionContext.Provider value={{
      transactions,
      filteredTransactions,
      stats,
      countryFilter,
      methodFilter,
      setCountryFilter,
      setMethodFilter,
      activeAnomalies,
      toggleAnomaly,
      playbackTime,
      setPlaybackTime,
      loadHistoricalData,
      clearHistoricalData,
      historicalTransactions,
      alertThresholds,
      setAlertThresholds,
      statsWindowMs,
      setStatsWindowMs
    }}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (!context) throw new Error("useTransactions must be used within TransactionProvider");
  return context;
}
