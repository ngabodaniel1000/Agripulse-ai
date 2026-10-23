// src/components/modules/SellOrStore.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Brain,
  Coins,
  Loader2,
  PackageOpen,
  RefreshCw,
  Scale,
  Sparkles,
  Store,
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
  StatusBadge,
  WhatThisMeans,
} from "@/components/agri/ui";
import { RECOMMENDATION_META, STORAGE_METHOD_NAMES } from "@/lib/analytics/storage";
import type { StoreRecommendation } from "@/lib/analytics/types";
import { formatNumber, formatPct, formatRwf, toNumber } from "@/lib/analytics/format";
import { CROP_NAMES } from "@/data/sim/crops";
import { DISTRICT_NAMES } from "@/data/sim/districts";
import { currentPrice } from "@/data/sim/market";

import {
  fetchMarketIntelligence,
  estimateLossRate,
  storageCostPerKgWeek,
  type MarketPrediction,
} from "@/lib/api/agripulse";

const CROP_OPTIONS = CROP_NAMES.map((c) => ({ value: c, label: c }));
const DISTRICT_OPTIONS = DISTRICT_NAMES.map((d) => ({ value: d, label: d }));
const METHOD_OPTIONS = STORAGE_METHOD_NAMES.map((m) => ({ value: m, label: m }));
const SEASON_OPTIONS = [
  { value: "A", label: "Season A" },
  { value: "B", label: "Season B" },
  { value: "C", label: "Season C" },
];

// ─────────────────────────────────────────────────────────────
// Map Flask's recommendation → your StoreRecommendation keys
// ─────────────────────────────────────────────────────────────

function mapFlaskRecommendation(
  recommendation: string | null | undefined,
  riskLevel?: "Low" | "Medium" | "High",
): StoreRecommendation {
  if (!recommendation) return "NOT_ENOUGH_INFORMATION";
  const normalized = recommendation.trim().toUpperCase();
  if (normalized === "STORE") {
    return riskLevel === "High" ? "WAIT_AND_MONITOR" : "STORE_IF_SAFE";
  }
  if (normalized === "SELL NOW" || normalized === "SELL_NOW") {
    return "SELL_NOW";
  }
  return "NOT_ENOUGH_INFORMATION";
}

const RISK_META: Record<
  "Low" | "Medium" | "High",
  { tone: "success" | "warning" | "destructive"; label: string }
> = {
  Low: { tone: "success", label: "Low risk" },
  Medium: { tone: "warning", label: "Medium risk" },
  High: { tone: "destructive", label: "High risk" },
};

export function SellOrStore() {
  // ────────── Filters ──────────
  const [crop, setCrop] = useState("Irish potato");
  const [district, setDistrict] = useState("Musanze");
  const [season, setSeason] = useState<"A" | "B" | "C">("A");
  const [quantity, setQuantity] = useState("1000");
  const [price, setPrice] = useState(String(currentPrice("Irish potato", "Musanze")));
  const [method, setMethod] = useState("Hermetic bag");
  const [weeks, setWeeks] = useState("8");
  const [humidity, setHumidity] = useState("72");
  const [temperature, setTemperature] = useState("22");
  const [trend, setTrend] = useState("8");

  // ────────── AI state ──────────
  const [prediction, setPrediction] = useState<MarketPrediction | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // ────────── Derived loss estimate (shown before AI responds) ──────────
  const estimatedLossRate = useMemo(
    () =>
      estimateLossRate(method, toNumber(weeks), toNumber(humidity), toNumber(temperature), crop),
    [method, weeks, humidity, temperature, crop],
  );

  // ────────── Fetch AI ──────────
  const runAnalysis = useCallback(async () => {
    setAiLoading(true);
    setAiError(null);

    const qty = toNumber(quantity);
    const priceNum = toNumber(price);
    const weeksNum = toNumber(weeks);
    const humidityNum = toNumber(humidity);
    const tempNum = toNumber(temperature);
    const trendNum = toNumber(trend);

    const payload = {
      district,
      crop,
      season,
      harvest_quantity_kg: qty,
      current_price_rwf_kg: priceNum,
      price_trend_pct: trendNum,
      storage_method: method,
      storage_duration_weeks: weeksNum,
      storage_cost_per_kg_week: storageCostPerKgWeek(method),
      humidity_pct: humidityNum,
      temperature_c: tempNum,
      total_loss_rate_pct: estimateLossRate(method, weeksNum, humidityNum, tempNum, crop),
    };

    const res = await fetchMarketIntelligence(payload);

    if (res.success && res.result) {
      setPrediction(res.result);
    } else {
      setPrediction(null);
      setAiError(res.error ?? "AI engine did not return a result.");
    }
    setAiLoading(false);
  }, [district, crop, season, quantity, price, trend, method, weeks, humidity, temperature]);

  // Auto-run on first mount only
  const [hasAutoLoaded, setHasAutoLoaded] = useState(false);
  useEffect(() => {
    if (!hasAutoLoaded) {
      runAnalysis();
      setHasAutoLoaded(true);
    }
  }, [hasAutoLoaded, runAnalysis]);

  // ────────── Derived display values (safe — no undefined lookups) ──────────
  const storeRecommendationKey = mapFlaskRecommendation(
    prediction?.recommendation,
    prediction?.post_harvest_loss_risk,
  );

  const meta =
    RECOMMENDATION_META[storeRecommendationKey] ?? RECOMMENDATION_META["NOT_ENOUGH_INFORMATION"];

  const riskMeta = prediction ? RISK_META[prediction.post_harvest_loss_risk] : null;

  const better = storeRecommendationKey === "STORE_IF_SAFE" ? "store" : "sell";

  const qtyNum = toNumber(quantity);
  const weeksNum = toNumber(weeks);
  const remainingKg = qtyNum * (1 - (prediction?.loss_rate_pct ?? 0) / 100);
  const lostKg = qtyNum - remainingKg;

  const readAloud = prediction
    ? `Sell or store decision. Selling now would earn about ${formatNumber(
        prediction.revenue_if_sell_now_rwf,
      )} Rwandan francs. Storing for ${weeksNum} weeks is estimated to earn about ${formatNumber(
        prediction.revenue_if_store_rwf,
      )} after ${formatPct(
        prediction.loss_rate_pct,
        1,
      )} spoilage and storage cost. The recommendation is ${meta.label}.`
    : `Adjust the values and click Analyze to get an AI-powered sell or store recommendation.`;

  // ────────── Render ──────────
  return (
    <ModuleFrame
      eyebrow="SELL VERSUS STORE"
      title="Should you sell now or store?"
      description="Compare money in hand today with the value of waiting — after spoilage, storage cost and an expected price change."
      tone="market"
      readAloudText={readAloud}
    >
      {/* ─────────── Inputs ─────────── */}
      <div className="filter-bar">
        <SelectField label="Crop" value={crop} onChange={setCrop} options={CROP_OPTIONS} />
        <SelectField
          label="District"
          value={district}
          onChange={(v) => {
            setDistrict(v);
            setPrice(String(currentPrice(crop, v)));
          }}
          options={DISTRICT_OPTIONS}
          // hint="Sets the reference price."
        />
        <SelectField
          label="Season"
          value={season}
          onChange={(v) => setSeason(v as "A" | "B" | "C")}
          options={SEASON_OPTIONS}
        />
        <NumberField
          label="Quantity"
          unit="kg"
          value={quantity}
          onChange={setQuantity}
          min={1}
          max={1000000}
          step={10}
        />
        <NumberField
          label="Offer price today"
          unit="RWF/kg"
          value={price}
          onChange={setPrice}
          min={1}
          max={100000}
          step={5}
        />
        <SelectField
          label="Storage method"
          value={method}
          onChange={setMethod}
          options={METHOD_OPTIONS}
        />
        <NumberField
          label="Storage duration"
          unit="weeks"
          value={weeks}
          onChange={setWeeks}
          min={0}
          max={52}
          step={1}
        />
        <NumberField
          label="Humidity"
          unit="%"
          value={humidity}
          onChange={setHumidity}
          min={40}
          max={95}
          step={1}
        />
        <NumberField
          label="Temperature"
          unit="°C"
          value={temperature}
          onChange={setTemperature}
          min={12}
          max={38}
          step={0.5}
        />
        <NumberField
          label="Expected price change"
          unit="%"
          value={trend}
          onChange={setTrend}
          min={-50}
          max={100}
          step={1}
          // hint="Negative if you expect prices to fall."
        />
        <div className="filter-bar-actions">
          <Button variant="outline" onClick={() => setPrice(String(currentPrice(crop, district)))}>
            Use reference price
          </Button>
        </div>
      </div>

      {/* ─────────── CTA + local pre-estimate ─────────── */}
      <SectionCard
        title="Ask the AI: sell now or store?"
        description={`Pre-estimated spoilage at current settings: ${formatPct(
          estimatedLossRate,
          1,
        )} over ${weeksNum} weeks with ${method}.`}
        icon={Sparkles}
      >
        <div className="flex flex-col gap-3 rounded-lg border-2 border-emerald-500/30 bg-emerald-50/40 p-4 dark:bg-emerald-950/10 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <p className="font-semibold text-emerald-800 dark:text-emerald-300">Ready to analyze</p>
            <p className="text-xs text-muted-foreground">
              {crop} · {district} · {qtyNum} kg · {weeksNum}w · {method}
            </p>
          </div>
          <Button
            onClick={runAnalysis}
            disabled={aiLoading}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            size="lg"
          >
            {aiLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Analyzing…
              </>
            ) : (
              <>
                <Brain size={16} /> Analyze Sell vs Store
              </>
            )}
          </Button>
        </div>
      </SectionCard>

      {/* ─────────── Loading / error ─────────── */}
      {aiLoading && (
        <InfoNote tone="info" title="Contacting AgriPulse AI…">
          <p className="flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" />
            Fetching market + post-harvest recommendation from the Flask engine.
          </p>
        </InfoNote>
      )}

      {!aiLoading && aiError && (
        <InfoNote tone="warning" title="AI engine unreachable">
          <div className="space-y-2">
            <p className="flex items-start gap-2">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{aiError}</span>
            </p>
            <Button variant="outline" size="sm" onClick={runAnalysis} className="gap-1">
              <RefreshCw size={12} /> Retry
            </Button>
          </div>
        </InfoNote>
      )}

      {/* ─────────── Recommendation badge ─────────── */}
      {prediction && riskMeta && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-md border border-border bg-card px-4 py-3">
          <StatusBadge tone={meta.tone} label={`AI: ${meta.label}`} />
          <span className="text-[11px]">{meta.plain}</span>
          <span className="ml-auto rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-bold text-white">
            {formatPct(prediction.store_probability_pct, 1)} store ·{" "}
            {formatPct(prediction.sell_probability_pct, 1)} sell
          </span>
        </div>
      )}

      {/* ─────────── KPI grid ─────────── */}
      <KpiGrid>
        <KpiCard
          label="Sell now"
          value={prediction ? formatNumber(prediction.revenue_if_sell_now_rwf) : "—"}
          unit="RWF"
          icon={Coins}
          hint={`${formatNumber(qtyNum)} kg today`}
        />
        <KpiCard
          label={`Store ${weeksNum} weeks`}
          value={prediction ? formatNumber(prediction.revenue_if_store_rwf) : "—"}
          unit="RWF"
          icon={Store}
          hint={prediction ? "After spoilage + cost" : "Awaiting AI"}
        />
        <KpiCard
          label="Net gain from storing"
          value={prediction ? formatNumber(prediction.net_gain_from_storing_rwf) : "—"}
          unit="RWF"
          icon={Scale}
          valueTone={
            prediction
              ? prediction.net_gain_from_storing_rwf > 0
                ? "success"
                : "destructive"
              : "default"
          }
          hint={
            prediction
              ? prediction.net_gain_from_storing_rwf > 0
                ? "Storing looks better"
                : "Selling looks better"
              : "Awaiting AI"
          }
        />
        <KpiCard
          label="Expected spoilage"
          value={prediction ? formatPct(prediction.loss_rate_pct, 1) : "—"}
          icon={PackageOpen}
          valueTone={prediction && prediction.loss_rate_pct > 15 ? "destructive" : "default"}
          hint={prediction ? `${formatNumber(lostKg)} kg lost` : "Awaiting AI"}
        />
      </KpiGrid>

      {/* ─────────── Recommendation + numbers ─────────── */}
      <div className="analysis-grid">
        <SectionCard
          title={`Recommendation: ${meta.label}`}
          description="AI reasoning in plain language"
          icon={Scale}
        >
          <div className="panel-body">
            <InfoNote
              tone={
                meta.tone === "success"
                  ? "success"
                  : meta.tone === "destructive"
                    ? "warning"
                    : "info"
              }
              title={
                !prediction
                  ? "Click Analyze Sell vs Store to get a recommendation"
                  : better === "store"
                    ? "Waiting can pay — if it is safe"
                    : "Selling now is the safer bet"
              }
            >
              {prediction
                ? `The AI model predicts a ${
                    prediction.net_gain_from_storing_rwf > 0 ? "net gain" : "net loss"
                  } of ${formatRwf(
                    Math.abs(prediction.net_gain_from_storing_rwf),
                  )} from storing. Post-harvest loss risk is ${prediction.post_harvest_loss_risk.toLowerCase()}.`
                : "Set your inputs above and click Analyze."}
            </InfoNote>

            <div className="mt-3">
              <h3 className="mb-2 text-[12px] font-semibold">What to do next</h3>
              <ul className="list-disc space-y-1.5 pl-5 text-[11px] text-muted-foreground">
                {storeRecommendationKey === "STORE_IF_SAFE" ? (
                  <>
                    <li>Ensure the {method.toLowerCase()} is dry, sealed and checked weekly.</li>
                    <li>
                      Monitor the local market — the model expects {formatPct(toNumber(trend), 0)}{" "}
                      change.
                    </li>
                    <li>Split the harvest between selling now and storing for flexibility.</li>
                  </>
                ) : storeRecommendationKey === "WAIT_AND_MONITOR" ? (
                  <>
                    <li>Do not commit to long storage yet.</li>
                    <li>Re-check local prices every week.</li>
                    <li>Improve storage conditions (sealing, drying) before storing.</li>
                  </>
                ) : storeRecommendationKey === "SELL_NOW" ? (
                  <>
                    <li>
                      Sell now to lock in {formatRwf(prediction?.revenue_if_sell_now_rwf ?? 0)}.
                    </li>
                    <li>Use proceeds to cover input costs for the next season.</li>
                    <li>
                      If you expect prices to rise substantially, re-run with a higher expected
                      price change.
                    </li>
                  </>
                ) : (
                  <>
                    <li>Enter quantity, price and storage duration above.</li>
                    <li>
                      Click <strong>Analyze Sell vs Store</strong>.
                    </li>
                  </>
                )}
              </ul>
            </div>

            <WhatThisMeans>
              <p>The AI model compares three moving parts:</p>
              <ul>
                <li>Spoilage, which rises with weeks, humidity and temperature.</li>
                <li>Storage cost, charged per kilogram per week.</li>
                <li>The price change you expect over the storage period.</li>
              </ul>
            </WhatThisMeans>
          </div>
        </SectionCard>

        <SectionCard
          title="The numbers behind the decision"
          description="How the two options compare"
          icon={Coins}
        >
          <div className="panel-body">
            <div className="overflow-hidden rounded-md border border-border">
              <table className="crop-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th style={{ textAlign: "right" }}>Sell now</th>
                    <th style={{ textAlign: "right" }}>Store</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Quantity sold</td>
                    <td style={{ textAlign: "right" }}>{formatNumber(qtyNum)} kg</td>
                    <td style={{ textAlign: "right" }}>
                      {prediction ? formatNumber(remainingKg) : "—"} kg
                    </td>
                  </tr>
                  <tr>
                    <td>Price per kg</td>
                    <td style={{ textAlign: "right" }}>{formatNumber(toNumber(price))} RWF</td>
                    <td style={{ textAlign: "right" }}>
                      {prediction
                        ? formatNumber(prediction.revenue_if_store_rwf / Math.max(1, remainingKg))
                        : "—"}{" "}
                      RWF
                    </td>
                  </tr>
                  <tr>
                    <td>Storage cost</td>
                    <td style={{ textAlign: "right" }}>—</td>
                    <td style={{ textAlign: "right" }}>
                      {formatRwf(storageCostPerKgWeek(method) * qtyNum * weeksNum)}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Revenue</strong>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>
                      {prediction ? formatRwf(prediction.revenue_if_sell_now_rwf) : "—"}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>
                      {prediction ? formatRwf(prediction.revenue_if_store_rwf) : "—"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {riskMeta && (
              <div className="mt-3">
                <InfoNote tone={riskMeta.tone} title={`Storage risk: ${riskMeta.label}`}>
                  Weekly spoilage for {method} at {humidity}% humidity and {temperature}°C is
                  estimated at{" "}
                  {formatPct(
                    (prediction?.loss_rate_pct ?? estimatedLossRate) / Math.max(1, weeksNum),
                    2,
                  )}{" "}
                  per week.
                </InfoNote>
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </ModuleFrame>
  );
}
