import { API_BASE, CHANNEL_ID } from "../config";
import { classifyRain } from "../utils/analytics";

const toNum = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null; // "nan" / bad strings -> null (never fabricate values)
};

function normalize(f) {
  const rainV = toNum(f.field7);
  return {
    time: new Date(f.created_at).getTime(),
    entryId: f.entry_id,
    temp: toNum(f.field1),
    hum: toNum(f.field2),
    lux: toNum(f.field3),
    pressure: toNum(f.field4),
    bmpTemp: toNum(f.field5),
    uv: toNum(f.field6),
    rainV,
    rainCategoryRaw: f.field8 ?? null, // as uploaded by the ESP32
    rain: classifyRain(rainV), // derived on the client from voltage
  };
}

export async function fetchFeeds(results, signal) {
  const url = `${API_BASE}/channels/${CHANNEL_ID}/feeds.json?results=${results}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`ThingSpeak responded with status ${res.status}`);
  const json = await res.json();
  const feeds = (json.feeds || [])
    .map(normalize)
    .filter((f) => Number.isFinite(f.time))
    .sort((a, b) => a.time - b.time);
  return { channel: json.channel || null, feeds };
}
