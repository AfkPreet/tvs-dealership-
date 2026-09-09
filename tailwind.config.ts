import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './content/**/*.{ts,tsx}'],
  theme: {
    /*
     * Breakpoints from the brief: 360 / 768 / 1280 / 1600.
     *
     * `sm` is here because declaring `screens` replaces Tailwind's entire scale
     * rather than extending it, and without it every `sm:` rule in the codebase
     * compiled to nothing. That is why the hero's two buttons stacked instead of
     * sitting side by side, and why the About page's photo grid ran as a single
     * tall column.
     */
    screens: {
      xs: '360px',
      sm: '640px',
      md: '768px',
      xl: '1280px',
      '2xl': '1600px',
    },
    extend: {
      /**
       * Two radii, and the difference between them is the point.
       *
       * `sm` (6px) is for things that are surfaces — cards, photo panels,
       * buttons, fields. 2px on a photograph read as unfinished rather than as
       * a decision.
       *
       * `doc` (2px) is for things that should read as a printed document: the
       * price sheet and the specification tables. Keeping those square is what
       * stops the site looking like every other template.
       */
      borderRadius: {
        sm: '6px',
        doc: '2px',
      },
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
