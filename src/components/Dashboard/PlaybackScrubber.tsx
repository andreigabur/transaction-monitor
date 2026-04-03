"use client";

import React, { useEffect, useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { Play, Pause, X, Clock, Calendar as CalendarIcon, DownloadCloud, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PlaybackScrubber({ onClose }: { onClose: () => void }) {
    const { 
        historicalTransactions, 
        playbackTime, 
        setPlaybackTime, 
        loadHistoricalData, 
        clearHistoricalData 
    } = useTransactions();
    
    const [isPlaying, setIsPlaying] = useState(false);
    
    const [startDate, setStartDate] = useState<Date | undefined>(new Date());
    const [startTime, setStartTime] = useState("00:00");
    const [endDate, setEndDate] = useState<Date | undefined>(new Date());
    const [endTime, setEndTime] = useState("01:00");

    const oldestTimestamp = historicalTransactions && historicalTransactions.length > 0 
        ? historicalTransactions[0].timestamp 
        : Date.now() - 300000;
        
    const newestTimestamp = historicalTransactions && historicalTransactions.length > 0 
        ? historicalTransactions[historicalTransactions.length - 1].timestamp 
        : Date.now();

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying) {
            interval = setInterval(() => {
                setPlaybackTime(prev => {
                    if (prev === null) return newestTimestamp;
                    const speed = 100; 
                    const next = prev + speed; 
                    if (next >= newestTimestamp) {
                        return newestTimestamp;
                    }
                    return next;
                });
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isPlaying, newestTimestamp, oldestTimestamp, setPlaybackTime]);

    useEffect(() => {
        if (isPlaying && playbackTime !== null && playbackTime >= newestTimestamp) {
            setIsPlaying(false);
        }
    }, [playbackTime, isPlaying, newestTimestamp]);

    const handleClose = () => {
        clearHistoricalData();
        setIsPlaying(false);
        onClose();
    };

    const handleLoad = () => {
        if (!startDate || !endDate) return window.alert("Select valid dates");
        const startDayStr = format(startDate, 'yyyy-MM-dd');
        const endDayStr = format(endDate, 'yyyy-MM-dd');

        const startMs = new Date(`${startDayStr}T${startTime}`).getTime();
        const endMs = new Date(`${endDayStr}T${endTime}`).getTime();
        if (startMs >= endMs) return window.alert("Start time must be before End time.");
        if (endMs - startMs > 1000 * 60 * 60 * 24 * 7) return window.alert("Max custom range is 7 days.");
        
        loadHistoricalData(startMs, endMs);
    };

    if (!historicalTransactions) {
        return (
            <div className="bg-panel border-2 border-accent shadow-[0_0_20px_rgba(99,102,241,0.3)] rounded-xl p-5 flex flex-col gap-6 animate-in fade-in slide-in-from-top-2 transition-all">
                <div className="flex justify-between items-center border-b border-panel-border pb-3">
                    <div className="flex items-center gap-2 text-accent font-bold text-sm uppercase tracking-wider">
                        <CalendarIcon size={18} /> Select Past Time Range
                    </div>
                    <button onClick={handleClose} className="text-foreground/50 hover:text-white p-1 transition-colors" title="Cancel">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="flex flex-col xl:flex-row xl:items-end gap-6 w-full">
                    {/* START BOUNDARY */}
                    <div className="flex flex-col flex-1 w-full gap-2">
                        <label className="text-xs text-foreground/50 font-semibold uppercase tracking-wide">Start Date & Time</label>
                        <div className="flex gap-2 w-full">
                            <Popover>
                              <PopoverTrigger render={
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "flex-1 shrink justify-start text-left font-normal bg-background border-panel-border text-foreground hover:bg-accent/20 hover:text-accent shadow-none h-10 min-w-0 font-medium",
                                    !startDate && "text-muted-foreground"
                                  )}
                                />
                              }>
                                <CalendarIcon className="mr-2 h-4 w-4 opacity-70 shrink-0" />
                                <span className="truncate">{startDate ? format(startDate, "MMM do, yyyy") : "Pick a date"}</span>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 bg-panel border-panel-border text-foreground" align="start">
                                <Calendar
                                  mode="single"
                                  selected={startDate}
                                  onSelect={setStartDate}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <input 
                                type="time" 
                                className="bg-background border border-panel-border text-foreground text-sm rounded-lg focus:ring-accent focus:border-accent block w-28 sm:w-32 px-3 outline-none transition-all shadow-none h-10 shrink-0 font-medium"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className="hidden xl:flex items-center text-foreground/50 mb-2">
                        <ArrowRight size={20} />
                    </div>

                    {/* END BOUNDARY */}
                    <div className="flex flex-col flex-1 w-full gap-2">
                        <label className="text-xs text-foreground/50 font-semibold uppercase tracking-wide">End Date & Time</label>
                        <div className="flex gap-2 w-full">
                            <Popover>
                              <PopoverTrigger render={
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "flex-1 shrink justify-start text-left font-normal bg-background border-panel-border text-foreground hover:bg-accent/20 hover:text-accent shadow-none h-10 min-w-0 font-medium",
                                    !endDate && "text-muted-foreground"
                                  )}
                                />
                              }>
                                <CalendarIcon className="mr-2 h-4 w-4 opacity-70 shrink-0" />
                                <span className="truncate">{endDate ? format(endDate, "MMM do, yyyy") : "Pick a date"}</span>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 bg-panel border-panel-border text-foreground" align="start">
                                <Calendar
                                  mode="single"
                                  selected={endDate}
                                  onSelect={setEndDate}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <input 
                                type="time" 
                                className="bg-background border border-panel-border text-foreground text-sm rounded-lg focus:ring-accent focus:border-accent block w-28 sm:w-32 px-3 outline-none transition-all shadow-none h-10 shrink-0 font-medium"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                            />
                        </div>
                    </div>

                    <button 
                        onClick={handleLoad}
                        className="bg-accent text-white px-5 py-2 rounded-lg flex items-center justify-center gap-2 font-bold hover:bg-accent-hover transition-colors shadow-lg hover:shadow-accent/50 w-full xl:w-auto h-10"
                    >
                        <DownloadCloud size={18} /> Load Snapshot
                    </button>
                </div>
            </div>
        );
    }

    const currentValue = playbackTime || newestTimestamp;

    return (
        <div className="bg-panel border-2 border-accent shadow-[0_0_20px_rgba(99,102,241,0.3)] rounded-xl p-5 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 transition-all">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-accent font-bold text-sm uppercase tracking-wider">
                    <Clock size={16} /> Historical Playback Active
                </div>
                <div className="flex gap-3">
                    <button onClick={() => clearHistoricalData()} className="text-xs font-semibold px-3 py-1 border border-panel-border text-foreground/80 rounded hover:bg-panel-border/80 transition-colors">
                        Change Date Range
                    </button>
                    <button onClick={handleClose} className="text-foreground/50 hover:text-white p-1 transition-colors" title="Resume Live Mode">
                        <X size={20} />
                    </button>
                </div>
            </div>
            
            <div className="flex items-center gap-5">
                <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-12 h-12 flex-shrink-0 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent-hover transition-colors shadow-lg"
                    title={isPlaying ? "Pause Playback" : "Start Playback"}
                >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
                </button>

                <div className="flex-1 flex flex-col gap-3 relative">
                    <div className="flex justify-between text-xs text-foreground/50 font-mono">
                        <span>{format(new Date(oldestTimestamp), 'MMM dd, HH:mm')}</span>
                        <span className="text-white bg-accent px-3 py-1 rounded font-bold shadow-md transform -translate-y-1">
                            Viewing: {format(new Date(currentValue), 'MMM dd, HH:mm:ss')}
                        </span>
                        <span>{format(new Date(newestTimestamp), 'MMM dd, HH:mm')}</span>
                    </div>
                    <input 
                        type="range"
                        min={oldestTimestamp}
                        max={newestTimestamp}
                        step={1000}
                        value={currentValue}
                        onChange={(e) => {
                            setIsPlaying(false);
                            setPlaybackTime(Number(e.target.value));
                        }}
                        className="w-full h-2.5 rounded-lg appearance-none cursor-pointer transition-colors outline-none"
                        style={{ background: '#2a304a' }}
                    />
                </div>
            </div>
        </div>
    );
}
