"use client";

import { Activity, CircleDollarSign, Gauge, Timer, UserX, Users } from "lucide-react";
import type { DayResult } from "@/lib/simulation/types";

export function KpiPanel({ day }: { day: DayResult }) {
  const kpis = [
    {
      id: "revenue",
      label: "예상 매출",
      value: `${Math.round(day.revenue / 10000).toLocaleString("ko-KR")}만`,
      accent: "text-[#22C55E]",
      icon: CircleDollarSign,
    },
    {
      id: "visitors",
      label: "방문객",
      value: `${day.visitors.toLocaleString("ko-KR")}명`,
      accent: "text-[#38BDF8]",
      icon: Users,
    },
    {
      id: "wait",
      label: "평균 대기",
      value: `${day.averageWaitMinutes.toFixed(1)}분`,
      accent: day.averageWaitMinutes > 10 ? "text-[#F59E0B]" : "text-[#D9E2EC]",
      icon: Timer,
    },
    {
      id: "satisfaction",
      label: "만족도",
      value: `${Math.round(day.satisfaction)}`,
      accent: day.satisfaction < 65 ? "text-[#EF4444]" : "text-[#22C55E]",
      icon: Gauge,
    },
    {
      id: "abandonment",
      label: "포기율",
      value: `${Math.round(day.abandonmentRate * 100)}%`,
      accent: day.abandonmentRate > 0.16 ? "text-[#EF4444]" : "text-[#8B98A8]",
      icon: UserX,
    },
    {
      id: "fatigue",
      label: "직원 피로",
      value: `${Math.round(day.staffFatigue)}%`,
      accent: day.staffFatigue > 70 ? "text-[#F59E0B]" : "text-[#8B98A8]",
      icon: Activity,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-px border-b border-[#263241] bg-[#263241] lg:grid-cols-6">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div key={kpi.label} className="bg-[#0A0E14]/95 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase text-[#5F6B7A]">{kpi.label}</span>
              <Icon size={13} className="text-[#5F6B7A]" />
            </div>
            <p data-testid={`kpi-${kpi.id}`} className={`mt-1 font-mono text-xl font-semibold ${kpi.accent}`}>
              {kpi.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
