import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FAF9F7",
        charcoal: "#1A1816",
        gold: "#B8963E",
        "gold-light": "#D4AF5A",
        "gold-dark": "#9A7A2E",
        muted: "#8A8580",
        surface: "#F2F0EC",
        border: "#E8E5DF",
      },
      fontFamily: {
        display: ["var(--font-cormorant)", "Georgia", "serif"],
        body: ["var(--font-noto-sans-kr)", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 12px rgba(26,24,22,0.08)",
        "card-hover": "0 4px 24px rgba(26,24,22,0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
