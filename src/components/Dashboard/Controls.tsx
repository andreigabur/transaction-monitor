"use client";

import React from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { COUNTRIES, METHODS } from '../../lib/mockData';
import { PaymentMethod, Country } from '../../lib/types';
import { Filter, Globe, CreditCard } from 'lucide-react';

export function Controls() {
  const { countryFilter, methodFilter, setCountryFilter, setMethodFilter } = useTransactions();

  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 bg-panel border border-panel-border rounded-xl">
      <div className="flex items-center gap-2 mr-4">
        <Filter size={18} className="text-accent" />
        <span className="font-semibold text-foreground">Traffic Filters</span>
      </div>

      <div className="flex items-center gap-3">
        <Globe size={16} className="text-foreground/50" />
        <select 
          className="bg-background border border-panel-border text-foreground text-sm rounded-lg focus:ring-accent focus:border-accent block w-full p-2.5 outline-none transition-all"
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value as Country | "ALL")}
        >
          <option value="ALL">All Regions</option>
          {COUNTRIES.map(c => <option key={c} value={c}>{c === "TH" ? "Thailand (TH)" : c === "VN" ? "Vietnam (VN)" : "Indonesia (ID)"}</option>)}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <CreditCard size={16} className="text-foreground/50" />
        <select 
          className="bg-background border border-panel-border text-foreground text-sm rounded-lg focus:ring-accent focus:border-accent block w-full p-2.5 outline-none transition-all"
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value as PaymentMethod | "ALL")}
        >
          <option value="ALL">All Payment Methods</option>
          {METHODS.map(m => (
            <option key={m} value={m}>
              {m.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
