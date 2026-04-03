# SiamTravel Real-Time Payment Monitor

A high-performance, real-time transaction health monitoring dashboard built with Next.js and Tailwind CSS. It is designed to give operations teams instant visibility into payment processor performance, tracking authorization rates and volume metrics dynamically.

## Features

- **Live Data Streaming**: A frontend-only simulation continuous transaction streams rendering updates without actual web sockets.
- **Dynamic Filtering**: Instantly drill down into authorization metrics by Geography (Region) and Payment Method.
- **Anomaly Simulation**: Inject artificial drops in processor performance to see how the dashboard behaves under "failing" conditions.
- **Historical Analysis Playback**: Travel back in time to simulate and scrutinize a past outage with timeline scrubbing.

## How the Engine Works 

### 1. Mock Data Generator (`src/lib/mockData.ts`)
The core behavior is powered by a custom `TransactionEmulator` class that behaves exactly like a live payment gateway log.
- **Processor Rules**: The system uses a predefined probability matrix (`PROCESSOR_CONFIG`). Processors like Stripe or 2C2P are given base authorization rates (e.g., 95%) and traffic weights. 
- **Generation Logic**: Based on weights, regions, and methods, it mathematically guesses if a generated transaction is `approved` or `declined`. 

### 2. The Real-Time Context (`src/context/TransactionContext.tsx`)
The React application hydration is handled by the `TransactionProvider`. 
- **The Loop**: It uses a `setInterval` that fires every 500ms to pull a fresh batch of transactions from the Emulator.
- **Memory Management**: New transactions are pushed to the front, and anything older than 6 hours is wiped off the stack to preserve browser memory.
- **Derived Metrics**: Health statuses (Healthy, Degraded, Failing) are parsed in real time based on the active rolling window data.

## Historical Playback Tool

The application ships with a **Playback Scrubber** that allows you to investigate past traffic out of the regular 6-hour bound.

**How does it work?**
1. You are not limited to inspecting data that was "recorded" while your session was active. You can pick **any date range in the past**.
2. When you hit "Load Snapshot", the `TransactionEmulator` takes your date range and mathematically simulates 3,000 new transactions spread precisely across that timeline on the fly.
3. **Safety Limits**: To prevent browser freezing, the difference between your selected start and end dates cannot exceed **7 days**.
4. **Easter Egg**: Because it's intended to simulate investigating an outage, calling `loadHistoricalData` actually injects an automatic **70% authorization rate drop on Stripe** precisely halfway through the date range you picked. Scrubbing over this period will visualize the outage happening!

## Getting Started

First, run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to monitor the streams!
