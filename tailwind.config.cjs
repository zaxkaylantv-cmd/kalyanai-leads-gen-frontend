/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pageBg: "#f5fbff",
        cardBg: "#ffffff",
        leadOrange: "#ff6a3c",
        leadOrangeSoft: "#ffe4d6",
        leadGreen: "#49a682",
        leadGreenSoft: "#d6f2e7",
        leadGold: "#c68a3c",
        leadGoldSoft: "#f6e7cf",
        textMain: "#0f172a",
        textMuted: "#6b7280",
        borderSoft: "#e5e7eb",
      },
      borderRadius: {
        card: "20px",
        pill: "999px",
      },
      boxShadow: {
        card: "0 18px 45px rgba(15, 23, 42, 0.06)",
        soft: "0 12px 30px rgba(15, 23, 42, 0.04)",
      },
    },
  },
  plugins: [],
};
