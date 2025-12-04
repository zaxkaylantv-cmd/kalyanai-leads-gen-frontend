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
        cardSoft: "#f9fbff",
        accent: "#00c2c6",
        accentSoft: "#ccfbf1",
        accentStrong: "#0ea5e9",
        textMain: "#0f172a",
        textMuted: "#6b7280",
        textSoft: "#9ca3af",
        borderSoft: "#e5e7eb",
        dangerSoft: "#fee2e2",
        dangerText: "#b91c1c",
      },
      borderRadius: {
        card: "20px",
        pill: "999px",
      },
      boxShadow: {
        card: "0 14px 45px rgba(15, 23, 42, 0.06)",
        soft: "0 10px 30px rgba(15, 23, 42, 0.04)",
      },
    },
  },
  plugins: [],
};
