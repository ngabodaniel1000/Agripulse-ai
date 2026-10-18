"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ClipboardList,
  Gauge,
  Landmark,
  Sprout,
  TrendingUp,
  Wheat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModuleFrame } from "@/components/agri/ModuleFrame";
import { BarCompare, DonutShare, TrendLine } from "@/components/agri/charts";
import {
  DataTable,
  InfoNote,
  KpiCard,
  KpiGrid,
  SectionCard,
  SelectField,
  StatusBadge,
  WhatThisMeans,
  type Column,
} from "@/components/agri/ui";
import {
  cropDistribution,
  plannerKpis,
  provinceProduction,
  seasonHistory,
} from "@/lib/analytics/analytics";
import { compactNumber, formatKg, formatNumber, formatPct } from "@/lib/analytics/format";
import { buildAlerts, ALERT_CATEGORY_LABELS } from "@/data/sim/alerts";
import { CROP_NAMES, SEASON_LABELS } from "@/data/sim/crops";
import { DISTRICT_NAMES } from "@/data/sim/districts";
import { PROVINCE_LABELS } from "@/data/sim/districts";
import type { Season } from "@/data/sim";

const SEASON_OPTIONS = (["A", "B", "C"] as Season[]).map((s) => ({
  value: s,
  label: SEASON_LABELS[s],
}));
const CROP_OPTIONS = CROP_NAMES.map((c) => ({ value: c, label: c }));
const DISTRICT_OPTIONS = DISTRICT_NAMES.map((d) => ({ value: d, label: d }));

interface ProductionRow {
  province: string;
  label: string;
  areaHa: number;
  productionKg: number;
  avgYieldKgHa: number;
}

export function Planner() {
  const [season, setSeason] = useState<Season>("A");
  const [crop, setCrop] = useState("Maize");
  const [district, setDistrict] = useState("Musanze");

  const kpis = useMemo(() => plannerKpis(season), [season]);
  const distribution = useMemo(() => cropDistribution(season), [season]);
  const provinces = useMemo(() => provinceProduction(crop, season), [crop, season]);
  const history = useMemo(() => seasonHistory(crop, district), [crop, district]);
  const alerts = useMemo(() => buildAlerts(), []);
  const highAlerts = alerts.filter((a) => a.severity === "high");

  const donutData = distribution.map((d) => ({ crop: d.crop, areaHa: d.areaHa }));
  const provinceData = provinces.map((p) => ({
    province: PROVINCE_LABELS[p.province],
    productionKg: p.productionKg,
  }));
  const historyData = history.map((h) => ({ period: h.period, yieldKgHa: h.yieldKgHa }));

  const columns: Column<ProductionRow>[] = [
    {
      key: "label",
      header: "Province",
      render: (r) => PROVINCE_LABELS[r.province as keyof typeof PROVINCE_LABELS] ?? r.province,
    },
    {
      key: "areaHa",
      header: "Planted area (ha)",
      align: "right",
      render: (r) => formatNumber(r.areaHa),
    },
    {
      key: "productionKg",
      header: "Production (kg)",
      align: "right",
      render: (r) => formatNumber(r.productionKg),
    },
    {
      key: "avgYieldKgHa",
      header: "Avg yield (kg/ha)",
      align: "right",
      render: (r) => formatNumber(r.avgYieldKgHa),
    },
  ];

  const readAloud = `Planner overview for Season ${season}. The demonstration covers ${kpis.districts} districts and ${kpis.crops} crops, with a simulated planted area of ${compactNumber(kpis.simulatedAreaHa)} hectares and ${compactNumber(kpis.simulatedProductionKg)} kilograms of production. There are ${kpis.openAlerts} open demonstration alerts, of which ${kpis.highAlerts} are high severity.`;

  return (
    <ModuleFrame
      eyebrow="NATIONAL PLANNER DASHBOARD"
      title="Plan with a whole-country view"
      description="National scale, crop mix and alert picture side by side — every number reconciled to the same simulated datasets."
      tone="brand"
      readAloudText={readAloud}
      actions={
        <Button
          asChild
          variant="outline"
          className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
        >
          <Link href="/analysis-reports">
            Generate a report <ClipboardList size={13} />
          </Link>
        </Button>
      }
    >
      <div className="filter-bar">
        <SelectField
          label="Season"
          value={season}
          onChange={(v) => setSeason(v as Season)}
          options={SEASON_OPTIONS}
        />
        <SelectField label="Focus crop" value={crop} onChange={setCrop} options={CROP_OPTIONS} />
        <SelectField
          label="Trend district"
          value={district}
          onChange={setDistrict}
          options={DISTRICT_OPTIONS}
        />
      </div>

      <KpiGrid>
        <KpiCard
          label="Districts covered"
          value={formatNumber(kpis.districts)}
          icon={Landmark}
          badge="Simulated"
          badgeTone="warning"
          hint={`${kpis.crops} crops catalogued`}
        />
        <KpiCard
          label="Planted area"
          value={compactNumber(kpis.simulatedAreaHa)}
          unit="ha"
          icon={Sprout}
          hint="National simulation"
        />
        <KpiCard
          label="Production"
          value={compactNumber(kpis.simulatedProductionKg)}
          unit="kg"
          icon={Wheat}
          hint="Season total"
        />
        <KpiCard
          label="Average yield"
          value={formatNumber(kpis.averageYieldKgHa)}
          unit="kg/ha"
          icon={Gauge}
          hint="Across catalogued crops"
        />
        <KpiCard
          label="Price index"
          value={formatNumber(kpis.priceIndexRwfKg)}
          unit="RWF/kg"
          icon={TrendingUp}
          hint="Maize/bean weighted"
        />
        <KpiCard
          label="Average storage loss"
          value={`${kpis.averageLossPct}`}
          unit="%"
          icon={Gauge}
          hint="8-week average"
        />
        <KpiCard
          label="Open alerts"
          value={formatNumber(kpis.openAlerts)}
          icon={AlertTriangle}
          badge={kpis.highAlerts ? `${kpis.highAlerts} high` : "None high"}
          badgeTone={kpis.highAlerts ? "destructive" : "success"}
          valueTone={kpis.highAlerts ? "destructive" : "default"}
        />
        <KpiCard
          label="Crops catalogued"
          value={formatNumber(kpis.crops)}
          icon={Sprout}
          hint="Reference yield tables"
        />
      </KpiGrid>

      <div className="analysis-grid">
        <SectionCard
          title="Crop mix by planted area"
          description={`Season ${season} · simulated national area`}
          icon={Sprout}
        >
          <DonutShare
            data={donutData}
            nameKey="crop"
            valueKey="areaHa"
            valueFormatter={(v) => `${formatNumber(v)} ha`}
          />
          <WhatThisMeans>
            <p>
              This shows how much land each crop is assumed to occupy nationally, not its market
              value.
            </p>
          </WhatThisMeans>
        </SectionCard>

        <SectionCard
          title="Where the crop is produced"
          description={`${crop} · Season ${season} · simulated production by province`}
        >
          <BarCompare
            data={provinceData}
            xKey="province"
            yKey="productionKg"
            yLabel="Production (kg)"
            horizontal
            yFormatter={(v) => compactNumber(v)}
          />
        </SectionCard>
      </div>

      <div className="analysis-grid">
        <SectionCard
          title="Yield trend"
          description={`${crop} · ${district} · recent seasons`}
          icon={TrendingUp}
        >
          <TrendLine
            data={historyData}
            xKey="period"
            series={[{ key: "yieldKgHa", label: "Yield (kg/ha)" }]}
            yFormatter={(v) => formatNumber(v)}
          />
          <p className="text-[10px] text-muted-foreground">
            A demonstration trend, not a statistical time series.
          </p>
        </SectionCard>

        <SectionCard
          title="Alert summary"
          description="Deterministic demonstration alerts"
          icon={AlertTriangle}
        >
          <div className="panel-body">
            <div className="mb-3 flex flex-wrap gap-2">
              <StatusBadge tone="destructive" label={`${highAlerts.length} high`} />
              <StatusBadge
                tone="warning"
                label={`${alerts.filter((a) => a.severity === "medium").length} medium`}
              />
              <StatusBadge
                tone="neutral"
                label={`${alerts.filter((a) => a.severity === "low").length} low`}
              />
            </div>
            <ul className="space-y-2">
              {alerts.slice(0, 5).map((a) => (
                <li key={a.id} className="rounded-md border border-border px-3 py-2.5">
                  <div className="mb-1 flex items-center gap-2">
                    <StatusBadge
                      tone={
                        a.severity === "high"
                          ? "destructive"
                          : a.severity === "medium"
                            ? "warning"
                            : "neutral"
                      }
                      label={ALERT_CATEGORY_LABELS[a.category]}
                    />
                    <strong className="text-[11px]">{a.title}</strong>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{a.detail}</p>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href="/alerts">Open full alert list</Link>
            </Button>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Province production detail" description={`${crop} · Season ${season}`}>
        <DataTable columns={columns} rows={provinces} exportName={`${crop}-province-production`} />
      </SectionCard>

      <InfoNote tone="info" title="What this dashboard is">
        A planning aid built entirely on simulated demonstration data. It reconciles with the crop,
        weather, market and alert modules because they share one data layer.
      </InfoNote>
    </ModuleFrame>
  );
}
