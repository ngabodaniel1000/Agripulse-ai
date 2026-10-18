"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Coins, Gauge, PackageOpen, TrendingDown, TrendingUp, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModuleFrame } from "@/components/agri/ModuleFrame";
import { BarCompare, TrendLine } from "@/components/agri/charts";
import {
  DataTable,
  InfoNote,
  KpiCard,
  KpiGrid,
  SectionCard,
  StatusBadge,
  WhatThisMeans,
  type Column,
} from "@/components/agri/ui";
import {
  DEMO_FARM,
  DEMO_HARVESTS,
  DEMO_INPUT_HISTORY,
  DEMO_MARKET_INTERACTIONS,
  DEMO_PREDICTIONS,
} from "@/data/sim/farm";
import {
  compactNumber,
  formatKg,
  formatNumber,
  formatRwf,
  formatSignedPct,
  safeDivide,
} from "@/lib/analytics/format";
import type { HarvestRecord } from "@/data/sim/farm";

export function FarmPerformance() {
  const totals = useMemo(() => {
    const harvestKg = DEMO_HARVESTS.reduce((s, h) => s + h.harvestKg, 0);
    const areaHa = DEMO_HARVESTS.reduce((s, h) => s + h.areaHa, 0);
    const inputCost = DEMO_HARVESTS.reduce((s, h) => s + h.inputCostRwf, 0);
    const marketValue = DEMO_HARVESTS.reduce((s, h) => s + h.marketValueRwf, 0);
    const lossKg = DEMO_HARVESTS.reduce((s, h) => s + h.lossKg, 0);
    return {
      harvestKg,
      areaHa,
      inputCost,
      marketValue,
      lossKg,
      avgYield: safeDivide(harvestKg, areaHa),
      grossMargin: marketValue - inputCost,
    };
  }, []);

  const harvestColumns: Column<HarvestRecord>[] = [
    { key: "year", header: "Year", align: "right" },
    { key: "season", header: "Season", render: (r) => `Season ${r.season}` },
    { key: "crop", header: "Crop" },
    { key: "areaHa", header: "Area (ha)", align: "right", render: (r) => formatNumber(r.areaHa) },
    {
      key: "harvestKg",
      header: "Harvest (kg)",
      align: "right",
      render: (r) => formatNumber(r.harvestKg),
    },
    {
      key: "yieldKgHa",
      header: "Yield (kg/ha)",
      align: "right",
      render: (r) => <strong>{formatNumber(r.yieldKgHa)}</strong>,
    },
    {
      key: "inputCostRwf",
      header: "Input cost",
      align: "right",
      render: (r) => formatRwf(r.inputCostRwf),
    },
    {
      key: "marketValueRwf",
      header: "Market value",
      align: "right",
      render: (r) => formatRwf(r.marketValueRwf),
    },
    { key: "lossKg", header: "Loss (kg)", align: "right", render: (r) => formatNumber(r.lossKg) },
  ];

  const yieldByPeriod = useMemo(
    () =>
      [...DEMO_HARVESTS]
        .sort((a, b) => a.year - b.year)
        .map((h) => ({ period: `${h.season} ${h.year}`, yieldKgHa: h.yieldKgHa })),
    [],
  );

  const lossByCrop = useMemo(() => {
    const map = new Map<string, number>();
    for (const h of DEMO_HARVESTS) map.set(h.crop, (map.get(h.crop) ?? 0) + h.lossKg);
    return Array.from(map, ([crop, lossKg]) => ({ crop, lossKg }));
  }, []);

  const readAloud = `Farm performance for the demonstration household. Across ${DEMO_HARVESTS.length} recorded seasons, total harvest is about ${formatNumber(totals.harvestKg)} kilograms from ${formatNumber(totals.areaHa)} hectares, with a gross margin of about ${formatNumber(totals.grossMargin)} Rwandan francs after input costs. This is a simulated illustrative farmer.`;

  return (
    <ModuleFrame
      eyebrow="FARM PERFORMANCE TRACKER"
      title="See how the farm is really doing"
      description="Harvest, cost, margin and prediction accuracy for one illustrative household — the same numbers the other farm modules use."
      tone="field"
      readAloudText={readAloud}
      actions={
        <Button
          asChild
          variant="outline"
          className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
        >
          <Link href="/farmer-profile">
            Open farmer profile <User size={13} />
          </Link>
        </Button>
      }
    >
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-md border border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <User size={16} className="text-primary" />
          <div>
            <div className="text-[11px] font-semibold">{DEMO_FARM.farmerName}</div>
            <div className="text-[10px] text-muted-foreground">
              {DEMO_FARM.cooperative} · {DEMO_FARM.district} · {DEMO_FARM.plots} plots ·{" "}
              {DEMO_FARM.farmSizeHa} ha
            </div>
          </div>
        </div>
        <StatusBadge tone="warning" label="Simulated household" className="ml-auto" />
      </div>

      <KpiGrid>
        <KpiCard
          label="Total harvest"
          value={compactNumber(totals.harvestKg)}
          unit="kg"
          icon={PackageOpen}
          badge="Simulated"
          badgeTone="warning"
          hint={`${formatNumber(totals.areaHa)} ha cropped`}
        />
        <KpiCard
          label="Average yield"
          value={formatNumber(totals.avgYield)}
          unit="kg/ha"
          icon={Gauge}
          hint="Weighted by area"
        />
        <KpiCard
          label="Input cost"
          value={compactNumber(totals.inputCost)}
          unit="RWF"
          icon={Coins}
          hint="Across recorded seasons"
        />
        <KpiCard
          label="Market value"
          value={compactNumber(totals.marketValue)}
          unit="RWF"
          icon={TrendingUp}
          hint="Simulated prices"
        />
        <KpiCard
          label="Gross margin"
          value={compactNumber(totals.grossMargin)}
          unit="RWF"
          icon={Coins}
          valueTone={totals.grossMargin >= 0 ? "success" : "destructive"}
          hint="Market value − inputs"
        />
        <KpiCard
          label="Post-harvest loss"
          value={formatNumber(totals.lossKg)}
          unit="kg"
          icon={TrendingDown}
          valueTone="warning"
          hint={`${formatSignedPct(safeDivide(totals.lossKg, totals.harvestKg) * 100, 1)} of harvest`}
        />
      </KpiGrid>

      <div className="analysis-grid">
        <SectionCard
          title="Yield over time"
          description="All recorded seasons for this household"
          icon={TrendingUp}
        >
          <TrendLine
            data={yieldByPeriod}
            xKey="period"
            series={[{ key: "yieldKgHa", label: "Yield (kg/ha)" }]}
            yFormatter={(v) => formatNumber(v)}
          />
          <WhatThisMeans>
            <p>
              Each point is one recorded season. Rising yield with steady input use usually points
              to better practices or soils.
            </p>
          </WhatThisMeans>
        </SectionCard>

        <SectionCard
          title="Post-harvest loss by crop"
          description="Kilograms lost after harvest"
          icon={TrendingDown}
        >
          <BarCompare
            data={lossByCrop}
            xKey="crop"
            yKey="lossKg"
            yLabel="Loss (kg)"
            yFormatter={(v) => compactNumber(v)}
          />
          <Button asChild variant="outline" size="sm" className="mt-3">
            <Link href="/post-harvest">Reduce losses in the post-harvest tool</Link>
          </Button>
        </SectionCard>
      </div>

      <SectionCard title="Harvest records" description="Every recorded season">
        <DataTable columns={harvestColumns} rows={DEMO_HARVESTS} exportName="demo-farm-harvests" />
      </SectionCard>

      <div className="analysis-grid">
        <SectionCard title="Prediction check" description="Estimate versus what was harvested">
          <div className="overflow-x-auto">
            <table className="crop-table">
              <thead>
                <tr>
                  <th>Season</th>
                  <th>Crop</th>
                  <th style={{ textAlign: "right" }}>Estimated</th>
                  <th style={{ textAlign: "right" }}>Actual</th>
                  <th style={{ textAlign: "right" }}>Difference</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_PREDICTIONS.map((p) => {
                  const diff =
                    p.actualKgHa == null
                      ? null
                      : safeDivide(p.actualKgHa - p.predictedKgHa, p.predictedKgHa) * 100;
                  return (
                    <tr key={`${p.date}-${p.crop}`}>
                      <td>
                        {p.season} {p.date.slice(0, 4)}
                      </td>
                      <td>{p.crop}</td>
                      <td style={{ textAlign: "right" }}>
                        {formatNumber(p.predictedKgHa)} ({formatNumber(p.lowerKgHa)}–
                        {formatNumber(p.upperKgHa)})
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {p.actualKgHa == null ? "—" : formatNumber(p.actualKgHa)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {diff == null ? (
                          "—"
                        ) : (
                          <StatusBadge
                            tone={Math.abs(diff) <= 10 ? "success" : "warning"}
                            label={formatSignedPct(diff, 0)}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <InfoNote tone="info" title="Honest about accuracy">
            Differences are shown openly. Tight matches here are illustrative and do not prove the
            engine will match real harvests.
          </InfoNote>
        </SectionCard>

        <SectionCard title="Input history" description="What was purchased and when">
          <ul className="space-y-2">
            {DEMO_INPUT_HISTORY.map((e) => (
              <li
                key={`${e.date}-${e.crop}`}
                className="rounded-md border border-border px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-[11px]">{e.crop}</strong>
                  <span className="text-[10px] text-muted-foreground">{e.date}</span>
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  Seed {formatKg(e.seedKg)} · organic {formatKg(e.organicKg)} · mineral{" "}
                  {formatKg(e.inorganicKg)} · {formatRwf(e.costRwf)}
                </div>
                <div className="text-[10px]">{e.note}</div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard title="Market interactions" description="Where produce was sold (simulated)">
        <div className="overflow-x-auto">
          <table className="crop-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Crop</th>
                <th style={{ textAlign: "right" }}>Quantity</th>
                <th style={{ textAlign: "right" }}>Price</th>
                <th>Buyer</th>
                <th>Channel</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_MARKET_INTERACTIONS.map((m) => (
                <tr key={`${m.date}-${m.crop}`}>
                  <td>{m.date}</td>
                  <td>{m.crop}</td>
                  <td style={{ textAlign: "right" }}>{formatKg(m.quantityKg)}</td>
                  <td style={{ textAlign: "right" }}>{formatNumber(m.priceRwfKg)} RWF/kg</td>
                  <td>{m.buyer}</td>
                  <td>{m.channel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </ModuleFrame>
  );
}
