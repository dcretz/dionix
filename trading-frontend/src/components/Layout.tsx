import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

import { useConnectionStore } from "../store/useConnectionStore";

export default function Layout({ children }: { children: ReactNode }) {
  const clear = useConnectionStore((s) => s.clear);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-6">
          <span className="font-semibold tracking-tight">Dionix Trading</span>
          <nav className="flex gap-1 text-sm">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md ${isActive ? "bg-panel2 text-white" : "text-muted hover:text-white"}`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/accounts"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md ${isActive ? "bg-panel2 text-white" : "text-muted hover:text-white"}`
              }
            >
              Conturi
            </NavLink>
          </nav>
        </div>
        <button onClick={clear} className="text-xs text-muted hover:text-white">
          Deconectare
        </button>
      </header>
      <main className="flex-1 min-h-0">{children}</main>
    </div>
  );
}
