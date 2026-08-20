import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#08080a',
        panel: '#0f0f13',
        'panel-2': '#131318',
        purple: '#9b5cff',
        'purple-soft': 'rgba(155,92,255,0.35)',
        'purple-glow': 'rgba(155,92,255,0.18)',
        text: '#f2f1f6',
        'text-dim': '#9a97a6',
        'text-faint': '#615e6d',
        green: '#5ce6a8',
        amber: '#ffc36b',
        red: '#ff7b7b',
        'border-default': '#201c2a',
      },
      borderRadius: {
        pill: '999px',
        stat: '20px',
        card: '22px',
        report: '24px',
        chat: '16px',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        'h1': ['26px', { lineHeight: '1.2', fontWeight: '600' }],
        'h2': ['17px', { lineHeight: '1.3', fontWeight: '600' }],
        'h3': ['16px', { lineHeight: '1.4', fontWeight: '600' }],
        'body': ['13.5px', { lineHeight: '1.6', fontWeight: '400' }],
        'eyebrow': ['12.5px', { lineHeight: '1', fontWeight: '600', letterSpacing: '0.06em' }],
        'stat': ['30px', { lineHeight: '1', fontWeight: '600' }],
        'report-stat': ['22px', { lineHeight: '1', fontWeight: '600' }],
      },
      boxShadow: {
        'idea': '0 8px 30px -18px rgba(155,92,255,0.18)',
        'button': '0 8px 24px -8px rgba(124,61,255,0.6)',
        'brand': '0 0 40px rgba(155,92,255,0.18)',
      },
      backgroundImage: {
        'page': 'radial-gradient(circle at 20% -10%, #17111f 0%, #08080a 45%)',
        'button': 'linear-gradient(135deg, #b47cff, #7c3dff)',
        'brand': 'linear-gradient(135deg, #b47cff, #6f2dff)',
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '350': '350ms',
        '900': '900ms',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.8' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 2s ease-out infinite',
        'fade-up': 'fade-up 0.35s ease-out forwards',
      },
    },
  },
  plugins: [],
}

export default config
