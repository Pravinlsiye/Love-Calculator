/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', "serif"],
        body: ["Poppins", "sans-serif"],
        script: ['"Dancing Script"', "cursive"],
      },
      colors: {
        midnight: {
          900: "#05030f",
          800: "#0a0820",
          700: "#1a1147",
        },
        violet: {
          glow: "#7c5cff",
          deep: "#3b2a8a",
        },
        cyan: {
          glow: "#22d3ee",
        },
      },
      keyframes: {
        cosmicPulse: {
          "0%, 100%": {
            boxShadow:
              "0 0 18px rgba(124,92,255,0.55), 0 0 40px rgba(34,211,238,0.25)",
          },
          "50%": {
            boxShadow:
              "0 0 50px rgba(124,92,255,0.95), 0 0 90px rgba(34,211,238,0.55)",
          },
        },
        heartbeat: {
          "0%, 100%": { transform: "scale(1)" },
          "25%": { transform: "scale(1.15)" },
          "50%": { transform: "scale(1)" },
          "75%": { transform: "scale(1.1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        auroraDrift: {
          "0%, 100%": { transform: "translate(-15%, -10%) rotate(0deg)" },
          "50%": { transform: "translate(15%, 10%) rotate(180deg)" },
        },
        quoteFloat: {
          "0%, 100%": { transform: "translate(0, 0) rotate(0deg)" },
          "50%": { transform: "translate(4px, -6px) rotate(-3deg)" },
        },
        gentleBob: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        floatUp: {
          "0%": { transform: "translateY(0) scale(1)", opacity: "0" },
          "10%": { opacity: "1" },
          "100%": {
            transform: "translateY(-220px) scale(1.4)",
            opacity: "0",
          },
        },
      },
      animation: {
        cosmicPulse: "cosmicPulse 2.5s ease-in-out infinite",
        heartbeat: "heartbeat 1.4s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
        auroraDrift: "auroraDrift 14s ease-in-out infinite",
        quoteFloatA: "quoteFloat 6s ease-in-out infinite",
        quoteFloatB: "quoteFloat 7s ease-in-out infinite reverse",
        gentleBob: "gentleBob 5s ease-in-out infinite",
        floatUp: "floatUp linear infinite",
      },
    },
  },
  plugins: [],
};
