/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'Fraunces', 'Georgia', 'serif'],
        script: ['"Alex Brush"', 'cursive'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#faf6f0',
          100: '#f5ebdc',
          200: '#ead7bd',
          300: '#ddbc95',
          400: '#ce9c69',
          500: '#b87d44',
          600: '#8e4b21', // warm rich roast chestnut
          700: '#733b1b',
          800: '#5a2e16',
          900: '#3a1f10',
          950: '#1e0f07',
        },
        forest: {
          50: '#f3f7f2',
          100: '#e1ecdf',
          200: '#c5dac2',
          300: '#9ec099',
          400: '#6f9d67',
          500: '#487c42',
          600: '#366232',
          700: '#2b4d27',
          800: '#243e22',
          900: '#1d321c',
          950: '#0e1b0d',
        },
        cream: {
          50: '#fefdfa',
          100: '#faf7f2',
          200: '#f3ece1',
          300: '#e8dcce',
          400: '#d9c7b2',
        },
        gold: {
          50: '#fffbf0',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#d97706',
          600: '#b45309',
        },
      },
      boxShadow: {
        'luxury': '0 10px 30px -10px rgba(60, 30, 15, 0.08), 0 4px 6px -2px rgba(60, 30, 15, 0.04)',
        'luxury-lg': '0 20px 40px -15px rgba(60, 30, 15, 0.12), 0 8px 16px -4px rgba(60, 30, 15, 0.06)',
        'luxury-xl': '0 25px 60px -15px rgba(60, 30, 15, 0.20)',
        'glow': '0 0 25px rgba(184, 125, 68, 0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-subtle': 'pulseSubtle 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
      },
    },
  },
  plugins: [],
};
