import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { accountsApi, tradingApi } from "../lib/api";
import PositionsTable from "../components/PositionsTable";
import PriceChart from "../components/PriceChart";
import QuickTradePanel from "../components/QuickTradePanel";
import { useFavoritesStore } from "../store/useFavoritesStore";
import type { Timeframe } from "../lib/types";

const TIMEFRAMES: Timeframe[] = ["M1", "M5", "M15", "M30", "H1", "H4", "D1"];
const LS_SCOPE = "trading.scope";
const LS_SYMBOL = "trading.symbol";
const LS_TIMEFRAME = "trading.timeframe";
const LS_ACCOUNT = "trading.accountId";

export default function Dashboard() {
  const { data: accounts } = useQuery({ queryKey: ["accounts"], queryFn: accountsApi.list, refetchInterval: 5000 });
  const { favorites, toggleFavorite, isFavorite } = useFavoritesStore();

  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(() => {
    const saved = localStorage.getItem(LS_ACCOUNT);
    return saved ? Number(saved) : null;
  });
  const [scope, setScope] = useState<"single" | "all">(
    () => (localStorage.getItem(LS_SCOPE) as "single" | "all" | null) ?? "single",
  );
  const [symbol, setSymbol] = useState(() => localStorage.getItem(LS_SYMBOL) ?? "EURUSD");
  const [timeframe, setTimeframe] = useState<Timeframe>(
    () => (localStorage.getItem(LS_TIMEFRAME) as Timeframe | null) ?? "M15",
  );
  const [sl, setSl] = useState<number | null>(null);
  const [tp, setTp] = useState<number | null>(null);
  const [pickMode, setPickMode] = useState<"sl" | "tp" | null>(null);

  useEffect(() => {
    if (!accounts || accounts.length === 0) return;
    if (selectedAccountId && accounts.some((a) => a.id === selectedAccountId)) return;
    setSelectedAccountId(accounts[0].id);
  }, [accounts, selectedAccountId]);

  useEffect(() => {
    if (selectedAccountId != null) localStorage.setItem(LS_ACCOUNT, String(selectedAccountId));
  }, [selectedAccountId]);

  useEffect(() => {
    localStorage.setItem(LS_SYMBOL, symbol);
  }, [symbol]);

  useEffect(() => {
    localStorage.setItem(LS_TIMEFRAME, timeframe);
  }, [timeframe]);

  const { data: symbols } = useQuery({
    queryKey: ["symbols", selectedAccountId],
    queryFn: () => accountsApi.symbols(selectedAccountId as number),
    enabled: !!selectedAccountId,
  });

  const { data: accountInfo } = useQuery({
    queryKey: ["account-info", selectedAccountId],
    queryFn: () => accountsApi.info(selectedAccountId as number),
    enabled: !!selectedAccountId,
    refetchInterval: 4000,
  });

  const { data: positions } = useQuery({
    queryKey: ["positions"],
    queryFn: tradingApi.positions,
    refetchInterval: 3000,
  });

  const chartPositions = useMemo(
    () => (positions ?? []).filter((p) => p.account_id === selectedAccountId && p.symbol === symbol),
    [positions, selectedAccountId, symbol],
  );

  function handlePickPrice(price: number) {
    if (pickMode === "sl") setSl(Number(price.toFixed(6)));
    if (pickMode === "tp") setTp(Number(price.toFixed(6)));
    setPickMode(null);
  }

  if (accounts && accounts.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-4">
        <p className="text-lg">Nu ai niciun cont MT5 adăugat încă.</p>
        <Link to="/accounts" className="rounded-md bg-accent px-4 py-2 text-sm font-medium">
          Adaugă primul cont
        </Link>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-2 flex-wrap">
        <select className="input w-auto" value={symbol} onChange={(e) => setSymbol(e.target.value)}>
          {(symbols ?? [symbol]).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          onClick={() => toggleFavorite(symbol)}
          title={isFavorite(symbol) ? "Scoate din favorite" : "Adaugă la favorite"}
          className={`text-lg leading-none ${isFavorite(symbol) ? "text-yellow-400" : "text-muted hover:text-yellow-400"}`}
        >
          {isFavorite(symbol) ? "★" : "☆"}
        </button>
        {favorites.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {favorites.map((fav) => {
              const available = !symbols || symbols.includes(fav);
              return (
                <button
                  key={fav}
                  disabled={!available}
                  onClick={() => setSymbol(fav)}
                  title={available ? undefined : "Indisponibil pe contul selectat"}
                  className={`px-2 py-1 rounded text-xs border ${
                    !available
                      ? "border-border text-muted/40 cursor-not-allowed line-through"
                      : symbol === fav
                        ? "bg-accent border-accent text-white"
                        : "border-border text-muted hover:text-white hover:border-white/30"
                  }`}
                >
                  {fav}
                </button>
              );
            })}
          </div>
        )}
        <div className="flex gap-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2 py-1 rounded text-xs ${timeframe === tf ? "bg-panel2 text-white" : "text-muted hover:text-white"}`}
            >
              {tf}
            </button>
          ))}
        </div>
        {accountInfo && (
          <div className="ml-auto flex gap-4 text-xs text-muted">
            <span>
              Balanță: <b className="text-white">{accountInfo.balance.toFixed(2)} {accountInfo.currency}</b>
            </span>
            <span>
              Echitate: <b className="text-white">{accountInfo.equity.toFixed(2)}</b>
            </span>
            <span className={accountInfo.connected ? "text-buy" : "text-sell"}>
              {accountInfo.connected ? "conectat" : accountInfo.error ?? "deconectat"}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0">
          <PriceChart
            accountId={selectedAccountId}
            symbol={symbol}
            timeframe={timeframe}
            positions={chartPositions}
            pendingSl={sl}
            pendingTp={tp}
            pickMode={pickMode}
            onPickPrice={handlePickPrice}
            currency={accountInfo?.currency ?? ""}
          />
        </div>
        <div className="w-80 border-l border-border shrink-0">
          <QuickTradePanel
            accounts={accounts ?? []}
            selectedAccountId={selectedAccountId}
            scope={scope}
            onScopeChange={(next) => {
              localStorage.setItem(LS_SCOPE, next);
              setScope(next);
            }}
            onAccountChange={setSelectedAccountId}
            symbol={symbol}
            sl={sl}
            tp={tp}
            onSlChange={setSl}
            onTpChange={setTp}
            pickMode={pickMode}
            onPickModeChange={setPickMode}
          />
        </div>
      </div>

      <PositionsTable />
    </div>
  );
}
