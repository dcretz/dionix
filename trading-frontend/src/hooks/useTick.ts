import { useEffect, useState } from "react";

import { tickStream } from "../lib/wsManager";
import type { Tick } from "../lib/types";

export function useTick(accountId: number | null | undefined, symbol: string | null | undefined) {
  const [tick, setTick] = useState<Tick | null>(null);

  useEffect(() => {
    setTick(null);
    if (!accountId || !symbol) return;
    return tickStream.subscribe(accountId, symbol, setTick);
  }, [accountId, symbol]);

  return tick;
}
