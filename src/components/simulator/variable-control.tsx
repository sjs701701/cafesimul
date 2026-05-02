"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
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
          path={control.path}
        />
        <div className="grid grid-cols-3 gap-px border border-[var(--line)] bg-[var(--line)]">
          {control.options.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setConfigValue(control.path, option.value)}
                className={
                  selected
                    ? "h-7 bg-[#0e1c2c] mono text-[10.5px] font-bold uppercase tracking-[0.10em] text-[var(--accent-cyan)]"
                    : "h-7 bg-[var(--bg-deepest)] mono text-[10.5px] uppercase tracking-[0.10em] text-[var(--text-muted)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
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
  const range = control.max - control.min;
  const percent = range > 0 ? clamp((numberValue - control.min) / range, 0, 1) * 100 : 0;
  const fillColor =
    percent > 92 ? "var(--accent-red)" : percent > 78 ? "var(--accent-amber)" : "var(--accent-cyan)";
  const trackStyle: CSSProperties = {
    ["--track-percent" as unknown as keyof CSSProperties]: `${percent}%`,
    ["--track-fill" as unknown as keyof CSSProperties]: fillColor,
  } as CSSProperties;

  const tickCount = 5;

  return (
    <div className="grid gap-1.5">
      <ControlHeader
        label={control.label}
        description={control.description}
        value={`${formatNumber(numberValue)}${control.unit ? control.unit : ""}`}
        path={control.path}
      />
      <div className="grid grid-cols-[minmax(0,1fr)_104px] items-center gap-2">
        <div className="relative">
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
            className="sim-range w-full"
            style={trackStyle}
          />
          {tickCount > 0 ? (
            <div className="pointer-events-none absolute inset-x-[1px] bottom-[1px] flex h-[6px] items-end justify-between">
              {Array.from({ length: tickCount }, (_, index) => (
                <span
                  key={index}
                  className="block w-px bg-[var(--line-strong)]"
                  style={{ height: index === 0 || index === tickCount - 1 ? "5px" : "3px" }}
                />
              ))}
            </div>
          ) : null}
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1">
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
            className="h-7 w-full border border-[var(--line)] bg-[var(--bg-deepest)] px-2 text-right mono text-[11px] tabular-nums text-[var(--text-primary)] outline-none focus:border-[var(--accent-cyan)]"
          />
          {control.unit ? (
            <span className="min-w-[24px] mono text-[8.5px] uppercase tracking-[0.10em] text-[var(--text-faint)]">
              {control.unit}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex items-center justify-between mono text-[8.5px] uppercase tracking-[0.16em] text-[var(--text-faint)]">
        <span>{formatNumber(control.min)}{control.unit ?? ""}</span>
        <span className="h-px flex-1 mx-2 bg-[var(--line-faint)]" />
        <span>{formatNumber(control.max)}{control.unit ?? ""}</span>
      </div>
    </div>
  );
}

function ControlHeader({
  label,
  description,
  value,
  path,
}: {
  label: string;
  description: string;
  value: string;
  path: ConfigPath;
}) {
  const code = useMemo(() => path.split(".").map((part) => part.slice(0, 4)).join(".").toUpperCase(), [path]);
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="truncate text-[11.5px] font-medium text-[var(--text-primary)]">{label}</span>
        <InfoButton label={label} description={description} path={path} />
      </span>
      <span className="flex shrink-0 items-baseline gap-1.5">
        <span className="mono text-[8.5px] uppercase tracking-[0.16em] text-[var(--text-faint)]">{code}</span>
        <span className="mono text-[11.5px] font-semibold tabular-nums text-[var(--accent-cyan)]">
          <span className="text-[var(--text-faint)]">[</span>
          {value}
          <span className="text-[var(--text-faint)]">]</span>
        </span>
      </span>
    </div>
  );
}

function InfoButton({
  label,
  description,
  path,
}: {
  label: string;
  description: string;
  path: ConfigPath;
}) {
  const id = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 12, top: 12 });
  const popoverWidth = 300;

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
    const above = rect.top - 152;
    const top = below + 152 > window.innerHeight ? Math.max(margin, above) : below;

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
        <Info size={9} />
      </button>
      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              id={id}
              role="tooltip"
              data-testid="variable-info-popover"
              className="hud-corner fixed z-[100] border border-[#38BDF8]/55 bg-[var(--bg-deepest)] shadow-[0_18px_46px_rgba(0,0,0,0.6)]"
              style={{ left: position.left, top: position.top, width: popoverWidth }}
            >
              <div className="flex items-center justify-between border-b border-[var(--line)] px-3 py-1.5">
                <span className="mono text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--accent-cyan)]">
                  Variable Brief
                </span>
                <span className="mono text-[8.5px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
                  {path}
                </span>
              </div>
              <div className="px-3 py-2.5">
                <p className="text-[12px] font-semibold text-[var(--text-primary)]">{label}</p>
                <p className="mt-1.5 text-[11px] leading-[16px] text-[var(--text-secondary)]">{description}</p>
                <p className="mt-2 border-t border-[var(--line)] pt-2 mono text-[9.5px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  변경 즉시 KPI · 평면도 · 타임라인이 재계산됨
                </p>
              </div>
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
  if (Math.abs(value) >= 1000) {
    return value.toLocaleString("ko-KR");
  }

  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(1);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
