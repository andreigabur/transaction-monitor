export type PaymentMethod = "credit_card" | "e_wallet" | "bank_transfer" | "bnpl";
export type Country = "TH" | "VN" | "ID";
export type ProcessorStatus = "healthy" | "degraded" | "failing";
export type ProcessorId = "stripe" | "adyen" | "promptpay" | "grabpay" | "shopeepay" | "2c2p" | "midtrans" | "xendit";

export interface Transaction {
  id: string;
  timestamp: number;
  processor: ProcessorId;
  method: PaymentMethod;
  country: Country;
  amount: number;
  status: "approved" | "declined";
}

export interface ProcessorStats {
  id: ProcessorId;
  name: string;
  authRate: number;
  volume: number;
  status: ProcessorStatus;
  alerts: {
    authRateBreached: boolean;
    idleBreached: boolean;
  };
}
