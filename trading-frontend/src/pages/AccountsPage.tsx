import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { accountsApi } from "../lib/api";
import type { Account, AccountCreate } from "../lib/types";

const emptyForm: AccountCreate = {
  label: "",
  login: "",
  password: "",
  server: "",
  terminal_path: "",
  risk_percent: 1,
  max_lot: null,
  include_in_trade_all: true,
  enabled: true,
};

export default function AccountsPage() {
  const qc = useQueryClient();
  const { data: accounts, isLoading } = useQuery({ queryKey: ["accounts"], queryFn: accountsApi.list, refetchInterval: 5000 });
  const [form, setForm] = useState<AccountCreate>(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const createMutation = useMutation({
    mutationFn: accountsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      setForm(emptyForm);
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<AccountCreate> }) => accountsApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });

  const removeMutation = useMutation({
    mutationFn: accountsApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });

  const reconnectMutation = useMutation({
    mutationFn: accountsApi.reconnect,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Conturi MT5</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium"
        >
          {showForm ? "Anulează" : "+ Adaugă cont"}
        </button>
      </div>

      {showForm && (
        <form
          className="rounded-xl border border-border bg-panel p-4 grid grid-cols-2 gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(form);
          }}
        >
          <Field label="Nume (etichetă)">
            <input className="input" required value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          </Field>
          <Field label="Login MT5">
            <input className="input" required value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} />
          </Field>
          <Field label="Parolă">
            <input
              className="input"
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Field>
          <Field label="Server broker">
            <input className="input" required value={form.server} onChange={(e) => setForm({ ...form, server: e.target.value })} />
          </Field>
          <Field label="Cale terminal (Windows, opțional)">
            <input
              className="input"
              placeholder="C:\MT5-Account1\terminal64.exe"
              value={form.terminal_path ?? ""}
              onChange={(e) => setForm({ ...form, terminal_path: e.target.value })}
            />
          </Field>
          <Field label="Risc implicit / tranzacție (%)">
            <input
              className="input"
              type="number"
              step="0.01"
              min="0.01"
              max="100"
              required
              value={form.risk_percent}
              onChange={(e) => setForm({ ...form, risk_percent: Number(e.target.value) })}
            />
          </Field>
          <Field label="Lot maxim (opțional)">
            <input
              className="input"
              type="number"
              step="0.01"
              value={form.max_lot ?? ""}
              onChange={(e) => setForm({ ...form, max_lot: e.target.value ? Number(e.target.value) : null })}
            />
          </Field>
          <div className="flex items-center gap-2 mt-6">
            <input
              id="trade-all"
              type="checkbox"
              checked={form.include_in_trade_all}
              onChange={(e) => setForm({ ...form, include_in_trade_all: e.target.checked })}
            />
            <label htmlFor="trade-all" className="text-sm">
              Include în „tranzacționează pe toate conturile”
            </label>
          </div>
          <div className="col-span-2">
            <button type="submit" disabled={createMutation.isPending} className="rounded-md bg-buy px-4 py-2 text-sm font-medium">
              {createMutation.isPending ? "Se salvează..." : "Salvează cont"}
            </button>
            {createMutation.isError && (
              <span className="text-sell text-sm ml-3">Eroare la salvare.</span>
            )}
          </div>
        </form>
      )}

      <div className="rounded-xl border border-border bg-panel divide-y divide-border">
        {isLoading && <p className="p-4 text-muted text-sm">Se încarcă...</p>}
        {accounts?.length === 0 && <p className="p-4 text-muted text-sm">Niciun cont adăugat încă.</p>}
        {accounts?.map((a) => (
          <AccountRow
            key={a.id}
            account={a}
            onToggleEnabled={() => updateMutation.mutate({ id: a.id, body: { enabled: !a.enabled } })}
            onToggleTradeAll={() =>
              updateMutation.mutate({ id: a.id, body: { include_in_trade_all: !a.include_in_trade_all } })
            }
            onRiskChange={(risk_percent) => updateMutation.mutate({ id: a.id, body: { risk_percent } })}
            onReconnect={() => reconnectMutation.mutate(a.id)}
            onDelete={() => {
              if (confirm(`Ștergi contul „${a.label}”?`)) removeMutation.mutate(a.id);
            }}
          />
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-muted text-xs">{label}</span>
      {children}
    </label>
  );
}

function AccountRow({
  account,
  onToggleEnabled,
  onToggleTradeAll,
  onRiskChange,
  onReconnect,
  onDelete,
}: {
  account: Account;
  onToggleEnabled: () => void;
  onToggleTradeAll: () => void;
  onRiskChange: (v: number) => void;
  onReconnect: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="p-4 flex items-center gap-4 flex-wrap">
      <span className={`h-2.5 w-2.5 rounded-full ${account.connected ? "bg-buy" : "bg-sell"}`} title={account.connected ? "Conectat" : "Deconectat"} />
      <div className="min-w-[140px]">
        <p className="font-medium">{account.label}</p>
        <p className="text-xs text-muted">
          {account.login} @ {account.server}
        </p>
      </div>

      <label className="flex items-center gap-1 text-xs text-muted">
        Risc %
        <input
          type="number"
          step="0.01"
          min="0.01"
          max="100"
          defaultValue={account.risk_percent}
          onBlur={(e) => onRiskChange(Number(e.target.value))}
          className="input w-20 py-1"
        />
      </label>

      <label className="flex items-center gap-1 text-xs">
        <input type="checkbox" checked={account.include_in_trade_all} onChange={onToggleTradeAll} />
        trade-all
      </label>

      <label className="flex items-center gap-1 text-xs">
        <input type="checkbox" checked={account.enabled} onChange={onToggleEnabled} />
        activ
      </label>

      <div className="ml-auto flex gap-2">
        <button onClick={onReconnect} className="text-xs px-2 py-1 rounded-md border border-border hover:bg-panel2">
          Reconectează
        </button>
        <button onClick={onDelete} className="text-xs px-2 py-1 rounded-md border border-border text-sell hover:bg-panel2">
          Șterge
        </button>
      </div>
    </div>
  );
}
