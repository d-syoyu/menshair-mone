import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // MONË Dark Theme - 光が差すプライベート空間
        dark: {
          DEFAULT: '#161616',
          gray: '#1A1A1A',
          charcoal: '#252525',
        },
        charcoal: '#252525',
        gray: {
          DEFAULT: '#353535',
          medium: '#606060',
        },
        // Light - 光
        light: {
          DEFAULT: 'rgba(255, 252, 245, 0.9)',
          soft: 'rgba(255, 250, 240, 0.6)',
          glow: 'rgba(255, 248, 235, 0.15)',
          beam: 'rgba(255, 250, 242, 0.08)',
        },
        accent: {
          DEFAULT: '#1F3D30',
          light: '#3A7058',
          dark: '#162B22',
          muted: 'rgba(31, 61, 48, 0.12)',
        },
        gold: {
          DEFAULT: '#D4A64A',
          muted: 'rgba(212, 166, 74, 0.18)',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#E0DCD4',
          muted: '#A8A29A',
        },
        glass: {
          DEFAULT: 'rgba(255, 255, 255, 0.04)',
          border: 'rgba(255, 255, 255, 0.08)',
          light: 'rgba(255, 252, 245, 0.06)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Zen Kaku Gothic New', 'sans-serif'],
        serif: ['var(--font-serif)', 'Cormorant Garamond', 'serif'],
      },
      letterSpacing: {
        widest: '.25em',
        wider: '.15em',
      },
      animation: {
        'fade-up': 'fadeUp 0.8s ease-out forwards',
        'fade-in': 'fadeIn 1s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.8s ease-out forwards',
        'scale-in': 'scaleIn 0.6s ease-out forwards',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'light-shimmer': 'lightShimmer 8s ease-in-out infinite',
        'subtle-glow': 'subtleGlow 4s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-30px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        lightShimmer: {
          '0%, 100%': { opacity: '0.3', transform: 'translateX(-10%)' },
          '50%': { opacity: '0.6', transform: 'translateX(10%)' },
        },
        subtleGlow: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '0.8' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

export default config;
