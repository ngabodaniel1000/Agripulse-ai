"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardList, Download, FileSpreadsheet, FileText, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ModuleFrame } from "@/components/agri/ModuleFrame";
import {
  InfoNote,
  SectionCard,
  SelectField,
  StatusBadge,
  WhatThisMeans,
} from "@/components/agri/ui";
import { exportCSV, exportPDF } from "@/lib/exports";
import {
  cropDistribution,
  districtYieldRanking,
  lossSummary,
  plannerKpis,
} from "@/lib/analytics/analytics";
import { compareInputCombinations } from "@/lib/analytics/inputs";
import { predictYield } from "@/lib/analytics/yield";
import { districtPriceComparison, nationalAveragePrice } from "@/data/sim/market";
import { DEMO_HARVESTS } from "@/data/sim/farm";
import { formatNumber, formatPct, formatRwf } from "@/lib/analytics/format";
import { CROP_NAMES, SEASON_LABELS } from "@/data/sim/crops";
import { DISTRICT_NAMES } from "@/data/sim/districts";
import { PROVINCE_LABELS } from "@/data/sim/districts";
import { SIMULATION_DISCLAIMER } from "@/data/sim/provenance";
import type { Season } from "@/data/sim";

type ReportType = "planner" | "yield" | "inputs" | "market" | "postharvest" | "farm";

const REPORT_OPTIONS: { value: ReportType; label: string }[] = [
  { value: "planner", label: "National planner summary" },
  { value: "yield", label: "Yield estimate note" },
  { value: "inputs", label: "Input combination comparison" },
  { value: "market", label: "Market price table" },
  { value: "postharvest", label: "Post-harvest loss summary" },
  { value: "farm", label: "Demonstration farm performance" },
];
const CROP_OPTIONS = CROP_NAMES.map((c) => ({ value: c, label: c }));
const DISTRICT_OPTIONS = DISTRICT_NAMES.map((d) => ({ value: d, label: d }));
const SEASON_OPTIONS = (["A", "B", "C"] as Season[]).map((s) => ({
  value: s,
  label: SEASON_LABELS[s],
}));

export function AnalysisReports() {
  const [type, setType] = useState<ReportType>("planner");
  const [crop, setCrop] = useState("Maize");
  const [district, setDistrict] = useState("Musanze");
  const [season, setSeason] = useState<Season>("A");

  const report = useMemo(
    () => buildReport(type, crop, district, season),
    [type, crop, district, season],
  );

  function handlePDF() {
    exportPDF(report.title, report.text);
    toast.success("PDF generated");
  }

  function handleCSV() {
    if (!report.rows.length) {
      toast.error("This report has no tabular rows");
      return;
    }
    exportCSV(report.rows, report.fileName);
    toast.success("CSV exported");
  }

  const readAloud = `Analytical reports. The current selection is the ${report.title}. It is built from the same simulated data used across the modules, and the disclaimer is included in the document. You can download it as a PDF or export the underlying table as a CSV.`;

  return (
    <ModuleFrame
      eyebrow="ANALYTICAL REPORTS"
      title="Turn the dashboard into a document"
      description="Choose a report, set the crop and district, preview it, then download a PDF or CSV for a meeting, cooperative or extension officer."
      tone="brand"
      readAloudText={readAloud}
    >
      <div className="filter-bar">
        <SelectField
          label="Report"
          value={type}
          onChange={(v) => setType(v as ReportType)}
          options={REPORT_OPTIONS}
        />
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
        <div className="filter-bar-actions">
          <Button variant="outline" onClick={handleCSV}>
            <FileSpreadsheet size={14} /> CSV
          </Button>
          <Button onClick={handlePDF}>
            <Download size={14} /> PDF
          </Button>
        </div>
      </div>

      <div className="analysis-grid">
        <SectionCard
          title="Document preview"
          description="This is exactly what will be exported"
          icon={FileText}
        >
          <div className="rounded-md border border-border bg-card p-4">
            <div className="mb-1 text-[10px] font-semibold tracking-wide text-primary">
              NISR | AGRIPULSE
            </div>
            <h3 className="mb-2 text-base font-semibold">{report.title}</h3>
            <pre className="whitespace-pre-wrap font-sans text-[11px] leading-relaxed text-muted-foreground">
              {report.text}
            </pre>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge tone="warning" label="Simulated demonstration data" />
            {report.rows.length ? (
              <StatusBadge tone="neutral" label={`${report.rows.length} CSV rows`} />
            ) : null}
          </div>
          <WhatThisMeans>
            <p>
              The PDF and CSV both carry the simulated-data disclaimer so a reader cannot mistake it
              for official statistics.
            </p>
          </WhatThisMeans>
        </SectionCard>

        <SectionCard title="Report contents" description="What each report includes" icon={Layers}>
          <ul className="space-y-2 text-[11px] text-muted-foreground">
            <li>
              <strong>Planner summary</strong> — national area, production and alert counts.
            </li>
            <li>
              <strong>Yield note</strong> — an estimate with its reference yield and input
              assumptions.
            </li>
            <li>
              <strong>Input comparison</strong> — the best combinations by net benefit and yield.
            </li>
            <li>
              <strong>Market table</strong> — reference prices for all 30 districts.
            </li>
            <li>
              <strong>Post-harvest</strong> — loss and cost by storage method.
            </li>
            <li>
              <strong>Farm performance</strong> — the demonstration household's harvests.
            </li>
          </ul>
          <InfoNote tone="info" title="Where the numbers come from">
            All six reports read from the same centralized simulated datasets used by the
            interactive modules, so figures never disagree between a screen and a document.
          </InfoNote>
        </SectionCard>
      </div>

      <SectionCard
        title="Related source documents"
        description="The report-based dashboard content"
        icon={ClipboardList}
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {["AHS 2024", "FBS 2025 edition", "IBES 2024", "RPHC 2022", "Trade 2025"].map((s) => (
            <Link
              key={s}
              href="/reports"
              className="flex items-center justify-between rounded-md border border-border bg-card px-3.5 py-2.5 text-[11px] hover:bg-secondary"
            >
              <span>{s}</span>
              <span className="text-primary">Open source report</span>
            </Link>
          ))}
        </div>
      </SectionCard>
    </ModuleFrame>
  );
}

interface BuiltReport {
  title: string;
  text: string;
  rows: Record<string, string | number>[];
  fileName: string;
}

function buildReport(
  type: ReportType,
  crop: string,
  district: string,
  season: Season,
): BuiltReport {
  const footer = `\n\nData note: ${SIMULATION_DISCLAIMER}`;

  if (type === "yield") {
    const result = predictYield({
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
    });
    const text = `Crop yield estimate\nCrop: ${crop}\nDistrict: ${district}\nSeason: ${SEASON_LABELS[season]}\n\nReference yield: ${formatNumber(result.baseYieldKgHa)} kg/ha\nEstimated yield: ${formatNumber(result.predictedYieldKgHa)} kg/ha (range ${formatNumber(result.lowerKgHa)}-${formatNumber(result.upperKgHa)})\nConfidence band: ${result.confidencePct}%\n\nMethod: ${result.engine}.\n\nAssumptions:\n- ${result.assumptions.join("\n- ")}${footer}`;
    return {
      title: `Yield estimate — ${crop}, ${district}`,
      text,
      rows: result.factors.map((f) => ({
        factor: f.label,
        multiplier: f.multiplier,
        effect_percent: f.impactPct,
        note: f.note,
      })),
      fileName: `yield-estimate-${crop}`,
    };
  }

  if (type === "inputs") {
    const analysis = compareInputCombinations(crop, district, season, 1);
    const text = `Input combination comparison\nCrop: ${crop}\nDistrict: ${district}\nSeason: ${SEASON_LABELS[season]}\nReference price: ${formatNumber(analysis.priceRwfKg)} RWF/kg\n\nBaseline yield (no inputs): ${formatNumber(analysis.baselineYieldKgHa)} kg/ha\nBest net benefit: ${analysis.bestByNet?.combination.label ?? "—"} (${formatRwf(analysis.bestByNet?.netBenefitRwf ?? 0)})\nHighest yield: ${analysis.bestByYield?.combination.label ?? "—"} (${formatNumber(analysis.bestByYield?.yieldKgHa ?? 0)} kg/ha)\nBest return on cost: ${analysis.bestByRoi?.combination.label ?? "—"} (${Math.round(analysis.bestByRoi?.roiPct ?? 0)}%)\n\nCosts are demonstration estimates.${footer}`;
    return {
      title: `Input combinations — ${crop}, ${district}`,
      text,
      rows: analysis.results.map((r) => ({
        combination: r.combination.label,
        yield_kg_ha: r.yieldKgHa,
        yield_lift_percent: r.yieldLiftPct,
        input_cost_rwf: r.inputCostRwf,
        net_benefit_rwf: r.netBenefitRwf,
      })),
      fileName: `input-combinations-${crop}`,
    };
  }

  if (type === "market") {
    const rows = districtPriceComparison(crop);
    const national = nationalAveragePrice(crop);
    const text = `Market price reference\nCrop: ${crop}\nReporting period: demonstration year\nNational average: ${formatNumber(national)} RWF/kg\n\nHighest: ${rows[0]?.district} (${formatNumber(rows[0]?.priceRwfKg ?? 0)} RWF/kg)\nLowest: ${rows[rows.length - 1]?.district} (${formatNumber(rows[rows.length - 1]?.priceRwfKg ?? 0)} RWF/kg)\n\nThese are simulated e-Soko style reference prices, not live quotes.${footer}`;
    return {
      title: `Market prices — ${crop}`,
      text,
      rows: rows.map((r) => ({
        district: r.district,
        province: PROVINCE_LABELS[r.province],
        price_rwf_kg: r.priceRwfKg,
        change_percent: r.changePct,
      })),
      fileName: `market-prices-${crop}`,
    };
  }

  if (type === "postharvest") {
    const losses = lossSummary();
    const text = `Post-harvest loss summary\n\nAcross the storage methods in this simulation, the lowest eight-week loss is ${formatPct(Math.min(...losses.map((l) => l.loss8WeeksPct)), 1)} and the highest is ${formatPct(Math.max(...losses.map((l) => l.loss8WeeksPct)), 1)}.\n\nWarmer, more humid storage increases losses. Drying produce fully and keeping it cool and dry is the most effective step.${footer}`;
    return {
      title: "Post-harvest loss summary",
      text,
      rows: losses.map((l) => ({
        method: l.method,
        weekly_loss_percent: l.weeklyLossPct,
        eight_week_loss_percent: l.loss8WeeksPct,
        cost_per_kg_week: l.costPerKgWeek,
      })),
      fileName: "post-harvest-losses",
    };
  }

  if (type === "farm") {
    const totalHarvest = DEMO_HARVESTS.reduce((s, h) => s + h.harvestKg, 0);
    const totalValue = DEMO_HARVESTS.reduce((s, h) => s + h.marketValueRwf, 0);
    const totalInput = DEMO_HARVESTS.reduce((s, h) => s + h.inputCostRwf, 0);
    const text = `Demonstration farm performance\nHousehold: illustrative smallholder\nSeasons recorded: ${DEMO_HARVESTS.length}\n\nTotal harvest: ${formatNumber(totalHarvest)} kg\nMarket value: ${formatRwf(totalValue)}\nInput cost: ${formatRwf(totalInput)}\nGross margin: ${formatRwf(totalValue - totalInput)}\n\nThis is a simulated household, not a real person.${footer}`;
    return {
      title: "Demonstration farm performance",
      text,
      rows: DEMO_HARVESTS.map((h) => ({
        season: h.season,
        year: h.year,
        crop: h.crop,
        area_ha: h.areaHa,
        harvest_kg: h.harvestKg,
        yield_kg_ha: h.yieldKgHa,
        input_cost_rwf: h.inputCostRwf,
        market_value_rwf: h.marketValueRwf,
      })),
      fileName: "demo-farm-performance",
    };
  }

  const kpis = plannerKpis(season);
  const distribution = cropDistribution(season);
  const ranking = districtYieldRanking(crop, season);
  const text = `National planner summary\nSeason: ${SEASON_LABELS[season]}\n\nDistricts covered: ${kpis.districts}\nCrops catalogued: ${kpis.crops}\nPlanted area: ${formatNumber(kpis.simulatedAreaHa)} ha\nProduction: ${formatNumber(kpis.simulatedProductionKg)} kg\nAverage yield: ${formatNumber(kpis.averageYieldKgHa)} kg/ha\nOpen alerts: ${kpis.openAlerts} (${kpis.highAlerts} high)\n\nLeading ${crop} district: ${ranking[0]?.district ?? "—"} (${formatNumber(ranking[0]?.yieldKgHa ?? 0)} kg/ha).${footer}`;
  return {
    title: `National planner summary — Season ${season}`,
    text,
    rows: distribution.map((d) => ({
      crop: d.crop,
      area_ha: d.areaHa,
      share_percent: d.sharePct,
      production_kg: d.productionKg,
    })),
    fileName: `planner-summary-season-${season}`,
  };
}
