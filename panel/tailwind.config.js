/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F6F3EC',
        ink: '#20261F',
        seal: '#A8352E',
        'seal-dark': '#7E241F',
        brass: '#B08D3E',
        moss: '#3F5B44',
        line: '#D8D0BC',
      },
      fontFamily: {
        display: ['"Vazirmatn"', 'sans-serif'],
        body: ['"Vazirmatn"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        stamp: '50%',
      },
    },
  },
  plugins: [],
};
