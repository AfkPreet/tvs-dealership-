import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './content/**/*.{ts,tsx}'],
  theme: {
    // Breakpoints from the brief: 360 / 768 / 1280 / 1600.
    screens: {
      xs: '360px',
      md: '768px',
      xl: '1280px',
      '2xl': '1600px',
    },
    extend: {
      colors: {
        tvsred: 'var(--tvs-red)',
        'tvsred-cta': 'var(--tvs-red-cta)',
        'tvsred-deep': 'var(--tvs-red-deep)',
        'tvsred-onink': 'var(--tvs-red-on-ink)',
        'tvsred-onlight': 'var(--tvs-red-on-light)',
        ink: 'var(--ink)',
        graphite: 'var(--graphite)',
        mist: 'var(--mist)',
        rule: 'var(--rule)',
        verified: 'var(--verified)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        shell: '1440px',
      },
      letterSpacing: {
        tightest: '-0.02em',
      },
    },
  },
  plugins: [],
};

export default config;
