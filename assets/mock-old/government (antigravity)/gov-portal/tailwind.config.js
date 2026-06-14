/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          blue: {
            50: '#eef2f6',
            100: '#d9e2ec',
            200: '#b6cbd9',
            300: '#8baec1',
            400: '#5a8ca5',
            500: '#3a708c',
            600: '#2c5671',
            700: '#22445b',
            800: '#1d394c',
            900: '#193040',
          },
          neutral: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a',
          }
        }
      }
    },
  },
  plugins: [],
}

