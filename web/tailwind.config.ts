// temp-nextjs/tailwind.config.ts
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
        // Modern Palette
        'brand-black': '#1A1A1A',
        'brand-gray': '#F4F4F4',
        'brand-accent': '#C8B6A6', // Taupe/Greige
        'brand-accent-dark': '#A89686',
        'text-main': '#1A1A1A',
        'text-sub': '#666666',
        // Keeping these mapped for compatibility if needed, but should be phased out in usage
        'primary-light': '#FAFAFA',
        'primary-medium': '#C8B6A6',
        'primary-dark': '#1A1A1A',
        'secondary': '#A89686',
      },
      fontFamily: {
        sans: ['var(--font-noto-sans-jp)', 'sans-serif'],
        serif: ['var(--font-playfair-display)', 'serif'],
      },
      letterSpacing: {
        widest: '.25em',
      }
    },
  },
  plugins: [],
};

export default config;
