/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow:    '#FFE500',
          bg:        '#0A0A0A',
          surface:   '#111111',
          border:    '#222222',
          white:     '#FFFFFF',
          muted:     '#888888',
          danger:    '#FF3333',
          success:   '#00CC66',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      letterSpacing: {
        tight:   '-0.03em',
        tighter: '-0.05em',
      },
      borderRadius: {
        DEFAULT: '2px',
        sm:      '2px',
        md:      '2px',
        lg:      '2px',
        xl:      '2px',
        '2xl':   '2px',
        none:    '0px',
      },
    },
  },
  plugins: [],
};
