import { useState, type ReactNode } from "react";

import { checkHealth } from "../lib/api";
import { useConnectionStore } from "../store/useConnectionStore";

export default function ConnectGate({ children }: { children: ReactNode }) {
  const { apiUrl, apiToken, setConnection } = useConnectionStore();
  const [url, setUrl] = useState(apiUrl);
  const [token, setToken] = useState(apiToken);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  if (apiToken) {
    return <>{children}</>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setChecking(true);
    setError(null);
    try {
      await checkHealth(url.replace(/\/$/, ""));
      setConnection(url.replace(/\/$/, ""), token);
    } catch {
      setError("Nu pot contacta backend-ul la acest URL. Verifică adresa și că serverul rulează.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-border bg-panel p-6 space-y-4"
      >
        <div>
          <h1 className="text-lg font-semibold">Conectare backend trading</h1>
          <p className="text-sm text-muted mt-1">
            Introdu adresa API-ului trading-backend și token-ul (TRADING_API_TOKEN din .env).
          </p>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted">URL Backend</label>
          <input
            className="w-full rounded-md bg-panel2 border border-border px-3 py-2 outline-none focus:border-accent"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="http://localhost:8000"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted">API Token</label>
          <input
            className="w-full rounded-md bg-panel2 border border-border px-3 py-2 outline-none focus:border-accent"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="TRADING_API_TOKEN"
          />
        </div>
        {error && <p className="text-sm text-sell">{error}</p>}
        <button
          type="submit"
          disabled={checking || !url || !token}
          className="w-full rounded-md bg-accent py-2 font-medium disabled:opacity-50"
        >
          {checking ? "Se conectează..." : "Conectează"}
        </button>
      </form>
    </div>
  );
}
