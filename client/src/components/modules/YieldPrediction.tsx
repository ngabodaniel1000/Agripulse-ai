"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Gauge, Ruler, Sprout, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModuleFrame } from "@/components/agri/ModuleFrame";
import {
  InfoNote,
  KpiCard,
  KpiGrid,
  NumberField,
  SectionCard,
  SelectField,
  ToggleField,
  WhatThisMeans,
} from "@/components/agri/ui";
import { predictYield, SOIL_TYPES } from "@/lib/analytics/yield";
import { formatNumber, formatPct, formatRwf, toNumber } from "@/lib/analytics/format";
import { CROP_NAMES, SEASON_LABELS } from "@/data/sim/crops";
import { DISTRICT_NAMES, getDistrict } from "@/data/sim/districts";
import { currentPrice } from "@/data/sim/market";
import type { Season } from "@/data/sim";

const SEASON_OPTIONS = (["A", "B", "C"] as Season[]).map((s) => ({
  value: s,
  label: SEASON_LABELS[s],
}));
const CROP_OPTIONS = CROP_NAMES.map((c) => ({ value: c, label: c }));
const DISTRICT_OPTIONS = DISTRICT_NAMES.map((d) => ({ value: d, label: d }));
const SOIL_OPTIONS = SOIL_TYPES.map((s) => ({ value: s, label: s }));

export function YieldPrediction() {
  const [crop, setCrop] = useState("Maize");
  const [district, setDistrict] = useState("Musanze");
  const [season, setSeason] = useState<Season>("A");
  const [farmSize, setFarmSize] = useState("1");
  const [soil, setSoil] = useState<string>(getDistrict("Musanze")?.dominantSoil ?? "Loam");
  const [rainfall, setRainfall] = useState("");
  const [temperature, setTemperature] = useState("");
  const [improvedSeed, setImprovedSeed] = useState(true);
  const [organicFertilizer, setOrganicFertilizer] = useState(true);
  const [inorganicFertilizer, setInorganicFertilizer] = useState(true);
  const [pesticide, setPesticide] = useState(false);
  const [irrigation, setIrrigation] = useState(false);
  const [erosionControl, setErosionControl] = useState(true);
  const [agroforestry, setAgroforestry] = useState(false);

  const areaHa = Math.max(0.05, toNumber(farmSize, 1));

  const result = useMemo(
    () =>
      predictYield({
        crop,
        district,
        season,
        farmSizeHa: areaHa,
        soil,
        improvedSeed,
        organicFertilizer,
        inorganicFertilizer,
        pesticide,
        irrigation,
        erosionControl,
        agroforestry,
        rainfallMm: rainfall === "" ? undefined : toNumber(rainfall),
        temperatureC: temperature === "" ? undefined : toNumber(temperature),
      }),
    [
      crop,
      district,
      season,
      areaHa,
      soil,
      improvedSeed,
      organicFertilizer,
      inorganicFertilizer,
      pesticide,
      irrigation,
      erosionControl,
      agroforestry,
      rainfall,
      temperature,
    ],
  );

  const price = currentPrice(crop, district);
  const grossValue = result.totalProductionKg * price;
  const maxImpact = Math.max(1, ...result.factors.map((f) => Math.abs(f.impactPct)));

  const readAloud = `Estimated yield for ${crop} in ${district}, Season ${season}, is about ${formatNumber(result.predictedYieldKgHa)} kilograms per hectare, with a likely range of ${formatNumber(result.lowerKgHa)} to ${formatNumber(result.upperKgHa)}. This comes from a transparent demonstration calculation using your chosen inputs, and is not a trained model or a verified prediction.`;

  function resetToDefaults() {
    setCrop("Maize");
    setDistrict("Musanze");
    setSeason("A");
    setFarmSize("1");
    setSoil(getDistrict("Musanze")?.dominantSoil ?? "Loam");
    setRainfall("");
    setTemperature("");
    setImprovedSeed(true);
    setOrganicFertilizer(true);
    setInorganicFertilizer(true);
    setPesticide(false);
    setIrrigation(false);
    setErosionControl(true);
    setAgroforestry(false);
  }

  return (
    <ModuleFrame
      eyebrow="CROP YIELD PREDICTION"
      title="Estimate your harvest before you plant"
      description="Enter your plot, soil and planned inputs to see an estimated yield range — with every assumption listed in the open."
      tone="field"
      readAloudText={readAloud}
      actions={
        <Button
          asChild
          variant="outline"
          className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
        >
          <Link href="/sell-or-store">
            Decide sell or store <TrendingUp size={13} />
          </Link>
        </Button>
      }
    >
      <div className="filter-bar">
        <SelectField label="Crop" value={crop} onChange={setCrop} options={CROP_OPTIONS} />
        <SelectField
          label="District"
          value={district}
          onChange={(v) => {
            setDistrict(v);
            setSoil(getDistrict(v)?.dominantSoil ?? "Loam");
          }}
          options={DISTRICT_OPTIONS}
        />
        <SelectField
          label="Season"
          value={season}
          onChange={(v) => setSeason(v as Season)}
          options={SEASON_OPTIONS}
        />
        <SelectField
          label="Soil type"
          value={soil}
          onChange={setSoil}
          options={SOIL_OPTIONS}
          hint="Default is the dominant soil for the district."
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
          <Button variant="outline" onClick={resetToDefaults}>
            Reset
          </Button>
        </div>
      </div>

      <KpiGrid>
        <KpiCard
          label="Estimated yield"
          value={formatNumber(result.predictedYieldKgHa)}
          unit="kg/ha"
          icon={Gauge}
          badge="Simulated"
          badgeTone="warning"
          hint={`Reference ${formatNumber(result.baseYieldKgHa)} kg/ha`}
        />
        <KpiCard
          label="Likely range"
          value={`${formatNumber(result.lowerKgHa)}–${formatNumber(result.upperKgHa)}`}
          unit="kg/ha"
          icon={TrendingUp}
          hint={`±${formatPct(result.uncertaintyPct, 0)}`}
        />
        <KpiCard
          label="Estimated production"
          value={formatNumber(result.totalProductionKg)}
          unit="kg"
          icon={Ruler}
          hint={`${areaHa} ha`}
        />
        <KpiCard
          label="Indicative value"
          value={formatNumber(grossValue)}
          unit="RWF"
          icon={Sprout}
          hint={`At ${formatNumber(price)} RWF/kg (simulated)`}
        />
      </KpiGrid>

      <div className="analysis-grid">
        <SectionCard
          title="Your planned inputs"
          description="Switch on what you plan to use"
          icon={Sprout}
        >
          <div className="grid gap-2">
            <ToggleField
              label="Improved / certified seed"
              checked={improvedSeed}
              onChange={setImprovedSeed}
            />
            <ToggleField
              label="Organic fertilizer"
              description="Manure or compost"
              checked={organicFertilizer}
              onChange={setOrganicFertilizer}
            />
            <ToggleField
              label="Mineral fertilizer"
              description="NPK or urea at a moderate rate"
              checked={inorganicFertilizer}
              onChange={setInorganicFertilizer}
            />
            <ToggleField
              label="Crop protection"
              description="Pesticide or integrated pest management"
              checked={pesticide}
              onChange={setPesticide}
            />
            <ToggleField
              label="Irrigation"
              description="Supplementary watering available"
              checked={irrigation}
              onChange={setIrrigation}
            />
            <ToggleField
              label="Erosion control"
              description="Terraces, trenches or contour bunds"
              checked={erosionControl}
              onChange={setErosionControl}
            />
            <ToggleField
              label="Agroforestry"
              description="Trees integrated with the plot"
              checked={agroforestry}
              onChange={setAgroforestry}
            />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <NumberField
              label="Measured / forecast rainfall (optional)"
              unit="mm"
              value={rainfall}
              onChange={setRainfall}
              min={0}
              max={3000}
              step={10}
              placeholder="Use simulated if blank"
            />
            <NumberField
              label="Measured / forecast temperature (optional)"
              unit="°C"
              value={temperature}
              onChange={setTemperature}
              min={0}
              max={45}
              step={0.5}
              placeholder="Use simulated if blank"
            />
          </div>
          <div className="mt-3">
            <InfoNote tone="info" title="What the engine is">
              {result.engine}. It multiplies a simulated district reference yield by
              clearly-labelled agronomic factors. It is not trained on field trials and cannot
              predict a specific farm.
            </InfoNote>
          </div>
        </SectionCard>

        <SectionCard
          title="What is moving your estimate"
          description="Each factor's effect versus the district reference"
          icon={Gauge}
        >
          <div>
            {result.factors.map((f) => {
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
              Green bars push the estimate above the district reference; red bars pull it below.
              Hovering the table is not needed — every factor is listed with the reason it applies.
            </p>
            <ul>
              <li>Longer bars mean a bigger assumed effect on final yield.</li>
              <li>These are rules of thumb for illustration, not measured coefficients.</li>
            </ul>
          </WhatThisMeans>
        </SectionCard>
      </div>

      <SectionCard
        title="Assumptions behind this estimate"
        description="Read these before acting on the number"
      >
        <ul className="panel-body list-disc space-y-1.5 pl-5 text-[11px] text-muted-foreground">
          {result.assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
        <div className="mt-3">
          <InfoNote tone="warning" title="Use this as guidance, not a guarantee">
            Combine this estimate with a soil test, an extension officer's visit and your own
            records. Yield depends on weather, pests and management that no estimate can fully
            capture.
          </InfoNote>
        </div>
        <p className="mt-3 text-[10px] text-muted-foreground">
          Indicative value uses the simulated reference price of {formatRwf(price)}/kg.
        </p>
      </SectionCard>
    </ModuleFrame>
  );
}
