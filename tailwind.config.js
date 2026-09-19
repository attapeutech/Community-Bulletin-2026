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
        ce: {
          ground: "#07080b",   // page background
          screen: "#05060a",   // inside the simulated panel
          slot: "#0a0c11",     // ad slot backdrop
          surface: "#0d0f14",  // raised chips / cards
          card: "#0b0d11",     // flow step cells
          panel: "#0c0e12",    // nav pill, toggle track
          raised: "#0e1116",   // secondary button face

          line: "#14171c",     // section dividers
          line2: "#1a1d23",    // hairlines inside sections
          line3: "#1e2128",    // card borders
          line4: "#23262e",    // stronger borders
          line5: "#2a2e37",    // button outlines
          line6: "#2c3039",    // panel bezel
          line7: "#2f333d",    // CTA outline
          line8: "#191c22",    // nav underline

          text: "#f2f4f7",     // primary copy
          text2: "#e8ecf2",    // button copy
          text3: "#e4e8ee",    // nav button copy
          text4: "#c6ccd6",    // chip copy
          muted: "#9aa3b2",    // body copy
          muted2: "#8b93a1",   // flow copy / inactive tab
          muted3: "#7d8593",   // stat captions
          muted4: "#6b7382",   // meta text
          muted5: "#5f6774",   // footer labels

          accent: "#3ee6d1",       // primary teal
          accentLight: "#8ef6e9",  // link hover
          accentBright: "#5cf0dd", // gradient start
          accentDeep: "#2ad3bf",   // gradient end
          accentDeeper: "#26cdb9", // CTA gradient end
          accentPale: "#7ef0e0",   // eyebrow text
          onAccent: "#04100e",     // copy on teal

          blue: "#4f7cff",      // logo gradient partner
          blueLight: "#9db0ff", // hosts eyebrow
          blueSoft: "#8ea6ff",  // hosts slot badge
          blueTint: "#7c9dff",  // headline gradient end
          amber: "#f0b07e",     // third slot accent
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
