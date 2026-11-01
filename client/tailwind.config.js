/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F1F7F7',
          100: '#D5E5E5',
          200: '#B0D7D8',
          300: '#7DA0CA',
          400: '#5483B3',
          500: '#052659',
          600: '#021024',
          700: '#021024',
          800: '#11212D',
          900: '#081726',
          950: '#020A14',
        },
        accent: {
          50: '#F7CBCA',
          100: '#DFB6B2',
          200: '#854F6C',
          500: '#522B5B',
          600: '#2B124C',
          700: '#190019',
        },
        dukkan: {
          midnight: '#021024',
          navy: '#052659',
          azure: '#5483B3',
          sky: '#7DA0CA',
          currant: '#190019',
          violet: '#2B124C',
          plum: '#522B5B',
          mulberry: '#854F6C',
          dustyRose: '#DFB6B2',
          steel: '#11212D',
          slate: '#253745',
          harbor: '#4A5C6A',
          blush: '#F7CBCA',
          silk: '#DDD3D3',
          ice: '#F1F7F7',
          mist: '#D5E5E5',
          cyan: '#B0D7D8',
          espresso: '#1A120E',
          darkOak: '#3A2418',
          hazel: '#6B4A2C',
          caramel: '#A88462',
          pine: '#1E3A2E',
          moss: '#3E5A3F',
          leaf: '#6B7F67',
        },
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(2, 16, 36, 0.12)',
        'glass-glow': '0 0 25px -3px rgba(84, 131, 179, 0.3)',
        'glass-hover': '0 14px 40px -5px rgba(2, 16, 36, 0.2)',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif'
        ],
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out forwards',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-subtle': 'pulseSubtle 2s infinite',
        'float-slow': 'floatSlow 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      }
    },
  },
  plugins: [],
};
