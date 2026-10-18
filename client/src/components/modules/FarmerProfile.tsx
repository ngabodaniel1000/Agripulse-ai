"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CalendarClock, MapPin, Sprout, TrendingUp, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModuleFrame } from "@/components/agri/ModuleFrame";
import { ScrollReveal } from "@/components/agri/effects";
import {
  InfoNote,
  KpiCard,
  KpiGrid,
  SectionCard,
  StatusBadge,
  Tag,
  WhatThisMeans,
} from "@/components/agri/ui";
import {
  DEMO_FARM,
  DEMO_HARVESTS,
  DEMO_INPUT_HISTORY,
  DEMO_MARKET_INTERACTIONS,
  DEMO_PREDICTIONS,
} from "@/data/sim/farm";
import { compactNumber, formatKg, formatNumber, formatRwf } from "@/lib/analytics/format";
import { PROVINCE_LABELS, type ProvinceKey } from "@/data/sim/districts";

interface TimelineEvent {
  date: string;
  kind: "input" | "sale" | "estimate";
  title: string;
  detail: string;
}

export function FarmerProfile() {
  const totals = useMemo(() => {
    const harvestKg = DEMO_HARVESTS.reduce((s, h) => s + h.harvestKg, 0);
    const marketValue = DEMO_HARVESTS.reduce((s, h) => s + h.marketValueRwf, 0);
    const inputCost = DEMO_HARVESTS.reduce((s, h) => s + h.inputCostRwf, 0);
    return { harvestKg, marketValue, inputCost, margin: marketValue - inputCost };
  }, []);

  const timeline = useMemo<TimelineEvent[]>(() => {
    const events: TimelineEvent[] = [
      ...DEMO_INPUT_HISTORY.map((e) => ({
        date: e.date,
        kind: "input" as const,
        title: `Inputs for ${e.crop}`,
        detail: `${e.note} · ${formatRwf(e.costRwf)}`,
      })),
      ...DEMO_MARKET_INTERACTIONS.map((m) => ({
        date: m.date,
        kind: "sale" as const,
        title: `Sold ${formatKg(m.quantityKg)} of ${m.crop}`,
        detail: `${m.buyer} · ${m.channel} · ${formatNumber(m.priceRwfKg)} RWF/kg`,
      })),
      ...DEMO_PREDICTIONS.map((p) => ({
        date: p.date,
        kind: "estimate" as const,
        title: `Yield estimate for ${p.crop}`,
        detail: `${formatNumber(p.predictedKgHa)} kg/ha (range ${formatNumber(p.lowerKgHa)}–${formatNumber(p.upperKgHa)})`,
      })),
    ];
    return events.sort((a, b) => (a.date < b.date ? 1 : -1));
  }, []);

  const cropsGrown = Array.from(new Set(DEMO_HARVESTS.map((h) => h.crop)));

  const readAloud = `Farmer profile for the demonstration household, ${DEMO_FARM.farmerName}, a member of ${DEMO_FARM.cooperative} in ${DEMO_FARM.district}. The household farms ${DEMO_FARM.farmSizeHa} hectares across ${DEMO_FARM.plots} plots and has grown ${cropsGrown.join(" and ")} in this simulation. This profile describes an illustrative farmer, not a real person.`;

  return (
    <ModuleFrame
      eyebrow="FARMER PROFILE"
      title="One household, start to finish"
      description="A single consistent demonstration farmer linking the farm, input, market and estimate data used across every module."
      tone="field"
      readAloudText={readAloud}
      actions={
        <Button
          asChild
          variant="outline"
          className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
        >
          <Link href="/farm-performance">
            See performance <TrendingUp size={13} />
          </Link>
        </Button>
      }
    >
      <div className="glass-card mb-5 flex flex-wrap items-center gap-4 p-5">
        <div className="grid size-14 place-items-center rounded-full bg-secondary text-primary">
          <User size={24} />
        </div>
        <div>
          <h2 className="text-base font-semibold">{DEMO_FARM.farmerName}</h2>
          <p className="text-[11px] text-muted-foreground">
            {DEMO_FARM.cooperative} · Member since {DEMO_FARM.memberSince}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {DEMO_FARM.irrigation ? (
              <Tag tone="info">Irrigation</Tag>
            ) : (
              <Tag tone="neutral">Rain-fed</Tag>
            )}
            {DEMO_FARM.erosionControl ? <Tag tone="success">Erosion control</Tag> : null}
            {DEMO_FARM.agroforestry ? <Tag tone="success">Agroforestry</Tag> : null}
          </div>
        </div>
        <StatusBadge tone="warning" label="Illustrative household" className="ml-auto" />
      </div>

      <KpiGrid>
        <KpiCard
          label="Farm size"
          value={`${DEMO_FARM.farmSizeHa}`}
          unit="ha"
          icon={MapPin}
          hint={`${DEMO_FARM.plots} plots`}
        />
        <KpiCard
          label="Total harvest"
          value={compactNumber(totals.harvestKg)}
          unit="kg"
          icon={Sprout}
          badge="Simulated"
          badgeTone="warning"
          hint={`${cropsGrown.length} crops`}
        />
        <KpiCard
          label="Market value"
          value={compactNumber(totals.marketValue)}
          unit="RWF"
          icon={TrendingUp}
          hint="Recorded seasons"
        />
        <KpiCard
          label="Gross margin"
          value={compactNumber(totals.margin)}
          unit="RWF"
          icon={TrendingUp}
          valueTone={totals.margin >= 0 ? "success" : "destructive"}
          hint="After input costs"
        />
      </KpiGrid>

      <div className="analysis-grid">
        <SectionCard
          title="The household story"
          description="Read top to bottom, or press Read aloud"
          icon={Users}
        >
          <div className="story-grid">
            <ScrollReveal>
              <div className="story-step panel">
                <span className="story-step-index">1</span>
                <div>
                  <h3>Where they farm</h3>
                  <p>
                    A smallholder household in {DEMO_FARM.district} district,{" "}
                    {PROVINCE_LABELS[DEMO_FARM.province as ProvinceKey]}, working{" "}
                    {DEMO_FARM.farmSizeHa} hectares across {DEMO_FARM.plots} plots in a mix of
                    crops.
                  </p>
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={80}>
              <div className="story-step panel">
                <span className="story-step-index">2</span>
                <div>
                  <h3>How they manage the land</h3>
                  <p>
                    {DEMO_FARM.erosionControl
                      ? "They keep soil and water conservation structures. "
                      : ""}
                    {DEMO_FARM.agroforestry ? "Trees are integrated with the plots. " : ""}
                    {DEMO_FARM.irrigation
                      ? "They can irrigate when needed. "
                      : "Production depends on rainfall. "}
                  </p>
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={160}>
              <div className="story-step panel">
                <span className="story-step-index">3</span>
                <div>
                  <h3>What they grow and sell</h3>
                  <p>
                    Recent seasons stayed near{" "}
                    {formatNumber(totals.harvestKg / Math.max(1, DEMO_HARVESTS.length))} kg per
                    season, mostly {cropsGrown.join(" and ")}, sold through{" "}
                    {DEMO_MARKET_INTERACTIONS.length} recorded channels.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
          <WhatThisMeans>
            <p>
              This profile exists so the numbers in the farm, market and estimate tools describe the
              same farm.
            </p>
          </WhatThisMeans>
        </SectionCard>

        <SectionCard
          title="Activity timeline"
          description="Inputs, sales and estimates in date order"
          icon={CalendarClock}
        >
          <ol className="relative space-y-3 border-l border-border pl-4">
            {timeline.slice(0, 10).map((e, i) => (
              <li key={`${e.date}-${i}`} className="relative">
                <span
                  className="absolute -left-[22px] top-1.5 size-2.5 rounded-full border-2 border-card"
                  style={{
                    background:
                      e.kind === "input"
                        ? "var(--primary)"
                        : e.kind === "sale"
                          ? "var(--success)"
                          : "var(--warning)",
                  }}
                />
                <div className="text-[10px] text-muted-foreground">{e.date}</div>
                <div className="text-[11px] font-semibold">{e.title}</div>
                <div className="text-[10px] text-muted-foreground">{e.detail}</div>
              </li>
            ))}
          </ol>
        </SectionCard>
      </div>

      <SectionCard title="Harvest history" description="Season-by-season record">
        <div className="overflow-x-auto">
          <table className="crop-table">
            <thead>
              <tr>
                <th>Season</th>
                <th>Crop</th>
                <th style={{ textAlign: "right" }}>Area</th>
                <th style={{ textAlign: "right" }}>Harvest</th>
                <th style={{ textAlign: "right" }}>Yield</th>
                <th>Storage</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_HARVESTS.map((h) => (
                <tr key={`${h.year}-${h.season}-${h.crop}`}>
                  <td>
                    {h.season} {h.year}
                  </td>
                  <td>{h.crop}</td>
                  <td style={{ textAlign: "right" }}>{formatNumber(h.areaHa)} ha</td>
                  <td style={{ textAlign: "right" }}>{formatKg(h.harvestKg)}</td>
                  <td style={{ textAlign: "right" }}>{formatNumber(h.yieldKgHa)} kg/ha</td>
                  <td>{h.storageMethod}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3">
          <InfoNote tone="warning" title="Simulated profile">
            This household is illustrative. No real person's data is shown, and the figures are not
            official statistics.
          </InfoNote>
        </div>
      </SectionCard>
    </ModuleFrame>
  );
}
