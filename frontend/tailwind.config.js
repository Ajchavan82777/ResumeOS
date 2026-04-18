/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          50:  "#f0fdf9",
          100: "#ccfbee",
          200: "#99f6dd",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#57CDA4",
          600: "#3DB88A",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
        },
        purple: {
          100: "#EEE8FF",
          300: "#c4b5fd",
          500: "#A396E2",
          600: "#7c3aed",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Lora", "Georgia", "serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.06)",
        "card-md": "0 4px 16px rgba(0,0,0,.10)",
        "card-lg": "0 12px 40px rgba(0,0,0,.14)",
      },
      animation: {
        "fade-in": "fadeIn .2s ease",
        "slide-up": "slideUp .25s ease",
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: "translateY(8px)" }, to: { opacity: 1, transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};
