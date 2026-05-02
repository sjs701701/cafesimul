"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { DayResult } from "@/lib/simulation/types";

type HourBucket = {
  hour: number;
  arrivals: number;
  served: number;
  abandoned: number;
  seated: number;
  queueLength: number;
  averageWaitMinutes: number;
  satisfaction: number;
  revenue: number;
  occupancy: number;
  staffFatigue: number;
  tickCount: number;
};

export function Timeline({ day }: { day: DayResult }) {
  const hourly = useMemo(() => buildHourlyTimeline(day), [day]);
  const busiestHour = useMemo(
    () => hourly.reduce((best, hour) => (hour.arrivals > best.arrivals ? hour : best), hourly[0]),
    [hourly],
  );
  const [selected, setSelected] = useState({ dayIndex: day.dayIndex, hour: busiestHour.hour });
  const selectedHour = selected.dayIndex === day.dayIndex ? selected.hour : busiestHour.hour;
  const active = hourly[selectedHour] ?? busiestHour;
  const maxArrivals = Math.max(1, ...hourly.map((hour) => hour.arrivals));
  const maxQueue = Math.max(1, ...hourly.map((hour) => hour.queueLength));
  const maxRevenue = Math.max(1, ...hourly.map((hour) => hour.revenue));

  return (
    <footer className="h-[148px] shrink-0 border-t border-[var(--line)] bg-[var(--bg-panel)]">
      <div className="flex h-10 items-center justify-between gap-3 border-b border-[var(--line)] px-3">
        <div className="min-w-0">
          <div className="mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent-cyan)]">
            24시간 타임라인
          </div>
          <div className="mt-0.5 truncate text-[10px] text-[var(--text-faint)]">
            선택된 하루의 00:00-23:59 운영 흐름을 시간대별로 표시합니다.
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <TimelineStat label="선택 시간" value={`${String(active.hour).padStart(2, "0")}:00`} />
          <TimelineStat label="방문" value={`${active.arrivals}명`} tone="cyan" />
          <TimelineStat label="대기열" value={`${active.queueLength}명`} tone={active.queueLength > 18 ? "red" : "amber"} />
          <TimelineStat label="매출" value={formatCompactWon(active.revenue)} tone="green" />
        </div>
      </div>

      <div className="grid h-[108px] grid-cols-[54px_minmax(0,1fr)] bg-[var(--bg-deepest)]">
        <div className="flex flex-col justify-between border-r border-[var(--line-faint)] px-2 py-2 mono text-[8.5px] uppercase tracking-[0.13em] text-[var(--text-faint)]">
          <span className="text-[#7ed4ff]">방문</span>
          <span className="text-[#f8d38b]">대기</span>
          <span className="text-[#86efac]">매출</span>
        </div>

        <div className="relative px-2 py-2">
          <div className="absolute inset-x-2 top-2 flex items-center justify-between text-[9px] text-[var(--text-faint)]">
            {[0, 3, 6, 9, 12, 15, 18, 21, 23].map((hour) => (
              <span key={hour}>{String(hour).padStart(2, "0")}</span>
            ))}
          </div>

          <div className="mt-4 grid h-[76px] grid-cols-[repeat(24,minmax(0,1fr))] gap-px">
            {hourly.map((hour) => {
              const selected = hour.hour === active.hour;
              const arrivalHeight = 12 + (hour.arrivals / maxArrivals) * 62;
              const queueHeight = 8 + (hour.queueLength / maxQueue) * 48;
              const revenueHeight = 8 + (hour.revenue / maxRevenue) * 54;
              const risk = hour.queueLength > 18 || hour.abandoned > 3;

              return (
                <button
                  key={hour.hour}
                  type="button"
                  data-testid={`hour-cell-${hour.hour}`}
                  aria-label={`${hour.hour}시, 방문 ${hour.arrivals}명, 대기열 ${hour.queueLength}명`}
                  onClick={() => setSelected({ dayIndex: day.dayIndex, hour: hour.hour })}
                  onMouseEnter={() => setSelected({ dayIndex: day.dayIndex, hour: hour.hour })}
                  className={
                    selected
                      ? "relative overflow-hidden border border-[#38BDF8]/70 bg-[#102336]/80 text-left"
                      : "relative overflow-hidden border border-transparent bg-[var(--bg-panel)]/28 text-left hover:border-[#38BDF8]/35 hover:bg-[var(--bg-raised)]/70"
                  }
                >
                  <span
                    aria-hidden
                    className="absolute inset-x-[18%] bottom-0 bg-[#38BDF8]/60"
                    style={{ height: `${arrivalHeight}%` } as CSSProperties}
                  />
                  <span
                    aria-hidden
                    className="absolute right-[22%] bottom-0 w-[18%] bg-[#22C55E]/55"
                    style={{ height: `${revenueHeight}%` } as CSSProperties}
                  />
                  <span
                    aria-hidden
                    className="absolute left-[18%] bottom-0 w-[18%]"
                    style={{
                      height: `${queueHeight}%`,
                      backgroundColor: risk ? "rgba(239,68,68,0.72)" : "rgba(245,158,11,0.68)",
                    }}
                  />
                  {selected ? (
                    <span className="absolute inset-x-0 top-0 h-[2px] bg-[var(--accent-cyan)]" />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-[var(--text-muted)]">
            <div className="flex min-w-0 items-center gap-2">
              <LegendDot color="#38BDF8" label="방문 수" />
              <LegendDot color="#F59E0B" label="최대 대기열" />
              <LegendDot color="#22C55E" label="매출" />
            </div>
            <div className="hidden truncate mono text-[9px] uppercase tracking-[0.14em] text-[var(--text-faint)] sm:block">
              {String(active.hour).padStart(2, "0")}:00 · 처리 {active.served}명 · 평균 대기{" "}
              {active.averageWaitMinutes.toFixed(1)}분 · 만족도 {Math.round(active.satisfaction)}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function buildHourlyTimeline(day: DayResult): HourBucket[] {
  const buckets: HourBucket[] = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    arrivals: 0,
    served: 0,
    abandoned: 0,
    seated: 0,
    queueLength: 0,
    averageWaitMinutes: 0,
    satisfaction: 0,
    revenue: 0,
    occupancy: 0,
    staffFatigue: 0,
    tickCount: 0,
  }));

  for (const tick of day.ticks) {
    const hour = clamp(Math.floor(tick.hour), 0, 23);
    const bucket = buckets[hour];
    bucket.arrivals += tick.arrivals;
    bucket.served += tick.served;
    bucket.abandoned += tick.abandoned;
    bucket.seated = Math.max(bucket.seated, tick.seated);
    bucket.queueLength = Math.max(bucket.queueLength, tick.queueLength);
    bucket.averageWaitMinutes += tick.averageWaitMinutes;
    bucket.satisfaction += tick.satisfaction;
    bucket.revenue += tick.revenue;
    bucket.occupancy += tick.occupancy;
    bucket.staffFatigue += tick.staffFatigue;
    bucket.tickCount += 1;
  }

  return buckets.map((bucket) => {
    if (!bucket.tickCount) {
      return bucket;
    }

    return {
      ...bucket,
      averageWaitMinutes: bucket.averageWaitMinutes / bucket.tickCount,
      satisfaction: bucket.satisfaction / bucket.tickCount,
      occupancy: bucket.occupancy / bucket.tickCount,
      staffFatigue: bucket.staffFatigue / bucket.tickCount,
    };
  });
}

function TimelineStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "cyan" | "green" | "amber" | "red";
}) {
  const colors = {
    default: "text-[var(--text-primary)]",
    cyan: "text-[var(--accent-cyan)]",
    green: "text-[#86efac]",
    amber: "text-[var(--accent-amber)]",
    red: "text-[#ffb4b4]",
  };

  return (
    <span className="border border-[var(--line)] bg-[var(--bg-deepest)] px-2 py-1">
      <span className="mr-1 text-[10px] text-[var(--text-faint)]">{label}</span>
      <span className={`mono text-[10.5px] font-bold uppercase tracking-[0.12em] ${colors[tone]}`}>{value}</span>
    </span>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      <span aria-hidden className="h-2 w-2" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function formatCompactWon(value: number) {
  if (value >= 10000) {
    return `₩${Math.round(value / 10000).toLocaleString("ko-KR")}만`;
  }

  return `₩${Math.round(value).toLocaleString("ko-KR")}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
