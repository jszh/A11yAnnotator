/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'brand-dark': '#111827',
        'brand-dark-soft': '#1f2937',
        'brand-blue': '#1d4ed8',
        'brand-blue-soft': '#60a5fa',
        accent: '#fbbf24',
        prime: '#0ea5e9',
      },
      boxShadow: {
        soft: '0 8px 24px rgba(15, 23, 42, 0.08)',
        card: '0 2px 10px rgba(15, 23, 42, 0.08)',
      },
      borderRadius: {
        xl2: '16px',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Helvetica Neue', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
