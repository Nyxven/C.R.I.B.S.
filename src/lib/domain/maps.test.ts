import { describe, expect, it } from "vitest";
import { mapsSearchUrl } from "./content";

describe("mapsSearchUrl", () => {
  it("builds an encoded Google Maps search for name and location", () => {
    expect(mapsSearchUrl("Dr. Ana Cruz", "BGC, Taguig")).toBe("https://www.google.com/maps/search/?api=1&query=Dr.%20Ana%20Cruz%2C%20BGC%2C%20Taguig");
  });
  it("caps very long input", () => {
    expect(decodeURIComponent(mapsSearchUrl("x".repeat(500), "y").split("query=")[1]!).length).toBe(200);
  });
});
