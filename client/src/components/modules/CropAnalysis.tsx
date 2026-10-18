"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Coins, Gauge, Sprout, TrendingUp, Wheat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModuleFrame } from "@/components/agri/ModuleFrame";
import {
  DataTable,
  InfoNote,
  KpiCard,
  KpiGrid,
  MetricBar,
  NumberField,
  SectionCard,
  SelectField,
  WhatThisMeans,
  type Column,
} from "@/components/agri/ui";
import { BarCompare } from "@/components/agri/charts";
import { predictYield } from "@/lib/analytics/yield";
import { districtYieldRanking, nationalYield } from "@/lib/analytics/analytics";
import { formatKg, formatNumber, formatPct, formatRwf, toNumber } from "@/lib/analytics/format";
import { CROP_NAMES, SEASON_LABELS } from "@/data/sim/crops";
import { DISTRICT_NAMES, getDistrict, provinceOf, PROVINCE_LABELS } from "@/data/sim/districts";
import { INPUT_ADOPTION, INPUT_COSTS, PRACTICES } from "@/data/sim/inputs";
import { currentPrice } from "@/data/sim/market";
import type { Season } from "@/data/sim";

const SEASON_OPTIONS = (["A", "B", "C"] as Season[]).map((s) => ({
  value: s,
  label: SEASON_LABELS[s],
}));
const CROP_OPTIONS = CROP_NAMES.map((c) => ({ value: c, label: c }));
const DISTRICT_OPTIONS = DISTRICT_NAMES.map((d) => ({ value: d, label: d }));

interface Package {
  key: string;
  label: string;
  flags: {
    improvedSeed: boolean;
    organicFertilizer: boolean;
    inorganicFertilizer: boolean;
    pesticide: boolean;
  };
}

const COST_FLAG: Record<string, keyof Package["flags"]> = {
  improvedSeed: "improvedSeed",
  organic: "organicFertilizer",
  inorganic: "inorganicFertilizer",
  pesticide: "pesticide",
};

export function CropAnalysis() {
  const [crop, setCrop] = useState("Maize");
  const [district, setDistrict] = useState("Musanze");
  const [season, setSeason] = useState<Season>("A");
  const [farmSize, setFarmSize] = useState("1");
  const areaHa = Math.max(0.05, toNumber(farmSize, 1));

  const province = provinceOf(district);
  const adoption = INPUT_ADOPTION[province];
  const practices = PRACTICES[province];

  const packages: Package[] = useMemo(
    () => [
      {
        key: "local",
        label: "Local / low input",
        flags: {
          improvedSeed: false,
          organicFertilizer: false,
          inorganicFertilizer: false,
          pesticide: false,
        },
      },
      {
        key: "typical",
        label: "Typical practice (province)",
        flags: {
          improvedSeed: adoption.improvedSeed > 0.6,
          organicFertilizer: adoption.organic > 0.9,
          inorganicFertilizer: adoption.inorganic > 0.6,
          pesticide: adoption.pesticide > 0.4,
        },
      },
      {
        key: "improved",
        label: "Improved package",
        flags: {
          improvedSeed: true,
          organicFertilizer: true,
          inorganicFertilizer: true,
          pesticide: true,
        },
      },
    ],
    [adoption],
  );

  const results = useMemo(
    () =>
      packages.map((pkg) => {
        const result = predictYield({
          crop,
          district,
          season,
          farmSizeHa: areaHa,
          soil: getDistrict(district)?.dominantSoil ?? "Loam",
          ...pkg.flags,
          irrigation: practices.irrigation > 0.15,
          erosionControl: true,
          agroforestry: practices.agroforestry > 0.65,
        });
        const inputCostRwf = INPUT_COSTS.reduce(
          (sum, cost) => (pkg.flags[COST_FLAG[cost.key]] ? sum + cost.costPerHaRwf * areaHa : sum),
          0,
        );
        const price = currentPrice(crop, district);
        const gross = result.totalProductionKg * price;
        return { pkg, result, inputCostRwf, netRwf: gross - inputCostRwf };
      }),
    [packages, crop, district, season, areaHa, practices],
  );

  const improved = results[results.length - 1];
  const baseline = results[0];
  const yieldLift = baseline.result.predictedYieldKgHa
    ? ((improved.result.predictedYieldKgHa - baseline.result.predictedYieldKgHa) /
        baseline.result.predictedYieldKgHa) *
      100
    : 0;

  const ranking = useMemo(() => districtYieldRanking(crop, season), [crop, season]);
  const national = nationalYield(crop, season);
  const selectedRank = ranking.find((r) => r.district === district)?.rank ?? null;
  const price = currentPrice(crop, district);

  const adoptionChart = [
    { name: "Improved seed", value: Math.round(adoption.improvedSeed * 1000) / 10 },
    { name: "Organic fertilizer", value: Math.round(adoption.organic * 1000) / 10 },
    { name: "Inorganic fertilizer", value: Math.round(adoption.inorganic * 1000) / 10 },
    { name: "Pesticide", value: Math.round(adoption.pesticide * 1000) / 10 },
    { name: "Irrigation", value: Math.round(practices.irrigation * 1000) / 10 },
  ];

  type RankRow = (typeof ranking)[number];
  const rankColumns: Column<RankRow>[] = [
    { key: "rank", header: "#", align: "center" },
    {
      key: "district",
      header: "District",
      render: (r) => (r.district === district ? <strong>{r.district}</strong> : r.district),
    },
    { key: "province", header: "Province" },
    {
      key: "yieldKgHa",
      header: "Reference yield (kg/ha)",
      align: "right",
      render: (r) => formatNumber(r.yieldKgHa),
    },
  ];

  const readAloud = `Crop and input analysis for ${crop} in ${district} district, Season ${season}. The improved input package is estimated at ${formatNumber(improved.result.predictedYieldKgHa)} kilograms per hectare, compared with ${formatNumber(baseline.result.predictedYieldKgHa)} for a low-input package. This is a simulated demonstration, not a verified prediction.`;

  return (
    <ModuleFrame
      eyebrow="SMART CROP & INPUT ANALYSIS"
      title="Compare crops, inputs and yield patterns"
      description="Choose a crop, district and season to compare seed, fertilizer and pesticide patterns against reference yields — in plain numbers first."
      tone="field"
      readAloudText={readAloud}
      actions={
        <Button
          asChild
          variant="outline"
          className="bg-transparent text-primary-foreground border-primary-foreground/40 hover:bg-primary-foreground/10 hover:text-primary-foreground"
        >
          <Link href="/input-combinations">
            Compare input combinations <ArrowRight size={13} />
          </Link>
        </Button>
      }
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
        <div className="filter-bar-actions">
          <Button
            variant="outline"
            onClick={() => {
              setCrop("Maize");
              setDistrict("Musanze");
              setSeason("A");
              setFarmSize("1");
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      <KpiGrid>
        <KpiCard
          label="Est. yield — improved package"
          value={formatNumber(improved.result.predictedYieldKgHa)}
          unit="kg/ha"
          icon={Gauge}
          badge="Simulated"
          badgeTone="warning"
          hint={`${district} · Season ${season}`}
        />
        <KpiCard
          label="Yield range"
          value={`${formatNumber(improved.result.lowerKgHa)}–${formatNumber(improved.result.upperKgHa)}`}
          unit="kg/ha"
          icon={TrendingUp}
          hint={`±${formatPct(improved.result.uncertaintyPct, 0)} uncertainty`}
        />
        <KpiCard
          label="Est. production"
          value={formatNumber(improved.result.totalProductionKg)}
          unit="kg"
          icon={Wheat}
          hint={`${areaHa} ha planted`}
        />
        <KpiCard
          label="Reference price"
          value={formatNumber(price)}
          unit="RWF/kg"
          icon={Coins}
          hint="Simulated market reference"
        />
      </KpiGrid>

      <div className="analysis-grid">
        <SectionCard
          title="Input package comparison"
          description={`${crop} · ${district} · Season ${season} · ${areaHa} ha`}
          icon={Sprout}
        >
          <div className="overflow-hidden rounded-md border border-border">
            <table className="crop-table">
              <thead>
                <tr>
                  <th>Package</th>
                  <th style={{ textAlign: "right" }}>Yield (kg/ha)</th>
                  <th style={{ textAlign: "right" }}>Production</th>
                  <th style={{ textAlign: "right" }}>Input cost</th>
                  <th style={{ textAlign: "right" }}>Net value</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.pkg.key}>
                    <td>
                      <strong>{r.pkg.label}</strong>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {formatNumber(r.result.predictedYieldKgHa)}
                    </td>
                    <td style={{ textAlign: "right" }}>{formatKg(r.result.totalProductionKg)}</td>
                    <td style={{ textAlign: "right" }}>{formatRwf(r.inputCostRwf)}</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{formatRwf(r.netRwf)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <InfoNote tone="success" title="Main takeaway">
            The improved package is estimated at <strong>{formatPct(yieldLift, 0)}</strong> more
            yield per hectare than a low-input package in this simulation, but it adds about{" "}
            <strong>{formatRwf(improved.inputCostRwf)}</strong> in input cost.
          </InfoNote>
          <WhatThisMeans>
            <p>
              The three packages apply the same transparent response function with different input
              choices. Differences come from the documented factors (seed, fertilizer, protection),
              not from a trained model or a claim that one input causes a specific outcome.
            </p>
            <ul>
              <li>
                Reference yield comes from a simulated district table for the crop and season.
              </li>
              <li>Input costs are demonstration estimates, not quotas or shop prices.</li>
              <li>
                Confirm varieties and application rates with an extension officer and a soil test.
              </li>
            </ul>
          </WhatThisMeans>
        </SectionCard>

        <SectionCard
          title="Input adoption in the province"
          description={`${PROVINCE_LABELS[province]} · simulated reference`}
          icon={Sprout}
        >
          <BarCompare
            data={adoptionChart}
            xKey="name"
            yKey="value"
            yLabel="Adoption (%)"
            height={250}
            yFormatter={(v) => `${v}%`}
            colorByIndex
          />
          <p className="text-[10px] text-muted-foreground">
            Adoption shows how common each input is, not how effective it is.
          </p>
        </SectionCard>
      </div>

      <div className="analysis-grid">
        <SectionCard
          title="Yield pattern across districts"
          description={`${crop} · Season ${season} · reference kg/ha`}
        >
          <DataTable
            columns={rankColumns}
            rows={ranking.slice(0, 8)}
            caption={`National average ${formatNumber(national)} kg/ha${selectedRank ? ` · ${district} is ranked #${selectedRank} of ${ranking.length}` : ""}`}
            exportName={`${crop}-district-yields`}
          />
        </SectionCard>

        <SectionCard
          title="Input costs for the selected area"
          description={`${areaHa} ha · demonstration estimates`}
          icon={Coins}
        >
          <div className="panel-body">
            {INPUT_COSTS.map((cost) => (
              <MetricBar
                key={cost.key}
                label={`${cost.label} (${cost.unit})`}
                value={cost.costPerHaRwf * areaHa}
                max={Math.max(...INPUT_COSTS.map((c) => c.costPerHaRwf)) * areaHa}
                valueLabel={formatRwf(cost.costPerHaRwf * areaHa)}
                tone="primary"
              />
            ))}
          </div>
          <WhatThisMeans>
            <p>
              Costs are per-hectare demonstration estimates scaled to your farm size. Real prices
              depend on the agro-dealer, distance and season.
            </p>
          </WhatThisMeans>
        </SectionCard>
      </div>
    </ModuleFrame>
  );
}
