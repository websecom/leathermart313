const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist Sans', 'Arial', 'sans-serif']
      },
      colors: {
        ink: '#17211f',
        paper: '#f0f4ed',
        surface: '#fbfcfa',
        'sage-border': '#e3e9e1',
        accent: '#c6f36b',
        'accent-muted': '#9cc94d'
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem'
      },
      boxShadow: {
        'accent-glow': '0 8px 28px rgba(198, 243, 107, 0.45)',
        'dark-glow': '0 8px 28px rgba(23, 44, 39, 0.45)',
        'card-lift': '0 24px 56px rgba(23, 44, 39, 0.13), 0 0 0 1.5px rgba(198, 243, 107, 0.3)'
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 }
        },
        fadeUp: {
          from: { opacity: 0, transform: 'translateY(22px)' },
          to: { opacity: 1, transform: 'translateY(0)' }
        },
        shimmerSweep: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' }
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' }
        },
        blink: {
          '0%': { opacity: 0.2 },
          '20%': { opacity: 1 },
          '100% ': { opacity: 0.2 }
        },
        promoFloat: {
          '0%, 100%': { transform: 'translateY(0) rotate(6deg)' },
          '50%': { transform: 'translateY(-8px) rotate(2deg)' }
        },
        pulseRing: {
          '0%': { transform: 'scale(0.85)', opacity: 1 },
          '80%, 100%': { transform: 'scale(2.4)', opacity: 0 }
        }
      },
      animation: {
        fadeIn: 'fadeIn .3s ease-in-out',
        fadeUp: 'fadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        carousel: 'marquee 60s linear infinite',
        blink: 'blink 1.4s both infinite',
        'promo-float': 'promoFloat 3.5s ease-in-out infinite',
        shimmer: 'shimmerSweep 3s linear infinite',
        'pulse-ring': 'pulseRing 1.8s ease-out infinite'
      }
    }
  },
  future: {
    hoverOnlyWhenSupported: true
  },
  plugins: [
    require('@tailwindcss/container-queries'),
    require('@tailwindcss/typography'),
    plugin(({ matchUtilities, theme }) => {
      matchUtilities(
        {
          'animation-delay': (value) => {
            return {
              'animation-delay': value
            };
          }
        },
        {
          values: theme('transitionDelay')
        }
      );
    })
  ]
};
