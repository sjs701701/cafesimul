"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  ChevronDown,
  Cpu,
  Database,
  Fingerprint,
  Lock,
  Radio,
  ShieldCheck,
} from "lucide-react";
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
  const [clockLabel, setClockLabel] = useState("00:00:00 KST");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const ss = String(now.getSeconds()).padStart(2, "0");
      setClockLabel(`${hh}:${mm}:${ss} KST`);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const timer = window.setInterval(() => stepDay(1), 1150);
    return () => window.clearInterval(timer);
  }, [isPlaying, stepDay]);

  const sessionId = useMemo(
    () =>
      `CAFE-OPS-${run.seed.toString(36).toUpperCase().padStart(5, "0")}-${String(run.days.length).padStart(2, "0")}D`,
    [run.seed, run.days.length],
  );

  return (
    <div className="h-screen overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)]">
      {/* Classification banner */}
      <div className="classification-bar relative flex h-5 items-center justify-between px-3">
        <div className="flex items-center gap-2 mono text-[9px] font-bold uppercase tracking-[0.22em] text-[#22C55E]">
          <Lock size={9} />
          UNCLASSIFIED // CAFE-OPS // INTERNAL R&D
        </div>
        <div className="hidden items-center gap-3 mono text-[9px] uppercase tracking-[0.22em] text-[var(--text-faint)] md:flex">
          <span>OPS_CONSOLE_v0.4.2</span>
          <span className="text-[var(--line-strong)]">|</span>
          <span>{sessionId}</span>
        </div>
      </div>

      {/* Primary header */}
      <header className="relative flex h-14 items-stretch border-b border-[var(--line)] bg-gradient-to-b from-[#0a0e14] to-[#070a0f]">
        <div className="flex items-center gap-3 border-r border-[var(--line)] px-4">
          <div className="hud-corner relative flex h-9 w-9 items-center justify-center border border-[#38BDF8]/55 bg-[#0c1a28]">
            <Database size={16} className="text-[#38BDF8]" />
          </div>
          <div className="leading-tight">
            <h1 className="text-[13px] font-semibold tracking-wide text-[var(--text-primary)]">
              CAFE OPERATIONS CONSOLE
            </h1>
            <p className="mono text-[9.5px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
              Agent Queue Kernel · Day-Resolution Telemetry
            </p>
          </div>
        </div>

        <nav className="hidden flex-1 items-center gap-px border-r border-[var(--line)] bg-[var(--bg-deepest)] md:flex">
          <NavTab label="LIVE OPS" sublabel="Day Telemetry" active />
          <NavTab label="MENU LAB" sublabel="Coming soon" disabled />
          <NavTab label="STAFFING" sublabel="Coming soon" disabled />
          <NavTab label="REPORTS" sublabel="Coming soon" disabled />
        </nav>

        <div className="hidden items-center gap-2 px-4 lg:flex">
          <StatusPill icon={<Radio size={11} />} label="LIVE SYNC" tone="cyan" pulse />
          <StatusPill icon={<ShieldCheck size={11} />} label={`SEED·${run.seed}`} tone="green" />
          <StatusPill icon={<Cpu size={11} />} label={`${run.days.length} DAYS / 15M TICK`} tone="violet" />
          <StatusPill icon={<Activity size={11} />} label={clockLabel} tone="cyan" mono />
        </div>

        <div className="flex items-center gap-2 border-l border-[var(--line)] px-3 lg:hidden">
          <span className="led-dot" />
          <span className="mono text-[10px] tracking-[0.18em] text-[var(--text-secondary)]">LIVE</span>
        </div>
      </header>

      {/* Sub-header / breadcrumb */}
      <div className="flex h-9 items-stretch border-b border-[var(--line)] bg-[var(--bg-raised)]">
        <div className="flex items-center gap-2 border-r border-[var(--line)] px-4 mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
          <Fingerprint size={11} className="text-[var(--text-faint)]" />
          <span className="text-[var(--text-faint)]">SCENARIO</span>
          <span className="text-[var(--accent-cyan)]">{"//"}</span>
          <span>BASELINE_OPS</span>
          <ChevronDown size={11} className="text-[var(--text-faint)]" />
        </div>
        <div className="hidden flex-1 items-center gap-5 px-4 mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)] md:flex">
          <Crumb k="DAY" v={`${String(selectedDay + 1).padStart(2, "0")} / ${String(run.days.length).padStart(2, "0")}`} />
          <Crumb k="VISITORS" v={day.visitors.toLocaleString("ko-KR")} />
          <Crumb k="REVENUE" v={`₩ ${Math.round(day.revenue / 10000).toLocaleString("ko-KR")}만`} />
          <Crumb k="CSAT" v={`${Math.round(day.satisfaction)}`} />
          <Crumb k="WAIT" v={`${day.averageWaitMinutes.toFixed(1)} MIN`} />
        </div>
        <div className="flex items-center gap-2 border-l border-[var(--line)] px-3 mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
          <span className="hidden sm:inline">TZ</span>
          <span className="text-[var(--text-secondary)]">Asia/Seoul</span>
        </div>
      </div>

      <main className="flex h-[calc(100vh-112px)] min-h-0 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto lg:grid lg:grid-cols-[304px_minmax(0,1fr)_320px] lg:overflow-hidden">
          <div className="hidden min-h-0 lg:block">
            <ControlPanel side="left" config={config} />
          </div>

          <section className="flex min-h-[calc(100vh-260px)] flex-col border-x border-[var(--line)] bg-[var(--bg-deepest)] lg:min-h-0">
            <KpiPanel run={run} selectedDay={selectedDay} />
            <div className="min-h-[520px] flex-1 lg:min-h-0">
              <CafeScene config={config} day={day} />
            </div>
          </section>

          <div className="hidden min-h-0 lg:block">
            <ControlPanel side="right" config={config} />
          </div>

          <div
            className={
              mobileControlsOpen
                ? "fixed inset-x-0 bottom-[148px] z-50 border-t border-[var(--line)] bg-[var(--bg-panel)] shadow-[0_-24px_60px_rgba(0,0,0,0.62)] lg:hidden"
                : "hidden"
            }
          >
            <div className="sticky top-0 z-30 grid grid-cols-2 border-b border-[var(--line)] bg-[var(--bg-raised)]">
              <MobilePanelTab
                active={mobilePanel === "left"}
                label="DEMAND / GUEST"
                testId="mobile-tab-left"
                onClick={() => setMobilePanel("left")}
              />
              <MobilePanelTab
                active={mobilePanel === "right"}
                label="OPS / SPACE"
                testId="mobile-tab-right"
                onClick={() => setMobilePanel("right")}
              />
            </div>
            <div className="h-[44vh] min-h-[300px] bg-[var(--bg-panel)]">
              <ControlPanel side={mobilePanel} config={config} />
            </div>
          </div>
          <button
            type="button"
            data-testid="mobile-controls-toggle"
            aria-expanded={mobileControlsOpen}
            onClick={() => setMobileControlsOpen((open) => !open)}
            className="hud-corner fixed right-3 bottom-[160px] z-[55] border border-[#38BDF8]/70 bg-[#0e1c2c] px-3 py-2 mono text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-primary)] shadow-[0_12px_32px_rgba(0,0,0,0.48)] lg:hidden"
          >
            {mobileControlsOpen ? "CLOSE VARS" : "OPEN VARS"}
          </button>
        </div>
        <Timeline day={day} />
      </main>
    </div>
  );
}

function NavTab({
  label,
  sublabel,
  active = false,
  disabled = false,
}: {
  label: string;
  sublabel?: string;
  active?: boolean;
  disabled?: boolean;
}) {
  if (active) {
    return (
      <div className="relative flex h-full items-center gap-2 border-r border-[var(--line)] bg-[var(--bg-panel)] px-4">
        <span className="absolute inset-x-0 top-0 h-[2px] bg-[var(--accent-cyan)]" />
        <span className="mono text-[10.5px] font-bold uppercase tracking-[0.18em] text-[var(--accent-cyan)]">
          {label}
        </span>
        {sublabel ? (
          <span className="mono text-[9px] uppercase tracking-[0.16em] text-[var(--text-faint)]">
            {sublabel}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      className={
        "flex h-full items-center gap-2 border-r border-[var(--line)] px-4 mono text-[10.5px] font-semibold uppercase tracking-[0.18em] " +
        (disabled
          ? "cursor-not-allowed text-[var(--text-faint)] opacity-60"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-panel)] hover:text-[var(--text-primary)]")
      }
    >
      {label}
      {sublabel ? (
        <span className="mono text-[9px] uppercase tracking-[0.16em] text-[var(--text-faint)]">
          {sublabel}
        </span>
      ) : null}
    </button>
  );
}

function Crumb({ k, v }: { k: string; v: string }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-[var(--text-faint)]">{k}</span>
      <span className="text-[var(--accent-cyan)]">›</span>
      <span className="text-[var(--text-primary)]">{v}</span>
    </span>
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
          ? "h-10 border-b-2 border-[var(--accent-cyan)] bg-[#0e1c2c] mono text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-primary)]"
          : "h-10 border-b-2 border-transparent bg-[var(--bg-raised)] mono text-[11px] uppercase tracking-[0.14em] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
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
  pulse = false,
  mono: useMono = false,
}: {
  icon: ReactNode;
  label: string;
  tone: "cyan" | "green" | "violet";
  pulse?: boolean;
  mono?: boolean;
}) {
  const palette = {
    cyan: { fg: "text-[#7ed4ff]", border: "border-[#38BDF8]/45", dot: "bg-[#38BDF8]" },
    green: { fg: "text-[#86efac]", border: "border-[#22C55E]/40", dot: "bg-[#22C55E]" },
    violet: { fg: "text-[#c4b5fd]", border: "border-[#A78BFA]/40", dot: "bg-[#A78BFA]" },
  }[tone];

  return (
    <span
      className={`hud-corner flex items-center gap-1.5 border ${palette.border} bg-[var(--bg-deepest)]/85 px-2 py-1 ${useMono ? "mono" : ""} text-[10.5px] uppercase tracking-[0.14em] ${palette.fg}`}
    >
      <span className={`relative inline-flex h-1.5 w-1.5 ${palette.dot} ${pulse ? "beacon" : ""}`} />
      {icon}
      {label}
    </span>
  );
}
