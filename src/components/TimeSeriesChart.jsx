import { Paper, Stack, Typography, Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Area, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer,
  Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis,
} from "recharts";
import { fmt, fmtDateTime, fmtTick } from "../utils/format";

function ChartTooltip({ active, payload, label, seriesMap }) {
  if (!active || !payload?.length) return null;
  return (
    <Paper elevation={6} sx={{ p: 1.25, border: 1, borderColor: "divider" }}>
      <Typography variant="caption" color="text.secondary">{fmtDateTime(label)}</Typography>
      {payload.map((p) => {
        const s = seriesMap[p.dataKey];
        return (
          <Stack key={p.dataKey} direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: p.color }} />
            <Typography variant="body2">
              {p.name}: <b>{fmt(p.value, s?.decimals ?? 1)}</b> {s?.unit}
            </Typography>
          </Stack>
        );
      })}
    </Paper>
  );
}

/**
 * series: [{ key, name, color, unit, decimals, type: "area"|"line", axis: "left"|"right" }]
 * refLines: [{ y, label, color }]
 */
export default function TimeSeriesChart({
  id, data, series, height = 280, leftDomain, rightDomain, refLines = [], span, timeDomain,
}) {
  const theme = useTheme();
  const grid = theme.palette.divider;
  const text = theme.palette.text.secondary;
  const seriesMap = Object.fromEntries(series.map((s) => [s.key, s]));
  const hasRight = series.some((s) => s.axis === "right");

  if (!data.length) {
    return <Typography color="text.secondary" sx={{ py: 6, textAlign: "center" }}>No data in this range.</Typography>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: hasRight ? 0 : 12, left: -10, bottom: 0 }}>
        <defs>
          {series.filter((s) => s.type === "area").map((s) => (
            <linearGradient key={s.key} id={`${id}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="time" type="number" scale="time" domain={timeDomain || ["dataMin", "dataMax"]}
          tickFormatter={(t) => fmtTick(t, span)} tick={{ fill: text, fontSize: 11 }}
          stroke={grid} minTickGap={48}
        />
        <YAxis
          yAxisId="left"
          domain={leftDomain || ["auto", "auto"]}
          allowDataOverflow={false}
          tick={{ fill: text, fontSize: 11 }}
          stroke={grid}
          width={50}
          tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${Math.round(v / 100) / 10}k` : Math.round(v * 10) / 10)}
        />
        {hasRight && (
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={rightDomain || ["auto", "auto"]}
            allowDataOverflow={false}
            tick={{ fill: text, fontSize: 11 }}
            stroke={grid}
            width={44}
          />
        )}
        <Tooltip content={<ChartTooltip seriesMap={seriesMap} />} />
        <Legend verticalAlign="top" height={30} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        {refLines.map((r) => (
          <ReferenceLine key={r.y} yAxisId="left" y={r.y} stroke={r.color || text} strokeDasharray="4 4"
            label={{ value: r.label, fill: r.color || text, fontSize: 10, position: "insideTopRight" }} />
        ))}
        {series.map((s) =>
          s.type === "area" ? (
            <Area key={s.key} yAxisId={s.axis || "left"} type="monotone" dataKey={s.key} name={s.name}
              stroke={s.color} strokeWidth={2} fill={`url(#${id}-${s.key})`} dot={false} isAnimationActive={false} />
          ) : (
            <Line key={s.key} yAxisId={s.axis || "left"} type="monotone" dataKey={s.key} name={s.name}
              stroke={s.color} strokeWidth={2} dot={false} isAnimationActive={false} />
          )
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function ScatterPlot({ data, xKey, yKey, xName, yName, xUnit, yUnit, color, height = 250 }) {
  const theme = useTheme();
  const grid = theme.palette.divider;
  const text = theme.palette.text.secondary;
  if (data.length < 5) {
    return <Typography color="text.secondary" sx={{ py: 6, textAlign: "center" }}>Not enough data yet.</Typography>;
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 8, right: 12, left: -6, bottom: 4 }}>
        <CartesianGrid stroke={grid} strokeDasharray="3 3" />
        <XAxis type="number" dataKey={xKey} name={xName} unit={` ${xUnit}`} domain={["auto", "auto"]} tick={{ fill: text, fontSize: 11 }} stroke={grid}
          tickFormatter={(v) => Math.round(v * 10) / 10} />
        <YAxis type="number" dataKey={yKey} name={yName} unit={` ${yUnit}`} domain={["auto", "auto"]} tick={{ fill: text, fontSize: 11 }} stroke={grid} width={52}
          tickFormatter={(v) => Math.round(v * 10) / 10} />
        <ZAxis range={[28, 28]} />
        <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(v) => (typeof v === "number" ? v.toFixed(2) : v)} />
        <Scatter data={data} fill={color} fillOpacity={0.55} isAnimationActive={false} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
