"use client";

import { create } from "zustand";
import { DEFAULT_CONFIG } from "@/lib/simulation/default-config";
import { simulateTimeline } from "@/lib/simulation/engine";
import type {
  ConfigPath,
  DayResult,
  EnvironmentConfig,
  SimulationRun,
} from "@/lib/simulation/types";

const STORAGE_KEY = "cafe-simulator-config-v1";

type SimulatorStore = {
  config: EnvironmentConfig;
  seed: number;
  dayCount: number;
  selectedDay: number;
  run: SimulationRun;
  isPlaying: boolean;
  setConfigValue: (path: ConfigPath, value: number | string) => void;
  setSelectedDay: (day: number) => void;
  setDayCount: (count: number) => void;
  setPlaying: (playing: boolean) => void;
  stepDay: (direction: 1 | -1) => void;
  resetConfig: () => void;
  savePreset: () => void;
  loadPreset: () => void;
  currentDay: () => DayResult;
};

function createRun(config: EnvironmentConfig, dayCount: number, seed: number) {
  return simulateTimeline(config, dayCount, seed);
}

function initialConfig() {
  if (typeof window === "undefined") {
    return DEFAULT_CONFIG;
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return DEFAULT_CONFIG;
  }

  try {
    return { ...DEFAULT_CONFIG, ...JSON.parse(saved) } as EnvironmentConfig;
  } catch {
    return DEFAULT_CONFIG;
  }
}

const baseConfig = initialConfig();
const baseSeed = 240517;
const baseDayCount = 14;

export const useSimulatorStore = create<SimulatorStore>((set, get) => ({
  config: baseConfig,
  seed: baseSeed,
  dayCount: baseDayCount,
  selectedDay: 0,
  run: createRun(baseConfig, baseDayCount, baseSeed),
  isPlaying: false,
  setConfigValue: (path, value) => {
    set((state) => {
      const config = setDeepValue(state.config, path, value);
      const run = createRun(config, state.dayCount, state.seed);
      return {
        config,
        run,
        selectedDay: Math.min(state.selectedDay, run.days.length - 1),
      };
    });
  },
  setSelectedDay: (day) => {
    set((state) => ({
      selectedDay: clampInteger(day, 0, state.run.days.length - 1),
    }));
  },
  setDayCount: (count) => {
    set((state) => {
      const dayCount = clampInteger(count, 7, 30);
      const run = createRun(state.config, dayCount, state.seed);
      return {
        dayCount,
        run,
        selectedDay: Math.min(state.selectedDay, run.days.length - 1),
      };
    });
  },
  setPlaying: (playing) => set({ isPlaying: playing }),
  stepDay: (direction) => {
    set((state) => {
      const next = state.selectedDay + direction;
      return {
        selectedDay:
          next < 0 ? state.run.days.length - 1 : next % state.run.days.length,
      };
    });
  },
  resetConfig: () => {
    const run = createRun(DEFAULT_CONFIG, get().dayCount, get().seed);
    set({ config: DEFAULT_CONFIG, run, selectedDay: 0 });
  },
  savePreset: () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(get().config));
    }
  },
  loadPreset: () => {
    if (typeof window === "undefined") {
      return;
    }

    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return;
    }

    try {
      const config = { ...DEFAULT_CONFIG, ...JSON.parse(saved) } as EnvironmentConfig;
      const run = createRun(config, get().dayCount, get().seed);
      set({ config, run, selectedDay: 0 });
    } catch {
      set({ config: DEFAULT_CONFIG, run: createRun(DEFAULT_CONFIG, get().dayCount, get().seed) });
    }
  },
  currentDay: () => {
    const state = get();
    return state.run.days[state.selectedDay] ?? state.run.days[0];
  },
}));

function setDeepValue(
  config: EnvironmentConfig,
  path: ConfigPath,
  value: number | string,
): EnvironmentConfig {
  const clone = structuredClone(config);
  const [group, key] = path.split(".") as [keyof EnvironmentConfig, string];
  const section = clone[group] as Record<string, number | string>;
  section[key] = value;
  return clone;
}

function clampInteger(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value)));
}
