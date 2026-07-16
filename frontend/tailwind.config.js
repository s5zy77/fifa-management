/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      colors: {
        // WCAG Checked colors against slate-900 (#0F172A)
        calm: {
          teal: '#2DD4BF', // Low load text/glow (Passes AA against dark)
          amber: '#FBBF24', // Medium load text/glow (Passes AA against dark)
          red: '#F87171' // High load text/glow (Passes AA against dark)
        },
        slate: {
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155'
        }
      }
    },
  },
  plugins: [],
}
