import type { Config } from "tailwindcss"
const config: Config = {
  content:["./index.html","./src/**/*.{js,ts,jsx,tsx}"],
  darkMode:"class",
  theme:{
    extend:{
      fontFamily:{
        sans:["Inter","system-ui","sans-serif"],
        mono:["JetBrains Mono","monospace"]
      }
    }
  },
  plugins:[]
}
export default config