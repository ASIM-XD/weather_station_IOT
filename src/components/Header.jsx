import {
  Box, Button, Chip, FormControl, FormControlLabel, IconButton, MenuItem, Select, Stack, Switch, Tooltip, Typography,
} from "@mui/material";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadIcon from "@mui/icons-material/Download";
import { RANGES } from "../config";
import { timeAgo } from "../utils/format";

export default function Header({
  status, lastTime, now, count, range, onRange, auto, onAuto, onReload, onExport, mode, onToggleMode, loading, disabledExport,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        justifyContent: "space-between",
        alignItems: { xs: "flex-start", md: "center" },
        width: "100%",
        gap: 2,
        mb: 2.5,
      }}
    >
      <Box>
        <Typography variant="h4" component="h1">Weather Station</Typography>
        <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1.25, mt: 0.75, flexWrap: "wrap" }}>
          <Chip
            size="small"
            label={status.label}
            sx={{ fontWeight: 700, bgcolor: `${status.color}26`, color: status.color }}
            icon={
              <Box component="span" sx={{
                width: 8, height: 8, borderRadius: "50%", bgcolor: status.color, color: status.color,
                ml: "8px !important", animation: status.label === "Live" ? "pulse-dot 2s infinite" : "none",
              }} />
            }
          />
          <Typography variant="body2" color="text.secondary">
            {lastTime ? `Last reading ${timeAgo(lastTime, now)}` : "Waiting for data"}
            {count != null ? ` · ${count} readings in view` : ""}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 1.25,
          flexWrap: "wrap",
          ml: "auto",
          alignSelf: { xs: "flex-end", md: "center" },
          justifyContent: "flex-end",
        }}
      >
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <Select
            value={range}
            onChange={(e) => onRange(e.target.value)}
            inputProps={{ "aria-label": "Time range" }}
            sx={{
              height: 40,
              borderRadius: 2,
              "& .MuiSelect-select": {
                display: "flex",
                alignItems: "center",
                py: 0,
                height: 40,
                boxSizing: "border-box",
              },
            }}
          >
            {RANGES.map((r) => <MenuItem key={r.id} value={r.id}>{r.label}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControlLabel
          control={<Switch size="small" checked={auto} onChange={(e) => onAuto(e.target.checked)} />}
          label={<Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>Auto refresh</Typography>}
          sx={{
            m: 0,
            height: 40,
            px: 1.25,
            borderRadius: 2,
            border: 1,
            borderColor: "divider",
            bgcolor: "action.hover",
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
          }}
        />

        <Tooltip title="Refresh now">
          <Box component="span" sx={{ display: "inline-flex", alignItems: "center" }}>
            <IconButton
              onClick={onReload}
              disabled={loading}
              aria-label="Refresh now"
              sx={{
                width: 40,
                height: 40,
                minWidth: 40,
                maxWidth: 40,
                minHeight: 40,
                maxHeight: 40,
                p: 0,
                borderRadius: "50% !important",
                flexShrink: 0,
                border: 1,
                borderColor: "divider",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                "&:hover": { borderRadius: "50% !important" },
              }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Box>
        </Tooltip>

        <Button
          variant="outlined"
          size="small"
          startIcon={<DownloadIcon fontSize="small" />}
          onClick={onExport}
          disabled={disabledExport}
          sx={{
            height: 40,
            px: 2,
            borderRadius: 2,
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          Export CSV
        </Button>

        <Tooltip title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
          <IconButton
            onClick={onToggleMode}
            aria-label="Toggle theme"
            sx={{
              width: 40,
              height: 40,
              minWidth: 40,
              maxWidth: 40,
              minHeight: 40,
              maxHeight: 40,
              p: 0,
              borderRadius: "50% !important",
              flexShrink: 0,
              border: 1,
              borderColor: "divider",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              "& .MuiTouchRipple-root": {
                borderRadius: "50%",
              },
              "&:hover": {
                borderRadius: "50% !important",
              },
            }}
          >
            {mode === "dark" ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
