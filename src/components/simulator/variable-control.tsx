"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";
import type { ConfigPath, EnvironmentConfig } from "@/lib/simulation/types";
import { useSimulatorStore } from "@/store/simulator-store";

type NumberControl = {
  kind: "number";
  label: string;
  description: string;
  path: ConfigPath;
  min: number;
  max: number;
  step?: number;
  unit?: string;
};

type SelectControl = {
  kind: "select";
  label: string;
  description: string;
  path: ConfigPath;
  options: { label: string; value: string }[];
};

export type VariableControlConfig = NumberControl | SelectControl;

type VariableControlProps = {
  control: VariableControlConfig;
  config: EnvironmentConfig;
};

export function VariableControl({ control, config }: VariableControlProps) {
  const setConfigValue = useSimulatorStore((state) => state.setConfigValue);
  const value = readPath(config, control.path);

  if (control.kind === "select") {
    const selectedOption = control.options.find((option) => option.value === value);

    return (
      <div className="grid gap-1.5">
        <ControlHeader
          label={control.label}
          description={control.description}
          value={selectedOption?.label ?? String(value)}
        />
        <div className="grid grid-cols-3 gap-1">
          {control.options.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setConfigValue(control.path, option.value)}
                className={
                  selected
                    ? "h-7 border border-[#38BDF8]/70 bg-[#102336] text-[11px] font-semibold text-[#D9E2EC]"
                    : "h-7 border border-[#263241] bg-[#0A0E14] text-[11px] text-[#8B98A8] hover:border-[#38BDF8]/40 hover:text-[#D9E2EC]"
                }
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const numberValue = Number(value);
  const commitNumber = (rawValue: string) => {
    setConfigValue(control.path, Number(rawValue));
  };

  return (
    <div className="grid gap-1.5">
      <ControlHeader
        label={control.label}
        description={control.description}
        value={`${formatNumber(numberValue)}${control.unit ? control.unit : ""}`}
      />
      <div className="grid grid-cols-[minmax(0,1fr)_88px] gap-2">
        <input
          aria-label={control.label}
          data-testid={`${control.path}-range`}
          type="range"
          min={control.min}
          max={control.max}
          step={control.step ?? 1}
          value={numberValue}
          onInput={(event) => commitNumber(event.currentTarget.value)}
          onChange={(event) => commitNumber(event.target.value)}
          className="sim-range"
        />
        <input
          aria-label={`${control.label} 값`}
          data-testid={`${control.path}-number`}
          type="number"
          min={control.min}
          max={control.max}
          step={control.step ?? 1}
          value={numberValue}
          onInput={(event) => commitNumber(event.currentTarget.value)}
          onChange={(event) => commitNumber(event.target.value)}
          className="h-7 border border-[#263241] bg-[#07090D] px-2 text-right font-mono text-[11px] tabular-nums text-[#D9E2EC] outline-none focus:border-[#38BDF8]"
        />
      </div>
    </div>
  );
}

function ControlHeader({
  label,
  description,
  value,
}: {
  label: string;
  description: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-[11px] font-medium text-[#8B98A8]">
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="truncate">{label}</span>
        <InfoButton label={label} description={description} />
      </span>
      <span className="shrink-0 font-mono text-[11px] text-[#D9E2EC]">{value}</span>
    </div>
  );
}

function InfoButton({
  label,
  description,
}: {
  label: string;
  description: string;
}) {
  const id = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 12, top: 12 });
  const popoverWidth = 280;

  const updatePosition = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    const margin = 12;
    const left = Math.min(
      window.innerWidth - popoverWidth - margin,
      Math.max(margin, rect.left + rect.width / 2 - popoverWidth / 2),
    );
    const below = rect.bottom + 8;
    const above = rect.top - 132;
    const top = below + 132 > window.innerHeight ? Math.max(margin, above) : below;

    setPosition({ left, top });
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    updatePosition();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (!buttonRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open, updatePosition]);

  const toggle = () => {
    updatePosition();
    setOpen((current) => !current);
  };

  return (
    <span className="relative inline-flex">
      <button
        ref={buttonRef}
        type="button"
        data-testid="variable-info-button"
        aria-label={`${label} 설명`}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        title={description}
        className="info-button"
        onClick={toggle}
      >
        <Info size={11} />
      </button>
      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              id={id}
              role="tooltip"
              data-testid="variable-info-popover"
              className="fixed z-[100] border border-[#38BDF8]/45 bg-[#07090D] px-3 py-2.5 text-left shadow-[0_18px_46px_rgba(0,0,0,0.58)]"
              style={{ left: position.left, top: position.top, width: popoverWidth }}
            >
              <p className="font-mono text-[10px] uppercase tracking-normal text-[#38BDF8]">Variable Brief</p>
              <p className="mt-1 text-[12px] font-semibold text-[#D9E2EC]">{label}</p>
              <p className="mt-1.5 text-[11px] leading-4 text-[#A8B3C2]">{description}</p>
              <p className="mt-2 border-t border-[#263241] pt-2 text-[10px] leading-4 text-[#6F7D8D]">
                값을 바꾸면 KPI, 대기열, 좌석 점유, 환경 레이어가 즉시 다시 계산됩니다.
              </p>
            </div>,
            document.body,
          )
        : null}
    </span>
  );
}

function readPath(config: EnvironmentConfig, path: ConfigPath) {
  const [group, key] = path.split(".") as [keyof EnvironmentConfig, string];
  return (config[group] as Record<string, number | string>)[key];
}

function formatNumber(value: number) {
  if (value >= 1000) {
    return value.toLocaleString("ko-KR");
  }

  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(1);
}
