/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        sans:    ['Outfit', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50: '#f7fee7',
          100: '#ecfccb',
          200: '#d9f99d',
          300: '#bef264',
          400: '#a3e635',
          500: '#84cc16',
          600: '#65a30d',
          700: '#4d7c0f',
          800: '#3f6212',
          900: '#365314',
        },
        sidebar: '#09090b', // Deep zinc-950 for sidebar
        'sidebar-hover': '#18181b', // Zinc-900
        'sidebar-active': 'rgba(132,204,22,0.1)', // Lime active state
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        soft:   '0 8px 30px rgba(0,0,0,0.04)',
        kpi:    '0 10px 30px rgba(0,0,0,0.03)',
        card:   '0 12px 40px -10px rgba(0,0,0,0.08)',
        modal:  '0 25px 60px -12px rgba(0,0,0,0.3)',
        brand:  '0 8px 25px rgba(132,204,22,0.35)',
        'card-hover': '0 20px 40px -10px rgba(0,0,0,0.12)',
      },
      animation: {
        'fade-in':   'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1)',
        'slide-up':  'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
        'slide-in':  'slideIn 0.3s cubic-bezier(0.16,1,0.3,1)',
        'pulse-soft':'pulseSoft 2.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        fadeInUp:  { '0%': { transform: 'translateY(20px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
        slideUp:   { '0%': { transform: 'translateY(16px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
        slideIn:   { '0%': { transform: 'translateX(100%)', opacity: 0 }, '100%': { transform: 'translateX(0)', opacity: 1 } },
        pulseSoft: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.7 } },
      },
    },
  },
  plugins: [],
};
