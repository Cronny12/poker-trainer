/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        velvet: {
          green: {
            900: '#062217',
            800: '#0B3A28',
            700: '#11573B',
            600: '#1D7A57',
            500: '#2FA070'
          },
          red: {
            900: '#2B0A12',
            800: '#4F1223',
            700: '#7A1A34',
            600: '#A12447',
            500: '#C9365A'
          },
          gold: '#E8B764'
        }
      },
      keyframes: {
        'fade-slide-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 rgba(201,54,90,0.0)' },
          '50%': { boxShadow: '0 0 28px rgba(201,54,90,0.35)' }
        }
      },
      animation: {
        'fade-slide-up': 'fade-slide-up 0.55s ease-out both',
        pulseGlow: 'pulseGlow 2.6s ease-in-out infinite'
      },
      fontFamily: {
        display: ['"Sora"', 'ui-sans-serif', 'system-ui'],
        body: ['"Work Sans"', 'ui-sans-serif', 'system-ui']
      }
    }
  },
  plugins: []
};
