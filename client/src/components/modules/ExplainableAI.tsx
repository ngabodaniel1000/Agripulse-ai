"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Brain, CircleCheck, Database, GitBranch, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModuleFrame } from "@/components/agri/ModuleFrame";
import {
  InfoNote,
  QualityBadge,
  SectionCard,
  SelectField,
  StatusBadge,
  Tag,
  WhatThisMeans,
} from "@/components/agri/ui";
import { predictYield } from "@/lib/analytics/yield";
import { DATA_QUALITY, SIMULATION_DISCLAIMER, type DataQuality } from "@/data/sim/provenance";
import { CROP_NAMES, SEASON_LABELS } from "@/data/sim/crops";
import { DISTRICT_NAMES } from "@/data/sim/districts";
import { formatNumber } from "@/lib/analytics/format";
import type { Season } from "@/data/sim";

const CROP_OPTIONS = CROP_NAMES.map((c) => ({ value: c, label: c }));
const DISTRICT_OPTIONS = DISTRICT_NAMES.map((d) => ({ value: d, label: d }));
const SEASON_OPTIONS = (["A", "B", "C"] as Season[]).map((s) => ({
  value: s,
  label: SEASON_LABELS[s],
}));

const DATASETS: { name: string; detail: string; quality: DataQuality }[] = [
  {
    name: "Uploaded report statistics",
    detail: "Crop adoption, trade and dietary indicators copied from the dashboard reports.",
    quality: "observed",
  },
  {
    name: "District reference yields",
    detail: "Per-district yield tables used as the base of the estimator.",
    quality: "simulated",
  },
  {
    name: "Crop catalogue",
    detail: "Water needs, optimum temperature and price references per crop.",
    quality: "simulated",
  },
  {
    name: "District climate & geography",
    detail: "Elevation, rainfall and soil association per district.",
    quality: "simulated",
  },
  {
    name: "Input adoption & practices",
    detail: "Province-level adoption shares and per-hectare demonstration costs.",
    quality: "synthesized",
  },
  {
    name: "Market reference prices",
    detail: "Twelve-month e-Soko style price series per crop and district.",
    quality: "simulated",
  },
  {
    name: "Demonstration farm",
    detail: "One illustrative household's harvests, inputs and sales.",
    quality: "simulated",
  },
];

export function ExplainableAI() {
  const [crop, setCrop] = useState("Maize");
  const [district, setDistrict] = useState("Musanze");
  const [season, setSeason] = useState<Season>("A");

  const example = useMemo(
    () =>
      predictYield({
        crop,
        district,
        season,
        farmSizeHa: 1,
        soil: "Loam",
        improvedSeed: true,
        organicFertilizer: true,
        inorganicFertilizer: true,
        pesticide: false,
        irrigation: false,
        erosionControl: true,
        agroforestry: false,
      }),
    [crop, district, season],
  );

  const maxImpact = Math.max(1, ...example.factors.map((f) => Math.abs(f.impactPct)));

  const readAloud = `How AgriPulse explains its estimates. The yield engine is a transparent calculation, not a trained machine-learning model. It starts from a simulated district reference yield of ${formatNumber(example.baseYieldKgHa)} kilograms per hectare for ${crop} in ${district}, then applies ${example.factors.length} labelled agronomic factors. The estimated result is ${formatNumber(example.predictedYieldKgHa)} kilograms per hectare. Every assumption is listed, and all demonstration data is clearly labelled.`;

  return (
    <ModuleFrame
      eyebrow="EXPLAINABLE AI"
      title="No black boxes here"
      description="See exactly how an estimate is built, what each data source is, and the limits of the demonstration engines."
      tone="brand"
      readAloudText={readAloud}
      showAdapterStatus
    >
      <div className="analysis-grid">
        <SectionCard
          title="How a yield estimate is built"
          description="Four transparent steps"
          icon={GitBranch}
        >
          <ol className="space-y-3">
            {[
              {
                t: "Start from a reference",
                d: `The simulated district reference yield for ${crop} in ${district}, Season ${season}: ${formatNumber(example.baseYieldKgHa)} kg/ha.`,
              },
              {
                t: "Apply agronomic factors",
                d: "Multiply by labelled factors for rainfall, temperature, seed, fertilizer, protection, soil and elevation.",
              },
              {
                t: "Report a range, not a point",
                d: `The estimate of ${formatNumber(example.predictedYieldKgHa)} kg/ha is shown with a range of ${formatNumber(example.lowerKgHa)}–${formatNumber(example.upperKgHa)}.`,
              },
              {
                t: "List the assumptions",
                d: "Every assumption is written out so you can judge whether it fits your farm.",
              },
            ].map((s, i) => (
              <li key={s.t} className="story-step panel">
                <span className="story-step-index">{i + 1}</span>
                <div>
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-3">
            <InfoNote tone="success" title="The engine, precisely">
              {example.engine}. It does not learn from data and makes no claim of causal effect from
              observed patterns.
            </InfoNote>
          </div>
        </SectionCard>

        <SectionCard
          title="Work through an example"
          description="Change the inputs and watch the factors"
          icon={Search}
        >
          <div className="mb-3 grid gap-3 sm:grid-cols-3">
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
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px]">
            <Tag tone="primary">{formatNumber(example.predictedYieldKgHa)} kg/ha estimated</Tag>
            <Tag tone="neutral">reference {formatNumber(example.baseYieldKgHa)} kg/ha</Tag>
            <Tag tone={example.confidencePct > 80 ? "success" : "warning"}>
              {example.confidencePct}% confidence band
            </Tag>
          </div>
          <div className="mt-4">
            {example.factors.map((f) => {
              const width = Math.min(50, (Math.abs(f.impactPct) / maxImpact) * 50);
              return (
                <div className="factor-row" key={f.key}>
                  <span className="font-semibold">{f.label}</span>
                  <span className="factor-track" aria-hidden="true">
                    <span
                      className={`factor-fill ${f.direction === "decrease" ? "decrease" : "increase"}`}
                      style={{ width: `${f.direction === "neutral" ? 0 : width}%` }}
                    />
                  </span>
                  <span className="factor-value">
                    {f.impactPct > 0 ? "+" : ""}
                    {Math.round(f.impactPct)}%
                  </span>
                </div>
              );
            })}
          </div>
          <WhatThisMeans>
            <p>
              Each row shows one factor's effect versus the district reference, with its reason in
              the yield tool.
            </p>
          </WhatThisMeans>
          <Button asChild variant="outline" size="sm" className="mt-3">
            <Link href="/yield-prediction">Try it on your own plot</Link>
          </Button>
        </SectionCard>
      </div>

      <SectionCard
        title="Data provenance"
        description="Every dataset is labelled by how it was produced"
        icon={Database}
      >
        <div className="mb-3 grid gap-2 sm:grid-cols-2">
          {(Object.keys(DATA_QUALITY) as DataQuality[]).map((q) => (
            <div key={q} className="rounded-md border border-border px-3 py-2.5">
              <QualityBadge quality={q} />
              <p className="mt-1.5 text-[10px] text-muted-foreground">
                {DATA_QUALITY[q].description}
              </p>
            </div>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="crop-table">
            <thead>
              <tr>
                <th>Dataset</th>
                <th>What it is</th>
                <th>Quality</th>
              </tr>
            </thead>
            <tbody>
              {DATASETS.map((d) => (
                <tr key={d.name}>
                  <td>
                    <strong>{d.name}</strong>
                  </td>
                  <td>{d.detail}</td>
                  <td>
                    <QualityBadge quality={d.quality} compact />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <div className="analysis-grid">
        <SectionCard
          title="What the system will not do"
          description="Honest limits"
          icon={CircleCheck}
        >
          <ul className="list-disc space-y-1.5 pl-5 text-[11px] text-muted-foreground">
            <li>It will not present a simulated number as an observed statistic.</li>
            <li>It will not claim a live market, weather or NISR connection when none exists.</li>
            <li>
              It will not give a point prediction without showing a range and its assumptions.
            </li>
            <li>It will not treat a group pattern as proof about an individual farm.</li>
          </ul>
        </SectionCard>

        <SectionCard
          title="Data & methodology statement"
          description="The underlying disclaimer"
          icon={Brain}
        >
          <div className="rounded-md border border-border bg-secondary px-3.5 py-3 text-[11px] leading-relaxed text-muted-foreground">
            {SIMULATION_DISCLAIMER}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge tone="warning" label="Simulated modules" />
            <StatusBadge tone="success" label="Report statistics observed" />
          </div>
        </SectionCard>
      </div>
    </ModuleFrame>
  );
}
