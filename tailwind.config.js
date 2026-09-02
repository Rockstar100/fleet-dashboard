/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Neutral industrial palette. Status colours live in statusClassification.ts
        // so the "what colour is error" decision has exactly one home.
        surface: {
          0: '#0b0f14',
          1: '#121821',
          2: '#1a2230',
          3: '#232e3f',
        },
        line: '#2b3546',
        ink: {
          hi: '#e8edf4',
          mid: '#a9b6c7',
          lo: '#6b7889',
        },
        accent: '#3fb6a8',
      },
    },
  },
  plugins: [],
};
