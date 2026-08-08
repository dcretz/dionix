import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { tradingApi } from "../lib/api";
import type { Account, TradeResult } from "../lib/types";

interface Props {
  accounts: Account[];
  selectedAccountId: number | null;
  scope: "single" | "all";
  onScopeChange: (s: "single" | "all") => void;
  onAccountChange: (id: number) => void;
  symbol: string;
  sl: number | null;
  tp: number | null;
  onSlChange: (v: number | null) => void;
  onTpChange: (v: number | null) => void;
  pickMode: "sl" | "tp" | null;
  onPickModeChange: (m: "sl" | "tp" | null) => void;
}

export default function QuickTradePanel({
  accounts,
  selectedAccountId,
  scope,
  onScopeChange,
  onAccountChange,
  symbol,
  sl,
  tp,
  onSlChange,
  onTpChange,
  pickMode,
  onPickModeChange,
}: Props) {
  const qc = useQueryClient();
  const [riskOverride, setRiskOverride] = useState<string>("");
  const [lastResults, setLastResults] = useState<TradeResult[] | null>(null);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) ?? null;
  const effectiveRisk = riskOverride ? Number(riskOverride) : selectedAccount?.risk_percent ?? null;

  const { data: preview, isFetching: previewLoading } = useQuery({
    queryKey: ["lot-preview", selectedAccountId, symbol, sl, effectiveRisk],
    queryFn: () =>
      tradingApi.lotPreview({
        account_id: selectedAccountId as number,
        symbol,
        stop_loss_price: sl as number,
        risk_percent: effectiveRisk,
      }),
    enabled: !!selectedAccountId && !!symbol && sl !== null,
  });

  const tradeMutation = useMutation({
    mutationFn: (side: "buy" | "sell") =>
      tradingApi.trade({
        symbol,
        side,
        scope,
        account_id: scope === "single" ? selectedAccountId : null,
        stop_loss_price: sl,
        take_profit_price: tp,
        risk_percent: riskOverride ? Number(riskOverride) : null,
      }),
    onSuccess: (results) => {
      setLastResults(results);
      qc.invalidateQueries({ queryKey: ["positions"] });
    },
  });

  const tradeAllAccounts = accounts.filter((a) => a.include_in_trade_all && a.enabled);

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      <div>
        <p className="text-xs text-muted mb-1">Scop tranzacție</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onScopeChange("single")}
            className={`rounded-md py-1.5 text-sm border ${scope === "single" ? "border-accent bg-panel2" : "border-border text-muted"}`}
          >
            Cont individual
          </button>
          <button
            onClick={() => onScopeChange("all")}
            className={`rounded-md py-1.5 text-sm border ${scope === "all" ? "border-accent bg-panel2" : "border-border text-muted"}`}
          >
            Toate conturile
          </button>
        </div>
      </div>

      {scope === "single" ? (
        <div>
          <p className="text-xs text-muted mb-1">Cont</p>
          <select
            className="input"
            value={selectedAccountId ?? ""}
            onChange={(e) => onAccountChange(Number(e.target.value))}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label} {a.connected ? "" : "(deconectat)"}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="text-xs text-muted rounded-md border border-border bg-panel2 p-2">
          Se va tranzacționa pe {tradeAllAccounts.length} cont(uri) marcate „trade-all”:{" "}
          {tradeAllAccounts.map((a) => a.label).join(", ") || "niciunul"}
        </div>
      )}

      <div>
        <p className="text-xs text-muted mb-1">Risc / tranzacție (%)</p>
        <input
          className="input"
          type="number"
          step="0.01"
          min="0.01"
          max="100"
          placeholder={selectedAccount ? `implicit: ${selectedAccount.risk_percent}%` : "%"}
          value={riskOverride}
          onChange={(e) => setRiskOverride(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <PriceField
          label="Stop Loss"
          value={sl}
          onChange={onSlChange}
          picking={pickMode === "sl"}
          onTogglePick={() => onPickModeChange(pickMode === "sl" ? null : "sl")}
          color="text-sell"
        />
        <PriceField
          label="Take Profit"
          value={tp}
          onChange={onTpChange}
          picking={pickMode === "tp"}
          onTogglePick={() => onPickModeChange(pickMode === "tp" ? null : "tp")}
          color="text-buy"
        />
      </div>

      <div className="rounded-md border border-border bg-panel2 p-3 text-sm space-y-1">
        <p className="text-xs text-muted">Lot calculat automat (risc %)</p>
        {sl === null && <p className="text-muted">Setează Stop Loss pentru calculul lotului.</p>}
        {previewLoading && <p className="text-muted">Se calculează...</p>}
        {preview && !preview.error && (
          <>
            <p className="text-lg font-semibold">{preview.lot} loturi</p>
            <p className="text-xs text-muted">
              Risc: {preview.risk_amount.toFixed(2)} ({preview.risk_percent}% din {preview.balance.toFixed(2)})
              {preview.capped && " · limitat de min/max broker"}
            </p>
          </>
        )}
        {preview?.error && <p className="text-sell text-xs">{preview.error}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-auto">
        <button
          disabled={tradeMutation.isPending || (scope === "single" && !selectedAccountId)}
          onClick={() => tradeMutation.mutate("buy")}
          className="rounded-lg bg-buy py-4 text-lg font-bold disabled:opacity-50"
        >
          BUY
        </button>
        <button
          disabled={tradeMutation.isPending || (scope === "single" && !selectedAccountId)}
          onClick={() => tradeMutation.mutate("sell")}
          className="rounded-lg bg-sell py-4 text-lg font-bold disabled:opacity-50"
        >
          SELL
        </button>
      </div>

      {lastResults && (
        <div className="rounded-md border border-border p-2 text-xs space-y-1">
          {lastResults.map((r, i) => (
            <p key={i} className={r.status === "filled" ? "text-buy" : "text-sell"}>
              {r.label}: {r.status === "filled" ? `#${r.ticket} · ${r.volume} loturi @ ${r.price}` : r.detail}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function PriceField({
  label,
  value,
  onChange,
  picking,
  onTogglePick,
  color,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  picking: boolean;
  onTogglePick: () => void;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className={`text-xs ${color}`}>{label}</p>
        <button
          onClick={onTogglePick}
          className={`text-[10px] px-1.5 py-0.5 rounded border ${picking ? "border-accent text-accent" : "border-border text-muted"}`}
        >
          {picking ? "click pe grafic..." : "alege pe grafic"}
        </button>
      </div>
      <input
        className="input"
        type="number"
        step="any"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      />
    </div>
  );
}
