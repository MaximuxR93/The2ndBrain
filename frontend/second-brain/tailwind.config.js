import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/store/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Satoshi", "Inter", "General Sans", "system-ui", "sans-serif"],
      },
      colors: {
        accent:   "#7C5CFC",
        "accent-hover": "#8A68FF",
        sb: {
          bg:       "#09090B",
          sidebar:  "#0B0B10",
          card:     "#111116",
          hover:    "#17171E",
        },
      },
      letterSpacing: {
        heading: "-0.04em",
      },
      lineHeight: {
        heading: "1.1",
        body:    "1.6",
      },
      boxShadow: {
        card:    "0 8px 30px rgba(0,0,0,0.28)",
        glow:    "0 0 40px rgba(124,92,252,0.15)",
        "glow-lg":"0 0 60px rgba(124,92,252,0.25)",
        "inner-glow": "inset 0 1px 0 rgba(255,255,255,0.06)",
      },
      backgroundImage: {
        "dot-grid": "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "accent-gradient": "linear-gradient(135deg, #7C5CFC 0%, #6B4EE6 100%)",
      },
      backgroundSize: {
        "dot-32": "32px 32px",
      },
      animation: {
        "fade-up":     "fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) forwards",
        "fade-in":     "fadeIn 0.3s ease forwards",
        "slide-left":  "slideInLeft 0.35s cubic-bezier(0.16,1,0.3,1) forwards",
        "glow-pulse":  "glow-pulse 3s ease-in-out infinite",
        "pulse-slow":  "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "spin-smooth": "spin-smooth 0.8s linear infinite",
        "shimmer":     "shimmer 2s infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        slideInLeft: {
          from: { opacity: "0", transform: "translateX(-12px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(124,92,252,0.15)" },
          "50%":       { boxShadow: "0 0 40px rgba(124,92,252,0.30)" },
        },
        "spin-smooth": {
          to: { transform: "rotate(360deg)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition:  "200% 0" },
        },
      },
      typography: {
        DEFAULT: { css: { maxWidth: "none" } },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
