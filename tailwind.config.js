/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#2C7A7B',
        'primary-dark': '#215A5B',
        accent: '#F6AD55',
        bgLight: '#F8FAFC',
        'neutral-dark': '#1F2937',
        'neutral-darker': '#111827',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
