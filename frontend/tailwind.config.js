/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'forest': '#1a5c38',
        'forest-dark': '#0f3d25',
        'forest-light': '#2d8c4e',
        'leaf': '#2d8c4e',
        'leaf-light': '#4caf6e',
        'leaf-lighter': '#6fcf87',
        'cream': '#faf7f2',
        'cream-dark': '#f0ebe0',
        'cream-darker': '#e5ddd0',
        'charcoal': '#1c1c1e',
        'charcoal-light': '#3a3a3c',
        'charcoal-lighter': '#636366',
        'gold': '#c9a84c',
        'gold-light': '#e8c96a',
        'gold-dark': '#a08030',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 8px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.10)',
        'green': '0 4px 20px rgba(26, 92, 56, 0.20)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}

