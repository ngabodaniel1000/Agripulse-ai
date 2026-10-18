"use client";

import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Droplets, Gauge, Map as MapIcon, Mountain, Wheat } from "lucide-react";
import { ModuleFrame } from "@/components/agri/ModuleFrame";
import {
  DataTable,
  InfoNote,
  KpiCard,
  KpiGrid,
  LoadingState,
  SectionCard,
  SelectField,
  Tag,
  WhatThisMeans,
  type Column,
} from "@/components/agri/ui";
import { districtProfile, districtYieldRanking } from "@/lib/analytics/analytics";
import { formatNumber } from "@/lib/analytics/format";
import { CROP_NAMES, SEASON_LABELS } from "@/data/sim/crops";
import {
  DISTRICTS,
  PROVINCES,
  PROVINCE_LABELS,
  districtsInProvince,
  type ProvinceKey,
} from "@/data/sim/districts";
import { useDashboard } from "@/lib/dashboard-store";
import type { Season } from "@/data/sim";

const ProvinceMap = lazy(() => import("@/components/ProvinceMap"));

const CROP_OPTIONS = CROP_NAMES.map((c) => ({ value: c, label: c }));
const SEASON_OPTIONS = (["A", "B", "C"] as Season[]).map((s) => ({
  value: s,
  label: SEASON_LABELS[s],
}));
const PROVINCE_OPTIONS = [
  { value: "All", label: "All provinces" },
  ...PROVINCES.map((p) => ({ value: p, label: PROVINCE_LABELS[p] })),
];

interface DistrictRow {
  district: string;
  province: ProvinceKey;
  yieldKgHa: number;
  rank: number;
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

export function RwandaMap() {
  const { region, setRegion } = useDashboard();
  const [province, setProvince] = useState<string>("All");
  const [district, setDistrict] = useState("Musanze");
  const [crop, setCrop] = useState("Maize");
  const [season, setSeason] = useState<Season>("A");
  const [mounted, setMounted] = useState(false);
  const [webgl, setWebgl] = useState(false);

  useEffect(() => {
    setMounted(true);
    setWebgl(hasWebGL());
  }, []);

  const districtOptions = useMemo(() => {
    const list = province === "All" ? DISTRICTS : districtsInProvince(province as ProvinceKey);
    return list.map((d) => ({ value: d.name, label: d.name }));
  }, [province]);

  const profile = useMemo(() => districtProfile(district, season), [district, season]);

  const rows: DistrictRow[] = useMemo(() => {
    const ranking = districtYieldRanking(crop, season);
    return province === "All" ? ranking : ranking.filter((r) => r.province === province);
  }, [crop, season, province]);

  const columns: Column<DistrictRow>[] = [
    { key: "rank", header: "#", align: "center" },
    {
      key: "district",
      header: "District",
      render: (r) => (r.district === district ? <strong>{r.district}</strong> : r.district),
    },
    { key: "province", header: "Province", render: (r) => PROVINCE_LABELS[r.province] },
    {
      key: "yieldKgHa",
      header: `${crop} yield (kg/ha)`,
      align: "right",
      render: (r) => formatNumber(r.yieldKgHa),
    },
  ];

  const readAloud = `Rwanda geography. ${profile.district} is in ${PROVINCE_LABELS[profile.province]}, at about ${profile.elevationM} metres elevation with ${profile.soil} soils and ${profile.rainfallMm} millimetres of annual rainfall. Its strongest reference crop is ${profile.topCrop}, at about ${profile.topCropYieldKgHa} kilograms per hectare. All values are simulated demonstration data.`;

  function handleProvince(value: string) {
    setProvince(value);
    setRegion(value === "All" ? "All Rwanda" : PROVINCE_LABELS[value as ProvinceKey]);
    if (value !== "All") {
      const first = districtsInProvince(value as ProvinceKey)[0];
      if (first) setDistrict(first.name);
    }
  }

  return (
    <ModuleFrame
      eyebrow="RWANDA GEOGRAPHY"
      title="Where crops and conditions meet"
      description="Explore provinces in 3D and read the soil, rainfall and yield profile of every district."
      tone="brand"
      readAloudText={readAloud}
    >
      <div className="filter-bar">
        <SelectField
          label="Province"
          value={province}
          onChange={handleProvince}
          options={PROVINCE_OPTIONS}
          hint="Also highlights the 3D map."
        />
        <SelectField
          label="District"
          value={district}
          onChange={setDistrict}
          options={districtOptions}
        />
        <SelectField label="Crop" value={crop} onChange={setCrop} options={CROP_OPTIONS} />
        <SelectField
          label="Season"
          value={season}
          onChange={(v) => setSeason(v as Season)}
          options={SEASON_OPTIONS}
        />
      </div>

      <div className="analysis-grid">
        <SectionCard
          title="Interactive province map"
          description={`Selected: ${region}`}
          icon={MapIcon}
        >
          <div className="three-panel" style={{ height: 340 }}>
            {mounted && webgl ? (
              <Suspense fallback={<LoadingState label="Loading geography…" />}>
                <ProvinceMap />
              </Suspense>
            ) : (
              <div className="three-fallback">
                {mounted
                  ? "3D map is not available on this device — use the district list beside it."
                  : "Loading geography…"}
              </div>
            )}
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Tap a province in the 3D view to select it. Boundaries are simplified for illustration.
          </p>
        </SectionCard>

        <SectionCard
          title={`District profile: ${district}`}
          description={PROVINCE_LABELS[profile.province]}
          icon={Gauge}
        >
          <KpiGrid columns={2}>
            <KpiCard label="Dominant soil" value={profile.soil} icon={Mountain} />
            <KpiCard
              label="Elevation"
              value={formatNumber(profile.elevationM)}
              unit="m"
              icon={Mountain}
            />
            <KpiCard
              label="Annual rainfall"
              value={formatNumber(profile.rainfallMm)}
              unit="mm"
              icon={Droplets}
            />
            <KpiCard
              label="Top crop"
              value={profile.topCrop}
              icon={Wheat}
              hint={`${formatNumber(profile.topCropYieldKgHa)} kg/ha`}
            />
          </KpiGrid>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Tag tone="info">
              Reference price {formatNumber(profile.referencePriceRwfKg)} RWF/kg
            </Tag>
            <Tag
              tone={
                profile.priceChangePct > 1
                  ? "destructive"
                  : profile.priceChangePct < -1
                    ? "success"
                    : "neutral"
              }
            >
              {profile.priceChangePct > 0 ? "+" : ""}
              {profile.priceChangePct}% month on month
            </Tag>
          </div>
          <WhatThisMeans>
            <p>
              Values combine the district reference table with simulated climate and market data.
            </p>
            <ul>
              <li>Soil is the dominant association, not a soil test result.</li>
              <li>Rainfall and elevation are calibrated approximations for the demo.</li>
            </ul>
          </WhatThisMeans>
        </SectionCard>
      </div>

      <SectionCard
        title="District yield comparison"
        description={`${crop} · Season ${season} · ${province === "All" ? "all provinces" : PROVINCE_LABELS[province as ProvinceKey]}`}
      >
        <DataTable
          columns={columns}
          rows={rows}
          exportName={`${crop}-district-yield-comparison`}
          maxHeight={420}
        />
      </SectionCard>

      <InfoNote tone="warning" title="About the map data">
        Province boundaries are simplified geometry from a public boundary dataset. The agronomic
        values behind them are simulated for demonstration, not official district statistics.
      </InfoNote>
    </ModuleFrame>
  );
}
