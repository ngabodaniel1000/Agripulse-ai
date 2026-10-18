"use client";

import { useId, useState, type ReactNode } from "react";
import {
  CircleAlert,
  CircleCheck,
  Download,
  Info,
  Lightbulb,
  Loader2,
  TriangleAlert,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DATA_QUALITY, type DataQuality } from "@/data/sim/provenance";
import { exportCSV } from "@/lib/exports";
import { toast } from "sonner";

export type Tone = "primary" | "success" | "warning" | "destructive" | "neutral" | "info";

const BADGE_TONE: Record<Tone, string> = {
  primary: "bg-secondary text-primary",
  info: "bg-secondary text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  destructive: "bg-destructive/10 text-destructive",
  neutral: "bg-muted text-muted-foreground",
};

const NOTE_TONE: Record<Tone, string> = {
  primary: "border-primary/20 bg-secondary text-primary",
  info: "border-primary/20 bg-secondary text-primary",
  success: "border-success/25 bg-success-soft text-success",
  warning: "border-warning/30 bg-warning-soft text-warning",
  destructive: "border-destructive/30 bg-destructive/10 text-destructive",
  neutral: "border-border bg-muted text-muted-foreground",
};

export function StatusBadge({
  tone = "neutral",
  label,
  icon: Icon,
  className = "",
}: {
  tone?: Tone;
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap",
        BADGE_TONE[tone],
        className,
      )}
    >
      {Icon ? <Icon size={11} /> : null}
      {label}
    </span>
  );
}

export function QualityBadge({
  quality,
  compact = false,
}: {
  quality: DataQuality;
  compact?: boolean;
}) {
  const meta = DATA_QUALITY[quality];
  const tone: Tone = meta.tone === "info" ? "info" : meta.tone;
  const Icon =
    quality === "observed"
      ? CircleCheck
      : quality === "derived"
        ? Info
        : quality === "synthesized"
          ? TriangleAlert
          : Lightbulb;
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex cursor-help items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap",
              BADGE_TONE[tone],
            )}
          >
            <Icon size={11} />
            {compact ? meta.short : meta.label}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[220px] text-[11px]">{meta.description}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function InfoTip({ text, label = "More information" }: { text: string; label?: string }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={label}
            className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground hover:text-primary"
          >
            <Info size={13} />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-[240px] text-[11px] leading-relaxed">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function InfoNote({
  tone = "info",
  title,
  children,
  icon: Icon,
}: {
  tone?: Tone;
  title?: string;
  children: ReactNode;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}) {
  const Default =
    tone === "destructive" ? TriangleAlert : tone === "warning" ? TriangleAlert : Info;
  const Chosen = Icon ?? Default;
  return (
    <div
      className={cn(
        "flex gap-2.5 rounded-md border px-3.5 py-3 text-[11px] leading-relaxed",
        NOTE_TONE[tone],
      )}
    >
      <Chosen size={15} className="mt-0.5 shrink-0" />
      <div>
        {title ? <strong className="mb-0.5 block font-semibold">{title}</strong> : null}
        {children}
      </div>
    </div>
  );
}

export function SectionCard({
  title,
  description,
  icon: Icon,
  action,
  children,
  className = "",
  bodyClassName = "panel-body",
}: {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("panel", className)}>
      <div className="panel-head">
        <div className="flex gap-2.5">
          {Icon ? (
            <span className="mt-0.5 text-primary">
              <Icon size={16} />
            </span>
          ) : null}
          <div>
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
        </div>
        {action}
      </div>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function KpiGrid({ children, columns = 4 }: { children: ReactNode; columns?: 2 | 3 | 4 }) {
  const cols = columns === 3 ? "kpi-grid cols-3" : columns === 2 ? "kpi-grid cols-2" : "kpi-grid";
  return <div className={cols}>{children}</div>;
}

export function KpiCard({
  label,
  value,
  unit,
  hint,
  badge,
  badgeTone = "primary",
  icon: Icon,
  valueTone,
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  badge?: string;
  badgeTone?: Tone;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  valueTone?: "default" | "success" | "warning" | "destructive";
}) {
  const toneClass =
    valueTone === "success"
      ? "text-success"
      : valueTone === "warning"
        ? "text-warning"
        : valueTone === "destructive"
          ? "text-destructive"
          : "";
  return (
    <div className="kpi">
      <div className="kpi-head">
        <span>{label}</span>
        {Icon ? (
          <div className="kpi-icon">
            <Icon size={15} />
          </div>
        ) : null}
      </div>
      <div className={cn("kpi-value", toneClass)}>
        {value}
        {unit ? (
          <span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span>
        ) : null}
      </div>
      <div className="kpi-foot">
        {badge ? <StatusBadge tone={badgeTone} label={badge} /> : null}
        {hint ? <span>{hint}</span> : null}
      </div>
    </div>
  );
}

export function MetricBar({
  label,
  value,
  max = 100,
  valueLabel,
  tone = "primary",
  hint,
}: {
  label: string;
  value: number;
  max?: number;
  valueLabel?: string;
  tone?: Tone;
  hint?: string;
}) {
  const safeMax = max > 0 ? max : 100;
  const pct = Math.max(0, Math.min(100, (value / safeMax) * 100));
  const barColor =
    tone === "success"
      ? "var(--success)"
      : tone === "warning"
        ? "var(--warning)"
        : tone === "destructive"
          ? "var(--destructive)"
          : "var(--primary)";
  return (
    <div className="mb-4">
      <div className="mb-1.5 flex items-center justify-between text-[11px]">
        <span className="font-semibold">{label}</span>
        <span className="text-muted-foreground">{valueLabel ?? `${Math.round(pct)}%`}</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={Math.round(safeMax)}
        aria-label={label}
      >
        <span
          className="block h-full rounded-full"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
      {hint ? <p className="mt-1.5 text-[10px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function WhatThisMeans({
  children,
  title = "What does this mean?",
  defaultOpen = false,
}: {
  children: ReactNode;
  title?: string;
  defaultOpen?: boolean;
}) {
  return (
    <details className="what-means" open={defaultOpen}>
      <summary>{title}</summary>
      <div className="what-means-body">{children}</div>
    </details>
  );
}

export function EmptyState({
  title = "Nothing to show yet",
  message,
  icon: Icon,
}: {
  title?: string;
  message: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      {Icon ? <Icon size={26} className="text-muted-foreground" /> : null}
      <strong className="text-sm">{title}</strong>
      <p className="max-w-md text-[11px] text-muted-foreground">{message}</p>
    </div>
  );
}

export function LoadingState({ label = "Preparing simulated data…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 px-6 py-10 text-[11px] text-muted-foreground">
      <Loader2 size={16} className="animate-spin" />
      {label}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-6 py-8 text-center">
      <CircleAlert size={24} className="text-destructive" />
      <strong className="text-sm">{title}</strong>
      <p className="max-w-md text-[11px] text-muted-foreground">{message}</p>
      {onRetry ? (
        <Button size="sm" variant="outline" onClick={onRetry} className="mt-1">
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export interface Column<T> {
  key: keyof T & string;
  header: string;
  align?: "left" | "right" | "center";
  render?: (row: T) => ReactNode;
  exportValue?: (row: T) => string | number;
}

export function DataTable<T>({
  columns,
  rows,
  caption,
  emptyMessage = "No rows match the current filters.",
  exportName,
  maxHeight,
}: {
  columns: Column<T>[];
  rows: T[];
  caption?: string;
  emptyMessage?: string;
  exportName?: string;
  maxHeight?: number;
}) {
  const [exporting, setExporting] = useState(false);

  function handleExport() {
    if (!exportName || !rows.length) return;
    setExporting(true);
    try {
      exportCSV(
        rows.map((row) =>
          columns.reduce<Record<string, string | number>>((acc, col) => {
            const raw = col.exportValue
              ? col.exportValue(row)
              : ((row[col.key] as string | number | undefined) ?? "");
            acc[col.header] = typeof raw === "number" ? raw : String(raw);
            return acc;
          }, {}),
        ),
        exportName,
      );
      toast.success("CSV exported");
    } catch {
      toast.error("Could not export CSV");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      {caption || exportName ? (
        <div className="mb-2 flex items-center justify-between gap-2">
          {caption ? (
            <span className="text-[10px] text-muted-foreground">{caption}</span>
          ) : (
            <span />
          )}
          {exportName ? (
            <Button
              size="sm"
              variant="outline"
              onClick={handleExport}
              disabled={exporting || !rows.length}
            >
              <Download size={13} />
              Export CSV
            </Button>
          ) : null}
        </div>
      ) : null}
      <div
        className="overflow-x-auto"
        style={maxHeight ? { maxHeight, overflowY: "auto" } : undefined}
      >
        <table className="crop-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={{ textAlign: col.align ?? "left" }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col.key} style={{ textAlign: col.align ?? "left" }}>
                    {col.render ? col.render(row) : String(row[col.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length ? <EmptyState message={emptyMessage} /> : null}
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  hint,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[] | string[];
  hint?: string;
  className?: string;
}) {
  const normalized = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[11px] font-semibold">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label={label} className="h-9 w-full text-[12px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {normalized.map((o) => (
            <SelectItem key={o.value} value={o.value} className="text-[12px]">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hint ? <span className="mt-1 block text-[10px] text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit,
  hint,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  hint?: string;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[11px] font-semibold">
        {label}
        {unit ? <span className="ml-1 font-normal text-muted-foreground">({unit})</span> : null}
      </label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        value={value}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 text-[12px]"
      />
      {hint ? <span className="mt-1 block text-[10px] text-muted-foreground">{hint}</span> : null}
    </div>
  );
}

export function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2.5">
      <div>
        <div className="text-[11px] font-semibold">{label}</div>
        {description ? (
          <div className="text-[10px] text-muted-foreground">{description}</div>
        ) : null}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}

export function SectionHeading({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-3 mt-1 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {description ? <p className="text-[11px] text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

export function Tag({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium",
        BADGE_TONE[tone],
      )}
    >
      {children}
    </span>
  );
}

export function CloseButton({
  onClick,
  label = "Dismiss",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="text-muted-foreground hover:text-foreground"
    >
      <X size={14} />
    </button>
  );
}
