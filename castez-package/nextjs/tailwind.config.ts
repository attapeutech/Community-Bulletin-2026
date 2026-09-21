import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        ink: "#07080b",
        panel: "#0b0d11",
        hairline: "#1e2128",
        brand: {
          DEFAULT: "#3ee6d1",
          bright: "#5cf0dd",
          deep: "#26cdb9",
          ink: "#04100e",
        },
      },
      boxShadow: {
        glow: "0 14px 40px -12px rgba(62,230,209,0.55), inset 0 1px 0 rgba(255,255,255,0.4)",
        panel: "0 40px 80px -40px rgba(0,0,0,0.9)",
      },
    },
  },
  plugins: [],
};

export default config;
