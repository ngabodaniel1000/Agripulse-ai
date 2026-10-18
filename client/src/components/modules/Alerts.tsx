"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Bell, CalendarClock, MapPin } from "lucide-react";
import { ModuleFrame } from "@/components/agri/ModuleFrame";
import {
  EmptyState,
  InfoNote,
  KpiCard,
  KpiGrid,
  SectionCard,
  SelectField,
  StatusBadge,
  WhatThisMeans,
} from "@/components/agri/ui";
import {
  buildAlerts,
  ALERT_CATEGORY_LABELS,
  ALERT_SEVERITY_LABELS,
  type AgriAlert,
  type AlertCategory,
  type AlertSeverity,
} from "@/data/sim/alerts";
import { DISTRICT_NAMES } from "@/data/sim/districts";
import { formatNumber } from "@/lib/analytics/format";

const CATEGORY_OPTIONS = [
  { value: "All", label: "All categories" },
  ...(Object.keys(ALERT_CATEGORY_LABELS) as AlertCategory[]).map((c) => ({
    value: c,
    label: ALERT_CATEGORY_LABELS[c],
  })),
];
const SEVERITY_OPTIONS = [
  { value: "All", label: "All severities" },
  ...(Object.keys(ALERT_SEVERITY_LABELS) as AlertSeverity[]).map((s) => ({
    value: s,
    label: ALERT_SEVERITY_LABELS[s],
  })),
];
const DISTRICT_OPTIONS = [
  { value: "All", label: "All districts" },
  ...DISTRICT_NAMES.map((d) => ({ value: d, label: d })),
];

const SEVERITY_TONE: Record<AlertSeverity, "destructive" | "warning" | "neutral"> = {
  high: "destructive",
  medium: "warning",
  low: "neutral",
};

export function Alerts() {
  const [category, setCategory] = useState("All");
  const [severity, setSeverity] = useState("All");
  const [district, setDistrict] = useState("All");

  const all = useMemo(() => buildAlerts(), []);
  const filtered = useMemo(
    () =>
      all.filter(
        (a) =>
          (category === "All" || a.category === category) &&
          (severity === "All" || a.severity === severity) &&
          (district === "All" || a.district === district),
      ),
    [all, category, severity, district],
  );

  const counts = useMemo(
    () => ({
      high: all.filter((a) => a.severity === "high").length,
      medium: all.filter((a) => a.severity === "medium").length,
      low: all.filter((a) => a.severity === "low").length,
    }),
    [all],
  );

  const readAloud = `Agricultural alerts. There are ${all.length} demonstration alerts in total: ${counts.high} high, ${counts.medium} medium and ${counts.low} low severity. Each alert suggests a next step. These are generated from simulated data, not a live warning service.`;

  return (
    <ModuleFrame
      eyebrow="AGRICULTURAL ALERTS"
      title="What needs attention now"
      description="Rainfall, price, yield and storage prompts for every district — each with a clear suggested next step."
      tone="market"
      readAloudText={readAloud}
    >
      <KpiGrid>
        <KpiCard
          label="Open alerts"
          value={formatNumber(all.length)}
          icon={Bell}
          badge="Simulated"
          badgeTone="warning"
          hint="Across 30 districts"
        />
        <KpiCard
          label="High severity"
          value={formatNumber(counts.high)}
          icon={AlertTriangle}
          valueTone="destructive"
          hint="Act soon"
        />
        <KpiCard
          label="Medium severity"
          value={formatNumber(counts.medium)}
          icon={AlertTriangle}
          valueTone="warning"
          hint="Monitor closely"
        />
        <KpiCard
          label="Low severity"
          value={formatNumber(counts.low)}
          icon={AlertTriangle}
          hint="Keep an eye on"
        />
      </KpiGrid>

      <div className="filter-bar">
        <SelectField
          label="Category"
          value={category}
          onChange={setCategory}
          options={CATEGORY_OPTIONS}
        />
        <SelectField
          label="Severity"
          value={severity}
          onChange={setSeverity}
          options={SEVERITY_OPTIONS}
        />
        <SelectField
          label="District"
          value={district}
          onChange={setDistrict}
          options={DISTRICT_OPTIONS}
        />
      </div>

      <SectionCard
        title={`${filtered.length} alert${filtered.length === 1 ? "" : "s"}`}
        description="Filtered demonstration alerts"
      >
        {filtered.length ? (
          <ul className="space-y-3">
            {filtered.map((a) => (
              <AlertCard key={a.id} alert={a} />
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={Bell}
            title="No alerts match"
            message="Try clearing a filter to see more demonstration alerts."
          />
        )}
        <WhatThisMeans>
          <p>
            Alerts are generated deterministically from the simulated rainfall, price, yield and
            storage data.
          </p>
          <ul>
            <li>They point you to something worth checking, not a confirmed event.</li>
            <li>Every alert names the district and the metric behind it.</li>
            <li>No live notification service is connected.</li>
          </ul>
        </WhatThisMeans>
      </SectionCard>

      <InfoNote tone="info" title="Related tools">
        Investigate a rainfall alert in the{" "}
        <Link href="/weather" className="underline">
          weather module
        </Link>
        , a price alert in{" "}
        <Link href="/market-prices" className="underline">
          market prices
        </Link>
        , or a storage alert in{" "}
        <Link href="/sell-or-store" className="underline">
          sell vs store
        </Link>
        .
      </InfoNote>
    </ModuleFrame>
  );
}

function AlertCard({ alert }: { alert: AgriAlert }) {
  return (
    <li className="rounded-md border border-border bg-card px-4 py-3">
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <StatusBadge
          tone={SEVERITY_TONE[alert.severity]}
          label={`${ALERT_SEVERITY_LABELS[alert.severity]} · ${ALERT_CATEGORY_LABELS[alert.category]}`}
        />
        <strong className="text-[12px]">{alert.title}</strong>
        <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-muted-foreground">
          <MapPin size={11} /> {alert.district}
        </span>
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">{alert.detail}</p>
      <div className="mt-2 rounded-md border border-border bg-secondary px-3 py-2">
        <span className="mb-0.5 flex items-center gap-1 text-[10px] font-semibold text-primary">
          <CalendarClock size={11} /> Suggested action
        </span>
        <span className="text-[11px] text-muted-foreground">{alert.suggestedAction}</span>
      </div>
    </li>
  );
}
