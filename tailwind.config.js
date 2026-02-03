/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#F5C518',
          dark: '#D4A817',
          light: '#FFD93D',
        },
        dark: {
          DEFAULT: '#1A1A1A',
          light: '#2D2D2D',
          lighter: '#3D3D3D',
        }
      },
      fontFamily: {
        'regio': ['"Regio Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
