/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#2563EB',
          600: '#1D4ED8',
          700: '#1E40AF',
        },
        teal: {
          500: '#0D9488',
          600: '#0F766E',
        },
        severity: {
          mild: '#16A34A',
          moderate: '#D97706',
          severe: '#DC2626',
        },
      },
      fontFamily: {
        bangla: ['NotoSansBengali'],
      },
    },
  },
  plugins: [],
};
