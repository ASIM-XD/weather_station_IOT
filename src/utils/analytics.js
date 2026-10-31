/**
 * Weather station analytics and data processing utilities
 */

import { LIMITS, SENSORS } from "../config";

export const RAIN_LEVELS = [
  { level: "dry", label: "Dry", color: "#94a3b8", minV: 2.5, maxV: 3.6 },
  { level: "light", label: "Extremely light", color: "#38bdf8", minV: 2.0, maxV: 2.5 },
  { level: "moderate", label: "Moderate", color: "#3b82f6", minV: 1.0, maxV: 2.0 },
  { level: "heavy", label: "Heavy", color: "#6366f1", minV: 0.0, maxV: 1.0 },
];

export function classifyRain(rainV) {
  if (rainV === null || rainV === undefined || Number.isNaN(rainV)) return null;
  if (rainV >= 2.5) {
    return { level: "dry", label: "Dry", color: RAIN_LEVELS[0].color, isWet: false };
  }
  if (rainV >= 2.0) {
    return { level: "light", label: "Extremely light", color: RAIN_LEVELS[1].color, isWet: true };
  }
  if (rainV >= 1.0) {
    return { level: "moderate", label: "Moderate", color: RAIN_LEVELS[2].color, isWet: true };
  }
  return { level: "heavy", label: "Heavy", color: RAIN_LEVELS[3].color, isWet: true };
}

export function latest(feeds, key) {
  if (!feeds || !feeds.length) return null;
  for (let i = feeds.length - 1; i >= 0; i--) {
    const f = feeds[i];
    if (f[key] !== null && f[key] !== undefined && !Number.isNaN(f[key])) {
      return { value: f[key], time: f.time };
    }
  }
  return null;
}

export function downsample(feeds, maxPoints = 300) {
  if (!feeds || !feeds.length) return [];

  // Group readings into continuous segments separated by gaps > 15 minutes
  const segments = [];
  let currentSegment = [feeds[0]];

  for (let i = 1; i < feeds.length; i++) {
    const prev = feeds[i - 1];
    const curr = feeds[i];
    if (curr.time - prev.time > 15 * 60 * 1000) {
      segments.push(currentSegment);
      currentSegment = [curr];
    } else {
      currentSegment.push(curr);
    }
  }
  segments.push(currentSegment);

  const numKeys = ["temp", "hum", "lux", "pressure", "bmpTemp", "uv", "rainV"];
  const result = [];

  for (let sIdx = 0; sIdx < segments.length; sIdx++) {
    const seg = segments[sIdx];
    const segPoints = Math.max(1, Math.round((seg.length / feeds.length) * maxPoints));

    if (seg.length <= segPoints) {
      result.push(...seg);
    } else {
      const chunkSize = seg.length / segPoints;
      for (let i = 0; i < segPoints; i++) {
        const start = Math.floor(i * chunkSize);
        const end = Math.min(Math.floor((i + 1) * chunkSize), seg.length);
        if (start >= end) continue;

        const chunk = seg.slice(start, end);
        const avgTime = Math.round(chunk.reduce((sum, f) => sum + f.time, 0) / chunk.length);

        const merged = { time: avgTime };
        for (const k of numKeys) {
          const vals = chunk.map((c) => c[k]).filter((v) => v !== null && v !== undefined && !Number.isNaN(v));
          merged[k] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
        }
        const lastWithRain = chunk.slice().reverse().find((c) => c.rain);
        merged.rain = lastWithRain ? lastWithRain.rain : null;
        result.push(merged);
      }
    }

    // Insert null point between separated segments so charts do not connect across offline hours
    if (sIdx < segments.length - 1) {
      const lastInSeg = seg[seg.length - 1];
      result.push({
        time: lastInSeg.time + 20000,
        temp: null, hum: null, lux: null, pressure: null, bmpTemp: null, uv: null, rainV: null, rain: null,
      });
    }
  }

  return result;
}

export function computeDerived(feeds) {
  const t = latest(feeds, "temp")?.value;
  const h = latest(feeds, "hum")?.value;

  if (t === null || t === undefined || h === null || h === undefined) {
    return null;
  }

  // Magnus-Tetens dew point approximation
  const a = 17.27;
  const b = 237.7;
  const alpha = ((a * t) / (b + t)) + Math.log(h / 100);
  const dewPoint = (b * alpha) / (a - alpha);

  // Feels-like temperature calculation
  let feelsLike = t;
  if (t >= 26.7 && h >= 40) {
    feelsLike = -8.78469475556
      + 1.61139411 * t
      + 2.33854883889 * h
      - 0.14611605 * t * h
      - 0.012308094 * (t ** 2)
      - 0.0164248277778 * (h ** 2)
      + 0.002211732 * (t ** 2) * h
      + 0.00072546 * t * (h ** 2)
      - 0.000003582 * (t ** 2) * (h ** 2);
  } else {
    // Humidex approximation for mild to warm weather
    const e = 6.11 * Math.exp(5417.7530 * (1 / 273.16 - 1 / (273.15 + dewPoint)));
    const hx = t + (5 / 9) * (e - 10);
    feelsLike = hx > t ? hx : t;
  }

  // Human comfort level based on dew point (°C)
  let comfort = { label: "Comfortable", color: "#34d399" };
  if (dewPoint < 10) {
    comfort = { label: "Dry / Crisp", color: "#38bdf8" };
  } else if (dewPoint <= 16) {
    comfort = { label: "Comfortable", color: "#34d399" };
  } else if (dewPoint <= 20) {
    comfort = { label: "Pleasant", color: "#a3e635" };
  } else if (dewPoint <= 24) {
    comfort = { label: "Humid / Muggy", color: "#fbbf24" };
  } else {
    comfort = { label: "Very Oppressive", color: "#f87171" };
  }

  return { feelsLike, dewPoint, comfort };
}

export function lightCondition(lux) {
  if (lux === null || lux === undefined || Number.isNaN(lux)) return null;
  if (lux < 2) return { label: "Pitch black", color: "#64748b" };
  if (lux < 50) return { label: "Dim / Twilight", color: "#94a3b8" };
  if (lux < 500) return { label: "Indoors / Overcast", color: "#fbbf24" };
  if (lux < 10000) return { label: "Daylight (Cloudy)", color: "#facc15" };
  if (lux < 50000) return { label: "Full Daylight", color: "#f59e0b" };
  return { label: "Direct Sunlight", color: "#ea580c" };
}

export function uvCategory(uv) {
  if (uv === null || uv === undefined || Number.isNaN(uv)) return null;
  if (uv < 3) return { label: "Low", color: "#34d399" };
  if (uv < 6) return { label: "Moderate", color: "#fbbf24" };
  if (uv < 8) return { label: "High", color: "#f97316" };
  if (uv < 11) return { label: "Very high", color: "#ef4444" };
  return { label: "Extreme", color: "#a855f7" };
}

export function pressureTrend(feeds) {
  if (!feeds || feeds.length < 5) return null;
  const pFeeds = feeds.filter((f) => f.pressure != null && Number.isFinite(f.pressure));
  if (pFeeds.length < 5) return null;

  const t0 = pFeeds[0].time;
  const tEnd = pFeeds[pFeeds.length - 1].time;
  const spanHours = (tEnd - t0) / (3600 * 1000);
  if (spanHours < 0.25) return null; // Need at least ~15 min of data

  let sumT = 0, sumP = 0, sumTP = 0, sumT2 = 0;
  const n = pFeeds.length;
  for (const f of pFeeds) {
    const tH = (f.time - t0) / (3600 * 1000);
    sumT += tH;
    sumP += f.pressure;
    sumTP += tH * f.pressure;
    sumT2 += tH * tH;
  }
  const denom = (n * sumT2 - sumT * sumT);
  if (denom === 0) return null;
  const slope = (n * sumTP - sumT * sumP) / denom; // in hPa / hour

  let label = "Steady";
  let color = "#34d399";
  if (slope >= 1.5) {
    label = "Rising rapidly";
    color = "#38bdf8";
  } else if (slope >= 0.5) {
    label = "Rising";
    color = "#60a5fa";
  } else if (slope <= -1.5) {
    label = "Falling rapidly";
    color = "#f87171";
  } else if (slope <= -0.5) {
    label = "Falling";
    color = "#fbbf24";
  }

  return { slope, label, color };
}

export function downloadCSV(feeds) {
  if (!feeds || !feeds.length) return;
  const headers = [
    "Timestamp",
    "DateTime",
    "Temperature_DHT22_C",
    "Humidity_DHT22_pct",
    "Light_BH1750_lux",
    "Pressure_BMP280_hPa",
    "Temperature_BMP280_C",
    "UV_Index_LTR390",
    "Rain_Voltage_V",
    "Rain_Condition",
  ];

  const rows = feeds.map((f) => [
    f.time,
    new Date(f.time).toISOString(),
    f.temp ?? "",
    f.hum ?? "",
    f.lux ?? "",
    f.pressure ?? "",
    f.bmpTemp ?? "",
    f.uv ?? "",
    f.rainV ?? "",
    f.rain?.label ?? "",
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `weather-station-data-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function summarize(feeds, key) {
  if (!feeds || !feeds.length) {
    return { min: null, minT: null, avg: null, max: null, maxT: null, count: 0 };
  }
  let min = null, minT = null, max = null, maxT = null, sum = 0, count = 0;
  for (const f of feeds) {
    const v = f[key];
    if (v !== null && v !== undefined && Number.isFinite(v)) {
      count++;
      sum += v;
      if (min === null || v < min) {
        min = v;
        minT = f.time;
      }
      if (max === null || v > max) {
        max = v;
        maxT = f.time;
      }
    }
  }
  return {
    min,
    minT,
    max,
    maxT,
    avg: count > 0 ? sum / count : null,
    count,
  };
}

export function estimatedAltitude(pressure, seaLevelHpa = 1013.25) {
  if (pressure === null || pressure === undefined || Number.isNaN(pressure)) return null;
  return 44330 * (1 - Math.pow(pressure / seaLevelHpa, 1 / 5.255));
}

export function wetnessStats(feeds) {
  const byLevel = { dry: 0, light: 0, moderate: 0, heavy: 0 };
  if (!feeds || !feeds.length) {
    return { wetMs: 0, wetPct: 0, events: 0, longest: 0, lastWet: null, covered: 0, byLevel };
  }

  let wetMs = 0;
  let events = 0;
  let longest = 0;
  let lastWet = null;
  let currentEventDuration = 0;
  let inWetEvent = false;

  const defaultStep = 20000;
  let covered = 0;

  for (let i = 0; i < feeds.length; i++) {
    const f = feeds[i];
    let step = defaultStep;
    if (i < feeds.length - 1) {
      const dt = feeds[i + 1].time - f.time;
      step = (dt > 0 && dt <= 120000) ? dt : defaultStep;
    }
    covered += step;

    const r = f.rain;
    const isWet = r && r.level !== "dry";
    const levelKey = r ? r.level : "dry";
    if (byLevel[levelKey] !== undefined) {
      byLevel[levelKey] += step;
    }

    if (isWet) {
      wetMs += step;
      lastWet = f.time;
      if (!inWetEvent) {
        inWetEvent = true;
        events++;
        currentEventDuration = step;
      } else {
        currentEventDuration += step;
      }
      if (currentEventDuration > longest) {
        longest = currentEventDuration;
      }
    } else {
      inWetEvent = false;
      currentEventDuration = 0;
    }
  }

  const wetPct = covered > 0 ? (wetMs / covered) * 100 : 0;
  return { wetMs, wetPct, events, longest, lastWet, covered, byLevel };
}

export function pressureWetVsDry(feeds) {
  if (!feeds || !feeds.length) return { wetAvg: null, dryAvg: null, diff: null };
  let wetSum = 0, wetCount = 0;
  let drySum = 0, dryCount = 0;

  for (const f of feeds) {
    if (f.pressure == null || !Number.isFinite(f.pressure)) continue;
    const isWet = f.rain && f.rain.level !== "dry";
    if (isWet) {
      wetSum += f.pressure;
      wetCount++;
    } else {
      drySum += f.pressure;
      dryCount++;
    }
  }

  if (wetCount === 0 || dryCount === 0) {
    return { wetAvg: null, dryAvg: null, diff: null };
  }
  const wetAvg = wetSum / wetCount;
  const dryAvg = drySum / dryCount;
  return {
    wetAvg,
    dryAvg,
    diff: wetAvg - dryAvg,
  };
}

export function uploadQuality(feeds) {
  if (!feeds || feeds.length < 2) return null;
  const t0 = feeds[0].time;
  const tEnd = feeds[feeds.length - 1].time;
  const span = tEnd - t0;
  const expected = Math.max(1, Math.round(span / 20000));
  let gaps = 0;
  let longestGap = 0;

  for (let i = 0; i < feeds.length - 1; i++) {
    const diff = feeds[i + 1].time - feeds[i].time;
    if (diff > 45000) {
      gaps++;
      if (diff > longestGap) {
        longestGap = diff;
      }
    }
  }

  const completeness = Math.min(100, (feeds.length / expected) * 100);
  return {
    count: feeds.length,
    expected,
    completeness,
    gaps,
    longestGap,
  };
}

export function pearson(feeds, keyX, keyY) {
  if (!feeds || feeds.length < 3) return null;
  let n = 0, sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (const f of feeds) {
    const x = f[keyX];
    const y = f[keyY];
    if (x != null && y != null && Number.isFinite(x) && Number.isFinite(y)) {
      n++;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
      sumY2 += y * y;
    }
  }
  if (n < 3) return null;
  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  if (den === 0 || Number.isNaN(den)) return null;
  return num / den;
}

export function describeCorrelation(r) {
  if (r === null || r === undefined || Number.isNaN(r)) return "Not enough data for correlation";
  const abs = Math.abs(r);
  const dir = r < 0 ? "inverse (negative)" : "direct (positive)";
  if (abs >= 0.8) return `Strong ${dir} relationship`;
  if (abs >= 0.5) return `Moderate ${dir} relationship`;
  if (abs >= 0.3) return `Weak ${dir} relationship`;
  return "Little to no linear relationship";
}

export function sample(data, maxCount = 200) {
  if (!data || data.length <= maxCount) return data || [];
  const step = data.length / maxCount;
  const sampled = [];
  for (let i = 0; i < maxCount; i++) {
    sampled.push(data[Math.floor(i * step)]);
  }
  return sampled;
}

export function sensorHealth(feeds) {
  if (!feeds || !feeds.length) {
    return SENSORS.map((s) => ({
      ...s,
      lastSeen: null,
      latestOk: false,
      availability: 0,
      suspect: 0,
    }));
  }

  const latestFeed = feeds[feeds.length - 1];

  return SENSORS.map((sensor) => {
    let lastSeen = null;
    let validCount = 0;
    let suspectCount = 0;

    for (let i = feeds.length - 1; i >= 0; i--) {
      const f = feeds[i];
      const hasAnyField = sensor.fields.some((k) => f[k] !== null && f[k] !== undefined);
      if (hasAnyField && lastSeen === null) {
        lastSeen = f.time;
      }
    }

    for (const f of feeds) {
      const allPresent = sensor.fields.every((k) => f[k] !== null && f[k] !== undefined && Number.isFinite(f[k]));
      if (allPresent) {
        validCount++;
      }
      for (const k of sensor.fields) {
        const val = f[k];
        if (val !== null && val !== undefined && Number.isFinite(val)) {
          const lim = LIMITS[k];
          if (lim && (val < lim[0] || val > lim[1])) {
            suspectCount++;
          }
        }
      }
    }

    const latestOk = sensor.fields.every((k) => latestFeed[k] !== null && latestFeed[k] !== undefined && Number.isFinite(latestFeed[k]));
    const availability = (validCount / feeds.length) * 100;

    return {
      ...sensor,
      lastSeen,
      latestOk,
      availability,
      suspect: suspectCount,
    };
  });
}

export function buildInsights(feeds) {
  if (!feeds || !feeds.length) return [];
  const items = [];
  const latestFeed = feeds[feeds.length - 1];

  // 1. Rain / Wetness
  if (latestFeed?.rain && latestFeed.rain.level !== "dry") {
    items.push({
      title: "Precipitation / Surface Wetness Detected",
      text: `Rain sensor indicates ${latestFeed.rain.label.toLowerCase()} conditions (${latestFeed.rainV?.toFixed(2)}V).`,
      severity: "warning",
    });
  }

  // 2. UV Level
  if (latestFeed?.uv != null && latestFeed.uv >= 6) {
    items.push({
      title: "High UV Radiation",
      text: `Current UV index is ${latestFeed.uv.toFixed(1)}. Solar protection (hat, sunscreen, sunglasses) advised.`,
      severity: "warning",
    });
  }

  // 3. Pressure Trend
  const trend = pressureTrend(feeds);
  if (trend && Math.abs(trend.slope) >= 1.0) {
    if (trend.slope <= -1.0) {
      items.push({
        title: "Falling Barometric Pressure",
        text: `Pressure is dropping at ${Math.abs(trend.slope).toFixed(2)} hPa/h, which typically signals weather deterioration.`,
        severity: "info",
      });
    } else {
      items.push({
        title: "Rising Barometric Pressure",
        text: `Pressure is increasing at ${trend.slope.toFixed(2)} hPa/h, suggesting improving or clearing weather.`,
        severity: "info",
      });
    }
  }

  // 4. Comfort & Temperature
  const derived = computeDerived(feeds);
  if (derived?.comfort) {
    if (derived.dewPoint >= 21) {
      items.push({
        title: "High Humidity & Muggy Conditions",
        text: `Dew point is ${derived.dewPoint.toFixed(1)} °C with a feels-like temperature of ${derived.feelsLike.toFixed(1)} °C.`,
        severity: "warning",
      });
    } else if (derived.dewPoint >= 12 && derived.dewPoint <= 16) {
      items.push({
        title: "Pleasant Atmospheric Comfort",
        text: `Current humidity and dew point (${derived.dewPoint.toFixed(1)} °C) are in the ideal human comfort zone.`,
        severity: "success",
      });
    }
  }

  // 5. Sensor Temperature Agreement (DHT22 vs BMP280)
  if (latestFeed?.temp != null && latestFeed?.bmpTemp != null) {
    const diff = Math.abs(latestFeed.temp - latestFeed.bmpTemp);
    if (diff > 2.5) {
      items.push({
        title: "Temperature Sensor Discrepancy",
        text: `DHT22 (${latestFeed.temp.toFixed(1)} °C) and BMP280 (${latestFeed.bmpTemp.toFixed(1)} °C) differ by ${diff.toFixed(1)} °C. This may indicate sensor self-heating or solar exposure.`,
        severity: "info",
      });
    }
  }

  return items;
}
