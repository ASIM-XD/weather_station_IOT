import { Box, Typography } from "@mui/material";
import { useMemo } from "react";
import { METRICS } from "../config";
import { downsample, RAIN_LEVELS } from "../utils/analytics";
import Panel from "./Panel";
import TimeSeriesChart from "./TimeSeriesChart";

const M = METRICS;
const ser = (key, type = "area", axis = "left", name) => ({
  key, name: name || M[key].short, color: M[key].color, unit: M[key].unit, decimals: M[key].decimals, type, axis,
});

const grid = { display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" } };

export default function Charts({ feeds, range, variant = "full" }) {
  const data = useMemo(() => downsample(feeds, 400), [feeds]);
  const span = useMemo(() => {
    if (range?.durationMs) return range.durationMs;
    return feeds.length > 1 ? feeds[feeds.length - 1].time - feeds[0].time : 0;
  }, [feeds, range]);

  const timeDomain = useMemo(() => {
    if (!feeds.length) return ["dataMin", "dataMax"];
    if (range?.durationMs) {
      const maxTime = feeds[feeds.length - 1].time;
      return [maxTime - range.durationMs, maxTime];
    }
    return ["dataMin", "dataMax"];
  }, [feeds, range]);

  const tempHum = (
    <Panel key="th" title="Temperature and humidity" subtitle="DHT22">
      <TimeSeriesChart id="th" data={data} span={span} timeDomain={timeDomain}
        series={[ser("temp", "area", "left", "Temperature"), ser("hum", "line", "right", "Humidity")]} />
    </Panel>
  );
  const rain = (
    <Panel key="rain" title="Rain sensor voltage" subtitle="Lower voltage means a wetter sensor surface. Dashed lines mark the category limits.">
      <TimeSeriesChart
        id="rain"
        data={data}
        span={span}
        timeDomain={timeDomain}
        leftDomain={[
          (dataMin) => (Number.isFinite(dataMin) ? Math.min(0, dataMin) : 0),
          (dataMax) => (Number.isFinite(dataMax) ? Math.max(3.5, dataMax) : 3.5),
        ]}
        series={[ser("rainV", "area", "left", "Voltage")]}
        refLines={[
          { y: 2.5, label: "No rain above", color: RAIN_LEVELS[0].color },
          { y: 2.0, label: "Extremely light", color: RAIN_LEVELS[1].color },
          { y: 1.0, label: "Heavy below", color: RAIN_LEVELS[3].color },
        ]} />
    </Panel>
  );

  if (variant === "overview") {
    return <Box sx={grid}>{tempHum}{rain}</Box>;
  }

  return (
    <Box sx={grid}>
      {tempHum}
      <Panel title="Atmospheric pressure" subtitle="BMP280">
        <TimeSeriesChart id="pr" data={data} span={span} timeDomain={timeDomain} series={[ser("pressure", "area")]} />
      </Panel>
      <Panel title="Light and UV" subtitle="BH1750 (lux) and LTR390 (UV index, approximate)">
        <TimeSeriesChart id="lu" data={data} span={span} timeDomain={timeDomain}
          series={[ser("lux", "area", "left", "Light"), ser("uv", "line", "right", "UV index")]} />
      </Panel>
      {rain}
      <Panel title="Temperature sensor comparison" subtitle="DHT22 vs BMP280. A large, steady gap points to placement or self-heating issues.">
        <TimeSeriesChart id="cmp" data={data} span={span} timeDomain={timeDomain}
          series={[ser("temp", "line", "left", "DHT22"), ser("bmpTemp", "line", "left", "BMP280")]} />
      </Panel>
      <Panel title="About these charts">
        <Typography variant="body2" color="text.secondary">
          Long ranges are averaged into about 400 points so charts stay fast. Gaps in a line mean the
          sensor sent no value at that time; nothing is filled in or estimated.
        </Typography>
      </Panel>
    </Box>
  );
}
