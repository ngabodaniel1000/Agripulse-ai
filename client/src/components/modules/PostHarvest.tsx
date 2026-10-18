"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Droplets, PackageOpen, Snowflake, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModuleFrame } from "@/components/agri/ModuleFrame";
import { BarCompare } from "@/components/agri/charts";
import {
  DataTable,
  InfoNote,
  KpiCard,
  KpiGrid,
  MetricBar,
  SectionCard,
  StatusBadge,
  WhatThisMeans,
  type Column,
} from "@/components/agri/ui";
import { lossSummary } from "@/lib/analytics/analytics";
import { STORAGE_METHOD_DETAILS, STORAGE_METHOD_NAMES } from "@/lib/analytics/storage";
import { formatNumber, formatPct, formatRwf } from "@/lib/analytics/format";
import { CROPS } from "@/data/sim/crops";

interface LossRow {
  method: string;
  weeklyLossPct: number;
  loss8WeeksPct: number;
  costPerKgWeek: number;
}

export function PostHarvest() {
  const [humidity, setHumidity] = useState(75);
  const [temperature, setTemperature] = useState(27);

  const losses = useMemo(() => lossSummary(), []);
  const best = losses.reduce((a, b) => (b.loss8WeeksPct < a.loss8WeeksPct ? b : a), losses[0]);
  const worst = losses.reduce((a, b) => (b.loss8WeeksPct > a.loss8WeeksPct ? b : a), losses[0]);
  const averageLoss = losses.reduce((s, r) => s + r.loss8WeeksPct, 0) / (losses.length || 1);

  const envMultiplier =
    1 + 0.01 * Math.max(0, humidity - 70) + 0.02 * Math.max(0, temperature - 25);

  const lossData = losses.map((l) => ({ method: l.method, loss8WeeksPct: l.loss8WeeksPct }));
  const cropSensitivity = CROPS.map((c) => ({ crop: c.name, multiplier: c.lossMultiplierPerWeek }));

  const columns: Column<LossRow>[] = [
    { key: "method", header: "Storage method" },
    {
      key: "weeklyLossPct",
      header: "Weekly loss",
      align: "right",
      render: (r) => formatPct(r.weeklyLossPct, 2),
    },
    {
      key: "loss8WeeksPct",
      header: "Loss over 8 weeks",
      align: "right",
      render: (r) => <strong>{formatPct(r.loss8WeeksPct, 1)}</strong>,
    },
    {
      key: "costPerKgWeek",
      header: "Cost per kg / week",
      align: "right",
      render: (r) => formatRwf(r.costPerKgWeek),
    },
  ];

  const readAloud = `Post-harvest loss analyzer. Across the storage methods in this simulation, the lowest eight-week loss is ${formatPct(best.loss8WeeksPct, 1)} with ${best.method}, and the highest is ${formatPct(worst.loss8WeeksPct, 1)} with ${worst.method}. Warmer and more humid conditions increase losses and the increase is shown in the environmental note.`;

  return (
    <ModuleFrame
      eyebrow="POST-HARVEST LOSS ANALYZER"
      title="Keep more of what you grow"
      description="Compare storage methods by expected loss and cost, and see how heat and humidity change the picture."
      tone="field"
      readAloudText={readAloud}
      actions={
        <Button
          asChild
          variant="outline"
          className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
        >
          <Link href="/sell-or-store">
            Decide sell or store <TrendingDown size={13} />
          </Link>
        </Button>
      }
    >
      <KpiGrid>
        <KpiCard
          label="Best method (8 weeks)"
          value={formatPct(best.loss8WeeksPct, 1)}
          icon={PackageOpen}
          badge="Simulated"
          badgeTone="warning"
          hint={best.method}
          valueTone="success"
        />
        <KpiCard
          label="Highest loss method"
          value={formatPct(worst.loss8WeeksPct, 1)}
          icon={TrendingDown}
          hint={worst.method}
          valueTone="destructive"
        />
        <KpiCard
          label="Average 8-week loss"
          value={formatPct(averageLoss, 1)}
          icon={TrendingDown}
          hint="Across all methods"
        />
        <KpiCard
          label="Methods compared"
          value={formatNumber(losses.length)}
          icon={PackageOpen}
          hint="Traditional to improved silo"
        />
      </KpiGrid>

      <div className="analysis-grid">
        <SectionCard
          title="Loss by storage method"
          description="Expected share of the harvest lost over eight weeks"
          icon={PackageOpen}
        >
          <BarCompare
            data={lossData}
            xKey="method"
            yKey="loss8WeeksPct"
            yLabel="Loss (%)"
            yFormatter={(v) => `${v}%`}
            colorByIndex
          />
          <WhatThisMeans>
            <p>
              Longer bars mean more of your harvest is lost. Air-tight storage sharply reduces
              losses but costs more per kilogram.
            </p>
          </WhatThisMeans>
        </SectionCard>

        <SectionCard
          title="Heat and humidity effect"
          description="Adjust the local conditions to see the multiplier"
          icon={Droplets}
        >
          <div className="panel-body">
            <div className="mb-4 grid gap-3">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-[11px]">
                  <span className="font-semibold">Relative humidity</span>
                  <span className="text-muted-foreground">{humidity}%</span>
                </div>
                <input
                  type="range"
                  min={40}
                  max={95}
                  value={humidity}
                  onChange={(e) => setHumidity(Number(e.target.value))}
                  className="w-full"
                  aria-label="Relative humidity"
                />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between text-[11px]">
                  <span className="font-semibold">Temperature</span>
                  <span className="text-muted-foreground">{temperature} °C</span>
                </div>
                <input
                  type="range"
                  min={12}
                  max={38}
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  className="w-full"
                  aria-label="Storage temperature"
                />
              </div>
            </div>
            <MetricBar
              label="Loss multiplier from the environment"
              value={envMultiplier}
              max={2}
              valueLabel={`${envMultiplier.toFixed(2)}×`}
              tone={envMultiplier > 1.2 ? "destructive" : "warning"}
            />
            <InfoNote tone={envMultiplier > 1.2 ? "warning" : "info"} title="What this means">
              Current conditions multiply the base storage loss by{" "}
              <strong>{envMultiplier.toFixed(2)}×</strong>. Drying grain fully and keeping it cool
              and dry is the single most effective loss reduction.
            </InfoNote>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Storage method detail"
        description="Weekly loss, eight-week loss and weekly cost"
      >
        <DataTable columns={columns} rows={losses} exportName="storage-loss-summary" />
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {STORAGE_METHOD_DETAILS.map((m) => (
            <div
              key={m.name}
              className="flex items-start justify-between gap-3 rounded-md border border-border px-3 py-2.5"
            >
              <div>
                <div className="text-[11px] font-semibold">{m.name}</div>
                <div className="text-[10px] text-muted-foreground">{m.note}</div>
              </div>
              <StatusBadge tone="neutral" label={`${formatRwf(m.costPerKgWeek)}/kg·wk`} />
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          Methods compared: {STORAGE_METHOD_NAMES.join(", ")}.
        </p>
      </SectionCard>

      <SectionCard title="Which crops are most delicate" description="Relative weekly loss by crop">
        <BarCompare
          data={cropSensitivity}
          xKey="crop"
          yKey="multiplier"
          yLabel="Relative weekly loss"
          yFormatter={(v) => `${v}×`}
          horizontal
          colorByIndex
        />
        <InfoNote tone="info">
          Root and fruit crops are more perishable than cereals in this model. They usually need
          faster marketing or better cooling.
        </InfoNote>
      </SectionCard>

      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <Snowflake size={14} /> Tip: shade, ventilation and clean containers reduce losses before
        any structure is built.
      </div>
    </ModuleFrame>
  );
}
