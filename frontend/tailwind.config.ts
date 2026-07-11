import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#F5F3FF",
          100: "#EDE9FE",
          200: "#DDD6FE",
          300: "#C4B5FD",
          400: "#A78BFA",
          500: "#7C5CFC",
          600: "#6C3EF4",
          700: "#5B2FD9",
          800: "#4A26B0",
          900: "#3B1F8C",
        },
        canvas: "#FAFAFB",
        ink: {
          900: "#111114",
          700: "#3F3F46",
          500: "#6B7280",
          300: "#D1D5DB",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.08)",
        popover: "0 8px 24px rgba(16, 24, 40, 0.12)",
      },
      borderRadius: {
        xl2: "1rem",
      },
    },
  },
  plugins: [],
};
export default config;
