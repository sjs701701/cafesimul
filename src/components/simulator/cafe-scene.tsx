"use client";

import { useEffect, useState } from "react";
import type { DayResult, EnvironmentConfig } from "@/lib/simulation/types";

type CafeSceneProps = {
  config: EnvironmentConfig;
  day: DayResult;
};

type Point = {
  x: number;
  y: number;
};

type Tone = "cyan" | "green" | "amber" | "red" | "violet";

const TABLE_POINTS: Point[] = [
  { x: 205, y: 340 },
  { x: 326, y: 340 },
  { x: 447, y: 340 },
  { x: 568, y: 340 },
  { x: 205, y: 444 },
  { x: 326, y: 444 },
  { x: 447, y: 444 },
  { x: 568, y: 444 },
  { x: 205, y: 548 },
  { x: 326, y: 548 },
  { x: 447, y: 548 },
  { x: 568, y: 548 },
  { x: 716, y: 444 },
  { x: 716, y: 548 },
  { x: 836, y: 444 },
  { x: 836, y: 548 },
];

const QUEUE_POINTS: Point[] = [
  { x: 792, y: 151 },
  { x: 842, y: 151 },
  { x: 892, y: 151 },
  { x: 892, y: 193 },
  { x: 842, y: 193 },
  { x: 792, y: 193 },
  { x: 742, y: 193 },
  { x: 742, y: 235 },
  { x: 792, y: 235 },
  { x: 842, y: 235 },
  { x: 892, y: 235 },
  { x: 892, y: 277 },
  { x: 842, y: 277 },
  { x: 792, y: 277 },
  { x: 742, y: 277 },
  { x: 692, y: 277 },
  { x: 692, y: 235 },
  { x: 692, y: 193 },
  { x: 642, y: 193 },
  { x: 642, y: 235 },
  { x: 642, y: 277 },
  { x: 592, y: 277 },
  { x: 592, y: 235 },
  { x: 592, y: 193 },
];

const STAFF_POINTS: Point[] = [
  { x: 178, y: 146 },
  { x: 238, y: 146 },
  { x: 310, y: 146 },
  { x: 370, y: 146 },
  { x: 430, y: 146 },
  { x: 490, y: 146 },
  { x: 550, y: 146 },
  { x: 205, y: 214 },
  { x: 285, y: 214 },
  { x: 365, y: 214 },
  { x: 445, y: 214 },
  { x: 525, y: 214 },
  { x: 605, y: 214 },
];

const TONE_COLORS: Record<Tone, { main: string; soft: string; text: string }> = {
  cyan: { main: "#38BDF8", soft: "rgba(56,189,248,0.14)", text: "#A5E6FF" },
  green: { main: "#22C55E", soft: "rgba(34,197,94,0.14)", text: "#B5F3C9" },
  amber: { main: "#F59E0B", soft: "rgba(245,158,11,0.16)", text: "#FFD796" },
  red: { main: "#EF4444", soft: "rgba(239,68,68,0.16)", text: "#FFB4B4" },
  violet: { main: "#A78BFA", soft: "rgba(167,139,250,0.15)", text: "#D7CCFF" },
};

export function CafeScene({ config, day }: CafeSceneProps) {
  const [compact, setCompact] = useState(false);
  const queueCount = Math.min(QUEUE_POINTS.length, Math.max(0, Math.round(day.peakQueue / 1.35)));
  const tableCount = Math.min(TABLE_POINTS.length, Math.max(6, Math.ceil(config.space.seats / 6)));
  const occupiedTables = Math.min(tableCount, Math.round((day.occupancyRate / 100) * tableCount));
  const seatedGuests = Math.min(tableCount * 3, Math.max(1, Math.round((day.occupancyRate / 100) * tableCount * 3)));
  const staffCount = Math.min(STAFF_POINTS.length, Math.max(0, config.staff.baristas + config.staff.cashiers));
  const airRisk = clamp(day.co2Risk, 0, 100);
  const congestion = clamp((day.peakQueue / 34) * 100, 0, 100);
  const comfort = clamp(day.ambienceScore, 0, 100);
  const noiseRisk = clamp((config.ambience.noiseDb - 45) * 2.2, 0, 100);
  const flowScore = clamp((config.space.pathEfficiency + config.space.counterLayout) / 2, 0, 100);
  const lightingOpacity = clamp(config.ambience.lightingLux / 1500, 0.11, 0.48);
  const lightColor = colorTemperatureToLight(config.ambience.colorTemperature);
  const tableSpacingScale = 0.82 + config.space.tableSpacing / 250;
  const tablePoints = TABLE_POINTS.map((point) => ({
    x: clamp(512 + (point.x - 512) * tableSpacingScale, 154, 856),
    y: clamp(452 + (point.y - 452) * tableSpacingScale, 350, 560),
  }));
  const congestionTone = riskTone(congestion);
  const airTone = riskTone(airRisk);
  const comfortTone = comfort > 74 ? "green" : comfort > 52 ? "amber" : "red";
  const throughput = day.visitors > 0 ? Math.round((day.served / day.visitors) * 100) : 0;
  const totalStaffCapacity = Math.max(1, staffCount * 70);
  const barLoad = clamp((day.served / totalStaffCapacity) * 100, 0, 100);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setCompact(media.matches);

    update();
    media.addEventListener("change", update);

    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <div className="topdown-shell relative flex h-full min-h-[420px] flex-col overflow-hidden bg-[#05080C]">
      <div className="topdown-grid" />
      <div className="relative z-20 grid grid-cols-[1fr_auto] items-center gap-2 border-b border-[#263241] bg-[#07090D]/90 px-3 py-2 md:hidden">
        <MetricBlock
          title="운영 평면 관제"
          items={[`대기 ${day.peakQueue}`, `처리 ${throughput}%`, `좌석 ${Math.round(day.occupancyRate)}%`]}
        />
        <LayerLegend
          compact
          items={[
            { label: "혼잡", tone: congestionTone },
            { label: "공기", tone: airTone },
            { label: "쾌적", tone: comfortTone },
          ]}
        />
      </div>
      <div className="pointer-events-none absolute inset-x-4 top-4 z-20 hidden flex-wrap items-start justify-between gap-3 md:flex">
        <MetricBlock
          title="운영 평면 관제"
          items={[
            `대기 ${day.peakQueue}`,
            `처리 ${throughput}%`,
            `좌석 ${Math.round(day.occupancyRate)}%`,
          ]}
        />
        <LayerLegend
          items={[
            { label: "혼잡", tone: congestionTone },
            { label: "공기질", tone: airTone },
            { label: "쾌적", tone: comfortTone },
            { label: "동선", tone: flowScore > 70 ? "green" : "amber" },
          ]}
        />
      </div>

      <div className="relative z-10 min-h-0 flex-1">
        <svg
          data-testid="topdown-map"
          className="absolute inset-0 h-full w-full"
          width="100%"
          height="100%"
          viewBox="0 0 1000 680"
          preserveAspectRatio={compact ? "xMidYMin slice" : "xMidYMid meet"}
          role="img"
          aria-label="카페를 위에서 내려다본 2D 운영 평면도"
        >
        <defs>
          <pattern id="floor-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#263241" strokeOpacity="0.42" strokeWidth="1" />
          </pattern>
          <pattern id="queue-hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="10" stroke="#F59E0B" strokeOpacity="0.5" strokeWidth="2" />
          </pattern>
          <linearGradient id="counter-wood" x1="0%" x2="100%">
            <stop offset="0%" stopColor="#55402F" />
            <stop offset="52%" stopColor="#896745" />
            <stop offset="100%" stopColor="#B78557" />
          </linearGradient>
          <radialGradient id="light-pool">
            <stop offset="0%" stopColor={lightColor} stopOpacity={lightingOpacity} />
            <stop offset="100%" stopColor={lightColor} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="air-risk">
            <stop offset="0%" stopColor={TONE_COLORS[airTone].main} stopOpacity={0.24 + airRisk / 360} />
            <stop offset="100%" stopColor={TONE_COLORS[airTone].main} stopOpacity="0" />
          </radialGradient>
          <filter id="soft-glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <marker id="flow-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M 0 0 L 8 4 L 0 8 z" fill={flowScore > 68 ? "#22C55E" : "#F59E0B"} opacity="0.78" />
          </marker>
        </defs>

        <rect x="72" y="72" width="856" height="536" fill="#0B111A" stroke="#263241" strokeWidth="2" />
        <rect x="92" y="92" width="816" height="496" fill="url(#floor-grid)" opacity="0.9" />
        <rect x="92" y="92" width="816" height="496" fill="#101722" opacity="0.66" />

        <g aria-label="환경 레이어">
          <ellipse cx="484" cy="354" rx="334" ry="212" fill="url(#light-pool)" />
          <ellipse cx="554" cy="408" rx="282" ry="180" fill="url(#air-risk)" />
          <rect x="624" y="116" width="284" height="224" fill={TONE_COLORS[congestionTone].main} opacity={0.04 + congestion / 1200} />
          <rect x="128" y="276" width="770" height="292" fill={TONE_COLORS[comfortTone].main} opacity={0.035 + comfort / 2200} />
          <circle cx="548" cy="398" r={104 + noiseRisk * 1.25} fill="none" stroke="#F59E0B" strokeOpacity="0.18" strokeWidth="2" />
          <circle cx="548" cy="398" r={70 + noiseRisk * 0.8} fill="none" stroke="#38BDF8" strokeOpacity="0.12" strokeWidth="2" />
        </g>

        <g aria-label="벽과 출입구">
          <line x1="72" y1="72" x2="928" y2="72" stroke="#3A4758" strokeWidth="8" />
          <line x1="72" y1="72" x2="72" y2="608" stroke="#3A4758" strokeWidth="8" />
          <line x1="72" y1="608" x2="928" y2="608" stroke="#3A4758" strokeWidth="8" />
          <line x1="928" y1="72" x2="928" y2="176" stroke="#3A4758" strokeWidth="8" />
          <line x1="928" y1="314" x2="928" y2="608" stroke="#3A4758" strokeWidth="8" />
          <rect x="921" y="184" width="16" height="116" fill="#38BDF8" opacity="0.58" />
          <text x="882" y="246" fill="#8B98A8" fontSize="13" fontFamily="monospace" transform="rotate(90 882 246)">
            ENTRY
          </text>
          {[180, 330, 480, 630].map((x) => (
            <rect key={x} x={x} y="76" width="92" height="10" fill="#38BDF8" opacity="0.24" />
          ))}
        </g>

        <g aria-label="서비스 동선">
          <path
            d="M 898 244 C 818 244, 782 236, 732 222 C 640 196, 582 218, 492 230 C 400 242, 290 232, 142 230"
            fill="none"
            stroke="#D9E2EC"
            strokeOpacity="0.22"
            strokeWidth="18"
            strokeLinecap="round"
          />
          <path
            d="M 898 244 C 818 244, 782 236, 732 222 C 640 196, 582 218, 492 230 C 400 242, 290 232, 142 230"
            fill="none"
            stroke={flowScore > 68 ? "#22C55E" : "#F59E0B"}
            strokeOpacity="0.72"
            strokeWidth="3"
            strokeDasharray="10 9"
            strokeLinecap="round"
            markerEnd="url(#flow-arrow)"
          />
        </g>

        <g aria-label="카운터와 제조 구역">
          <rect x="150" y="114" width="455" height="82" fill="url(#counter-wood)" stroke="#9B7655" strokeWidth="2" />
          <WorkCell x={160} y={126} width={112} label="POS" value={`${config.equipment.posTerminals}대`} tone="cyan" />
          <WorkCell x={298} y={126} width={94} label="BAR" value={`${config.equipment.espressoMachines}대`} tone="amber" />
          <WorkCell x={418} y={128} width={164} label="PICKUP" value={`${config.equipment.pickupCapacity}잔`} tone="green" />
          <rect x="128" y="208" width="500" height="42" fill="#38BDF8" opacity={0.08 + flowScore / 1800} stroke="#38BDF8" strokeOpacity="0.36" />
          <text x="142" y="234" fill="#8B98A8" fontSize="12" fontFamily="monospace">SERVICE AISLE</text>
          <MapBadge x={500} y={252} label="BAR LOAD" value={`${Math.round(barLoad)}%`} tone={riskTone(barLoad)} />
        </g>

        <g aria-label="대기열 구역">
          <path
            d="M 776 128 L 894 128 L 894 316 L 682 316 L 682 160 L 740 160"
            fill="none"
            stroke={TONE_COLORS[congestionTone].main}
            strokeWidth="3"
            strokeDasharray="9 7"
            opacity="0.88"
          />
          <rect x="660" y="116" width="250" height="220" fill="url(#queue-hatch)" opacity={0.08 + congestion / 900} />
          <ZoneTitle x={674} y={146} title="QUEUE LANE" subtitle={`평균 ${day.averageWaitMinutes.toFixed(1)}분`} />
          <MapBadge x={765} y={306} label="ABANDON" value={`${day.abandonmentRate.toFixed(1)}%`} tone={day.abandonmentRate > 8 ? "red" : "amber"} />
          {QUEUE_POINTS.slice(0, queueCount).map((point, index) => (
            <PersonDot
              key={`queue-${index}`}
              x={point.x}
              y={point.y}
              color={index % 4 === 0 ? TONE_COLORS[congestionTone].main : "#94A3B8"}
              label={index === 0 ? "Q" : undefined}
            />
          ))}
        </g>

        <g aria-label="좌석 구역">
          <ZoneTitle x={142} y={292} title="SEATING / DWELL AREA" subtitle={`점유 ${Math.round(day.occupancyRate)}%`} />
          <MapBadge x={760} y={334} label="COMFORT" value={`${Math.round(comfort)}`} tone={comfortTone} />
          {tablePoints.slice(0, tableCount).map((point, index) => {
            const occupied = index < occupiedTables;
            const guestSlots = Math.max(0, Math.min(3, seatedGuests - index * 3));

            return (
              <g
                key={`table-${index}`}
                data-testid="table-marker"
                data-x={Math.round(point.x)}
                data-y={Math.round(point.y)}
              >
                <Table x={point.x} y={point.y} occupied={occupied} comfort={comfort} />
                {Array.from({ length: guestSlots }, (_, guestIndex) => (
                  <PersonDot
                    key={`guest-${index}-${guestIndex}`}
                    x={point.x + [-24, 0, 24][guestIndex]}
                    y={point.y + (guestIndex === 1 ? -36 : 36)}
                    color={guestIndex === 0 ? "#38BDF8" : guestIndex === 1 ? "#D9A66D" : "#A78BFA"}
                  />
                ))}
              </g>
            );
          })}
        </g>

        <g aria-label="직원 위치">
          {STAFF_POINTS.slice(0, staffCount).map((point, index) => {
            const cashier = index < config.staff.cashiers;
            const tone = day.staffFatigue > 72 ? "amber" : cashier ? "cyan" : "green";
            return (
              <StaffMarker
                key={`staff-${index}`}
                x={point.x}
                y={point.y}
                label={cashier ? "C" : "B"}
                color={TONE_COLORS[tone].main}
              />
            );
          })}
          <MapBadge x={120} y={184} label="STAFF" value={`${staffCount}명`} tone={day.staffFatigue > 72 ? "amber" : "green"} />
        </g>

        <g aria-label="상태 바">
          <StatusBar x={116} y={628} label="CONGESTION" value={congestion} color={TONE_COLORS[congestionTone].main} />
          <StatusBar x={386} y={628} label="COMFORT" value={comfort} color={TONE_COLORS[comfortTone].main} />
          <StatusBar x={656} y={628} label="AIR RISK" value={airRisk} color={TONE_COLORS[airTone].main} />
        </g>
        </svg>
      </div>
    </div>
  );
}

function MetricBlock({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="border border-[#263241] bg-[#07090D]/84 px-3 py-2 shadow-[0_12px_36px_rgba(0,0,0,0.35)] backdrop-blur">
      <p className="text-[10px] font-semibold uppercase text-[#5F6B7A]">{title}</p>
      <div className="mt-1 flex flex-wrap gap-3 font-mono text-[11px] text-[#D9E2EC]">
        {items.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </div>
  );
}

function LayerLegend({
  items,
  compact = false,
}: {
  items: { label: string; tone: Tone }[];
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? "grid gap-1 border border-[#263241] bg-[#07090D]/84 px-2 py-1.5"
          : "flex flex-wrap justify-end gap-1.5 border border-[#263241] bg-[#07090D]/84 px-2.5 py-2 shadow-[0_12px_36px_rgba(0,0,0,0.35)] backdrop-blur"
      }
    >
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5 font-mono text-[10px] text-[#A8B3C2]">
          <span className="h-2 w-2" style={{ backgroundColor: TONE_COLORS[item.tone].main }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function WorkCell({
  x,
  y,
  width,
  label,
  value,
  tone,
}: {
  x: number;
  y: number;
  width: number;
  label: string;
  value: string;
  tone: Tone;
}) {
  return (
    <g>
      <rect x={x} y={y} width={width} height="58" fill="#111827" stroke={TONE_COLORS[tone].main} strokeOpacity="0.58" />
      <text x={x + 10} y={y + 25} fill="#D9E2EC" fontSize="12" fontFamily="monospace">
        {label}
      </text>
      <text x={x + 10} y={y + 43} fill={TONE_COLORS[tone].text} fontSize="11">
        {value}
      </text>
    </g>
  );
}

function ZoneTitle({
  x,
  y,
  title,
  subtitle,
}: {
  x: number;
  y: number;
  title: string;
  subtitle: string;
}) {
  return (
    <g>
      <text x={x} y={y} fill="#D9E2EC" fontSize="13" fontFamily="monospace">
        {title}
      </text>
      <text x={x} y={y + 17} fill="#8B98A8" fontSize="11">
        {subtitle}
      </text>
    </g>
  );
}

function MapBadge({
  x,
  y,
  label,
  value,
  tone,
}: {
  x: number;
  y: number;
  label: string;
  value: string;
  tone: Tone;
}) {
  return (
    <g>
      <rect x={x} y={y} width="108" height="38" fill="#07090D" fillOpacity="0.9" stroke={TONE_COLORS[tone].main} strokeOpacity="0.62" />
      <text x={x + 10} y={y + 15} fill="#6F7D8D" fontSize="9" fontFamily="monospace">
        {label}
      </text>
      <text x={x + 10} y={y + 30} fill={TONE_COLORS[tone].text} fontSize="13" fontWeight="700">
        {value}
      </text>
    </g>
  );
}

function Table({
  x,
  y,
  occupied,
  comfort,
}: {
  x: number;
  y: number;
  occupied: boolean;
  comfort: number;
}) {
  const tone = comfort > 74 ? "green" : comfort > 52 ? "amber" : "red";

  return (
    <g>
      <rect x={x - 50} y={y - 12} width="24" height="24" fill="#263241" stroke="#3A4758" />
      <rect x={x + 26} y={y - 12} width="24" height="24" fill="#263241" stroke="#3A4758" />
      <circle cx={x} cy={y} r="34" fill={TONE_COLORS[tone].soft} stroke={TONE_COLORS[tone].main} strokeOpacity="0.28" />
      <circle cx={x} cy={y} r="27" fill={occupied ? "#7A5A40" : "#302820"} stroke={occupied ? "#D9A66D" : "#5B4535"} strokeWidth="2" />
      <circle cx={x} cy={y} r="8" fill={occupied ? "#F59E0B" : "#263241"} opacity="0.45" />
    </g>
  );
}

function PersonDot({
  x,
  y,
  color,
  label,
}: {
  x: number;
  y: number;
  color: string;
  label?: string;
}) {
  return (
    <g filter="url(#soft-glow)">
      <circle cx={x} cy={y} r="12" fill={color} stroke="#D9E2EC" strokeOpacity="0.55" />
      <circle cx={x} cy={y} r="4" fill="#071016" opacity="0.44" />
      {label ? (
        <text x={x} y={y + 4} textAnchor="middle" fill="#071016" fontSize="10" fontWeight="700">
          {label}
        </text>
      ) : null}
    </g>
  );
}

function StaffMarker({
  x,
  y,
  color,
  label,
}: {
  x: number;
  y: number;
  color: string;
  label: string;
}) {
  return (
    <g filter="url(#soft-glow)">
      <rect x={x - 14} y={y - 14} width="28" height="28" fill={color} stroke="#D9E2EC" strokeOpacity="0.68" />
      <text x={x} y={y + 5} textAnchor="middle" fill="#071016" fontSize="12" fontWeight="800">
        {label}
      </text>
    </g>
  );
}

function StatusBar({
  x,
  y,
  label,
  value,
  color,
}: {
  x: number;
  y: number;
  label: string;
  value: number;
  color: string;
}) {
  const width = Math.max(4, Math.min(178, (value / 100) * 178));

  return (
    <g>
      <text x={x} y={y - 9} fill="#8B98A8" fontSize="11" fontFamily="monospace">
        {label}
      </text>
      <rect x={x} y={y} width="178" height="8" fill="#0A0E14" stroke="#263241" />
      <rect x={x} y={y} width={width} height="8" fill={color} />
      <text x={x + 192} y={y + 8} fill="#D9E2EC" fontSize="11" fontFamily="monospace">
        {Math.round(value)}
      </text>
    </g>
  );
}

function riskTone(value: number): Tone {
  if (value > 72) {
    return "red";
  }

  if (value > 42) {
    return "amber";
  }

  return "cyan";
}

function colorTemperatureToLight(value: number) {
  if (value < 3200) {
    return "#FFD39A";
  }

  if (value < 4600) {
    return "#FFE8BE";
  }

  if (value < 5600) {
    return "#E6F0FF";
  }

  return "#C7DDFF";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
