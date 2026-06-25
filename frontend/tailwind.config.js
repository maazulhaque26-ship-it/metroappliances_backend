/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        metro: {
          orange:        '#FF8A00',
          'orange-dark': '#E67A00',
          'orange-dim':  'rgba(255,138,0,0.08)',
          black:         '#111111',
          'black-2':     '#1A1A1A',
          card:          '#FFFFFF',
          'card-2':      '#FAFAFA',
          border:        'rgba(17,17,17,0.08)',
          surface:       '#F5F5F5',
          'surface-2':   '#EAEAEA',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        numbers: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs':  ['0.625rem', { lineHeight: '1rem' }],
        '7xl':  ['4.5rem',   { lineHeight: '1', letterSpacing: '-0.03em' }],
        '8xl':  ['6rem',     { lineHeight: '1', letterSpacing: '-0.04em' }],
        '9xl':  ['8rem',     { lineHeight: '0.95', letterSpacing: '-0.04em' }],
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter:  '-0.03em',
      },
      animation: {
        'fade-in':     'fadeIn 0.4s ease both',
        'slide-up':    'slideUp 0.6s cubic-bezier(0.25,1,0.5,1) both',
        'slide-down':  'slideDown 0.3s cubic-bezier(0.25,1,0.5,1) both',
        'shimmer':     'shimmer 1.6s linear infinite',
        'lift-in':     'liftIn 0.5s cubic-bezier(0.25,1,0.5,1) both',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' },                                  to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(28px)' },   to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-12px)' },  to: { opacity: '1', transform: 'translateY(0)' } },
        liftIn:    { from: { opacity: '0', transform: 'translateY(16px) scale(0.98)' }, to: { opacity: '1', transform: 'translateY(0) scale(1)' } },
        shimmer:   { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      boxShadow: {
        'lift':    '0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
        'lift-lg': '0 12px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.05)',
        'card':    '0 1px 3px rgba(0,0,0,0.05)',
        'glass':   '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)',
      },
      transitionTimingFunction: {
        'premium': 'cubic-bezier(0.25, 1, 0.5, 1)',
        'spring':  'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      backdropBlur: {
        xs: '4px',
        sm: '8px',
        md: '16px',
      },
      spacing: {
        '18':  '4.5rem',
        '22':  '5.5rem',
        '88':  '22rem',
        '128': '32rem',
      },
    },
  },
  plugins: [],
};
