"use client";

import { RotateCcw, Save, Upload } from "lucide-react";
import type { EnvironmentConfig } from "@/lib/simulation/types";
import { useSimulatorStore } from "@/store/simulator-store";
import {
  VariableControl,
  type VariableControlConfig,
} from "./variable-control";

type ControlGroup = {
  title: string;
  controls: VariableControlConfig[];
};

const leftGroups: ControlGroup[] = [
  {
    title: "수요 엔진",
    controls: [
      {
        kind: "number",
        label: "기본 방문률",
        description: "특별한 피크나 외부 요인을 적용하기 전 하루 예상 방문객 규모입니다. 전체 수요의 기준점으로 작동합니다.",
        path: "demand.baseVisitors",
        min: 60,
        max: 460,
        step: 5,
        unit: "명",
      },
      {
        kind: "number",
        label: "피크 강도",
        description: "출근, 점심, 오후 피크가 평시보다 얼마나 뾰족하게 몰리는지 나타냅니다. 높을수록 특정 시간대 대기열이 커집니다.",
        path: "demand.peakIntensity",
        min: 0.6,
        max: 2.2,
        step: 0.05,
        unit: "x",
      },
      {
        kind: "number",
        label: "주변 유동인구",
        description: "매장 앞을 지나가는 잠재 고객 밀도입니다. 높을수록 자연 유입 방문객이 증가합니다.",
        path: "demand.streetTraffic",
        min: 0,
        max: 100,
        unit: "%",
      },
      {
        kind: "number",
        label: "마케팅 강도",
        description: "프로모션, 앱 쿠폰, SNS 노출 등으로 추가 수요를 만드는 정도입니다.",
        path: "demand.marketingSpend",
        min: 0,
        max: 100,
        unit: "%",
      },
      {
        kind: "number",
        label: "경쟁점 압력",
        description: "주변 경쟁 카페가 고객을 흡수하는 정도입니다. 높을수록 방문 수요가 줄어듭니다.",
        path: "demand.competitorPressure",
        min: 0,
        max: 100,
        unit: "%",
      },
      {
        kind: "number",
        label: "주변 이벤트",
        description: "근처 행사, 오피스 출근일, 학교 일정처럼 일시적으로 유입을 올리는 요인입니다.",
        path: "demand.localEventBoost",
        min: 0,
        max: 100,
        unit: "%",
      },
      {
        kind: "number",
        label: "테이크아웃 비중",
        description: "방문객 중 매장 좌석을 사용하지 않고 가져가는 고객 비율입니다. 좌석 점유와 체류시간에 직접 영향을 줍니다.",
        path: "demand.takeawayShare",
        min: 0,
        max: 85,
        unit: "%",
      },
    ],
  },
  {
    title: "고객 세그먼트",
    controls: [
      {
        kind: "number",
        label: "출근객 비중",
        description: "빠른 주문과 짧은 체류를 선호하는 고객군 비율입니다. 오전 피크와 테이크아웃 성향을 강화합니다.",
        path: "customers.commuterShare",
        min: 0,
        max: 100,
        unit: "%",
      },
      {
        kind: "number",
        label: "학생 비중",
        description: "가격에 민감하고 체류 시간이 길어질 수 있는 고객군 비율입니다.",
        path: "customers.studentShare",
        min: 0,
        max: 100,
        unit: "%",
      },
      {
        kind: "number",
        label: "원격근무자 비중",
        description: "좌석, 조용함, 콘센트, 쾌적도에 민감한 장시간 체류 고객군 비율입니다.",
        path: "customers.remoteWorkerShare",
        min: 0,
        max: 100,
        unit: "%",
      },
      {
        kind: "number",
        label: "관광객 비중",
        description: "객단가와 메뉴 탐색 시간이 높아질 수 있는 비정기 방문 고객군 비율입니다.",
        path: "customers.touristShare",
        min: 0,
        max: 100,
        unit: "%",
      },
      {
        kind: "number",
        label: "가격 민감도",
        description: "가격 상승에 고객 만족과 구매 전환이 얼마나 민감하게 반응하는지 나타냅니다.",
        path: "customers.priceSensitivity",
        min: 0,
        max: 100,
        unit: "%",
      },
      {
        kind: "number",
        label: "대기 인내시간",
        description: "고객이 주문 전 대기열을 이탈하지 않고 참는 평균 시간입니다.",
        path: "customers.patienceMinutes",
        min: 3,
        max: 30,
        unit: "분",
      },
      {
        kind: "number",
        label: "기존 충성도",
        description: "브랜드나 매장에 대한 기본 재방문 성향입니다. 대기와 가격 충격을 일부 완충합니다.",
        path: "customers.loyalty",
        min: 0,
        max: 100,
        unit: "%",
      },
    ],
  },
  {
    title: "외부 조건",
    controls: [
      {
        kind: "select",
        label: "날씨",
        description: "외부 날씨 조건입니다. 비, 눈, 폭염은 유동인구와 방문 전환율을 낮추도록 반영됩니다.",
        path: "external.weather",
        options: [
          { label: "맑음", value: "clear" },
          { label: "비", value: "rain" },
          { label: "눈", value: "snow" },
          { label: "폭염", value: "heatwave" },
        ],
      },
      {
        kind: "select",
        label: "계절",
        description: "계절별 카페 수요와 실내 쾌적도 민감도를 조정하는 배경 조건입니다.",
        path: "external.season",
        options: [
          { label: "봄", value: "spring" },
          { label: "여름", value: "summer" },
          { label: "가을", value: "autumn" },
          { label: "겨울", value: "winter" },
        ],
      },
      {
        kind: "select",
        label: "요일 프로필",
        description: "평일, 금요일, 주말의 수요 패턴 차이를 적용합니다.",
        path: "external.weekdayProfile",
        options: [
          { label: "평일", value: "weekday" },
          { label: "금요일", value: "friday" },
          { label: "주말", value: "weekend" },
        ],
      },
      {
        kind: "number",
        label: "외부 온도",
        description: "외부 기온입니다. 폭염, 한파와 함께 방문 수요와 실내 환경 부담에 영향을 줍니다.",
        path: "external.temperatureOutdoor",
        min: -10,
        max: 38,
        unit: "C",
      },
    ],
  },
];

const rightGroups: ControlGroup[] = [
  {
    title: "직원 에이전트",
    controls: [
      {
        kind: "number",
        label: "바리스타",
        description: "음료 제조를 담당하는 직원 수입니다. 제조 처리량과 직원 피로도에 영향을 줍니다.",
        path: "staff.baristas",
        min: 1,
        max: 8,
        unit: "명",
      },
      {
        kind: "number",
        label: "캐셔",
        description: "주문 접수와 결제를 담당하는 직원 수입니다. 주문 대기 병목을 줄입니다.",
        path: "staff.cashiers",
        min: 1,
        max: 5,
        unit: "명",
      },
      {
        kind: "number",
        label: "숙련도",
        description: "직원이 주문 처리와 음료 제조를 얼마나 빠르고 정확하게 수행하는지 나타냅니다.",
        path: "staff.skill",
        min: 0,
        max: 100,
        unit: "%",
      },
      {
        kind: "number",
        label: "초기 피로도",
        description: "영업 시작 시 직원이 이미 가지고 있는 피로 수준입니다. 높을수록 처리 속도와 품질이 저하됩니다.",
        path: "staff.fatigue",
        min: 0,
        max: 100,
        unit: "%",
      },
      {
        kind: "number",
        label: "휴식 주기",
        description: "직원이 휴식을 취하는 간격입니다. 너무 길면 피로 누적과 오류 가능성이 커집니다.",
        path: "staff.breakIntervalMinutes",
        min: 60,
        max: 240,
        step: 5,
        unit: "분",
      },
      {
        kind: "number",
        label: "휴식 길이",
        description: "한 번 휴식할 때 회복에 쓰는 시간입니다. 피로를 줄이지만 순간 처리 가능 인원도 줄어듭니다.",
        path: "staff.breakDurationMinutes",
        min: 0,
        max: 30,
        unit: "분",
      },
      {
        kind: "number",
        label: "동시작업 능력",
        description: "주문, 제조, 픽업 준비를 병렬로 처리하는 운영 능력입니다.",
        path: "staff.multitasking",
        min: 0,
        max: 100,
        unit: "%",
      },
    ],
  },
  {
    title: "메뉴 / 설비",
    controls: [
      {
        kind: "number",
        label: "평균 가격",
        description: "음료와 부가 판매를 포함한 평균 결제 금액입니다. 매출과 가격 민감도 반응에 연결됩니다.",
        path: "menu.averagePrice",
        min: 3500,
        max: 12000,
        step: 100,
        unit: "원",
      },
      {
        kind: "number",
        label: "제조 난이도",
        description: "메뉴가 복잡해 제조 시간이 늘어나는 정도입니다. 높을수록 처리량이 줄고 대기시간이 증가합니다.",
        path: "menu.complexity",
        min: 0,
        max: 100,
        unit: "%",
      },
      {
        kind: "number",
        label: "푸드 추가율",
        description: "음료 주문에 베이커리나 디저트가 함께 붙는 비율입니다. 객단가를 올리지만 운영 부담도 늘 수 있습니다.",
        path: "menu.foodAttachRate",
        min: 0,
        max: 80,
        unit: "%",
      },
      {
        kind: "number",
        label: "원가율",
        description: "매출 중 재료비와 직접 원가가 차지하는 비율입니다. 높을수록 이익이 낮아집니다.",
        path: "menu.costRatio",
        min: 15,
        max: 65,
        unit: "%",
      },
      {
        kind: "number",
        label: "에스프레소 머신",
        description: "동시에 음료 제조를 처리할 수 있는 핵심 설비 수입니다.",
        path: "equipment.espressoMachines",
        min: 1,
        max: 5,
        unit: "대",
      },
      {
        kind: "number",
        label: "그라인더 처리량",
        description: "원두 분쇄와 제조 준비 속도를 나타냅니다. 낮으면 바리스타가 있어도 제조 병목이 생깁니다.",
        path: "equipment.grinderThroughput",
        min: 20,
        max: 140,
        unit: "%",
      },
      {
        kind: "number",
        label: "POS 단말",
        description: "동시에 결제와 주문 입력을 처리할 수 있는 주문 접점 수입니다.",
        path: "equipment.posTerminals",
        min: 1,
        max: 4,
        unit: "대",
      },
      {
        kind: "number",
        label: "픽업대 용량",
        description: "완성 음료가 쌓여도 운영 혼잡 없이 보관 가능한 픽업 공간 규모입니다.",
        path: "equipment.pickupCapacity",
        min: 4,
        max: 28,
        unit: "잔",
      },
    ],
  },
  {
    title: "공간 / 환경",
    controls: [
      {
        kind: "number",
        label: "좌석 수",
        description: "매장 안에서 동시에 착석 가능한 좌석 수입니다. 점유율, 체류, 좌석 회전율을 바꿉니다.",
        path: "space.seats",
        min: 8,
        max: 120,
        unit: "석",
      },
      {
        kind: "number",
        label: "테이블 간격",
        description: "테이블 사이 여유 공간입니다. 높을수록 쾌적하지만 같은 면적에서 좌석 효율은 낮아질 수 있습니다.",
        path: "space.tableSpacing",
        min: 20,
        max: 100,
        unit: "%",
      },
      {
        kind: "number",
        label: "동선 효율",
        description: "직원과 고객이 충돌 없이 이동하는 정도입니다. 제조 속도와 혼잡 체감에 영향을 줍니다.",
        path: "space.pathEfficiency",
        min: 20,
        max: 100,
        unit: "%",
      },
      {
        kind: "number",
        label: "카운터 배치",
        description: "주문, 제조, 픽업대가 얼마나 효율적으로 배치되었는지 나타냅니다.",
        path: "space.counterLayout",
        min: 20,
        max: 100,
        unit: "%",
      },
      {
        kind: "number",
        label: "좌석 편안함",
        description: "좌석, 테이블, 체류 환경의 편안함입니다. 만족도와 체류 품질을 높입니다.",
        path: "space.comfort",
        min: 0,
        max: 100,
        unit: "%",
      },
      {
        kind: "number",
        label: "조도",
        description: "실내 밝기입니다. 너무 낮거나 높으면 쾌적도와 작업 환경이 나빠질 수 있습니다.",
        path: "ambience.lightingLux",
        min: 120,
        max: 900,
        step: 10,
        unit: "lx",
      },
      {
        kind: "number",
        label: "색온도",
        description: "조명의 따뜻함 또는 차가움을 나타냅니다. 낮을수록 따뜻한 분위기, 높을수록 차가운 백색광입니다.",
        path: "ambience.colorTemperature",
        min: 2400,
        max: 6500,
        step: 100,
        unit: "K",
      },
      {
        kind: "number",
        label: "음악 볼륨",
        description: "매장 음악의 체감 볼륨입니다. 적정 수준을 벗어나면 소음과 만족도에 영향을 줍니다.",
        path: "ambience.musicVolume",
        min: 0,
        max: 100,
        unit: "%",
      },
      {
        kind: "number",
        label: "음악 템포",
        description: "매장 음악의 빠르기입니다. 체류 분위기와 회전 속도에 영향을 주는 요인으로 반영됩니다.",
        path: "ambience.musicTempo",
        min: 60,
        max: 150,
        unit: "bpm",
      },
      {
        kind: "number",
        label: "소음",
        description: "매장 내 평균 소음 수준입니다. 높을수록 대화, 집중, 만족도가 저하됩니다.",
        path: "ambience.noiseDb",
        min: 35,
        max: 90,
        unit: "dB",
      },
      {
        kind: "number",
        label: "실내 온도",
        description: "매장 내부 온도입니다. 쾌적 범위를 벗어나면 만족도와 직원 작업 효율이 떨어집니다.",
        path: "indoor.temperature",
        min: 15,
        max: 31,
        step: 0.5,
        unit: "C",
      },
      {
        kind: "number",
        label: "습도",
        description: "실내 상대습도입니다. 지나치게 낮거나 높으면 체감 쾌적도가 낮아집니다.",
        path: "indoor.humidity",
        min: 20,
        max: 80,
        unit: "%",
      },
      {
        kind: "number",
        label: "CO2",
        description: "실내 이산화탄소 농도입니다. 높을수록 환기 부족과 공기질 리스크가 커집니다.",
        path: "indoor.co2",
        min: 450,
        max: 1800,
        step: 25,
        unit: "ppm",
      },
      {
        kind: "number",
        label: "환기량",
        description: "사람당 공급되는 외기량을 단순화한 값입니다. 높을수록 CO2와 공기질 리스크가 낮아집니다.",
        path: "indoor.ventilationRate",
        min: 2,
        max: 14,
        step: 0.5,
        unit: "L/s",
      },
      {
        kind: "number",
        label: "청결도",
        description: "테이블, 바닥, 화장실, 픽업대 등 매장 청결 상태입니다. 만족도와 운영 품질에 반영됩니다.",
        path: "indoor.cleanliness",
        min: 0,
        max: 100,
        unit: "%",
      },
    ],
  },
];

export function ControlPanel({ side, config }: { side: "left" | "right"; config: EnvironmentConfig }) {
  const resetConfig = useSimulatorStore((state) => state.resetConfig);
  const savePreset = useSimulatorStore((state) => state.savePreset);
  const loadPreset = useSimulatorStore((state) => state.loadPreset);
  const groups = side === "left" ? leftGroups : rightGroups;

  return (
    <aside className="panel-shell flex h-full min-h-0 flex-col">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-[#263241] px-4">
        <div>
          <p className="text-[11px] font-semibold uppercase text-[#5F6B7A]">
            {side === "left" ? "Demand Variables" : "Operations Variables"}
          </p>
          <h2 className="text-sm font-semibold text-[#D9E2EC]">
            {side === "left" ? "외부 / 고객 조건" : "운영 / 공간 조건"}
          </h2>
        </div>
        {side === "right" ? (
          <div className="flex items-center gap-1">
            <button title="프리셋 저장" className="icon-button" type="button" onClick={savePreset}>
              <Save size={14} />
            </button>
            <button title="프리셋 불러오기" className="icon-button" type="button" onClick={loadPreset}>
              <Upload size={14} />
            </button>
            <button title="기본값 복원" className="icon-button" type="button" onClick={resetConfig}>
              <RotateCcw size={14} />
            </button>
          </div>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <div className="grid gap-3">
          {groups.map((group) => (
            <section key={group.title} className="section-block">
              <div className="mb-3 flex items-center justify-between border-b border-[#263241]/70 pb-2">
                <h3 className="text-[11px] font-bold uppercase text-[#D9E2EC]">{group.title}</h3>
                <span className="h-1.5 w-1.5 bg-[#38BDF8]" />
              </div>
              <div className="grid gap-3">
                {group.controls.map((control) => (
                  <VariableControl key={`${control.path}-${control.label}`} control={control} config={config} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </aside>
  );
}
