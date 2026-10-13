import { describe, expect, it } from "vitest";
import { classifyPixels } from "./sky-check";

const W = 8;
const H = 8;

function fill(r: number, g: number, b: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(W * H * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = 255;
  }
  return data;
}

describe("classifyPixels", () => {
  it("labels a blue sky as clear", () => {
    const reading = classifyPixels(fill(80, 140, 230), W, H, 30);
    expect(reading.condition).toBe("clear");
    expect(reading.cloudCover).toBe(0);
  });

  it("labels a bright grey sky as cloudy", () => {
    const reading = classifyPixels(fill(230, 230, 232), W, H, 30);
    expect(reading.condition).toBe("cloudy");
    expect(reading.cloudCover).toBeGreaterThan(0.6);
  });

  it("labels a dark frame as night when the sun is well below the horizon", () => {
    const reading = classifyPixels(fill(5, 5, 8), W, H, -30);
    expect(reading.condition).toBe("night");
  });

  it("does not call a dark frame night in daylight", () => {
    const reading = classifyPixels(fill(5, 5, 8), W, H, 20);
    expect(reading.condition).not.toBe("night");
  });

  it("never rejects a photo, even an empty one", () => {
    const reading = classifyPixels(new Uint8ClampedArray(0), 0, 0, 0);
    expect(reading.brightness).toBe(0);
    expect(["clear", "cloudy", "night"]).toContain(reading.condition);
  });
});
