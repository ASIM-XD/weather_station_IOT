import { useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Container, CssBaseline, Skeleton, Stack, Tab, Tabs, ThemeProvider,
} from "@mui/material";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import SpeedIcon from "@mui/icons-material/Speed";
import WbIncandescentIcon from "@mui/icons-material/WbIncandescent";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import UmbrellaIcon from "@mui/icons-material/Umbrella";
import OpacityIcon from "@mui/icons-material/Opacity";
import DeviceThermostatIcon from "@mui/icons-material/DeviceThermostat";

import { getTheme } from "./theme";
import { LIVE_WITHIN_MS, METRICS, OFFLINE_AFTER_MS, RANGES } from "./config";
import { useWeatherData } from "./hooks/useWeatherData";
import { computeDerived, downloadCSV, downsample, latest, lightCondition, pressureTrend, uvCategory } from "./utils/analytics";
import { fmt, timeAgo } from "./utils/format";
import Header from "./components/Header";
import MetricCard from "./components/MetricCard";
import Charts from "./components/Charts";
import Analytics, { Insights } from "./components/Analytics";
import Sensors from "./components/Sensors";

const cardGrid = {
  display: "grid", gap: 2, mb: 2,
  gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3, 1fr)", xl: "repeat(4, 1fr)" },
};

export default function App() {
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem("ws-mode") || "dark"; } catch { return "dark"; }
  });
  const [rangeId, setRangeId] = useState("180");
  const [auto, setAuto] = useState(true);
  const [tab, setTab] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const range = RANGES.find((r) => r.id === rangeId) || RANGES[1];
  const { feeds: rawFeeds, channel, loading, error, reload } = useWeatherData(range.results, auto);

  const feeds = useMemo(() => {
    if (!rawFeeds || !rawFeeds.length) return [];
    if (range.count) {
      return rawFeeds.slice(-range.count);
    }
    if (range.durationMs) {
      const last = rawFeeds[rawFeeds.length - 1].time;
      const cutoff = last - range.durationMs;
      return rawFeeds.filter((f) => f.time >= cutoff);
    }
    return rawFeeds;
  }, [rawFeeds, range]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    try { localStorage.setItem("ws-mode", mode); } catch { /* storage unavailable */ }
  }, [mode]);

  const theme = useMemo(() => getTheme(mode), [mode]);
  const lastTime = feeds.length ? feeds[feeds.length - 1].time : null;
  const age = lastTime ? now - lastTime : null;

  const status = !lastTime
    ? { label: "No data", color: "#94a3b8" }
    : age <= LIVE_WITHIN_MS ? { label: "Live", color: "#34d399" }
    : age <= OFFLINE_AFTER_MS ? { label: "Delayed", color: "#fbbf24" }
    : { label: "Offline", color: "#f87171" };

  const spark = useMemo(() => downsample(feeds.slice(-120), 60), [feeds]);
  const derived = useMemo(() => computeDerived(feeds), [feeds]);
  const trend = useMemo(() => pressureTrend(feeds), [feeds]);

  // For each metric: latest non-empty value + a note if it is older than the newest upload
  const cur = (key) => {
    const l = latest(feeds, key);
    const stale = l && lastTime && lastTime - l.time > 2 * 60000;
    return { value: l?.value ?? null, note: stale ? `Last seen ${timeAgo(l.time, now)}` : null };
  };
  const t = cur("temp"), h = cur("hum"), p = cur("pressure"), lx = cur("lux"), uv = cur("uv"), rv = cur("rainV");
  const lastRain = feeds.length ? feeds[feeds.length - 1].rain : null;
  const lc = lightCondition(lx.value), uc = uvCategory(uv.value);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 2, md: 3 } }}>
        <Container maxWidth="xl">
          <Header
            status={status} lastTime={lastTime} now={now} count={feeds.length}
            range={rangeId} onRange={setRangeId} auto={auto} onAuto={setAuto}
            onReload={reload} onExport={() => downloadCSV(feeds)} disabledExport={!feeds.length}
            mode={mode} onToggleMode={() => setMode(mode === "dark" ? "light" : "dark")} loading={loading}
          />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={reload}>Try again</Button>}>
              Could not reach ThingSpeak: {error}.{feeds.length ? " Showing the last data that loaded." : ""}
            </Alert>
          )}
          {!error && status.label === "Offline" && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              The station has not uploaded for {timeAgo(lastTime, now).replace(" ago", "")}. The values below are the last known readings, not live data.
            </Alert>
          )}
          {!error && status.label === "Delayed" && (
            <Alert severity="info" sx={{ mb: 2 }}>The newest reading is a little late. The station may be reconnecting.</Alert>
          )}

          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}>
            <Tab label="Overview" />
            <Tab label="Charts" />
            <Tab label="Analytics" />
            <Tab label="Sensors and data" />
          </Tabs>

          {loading && !feeds.length ? (
            <Stack spacing={2}>
              <Box sx={cardGrid}>{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} variant="rounded" height={150} />)}</Box>
              <Skeleton variant="rounded" height={300} />
            </Stack>
          ) : !feeds.length && !error ? (
            <Alert severity="info">The channel has no readings yet. Check that the ESP32 is powered and uploading.</Alert>
          ) : (
            <>
              {tab === 0 && (
                <Stack spacing={2}>
                  <Box sx={cardGrid}>
                    <MetricCard title="Temperature" icon={<ThermostatIcon fontSize="small" />} color={METRICS.temp.color}
                      value={fmt(t.value)} unit="°C" note={t.note} spark={spark} sparkKey="temp" />
                    <MetricCard title="Humidity" icon={<WaterDropIcon fontSize="small" />} color={METRICS.hum.color}
                      value={fmt(h.value)} unit="%" note={h.note} spark={spark} sparkKey="hum" />
                    <MetricCard title="Pressure" icon={<SpeedIcon fontSize="small" />} color={METRICS.pressure.color}
                      value={fmt(p.value)} unit="hPa" badge={trend?.label} badgeColor={trend?.color} note={p.note} spark={spark} sparkKey="pressure" />
                    <MetricCard title="Light" icon={<WbIncandescentIcon fontSize="small" />} color={METRICS.lux.color}
                      value={fmt(lx.value, 0)} unit="lux" badge={lc?.label} badgeColor={lc?.color} note={lx.note} spark={spark} sparkKey="lux" />
                    <MetricCard title="UV index" icon={<WbSunnyIcon fontSize="small" />} color={METRICS.uv.color}
                      value={fmt(uv.value)} unit="UVI" badge={uc?.label} badgeColor={uc?.color} note={uv.note || "Approximate"} spark={spark} sparkKey="uv" />
                    <MetricCard title="Rain sensor" icon={<UmbrellaIcon fontSize="small" />} color={lastRain?.color || METRICS.rainV.color}
                      value={fmt(rv.value, 2)} unit="V" badge={lastRain?.label} badgeColor={lastRain?.color} note={rv.note} spark={spark} sparkKey="rainV" />
                    <MetricCard title="Feels like" derived icon={<DeviceThermostatIcon fontSize="small" />} color="#fb7185"
                      value={fmt(derived?.feelsLike)} unit="°C" badge={derived?.comfort?.label} badgeColor={derived?.comfort?.color} />
                    <MetricCard title="Dew point" derived icon={<OpacityIcon fontSize="small" />} color="#22d3ee"
                      value={fmt(derived?.dewPoint)} unit="°C" />
                  </Box>
                  <Insights feeds={feeds} />
                  <Charts feeds={feeds} range={range} variant="overview" />
                </Stack>
              )}
              {tab === 1 && <Charts feeds={feeds} range={range} variant="full" />}
              {tab === 2 && <Analytics feeds={feeds} />}
              {tab === 3 && <Sensors feeds={feeds} now={now} channel={channel} />}
            </>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}
