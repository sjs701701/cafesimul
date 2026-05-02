"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Database, Radio, ShieldCheck } from "lucide-react";
import { CafeScene } from "./cafe-scene";
import { ControlPanel } from "./control-panel";
import { KpiPanel } from "./kpi-panel";
import { Timeline } from "./timeline";
import { useSimulatorStore } from "@/store/simulator-store";

export function CafeSimulator() {
  const config = useSimulatorStore((state) => state.config);
  const run = useSimulatorStore((state) => state.run);
  const selectedDay = useSimulatorStore((state) => state.selectedDay);
  const isPlaying = useSimulatorStore((state) => state.isPlaying);
  const stepDay = useSimulatorStore((state) => state.stepDay);
  const day = run.days[selectedDay] ?? run.days[0];
  const [mobilePanel, setMobilePanel] = useState<"left" | "right">("left");
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const timer = window.setInterval(() => stepDay(1), 1150);
    return () => window.clearInterval(timer);
  }, [isPlaying, stepDay]);

  return (
    <div className="h-screen overflow-hidden bg-[#07090D] text-[#D9E2EC]">
      <header className="flex h-11 items-center justify-between border-b border-[#263241] bg-[#0A0E14] px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-6 w-6 items-center justify-center border border-[#38BDF8]/60 bg-[#102336] text-[#38BDF8]">
            <Database size={14} />
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-none tracking-normal">카페 운영 시뮬레이터</h1>
            <p className="mt-1 font-mono text-[10px] uppercase text-[#5F6B7A]">
              Agent Queue Kernel / Day Resolution
            </p>
          </div>
        </div>
        <div className="hidden items-center gap-4 md:flex">
          <StatusPill icon={<Radio size={12} />} label="실시간 동기화" tone="cyan" />
          <StatusPill icon={<ShieldCheck size={12} />} label={`Seed ${run.seed}`} tone="green" />
          <span className="font-mono text-[11px] text-[#8B98A8]">
            DAY {String(selectedDay + 1).padStart(2, "0")} / 매출 {Math.round(day.revenue / 10000)}만
          </span>
        </div>
      </header>
      <main className="flex h-[calc(100vh-44px)] min-h-0 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto lg:grid lg:grid-cols-[320px_minmax(0,1fr)_360px] lg:overflow-hidden">
          <div className="hidden min-h-0 lg:block">
            <ControlPanel side="left" config={config} />
          </div>

          <section className="flex min-h-[calc(100vh-164px)] flex-col border-x border-[#263241] bg-[#07090D] lg:min-h-0">
            <KpiPanel day={day} />
            <div className="min-h-[360px] flex-1 lg:min-h-0">
              <CafeScene config={config} day={day} />
            </div>
          </section>

          <div className="hidden min-h-0 lg:block">
            <ControlPanel side="right" config={config} />
          </div>

          <div
            className={
              mobileControlsOpen
                ? "fixed inset-x-0 bottom-[140px] z-50 border-t border-[#263241] bg-[#0D1117] shadow-[0_-24px_60px_rgba(0,0,0,0.62)] lg:hidden"
                : "hidden"
            }
          >
            <div className="sticky top-0 z-30 grid grid-cols-2 border-b border-[#263241] bg-[#0A0E14]">
              <MobilePanelTab
                active={mobilePanel === "left"}
                label="수요 / 고객"
                testId="mobile-tab-left"
                onClick={() => setMobilePanel("left")}
              />
              <MobilePanelTab
                active={mobilePanel === "right"}
                label="운영 / 공간"
                testId="mobile-tab-right"
                onClick={() => setMobilePanel("right")}
              />
            </div>
            <div className="h-[42vh] min-h-[280px] bg-[#0D1117]">
              <ControlPanel side={mobilePanel} config={config} />
            </div>
          </div>
          <button
            type="button"
            data-testid="mobile-controls-toggle"
            aria-expanded={mobileControlsOpen}
            onClick={() => setMobileControlsOpen((open) => !open)}
            className="fixed right-3 bottom-[150px] z-[55] border border-[#38BDF8]/70 bg-[#102336] px-3 py-2 text-[12px] font-semibold text-[#D9E2EC] shadow-[0_12px_32px_rgba(0,0,0,0.48)] lg:hidden"
          >
            {mobileControlsOpen ? "변수 닫기" : "변수 조정"}
          </button>
        </div>
        <Timeline days={run.days} selectedDay={selectedDay} />
      </main>
    </div>
  );
}

function MobilePanelTab({
  active,
  label,
  testId,
  onClick,
}: {
  active: boolean;
  label: string;
  testId: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-pressed={active}
      onClick={onClick}
      className={
        active
          ? "h-10 border-b border-[#38BDF8] bg-[#102336] text-[12px] font-semibold text-[#D9E2EC]"
          : "h-10 border-b border-transparent bg-[#0A0E14] text-[12px] text-[#8B98A8] hover:text-[#D9E2EC]"
      }
    >
      {label}
    </button>
  );
}

function StatusPill({
  icon,
  label,
  tone,
}: {
  icon: ReactNode;
  label: string;
  tone: "cyan" | "green";
}) {
  const color = tone === "cyan" ? "text-[#38BDF8]" : "text-[#22C55E]";
  return (
    <span className={`flex items-center gap-1.5 border border-[#263241] bg-[#07090D] px-2 py-1 text-[11px] ${color}`}>
      {icon}
      {label}
    </span>
  );
}
