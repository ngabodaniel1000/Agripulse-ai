// src/components/modules/YieldPrediction.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  Brain,
  Gauge,
  Loader2,
  RefreshCw,
  Ruler,
  Sparkles,
  Sprout,
  TrendingUp,
} from "lucide-react";
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
import { SOIL_TYPES } from "@/lib/analytics/yield";
import { formatNumber, formatPct, formatRwf, toNumber } from "@/lib/analytics/format";
import { CROP_NAMES, SEASON_LABELS } from "@/data/sim/crops";
import { DISTRICT_NAMES, getDistrict } from "@/data/sim/districts";
import { currentPrice } from "@/data/sim/market";
import type { Season } from "@/data/sim";

// ✅ AI client
import {
  fetchYieldPredictor,
  type YieldPrediction,
  type YieldExplanation,
} from "@/lib/api/agripulse";

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const SEASON_OPTIONS = (["A", "B", "C"] as Season[]).map((s) => ({
  value: s,
  label: SEASON_LABELS[s],
}));
const CROP_OPTIONS = CROP_NAMES.map((c) => ({ value: c, label: c }));
const DISTRICT_OPTIONS = DISTRICT_NAMES.map((d) => ({ value: d, label: d }));
const SOIL_OPTIONS = SOIL_TYPES.map((s) => ({ value: s, label: s }));

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function YieldPrediction() {
  // ────────── Filters ──────────
  const [crop, setCrop] = useState("Maize");
  const [district, setDistrict] = useState("Musanze");
  const [season, setSeason] = useState<Season>("A");
  const [farmSize, setFarmSize] = useState("1");
  const [soil, setSoil] = useState<string>(getDistrict("Musanze")?.dominantSoil ?? "Loam");
  const [elevation, setElevation] = useState("1600");
  const [rainfall, setRainfall] = useState("450");
  const [temperature, setTemperature] = useState("21");

  // ────────── Inputs (toggles) ──────────
  const [improvedSeed, setImprovedSeed] = useState(true);
  const [organicFertilizer, setOrganicFertilizer] = useState(true);
  const [inorganicFertilizer, setInorganicFertilizer] = useState(true);
  const [pesticide, setPesticide] = useState(false);
  const [irrigation, setIrrigation] = useState(false);
  const [erosionControl, setErosionControl] = useState(true);
  const [agroforestry, setAgroforestry] = useState(false);

  const areaHa = Math.max(0.05, toNumber(farmSize, 1));

  // ────────── AI state ──────────
  const [prediction, setPrediction] = useState<YieldPrediction | null>(null);
  const [explanation, setExplanation] = useState<YieldExplanation | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState<string>("");

  // ────────── Fetch AI ──────────
  const predictYield = useCallback(async () => {
    setAiLoading(true);
    setAiError(null);

    // Payload matches Flask /api/yield-predictor exactly
    const payload = {
      district,
      crop,
      season,
      soil_type: soil,
      farm_size_ha: areaHa,
      elevation_m: toNumber(elevation, 1600),
      rainfall_mm: toNumber(rainfall, 450),
      temperature_c: toNumber(temperature, 21),
      used_improved_seed: (improvedSeed ? 1 : 0) as 0 | 1,
      used_organic_fertilizer: (organicFertilizer ? 1 : 0) as 0 | 1,
      used_inorganic_fertilizer: (inorganicFertilizer ? 1 : 0) as 0 | 1,
      used_pesticide: (pesticide ? 1 : 0) as 0 | 1,
      used_irrigation: (irrigation ? 1 : 0) as 0 | 1,
      used_erosion_control: (erosionControl ? 1 : 0) as 0 | 1,
      used_agroforestry: (agroforestry ? 1 : 0) as 0 | 1,
    };

    setLastRequest(`${crop} · ${district} · Season ${season} · ${areaHa} ha · ${soil} soil`);

    const res = await fetchYieldPredictor(payload);

    if (res.success && res.prediction) {
      setPrediction(res.prediction);
      setExplanation(res.explanation ?? null);
    } else {
      setPrediction(null);
      setExplanation(null);
      setAiError(res.error ?? "AI engine did not return a result.");
    }
    setAiLoading(false);
  }, [
    district,
    crop,
    season,
    soil,
    areaHa,
    elevation,
    rainfall,
    temperature,
    improvedSeed,
    organicFertilizer,
    inorganicFertilizer,
    pesticide,
    irrigation,
    erosionControl,
    agroforestry,
  ]);

  // Auto-fetch on first mount only
  const [hasAutoLoaded, setHasAutoLoaded] = useState(false);
  useEffect(() => {
    if (!hasAutoLoaded) {
      predictYield();
      setHasAutoLoaded(true);
    }
  }, [hasAutoLoaded, predictYield]);

  // ────────── Derived values ──────────
  const price = currentPrice(crop, district);
  const predictedYield = prediction?.predicted_yield_kg_ha ?? 0;
  const lowerKgHa = prediction?.yield_lower_kg_ha ?? 0;
  const upperKgHa = prediction?.yield_upper_kg_ha ?? 0;
  const confidence = prediction?.confidence_level_pct ?? 0;
  const uncertaintyPct =
    predictedYield > 0 ? ((upperKgHa - lowerKgHa) / (2 * predictedYield)) * 100 : 0;
  const totalProductionKg = predictedYield * areaHa;
  const grossValue = totalProductionKg * price;

  // XAI factor data (sorted desc)
  const factorEntries = useMemo(() => {
    if (!explanation?.factor_importance_pct) return [];
    return Object.entries(explanation.factor_importance_pct)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [explanation]);

  const maxFactor = Math.max(1, ...factorEntries.map((f) => f.value));

  const readAloud = prediction
    ? `Estimated yield for ${crop} in ${district}, Season ${season}, is about ${formatNumber(predictedYield)} kilograms per hectare, with a likely range of ${formatNumber(lowerKgHa)} to ${formatNumber(upperKgHa)}. This comes from an AI model trained on NISR data, served by the AgriPulse Flask backend.`
    : `Enter your plot details and click Predict Yield to get an AI-powered estimate for ${crop} in ${district}.`;

  function resetToDefaults() {
    setCrop("Maize");
    setDistrict("Musanze");
    setSeason("A");
    setFarmSize("1");
    setSoil(getDistrict("Musanze")?.dominantSoil ?? "Loam");
    setElevation("1600");
    setRainfall("450");
    setTemperature("21");
    setImprovedSeed(true);
    setOrganicFertilizer(true);
    setInorganicFertilizer(true);
    setPesticide(false);
    setIrrigation(false);
    setErosionControl(true);
    setAgroforestry(false);
  }

  // ────────── Render ──────────
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
      {/* ─────────── 1. FILTERS (district, crop, season, soil, farm size) ─────────── */}
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
          // hint="Default is the dominant soil for the district."
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

      {/* ─────────── 2. INPUTS + PRACTICES + WEATHER (ALL BEFORE THE BUTTON) ─────────── */}
      <SectionCard
        title="Your planned inputs"
        description="Set every input, practice and weather value below — then click Predict Yield."
        icon={Sprout}
      >
        {/* 2a. Input toggles */}
        <div className="grid gap-2 sm:grid-cols-2">
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

        {/* 2b. Weather + elevation inputs */}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <NumberField
            label="Rainfall (measured / forecast)"
            unit="mm"
            value={rainfall}
            onChange={setRainfall}
            min={0}
            max={3000}
            step={10}
            placeholder="450"
          />
          <NumberField
            label="Temperature (measured / forecast)"
            unit="°C"
            value={temperature}
            onChange={setTemperature}
            min={0}
            max={45}
            step={0.5}
            placeholder="21"
          />
          <NumberField
            label="Elevation"
            unit="m"
            value={elevation}
            onChange={setElevation}
            min={1000}
            max={3000}
            step={50}
            placeholder="1600"
          />
        </div>

        {/* 2d. ✅ The PREDICT button — placed AFTER all inputs */}
        <div className="mt-5 flex flex-col gap-3 rounded-lg border-2 border-emerald-500/30 bg-emerald-50/40 p-4 dark:bg-emerald-950/10 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <p className="font-semibold text-emerald-800 dark:text-emerald-300">Ready to predict</p>
            <p className="text-xs text-muted-foreground">
              {crop} · {district} · Season {season} · {areaHa} ha · {soil}
            </p>
          </div>
          <Button
            onClick={predictYield}
            disabled={aiLoading}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            size="lg"
          >
            {aiLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Predicting…
              </>
            ) : (
              <>
                <Brain size={16} /> Predict Yield
              </>
            )}
          </Button>
        </div>
      </SectionCard>

      {/* ─────────── 3. STATUS BANNERS ─────────── */}
      {aiLoading && (
        <InfoNote tone="info" title="Contacting AgriPulse AI…">
          <div className="space-y-1">
            <p className="flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Fetching prediction + XAI explanation from the Flask engine.
            </p>
            <p className="text-xs text-muted-foreground">
              First request after inactivity may take up to ~60s to wake the server.
            </p>
          </div>
        </InfoNote>
      )}

      {!aiLoading && aiError && (
        <InfoNote tone="warning" title="AI engine unreachable">
          <div className="space-y-2">
            <p className="flex items-start gap-2">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{aiError}</span>
            </p>
            <Button variant="outline" size="sm" onClick={predictYield} className="gap-1">
              <RefreshCw size={12} /> Retry
            </Button>
          </div>
        </InfoNote>
      )}

      {/* ─────────── 4. PREDICTION HERO CARD ─────────── */}
      {!aiLoading && prediction && (
        <SectionCard
          title="AI Yield Prediction"
          description={`${crop} · ${district} · Season ${season} · ${areaHa} ha · ${soil} soil`}
          icon={Sparkles}
        >
          <div className="rounded-xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-50 to-emerald-100/30 p-6 dark:from-emerald-950/20 dark:to-emerald-900/10">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                  Predicted yield
                </p>
                <p className="mt-1 text-4xl font-bold text-emerald-800 dark:text-emerald-300">
                  {formatNumber(predictedYield)}{" "}
                  <span className="text-lg font-normal text-muted-foreground">kg/ha</span>
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Confidence range:{" "}
                  <span className="font-medium text-foreground">
                    {formatNumber(lowerKgHa)} – {formatNumber(upperKgHa)} kg/ha
                  </span>
                </p>
              </div>
              <div className="flex flex-col items-start gap-1 md:items-end">
                <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
                  {formatPct(confidence, 1)} confidence
                </span>
                <span className="text-xs text-muted-foreground">
                  ±{formatPct(uncertaintyPct, 1)} uncertainty
                </span>
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ─────────── 5. KPI GRID ─────────── */}
      <KpiGrid>
        <KpiCard
          label="Estimated yield"
          value={prediction ? formatNumber(predictedYield) : "—"}
          unit="kg/ha"
          icon={Gauge}
          badge={prediction ? "AI prediction" : "Awaiting AI"}
          badgeTone={prediction ? "success" : "warning"}
          hint={prediction ? `${district} · Season ${season}` : "Click Predict Yield"}
        />
        <KpiCard
          label="Likely range"
          value={prediction ? `${formatNumber(lowerKgHa)}–${formatNumber(upperKgHa)}` : "—"}
          unit="kg/ha"
          icon={TrendingUp}
          hint={prediction ? `±${formatPct(uncertaintyPct, 0)}` : "Awaiting AI"}
        />
        <KpiCard
          label="Estimated production"
          value={prediction ? formatNumber(totalProductionKg) : "—"}
          unit="kg"
          icon={Ruler}
          hint={`${areaHa} ha`}
        />
        <KpiCard
          label="Indicative value"
          value={prediction ? formatNumber(grossValue) : "—"}
          unit="RWF"
          icon={Sprout}
          hint={`At ${formatNumber(price)} RWF/kg`}
        />
      </KpiGrid>

      {/* ─────────── 6. XAI CHART ─────────── */}
      <SectionCard
        title="Why this prediction? (Explainable AI)"
        description="Top factors the model weighted"
        icon={BarChart3}
      >
        {!prediction || factorEntries.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Click <strong>Predict Yield</strong> to see the AI factor breakdown.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {factorEntries.map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <span className="w-40 shrink-0 text-xs font-medium text-foreground">{f.label}</span>
                <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-muted">
                  <div
                    className="h-full rounded-md bg-gradient-to-r from-emerald-500 to-emerald-600"
                    style={{
                      width: `${Math.max(2, (f.value / maxFactor) * 100)}%`,
                    }}
                  />
                </div>
                <span className="w-14 shrink-0 text-right text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  {formatPct(f.value, 1)}
                </span>
              </div>
            ))}
          </div>
        )}
        <WhatThisMeans>
          <p>
            These are the model&apos;s <strong>global feature importance</strong> weights — how much
            each factor contributes to yield predictions across all training data. Higher bars =
            stronger influence.
          </p>
          <ul>
            <li>Weather, inputs, and location dominate the model.</li>
            <li>These are not per-row SHAP values; they show overall model priorities.</li>
            <li>Use them to guide which levers matter most.</li>
          </ul>
        </WhatThisMeans>
      </SectionCard>

      {/* ─────────── 7. ASSUMPTIONS ─────────── */}
      <SectionCard
        title="Assumptions behind this estimate"
        description="Read these before acting on the number"
      >
        <ul className="panel-body list-disc space-y-1.5 pl-5 text-[11px] text-muted-foreground">
          <li>
            Model trained on NISR AHS 2024 &amp; SAS 2026 distributions; individual farm results
            will vary.
          </li>
          <li>
            Rainfall and temperature defaults use typical seasonal values for Rwanda; override with
            measured values when available.
          </li>
          <li>Confidence interval reflects input consistency and model uncertainty.</li>
          <li>Elevation is measured in metres above sea level for the plot.</li>
        </ul>
        <div className="mt-3">
          <InfoNote tone="warning" title="Use this as guidance, not a guarantee">
            Combine this estimate with a soil test, an extension officer&apos;s visit and your own
            records. Yield depends on weather, pests and management that no model can fully capture.
          </InfoNote>
        </div>
        <p className="mt-3 text-[10px] text-muted-foreground">
          Indicative value uses the reference price of {formatRwf(price)}/kg.
        </p>
      </SectionCard>
    </ModuleFrame>
  );
}
