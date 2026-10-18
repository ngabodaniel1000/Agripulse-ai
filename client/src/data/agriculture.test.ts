import { describe, it, expect } from "@jest/globals";
import { crops, opportunities, sources } from "./agriculture";

describe("NISR report data", () => {
  it("retains Table 16 crop seasons", () => {
    expect(crops.find((x) => x.name === "Sweet potato")).toMatchObject({
      adoption: 55.4,
      season: "C",
    });
    expect(crops.find((x) => x.name === "Beans")).toMatchObject({ adoption: 89.8, season: "A" });
  });

  it("preserves import ratios above 100 rather than clamping them", () => {
    expect(opportunities.find((x) => x.name === "Vegetable oils")?.idr).toBe(210);
  });

  it("makes all nine supplied publications available", () => {
    expect(sources).toHaveLength(9);
    expect(sources.every((x) => x.url.length > 0)).toBe(true);
  });
});
