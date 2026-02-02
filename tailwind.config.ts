import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#4f064fac",
        background: "#F1E9E9",
        primaryHover: "#7a1f87",
      },
      textColor: {
        DEFAULT: "#F1E9E9", 
      },
    },
  },
  plugins: [],
};

export default config;
