export type Weather = "clear" | "rain" | "snow" | "heatwave";
export type Season = "spring" | "summer" | "autumn" | "winter";
export type WeekdayProfile = "weekday" | "friday" | "weekend";

export type EnvironmentConfig = {
  demand: {
    baseVisitors: number;
    peakIntensity: number;
    streetTraffic: number;
    marketingSpend: number;
    competitorPressure: number;
    localEventBoost: number;
    takeawayShare: number;
  };
  customers: {
    commuterShare: number;
    studentShare: number;
    remoteWorkerShare: number;
    touristShare: number;
    priceSensitivity: number;
    patienceMinutes: number;
    loyalty: number;
  };
  external: {
    weather: Weather;
    season: Season;
    weekdayProfile: WeekdayProfile;
    temperatureOutdoor: number;
  };
  staff: {
    baristas: number;
    cashiers: number;
    skill: number;
    fatigue: number;
    breakIntervalMinutes: number;
    breakDurationMinutes: number;
    multitasking: number;
  };
  menu: {
    averagePrice: number;
    complexity: number;
    foodAttachRate: number;
    costRatio: number;
  };
  equipment: {
    espressoMachines: number;
    grinderThroughput: number;
    posTerminals: number;
    pickupCapacity: number;
  };
  space: {
    seats: number;
    tableSpacing: number;
    pathEfficiency: number;
    counterLayout: number;
    comfort: number;
  };
  ambience: {
    lightingLux: number;
    colorTemperature: number;
    musicVolume: number;
    musicTempo: number;
    noiseDb: number;
  };
  indoor: {
    temperature: number;
    humidity: number;
    co2: number;
    ventilationRate: number;
    cleanliness: number;
  };
};

export type TickResult = {
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
};

export type DayResult = {
  dayIndex: number;
  seed: number;
  visitors: number;
  served: number;
  abandoned: number;
  seated: number;
  revenue: number;
  profit: number;
  averageWaitMinutes: number;
  abandonmentRate: number;
  satisfaction: number;
  revisitIntent: number;
  seatTurnover: number;
  staffFatigue: number;
  occupancyRate: number;
  peakQueue: number;
  co2Risk: number;
  ambienceScore: number;
  ticks: TickResult[];
};

export type SimulationState = {
  returningCustomers: number;
  staffFatigueCarryover: number;
};

export type SimulationRun = {
  config: EnvironmentConfig;
  days: DayResult[];
  seed: number;
};

export type ConfigPath =
  | "demand.baseVisitors"
  | "demand.peakIntensity"
  | "demand.streetTraffic"
  | "demand.marketingSpend"
  | "demand.competitorPressure"
  | "demand.localEventBoost"
  | "demand.takeawayShare"
  | "customers.commuterShare"
  | "customers.studentShare"
  | "customers.remoteWorkerShare"
  | "customers.touristShare"
  | "customers.priceSensitivity"
  | "customers.patienceMinutes"
  | "customers.loyalty"
  | "external.weather"
  | "external.season"
  | "external.weekdayProfile"
  | "external.temperatureOutdoor"
  | "staff.baristas"
  | "staff.cashiers"
  | "staff.skill"
  | "staff.fatigue"
  | "staff.breakIntervalMinutes"
  | "staff.breakDurationMinutes"
  | "staff.multitasking"
  | "menu.averagePrice"
  | "menu.complexity"
  | "menu.foodAttachRate"
  | "menu.costRatio"
  | "equipment.espressoMachines"
  | "equipment.grinderThroughput"
  | "equipment.posTerminals"
  | "equipment.pickupCapacity"
  | "space.seats"
  | "space.tableSpacing"
  | "space.pathEfficiency"
  | "space.counterLayout"
  | "space.comfort"
  | "ambience.lightingLux"
  | "ambience.colorTemperature"
  | "ambience.musicVolume"
  | "ambience.musicTempo"
  | "ambience.noiseDb"
  | "indoor.temperature"
  | "indoor.humidity"
  | "indoor.co2"
  | "indoor.ventilationRate"
  | "indoor.cleanliness";
