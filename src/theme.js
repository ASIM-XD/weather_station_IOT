import { createTheme } from "@mui/material/styles";

export const getTheme = (mode) => {
  const dark = mode === "dark";
  return createTheme({
    palette: {
      mode,
      primary: { main: dark ? "#5cc8ff" : "#0b7bc4" },
      secondary: { main: "#ff9a62" },
      background: dark
        ? { default: "#0c1822", paper: "#12222f" }
        : { default: "#eef3f7", paper: "#ffffff" },
      divider: dark ? "rgba(160,200,230,0.14)" : "rgba(20,50,80,0.12)",
    },
    shape: { borderRadius: 14 },
    typography: {
      fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
      h4: { fontWeight: 800, letterSpacing: "-0.02em" },
      h5: { fontWeight: 800, letterSpacing: "-0.01em" },
      h6: { fontWeight: 700 },
      button: { textTransform: "none", fontWeight: 600 },
    },
    components: {
      MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundImage: "none",
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: "none",
          }),
        },
      },
      MuiTab: { styleOverrides: { root: { textTransform: "none", fontWeight: 600 } } },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: "50%",
          },
        },
      },
    },
  });
};
