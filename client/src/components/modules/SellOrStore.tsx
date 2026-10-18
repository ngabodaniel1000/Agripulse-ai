"use client";

import { useMemo, useState } from "react";
import { Coins, PackageOpen, Scale, Store, TrendingUp } from "lucide-react";
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
import { analyzeStorage, RECOMMENDATION_META, STORAGE_METHOD_NAMES } from "@/lib/analytics/storage";
import { formatNumber, formatPct, formatRwf, toNumber } from "@/lib/analytics/format";
import { CROP_NAMES } from "@/data/sim/crops";
import { DISTRICT_NAMES } from "@/data/sim/districts";
import { currentPrice } from "@/data/sim/market";

const CROP_OPTIONS = CROP_NAMES.map((c) => ({ value: c, label: c }));
const DISTRICT_OPTIONS = DISTRICT_NAMES.map((d) => ({ value: d, label: d }));
const METHOD_OPTIONS = STORAGE_METHOD_NAMES.map((m) => ({ value: m, label: m }));

export function SellOrStore() {
  const [crop, setCrop] = useState("Irish potato");
  const [district, setDistrict] = useState("Musanze");
  const [quantity, setQuantity] = useState("1000");
  const [price, setPrice] = useState(String(currentPrice("Irish potato", "Musanze")));
  const [method, setMethod] = useState("Hermetic bag");
  const [weeks, setWeeks] = useState("8");
  const [humidity, setHumidity] = useState("72");
  const [temperature, setTemperature] = useState("22");
  const [trend, setTrend] = useState("8");

  const result = useMemo(
    () =>
      analyzeStorage({
        crop,
        quantityKg: toNumber(quantity),
        currentPriceRwfKg: toNumber(price),
        storageMethod: method,
        durationWeeks: toNumber(weeks),
        humidityPct: toNumber(humidity),
        temperatureC: toNumber(temperature),
        priceTrendPct: toNumber(trend),
      }),
    [crop, quantity, price, method, weeks, humidity, temperature, trend],
  );

  const meta = RECOMMENDATION_META[result.recommendation];
  const better = result.netGainStoreRwf > 0 ? "store" : "sell";

  const readAloud = `Sell or store decision. ${meta.plain} Selling now would earn about ${formatNumber(result.revenueSellNowRwf)} Rwandan francs. Storing for ${weeks} weeks is estimated to earn about ${formatNumber(result.revenueStoreRwf)} after ${formatPct(result.totalLossPct, 1)} spoilage and storage cost. The recommendation is ${meta.label}. This is a simulation, not advice from a buyer or extension officer.`;

  return (
    <ModuleFrame
      eyebrow="SELL VERSUS STORE"
      title="Should you sell now or store?"
      description="Compare money in hand today with the value of waiting — after spoilage, storage cost and an expected price change."
      tone="market"
      readAloudText={readAloud}
    >
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
          hint="Sets the reference price."
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
          hint="Negative if you expect prices to fall."
        />
        <div className="filter-bar-actions">
          <Button variant="outline" onClick={() => setPrice(String(currentPrice(crop, district)))}>
            Use reference price
          </Button>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-md border border-border bg-card px-4 py-3">
        <StatusBadge tone={meta.tone} label={meta.label} />
        <span className="text-[11px]">{meta.plain}</span>
        <span className="ml-auto text-[10px] text-muted-foreground">Simulated recommendation</span>
      </div>

      <KpiGrid>
        <KpiCard
          label="Sell now"
          value={formatNumber(result.revenueSellNowRwf)}
          unit="RWF"
          icon={Coins}
          hint={`${formatNumber(toNumber(quantity))} kg today`}
        />
        <KpiCard
          label={`Store ${toNumber(weeks)} weeks`}
          value={formatNumber(result.revenueStoreRwf)}
          unit="RWF"
          icon={Store}
          hint={`Future price ${formatNumber(result.futurePriceRwfKg)} RWF/kg`}
        />
        <KpiCard
          label="Net gain from storing"
          value={formatNumber(result.netGainStoreRwf)}
          unit="RWF"
          icon={Scale}
          valueTone={result.netGainStoreRwf > 0 ? "success" : "destructive"}
          hint={result.netGainStoreRwf > 0 ? "Storing looks better" : "Selling looks better"}
        />
        <KpiCard
          label="Expected spoilage"
          value={formatPct(result.totalLossPct, 1)}
          icon={PackageOpen}
          valueTone={result.totalLossPct > 15 ? "destructive" : "default"}
          hint={`${formatNumber(result.lostKg)} kg lost`}
        />
      </KpiGrid>

      <div className="analysis-grid">
        <SectionCard
          title={`Recommendation: ${meta.label}`}
          description="Plain-language reasoning"
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
                better === "store"
                  ? "Waiting can pay — if it is safe"
                  : "Selling now is the safer bet"
              }
            >
              {result.rationale}
            </InfoNote>
            <div className="mt-3">
              <h3 className="mb-2 text-[12px] font-semibold">What to do next</h3>
              <ul className="list-disc space-y-1.5 pl-5 text-[11px] text-muted-foreground">
                {result.actions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
            <WhatThisMeans>
              <p>The comparison uses three moving parts you can change above:</p>
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
                    <td style={{ textAlign: "right" }}>{formatNumber(toNumber(quantity))} kg</td>
                    <td style={{ textAlign: "right" }}>{formatNumber(result.remainingKg)} kg</td>
                  </tr>
                  <tr>
                    <td>Price per kg</td>
                    <td style={{ textAlign: "right" }}>{formatNumber(toNumber(price))} RWF</td>
                    <td style={{ textAlign: "right" }}>
                      {formatNumber(result.futurePriceRwfKg)} RWF
                    </td>
                  </tr>
                  <tr>
                    <td>Storage cost</td>
                    <td style={{ textAlign: "right" }}>—</td>
                    <td style={{ textAlign: "right" }}>{formatRwf(result.storageCostRwf)}</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Revenue</strong>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>
                      {formatRwf(result.revenueSellNowRwf)}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>
                      {formatRwf(result.revenueStoreRwf)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <InfoNote
                tone={
                  result.riskLevel === "low"
                    ? "success"
                    : result.riskLevel === "moderate"
                      ? "warning"
                      : "destructive"
                }
                title={`Storage risk: ${result.riskLevel}`}
              >
                Weekly spoilage is estimated at {formatPct(result.weeklyLossPct, 2)} with {method}.
              </InfoNote>
            </div>
          </div>
        </SectionCard>
      </div>
    </ModuleFrame>
  );
}
