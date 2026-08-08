import axios from "axios";

import { useConnectionStore } from "../store/useConnectionStore";
import type {
  Account,
  AccountCreate,
  AccountInfo,
  AccountUpdate,
  Candle,
  LotPreview,
  LotPreviewRequest,
  Position,
  QuickTradeRequest,
  SymbolInfo,
  Timeframe,
  TradeResult,
} from "./types";

export const api = axios.create();

api.interceptors.request.use((config) => {
  const { apiUrl, apiToken } = useConnectionStore.getState();
  config.baseURL = apiUrl;
  if (apiToken) {
    config.headers.Authorization = `Bearer ${apiToken}`;
  }
  return config;
});

export function wsUrl(path: string): string {
  const { apiUrl, apiToken } = useConnectionStore.getState();
  const wsBase = apiUrl.replace(/^http/, "ws");
  const sep = path.includes("?") ? "&" : "?";
  return `${wsBase}${path}${sep}token=${encodeURIComponent(apiToken)}`;
}

export async function checkHealth(apiUrl: string) {
  const res = await axios.get(`${apiUrl}/health`);
  return res.data as { status: string; mock_mode: boolean };
}

export const accountsApi = {
  list: () => api.get<Account[]>("/accounts").then((r) => r.data),
  create: (body: AccountCreate) => api.post<Account>("/accounts", body).then((r) => r.data),
  update: (id: number, body: AccountUpdate) =>
    api.patch<Account>(`/accounts/${id}`, body).then((r) => r.data),
  remove: (id: number) => api.delete(`/accounts/${id}`),
  reconnect: (id: number) => api.post<Account>(`/accounts/${id}/reconnect`).then((r) => r.data),
  info: (id: number) => api.get<AccountInfo>(`/accounts/${id}/info`).then((r) => r.data),
  symbols: (id: number) => api.get<string[]>(`/accounts/${id}/symbols`).then((r) => r.data),
  symbolInfo: (id: number, symbol: string) =>
    api.get<SymbolInfo>(`/accounts/${id}/symbol-info`, { params: { symbol } }).then((r) => r.data),
  candles: (id: number, symbol: string, timeframe: Timeframe, count = 300) =>
    api
      .get<Candle[]>(`/accounts/${id}/candles`, { params: { symbol, timeframe, count } })
      .then((r) => r.data),
};

export const tradingApi = {
  lotPreview: (body: LotPreviewRequest) =>
    api.post<LotPreview>("/lot-preview", body).then((r) => r.data),
  trade: (body: QuickTradeRequest) =>
    api.post<TradeResult[]>("/trade", body).then((r) => r.data),
  positions: () => api.get<Position[]>("/positions").then((r) => r.data),
  closePosition: (account_id: number, ticket: number, volume?: number) =>
    api.post<TradeResult>("/positions/close", { account_id, ticket, volume }).then((r) => r.data),
  modifyPosition: (account_id: number, ticket: number, sl?: number, tp?: number) =>
    api.post<TradeResult>("/positions/modify", { account_id, ticket, sl, tp }).then((r) => r.data),
};
