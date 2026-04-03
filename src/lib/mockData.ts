import { Transaction, PaymentMethod, Country, ProcessorId } from "./types";

export const PROCESSORS: ProcessorId[] = ["stripe", "adyen", "promptpay", "grabpay", "shopeepay", "2c2p", "midtrans", "xendit"];
export const COUNTRIES: Country[] = ["TH", "VN", "ID"];
export const METHODS: PaymentMethod[] = ["credit_card", "e_wallet", "bank_transfer", "bnpl"];

export const PROCESSOR_CONFIG: Record<ProcessorId, { name: string, baseAuthRate: number, regions: Country[], methods: PaymentMethod[], trafficWeight: number }> = {
  stripe: { name: "Stripe", baseAuthRate: 0.95, regions: ["TH", "VN", "ID"], methods: ["credit_card"], trafficWeight: 100 },
  adyen: { name: "Adyen", baseAuthRate: 0.96, regions: ["TH", "VN", "ID"], methods: ["credit_card"], trafficWeight: 80 },
  promptpay: { name: "PromptPay", baseAuthRate: 0.98, regions: ["TH"], methods: ["bank_transfer"], trafficWeight: 150 },
  grabpay: { name: "GrabPay", baseAuthRate: 0.94, regions: ["TH", "VN", "ID"], methods: ["e_wallet"], trafficWeight: 120 },
  shopeepay: { name: "ShopeePay", baseAuthRate: 0.92, regions: ["TH", "VN", "ID"], methods: ["e_wallet"], trafficWeight: 110 },
  "2c2p": { name: "2C2P", baseAuthRate: 0.91, regions: ["TH", "VN"], methods: ["credit_card", "bank_transfer"], trafficWeight: 90 },
  midtrans: { name: "Midtrans", baseAuthRate: 0.93, regions: ["ID"], methods: ["credit_card", "bank_transfer", "e_wallet"], trafficWeight: 150 },
  xendit: { name: "Xendit", baseAuthRate: 0.94, regions: ["ID", "VN"], methods: ["bank_transfer", "e_wallet"], trafficWeight: 100 },
};

export class TransactionEmulator {
  private baseAuthRateModifiers: Record<ProcessorId, number>;
  public isAnomalyActive = false;

  constructor() {
    this.baseAuthRateModifiers = PROCESSORS.reduce((acc, p) => {
      acc[p] = 0;
      return acc;
    }, {} as Record<ProcessorId, number>);
  }

  triggerAnomaly(processor: ProcessorId, dropBy: number) {
    this.isAnomalyActive = true;
    this.baseAuthRateModifiers[processor] = -dropBy;
  }

  resetAnomaly() {
    this.isAnomalyActive = false;
    PROCESSORS.forEach(p => this.baseAuthRateModifiers[p] = 0);
  }

  generateBatch(count: number, timestampOverride?: number): Transaction[] {
    const transactions: Transaction[] = [];
    const now = timestampOverride || Date.now();

    for (let i = 0; i < count; i++) {
        const totalWeight = PROCESSORS.reduce((sum, p) => sum + PROCESSOR_CONFIG[p].trafficWeight, 0);
        let randomVal = Math.random() * totalWeight;
        let selectedProcessor: ProcessorId = PROCESSORS[0];
        
        for (const p of PROCESSORS) {
            randomVal -= PROCESSOR_CONFIG[p].trafficWeight;
            if (randomVal <= 0) {
                selectedProcessor = p;
                break;
            }
        }

        const config = PROCESSOR_CONFIG[selectedProcessor];
        
        const country = config.regions[Math.floor(Math.random() * config.regions.length)];
        const method = config.methods[Math.floor(Math.random() * config.methods.length)];
        
        const effectiveAuthRate = Math.max(0, config.baseAuthRate + this.baseAuthRateModifiers[selectedProcessor]);
        const status = Math.random() < effectiveAuthRate ? "approved" : "declined";

        transactions.push({
            id: Math.random().toString(36).substring(2, 9),
            timestamp: now - Math.floor(Math.random() * 1000), // slight jitter
            processor: selectedProcessor,
            method,
            country,
            amount: Math.floor(Math.random() * 5000) + 100, // $1 to $50 approx
            status
        });
    }

    return transactions;
  }

  generateHistoricalSequence(startMs: number, endMs: number, problemProcessor?: ProcessorId): Transaction[] {
      const txs: Transaction[] = [];
      const windowMs = endMs - startMs;
      // Approx 3000 transactions for performance 
      const count = 3000;
      const interval = windowMs / count;
      
      const midPoint = startMs + (windowMs / 2); // Fails exactly halfway through

      for (let i = 0; i < count; i++) {
          const timestamp = startMs + (i * interval);
          
          if (problemProcessor && timestamp > midPoint) {
              this.baseAuthRateModifiers[problemProcessor] = -0.70; // Massive drop
          } else if (problemProcessor) {
              this.baseAuthRateModifiers[problemProcessor] = 0;
          }

          const totalWeight = PROCESSORS.reduce((sum, p) => sum + PROCESSOR_CONFIG[p].trafficWeight, 0);
          let randomVal = Math.random() * totalWeight;
          let selectedProcessor: ProcessorId = PROCESSORS[0];
          for (const p of PROCESSORS) {
              randomVal -= PROCESSOR_CONFIG[p].trafficWeight;
              if (randomVal <= 0) {
                  selectedProcessor = p;
                  break;
              }
          }
          const config = PROCESSOR_CONFIG[selectedProcessor];
          const country = config.regions[Math.floor(Math.random() * config.regions.length)];
          const method = config.methods[Math.floor(Math.random() * config.methods.length)];
          
          const effectiveAuthRate = Math.max(0, config.baseAuthRate + this.baseAuthRateModifiers[selectedProcessor]);
          const status = Math.random() < effectiveAuthRate ? "approved" : "declined";

          txs.push({
              id: Math.random().toString(36).substring(2, 9),
              timestamp,
              processor: selectedProcessor,
              method,
              country,
              amount: Math.floor(Math.random() * 5000) + 100,
              status
          });
      }

      this.resetAnomaly(); // Clean up state
      return txs.sort((a,b) => a.timestamp - b.timestamp);
  }
}
