import {
  Alert, Box, Chip, Link, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from "@mui/material";
import { useMemo } from "react";
import { CHANNEL_ID, CHANNEL_URL, METRICS } from "../config";
import { sensorHealth } from "../utils/analytics";
import { fmt, fmtDateTime, timeAgo } from "../utils/format";
import Panel from "./Panel";

export default function Sensors({ feeds, now, channel }) {
  const health = useMemo(() => sensorHealth(feeds), [feeds]);
  const recent = useMemo(() => feeds.slice(-20).reverse(), [feeds]);

  return (
    <Stack spacing={2}>
      <Panel title="Sensor health" subtitle="Based on the readings loaded for the selected range">
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Sensor</TableCell>
                <TableCell>Measures</TableCell>
                <TableCell>Connection</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Last value</TableCell>
                <TableCell align="right">Availability</TableCell>
                <TableCell align="right">Out of range</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {health.map((s) => {
                const status = !s.lastSeen ? { l: "No data", c: "error" } : s.latestOk ? { l: "OK", c: "success" } : { l: "Missing latest", c: "warning" };
                return (
                  <TableRow key={s.id}>
                    <TableCell sx={{ fontWeight: 600 }}>{s.name}</TableCell>
                    <TableCell>{s.measures}</TableCell>
                    <TableCell>{s.bus}</TableCell>
                    <TableCell><Chip size="small" color={status.c} variant="outlined" label={status.l} /></TableCell>
                    <TableCell align="right">{s.lastSeen ? timeAgo(s.lastSeen, now) : "—"}</TableCell>
                    <TableCell align="right">{s.availability.toFixed(0)}%</TableCell>
                    <TableCell align="right">{s.suspect}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </Panel>

      <Panel title="Latest 20 readings" subtitle="Empty cells mean the sensor sent no value">
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                {Object.values(METRICS).map((m) => (
                  <TableCell key={m.label} align="right">{m.short} ({m.unit})</TableCell>
                ))}
                <TableCell>Wetness (derived)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recent.map((f) => (
                <TableRow key={f.entryId ?? f.time}>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{fmtDateTime(f.time)}</TableCell>
                  {Object.entries(METRICS).map(([k, m]) => (
                    <TableCell key={k} align="right">{fmt(f[k], m.decimals)}</TableCell>
                  ))}
                  <TableCell>
                    {f.rain ? <Chip size="small" label={f.rain.label} sx={{ bgcolor: `${f.rain.color}26`, color: f.rain.color, fontWeight: 600 }} /> : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Panel>

      <Panel title="About this data">
        <Stack spacing={1}>
          <Typography variant="body2">
            Source: ThingSpeak channel{" "}
            <Link href={CHANNEL_URL} target="_blank" rel="noreferrer">{channel?.name || CHANNEL_ID}</Link>{" "}
            (ID {CHANNEL_ID}), updated about every 20 seconds.
          </Typography>
          <Alert severity="info" variant="outlined">The rain sensor measures surface wetness, not rainfall volume. Categories are experimental.</Alert>
          <Alert severity="info" variant="outlined">The UV index is approximate and should be calibrated before being treated as precise.</Alert>
          <Alert severity="info" variant="outlined">Dew point, feels-like, comfort, pressure trend, altitude and wetness durations are calculated in the browser, not measured.</Alert>
        </Stack>
      </Panel>
    </Stack>
  );
}
