"use client";

import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Boxes, Coins, Layers3, Sparkles, TrendingUp } from "lucide-react";
import { ModuleFrame } from "@/components/agri/ModuleFrame";
import {
  DataTable,
  InfoNote,
  KpiCard,
  KpiGrid,
  LoadingState,
  MetricBar,
  NumberField,
  SectionCard,
  SelectField,
  StatusBadge,
  WhatThisMeans,
  type Column,
} from "@/components/agri/ui";
import { compareInputCombinations } from "@/lib/analytics/inputs";
import { formatNumber, formatRwf, formatSignedPct, toNumber } from "@/lib/analytics/format";
import { CROP_NAMES, SEASON_LABELS } from "@/data/sim/crops";
import { DISTRICT_NAMES } from "@/data/sim/districts";
import type { Season } from "@/data/sim";

const ComboBars3D = lazy(() => import("@/components/agri/ComboBars3D"));

const SEASON_OPTIONS = (["A", "B", "C"] as Season[]).map((s) => ({
  value: s,
  label: SEASON_LABELS[s],
}));
const CROP_OPTIONS = CROP_NAMES.map((c) => ({ value: c, label: c }));
const DISTRICT_OPTIONS = DISTRICT_NAMES.map((d) => ({ value: d, label: d }));

interface ComboRow {
  label: string;
  yieldKgHa: number;
  yieldLiftPct: number;
  inputCostRwf: number;
  netBenefitRwf: number;
  roiPct: number;
  isBest: boolean;
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

export function InputCombinations() {
  const [crop, setCrop] = useState("Maize");
  const [district, setDistrict] = useState("Musanze");
  const [season, setSeason] = useState<Season>("A");
  const [farmSize, setFarmSize] = useState("1");
  const [mounted, setMounted] = useState(false);
  const [webgl, setWebgl] = useState(false);

  const areaHa = Math.max(0.05, toNumber(farmSize, 1));

  useEffect(() => {
    setMounted(true);
    setWebgl(hasWebGL());
  }, []);

  const analysis = useMemo(
    () => compareInputCombinations(crop, district, season, areaHa),
    [crop, district, season, areaHa],
  );

  const bestNet = analysis.bestByNet;
  const bestYield = analysis.bestByYield;
  const bestRoi = analysis.bestByRoi;

  const rows: ComboRow[] = analysis.results.map((r) => ({
    label: r.combination.label,
    yieldKgHa: r.yieldKgHa,
    yieldLiftPct: r.yieldLiftPct,
    inputCostRwf: r.inputCostRwf,
    netBenefitRwf: r.netBenefitRwf,
    roiPct: r.roiPct,
    isBest: bestNet ? r.combination.label === bestNet.combination.label : false,
  }));

  const columns: Column<ComboRow>[] = [
    {
      key: "label",
      header: "Combination",
      render: (r) => (
        <span className="inline-flex items-center gap-2">
          {r.label}
          {r.isBest ? <StatusBadge tone="success" label="Best net" /> : null}
        </span>
      ),
    },
    {
      key: "yieldKgHa",
      header: "Yield (kg/ha)",
      align: "right",
      render: (r) => formatNumber(r.yieldKgHa),
    },
    {
      key: "yieldLiftPct",
      header: "Vs no inputs",
      align: "right",
      render: (r) => (r.inputCostRwf === 0 ? "—" : formatSignedPct(r.yieldLiftPct, 0)),
    },
    {
      key: "inputCostRwf",
      header: "Input cost",
      align: "right",
      render: (r) => formatRwf(r.inputCostRwf),
    },
    {
      key: "netBenefitRwf",
      header: "Net benefit",
      align: "right",
      render: (r) => <strong>{formatRwf(r.netBenefitRwf)}</strong>,
    },
    {
      key: "roiPct",
      header: "Return on cost",
      align: "right",
      render: (r) => (r.inputCostRwf === 0 ? "—" : `${Math.round(r.roiPct)}%`),
    },
  ];

  const chartData = useMemo(
    () =>
      analysis.results.slice(0, 6).map((r, i) => ({
        label:
          r.combination.label.length > 12
            ? `${r.combination.label.slice(0, 11)}…`
            : r.combination.label,
        net: r.netBenefitRwf,
        index: i,
      })),
    [analysis],
  );

  const readAloud = bestNet
    ? `Input combination comparison for ${crop} in ${district}. The combination with the highest simulated net benefit is ${bestNet.combination.label}, with an estimated net benefit of ${formatNumber(bestNet.netBenefitRwf)} Rwandan francs over ${areaHa} hectares. Higher yield combinations may need more cash up front. This is a simulation.`
    : "Adjust the filters to compare input combinations.";

  return (
    <ModuleFrame
      eyebrow="INPUT COMBINATION INTELLIGENCE"
      title="Compare every input combination"
      description="See how combinations of improved seed, organic and mineral fertilizer and crop protection change yield, cost and net benefit for your plot."
      tone="field"
      readAloudText={readAloud}
    >
      <div className="filter-bar">
        <SelectField label="Crop" value={crop} onChange={setCrop} options={CROP_OPTIONS} />
        <SelectField
          label="District"
          value={district}
          onChange={setDistrict}
          options={DISTRICT_OPTIONS}
        />
        <SelectField
          label="Season"
          value={season}
          onChange={(v) => setSeason(v as Season)}
          options={SEASON_OPTIONS}
        />
        <NumberField
          label="Farm size"
          unit="ha"
          value={farmSize}
          onChange={setFarmSize}
          min={0.05}
          max={100}
          step={0.1}
        />
      </div>

      <KpiGrid>
        <KpiCard
          label="Best net benefit"
          value={bestNet ? formatNumber(bestNet.netBenefitRwf) : "—"}
          unit="RWF"
          icon={Coins}
          badge="Simulated"
          badgeTone="warning"
          hint={bestNet?.combination.label}
        />
        <KpiCard
          label="Highest yield"
          value={bestYield ? formatNumber(bestYield.yieldKgHa) : "—"}
          unit="kg/ha"
          icon={TrendingUp}
          hint={bestYield?.combination.label}
        />
        <KpiCard
          label="Best return on cost"
          value={bestRoi ? `${Math.round(bestRoi.roiPct)}%` : "—"}
          icon={Sparkles}
          hint={bestRoi?.combination.label ?? "Needs purchased inputs"}
        />
        <KpiCard
          label="No-input baseline"
          value={formatNumber(analysis.baselineYieldKgHa)}
          unit="kg/ha"
          icon={Layers3}
          hint="No purchased inputs"
        />
      </KpiGrid>

      <div className="analysis-grid">
        <SectionCard
          title="Net benefit of the top combinations"
          description="Bar height shows simulated net benefit (revenue minus input cost)"
          icon={Boxes}
        >
          <div className="three-panel">
            {mounted && webgl ? (
              <Suspense fallback={<LoadingState label="Loading 3D comparison…" />}>
                <ComboBars3D data={chartData} />
              </Suspense>
            ) : (
              <div className="three-fallback">
                {mounted
                  ? "3D view is not available on this device — using the table below instead."
                  : "Preparing 3D view…"}
              </div>
            )}
          </div>
          <div className="mt-4">
            {analysis.results.slice(0, 6).map((r) => (
              <MetricBar
                key={r.combination.label}
                label={r.combination.label}
                value={Math.max(0, r.netBenefitRwf)}
                max={Math.max(1, ...analysis.results.map((x) => Math.max(0, x.netBenefitRwf)))}
                valueLabel={formatRwf(r.netBenefitRwf)}
                tone="success"
              />
            ))}
          </div>
          <WhatThisMeans>
            <p>
              Taller bars mean more money left after paying for inputs, using the simulated price of{" "}
              <strong>{formatNumber(analysis.priceRwfKg)} RWF/kg</strong>. A high-yield combination
              is not automatically the most profitable one.
            </p>
          </WhatThisMeans>
        </SectionCard>

        <SectionCard
          title="Trade-offs to consider"
          description="Plain-language notes on the leading options"
          icon={Sparkles}
        >
          {bestNet ? (
            <InfoNote tone="success" title={`Most net benefit: ${bestNet.combination.label}`}>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                {bestNet.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </InfoNote>
          ) : null}
          {bestYield && bestYield.combination.label !== bestNet?.combination.label ? (
            <div className="mt-3">
              <InfoNote tone="info" title={`Highest yield: ${bestYield.combination.label}`}>
                This option produces the most grain but may cost more up front. Consider it when you
                need volume for a contract or family needs rather than maximum profit per franc
                spent.
              </InfoNote>
            </div>
          ) : null}
          <WhatThisMeans>
            <p>All numbers come from the same transparent yield engine and demonstration costs.</p>
            <ul>
              <li>Costs are per-hectare estimates scaled to your farm size.</li>
              <li>The market price is a simulated e-Soko style reference, not a live quote.</li>
              <li>Confirm input availability and prices with your local agro-dealer.</li>
            </ul>
          </WhatThisMeans>
        </SectionCard>
      </div>

      <SectionCard
        title="All 16 input combinations"
        description={`${crop} · ${district} · Season ${season} · ${areaHa} ha`}
      >
        <DataTable columns={columns} rows={rows} exportName={`${crop}-input-combinations`} />
      </SectionCard>
    </ModuleFrame>
  );
}
