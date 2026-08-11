import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  LineSeries,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useRef, useState } from "react";

import { accountsApi, tradingApi } from "../lib/api";
import { useTick } from "../hooks/useTick";
import type { Position, Timeframe } from "../lib/types";

const DRAG_HIT_TOLERANCE_PX = 6;

interface DraggableLine {
  line: IPriceLine;
  position: Position;
  field: "sl" | "tp";
}

function formatPrice(price: number): string {
  return price >= 100 ? price.toFixed(2) : price.toFixed(5);
}

function rangeStorageKey(accountId: number | null, symbol: string, timeframe: Timeframe): string {
  return `trading.chartRange:${accountId ?? ""}:${symbol}:${timeframe}`;
}

function formatPnl(pnl: number, currency: string): string {
  const sign = pnl > 0 ? "+" : "";
  return `${sign}${pnl.toFixed(2)} ${currency}`.trim();
}

function calcPnl(
  position: Position,
  targetPrice: number,
  tickValue: number,
  tickSize: number,
): number {
  const direction = position.side === "buy" ? 1 : -1;
  const ticks = (targetPrice - position.price_open) / tickSize;
  return ticks * tickValue * position.volume * direction;
}

function lineTitle(
  field: "sl" | "tp",
  price: number,
  position: Position,
  info: { tick_value: number; tick_size: number } | undefined,
  currency: string,
): string {
  const label = field.toUpperCase();
  if (!info) return label;
  const pnl = calcPnl(position, price, info.tick_value, info.tick_size);
  return `${label} ${formatPnl(pnl, currency)}`;
}

interface Props {
  accountId: number | null;
  symbol: string;
  timeframe: Timeframe;
  positions: Position[];
  pendingSl: number | null;
  pendingTp: number | null;
  pickMode: "sl" | "tp" | null;
  onPickPrice: (price: number) => void;
  currency: string;
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
  currency,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const pendingLinesRef = useRef<{ sl?: IPriceLine; tp?: IPriceLine }>({});
  const positionLinesRef = useRef<IPriceLine[]>([]);
  const draggableLinesRef = useRef<DraggableLine[]>([]);
  const draggingRef = useRef<DraggableLine | null>(null);
  const fitKeyRef = useRef<string>("");
  const drawnLinesRef = useRef<ISeriesApi<"Line">[]>([]);
  const drawStartRef = useRef<{ time: Time; price: number } | null>(null);
  const bidLineRef = useRef<IPriceLine | null>(null);
  const askLineRef = useRef<IPriceLine | null>(null);
  const rangeKeyRef = useRef<string>("");
  const drawModeRef = useRef(false);
  const pickModeRef = useRef(pickMode);
  const onPickPriceRef = useRef(onPickPrice);
  pickModeRef.current = pickMode;
  onPickPriceRef.current = onPickPrice;

  const [dragLabel, setDragLabel] = useState<{ x: number; y: number; text: string } | null>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [drawnCount, setDrawnCount] = useState(0);
  drawModeRef.current = drawMode;
  const queryClient = useQueryClient();

  const modifyMutation = useMutation({
    mutationFn: ({ accountId, ticket, sl, tp }: { accountId: number; ticket: number; sl?: number; tp?: number }) =>
      tradingApi.modifyPosition(accountId, ticket, sl, tp),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["positions"] }),
  });
  const modifyMutationRef = useRef(modifyMutation);
  modifyMutationRef.current = modifyMutation;

  const { data: symbolInfo } = useQuery({
    queryKey: ["symbol-info", accountId, symbol],
    queryFn: () => accountsApi.symbolInfo(accountId as number, symbol),
    enabled: !!accountId && !!symbol,
    staleTime: 60000,
  });
  const symbolInfoRef = useRef(symbolInfo);
  symbolInfoRef.current = symbolInfo;
  const currencyRef = useRef(currency);
  currencyRef.current = currency;

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

    const handleRangeChange = () => {
      const range = chart.timeScale().getVisibleRange();
      if (range && rangeKeyRef.current) {
        localStorage.setItem(rangeKeyRef.current, JSON.stringify(range));
      }
    };
    chart.timeScale().subscribeVisibleTimeRangeChange(handleRangeChange);

    function findLineAt(y: number): DraggableLine | null {
      for (const dl of draggableLinesRef.current) {
        const coord = series.priceToCoordinate(dl.line.options().price);
        if (coord !== null && Math.abs(coord - y) <= DRAG_HIT_TOLERANCE_PX) return dl;
      }
      return null;
    }

    let previewLine: ISeriesApi<"Line"> | null = null;

    function pointAt(x: number, y: number): { time: Time; price: number } | null {
      const time = chart.timeScale().coordinateToTime(x);
      const price = series.coordinateToPrice(y);
      if (time === null || price === null) return null;
      return { time, price };
    }

    function sortedPoints(
      a: { time: Time; price: number },
      b: { time: Time; price: number },
    ): { time: Time; price: number }[] {
      return (a.time as number) <= (b.time as number) ? [a, b] : [b, a];
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const x = e.clientX - rect.left;

      if (drawStartRef.current) {
        const end = pointAt(x, y);
        if (!end) return;
        const [p1, p2] = sortedPoints(drawStartRef.current, end);
        if (p1.time === p2.time) return;
        if (!previewLine) {
          previewLine = chart.addSeries(LineSeries, {
            color: "#fbbf24",
            lineWidth: 2,
            lastValueVisible: false,
            priceLineVisible: false,
          });
        }
        previewLine.setData([
          { time: p1.time, value: p1.price },
          { time: p2.time, value: p2.price },
        ]);
        return;
      }

      if (draggingRef.current) {
        const price = series.coordinateToPrice(y);
        if (price !== null) {
          const { field, position } = draggingRef.current;
          const title = lineTitle(field, price, position, symbolInfoRef.current, currencyRef.current);
          draggingRef.current.line.applyOptions({ price, title });
          setDragLabel({ x, y, text: `${title} (${formatPrice(price)})` });
        }
        return;
      }

      if (!pickModeRef.current) {
        if (drawModeRef.current) {
          containerRef.current.style.cursor = "crosshair";
        } else {
          const hit = findLineAt(y);
          containerRef.current.style.cursor = hit ? "ns-resize" : "";
        }
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (!containerRef.current || pickModeRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (drawModeRef.current) {
        const start = pointAt(x, y);
        if (!start) return;
        e.preventDefault();
        e.stopPropagation();
        drawStartRef.current = start;
        chart.applyOptions({ handleScroll: false, handleScale: false });
        return;
      }

      const hit = findLineAt(y);
      if (!hit) return;
      e.preventDefault();
      e.stopPropagation();
      draggingRef.current = hit;
      chart.applyOptions({ handleScroll: false, handleScale: false });
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (drawStartRef.current) {
        const start = drawStartRef.current;
        drawStartRef.current = null;
        chart.applyOptions({ handleScroll: true, handleScale: true });
        setDrawMode(false);
        const rect = containerRef.current?.getBoundingClientRect();
        const end = rect ? pointAt(e.clientX - rect.left, e.clientY - rect.top) : null;
        if (end && (end.time as number) !== (start.time as number)) {
          const [p1, p2] = sortedPoints(start, end);
          if (!previewLine) {
            previewLine = chart.addSeries(LineSeries, {
              color: "#fbbf24",
              lineWidth: 2,
              lastValueVisible: false,
              priceLineVisible: false,
            });
          }
          previewLine.setData([
            { time: p1.time, value: p1.price },
            { time: p2.time, value: p2.price },
          ]);
          drawnLinesRef.current.push(previewLine);
          setDrawnCount((n) => n + 1);
        } else if (previewLine) {
          chart.removeSeries(previewLine);
        }
        previewLine = null;
        return;
      }

      const dragging = draggingRef.current;
      if (!dragging) return;
      draggingRef.current = null;
      chart.applyOptions({ handleScroll: true, handleScale: true });
      setDragLabel(null);
      const price = dragging.line.options().price;
      modifyMutationRef.current.mutate({
        accountId: dragging.position.account_id,
        ticket: dragging.position.ticket,
        sl: dragging.field === "sl" ? price : undefined,
        tp: dragging.field === "tp" ? price : undefined,
      });
    };

    const container = containerRef.current;
    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

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
      chart.timeScale().unsubscribeVisibleTimeRangeChange(handleRangeChange);
      container.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clearDrawings() {
    const chart = chartRef.current;
    if (!chart) return;
    drawnLinesRef.current.forEach((l) => chart.removeSeries(l));
    drawnLinesRef.current = [];
    setDrawnCount(0);
  }

  // drop hand-drawn lines when switching instruments
  useEffect(() => {
    return () => clearDrawings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

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
    // only touch the view when the instrument/timeframe actually changed —
    // periodic data refreshes must not disturb the user's zoom/pan
    const key = `${accountId ?? ""}:${symbol}:${timeframe}`;
    if (fitKeyRef.current !== key) {
      fitKeyRef.current = key;
      rangeKeyRef.current = rangeStorageKey(accountId, symbol, timeframe);
      const saved = localStorage.getItem(rangeKeyRef.current);
      let restored = false;
      if (saved) {
        try {
          chartRef.current?.timeScale().setVisibleRange(JSON.parse(saved));
          restored = true;
        } catch {
          restored = false;
        }
      }
      if (!restored) {
        chartRef.current?.timeScale().fitContent();
      }
    }
  }, [candles, accountId, symbol, timeframe]);

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

  // live bid/ask lines
  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;
    if (!tick) {
      if (bidLineRef.current) {
        series.removePriceLine(bidLineRef.current);
        bidLineRef.current = null;
      }
      if (askLineRef.current) {
        series.removePriceLine(askLineRef.current);
        askLineRef.current = null;
      }
      return;
    }
    if (bidLineRef.current) {
      bidLineRef.current.applyOptions({ price: tick.bid });
    } else {
      bidLineRef.current = series.createPriceLine({
        price: tick.bid,
        color: "#60a5fa",
        lineWidth: 1,
        lineStyle: 2,
        title: "Bid",
        axisLabelVisible: true,
      });
    }
    if (askLineRef.current) {
      askLineRef.current.applyOptions({ price: tick.ask });
    } else {
      askLineRef.current = series.createPriceLine({
        price: tick.ask,
        color: "#fb923c",
        lineWidth: 1,
        lineStyle: 2,
        title: "Ask",
        axisLabelVisible: true,
      });
    }
  }, [tick]);

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
    // dragging in progress: skip re-render so we don't fight the live drag position
    if (draggingRef.current) return;
    positionLinesRef.current.forEach((l) => series.removePriceLine(l));
    positionLinesRef.current = [];
    draggableLinesRef.current = [];
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
        const slLine = series.createPriceLine({
          price: p.sl,
          color: "#f0403e",
          lineWidth: 1,
          lineStyle: 3,
          title: lineTitle("sl", p.sl, p, symbolInfo, currency),
          axisLabelVisible: true,
        });
        positionLinesRef.current.push(slLine);
        draggableLinesRef.current.push({ line: slLine, position: p, field: "sl" });
      }
      if (p.tp) {
        const tpLine = series.createPriceLine({
          price: p.tp,
          color: "#12b886",
          lineWidth: 1,
          lineStyle: 3,
          title: lineTitle("tp", p.tp, p, symbolInfo, currency),
          axisLabelVisible: true,
        });
        positionLinesRef.current.push(tpLine);
        draggableLinesRef.current.push({ line: tpLine, position: p, field: "tp" });
      }
    }
  }, [positions, symbolInfo, currency]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      <div className="absolute z-10 top-2 right-2 flex gap-1">
        <button
          onClick={() => setDrawMode((v) => !v)}
          title="Desenează o linie pe grafic"
          className={`h-7 w-7 rounded-md border text-sm ${
            drawMode ? "bg-accent border-accent text-white" : "bg-panel2/90 border-border text-muted hover:text-white"
          }`}
        >
          ✏️
        </button>
        {drawnCount > 0 && (
          <button
            onClick={clearDrawings}
            title="Șterge liniile desenate"
            className="h-7 w-7 rounded-md border border-border bg-panel2/90 text-muted hover:text-white text-sm"
          >
            🗑
          </button>
        )}
      </div>
      {dragLabel && (
        <div
          className="absolute z-10 -translate-y-1/2 rounded bg-panel2 border border-border px-2 py-0.5 text-xs font-medium pointer-events-none"
          style={{ left: dragLabel.x + 12, top: dragLabel.y }}
        >
          {dragLabel.text}
        </div>
      )}
      {pickMode && (
        <div className="absolute z-10 top-2 left-2 rounded-md bg-panel2/90 border border-border px-3 py-1.5 text-xs">
          Click pe grafic pentru a seta {pickMode === "sl" ? "Stop Loss" : "Take Profit"}
        </div>
      )}
      {drawMode && (
        <div className="absolute z-10 top-11 right-2 rounded-md bg-panel2/90 border border-border px-3 py-1.5 text-xs max-w-[180px] text-right">
          Trage pe grafic pentru a desena o linie
        </div>
      )}
    </div>
  );
}
