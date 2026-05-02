"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DayResult, EnvironmentConfig } from "@/lib/simulation/types";

type CafeSceneProps = {
  config: EnvironmentConfig;
  day: DayResult;
};

type Point = {
  x: number;
  y: number;
};

type Rect = Point & {
  w: number;
  h: number;
};

type Tone = "cyan" | "green" | "amber" | "red" | "violet";
type CustomerState = "입장" | "대기" | "주문" | "픽업" | "착석" | "퇴장";
type StaffRole = "계산" | "제조" | "픽업" | "정리";

type SceneMetrics = {
  queueCount: number;
  tableCount: number;
  occupiedTables: number;
  seatedGuests: number;
  staffCount: number;
  airRisk: number;
  congestion: number;
  comfort: number;
  noiseRisk: number;
  flowScore: number;
  lightingOpacity: number;
  lightColor: string;
  congestionTone: Tone;
  airTone: Tone;
  comfortTone: Tone;
  noiseTone: Tone;
  throughput: number;
  tablePoints: Point[];
  customerCount: number;
};

type ZoneInfo = {
  key: string;
  title: string;
  description: string;
  value?: string;
};

type RouteStep = {
  point: Point;
  hold: number;
  state: CustomerState;
};

type RouteSample = {
  point: Point;
  state: CustomerState;
  moving: boolean;
};

const VIEW_W = 900;
const VIEW_H = 600;
const FLOOR: Rect = { x: 24, y: 24, w: 852, h: 540 };
const COUNTER: Rect = { x: 72, y: 66, w: 500, h: 96 };
const PICKUP: Rect = { x: 602, y: 70, w: 152, h: 88 };
const QUEUE_AREA: Rect = { x: 616, y: 150, w: 244, h: 150 };
const SEATING_AREA: Rect = { x: 96, y: 260, w: 760, h: 280 };
const ENTRY: Point = { x: 876, y: 210 };
const EXIT: Point = { x: 876, y: 462 };
const POS_POINT: Point = { x: 552, y: 132 };
const BAR_POINT: Point = { x: 266, y: 124 };
const PICKUP_POINT: Point = { x: 678, y: 150 };
const CLEANING_POINT: Point = { x: 120, y: 520 };

const TABLE_POINTS: Point[] = [
  { x: 160, y: 320 },
  { x: 290, y: 320 },
  { x: 420, y: 320 },
  { x: 550, y: 320 },
  { x: 160, y: 420 },
  { x: 290, y: 420 },
  { x: 420, y: 420 },
  { x: 550, y: 420 },
  { x: 160, y: 515 },
  { x: 290, y: 515 },
  { x: 420, y: 515 },
  { x: 550, y: 515 },
  { x: 700, y: 400 },
  { x: 812, y: 400 },
  { x: 700, y: 515 },
  { x: 812, y: 515 },
];

const QUEUE_POINTS: Point[] = [
  { x: 820, y: 176 },
  { x: 780, y: 176 },
  { x: 740, y: 176 },
  { x: 700, y: 176 },
  { x: 660, y: 176 },
  { x: 660, y: 216 },
  { x: 700, y: 216 },
  { x: 740, y: 216 },
  { x: 780, y: 216 },
  { x: 820, y: 216 },
  { x: 820, y: 256 },
  { x: 780, y: 256 },
  { x: 740, y: 256 },
  { x: 700, y: 256 },
  { x: 660, y: 256 },
];

const STAFF_HOME_POINTS: Point[] = [
  { x: 544, y: 112 },
  { x: 246, y: 108 },
  { x: 322, y: 108 },
  { x: 398, y: 108 },
  { x: 674, y: 112 },
  { x: 138, y: 492 },
  { x: 230, y: 230 },
  { x: 450, y: 230 },
];

const TONE_COLORS: Record<Tone, { main: string; soft: string; text: string }> = {
  cyan: { main: "#38BDF8", soft: "rgba(56,189,248,0.14)", text: "#A5E6FF" },
  green: { main: "#22C55E", soft: "rgba(34,197,94,0.13)", text: "#B5F3C9" },
  amber: { main: "#F59E0B", soft: "rgba(245,158,11,0.14)", text: "#FFD796" },
  red: { main: "#EF4444", soft: "rgba(239,68,68,0.16)", text: "#FFB4B4" },
  violet: { main: "#A78BFA", soft: "rgba(167,139,250,0.14)", text: "#D7CCFF" },
};

export function CafeScene({ config, day }: CafeSceneProps) {
  const [compact, setCompact] = useState(false);
  const [hoverZone, setHoverZone] = useState<ZoneInfo | null>(null);
  const [selectedZone, setSelectedZone] = useState<ZoneInfo | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setCompact(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const metrics = useMemo(() => createSceneMetrics(config, day), [config, day]);
  const activeZone = selectedZone ?? hoverZone ?? defaultZone(metrics, day);

  return (
    <div className="topdown-shell relative flex h-full min-h-[520px] flex-col overflow-hidden bg-[#05080d]">
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] bg-[var(--bg-raised)]/95 px-3 py-2">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
            카페 평면 시뮬레이션
          </p>
          <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
            손님은 입장, 대기, 주문, 픽업, 착석, 퇴장 순서로 움직이고 직원은 계산, 제조, 픽업, 정리를 반복합니다.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <MetricChip label="대기" value={`${day.peakQueue}명`} tone={metrics.congestionTone} />
          <MetricChip label="처리율" value={`${metrics.throughput}%`} tone={metrics.throughput > 84 ? "green" : "amber"} />
          <MetricChip label="좌석" value={`${Math.round(day.occupancyRate)}%`} tone={day.occupancyRate > 92 ? "amber" : "cyan"} />
        </div>
      </div>

      <div className="flex min-h-[440px] flex-1 flex-col overflow-hidden">
        <div className="relative min-h-[360px] flex-1 overflow-hidden">
          <CanvasCafeMap
            compact={compact}
            config={config}
            day={day}
            metrics={metrics}
            onHover={setHoverZone}
            onSelect={setSelectedZone}
          />
        </div>

        <div className="z-20 border-t border-[var(--line)] bg-[rgba(5,8,13,0.92)] px-3 py-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-[12px] font-semibold text-[var(--text-primary)]">{activeZone.title}</p>
            {selectedZone ? (
              <span className="mono text-[8.5px] uppercase tracking-[0.16em] text-[var(--accent-cyan)]">고정됨</span>
            ) : (
              <span className="text-[10.5px] text-[var(--text-faint)]">구역에 마우스를 올리거나 클릭하면 설명이 바뀝니다.</span>
            )}
          </div>
          <p className="mt-1 max-w-[780px] text-[11px] leading-[16px] text-[var(--text-secondary)]">{activeZone.description}</p>
          {activeZone.value ? (
            <p className="mt-1 mono text-[10px] font-semibold text-[var(--accent-cyan)]">{activeZone.value}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CanvasCafeMap({
  compact,
  config,
  day,
  metrics,
  onHover,
  onSelect,
}: {
  compact: boolean;
  config: EnvironmentConfig;
  day: DayResult;
  metrics: SceneMetrics;
  onHover: (zone: ZoneInfo | null) => void;
  onSelect: (zone: ZoneInfo | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    let frameId = 0;
    let width = 0;
    let height = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (time: number) => {
      if (!width || !height) {
        return;
      }

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#070c14";
      context.fillRect(0, 0, width, height);

      const transform = createViewTransform(width, height, compact);
      context.save();
      context.translate(transform.offsetX, transform.offsetY);
      context.scale(transform.scale, transform.scale);
      drawCanvasScene(context, { config, day, metrics, reducedMotion, time });
      context.restore();

      if (!reducedMotion) {
        frameId = requestAnimationFrame(draw);
      }
    };

    resize();
    const observer = new ResizeObserver(() => {
      resize();
      draw(performance.now());
    });
    observer.observe(canvas);
    draw(performance.now());

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameId);
    };
  }, [compact, config, day, metrics]);

  const toWorldPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    const transform = createViewTransform(rect.width, rect.height, compact);
    return {
      x: (event.clientX - rect.left - transform.offsetX) / transform.scale,
      y: (event.clientY - rect.top - transform.offsetY) / transform.scale,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = toWorldPoint(event);
    const zone = point ? hitTest(point, metrics, day, config) : null;
    event.currentTarget.style.cursor = zone ? "pointer" : "default";
    onHover(zone);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = toWorldPoint(event);
    onSelect(point ? hitTest(point, metrics, day, config) : null);
  };

  return (
    <canvas
      ref={canvasRef}
      data-testid="topdown-map"
      data-renderer="canvas"
      role="img"
      aria-label="카페 평면 시뮬레이션"
      className="absolute inset-0 h-full w-full touch-none"
      onPointerDown={handlePointerDown}
      onPointerLeave={() => onHover(null)}
      onPointerMove={handlePointerMove}
    />
  );
}

function drawCanvasScene(
  context: CanvasRenderingContext2D,
  {
    config,
    day,
    metrics,
    reducedMotion,
    time,
  }: {
    config: EnvironmentConfig;
    day: DayResult;
    metrics: SceneMetrics;
    reducedMotion: boolean;
    time: number;
  },
) {
  context.lineCap = "round";
  context.lineJoin = "round";
  context.textBaseline = "alphabetic";

  drawFloor(context);
  drawEnvironmentLayers(context, metrics, time);
  drawWallsAndDoors(context);
  drawServiceCounter(context, config);
  drawQueueLane(context, metrics);
  drawTables(context, metrics);
  drawMovingCustomers(context, config, day, metrics, time, reducedMotion);
  drawMovingStaff(context, config, day, metrics, time, reducedMotion);
}

function drawFloor(context: CanvasRenderingContext2D) {
  const floorGradient = context.createLinearGradient(0, FLOOR.y, 0, FLOOR.y + FLOOR.h);
  floorGradient.addColorStop(0, "#2b3749");
  floorGradient.addColorStop(0.52, "#263142");
  floorGradient.addColorStop(1, "#1f2a3a");

  context.save();
  context.fillStyle = "#05080d";
  context.fillRect(0, 0, VIEW_W, VIEW_H);
  context.fillStyle = floorGradient;
  context.strokeStyle = "#8da1b7";
  context.lineWidth = 2.6;
  roundRect(context, FLOOR.x, FLOOR.y, FLOOR.w, FLOOR.h, 8);
  context.fill();
  context.stroke();

  const warmPool = context.createRadialGradient(420, 360, 40, 420, 360, 520);
  warmPool.addColorStop(0, "rgba(217,166,109,0.10)");
  warmPool.addColorStop(0.58, "rgba(217,166,109,0.035)");
  warmPool.addColorStop(1, "rgba(217,166,109,0)");
  context.fillStyle = warmPool;
  roundRect(context, FLOOR.x + 8, FLOOR.y + 8, FLOOR.w - 16, FLOOR.h - 16, 8);
  context.fill();
  context.restore();
}

function drawEnvironmentLayers(
  context: CanvasRenderingContext2D,
  metrics: SceneMetrics,
  time: number,
) {
  drawRadialEllipse(context, { x: 430, y: 340 }, 440, 250, metrics.lightColor, metrics.lightingOpacity * 0.5);
  drawRadialEllipse(context, { x: 506, y: 380 }, 300, 210, TONE_COLORS[metrics.airTone].main, 0.06 + metrics.airRisk / 1200);
  drawRadialEllipse(
    context,
    { x: QUEUE_AREA.x + 120, y: QUEUE_AREA.y + 72 },
    190,
    115,
    TONE_COLORS[metrics.congestionTone].main,
    0.06 + metrics.congestion / 1100,
  );

  if (metrics.noiseRisk > 58) {
    const radius = 88 + metrics.noiseRisk * 1.1 + Math.sin(time * 0.002) * 5;
    drawRing(context, { x: 452, y: 370 }, radius, TONE_COLORS[metrics.noiseTone].main, 0.13, 2);
  }
}

function drawWallsAndDoors(context: CanvasRenderingContext2D) {
  context.save();
  context.strokeStyle = "#a6b4c7";
  context.lineWidth = 7;
  drawLine(context, { x: FLOOR.x, y: FLOOR.y }, { x: FLOOR.x + FLOOR.w, y: FLOOR.y }, "#a6b4c7", 1, 7);
  drawLine(context, { x: FLOOR.x, y: FLOOR.y }, { x: FLOOR.x, y: FLOOR.y + FLOOR.h }, "#a6b4c7", 1, 7);
  drawLine(context, { x: FLOOR.x, y: FLOOR.y + FLOOR.h }, { x: FLOOR.x + FLOOR.w, y: FLOOR.y + FLOOR.h }, "#a6b4c7", 1, 7);
  drawLine(context, { x: FLOOR.x + FLOOR.w, y: FLOOR.y }, { x: FLOOR.x + FLOOR.w, y: 168 }, "#a6b4c7", 1, 7);
  drawLine(context, { x: FLOOR.x + FLOOR.w, y: 250 }, { x: FLOOR.x + FLOOR.w, y: 410 }, "#a6b4c7", 1, 7);
  drawLine(context, { x: FLOOR.x + FLOOR.w, y: 506 }, { x: FLOOR.x + FLOOR.w, y: FLOOR.y + FLOOR.h }, "#a6b4c7", 1, 7);

  context.fillStyle = "#38BDF8";
  context.globalAlpha = 0.88;
  context.fillRect(FLOOR.x + FLOOR.w - 8, 176, 16, 66);
  context.fillRect(FLOOR.x + FLOOR.w - 8, 420, 16, 76);
  context.globalAlpha = 1;
  drawText(context, "입구", 824, 214, "#a5e6ff", "700 16px system-ui");
  drawText(context, "출구", 824, 462, "#a5e6ff", "700 16px system-ui");

  context.fillStyle = "rgba(56,189,248,0.34)";
  [162, 290, 418, 546].forEach((x) => context.fillRect(x, FLOOR.y + 5, 88, 8));
  context.restore();
}

function drawServiceCounter(context: CanvasRenderingContext2D, config: EnvironmentConfig) {
  const counterGradient = context.createLinearGradient(COUNTER.x, COUNTER.y, COUNTER.x + COUNTER.w, COUNTER.y);
  counterGradient.addColorStop(0, "#3a2c20");
  counterGradient.addColorStop(0.55, "#735338");
  counterGradient.addColorStop(1, "#9a6f47");

  context.save();
  context.fillStyle = counterGradient;
  context.strokeStyle = "#c09565";
  context.lineWidth = 2;
  roundRect(context, COUNTER.x, COUNTER.y, COUNTER.w, COUNTER.h, 8);
  context.fill();
  context.stroke();

  drawCounterCell(context, 94, 84, 134, "계산대", `${config.equipment.posTerminals}대`, "cyan");
  drawCounterCell(context, 246, 84, 142, "에스프레소", `${config.equipment.espressoMachines}대`, "amber");
  drawCounterCell(context, 406, 84, 146, "제조대", `${config.equipment.grinderThroughput}잔/h`, "green");

  context.fillStyle = "#1d2b3f";
  context.strokeStyle = "#38BDF8";
  roundRect(context, PICKUP.x, PICKUP.y, PICKUP.w, PICKUP.h, 8);
  context.fill();
  context.stroke();
  drawText(context, "픽업대", PICKUP.x + 18, PICKUP.y + 34, "#a5e6ff", "700 17px system-ui");
  drawText(context, `${config.equipment.pickupCapacity}잔 대기 가능`, PICKUP.x + 18, PICKUP.y + 58, "#a8b3c2", "12px system-ui");
  context.restore();
}

function drawQueueLane(context: CanvasRenderingContext2D, metrics: SceneMetrics) {
  const color = TONE_COLORS[metrics.congestionTone].main;
  context.save();
  context.strokeStyle = color;
  context.lineWidth = 2;
  roundRect(context, QUEUE_AREA.x, QUEUE_AREA.y, QUEUE_AREA.w, QUEUE_AREA.h, 8);
  context.stroke();
  drawText(context, "대기줄", QUEUE_AREA.x + 12, QUEUE_AREA.y + 24, "#f8d38b", "700 15px system-ui");
  drawText(context, `${metrics.queueCount}명 표시`, QUEUE_AREA.x + 12, QUEUE_AREA.y + 44, "#a8b3c2", "12px system-ui");
  context.restore();
}

function drawTables(context: CanvasRenderingContext2D, metrics: SceneMetrics) {
  context.save();
  drawText(context, "좌석 공간", SEATING_AREA.x + 4, SEATING_AREA.y - 16, "#d9e2ec", "700 16px system-ui");
  drawText(context, `쾌적도 ${Math.round(metrics.comfort)} / 좌석 점유 ${metrics.occupiedTables}/${metrics.tableCount}`, SEATING_AREA.x + 90, SEATING_AREA.y - 16, "#7d8b9c", "12px system-ui");

  metrics.tablePoints.slice(0, metrics.tableCount).forEach((point, index) => {
    const occupied = index < metrics.occupiedTables;
    const comfortColor = TONE_COLORS[metrics.comfortTone].main;

    context.globalAlpha = occupied ? 0.26 : 0.12;
    context.fillStyle = comfortColor;
    context.beginPath();
    context.arc(point.x, point.y, 42, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1;

    context.fillStyle = occupied ? "#9a6f47" : "#51402c";
    context.strokeStyle = occupied ? "#ffd08c" : "#9a7652";
    context.lineWidth = 2;
    roundRect(context, point.x - 32, point.y - 22, 64, 44, 8);
    context.fill();
    context.stroke();

    drawChair(context, point.x - 50, point.y - 10);
    drawChair(context, point.x + 38, point.y - 10);
    drawChair(context, point.x - 14, point.y - 42);
    drawChair(context, point.x - 14, point.y + 30);

    drawText(context, `${index + 1}`, point.x, point.y + 5, occupied ? "#160f0a" : "#d1a673", "700 12px system-ui", "center");
  });
  context.restore();
}

function drawMovingCustomers(
  context: CanvasRenderingContext2D,
  config: EnvironmentConfig,
  day: DayResult,
  metrics: SceneMetrics,
  time: number,
  reducedMotion: boolean,
) {
  const speed = reducedMotion ? 0 : 1;
  const customerCount = metrics.customerCount;

  for (let index = 0; index < customerCount; index += 1) {
    const table = metrics.tablePoints[index % Math.max(1, metrics.tableCount)];
    const route = createCustomerRoute(index, table, config, day);
    const cycle = 21000 + (index % 7) * 1400 + metrics.congestion * 34;
    const progress = reducedMotion ? (index % 10) / 10 : ((time * speed + index * 1730) % cycle) / cycle;
    const sample = sampleRoute(route, progress);
    const tone = customerTone(sample.state);
    const radius = sample.state === "착석" ? 8 : 10;

    drawCustomer(context, sample.point, radius, tone, sample.state, sample.moving, time + index * 180);
  }
}

function drawMovingStaff(
  context: CanvasRenderingContext2D,
  config: EnvironmentConfig,
  day: DayResult,
  metrics: SceneMetrics,
  time: number,
  reducedMotion: boolean,
) {
  const speedPenalty = 1 - clamp(day.staffFatigue / 180, 0, 0.38);

  for (let index = 0; index < metrics.staffCount; index += 1) {
    const role = staffRole(index, config);
    const path = staffPath(role, index, metrics);
    const cycle = (role === "정리" ? 15000 : 11000) / speedPenalty;
    const progress = reducedMotion ? (index % 5) / 5 : ((time + index * 920) % cycle) / cycle;
    const point = sampleLoop(path, progress);
    const color = day.staffFatigue > 72 ? TONE_COLORS.amber.main : role === "계산" ? TONE_COLORS.cyan.main : TONE_COLORS.green.main;

    drawStaff(context, point, color, role, index);
  }
}

function createCustomerRoute(index: number, table: Point, config: EnvironmentConfig, day: DayResult): RouteStep[] {
  const queuePoint = QUEUE_POINTS[index % QUEUE_POINTS.length];
  const tableApproach = { x: table.x, y: table.y - 58 };
  const queueHold = 0.18 + clamp(day.averageWaitMinutes / 22, 0, 0.26);
  const pickupHold = 0.07 + clamp(config.menu.complexity / 220, 0, 0.12);
  const dineHold = 0.22 + clamp(config.customers.remoteWorkerShare / 260, 0, 0.2);

  return [
    { point: ENTRY, hold: 0, state: "입장" },
    { point: { x: 832, y: 210 }, hold: 0, state: "입장" },
    { point: queuePoint, hold: queueHold, state: "대기" },
    { point: POS_POINT, hold: 0.08, state: "주문" },
    { point: PICKUP_POINT, hold: pickupHold, state: "픽업" },
    { point: tableApproach, hold: 0, state: "착석" },
    { point: table, hold: dineHold, state: "착석" },
    { point: { x: 724, y: 492 }, hold: 0, state: "퇴장" },
    { point: EXIT, hold: 0.02, state: "퇴장" },
  ];
}

function sampleRoute(route: RouteStep[], progress: number): RouteSample {
  const legs = route.slice(1).map((step, index) => ({
    from: route[index],
    to: step,
    travel: Math.max(0.06, distance(route[index].point, step.point) / 620),
    hold: step.hold,
  }));
  const total = legs.reduce((sum, leg) => sum + leg.travel + leg.hold, 0);
  let cursor = clamp(progress, 0, 1) * total;

  for (const leg of legs) {
    if (cursor <= leg.travel) {
      const local = easeInOut(cursor / leg.travel);
      return {
        point: lerpPoint(leg.from.point, leg.to.point, local),
        state: leg.to.state,
        moving: true,
      };
    }
    cursor -= leg.travel;

    if (cursor <= leg.hold) {
      return {
        point: leg.to.point,
        state: leg.to.state,
        moving: false,
      };
    }
    cursor -= leg.hold;
  }

  return { point: route[route.length - 1].point, state: "퇴장", moving: false };
}

function staffRole(index: number, config: EnvironmentConfig): StaffRole {
  if (index < config.staff.cashiers) {
    return "계산";
  }
  if (index % 5 === 0) {
    return "정리";
  }
  if (index % 3 === 0) {
    return "픽업";
  }
  return "제조";
}

function staffPath(role: StaffRole, index: number, metrics: SceneMetrics) {
  if (role === "계산") {
    return [STAFF_HOME_POINTS[0], { x: 582, y: 136 }, { x: 548, y: 156 }, STAFF_HOME_POINTS[0]];
  }

  if (role === "픽업") {
    return [BAR_POINT, { x: 432, y: 128 }, PICKUP_POINT, { x: 610, y: 180 }, BAR_POINT];
  }

  if (role === "정리") {
    const table = metrics.tablePoints[(index * 3) % Math.max(1, metrics.tableCount)] ?? CLEANING_POINT;
    return [CLEANING_POINT, { x: 176, y: 250 }, table, { x: table.x + 20, y: table.y + 36 }, CLEANING_POINT];
  }

  return [BAR_POINT, { x: 320, y: 126 }, { x: 382, y: 128 }, { x: 472, y: 126 }, BAR_POINT];
}

function drawCustomer(
  context: CanvasRenderingContext2D,
  point: Point,
  radius: number,
  color: string,
  state: CustomerState,
  moving: boolean,
  phase: number,
) {
  const bob = moving ? Math.sin(phase * 0.018) * 1.8 : 0;
  context.save();
  context.shadowColor = color;
  context.shadowBlur = moving ? 12 : 5;
  context.fillStyle = color;
  context.strokeStyle = "rgba(255,255,255,0.55)";
  context.lineWidth = 1;
  context.beginPath();
  context.arc(point.x, point.y + bob, radius, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.shadowBlur = 0;

  context.fillStyle = "rgba(5,8,13,0.55)";
  context.beginPath();
  context.arc(point.x, point.y + bob, radius * 0.32, 0, Math.PI * 2);
  context.fill();

  if (state === "주문" || state === "픽업") {
    context.fillStyle = "#f8d38b";
    context.fillRect(point.x + radius * 0.45, point.y - radius * 0.7 + bob, 7, 5);
  }
  context.restore();
}

function drawStaff(context: CanvasRenderingContext2D, point: Point, color: string, role: StaffRole, index: number) {
  context.save();
  context.shadowColor = color;
  context.shadowBlur = 12;
  context.fillStyle = color;
  context.strokeStyle = "rgba(255,255,255,0.7)";
  context.lineWidth = 1.2;
  roundRect(context, point.x - 12, point.y - 12, 24, 24, 5);
  context.fill();
  context.stroke();
  context.shadowBlur = 0;
  drawText(context, role.slice(0, 1), point.x, point.y + 5, "#061018", "800 12px system-ui", "center");
  drawText(context, `${index + 1}`, point.x + 16, point.y + 14, "#a8b3c2", "9px system-ui");
  context.restore();
}

function createSceneMetrics(config: EnvironmentConfig, day: DayResult): SceneMetrics {
  const queueCount = Math.min(QUEUE_POINTS.length, Math.max(0, Math.round(day.peakQueue / 1.45)));
  const tableCount = Math.min(TABLE_POINTS.length, Math.max(6, Math.ceil(config.space.seats / 6)));
  const occupiedTables = Math.min(tableCount, Math.round((day.occupancyRate / 100) * tableCount));
  const seatedGuests = Math.min(tableCount * 3, Math.max(1, Math.round((day.occupancyRate / 100) * tableCount * 2.3)));
  const staffCount = Math.min(STAFF_HOME_POINTS.length, Math.max(0, config.staff.baristas + config.staff.cashiers));
  const airRisk = clamp(day.co2Risk, 0, 100);
  const congestion = clamp((day.peakQueue / 34) * 100, 0, 100);
  const comfort = clamp(day.ambienceScore, 0, 100);
  const noiseRisk = clamp((config.ambience.noiseDb - 45) * 2.2, 0, 100);
  const flowScore = clamp((config.space.pathEfficiency + config.space.counterLayout) / 2, 0, 100);
  const lightingOpacity = clamp(config.ambience.lightingLux / 1500, 0.10, 0.42);
  const lightColor = colorTemperatureToLight(config.ambience.colorTemperature);
  const tableSpacingScale = 0.86 + config.space.tableSpacing / 310;
  const tablePoints = TABLE_POINTS.map((point) => ({
    x: clamp(470 + (point.x - 470) * tableSpacingScale, 138, 828),
    y: clamp(424 + (point.y - 424) * tableSpacingScale, 298, 528),
  }));
  const congestionTone = riskTone(congestion);
  const airTone = riskTone(airRisk);
  const comfortTone: Tone = comfort > 74 ? "green" : comfort > 52 ? "amber" : "red";
  const noiseTone = riskTone(noiseRisk);
  const throughput = day.visitors > 0 ? Math.round((day.served / day.visitors) * 100) : 0;
  const customerCount = Math.min(42, Math.max(10, Math.round(queueCount + occupiedTables * 1.9 + day.visitors / 95)));

  return {
    queueCount,
    tableCount,
    occupiedTables,
    seatedGuests,
    staffCount,
    airRisk,
    congestion,
    comfort,
    noiseRisk,
    flowScore,
    lightingOpacity,
    lightColor,
    congestionTone,
    airTone,
    comfortTone,
    noiseTone,
    throughput,
    tablePoints,
    customerCount,
  };
}

function hitTest(point: Point, metrics: SceneMetrics, day: DayResult, config: EnvironmentConfig): ZoneInfo | null {
  const tableIndex = metrics.tablePoints
    .slice(0, metrics.tableCount)
    .findIndex((table) => distance(point, table) < 44);

  if (tableIndex >= 0) {
    const occupied = tableIndex < metrics.occupiedTables;
    return {
      key: `table-${tableIndex}`,
      title: `테이블 ${tableIndex + 1}`,
      description: occupied
        ? "현재 손님이 머무는 좌석입니다. 체류시간, 좌석 간격, 조명, 소음이 만족도에 영향을 줍니다."
        : "비어 있는 좌석입니다. 좌석 수와 간격을 조정하면 회전율과 쾌적도가 같이 변합니다.",
      value: `점유율 ${Math.round(day.occupancyRate)}% · 쾌적도 ${Math.round(metrics.comfort)}`,
    };
  }

  if (pointInRect(point, PICKUP)) {
    return {
      key: "pickup",
      title: "픽업대",
      description: "제조가 끝난 음료가 쌓이는 지점입니다. 픽업 용량이 부족하면 동선이 막히고 대기 체감이 나빠집니다.",
      value: `픽업 용량 ${config.equipment.pickupCapacity}잔`,
    };
  }

  if (pointInRect(point, COUNTER)) {
    return {
      key: "counter",
      title: "계산대 / 제조대",
      description: "주문 접수, 에스프레소 제조, 음료 조립이 일어나는 핵심 작업대입니다. 직원 수와 장비 수가 처리율을 좌우합니다.",
      value: `처리율 ${metrics.throughput}% · 직원 ${metrics.staffCount}명`,
    };
  }

  if (pointInRect(point, QUEUE_AREA)) {
    return {
      key: "queue",
      title: "대기줄",
      description: "손님이 주문 전 기다리는 구간입니다. 평균 대기시간이 길어지면 이탈률과 재방문 의향이 나빠집니다.",
      value: `피크 대기 ${day.peakQueue}명 · 평균 ${day.averageWaitMinutes.toFixed(1)}분`,
    };
  }

  if (distance(point, ENTRY) < 50) {
    return {
      key: "entry",
      title: "입구",
      description: "신규 손님이 유입되는 지점입니다. 유동인구, 날씨, 마케팅, 요일 효과가 이 흐름을 바꿉니다.",
      value: `방문객 ${day.visitors.toLocaleString("ko-KR")}명`,
    };
  }

  if (distance(point, EXIT) < 50) {
    return {
      key: "exit",
      title: "출구",
      description: "식사와 픽업을 마친 손님이 나가는 지점입니다. 만족도와 재방문 의향은 퇴장 시점의 경험을 반영합니다.",
      value: `만족도 ${Math.round(day.satisfaction)} · 재방문 ${Math.round(day.revisitIntent)}%`,
    };
  }

  if (pointInRect(point, SEATING_AREA)) {
    return {
      key: "seating",
      title: "좌석 공간",
      description: "앉아서 머무는 구역입니다. 좌석 밀도, 테이블 간격, 조명, 음악, 온습도가 체류 품질을 바꿉니다.",
      value: `좌석 ${config.space.seats}석 · 회전율 ${day.seatTurnover.toFixed(1)}`,
    };
  }

  if (pointInRect(point, FLOOR)) {
    return {
      key: "floor",
      title: "공용 동선",
      description: "입장, 대기, 픽업, 착석, 퇴장이 겹치는 공간입니다. 동선 효율이 낮으면 혼잡과 체감 대기가 커집니다.",
      value: `동선 효율 ${config.space.pathEfficiency}%`,
    };
  }

  return null;
}

function defaultZone(metrics: SceneMetrics, day: DayResult): ZoneInfo {
  return {
    key: "overview",
    title: "카페 전체",
    description: "변수를 조정하면 손님 수, 대기열, 좌석 점유, 직원 이동, 조명과 공기질 레이어가 즉시 반영됩니다.",
    value: `처리 ${day.served.toLocaleString("ko-KR")}명 · 대기 ${day.averageWaitMinutes.toFixed(1)}분 · 혼잡 ${Math.round(metrics.congestion)}`,
  };
}

function MetricChip({ label, value, tone }: { label: string; value: string; tone: Tone }) {
  return (
    <span
      className="border bg-[var(--bg-deepest)]/85 px-2 py-1 text-[10.5px] text-[var(--text-secondary)]"
      style={{ borderColor: TONE_COLORS[tone].main }}
    >
      <span className="text-[var(--text-muted)]">{label}</span>{" "}
      <span className="font-semibold" style={{ color: TONE_COLORS[tone].text }}>{value}</span>
    </span>
  );
}

function drawCounterCell(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
  tone: Tone,
) {
  context.save();
  context.fillStyle = "#182235";
  context.strokeStyle = TONE_COLORS[tone].main;
  context.lineWidth = 1.5;
  roundRect(context, x, y, width, 56, 6);
  context.fill();
  context.stroke();
  drawText(context, label, x + 12, y + 22, TONE_COLORS[tone].text, "700 14px system-ui");
  drawText(context, value, x + 12, y + 43, "#d9e2ec", "12px system-ui");
  context.restore();
}

function drawChair(context: CanvasRenderingContext2D, x: number, y: number) {
  context.save();
  context.fillStyle = "#26354a";
  context.strokeStyle = "#7d8b9c";
  roundRect(context, x, y, 28, 20, 5);
  context.fill();
  context.stroke();
  context.restore();
}

function customerTone(state: CustomerState) {
  if (state === "대기") return TONE_COLORS.amber.main;
  if (state === "주문" || state === "픽업") return TONE_COLORS.cyan.main;
  if (state === "착석") return "#D9A66D";
  if (state === "퇴장") return TONE_COLORS.violet.main;
  return "#7dd3fc";
}

function sampleLoop(points: Point[], progress: number) {
  const wrapped = ((progress % 1) + 1) % 1;
  const totalSegments = points.length;
  const raw = wrapped * totalSegments;
  const index = Math.floor(raw) % points.length;
  const nextIndex = (index + 1) % points.length;
  const local = easeInOut(raw - Math.floor(raw));
  return lerpPoint(points[index], points[nextIndex], local);
}

function createViewTransform(width: number, height: number, compact: boolean) {
  const padding = compact ? 8 : 16;
  const scale = Math.min((width - padding * 2) / VIEW_W, (height - padding * 2) / VIEW_H) * (compact ? 1.08 : 1.03);
  return {
    offsetX: (width - VIEW_W * scale) / 2,
    offsetY: compact ? 6 : (height - VIEW_H * scale) / 2,
    scale,
  };
}

function colorTemperatureToLight(value: number) {
  if (value < 3200) return "#FFD39A";
  if (value < 4600) return "#FFE8BE";
  if (value < 5600) return "#E6F0FF";
  return "#C7DDFF";
}

function riskTone(value: number): Tone {
  if (value > 72) return "red";
  if (value > 42) return "amber";
  return "cyan";
}

function drawRadialEllipse(
  context: CanvasRenderingContext2D,
  center: Point,
  rx: number,
  ry: number,
  color: string,
  alpha: number,
) {
  context.save();
  context.translate(center.x, center.y);
  context.scale(rx, ry);
  const gradient = context.createRadialGradient(0, 0, 0, 0, 0, 1);
  gradient.addColorStop(0, withAlpha(color, alpha));
  gradient.addColorStop(1, withAlpha(color, 0));
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(0, 0, 1, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawLine(
  context: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  color: string,
  alpha: number,
  width: number,
) {
  context.save();
  context.globalAlpha = alpha;
  context.strokeStyle = color;
  context.lineWidth = width;
  context.beginPath();
  context.moveTo(from.x, from.y);
  context.lineTo(to.x, to.y);
  context.stroke();
  context.restore();
}

function drawRing(
  context: CanvasRenderingContext2D,
  point: Point,
  radius: number,
  color: string,
  alpha: number,
  width: number,
  dash?: number[],
) {
  context.save();
  context.globalAlpha = alpha;
  context.strokeStyle = color;
  context.lineWidth = width;
  if (dash) {
    context.setLineDash(dash);
  }
  context.beginPath();
  context.arc(point.x, point.y, radius, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

function drawText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  font: string,
  align: CanvasTextAlign = "left",
) {
  context.save();
  context.fillStyle = color;
  context.font = font;
  context.textAlign = align;
  context.fillText(text, x, y);
  context.restore();
}

function roundRect(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number) {
  const r = Math.min(radius, w / 2, h / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + w - r, y);
  context.quadraticCurveTo(x + w, y, x + w, y + r);
  context.lineTo(x + w, y + h - r);
  context.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  context.lineTo(x + r, y + h);
  context.quadraticCurveTo(x, y + h, x, y + h - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

function pointInRect(point: Point, rect: Rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
}

function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function lerpPoint(a: Point, b: Point, t: number): Point {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function easeInOut(value: number) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
