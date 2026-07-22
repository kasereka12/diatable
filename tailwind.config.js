/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dark:         '#12111a',
        dark2:        '#1c1b2a',
        dark3:        '#252438',
        gold:         '#f4a828',
        'gold-light': '#f9c76a',
        'gold-dark':  '#c8841a',
        cream:        '#f9f4ee',
        cream2:       '#f2ebe0',
        muted:        '#9b97b3',
        light:        '#d4cfea',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:  ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'grad-senegal':    'linear-gradient(135deg,#e8521a 0%,#c8841a 40%,#f4a828 100%)',
        'grad-chinese':    'linear-gradient(135deg,#b71c1c 0%,#e53935 50%,#ef9a9a 100%)',
        'grad-lebanese':   'linear-gradient(135deg,#1b5e20 0%,#43a047 50%,#a5d6a7 100%)',
        'grad-syrian':     'linear-gradient(135deg,#4a148c 0%,#7b1fa2 50%,#ce93d8 100%)',
        'grad-french':     'linear-gradient(135deg,#0d47a1 0%,#1565c0 50%,#90caf9 100%)',
        'grad-italian':    'linear-gradient(135deg,#c62828 0%,#1b5e20 50%,#f9f5f0 100%)',
        'grad-nigerian':   'linear-gradient(135deg,#1b5e20 0%,#f9a825 50%,#1b5e20 100%)',
        'grad-indian':     'linear-gradient(135deg,#e65100 0%,#f57f17 40%,#fbc02d 100%)',
        'grad-brazilian':  'linear-gradient(135deg,#1b5e20 0%,#f9a825 30%,#0d47a1 100%)',
        'feat-senegal':    'linear-gradient(160deg,#8b2500 0%,#c8581a 50%,#f4a828 100%)',
        'feat-liban':      'linear-gradient(160deg,#145a32 0%,#1e8449 50%,#76b041 100%)',
        'feat-chine':      'linear-gradient(160deg,#7b0000 0%,#c0392b 50%,#e74c3c 100%)',
        'feat-syrie':      'linear-gradient(160deg,#2c0042 0%,#6c3483 50%,#9b59b6 100%)',
        'vendor-gradient': 'linear-gradient(135deg,#c8841a 0%,#f4a828 40%,#f9c76a 100%)',
        'hero-glow':       'radial-gradient(ellipse 80% 60% at 70% 40%,rgba(244,168,40,0.08) 0%,transparent 70%)',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-12px)' },
        },
        orbitFloat: {
          '0%,100%': { transform: 'translateY(0) scale(1)' },
          '50%':     { transform: 'translateY(-8px) scale(1.05)' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(32px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        countUp: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
      animation: {
        float:       'float 4s ease-in-out infinite',
        orbitFloat:  'orbitFloat 3s ease-in-out infinite',
        fadeInUp:    'fadeInUp 0.7s ease forwards',
      },
    },
  },
  plugins: [],
}
