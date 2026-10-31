// ---------- Station / ThingSpeak ----------
export const CHANNEL_ID = "3560262";
export const API_BASE = "https://api.thingspeak.com";
export const CHANNEL_URL = `https://thingspeak.mathworks.com/channels/${CHANNEL_ID}`;

// ---------- Timing ----------
export const UPLOAD_INTERVAL_MS = 20 * 1000; // ESP32 uploads ~every 20 s
export const REFRESH_MS = 20 * 1000; // dashboard auto-refresh
export const LIVE_WITHIN_MS = 90 * 1000; // newest reading younger than this = "Live"
export const OFFLINE_AFTER_MS = 10 * 60 * 1000; // older than this = "Offline"

// Time ranges (ThingSpeak returns max 8000 rows per request; ~3 readings/min)
export const RANGES = [
  { id: "60", label: "Last 60 readings (~20 min)", results: 100, count: 60 },
  { id: "180", label: "Last hour", results: 500, durationMs: 60 * 60 * 1000 },
  { id: "1080", label: "Last 6 hours", results: 2500, durationMs: 6 * 60 * 60 * 1000 },
  { id: "4320", label: "Last 24 hours", results: 8000, durationMs: 24 * 60 * 60 * 1000 },
  { id: "8000", label: "Maximum (All available)", results: 8000 },
];

// Used only for the *estimated* altitude value
export const SEA_LEVEL_HPA = 1013.25;

// ---------- Metrics (key = normalized name used in the app) ----------
export const METRICS = {
  temp: { label: "Temperature (DHT22)", short: "Temperature", unit: "°C", decimals: 1, color: "#ff8a5c", field: 1 },
  hum: { label: "Humidity (DHT22)", short: "Humidity", unit: "%", decimals: 1, color: "#4cc3ff", field: 2 },
  lux: { label: "Light (BH1750)", short: "Light", unit: "lux", decimals: 0, color: "#f5c542", field: 3 },
  pressure: { label: "Pressure (BMP280)", short: "Pressure", unit: "hPa", decimals: 1, color: "#a78bfa", field: 4 },
  bmpTemp: { label: "Temperature (BMP280)", short: "BMP280 temp", unit: "°C", decimals: 1, color: "#ffb36b", field: 5 },
  uv: { label: "UV index (LTR390)", short: "UV index", unit: "UVI", decimals: 1, color: "#f472b6", field: 6 },
  rainV: { label: "Rain sensor voltage", short: "Rain voltage", unit: "V", decimals: 2, color: "#2dd4bf", field: 7 },
};

// Plausible physical limits - anything outside is flagged as "suspect"
export const LIMITS = {
  temp: [-40, 80],
  hum: [0, 100],
  lux: [0, 120000],
  pressure: [300, 1100],
  bmpTemp: [-40, 85],
  uv: [0, 16],
  rainV: [0, 3.6],
};

// Sensor groups used on the "Sensors" tab
export const SENSORS = [
  { id: "dht22", name: "DHT22", measures: "Temperature, humidity", fields: ["temp", "hum"], bus: "GPIO 27" },
  { id: "bh1750", name: "BH1750", measures: "Light intensity", fields: ["lux"], bus: "I2C 0x23" },
  { id: "bmp280", name: "BMP280", measures: "Pressure, temperature", fields: ["pressure", "bmpTemp"], bus: "I2C 0x76" },
  { id: "ltr390", name: "LTR390", measures: "UV index", fields: ["uv"], bus: "I2C 0x53" },
  { id: "rain", name: "Rain sensor (FC-37 / YL-83)", measures: "Surface wetness", fields: ["rainV"], bus: "GPIO 34 (analog)" },
];
