"use client";

import { useMemo, useState } from "react";
import { CloudRain, Droplets, Mountain, Thermometer, TriangleAlert } from "lucide-react";
import { ModuleFrame } from "@/components/agri/ModuleFrame";
import { AreaTrend, BarCompare, TrendLine } from "@/components/agri/charts";
import {
  InfoNote,
  KpiCard,
  KpiGrid,
  SectionCard,
  SelectField,
  StatusBadge,
  WhatThisMeans,
} from "@/components/agri/ui";
import {
  monthlyClimate,
  seasonClimate,
  weatherRisk,
  nationalSeasonRainfall,
} from "@/data/sim/weather";
import { formatNumber } from "@/lib/analytics/format";
import { CROP_NAMES, getCrop, SEASON_LABELS } from "@/data/sim/crops";
import {
  DISTRICTS,
  DISTRICT_NAMES,
  getDistrict,
  PROVINCES,
  PROVINCE_LABELS,
} from "@/data/sim/districts";
import type { Season } from "@/data/sim";

const SEASON_OPTIONS = (["A", "B", "C"] as Season[]).map((s) => ({
  value: s,
  label: SEASON_LABELS[s],
}));
const DISTRICT_OPTIONS = DISTRICT_NAMES.map((d) => ({ value: d, label: d }));
const CROP_OPTIONS = CROP_NAMES.map((c) => ({ value: c, label: c }));

export function Weather() {
  const [district, setDistrict] = useState("Musanze");
  const [season, setSeason] = useState<Season>("A");
  const [crop, setCrop] = useState("Maize");

  const info = getDistrict(district);
  const monthly = useMemo(() => monthlyClimate(district), [district]);
  const climate = useMemo(() => seasonClimate(district, season), [district, season]);
  const optimalRain = getCrop(crop)?.optimalRainfallMm ?? 500;
  const risk = useMemo(
    () => weatherRisk(district, season, optimalRain),
    [district, season, optimalRain],
  );
  const nationalRain = useMemo(() => nationalSeasonRainfall(season), [season]);

  const rainfallData = monthly.map((m) => ({ month: m.month, rainfallMm: m.rainfallMm }));
  const tempData = monthly.map((m) => ({ month: m.month, tempC: m.tempC }));

  const provinceData = useMemo(
    () =>
      PROVINCES.map((p) => {
        const rep = DISTRICTS.find((d) => d.province === p);
        const value = rep ? seasonClimate(rep.name, season).rainfallMm : 0;
        return { province: PROVINCE_LABELS[p], rainfallMm: value };
      }),
    [season],
  );

  const readAloud = `Weather intelligence for ${district} in Season ${season}. Simulated season rainfall is about ${formatNumber(climate.rainfallMm)} millimetres with a mean temperature of ${climate.meanTempC} degrees Celsius. The rainfall risk for ${crop} is assessed as ${risk.label}. This is a demonstration outlook, not an official seasonal forecast.`;

  return (
    <ModuleFrame
      eyebrow="WEATHER INTELLIGENCE"
      title="Read the season before it arrives"
      description="Monthly rainfall and temperature profiles, a rainfall risk read-out for your crop, and transparent notes on what the simulation assumes."
      tone="field"
      readAloudText={readAloud}
      showAdapterStatus
    >
      <div className="filter-bar">
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
        <SelectField
          label="Crop requirement"
          value={crop}
          onChange={setCrop}
          options={CROP_OPTIONS}
          // hint="Used to compare rainfall against the crop's water need."
        />
      </div>

      <KpiGrid>
        <KpiCard
          label={`Season ${season} rainfall`}
          value={formatNumber(climate.rainfallMm)}
          unit="mm"
          icon={Droplets}
          badge="Simulated"
          badgeTone="warning"
          hint={`National avg ${formatNumber(nationalRain)} mm`}
        />
        <KpiCard
          label="Mean temperature"
          value={`${climate.meanTempC}`}
          unit="°C"
          icon={Thermometer}
          hint="Season average"
        />
        <KpiCard
          label="Annual rainfall"
          value={formatNumber(info?.annualRainfallMm ?? 0)}
          unit="mm"
          icon={CloudRain}
          hint="District reference"
        />
        <KpiCard
          label="Elevation"
          value={formatNumber(info?.elevationM ?? 0)}
          unit="m"
          icon={Mountain}
          hint={info?.dominantSoil}
        />
      </KpiGrid>

      <div className="analysis-grid">
        <SectionCard
          title="Monthly rainfall"
          description={`${district} · simulated 12-month profile`}
          icon={CloudRain}
        >
          <AreaTrend
            data={rainfallData}
            xKey="month"
            yKey="rainfallMm"
            yLabel="Rainfall (mm)"
            yFormatter={(v) => `${formatNumber(v)}`}
          />
          <WhatThisMeans>
            <p>
              Rwanda has two rainy periods. Taller months mean more water available, but also more
              erosion and disease pressure.
            </p>
          </WhatThisMeans>
        </SectionCard>

        <SectionCard
          title="Monthly temperature"
          description={`${district} · simulated mean temperature`}
          icon={Thermometer}
        >
          <TrendLine
            data={tempData}
            xKey="month"
            series={[{ key: "tempC", label: "Mean temp (°C)" }]}
            yFormatter={(v) => `${v}°`}
          />
          <p className="text-[10px] text-muted-foreground">
            Cooler months in the second half reflect elevation, not a forecast.
          </p>
        </SectionCard>
      </div>

      <div className="analysis-grid">
        <SectionCard
          title="Rainfall risk for your crop"
          description={`${crop} · needs about ${optimalRain} mm across the season`}
          icon={TriangleAlert}
        >
          <div className="panel-body">
            <div className="mb-3">
              <StatusBadge
                tone={
                  risk.tone === "success"
                    ? "success"
                    : risk.tone === "warning"
                      ? "warning"
                      : "destructive"
                }
                label={risk.label}
              />
            </div>
            <InfoNote
              tone={
                risk.tone === "success"
                  ? "success"
                  : risk.tone === "warning"
                    ? "warning"
                    : "destructive"
              }
              title="Why this rating"
            >
              {risk.reason}
            </InfoNote>
            <WhatThisMeans>
              <p>
                The rating compares simulated season rainfall with the crop's water requirement
                using fixed thresholds.
              </p>
              <ul>
                <li>Below 65% of the requirement is treated as drought risk.</li>
                <li>Above 145% is treated as waterlogging risk.</li>
                <li>It is a planning prompt, not an agronomic diagnosis.</li>
              </ul>
            </WhatThisMeans>
          </div>
        </SectionCard>

        <SectionCard
          title="Season rainfall by province"
          description={`Season ${season} · representative district`}
        >
          <BarCompare
            data={provinceData}
            xKey="province"
            yKey="rainfallMm"
            yLabel="Rainfall (mm)"
            horizontal
            yFormatter={(v) => formatNumber(v)}
          />
        </SectionCard>
      </div>
    </ModuleFrame>
  );
}
