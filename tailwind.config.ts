import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./index.html','./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: { primary:'#0a0b0f', secondary:'#0f1117', tertiary:'#14161e', elevated:'#1a1d2e' },
        accent: { purple:'#7c6af7', 'purple-light':'#a78bfa', blue:'#38bdf8', green:'#34d399', red:'#f87171', yellow:'#fbbf24', orange:'#fb923c' },
        border: { DEFAULT:'#1e2130', light:'#2a2d3e' },
        text: { primary:'#e2e8f0', secondary:'#94a3b8', muted:'#64748b' }
      },
      fontFamily: { sans:['Inter','system-ui','sans-serif'], mono:['JetBrains Mono','monospace'] }
    }
  },
  plugins: []
}
export default config