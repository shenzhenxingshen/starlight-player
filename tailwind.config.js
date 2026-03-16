/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "zen-brown": "#2C1E12",
        "zen-dark": "#1A0F08",
        "gold-light": "#F9Eea5",
        "gold-main": "#D4AF37",
        "gold-dark": "#8C6A28",
        "amber-glow": "rgba(255, 191, 0, 0.3)",
        "background-dark": "#1a1208",
        "surface-dark": "#2a2118",
      },
      fontFamily: {
        "serif": ["Noto Serif SC", "serif"],
        "calligraphy": ["Ma Shan Zheng", "cursive"],
        "display": ["Inter", "sans-serif"]
      },
      backgroundImage: {
        'wood-grain': "url('data:image/svg+xml,%3Csvg width=\\'100\\' height=\\'100\\' viewBox=\\'0 0 100 100\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cfilter id=\\'noise\\'%3E%3CfeTurbulence type=\\'fractalNoise\\' baseFrequency=\\'0.8\\' numOctaves=\\'3\\' stitchTiles=\\'stitch\\'/%3E%3C/filter%3E%3Crect width=\\'100\\' height=\\'100\\' filter=\\'url(%23noise)\\' opacity=\\'0.08\\'/%3E%3C/svg%3E')",
        'gold-metal': "linear-gradient(135deg, #bf953f 0%, #fcf6ba 25%, #b38728 50%, #fbf5b7 75%, #aa771c 100%)",
        'dark-gradient': 'linear-gradient(to bottom, #221b10, #1a1208)',
      },
      animation: {
        'spin-slow': 'spin 60s linear infinite',
        'pulse-gentle': 'pulse-gentle 4s ease-in-out infinite',
        'aura-breath': 'aura-breath 6s ease-in-out infinite',
        'smoke-flow': 'smoke-flow 20s linear infinite',
        'lotus-float': 'lotus-float 8s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-gentle': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        'aura-breath': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.1' },
          '50%': { transform: 'scale(1.2)', opacity: '0.3' },
        },
        'smoke-flow': {
          '0%': { transform: 'translateY(0) translateX(0) rotate(0deg)', opacity: '0.3' },
          '50%': { transform: 'translateY(-50px) translateX(20px) rotate(180deg)', opacity: '0.6' },
          '100%': { transform: 'translateY(-100px) translateX(-10px) rotate(360deg)', opacity: '0' },
        },
        'lotus-float': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-10px) rotate(5deg)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(212, 175, 55, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}
