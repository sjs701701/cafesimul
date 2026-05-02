import { DEFAULT_CONFIG } from "./default-config";
import { createRng, poisson } from "./random";
import type {
  DayResult,
  EnvironmentConfig,
  SimulationRun,
  SimulationState,
  TickResult,
} from "./types";

const HOURS = Array.from({ length: 15 }, (_, index) => 7 + index);
const TICK_MINUTES = 15;

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function simulateTimeline(
  config: EnvironmentConfig = DEFAULT_CONFIG,
  dayCount = 14,
  seed = 240517,
): SimulationRun {
  const days: DayResult[] = [];
  let state: SimulationState = {
    returningCustomers: config.customers.loyalty,
    staffFatigueCarryover: config.staff.fatigue,
  };

  for (let dayIndex = 0; dayIndex < dayCount; dayIndex += 1) {
    const day = simulateDay(config, state, seed + dayIndex * 7919, dayIndex);
    days.push(day);
    state = {
      returningCustomers: day.revisitIntent,
      staffFatigueCarryover: day.staffFatigue,
    };
  }

  return { config, days, seed };
}

export function simulateDay(
  config: EnvironmentConfig,
  previousState: SimulationState = {
    returningCustomers: config.customers.loyalty,
    staffFatigueCarryover: config.staff.fatigue,
  },
  seed = 240517,
  dayIndex = 0,
): DayResult {
  const random = createRng(seed);
  const ticks: TickResult[] = [];
  const demandMultiplier = calculateDemandMultiplier(config, dayIndex);
  const environment = calculateEnvironment(config);
  const service = calculateService(config, previousState);
  const customerMix = calculateCustomerMix(config);
  const effectivePriceSensitivity = clamp(
    config.customers.priceSensitivity + customerMix.priceSensitivityShift,
    0,
    100,
  );
  const effectiveTakeawayShare = clamp(config.demand.takeawayShare + customerMix.takeawayDelta, 5, 92);
  const dwellRetention = clamp(0.68 + customerMix.dwellMultiplier * 0.1, 0.68, 0.86);

  let queue = 0;
  let visitors = 0;
  let served = 0;
  let abandoned = 0;
  let seated = 0;
  let revenue = 0;
  let weightedWait = 0;
  let weightedSatisfaction = 0;
  let satisfactionWeight = 0;
  let occupancyAccumulator = 0;
  let staffFatigue = service.startFatigue;
  let peakQueue = 0;

  for (const hour of HOURS) {
    const hourlyShape = demandShape(hour, config.demand.peakIntensity);
    const hourlyArrivalRate =
      (config.demand.baseVisitors / HOURS.length) *
      hourlyShape *
      demandMultiplier *
      customerMix.demandMultiplier;

    for (let tick = 0; tick < 60 / TICK_MINUTES; tick += 1) {
      const arrivals = poisson(hourlyArrivalRate / 4, random);
      queue += arrivals;
      visitors += arrivals;

      const activeStaff =
        config.staff.baristas +
        config.staff.cashiers * 0.62 -
        breakLoad(hour * 60 + tick * TICK_MINUTES, config);
      const fatiguePenalty = 1 - clamp(staffFatigue / 145, 0, 0.48);
      const serviceCapacity = Math.max(
        1,
        Math.floor(
          service.ordersPerTick *
            activeStaff *
            fatiguePenalty *
            environment.workflowMultiplier *
            (0.92 + random() * 0.16),
        ),
      );
      const processed = Math.min(queue, serviceCapacity);

      const waitPressure = queue / Math.max(1, serviceCapacity);
      const patience =
        config.customers.patienceMinutes *
        customerMix.patienceMultiplier *
        (0.85 + config.space.comfort / 220 + environment.ambienceScore / 260);
      const abandonProbability = clamp(
        (waitPressure * TICK_MINUTES - patience) / 42 +
          effectivePriceSensitivity / 900 -
          previousState.returningCustomers / 700,
        0,
        0.62,
      );
      const lost = Math.min(queue - processed, poisson((queue - processed) * abandonProbability, random));
      queue = Math.max(0, queue - processed - lost);

      const dineIn = Math.round(processed * (1 - effectiveTakeawayShare / 100));
      const seatsAvailable = Math.max(1, config.space.seats);
      const seatedNow = Math.min(dineIn, Math.max(0, seatsAvailable - Math.round(occupancyAccumulator)));
      const occupancy = clamp(
        (occupancyAccumulator * dwellRetention +
          seatedNow * (0.82 + customerMix.dwellMultiplier * 0.08) +
          queue * 0.08) /
          seatsAvailable,
        0,
        1.35,
      );
      occupancyAccumulator = occupancy * seatsAvailable;

      const averageWait = clamp((queue + processed / 2) / Math.max(1, serviceCapacity) * 4.8, 0, 45);
      const indoorPenalty =
        Math.max(0, config.indoor.co2 - 900) / 35 +
        Math.abs(config.indoor.temperature - 22) * 1.8 +
        Math.max(0, config.indoor.humidity - 60) * 0.4 +
        Math.max(0, config.ambience.noiseDb - 62) * 1.1;
      const satisfaction = clamp(
        88 -
          averageWait * 1.2 -
          abandonProbability * 24 -
          occupancy * 8 +
          environment.comfortScore * 0.2 +
          service.qualityBonus -
          staffFatigue * 0.08 -
          indoorPenalty,
        0,
        100,
      );

      const ticket =
        config.menu.averagePrice *
        customerMix.ticketMultiplier *
        (1 + config.menu.foodAttachRate / 240) *
        (1 + satisfaction / 900) *
        (1 - effectivePriceSensitivity / 900);

      const tickRevenue = processed * ticket;
      const fatigueIncrease =
        processed * (0.045 + config.menu.complexity / 2400) +
        Math.max(0, queue - config.equipment.pickupCapacity) * 0.018 -
        config.staff.breakDurationMinutes / Math.max(80, config.staff.breakIntervalMinutes) * 1.1;

      served += processed;
      abandoned += lost;
      seated += seatedNow;
      revenue += tickRevenue;
      const tickWeight = Math.max(1, processed + lost);
      weightedWait += averageWait * tickWeight;
      weightedSatisfaction += satisfaction * tickWeight;
      satisfactionWeight += tickWeight;
      peakQueue = Math.max(peakQueue, queue);
      staffFatigue = clamp(staffFatigue + fatigueIncrease, 0, 100);

      ticks.push({
        hour: hour + tick / 4,
        arrivals,
        served: processed,
        abandoned: lost,
        seated: seatedNow,
        queueLength: queue,
        averageWaitMinutes: averageWait,
        satisfaction,
        revenue: tickRevenue,
        occupancy: clamp(occupancy * 100, 0, 100),
        staffFatigue,
      });
    }
  }

  const averageWaitMinutes = weightedWait / Math.max(1, satisfactionWeight);
  const satisfaction = weightedSatisfaction / Math.max(1, satisfactionWeight);
  const abandonmentRate = visitors > 0 ? abandoned / visitors : 0;
  const revisitIntent = clamp(
    satisfaction * 0.68 +
      config.customers.loyalty * 0.18 +
      previousState.returningCustomers * 0.14 -
      abandonmentRate * 38,
    0,
    100,
  );
  const profit = revenue * (1 - config.menu.costRatio / 100) - staffCost(config);

  return {
    dayIndex,
    seed,
    visitors,
    served,
    abandoned,
    seated,
    revenue,
    profit,
    averageWaitMinutes,
    abandonmentRate,
    satisfaction,
    revisitIntent,
    seatTurnover: seated / Math.max(1, config.space.seats),
    staffFatigue,
    occupancyRate:
      ticks.reduce((sum, tick) => sum + tick.occupancy, 0) / Math.max(1, ticks.length),
    peakQueue,
    co2Risk: clamp((config.indoor.co2 - 700) / 9 + (100 - config.indoor.ventilationRate * 10), 0, 100),
    ambienceScore: environment.ambienceScore,
    ticks,
  };
}

function calculateDemandMultiplier(config: EnvironmentConfig, dayIndex: number) {
  const weather = {
    clear: 1,
    rain: 0.82,
    snow: 0.72,
    heatwave: 0.88,
  }[config.external.weather];
  const weekday = {
    weekday: 1,
    friday: 1.12,
    weekend: 1.2,
  }[config.external.weekdayProfile];
  const season = {
    spring: 1.05,
    summer: 0.98,
    autumn: 1.08,
    winter: 0.9,
  }[config.external.season];
  const cyclic = 0.96 + (Math.sin((dayIndex / 7) * Math.PI * 2) + 1) * 0.04;
  const outdoorComfort = clamp(1.08 - Math.abs(config.external.temperatureOutdoor - 19) / 65, 0.78, 1.08);

  return (
    weather *
    weekday *
    season *
    cyclic *
    outdoorComfort *
    (0.72 + config.demand.streetTraffic / 155) *
    (1 + config.demand.marketingSpend / 260) *
    (1 + config.demand.localEventBoost / 170) *
    (1 - config.demand.competitorPressure / 280)
  );
}

function demandShape(hour: number, peakIntensity: number) {
  const morning = Math.exp(-Math.pow((hour - 8.6) / 1.45, 2)) * 1.05;
  const lunch = Math.exp(-Math.pow((hour - 12.7) / 1.2, 2)) * 0.9;
  const afternoon = Math.exp(-Math.pow((hour - 16.2) / 2.1, 2)) * 1.15;
  const base = 0.45 + morning + lunch + afternoon;
  return base * (0.78 + peakIntensity / 2.4);
}

function calculateEnvironment(config: EnvironmentConfig) {
  // PMV/PPD, ventilation, servicescape, and music effects are represented as bounded
  // operational coefficients rather than source-visible citations in the UI.
  const thermalPenalty =
    Math.abs(config.indoor.temperature - 22) * 3.8 +
    Math.abs(config.indoor.humidity - 45) * 0.45;
  const airPenalty =
    Math.max(0, config.indoor.co2 - 850) / 22 +
    Math.max(0, 7 - config.indoor.ventilationRate) * 3.8;
  const lightingScore = 100 - Math.abs(config.ambience.lightingLux - 430) / 7;
  const colorTemperatureScore = 100 - Math.abs(config.ambience.colorTemperature - 3600) / 42;
  const musicScore =
    100 -
    Math.abs(config.ambience.musicVolume - 48) * 0.85 -
    Math.abs(config.ambience.musicTempo - 92) * 0.35;
  const noisePenalty = Math.max(0, config.ambience.noiseDb - 62) * 1.7;
  const ambienceScore = clamp(
    (lightingScore + colorTemperatureScore + musicScore + config.indoor.cleanliness + config.space.comfort) /
      5 -
      thermalPenalty * 0.18 -
      airPenalty * 0.22 -
      noisePenalty,
    0,
    100,
  );
  const comfortScore = clamp(
    ambienceScore +
      config.space.tableSpacing * 0.12 +
      config.space.pathEfficiency * 0.1 -
      thermalPenalty * 0.12,
    0,
    100,
  );

  return {
    ambienceScore,
    comfortScore,
    workflowMultiplier: clamp(
      0.68 +
        config.space.pathEfficiency / 250 +
        config.space.counterLayout / 280 +
        config.indoor.cleanliness / 420 -
        Math.max(0, config.indoor.co2 - 1000) / 4200,
      0.62,
      1.25,
    ),
  };
}

function calculateCustomerMix(config: EnvironmentConfig) {
  const total = Math.max(
    1,
    config.customers.commuterShare +
      config.customers.studentShare +
      config.customers.remoteWorkerShare +
      config.customers.touristShare,
  );
  const commuter = config.customers.commuterShare / total;
  const student = config.customers.studentShare / total;
  const remote = config.customers.remoteWorkerShare / total;
  const tourist = config.customers.touristShare / total;

  return {
    demandMultiplier: 0.94 + commuter * 0.08 + student * 0.03 + remote * 0.04 + tourist * 0.1,
    ticketMultiplier: commuter * 0.96 + student * 0.88 + remote * 1.05 + tourist * 1.16,
    patienceMultiplier: commuter * 0.78 + student * 1.08 + remote * 1.28 + tourist * 0.95,
    takeawayDelta: commuter * 18 - student * 3 - remote * 18 - tourist * 7,
    dwellMultiplier: commuter * 0.75 + student * 1.12 + remote * 1.38 + tourist * 1.02,
    priceSensitivityShift: commuter * 3 + student * 9 - remote * 3 - tourist * 4,
  };
}

function calculateService(config: EnvironmentConfig, previousState: SimulationState) {
  const machineLimit =
    config.equipment.espressoMachines * 1.9 +
    config.equipment.grinderThroughput / 80 +
    config.equipment.posTerminals * 0.8;
  const skillMultiplier =
    0.74 + config.staff.skill / 190 + config.staff.multitasking / 420 - config.menu.complexity / 480;

  return {
    ordersPerTick: clamp(machineLimit * skillMultiplier, 1.2, 12),
    qualityBonus: config.staff.skill * 0.08 + config.indoor.cleanliness * 0.05,
    startFatigue: clamp((previousState.staffFatigueCarryover + config.staff.fatigue) / 2, 0, 100),
  };
}

function breakLoad(minutes: number, config: EnvironmentConfig) {
  const cycle = minutes % Math.max(60, config.staff.breakIntervalMinutes);
  return cycle < config.staff.breakDurationMinutes ? 0.65 : 0;
}

function staffCost(config: EnvironmentConfig) {
  const staffCount = config.staff.baristas + config.staff.cashiers;
  return staffCount * 9 * 14500;
}
