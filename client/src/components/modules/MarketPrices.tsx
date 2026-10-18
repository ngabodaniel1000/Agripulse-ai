"use client";

import { useMemo, useState } from "react";
import { Coins, MapPin, Store, TrendingDown, TrendingUp } from "lucide-react";
import { ModuleFrame } from "@/components/agri/ModuleFrame";
import { BarCompare, TrendLine } from "@/components/agri/charts";
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
  currentPrice,
  districtPriceComparison,
  nationalAveragePrice,
  priceMovement,
  priceSeries,
  SEASONAL_PRICE_FACTORS,
  MARKET_SOURCE_LABEL,
  REPORTING_PERIOD,
} from "@/data/sim/market";
import { formatNumber, formatSignedPct, formatRwf } from "@/lib/analytics/format";
import { CROP_NAMES, SEASON_LABELS } from "@/data/sim/crops";
import { DISTRICT_NAMES } from "@/data/sim/districts";
import type { Season } from "@/data/sim";

const CROP_OPTIONS = CROP_NAMES.map((c) => ({ value: c, label: c }));
const DISTRICT_OPTIONS = DISTRICT_NAMES.map((d) => ({ value: d, label: d }));
const SEASON_OPTIONS = (["A", "B", "C"] as Season[]).map((s) => ({
  value: s,
  label: SEASON_LABELS[s],
}));

interface PriceRow {
  district: string;
  province: string;
  priceRwfKg: number;
  changePct: number;
  rank: number;
}

export function MarketPrices() {
  const [crop, setCrop] = useState("Maize");
  const [district, setDistrict] = useState("Musanze");
  const [season, setSeason] = useState<Season>("A");

  const series = useMemo(() => priceSeries(crop, district), [crop, district]);
  const movement = useMemo(() => priceMovement(crop, district), [crop, district]);
  const comparison = useMemo(() => districtPriceComparison(crop), [crop]);
  const national = useMemo(() => nationalAveragePrice(crop), [crop]);
  const localPrice = currentPrice(crop, district);

  const factors = SEASONAL_PRICE_FACTORS[season];
  const harvestPrice = Math.round(localPrice * factors.harvest);
  const leanPrice = Math.round(localPrice * factors.lean);

  const rows: PriceRow[] = comparison.map((r, i) => ({ ...r, rank: i + 1 }));
  const selectedRank = rows.find((r) => r.district === district)?.rank ?? null;
  const chartData = series.map((s) => ({ month: s.month, priceRwfKg: s.priceRwfKg }));
  const topDistricts = rows
    .slice(0, 10)
    .map((r) => ({ district: r.district, priceRwfKg: r.priceRwfKg }));

  const columns: Column<PriceRow>[] = [
    { key: "rank", header: "#", align: "center" },
    {
      key: "district",
      header: "District",
      render: (r) => (r.district === district ? <strong>{r.district}</strong> : r.district),
    },
    { key: "province", header: "Province" },
    {
      key: "priceRwfKg",
      header: "Price (RWF/kg)",
      align: "right",
      render: (r) => formatNumber(r.priceRwfKg),
    },
    {
      key: "changePct",
      header: "Monthly change",
      align: "right",
      render: (r) => (
        <StatusBadge
          tone={r.changePct > 1 ? "destructive" : r.changePct < -1 ? "success" : "neutral"}
          label={formatSignedPct(r.changePct, 1)}
        />
      ),
    },
  ];

  const readAloud = `Market price intelligence for ${crop}. The simulated reference price in ${district} is about ${formatNumber(localPrice)} Rwandan francs per kilogram, which is ${movement.label.toLowerCase()} month on month. Across Season ${season}, harvest-time prices run near ${formatNumber(harvestPrice)} francs and lean-season prices near ${formatNumber(leanPrice)} francs per kilogram. The national average is ${formatNumber(national)} francs per kilogram. These are simulated reference prices, not live market quotes.`;

  return (
    <ModuleFrame
      eyebrow="MARKET PRICE INTELLIGENCE"
      title="Know the price before you sell"
      description="Twelve-month reference price patterns, district comparison and a clear signal on whether prices are rising or falling."
      tone="market"
      readAloudText={readAloud}
      showAdapterStatus
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
          hint="Sets the harvest-to-lean price band."
        />
      </div>

      <KpiGrid>
        <KpiCard
          label={`${crop} in ${district}`}
          value={formatNumber(localPrice)}
          unit="RWF/kg"
          icon={Coins}
          badge="Simulated"
          badgeTone="warning"
          hint={`Rank #${selectedRank ?? "—"} of 30 (highest)`}
        />
        <KpiCard
          label="Monthly movement"
          value={movement.label}
          icon={
            movement.direction === "up"
              ? TrendingUp
              : movement.direction === "down"
                ? TrendingDown
                : Coins
          }
          valueTone={
            movement.direction === "up"
              ? "destructive"
              : movement.direction === "down"
                ? "success"
                : "default"
          }
          hint={formatSignedPct(movement.changePct, 1)}
        />
        <KpiCard
          label="National average"
          value={formatNumber(national)}
          unit="RWF/kg"
          icon={MapPin}
          hint="Across 30 districts"
        />
        <KpiCard
          label={`Season ${season} price band`}
          value={`${formatNumber(harvestPrice)}–${formatNumber(leanPrice)}`}
          unit="RWF/kg"
          icon={Store}
          hint={`Harvest ${factors.harvest}× to lean ${factors.lean}×`}
        />
      </KpiGrid>

      <div className="analysis-grid">
        <SectionCard
          title={`${crop} price through the year`}
          description={`${district} · Season ${season} · simulated monthly reference`}
          icon={Coins}
        >
          <TrendLine
            data={chartData}
            xKey="month"
            series={[{ key: "priceRwfKg", label: "Price (RWF/kg)" }]}
            yFormatter={(v) => formatNumber(v)}
          />
          <WhatThisMeans>
            <p>
              Prices dip around harvest and rise in lean months. The pattern helps you plan when to
              sell.
            </p>
          </WhatThisMeans>
        </SectionCard>

        <SectionCard
          title="Districts paying the most"
          description={`${crop} · simulated reference price`}
          icon={Store}
        >
          <BarCompare
            data={topDistricts}
            xKey="district"
            yKey="priceRwfKg"
            yLabel="Price (RWF/kg)"
            horizontal
            yFormatter={(v) => formatNumber(v)}
          />
          <InfoNote tone="info" title="Compare transport costs">
            A higher price in another district is only worthwhile if transport and time costs are
            lower than the difference.
          </InfoNote>
        </SectionCard>
      </div>

      <SectionCard title="All districts" description={`${crop} · simulated reference prices`}>
        <DataTable
          columns={columns}
          rows={rows}
          exportName={`${crop}-district-prices`}
          maxHeight={420}
        />
        <p className="mt-2 text-[10px] text-muted-foreground">
          Source: {MARKET_SOURCE_LABEL} · {REPORTING_PERIOD}. Reference price today:{" "}
          {formatRwf(localPrice)}/kg.
        </p>
      </SectionCard>
    </ModuleFrame>
  );
}
