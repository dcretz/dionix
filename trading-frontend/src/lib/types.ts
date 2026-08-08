export interface Account {
  id: number;
  label: string;
  login: string;
  server: string;
  terminal_path: string | null;
  risk_percent: number;
  max_lot: number | null;
  include_in_trade_all: boolean;
  enabled: boolean;
  connected: boolean;
  created_at: string;
}

export interface AccountCreate {
  label: string;
  login: string;
  password: string;
  server: string;
  terminal_path?: string | null;
  risk_percent: number;
  max_lot?: number | null;
  include_in_trade_all: boolean;
  enabled: boolean;
}

export type AccountUpdate = Partial<AccountCreate>;

export interface AccountInfo {
  account_id: number;
  label: string;
  login: string;
  balance: number;
  equity: number;
  margin: number;
  margin_free: number;
  currency: string;
  leverage: number;
  server: string;
  connected: boolean;
  error: string | null;
}

export interface SymbolInfo {
  symbol: string;
  bid: number;
  ask: number;
  point: number;
  digits: number;
  volume_min: number;
  volume_max: number;
  volume_step: number;
  contract_size: number;
  tick_value: number;
  tick_size: number;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type Timeframe = "M1" | "M5" | "M15" | "M30" | "H1" | "H4" | "D1" | "W1" | "MN1";

export interface LotPreviewRequest {
  account_id: number;
  symbol: string;
  stop_loss_price: number;
  entry_price?: number | null;
  risk_percent?: number | null;
}

export interface LotPreview {
  account_id: number;
  label: string;
  symbol: string;
  risk_percent: number;
  balance: number;
  risk_amount: number;
  sl_distance: number;
  lot: number;
  capped: boolean;
  error: string | null;
}

export interface QuickTradeRequest {
  symbol: string;
  side: "buy" | "sell";
  scope: "single" | "all";
  account_id?: number | null;
  stop_loss_price?: number | null;
  take_profit_price?: number | null;
  risk_percent?: number | null;
  fixed_volume?: number | null;
}

export interface TradeResult {
  account_id: number;
  label: string;
  status: "filled" | "error";
  ticket?: number | null;
  volume?: number | null;
  price?: number | null;
  detail?: string | null;
}

export interface Position {
  account_id: number;
  label: string;
  ticket: number;
  symbol: string;
  side: "buy" | "sell";
  volume: number;
  price_open: number;
  price_current: number;
  sl: number;
  tp: number;
  profit: number;
  swap: number;
}

export interface Tick {
  account_id: number;
  symbol: string;
  bid: number;
  ask: number;
  time: number;
}
