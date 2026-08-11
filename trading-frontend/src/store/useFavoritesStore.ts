import { create } from "zustand";

const LS_FAVORITES = "trading.favoriteSymbols";

function load(): string[] {
  try {
    const raw = localStorage.getItem(LS_FAVORITES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(favorites: string[]) {
  localStorage.setItem(LS_FAVORITES, JSON.stringify(favorites));
}

interface FavoritesState {
  favorites: string[];
  toggleFavorite: (symbol: string) => void;
  isFavorite: (symbol: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: load(),
  toggleFavorite: (symbol) => {
    const current = get().favorites;
    const next = current.includes(symbol)
      ? current.filter((s) => s !== symbol)
      : [...current, symbol];
    save(next);
    set({ favorites: next });
  },
  isFavorite: (symbol) => get().favorites.includes(symbol),
}));
