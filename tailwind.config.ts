import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        evo: {
          black: "var(--evo-black)",
          bg: "var(--evo-bg)",
          card: "var(--evo-card)",
          deep: "var(--evo-deep)",
          surface: "var(--evo-surface)",
          surface2: "var(--evo-surface2)",
          structural: "var(--evo-structural)",
          support: "var(--evo-support)",
          light: "var(--evo-light)",
          accent: "var(--evo-accent)",
          text: "var(--evo-text)",
          muted: "var(--evo-muted)",
          disabled: "var(--evo-disabled)",
          border: "var(--evo-border)",
          "border-hover": "var(--evo-border-hover)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        heading: ["var(--font-plus-jakarta)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        evo: "20px",
        "evo-sm": "12px",
        "evo-lg": "24px",
      },
      boxShadow: {
        "evo-glow": "0 0 50px -10px rgba(255, 193, 0, 0.06)",
        "evo-card": "0 20px 40px rgba(0, 0, 0, 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
