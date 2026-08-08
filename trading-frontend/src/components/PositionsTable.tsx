import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { tradingApi } from "../lib/api";

export default function PositionsTable() {
  const qc = useQueryClient();
  const { data: positions } = useQuery({
    queryKey: ["positions"],
    queryFn: tradingApi.positions,
    refetchInterval: 3000,
  });

  const closeMutation = useMutation({
    mutationFn: ({ accountId, ticket }: { accountId: number; ticket: number }) =>
      tradingApi.closePosition(accountId, ticket),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["positions"] }),
  });

  const totalProfit = positions?.reduce((sum, p) => sum + p.profit, 0) ?? 0;

  return (
    <div className="border-t border-border">
      <div className="flex items-center justify-between px-4 py-2">
        <h3 className="text-sm font-medium">Poziții deschise</h3>
        <span className={`text-sm font-semibold ${totalProfit >= 0 ? "text-buy" : "text-sell"}`}>
          Total: {totalProfit.toFixed(2)}
        </span>
      </div>
      <div className="overflow-x-auto max-h-48">
        <table className="w-full text-xs">
          <thead className="text-muted text-left sticky top-0 bg-panel">
            <tr>
              <th className="px-4 py-1.5">Cont</th>
              <th className="px-2 py-1.5">Simbol</th>
              <th className="px-2 py-1.5">Sens</th>
              <th className="px-2 py-1.5">Volum</th>
              <th className="px-2 py-1.5">Deschis</th>
              <th className="px-2 py-1.5">Curent</th>
              <th className="px-2 py-1.5">SL</th>
              <th className="px-2 py-1.5">TP</th>
              <th className="px-2 py-1.5">P&amp;L</th>
              <th className="px-2 py-1.5"></th>
            </tr>
          </thead>
          <tbody>
            {positions?.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-3 text-muted">
                  Nicio poziție deschisă.
                </td>
              </tr>
            )}
            {positions?.map((p) => (
              <tr key={`${p.account_id}-${p.ticket}`} className="border-t border-border/60">
                <td className="px-4 py-1.5">{p.label}</td>
                <td className="px-2 py-1.5">{p.symbol}</td>
                <td className={`px-2 py-1.5 uppercase ${p.side === "buy" ? "text-buy" : "text-sell"}`}>{p.side}</td>
                <td className="px-2 py-1.5">{p.volume}</td>
                <td className="px-2 py-1.5">{p.price_open}</td>
                <td className="px-2 py-1.5">{p.price_current}</td>
                <td className="px-2 py-1.5">{p.sl || "-"}</td>
                <td className="px-2 py-1.5">{p.tp || "-"}</td>
                <td className={`px-2 py-1.5 font-medium ${p.profit >= 0 ? "text-buy" : "text-sell"}`}>{p.profit.toFixed(2)}</td>
                <td className="px-2 py-1.5">
                  <button
                    onClick={() => closeMutation.mutate({ accountId: p.account_id, ticket: p.ticket })}
                    className="text-[11px] px-2 py-0.5 rounded border border-border hover:bg-panel2"
                  >
                    Închide
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
