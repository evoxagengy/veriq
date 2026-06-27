import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#061B35",
          dark: "#031225",
          hover: "#0B2A4D"
        },
        accent: {
          DEFAULT: "#00D6C9",
          dark: "#00AFA6"
        },
        surface: "#FFFFFF",
        canvas: "#F6F8FB",
        border: {
          DEFAULT: "#E2E8F0",
          strong: "#CBD5E1"
        },
        ink: {
          DEFAULT: "#0F172A",
          soft: "#334155",
          muted: "#64748B",
          disabled: "#94A3B8"
        },
        success: "#10B981",
        info: "#0EA5E9",
        warning: "#F59E0B",
        danger: "#EF4444",
        neutral: "#6B7280"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        display: ["var(--font-sora)", "Sora", "sans-serif"]
      },
      boxShadow: {
        card: "0 8px 24px rgba(15, 23, 42, 0.06)",
        soft: "0 4px 14px rgba(15, 23, 42, 0.05)",
        glow: "0 0 0 3px rgba(0, 214, 201, 0.16)"
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px"
      },
      backgroundImage: {
        "veriq-dark": "linear-gradient(135deg, #031225 0%, #061B35 100%)",
        "veriq-brand": "linear-gradient(135deg, #061B35 0%, #003A5C 55%, #00D6C9 100%)",
        "veriq-action": "linear-gradient(135deg, #00D6C9 0%, #0EA5E9 100%)"
      }
    }
  },
  plugins: []
};

export default config;

