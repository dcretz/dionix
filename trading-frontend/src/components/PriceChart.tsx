import { useQuery } from "@tanstack/react-query";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useRef } from "react";

import { accountsApi } from "../lib/api";
import { useTick } from "../hooks/useTick";
import type { Position, Timeframe } from "../lib/types";

interface Props {
  accountId: number | null;
  symbol: string;
  timeframe: Timeframe;
  positions: Position[];
  pendingSl: number | null;
  pendingTp: number | null;
  pickMode: "sl" | "tp" | null;
  onPickPrice: (price: number) => void;
}

export default function PriceChart({
  accountId,
  symbol,
  timeframe,
  positions,
  pendingSl,
  pendingTp,
  pickMode,
  onPickPrice,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const pendingLinesRef = useRef<{ sl?: IPriceLine; tp?: IPriceLine }>({});
  const positionLinesRef = useRef<IPriceLine[]>([]);
  const pickModeRef = useRef(pickMode);
  const onPickPriceRef = useRef(onPickPrice);
  pickModeRef.current = pickMode;
  onPickPriceRef.current = onPickPrice;

  const { data: candles } = useQuery({
    queryKey: ["candles", accountId, symbol, timeframe],
    queryFn: () => accountsApi.candles(accountId as number, symbol, timeframe, 300),
    enabled: !!accountId && !!symbol,
    refetchInterval: 15000,
  });

  const tick = useTick(accountId, symbol);

  // chart lifecycle
  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#11151f" },
        textColor: "#7d879c",
      },
      grid: {
        vertLines: { color: "#1a2030" },
        horzLines: { color: "#1a2030" },
      },
      timeScale: { timeVisible: true, secondsVisible: false, borderColor: "#232a3b" },
      rightPriceScale: { borderColor: "#232a3b" },
      crosshair: { mode: 0 },
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#12b886",
      downColor: "#f0403e",
      borderVisible: false,
      wickUpColor: "#12b886",
      wickDownColor: "#f0403e",
    });
    chartRef.current = chart;
    seriesRef.current = series;

    const handleClick = (param: { point?: { x: number; y: number } }) => {
      if (!param.point || !pickModeRef.current) return;
      const price = series.coordinateToPrice(param.point.y);
      if (price !== null) onPickPriceRef.current(price);
    };
    chart.subscribeClick(handleClick);

    const resize = () => {
      if (!containerRef.current) return;
      chart.applyOptions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chart.unsubscribeClick(handleClick);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // data
  useEffect(() => {
    if (!seriesRef.current || !candles) return;
    seriesRef.current.setData(
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    );
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  // live last-bar update from ticks
  useEffect(() => {
    if (!seriesRef.current || !tick || !candles || candles.length === 0) return;
    const last = candles[candles.length - 1];
    const price = (tick.bid + tick.ask) / 2;
    seriesRef.current.update({
      time: last.time as UTCTimestamp,
      open: last.open,
      high: Math.max(last.high, price),
      low: Math.min(last.low, price),
      close: price,
    });
  }, [tick, candles]);

  // pending SL/TP price lines
  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;
    if (pendingLinesRef.current.sl) {
      series.removePriceLine(pendingLinesRef.current.sl);
      pendingLinesRef.current.sl = undefined;
    }
    if (pendingSl !== null) {
      pendingLinesRef.current.sl = series.createPriceLine({
        price: pendingSl,
        color: "#f0403e",
        lineWidth: 1,
        lineStyle: 2,
        title: "SL",
      });
    }
  }, [pendingSl]);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;
    if (pendingLinesRef.current.tp) {
      series.removePriceLine(pendingLinesRef.current.tp);
      pendingLinesRef.current.tp = undefined;
    }
    if (pendingTp !== null) {
      pendingLinesRef.current.tp = series.createPriceLine({
        price: pendingTp,
        color: "#12b886",
        lineWidth: 1,
        lineStyle: 2,
        title: "TP",
      });
    }
  }, [pendingTp]);

  // open position lines
  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;
    positionLinesRef.current.forEach((l) => series.removePriceLine(l));
    positionLinesRef.current = [];
    for (const p of positions) {
      positionLinesRef.current.push(
        series.createPriceLine({
          price: p.price_open,
          color: p.side === "buy" ? "#12b886" : "#f0403e",
          lineWidth: 2,
          lineStyle: 0,
          title: `#${p.ticket} ${p.side} ${p.volume}`,
        }),
      );
      if (p.sl) {
        positionLinesRef.current.push(
          series.createPriceLine({ price: p.sl, color: "#f0403e", lineWidth: 1, lineStyle: 3, title: "SL" }),
        );
      }
      if (p.tp) {
        positionLinesRef.current.push(
          series.createPriceLine({ price: p.tp, color: "#12b886", lineWidth: 1, lineStyle: 3, title: "TP" }),
        );
      }
    }
  }, [positions]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {pickMode && (
        <div className="absolute top-2 left-2 rounded-md bg-panel2/90 border border-border px-3 py-1.5 text-xs">
          Click pe grafic pentru a seta {pickMode === "sl" ? "Stop Loss" : "Take Profit"}
        </div>
      )}
    </div>
  );
}
