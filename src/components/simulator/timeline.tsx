"use client";

import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import type { CSSProperties } from "react";
import type { DayResult } from "@/lib/simulation/types";
import { useSimulatorStore } from "@/store/simulator-store";

export function Timeline({ days, selectedDay }: { days: DayResult[]; selectedDay: number }) {
  const setSelectedDay = useSimulatorStore((state) => state.setSelectedDay);
  const setDayCount = useSimulatorStore((state) => state.setDayCount);
  const isPlaying = useSimulatorStore((state) => state.isPlaying);
  const setPlaying = useSimulatorStore((state) => state.setPlaying);
  const stepDay = useSimulatorStore((state) => state.stepDay);
  const dayCount = useSimulatorStore((state) => state.dayCount);

  return (
    <footer className="h-[148px] shrink-0 border-t border-[#263241] bg-[#0D1117]">
      <div className="flex h-10 items-center justify-between border-b border-[#263241] px-4">
        <div className="flex items-center gap-2">
          <button className="icon-button" type="button" title="이전 날짜" onClick={() => stepDay(-1)}>
            <SkipBack size={14} />
          </button>
          <button
            className="icon-button border-[#38BDF8]/60 text-[#38BDF8]"
            type="button"
            title={isPlaying ? "정지" : "재생"}
            onClick={() => setPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button className="icon-button" type="button" title="다음 날짜" onClick={() => stepDay(1)}>
            <SkipForward size={14} />
          </button>
          <span className="ml-2 font-mono text-[11px] text-[#8B98A8]">
            DAY {String(selectedDay + 1).padStart(2, "0")} / {days.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {[7, 14, 30].map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => setDayCount(count)}
              className={
                dayCount === count
                  ? "h-7 border border-[#38BDF8]/70 bg-[#102336] px-3 text-[11px] font-semibold text-[#D9E2EC]"
                  : "h-7 border border-[#263241] bg-[#07090D] px-3 text-[11px] text-[#8B98A8] hover:border-[#38BDF8]/40"
              }
            >
              {count}일
            </button>
          ))}
        </div>
      </div>
      <div className="grid h-[108px] grid-cols-7 gap-px overflow-x-auto bg-[#263241] p-px md:grid-cols-[repeat(var(--days),minmax(54px,1fr))]" style={{ "--days": days.length } as CSSProperties}>
        {days.map((day) => {
          const selected = selectedDay === day.dayIndex;
          const heat = Math.min(1, day.revenue / 2300000);
          const risk = Math.min(1, day.peakQueue / 42);
          return (
            <button
              key={day.dayIndex}
              type="button"
              onClick={() => setSelectedDay(day.dayIndex)}
              className={
                selected
                  ? "relative min-w-[54px] bg-[#102336] p-2 text-left outline outline-1 outline-[#38BDF8]"
                  : "relative min-w-[54px] bg-[#0A0E14] p-2 text-left hover:bg-[#111722]"
              }
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] text-[#8B98A8]">D{day.dayIndex + 1}</span>
                <span className="h-1.5 w-1.5" style={{ backgroundColor: risk > 0.6 ? "#EF4444" : risk > 0.35 ? "#F59E0B" : "#22C55E" }} />
              </div>
              <div className="mt-3 h-8 border border-[#263241] bg-[#07090D]">
                <div className="h-full" style={{ width: `${Math.max(8, heat * 100)}%`, background: `linear-gradient(180deg, rgba(56,189,248,.75), rgba(34,197,94,${0.35 + heat * 0.35}))` }} />
              </div>
              <div className="mt-2 flex items-end justify-between gap-1">
                <span className="font-mono text-[10px] text-[#D9E2EC]">{Math.round(day.satisfaction)}</span>
                <span className="font-mono text-[10px] text-[#8B98A8]">{Math.round(day.revenue / 10000)}만</span>
              </div>
            </button>
          );
        })}
      </div>
    </footer>
  );
}
