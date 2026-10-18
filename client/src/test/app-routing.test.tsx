import { describe, it, expect } from "@jest/globals";

// Next.js App Router doesn't use a client-side route tree that can be
// instantiated in unit tests. Route resolution is a build-time / server
// concern. We verify instead that the page components exported by the
// route modules exist and are functions.

const ROUTES = [
  "@/app/page",
  "@/app/advisory/page",
  "@/app/opportunities/page",
  "@/app/reports/page",
  "@/app/settings/page",
  "@/app/planner/page",
  "@/app/crop-analysis/page",
  "@/app/input-combinations/page",
  "@/app/yield-prediction/page",
  "@/app/weather/page",
  "@/app/farm-performance/page",
  "@/app/post-harvest/page",
  "@/app/sell-or-store/page",
  "@/app/farmer-profile/page",
  "@/app/market-prices/page",
  "@/app/map/page",
  "@/app/alerts/page",
  "@/app/explainable-ai/page",
  "@/app/analysis-reports/page",
];

describe("App routing", () => {
  it.each(ROUTES)("exports a default component for %s", async (route) => {
    const mod = await import(route);
    expect(typeof (mod.default ?? mod)).toBe("function");
  });
});
