module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    screens: {
      sm: '480px',    // Large phone landscape
      md: '768px',    // Tablet portrait
      lg: '1024px',   // Tablet landscape / small laptop
      xl: '1280px',   // Desktop
      '2xl': '1536px',// Large desktop
    },
    extend: {
      colors: {
        graphite: {
          50: '#f8f8f7',
          100: '#f2f1f0',
          200: '#e8e6e3',
          300: '#d9d5cf',
          400: '#b8b0a3',
          500: '#8b8278',
          600: '#6b6358',
          700: '#524a42',
          800: '#3d3531',
          900: '#2a2420',
          950: '#1a1714',
        },
        ivory: {
          50: '#fffdf8',
          100: '#fffbf0',
          200: '#fef8ed',
          300: '#fdf4e3',
          400: '#fce9d1',
          500: '#fce0b8',
          600: '#f5d5a8',
          700: '#e8c489',
          800: '#d9b076',
          900: '#c89a5e',
          950: '#8e6d3a',
        },
        accent: '#d4a574',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        slideIn: 'slideIn 0.3s ease-out',
        slideOut: 'slideOut 0.3s ease-in',
        fadeIn: 'fadeIn 0.2s ease-out',
        shake: 'shake 0.4s ease-in-out',
        numberTick: 'numberTick 0.6s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideOut: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        numberTick: {
          '0%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
