// src/components/modules/CropAnalysis.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Coins,
  Gauge,
  Loader2,
  RefreshCw,
  Sparkles,
  Sprout,
  Star,
  TrendingUp,
  Wheat,
  X,
} from "lucide-react";
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
import { districtYieldRanking, nationalYield } from "@/lib/analytics/analytics";
import { formatKg, formatNumber, formatPct, formatRwf, toNumber } from "@/lib/analytics/format";
import { CROP_NAMES, SEASON_LABELS } from "@/data/sim/crops";
import { DISTRICT_NAMES, getDistrict, provinceOf, PROVINCE_LABELS } from "@/data/sim/districts";
import { INPUT_ADOPTION, INPUT_COSTS, PRACTICES } from "@/data/sim/inputs";
import { currentPrice } from "@/data/sim/market";
import type { Season } from "@/data/sim";

// ✅ AI client
import {
  fetchInputOptimizer,
  type BudgetLevel,
  type InputRecommendation,
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
const BUDGET_OPTIONS: { value: BudgetLevel; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

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

interface PackageResult {
  predictedYieldKgHa: number;
  lowerKgHa: number;
  upperKgHa: number;
  totalProductionKg: number;
  uncertaintyPct: number;
}

interface PackageRow {
  pkg: Package;
  result: PackageResult;
  inputCostRwf: number;
  netRwf: number;
  fromAI: boolean;
}

function pickBestMatch(
  pkg: Package,
  recommendations: InputRecommendation[],
): InputRecommendation | null {
  if (!recommendations.length) return null;

  const wanted = {
    improved_seed: pkg.flags.improvedSeed ? 1 : 0,
    organic: pkg.flags.organicFertilizer ? 1 : 0,
    inorganic: pkg.flags.inorganicFertilizer ? 1 : 0,
    pesticide: pkg.flags.pesticide ? 1 : 0,
  } as const;

  let best: InputRecommendation | null = null;
  let bestScore = -Infinity;

  for (const rec of recommendations) {
    const s = rec.strategy;
    const score =
      (s.improved_seed === wanted.improved_seed ? 1 : 0) +
      (s.organic === wanted.organic ? 1 : 0) +
      (s.inorganic === wanted.inorganic ? 1 : 0) +
      (s.pesticide === wanted.pesticide ? 1 : 0);
    if (score > bestScore) {
      bestScore = score;
      best = rec;
    }
  }

  return best;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function CropAnalysis() {
  // Filters
  const [crop, setCrop] = useState("Maize");
  const [district, setDistrict] = useState("Musanze");
  const [season, setSeason] = useState<Season>("A");
  const [farmSize, setFarmSize] = useState("1");
  const [budget, setBudget] = useState<BudgetLevel>("medium");
  const areaHa = Math.max(0.05, toNumber(farmSize, 1));

  const province = provinceOf(district);
  const adoption = INPUT_ADOPTION[province];
  const practices = PRACTICES[province];

  // AI state
  const [aiRecommendations, setAiRecommendations] = useState<InputRecommendation[] | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState<string>("");

  // Input packages (for comparison table)
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

  // ────────── AI fetch ──────────
  const loadAiRecommendations = useCallback(async () => {
    setAiLoading(true);
    setAiError(null);

    const payload = {
      district,
      crop,
      season,
      farm_size_ha: areaHa,
      budget_level: budget,
    };
    setLastRequest(`${crop} · ${district} · Season ${season} · ${areaHa} ha · ${budget} budget`);

    const res = await fetchInputOptimizer(payload);

    if (res.success && res.recommendations && res.recommendations.length) {
      setAiRecommendations(res.recommendations);
    } else {
      setAiRecommendations(null);
      setAiError(res.error ?? "AI engine did not return a result.");
    }
    setAiLoading(false);
  }, [district, crop, season, areaHa, budget]);

  // Auto-load on first mount only — user clicks "Get Recommendations" after that
  const [hasAutoLoaded, setHasAutoLoaded] = useState(false);
  useEffect(() => {
    if (!hasAutoLoaded) {
      loadAiRecommendations();
      setHasAutoLoaded(true);
    }
  }, [hasAutoLoaded, loadAiRecommendations]);

  // ────────── Merge AI + pricing ──────────
  const results: PackageRow[] = useMemo(() => {
    return packages.map((pkg) => {
      const match = aiRecommendations ? pickBestMatch(pkg, aiRecommendations) : null;

      const fromAI = Boolean(match);
      const predictedYieldKgHa = match?.expected_yield_kg_ha ?? 0;
      const lowerKgHa = match?.yield_lower_kg_ha ?? 0;
      const upperKgHa = match?.yield_upper_kg_ha ?? 0;
      const totalProductionKg = predictedYieldKgHa * areaHa;
      const uncertaintyPct =
        predictedYieldKgHa > 0 ? ((upperKgHa - lowerKgHa) / (2 * predictedYieldKgHa)) * 100 : 0;

      const inputCostRwf = INPUT_COSTS.reduce(
        (sum, cost) => (pkg.flags[COST_FLAG[cost.key]] ? sum + cost.costPerHaRwf * areaHa : sum),
        0,
      );

      const price = currentPrice(crop, district);
      const netRwf = totalProductionKg * price - inputCostRwf;

      return {
        pkg,
        result: {
          predictedYieldKgHa,
          lowerKgHa,
          upperKgHa,
          totalProductionKg,
          uncertaintyPct,
        },
        inputCostRwf,
        netRwf,
        fromAI,
      };
    });
  }, [packages, aiRecommendations, areaHa, crop, district]);

  const improved = results[results.length - 1];
  const baseline = results[0];
  const yieldLift =
    baseline.result.predictedYieldKgHa && improved.result.predictedYieldKgHa
      ? ((improved.result.predictedYieldKgHa - baseline.result.predictedYieldKgHa) /
          baseline.result.predictedYieldKgHa) *
        100
      : 0;

  // Reference data
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

  const readAloud = `Crop and input analysis for ${crop} in ${district} district, Season ${season}. The improved input package is estimated at ${formatNumber(
    improved.result.predictedYieldKgHa,
  )} kilograms per hectare, compared with ${formatNumber(
    baseline.result.predictedYieldKgHa,
  )} for a low-input package. This is a simulation-backed AI estimate, not a verified prediction.`;

  // ────────── Render ──────────
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
      {/* ─────────── Filters ─────────── */}
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
        <SelectField
          label="Budget level"
          value={budget}
          onChange={(v) => setBudget(v as BudgetLevel)}
          options={BUDGET_OPTIONS}
        />
        <div className="filter-bar-actions">
          <Button
            variant="outline"
            onClick={() => {
              setCrop("Maize");
              setDistrict("Musanze");
              setSeason("A");
              setFarmSize("1");
              setBudget("medium");
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* ─────────── "Get AI Recommendations" CTA ─────────── */}
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
        <div className="text-sm">
          <p className="font-medium text-foreground">AI Engine 1 — Input Optimizer</p>
          <p className="text-xs text-muted-foreground">
            {lastRequest || "Ready to query the Flask backend"}
          </p>
        </div>
        <Button onClick={loadAiRecommendations} disabled={aiLoading} className="gap-2">
          {aiLoading ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Querying AI…
            </>
          ) : (
            <>
              <Sparkles size={14} /> Get AI Recommendations
            </>
          )}
        </Button>
      </div>

      {/* ─────────── Status banners ─────────── */}
      {aiLoading && (
        <InfoNote tone="info" title="Contacting AgriPulse AI…">
          <div className="space-y-1">
            <p className="flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Fetching recommendations from the Flask engine.
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
            <Button variant="outline" size="sm" onClick={loadAiRecommendations} className="gap-1">
              <RefreshCw size={12} /> Retry
            </Button>
          </div>
        </InfoNote>
      )}

      {/* ─────────── Recommended Input Combinations (NEW) ─────────── */}
      {!aiLoading && aiRecommendations && aiRecommendations.length > 0 && (
        <SectionCard
          title="Recommended input combinations from AI"
          description={`${crop} · ${district} · Season ${season} · ${areaHa} ha · ${budget} budget`}
          icon={Sparkles}
        >
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {aiRecommendations.map((rec, i) => {
              const isBest = i === 0;
              const s = rec.strategy;
              return (
                <div
                  key={i}
                  className={`relative rounded-lg border p-4 transition-all ${
                    isBest
                      ? "border-emerald-500 bg-emerald-50/50 shadow-md dark:bg-emerald-950/20"
                      : "border-border bg-card hover:border-emerald-300"
                  }`}
                >
                  {isBest && (
                    <div className="absolute -top-2 right-3 flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                      <Star size={10} fill="currentColor" /> Best
                    </div>
                  )}
                  <div className="mb-3 flex items-baseline justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {isBest ? "Recommended" : `Option ${i + 1}`}
                    </span>
                  </div>

                  <div className="mb-3 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                      {formatNumber(rec.expected_yield_kg_ha)}
                    </span>
                    <span className="text-xs text-muted-foreground">kg/ha</span>
                  </div>

                  <p className="mb-3 text-xs text-muted-foreground">
                    Range: {formatNumber(rec.yield_lower_kg_ha)} –{" "}
                    {formatNumber(rec.yield_upper_kg_ha)} kg/ha
                  </p>

                  <div className="space-y-1.5 border-t border-border/50 pt-3">
                    <FlagRow active={!!s.improved_seed} label="Improved Seeds" />
                    <FlagRow active={!!s.organic} label="Organic Fertilizer" />
                    <FlagRow active={!!s.inorganic} label="Inorganic Fertilizer" />
                    <FlagRow active={!!s.pesticide} label="Pesticide" />
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* ─────────── KPI grid ─────────── */}
      <KpiGrid>
        <KpiCard
          label="Est. yield — improved package"
          value={formatNumber(improved.result.predictedYieldKgHa)}
          unit="kg/ha"
          icon={Gauge}
          badge={improved.fromAI ? "AI prediction" : "Awaiting AI"}
          badgeTone={improved.fromAI ? "success" : "warning"}
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
          hint="Market reference"
        />
      </KpiGrid>

      {/* ─────────── Package comparison + adoption chart ─────────── */}
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
                      {!r.fromAI && (
                        <span className="ml-1 text-[10px] uppercase text-amber-600">(offline)</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {r.fromAI ? formatNumber(r.result.predictedYieldKgHa) : "—"}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {r.fromAI ? formatKg(r.result.totalProductionKg) : "—"}
                    </td>
                    <td style={{ textAlign: "right" }}>{formatRwf(r.inputCostRwf)}</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>
                      {r.fromAI ? formatRwf(r.netRwf) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <InfoNote tone="success" title="Main takeaway">
            {improved.fromAI && baseline.fromAI ? (
              <>
                The improved package is estimated at <strong>{formatPct(yieldLift, 0)}</strong> more
                yield per hectare than a low-input package in this AI estimate, but it adds about{" "}
                <strong>{formatRwf(improved.inputCostRwf)}</strong> in input cost.
              </>
            ) : (
              <>Click "Get AI Recommendations" to populate this comparison.</>
            )}
          </InfoNote>

          <WhatThisMeans>
            <p>
              Yield estimates come from an <strong>AI model</strong> trained on NISR AHS 2024 and
              SAS 2026 distributions and served by the AgriPulse Flask backend.
            </p>
            <ul>
              <li>
                Predictions are GradientBoostingRegressor estimates with confidence intervals.
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
          description={`${PROVINCE_LABELS[province]} · reference`}
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

      {/* ─────────── District ranking + input costs ─────────── */}
      <div className="analysis-grid">
        <SectionCard
          title="Yield pattern across districts"
          description={`${crop} · Season ${season} · reference kg/ha`}
        >
          <DataTable
            columns={rankColumns}
            rows={ranking.slice(0, 8)}
            caption={`National average ${formatNumber(national)} kg/ha${
              selectedRank ? ` · ${district} is ranked #${selectedRank} of ${ranking.length}` : ""
            }`}
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

// ─────────────────────────────────────────────────────────────
// Small sub-component: flag row with check/cross
// ─────────────────────────────────────────────────────────────

function FlagRow({ active, label }: { active: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className={active ? "text-foreground" : "text-muted-foreground"}>{label}</span>
      {active ? (
        <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
          <Check size={12} strokeWidth={3} /> Yes
        </span>
      ) : (
        <span className="flex items-center gap-1 text-muted-foreground">
          <X size={12} /> No
        </span>
      )}
    </div>
  );
}
