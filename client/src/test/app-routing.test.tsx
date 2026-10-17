import { describe, it, expect } from "@jest/globals";

// Next.js App Router doesn't use a client-side route tree that can be
// instantiated in unit tests. Route resolution is a build-time / server
// concern. We verify instead that the page components exported by the
// route modules exist and are functions.

describe("App routing", () => {
  it("exports a default component for the index page", async () => {
    const mod = await import("@/app/page");
    expect(typeof (mod.default ?? mod)).toBe("function");
  });

  it("exports a default component for the advisory page", async () => {
    const mod = await import("@/app/advisory/page");
    expect(typeof (mod.default ?? mod)).toBe("function");
  });

  it("exports a default component for the opportunities page", async () => {
    const mod = await import("@/app/opportunities/page");
    expect(typeof (mod.default ?? mod)).toBe("function");
  });

  it("exports a default component for the reports page", async () => {
    const mod = await import("@/app/reports/page");
    expect(typeof (mod.default ?? mod)).toBe("function");
  });

  it("exports a default component for the settings page", async () => {
    const mod = await import("@/app/settings/page");
    expect(typeof (mod.default ?? mod)).toBe("function");
  });
});
