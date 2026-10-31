import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

export default function MetricCard({
  title, icon, value, unit, color, badge, badgeColor, derived, spark, sparkKey, note,
}) {
  return (
    <Card>
      <CardContent sx={{ p: 2.25, "&:last-child": { pb: 2.25 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box sx={{ width: 34, height: 34, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: alpha(color, 0.16), color }}>
              {icon}
            </Box>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>{title}</Typography>
          </Stack>
          {derived && <Chip size="small" variant="outlined" label="Derived" sx={{ height: 20, fontSize: 11 }} />}
        </Stack>

        <Stack direction="row" alignItems="baseline" spacing={0.75} sx={{ mt: 1.5 }}>
          <Typography variant="h4" component="div">{value}</Typography>
          <Typography color="text.secondary" fontWeight={600}>{unit}</Typography>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75, minHeight: 24 }}>
          {badge && (
            <Chip size="small" label={badge} sx={{ height: 22, fontWeight: 600, bgcolor: alpha(badgeColor || color, 0.18), color: badgeColor || color }} />
          )}
          {note && <Typography variant="caption" color="text.secondary">{note}</Typography>}
        </Stack>

        {spark && (
          <Box sx={{ height: 44, mt: 1 }} aria-hidden>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spark} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                <Area type="monotone" dataKey={sparkKey} stroke={color} strokeWidth={2} fill={alpha(color, 0.18)} dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
