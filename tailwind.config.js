/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./App.js",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.web.{js,jsx,ts,tsx}",
    "./web/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#21634C',
          deep: '#1B3D2F',
        },
        mint: '#E6F0E7',
        surface: '#F7F5F0',
        card: '#FFFFFF',
        ink: {
          DEFAULT: '#1F3A2F',
          muted: '#5F6F67',
          'muted-on-mint': '#55655D',
        },
        protein: '#4A7BA7',
        carb: '#B5832E',
        carbstrong: '#8A611F',
        fat: '#B26B5A',
        barpast: '#9BBBA9',
        warnbg: '#F6EEDB',
        line: '#E4E8E2',
      },
      fontFamily: {
        sans: [
          '"Noto Sans Thai"',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      borderRadius: {
        card: '22px',
        btn: '15px',
        input: '14px',
        icon: '14px',
      },
      boxShadow: {
        soft: '0 4px 16px rgba(31,58,47,.06)',
        lift: '0 8px 28px rgba(31,58,47,.10)',
      },
      maxWidth: {
        content: '1180px',
      },
      screens: {
        sm: '600px',
        lg: '1024px',
      },
    },
  },
  plugins: [],
}

