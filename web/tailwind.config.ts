import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        space: {
          dark: '#0a0a1a',
          mid:  '#0f0f2e',
          light:'#1a1a4e',
        },
        neon: {
          blue:   '#4FC3F7',
          purple: '#CE93D8',
          green:  '#A5D6A7',
          red:    '#EF9A9A',
          gold:   '#FFD54F',
        }
      },
      fontFamily: {
        game: ['"Exo 2"', 'sans-serif'],
      }
    }
  },
  plugins: []
} satisfies Config
