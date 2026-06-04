/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        // --- BASE SURFACES ---
        surface: {
          DEFAULT: '#e8f0fe', // More distinct blue tint
          dim: '#d1dff7',
          bright: '#f0f6ff',
          container: '#dce8ff',
          lowest: '#ffffff',
          low: '#e8f0fe',
          high: '#c5d7f2',
          highest: '#b8cceb',
        },
        'on-surface': {
          DEFAULT: '#181c1f',
          variant: '#444750',
        },
        
        // --- BRAND COLORS ---
        primary: {
          DEFAULT: '#001336',
          container: '#02275d', // IPB Navy (Main Authority Color)
        },
        'on-primary': {
          DEFAULT: '#ffffff',
          container: '#7690cc',
        },
        secondary: {
          DEFAULT: '#00687a',
          container: '#57dffe', // Electric Cyan (Main Action Accent)
        },
        'on-secondary': {
          DEFAULT: '#ffffff',
          container: '#006172',
        },

        // --- SEMANTIC COLORS (Aksen & Notifications) ---
        accent: '#06B6D4',
        warning: '#F59E0B', 
        danger: '#EF4444',  // Error/Destructive Action
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',
      },
      boxShadow: {
        // Ambient Shadow (Blur 15px, Y 4px, base color #02275d with 5% opacity)
        'ambient': '0 4px 15px rgba(2, 39, 93, 0.05)',
      },
      borderRadius: {
        'card': '12px', // Untuk layout cards
        'btn': '8px',   // Untuk tombol dan input field
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translate3d(0, 16px, 0)', opacity: '0' },
          '100%': { transform: 'translate3d(0, 0, 0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleUp: {
          '0%': { transform: 'scale(0.9) translateY(10px)', opacity: '0' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
        }
      },
      animation: {
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fadeIn 0.2s ease-out both',
        'scale-up': 'scaleUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both',
      }
    },
  },
  plugins: [],
}