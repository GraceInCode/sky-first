/**
 * On-device sky classification. It labels a photo and never rejects one:
 * dark or overcast photos are still valid, because looking at the sky counts.
 */
export type SkyCondition = "clear" | "cloudy" | "night";

export type SkyReading = {
  condition: SkyCondition;
  /** 0..1, share of bright, low-saturation pixels in the upper half of the frame. */
  cloudCover: number;
  /** 0..1, mean luminance of the whole frame. */
  brightness: number;
};

const NIGHT_SUN_ALTITUDE_DEG = -6; // civil twilight
const NIGHT_MAX_BRIGHTNESS = 0.25;
const CLOUDY_THRESHOLD = 0.6;

/**
 * Pure classifier over RGBA pixel data (as from canvas getImageData).
 * `sunAltitudeDeg` comes from sun.ts so night is judged by the real sky, not the photo alone.
 */
export function classifyPixels(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  sunAltitudeDeg: number,
): SkyReading {
  let lumSum = 0;
  let upperCount = 0;
  let upperCloudy = 0;
  const upperRows = Math.floor(height / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      lumSum += (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

      if (y < upperRows) {
        upperCount++;
        const brightness = max / 255;
        const saturation = max === 0 ? 0 : (max - min) / max;
        if (brightness > 0.6 && saturation < 0.12) upperCloudy++;
      }
    }
  }

  const pixels = width * height || 1;
  const brightness = lumSum / pixels;
  const cloudCover = upperCount ? upperCloudy / upperCount : 0;

  let condition: SkyCondition = "clear";
  if (sunAltitudeDeg < NIGHT_SUN_ALTITUDE_DEG && brightness < NIGHT_MAX_BRIGHTNESS) {
    condition = "night";
  } else if (cloudCover > CLOUDY_THRESHOLD) {
    condition = "cloudy";
  }

  return { condition, cloudCover, brightness };
}

/** Browser entry point: downscale the photo to a small canvas, then classify. */
export async function classifyPhoto(blob: Blob, sunAltitudeDeg: number): Promise<SkyReading> {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, 96 / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas is not available");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const { data } = ctx.getImageData(0, 0, width, height);
  return classifyPixels(data, width, height, sunAltitudeDeg);
}
