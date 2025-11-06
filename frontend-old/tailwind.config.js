/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0a0a0a',
        secondary: '#1a1a1a',
        accent: '#00ffff',
        glow: '#00ffff',
      },
      animation: {
        'subtle-float': 'subtle-float 8s ease-in-out infinite',
        'aurora': 'aurora 20s ease-in-out infinite alternate',
        'sparkle': 'sparkle 5s ease-in-out infinite alternate',
      },
      keyframes: {
        'subtle-float': {
          '0%, 100%': { transform: 'translateY(0) translateX(0)' },
          '50%': { transform: 'translateY(-10px) translateX(5px)' },
        },
        aurora: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        sparkle: {
          '0%, 100%': { opacity: '0.2', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
      },
    },
  },
  plugins: [],
}

