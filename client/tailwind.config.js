/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#F7F8FA",
        surface: "#FFFFFF",
        primary: "#1F2937",
        muted: "#6B7280",
        border: "#E5E7EB",
        accent: "#0EA5A4",
        accentHover: "#0B8F8A",
        error: "#DC2626",
        success: "#16A34A",
      },
    },
  }
,
  plugins: [],
}