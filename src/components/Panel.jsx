import { Box, Card, CardContent, Stack, Typography } from "@mui/material";

export default function Panel({ title, subtitle, action, children, sx }) {
  return (
    <Card sx={sx}>
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
        {(title || action) && (
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} sx={{ mb: 1.5 }}>
            <Box>
              <Typography variant="h6" sx={{ fontSize: 16 }}>{title}</Typography>
              {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
            </Box>
            {action}
          </Stack>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
