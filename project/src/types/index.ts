export interface MEVTransaction {
  signature: string;
  timestamp: string;
  wallet: string;
  trade_path: string;
  platforms: string[];
  input_token: string;
  output_token: string;
  input_amount: number;
  output_amount: number;
  profit_usdc: number;
  is_mev: boolean;
  pattern?: string;
  confidence: number;
  explanation: string;
  gas_used: number;
  slot: number;
}

export interface MEVStats {
  total_transactions: number;
  mev_transactions: number;
  mev_percentage: number;
  total_profit: number;
  avg_profit: number;
  patterns: Record<string, number>;
  last_updated: string;
}

export interface FilterOptions {
  is_mev?: boolean;
  pattern?: string;
  min_profit?: number;
  timeframe?: string;
}