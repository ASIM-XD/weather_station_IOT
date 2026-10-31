import {
  Alert, Box, Chip, LinearProgress, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from "@mui/material";
import { useMemo } from "react";
import { METRICS, SEA_LEVEL_HPA } from "../config";
import {
  buildInsights, computeDerived, describeCorrelation, estimatedAltitude, latest, lightCondition,
  pearson, pressureTrend, pressureWetVsDry, RAIN_LEVELS, sample, summarize, uploadQuality, uvCategory, wetnessStats,
} from "../utils/analytics";
import { fmt, fmtClock, fmtDuration } from "../utils/format";
import Panel from "./Panel";
import { ScatterPlot } from "./TimeSeriesChart";

const sevMap = { warning: "warning", info: "info", success: "success" };

export function Insights({ feeds }) {
  const items = useMemo(() => buildInsights(feeds), [feeds]);
  if (!items.length) return null;
  return (
    <Panel title="What the data says" subtitle="Plain-language notes derived from the loaded readings">
      <Stack spacing={1}>
        {items.map((i) => (
          <Alert key={i.title} severity={sevMap[i.severity]} variant="outlined" sx={{ alignItems: "center" }}>
            <b>{i.title}.</b> {i.text}
          </Alert>
        ))}
      </Stack>
    </Panel>
  );
}

function Stat({ label, value, sub, color }) {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="h6" sx={{ color }}>{value}</Typography>
      {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
    </Box>
  );
}

const statGrid = { display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3, 1fr)" } };

export default function Analytics({ feeds }) {
  const stats = useMemo(() => Object.fromEntries(Object.keys(METRICS).map((k) => [k, summarize(feeds, k)])), [feeds]);
  const derived = useMemo(() => computeDerived(feeds), [feeds]);
  const trend = useMemo(() => pressureTrend(feeds), [feeds]);
  const wet = useMemo(() => wetnessStats(feeds), [feeds]);
  const pwd = useMemo(() => pressureWetVsDry(feeds), [feeds]);
  const quality = useMemo(() => uploadQuality(feeds), [feeds]);
  const rTH = useMemo(() => pearson(feeds, "temp", "hum"), [feeds]);
  const rLU = useMemo(() => pearson(feeds, "lux", "uv"), [feeds]);
  const rTT = useMemo(() => pearson(feeds, "temp", "bmpTemp"), [feeds]);
  const thData = useMemo(() => sample(feeds.filter((f) => f.temp != null && f.hum != null)), [feeds]);
  const luData = useMemo(() => sample(feeds.filter((f) => f.lux != null && f.uv != null)), [feeds]);

  const lux = latest(feeds, "lux")?.value;
  const uv = latest(feeds, "uv")?.value;
  const pressure = latest(feeds, "pressure")?.value;
  const lc = lightCondition(lux), uc = uvCategory(uv);
  const alt = estimatedAltitude(pressure, SEA_LEVEL_HPA);

  const tempOffset = useMemo(() => {
    const d = feeds.filter((f) => f.temp != null && f.bmpTemp != null).map((f) => f.temp - f.bmpTemp);
    return d.length ? d.reduce((a, b) => a + b, 0) / d.length : null;
  }, [feeds]);

  return (
    <Stack spacing={2}>
      <Panel title="Statistics for the selected range" subtitle={`${feeds.length} readings`}>
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Measurement</TableCell>
                <TableCell align="right">Minimum</TableCell>
                <TableCell align="right">Average</TableCell>
                <TableCell align="right">Maximum</TableCell>
                <TableCell align="right">Readings</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(METRICS).map(([k, m]) => {
                const s = stats[k];
                return (
                  <TableRow key={k}>
                    <TableCell>{m.label}</TableCell>
                    <TableCell align="right">{fmt(s.min, m.decimals)} {m.unit}{s.minT && <Typography component="span" variant="caption" color="text.secondary"> · {fmtClock(s.minT)}</Typography>}</TableCell>
                    <TableCell align="right">{fmt(s.avg, m.decimals)} {m.unit}</TableCell>
                    <TableCell align="right">{fmt(s.max, m.decimals)} {m.unit}{s.maxT && <Typography component="span" variant="caption" color="text.secondary"> · {fmtClock(s.maxT)}</Typography>}</TableCell>
                    <TableCell align="right">{s.count}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </Panel>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" } }}>
        <Panel title="Conditions right now" subtitle="All values below are derived or estimated, not direct measurements">
          <Box sx={statGrid}>
            <Stat label="Comfort" value={derived?.comfort?.label ?? "—"} color={derived?.comfort?.color} sub={derived ? `Dew point ${fmt(derived.dewPoint)} °C` : null} />
            <Stat label="Pressure trend" value={trend?.label ?? "Needs 20+ min of data"} color={trend?.color} sub={trend ? `${trend.slope >= 0 ? "+" : ""}${trend.slope.toFixed(2)} hPa/h` : null} />
            <Stat label="Light level" value={lc?.label ?? "—"} color={lc?.color} sub={lux != null ? `${fmt(lux, 0)} lux` : null} />
            <Stat label="UV level" value={uc?.label ?? "—"} color={uc?.color} sub="Approximate until calibrated" />
            <Stat label="Estimated altitude" value={alt != null ? `${alt.toFixed(0)} m` : "—"} sub={`Assumes sea-level ${SEA_LEVEL_HPA} hPa`} />
            <Stat label="DHT22 minus BMP280" value={tempOffset != null ? `${tempOffset >= 0 ? "+" : ""}${tempOffset.toFixed(2)} °C` : "—"} sub="Average offset" />
          </Box>
        </Panel>

        <Panel title="Rain and wetness" subtitle="Surface wetness from the analog sensor, not rainfall volume">
          <Box sx={statGrid}>
            <Stat label="Time wet" value={fmtDuration(wet.wetMs)} sub={`${wet.wetPct.toFixed(1)}% of the range`} />
            <Stat label="Wet events" value={wet.events} sub={`Longest ${fmtDuration(wet.longest)}`} />
            <Stat label="Last wet" value={wet.lastWet ? fmtClock(wet.lastWet) : "None in range"} />
          </Box>
          <Stack spacing={1} sx={{ mt: 2 }}>
            {RAIN_LEVELS.map((l) => {
              const pct = wet.covered ? (wet.byLevel[l.level] / wet.covered) * 100 : 0;
              return (
                <Box key={l.level}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">{l.label}</Typography>
                    <Typography variant="body2" color="text.secondary">{fmtDuration(wet.byLevel[l.level])} · {pct.toFixed(0)}%</Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={pct} sx={{ height: 6, borderRadius: 3, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: l.color } }} />
                </Box>
              );
            })}
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {pwd.diff == null
              ? "Pressure during wet vs dry periods needs both wet and dry readings in this range."
              : `Average pressure was ${pwd.wetAvg.toFixed(1)} hPa when wet and ${pwd.dryAvg.toFixed(1)} hPa when dry (${pwd.diff >= 0 ? "+" : ""}${pwd.diff.toFixed(2)} hPa).`}
          </Typography>
        </Panel>
      </Box>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" } }}>
        <Panel title="Temperature vs humidity" action={<Chip size="small" label={rTH == null ? "r = —" : `r = ${rTH.toFixed(2)}`} />}
          subtitle={describeCorrelation(rTH)}>
          <ScatterPlot data={thData} xKey="temp" yKey="hum" xName="Temperature" yName="Humidity" xUnit="°C" yUnit="%" color={METRICS.temp.color} />
        </Panel>
        <Panel title="Light vs UV" action={<Chip size="small" label={rLU == null ? "r = —" : `r = ${rLU.toFixed(2)}`} />}
          subtitle={describeCorrelation(rLU)}>
          <ScatterPlot data={luData} xKey="lux" yKey="uv" xName="Light" yName="UV index" xUnit="lux" yUnit="UVI" color={METRICS.uv.color} />
        </Panel>
      </Box>
      <Typography variant="caption" color="text.secondary">
        r is the Pearson correlation (-1 to +1). A relationship in a short window does not prove cause, and DHT22/BMP280 temperature agreement was r = {rTT == null ? "—" : rTT.toFixed(2)}.
      </Typography>

      {quality && (
        <Panel title="Data quality">
          <Box sx={statGrid}>
            <Stat label="Readings" value={`${quality.count} / ~${quality.expected}`} sub="Received vs expected at 20 s" />
            <Stat label="Completeness" value={`${quality.completeness.toFixed(0)}%`} />
            <Stat label="Upload gaps" value={quality.gaps} sub={quality.gaps ? `Longest ${fmtDuration(quality.longestGap)}` : "None"} />
          </Box>
        </Panel>
      )}
    </Stack>
  );
}
