/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "#0b0e14",
        panel: "#11151f",
        panel2: "#161b28",
        border: "#232a3b",
        buy: "#12b886",
        sell: "#f0403e",
        accent: "#3b82f6",
        muted: "#7d879c",
      },
      fontFamily: {
        sans: ["system-ui", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
