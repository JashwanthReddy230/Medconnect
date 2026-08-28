/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#e0f7f4',
          100: '#b2ece5',
          200: '#80e0d4',
          300: '#4dd4c3',
          400: '#26cab6',
          500: '#00bfa8',
          600: '#00897b',
          700: '#00796b',
          800: '#00695c',
          900: '#004d40',
          950: '#00251a',
        },
        surface: {
          light: '#ffffff',
          dark:  '#0d1b2a',
        },
        muted: {
          light: '#f4f6f8',
          dark:  '#152030',
        },
        card: {
          light: '#ffffff',
          dark:  '#1a2d3f',
        },
        border: {
          light: '#e2e8f0',
          dark:  '#243447',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        btn:  '8px',
      },
      boxShadow: {
        card:  '0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.07)',
        'card-hover': '0 4px 16px 0 rgba(0,0,0,0.10)',
        'card-dark': '0 1px 3px 0 rgba(0,0,0,0.3)',
      },
      animation: {
        'fade-in':   'fadeIn 0.3s ease-in-out',
        'slide-up':  'slideUp 0.3s ease-out',
        'pulse-dot': 'pulseDot 2s infinite',
      },
      keyframes: {
        fadeIn:   { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:  { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pulseDot: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
      },
    },
  },
  plugins: [],
}
