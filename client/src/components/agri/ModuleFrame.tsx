"use client";

import type { ReactNode } from "react";
import { PlugZap, TriangleAlert } from "lucide-react";
import { Shell } from "@/components/Shell";
import { LiquidLogo, ReadAloud, ShaderGradient } from "@/components/agri/effects";
import { QualityBadge, StatusBadge } from "@/components/agri/ui";
import { ADAPTER_STATUS } from "@/data/adapters";
import { SIMULATION_DISCLAIMER } from "@/data/sim/provenance";

export function SimBanner({ text = SIMULATION_DISCLAIMER }: { text?: string }) {
  return (
    <div className="sim-banner" role="note">
      <span className="sim-banner-tag">
        <TriangleAlert size={11} />
        SIMULATED
      </span>
      <span>{text}</span>
    </div>
  );
}

export function AdapterStatus() {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {ADAPTER_STATUS.map((adapter) => (
        <div
          key={adapter.id}
          className="flex items-start justify-between gap-3 rounded-md border border-border bg-card px-3 py-2.5"
        >
          <div className="flex gap-2">
            <PlugZap size={15} className="mt-0.5 text-muted-foreground" />
            <div>
              <div className="text-[11px] font-semibold">{adapter.name}</div>
              <div className="text-[10px] text-muted-foreground">{adapter.provider}</div>
            </div>
          </div>
          <StatusBadge
            tone={adapter.live ? "success" : "warning"}
            label={adapter.live ? "Live" : "Not connected"}
          />
        </div>
      ))}
    </div>
  );
}

export function ModuleFrame({
  eyebrow,
  title,
  description,
  tone = "brand",
  readAloudText,
  actions,
  children,
  showAdapterStatus = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  tone?: "brand" | "field" | "market";
  readAloudText?: string;
  actions?: ReactNode;
  children: ReactNode;
  showAdapterStatus?: boolean;
}) {
  return (
    <Shell>
      <section className="module-hero">
        <ShaderGradient variant={tone} />
        <div className="module-hero-inner">
          <div>
            <LiquidLogo size={38} />
            <div className="module-hero-eyebrow">{eyebrow}</div>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <div className="module-hero-actions">
            {readAloudText ? <ReadAloud text={readAloudText} /> : null}
            {actions}
          </div>
        </div>
      </section>
      <SimBanner />
      {showAdapterStatus ? (
        <div className="mb-5">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
            <QualityBadge quality="simulated" compact /> Data adapters · no external service
            connected
          </div>
          <AdapterStatus />
        </div>
      ) : null}
      {children}
    </Shell>
  );
}
