/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#F5F7FA',
        ink: '#101A28',
        accent: '#0EA5A4',
        highlight: '#F97316',
        panel: '#FFFFFF',
        borderline: '#D7E0EA'
      },
      boxShadow: {
        soft: '0 20px 45px -28px rgba(16, 26, 40, 0.35)'
      },
      borderRadius: {
        xl2: '1.2rem'
      }
    }
  },
  plugins: []
};
