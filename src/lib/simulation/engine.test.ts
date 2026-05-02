import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "./default-config";
import { simulateDay, simulateTimeline } from "./engine";
import type { EnvironmentConfig } from "./types";

describe("cafe simulation engine", () => {
  it("returns deterministic results for the same seed and input", () => {
    const first = simulateTimeline(DEFAULT_CONFIG, 7, 101);
    const second = simulateTimeline(DEFAULT_CONFIG, 7, 101);

    expect(second.days.map(snapshot)).toEqual(first.days.map(snapshot));
  });

  it("reduces average wait when more staff are scheduled", () => {
    const lean = withConfig((config) => {
      config.staff.baristas = 1;
      config.staff.cashiers = 1;
    });
    const staffed = withConfig((config) => {
      config.staff.baristas = 5;
      config.staff.cashiers = 3;
    });

    const leanDay = simulateDay(lean, undefined, 202);
    const staffedDay = simulateDay(staffed, undefined, 202);

    expect(staffedDay.averageWaitMinutes).toBeLessThan(leanDay.averageWaitMinutes);
  });

  it("increases queue pressure and abandonment when demand rises", () => {
    const normal = withConfig((config) => {
      config.demand.baseVisitors = 110;
      config.demand.streetTraffic = 40;
      config.staff.baristas = 1;
      config.staff.cashiers = 1;
      config.customers.patienceMinutes = 5;
    });
    const surge = withConfig((config) => {
      config.demand.baseVisitors = 460;
      config.demand.streetTraffic = 100;
      config.staff.baristas = 1;
      config.staff.cashiers = 1;
      config.customers.patienceMinutes = 5;
    });

    const normalDay = simulateDay(normal, undefined, 303);
    const surgeDay = simulateDay(surge, undefined, 303);

    expect(surgeDay.peakQueue).toBeGreaterThan(normalDay.peakQueue);
    expect(surgeDay.abandonmentRate).toBeGreaterThan(normalDay.abandonmentRate);
  });

  it("penalizes satisfaction under poor air and thermal conditions", () => {
    const comfortable = withConfig((config) => {
      config.indoor.temperature = 22;
      config.indoor.humidity = 45;
      config.indoor.co2 = 700;
      config.indoor.ventilationRate = 9;
    });
    const poorIndoor = withConfig((config) => {
      config.indoor.temperature = 29;
      config.indoor.humidity = 72;
      config.indoor.co2 = 1550;
      config.indoor.ventilationRate = 3;
    });

    const comfortableDay = simulateDay(comfortable, undefined, 404);
    const poorIndoorDay = simulateDay(poorIndoor, undefined, 404);

    expect(poorIndoorDay.satisfaction).toBeLessThan(comfortableDay.satisfaction);
    expect(poorIndoorDay.co2Risk).toBeGreaterThan(comfortableDay.co2Risk);
  });

  it("reflects outdoor temperature in demand", () => {
    const mild = withConfig((config) => {
      config.external.weather = "clear";
      config.external.temperatureOutdoor = 19;
      config.demand.baseVisitors = 240;
    });
    const harshCold = withConfig((config) => {
      config.external.weather = "clear";
      config.external.temperatureOutdoor = -10;
      config.demand.baseVisitors = 240;
    });

    const mildDay = simulateDay(mild, undefined, 606);
    const harshColdDay = simulateDay(harshCold, undefined, 606);

    expect(mildDay.visitors).toBeGreaterThan(harshColdDay.visitors);
  });

  it("connects customer segment mix to seating behavior", () => {
    const commuterHeavy = withSingleSegment("commuterShare");
    const studentHeavy = withSingleSegment("studentShare");

    const commuterDay = simulateDay(commuterHeavy, undefined, 707);
    const studentDay = simulateDay(studentHeavy, undefined, 707);

    expect(studentDay.seated).toBeGreaterThan(commuterDay.seated);
  });

  it("penalizes ambience when color temperature is harsh", () => {
    const balanced = withConfig((config) => {
      config.ambience.colorTemperature = 3600;
      config.ambience.lightingLux = 430;
    });
    const coldLighting = withConfig((config) => {
      config.ambience.colorTemperature = 6500;
      config.ambience.lightingLux = 430;
    });

    const balancedDay = simulateDay(balanced, undefined, 808);
    const coldDay = simulateDay(coldLighting, undefined, 808);

    expect(balancedDay.ambienceScore).toBeGreaterThan(coldDay.ambienceScore);
  });

  it("lowers staff fatigue when break policy is adequate", () => {
    const noBreaks = withConfig((config) => {
      config.staff.breakDurationMinutes = 0;
      config.staff.breakIntervalMinutes = 240;
    });
    const adequateBreaks = withConfig((config) => {
      config.staff.breakDurationMinutes = 18;
      config.staff.breakIntervalMinutes = 90;
    });

    const noBreakDay = simulateDay(noBreaks, undefined, 505);
    const breakDay = simulateDay(adequateBreaks, undefined, 505);

    expect(breakDay.staffFatigue).toBeLessThan(noBreakDay.staffFatigue);
  });
});

function withConfig(mutator: (config: EnvironmentConfig) => void) {
  const clone = structuredClone(DEFAULT_CONFIG);
  mutator(clone);
  return clone;
}

function withSingleSegment(segment: keyof EnvironmentConfig["customers"]) {
  return withConfig((config) => {
    config.customers.commuterShare = 0;
    config.customers.studentShare = 0;
    config.customers.remoteWorkerShare = 0;
    config.customers.touristShare = 0;
    const value = config.customers[segment];

    if (typeof value === "number") {
      config.customers[segment] = 100;
    }
  });
}

function snapshot(day: ReturnType<typeof simulateDay>) {
  return {
    visitors: day.visitors,
    served: day.served,
    abandoned: day.abandoned,
    revenue: Math.round(day.revenue),
    wait: Number(day.averageWaitMinutes.toFixed(3)),
    satisfaction: Number(day.satisfaction.toFixed(3)),
  };
}
