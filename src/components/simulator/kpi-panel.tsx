"use client";

import type { ComponentType, SVGProps } from "react";
import {
  Activity,
  CircleDollarSign,
  Gauge,
  Timer,
  TrendingDown,
  TrendingUp,
  UserX,
  Users,
} from "lucide-react";
import type { DayResult, SimulationRun } from "@/lib/simulation/types";

type KpiSpec = {
  id: string;
  label: string;
  code: string;
  value: string;
  raw: number;
  unit: string;
  thresholdLow?: number;
  thresholdHigh?: number;
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>;
  history: number[];
  invert?: boolean;
};

type KpiPanelProps = {
  run: SimulationRun;
  selectedDay: number;
};

export function KpiPanel({ run, selectedDay }: KpiPanelProps) {
  const day = run.days[selectedDay] ?? run.days[0];
  const previous = selectedDay > 0 ? run.days[selectedDay - 1] : null;

  const histories = buildHistories(run.days, selectedDay);

  const kpis: KpiSpec[] = [
    {
      id: "revenue",
      label: "예상 매출",
      code: "REV",
      value: `${Math.round(day.revenue / 10000).toLocaleString("ko-KR")}만`,
      raw: day.revenue,
      unit: "₩",
      icon: CircleDollarSign,
      history: histories.revenue,
    },
    {
      id: "visitors",
      label: "방문객",
      code: "VST",
      value: day.visitors.toLocaleString("ko-KR"),
      raw: day.visitors,
      unit: "명",
      icon: Users,
      history: histories.visitors,
    },
    {
      id: "wait",
      label: "평균 대기",
      code: "WAIT",
      value: day.averageWaitMinutes.toFixed(1),
      raw: day.averageWaitMinutes,
      unit: "min",
      thresholdLow: 6,
      thresholdHigh: 11,
      icon: Timer,
      history: histories.wait,
      invert: true,
    },
    {
      id: "satisfaction",
      label: "만족도",
      code: "CSAT",
      value: `${Math.round(day.satisfaction)}`,
      raw: day.satisfaction,
      unit: "/100",
      thresholdLow: 65,
      thresholdHigh: 80,
      icon: Gauge,
      history: histories.satisfaction,
    },
    {
      id: "abandonment",
      label: "포기율",
      code: "ABD",
      value: `${(day.abandonmentRate * 100).toFixed(1)}`,
      raw: day.abandonmentRate * 100,
      unit: "%",
      thresholdLow: 8,
      thresholdHigh: 16,
      icon: UserX,
      history: histories.abandonment,
      invert: true,
    },
    {
      id: "fatigue",
      label: "직원 피로",
      code: "FATG",
      value: `${Math.round(day.staffFatigue)}`,
      raw: day.staffFatigue,
      unit: "%",
      thresholdLow: 50,
      thresholdHigh: 72,
      icon: Activity,
      history: histories.fatigue,
      invert: true,
    },
  ];

  return (
    <div className="border-b border-[var(--line)] bg-[var(--bg-deepest)]">
      <div className="flex h-7 items-center justify-between border-b border-[var(--line-faint)] bg-[var(--bg-raised)] px-3">
        <div className="flex items-center gap-2">
          <span className="led-dot" />
          <span className="mono text-[9.5px] font-bold uppercase tracking-[0.22em] text-[var(--text-secondary)]">
            DAY KPI · TELEMETRY GRID
          </span>
        </div>
        <span className="mono text-[9.5px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
          DAY {String(selectedDay + 1).padStart(2, "0")} / {String(run.days.length).padStart(2, "0")}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-px bg-[var(--line)] lg:grid-cols-6">
        {kpis.map((kpi) => (
          <KpiCell key={kpi.id} kpi={kpi} previous={previous} />
        ))}
      </div>
    </div>
  );
}

function KpiCell({ kpi, previous }: { kpi: KpiSpec; previous: DayResult | null }) {
  const Icon = kpi.icon;
  const status = resolveStatus(kpi);
  const tone = TONE[status];
  const delta = previous ? computeDelta(kpi, previous) : null;
  const trendUp = delta ? delta.value >= 0 : false;
  const trendGood = delta ? (kpi.invert ? !trendUp : trendUp) : false;

  return (
    <div data-testid={`kpi-${kpi.id}`} className="relative bg-[var(--bg-raised)] px-3 pt-2 pb-2.5">
      <span className={`absolute inset-x-0 top-0 h-px ${tone.bar}`} />
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 mono text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
          <Icon size={11} className={tone.icon} />
          {kpi.code}
        </span>
        <span className="mono text-[9px] uppercase tracking-[0.16em] text-[var(--text-faint)]">
          {kpi.unit}
        </span>
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span data-testid={`kpi-value-${kpi.id}`} className={`mono text-[22px] font-bold leading-none tabular-nums ${tone.value}`}>
          {kpi.value}
        </span>
        {delta ? (
          <span className={`flex items-center gap-0.5 mono text-[9.5px] tabular-nums ${trendGood ? "text-[#86efac]" : "text-[#fca5a5]"}`}>
            {trendUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {delta.label}
          </span>
        ) : null}
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[9.5px] text-[var(--text-muted)]">
        <span>{kpi.label}</span>
        <span className={tone.tag}>{status === "ok" ? "NOMINAL" : status === "warn" ? "WATCH" : "ALERT"}</span>
      </div>
      <div className="mt-2 h-7">
        <Sparkline values={kpi.history} color={tone.spark} />
      </div>
    </div>
  );
}

const TONE = {
  ok: {
    bar: "bg-[var(--accent-cyan)]",
    icon: "text-[var(--accent-cyan)]",
    value: "text-[var(--text-primary)]",
    spark: "var(--accent-cyan)",
    tag: "mono text-[8.5px] font-bold uppercase tracking-[0.18em] text-[#7ed4ff]",
  },
  warn: {
    bar: "bg-[var(--accent-amber)]",
    icon: "text-[var(--accent-amber)]",
    value: "text-[#fbbf24]",
    spark: "var(--accent-amber)",
    tag: "mono text-[8.5px] font-bold uppercase tracking-[0.18em] text-[#fbbf24]",
  },
  bad: {
    bar: "bg-[var(--accent-red)]",
    icon: "text-[var(--accent-red)]",
    value: "text-[#fca5a5]",
    spark: "var(--accent-red)",
    tag: "mono text-[8.5px] font-bold uppercase tracking-[0.18em] text-[#fca5a5]",
  },
} as const;

type Status = keyof typeof TONE;

function resolveStatus(kpi: KpiSpec): Status {
  if (kpi.thresholdHigh === undefined || kpi.thresholdLow === undefined) {
    return "ok";
  }

  if (kpi.invert) {
    if (kpi.raw >= kpi.thresholdHigh) return "bad";
    if (kpi.raw >= kpi.thresholdLow) return "warn";
    return "ok";
  }

  if (kpi.raw <= kpi.thresholdLow) return "bad";
  if (kpi.raw <= kpi.thresholdHigh) return "warn";
  return "ok";
}

function computeDelta(kpi: KpiSpec, previous: DayResult) {
  const prev = previousFor(kpi.id, previous);
  const diff = kpi.raw - prev;
  const pct = prev !== 0 ? (diff / Math.abs(prev)) * 100 : 0;
  const value = diff;
  return {
    value,
    label: `${diff >= 0 ? "+" : "−"}${Math.abs(pct).toFixed(1)}%`,
  };
}

function previousFor(id: string, previous: DayResult): number {
  switch (id) {
    case "revenue":
      return previous.revenue;
    case "visitors":
      return previous.visitors;
    case "wait":
      return previous.averageWaitMinutes;
    case "satisfaction":
      return previous.satisfaction;
    case "abandonment":
      return previous.abandonmentRate * 100;
    case "fatigue":
      return previous.staffFatigue;
    default:
      return 0;
  }
}

function buildHistories(days: DayResult[], upto: number) {
  const slice = days.slice(0, Math.min(days.length, upto + 1));
  return {
    revenue: slice.map((d) => d.revenue),
    visitors: slice.map((d) => d.visitors),
    wait: slice.map((d) => d.averageWaitMinutes),
    satisfaction: slice.map((d) => d.satisfaction),
    abandonment: slice.map((d) => d.abandonmentRate * 100),
    fatigue: slice.map((d) => d.staffFatigue),
  };
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) {
    return (
      <div className="flex h-full items-center justify-center mono text-[9px] uppercase tracking-[0.16em] text-[var(--text-faint)]">
        — collecting —
      </div>
    );
  }

  const w = 100;
  const h = 28;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const last = values.length - 1;
  const points = values.map((value, index) => {
    const x = (index / Math.max(1, last)) * w;
    const y = h - ((value - min) / span) * h;
    return [x, y] as const;
  });
  const linePath = points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
  const fillPath = `${linePath} L ${w} ${h} L 0 ${h} Z`;
  const lastPoint = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-full w-full">
      <line x1="0" y1={h - 0.5} x2={w} y2={h - 0.5} className="spark-axis" />
      <line x1="0" y1={h / 2} x2={w} y2={h / 2} className="spark-grid" />
      <path d={fillPath} fill={color} fillOpacity="0.18" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastPoint[0]} cy={lastPoint[1]} r="1.8" fill={color} />
      <circle cx={lastPoint[0]} cy={lastPoint[1]} r="3" fill="none" stroke={color} strokeOpacity="0.5" />
    </svg>
  );
}
