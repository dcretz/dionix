import { create } from "zustand";

const LS_URL = "trading.apiUrl";
const LS_TOKEN = "trading.apiToken";

interface ConnectionState {
  apiUrl: string;
  apiToken: string;
  setConnection: (apiUrl: string, apiToken: string) => void;
  clear: () => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  apiUrl: localStorage.getItem(LS_URL) ?? import.meta.env.VITE_API_URL ?? "http://localhost:8000",
  apiToken: localStorage.getItem(LS_TOKEN) ?? "",
  setConnection: (apiUrl, apiToken) => {
    localStorage.setItem(LS_URL, apiUrl);
    localStorage.setItem(LS_TOKEN, apiToken);
    set({ apiUrl, apiToken });
  },
  clear: () => {
    localStorage.removeItem(LS_URL);
    localStorage.removeItem(LS_TOKEN);
    set({ apiToken: "" });
  },
}));
