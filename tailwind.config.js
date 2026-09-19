/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // ---- CastEZ redesign tokens (castez-handoff/CastEZ Landing.dc.html) ----
        // Namespaced under `ce` so they never collide with the shadcn scale above.
        // CastEZ tokens. Values live as HSL triplets in globals.css so the
        // whole palette responds to the light/dark class and Tailwind opacity
        // modifiers (bg-ce-accent/30) keep working.
        ce: {
          ground: "hsl(var(--ce-ground) / <alpha-value>)",
          surface: "hsl(var(--ce-surface) / <alpha-value>)",
          card: "hsl(var(--ce-card) / <alpha-value>)",
          panel: "hsl(var(--ce-panel) / <alpha-value>)",
          raised: "hsl(var(--ce-raised) / <alpha-value>)",
          header: "hsl(var(--ce-header) / <alpha-value>)",
          screen: "hsl(var(--ce-screen) / <alpha-value>)",
          slot: "hsl(var(--ce-slot) / <alpha-value>)",
          line: "hsl(var(--ce-line) / <alpha-value>)",
          line2: "hsl(var(--ce-line2) / <alpha-value>)",
          line3: "hsl(var(--ce-line3) / <alpha-value>)",
          line4: "hsl(var(--ce-line4) / <alpha-value>)",
          line5: "hsl(var(--ce-line5) / <alpha-value>)",
          line6: "hsl(var(--ce-line6) / <alpha-value>)",
          line7: "hsl(var(--ce-line7) / <alpha-value>)",
          line8: "hsl(var(--ce-line8) / <alpha-value>)",
          text: "hsl(var(--ce-text) / <alpha-value>)",
          text2: "hsl(var(--ce-text2) / <alpha-value>)",
          text3: "hsl(var(--ce-text3) / <alpha-value>)",
          text4: "hsl(var(--ce-text4) / <alpha-value>)",
          muted: "hsl(var(--ce-muted) / <alpha-value>)",
          muted2: "hsl(var(--ce-muted2) / <alpha-value>)",
          muted3: "hsl(var(--ce-muted3) / <alpha-value>)",
          muted4: "hsl(var(--ce-muted4) / <alpha-value>)",
          muted5: "hsl(var(--ce-muted5) / <alpha-value>)",
          accent: "hsl(var(--ce-accent) / <alpha-value>)",
          accentLight: "hsl(var(--ce-accent-light) / <alpha-value>)",
          accentBright: "hsl(var(--ce-accent-bright) / <alpha-value>)",
          accentDeep: "hsl(var(--ce-accent-deep) / <alpha-value>)",
          accentDeeper: "hsl(var(--ce-accent-deeper) / <alpha-value>)",
          accentPale: "hsl(var(--ce-accent-pale) / <alpha-value>)",
          onAccent: "hsl(var(--ce-on-accent) / <alpha-value>)",
          blue: "hsl(var(--ce-blue) / <alpha-value>)",
          blueLight: "hsl(var(--ce-blue-light) / <alpha-value>)",
          blueSoft: "hsl(var(--ce-blue-soft) / <alpha-value>)",
          blueTint: "hsl(var(--ce-blue-tint) / <alpha-value>)",
          amber: "hsl(var(--ce-amber) / <alpha-value>)",
        },
      },
      fontFamily: {
        // Namespaced: does not override the global sans/mono used elsewhere.
        "ce-display": ["var(--font-space-grotesk)", "sans-serif"],
        "ce-body": ["var(--font-manrope)", "system-ui", "sans-serif"],
        "ce-mono": ["var(--font-ibm-plex-mono)", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "ce-pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: ".35", transform: "scale(1.5)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "ce-pulse": "ce-pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
