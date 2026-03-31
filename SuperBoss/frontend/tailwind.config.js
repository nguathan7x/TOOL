/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefbf3',
          100: '#d7f4e1',
          200: '#b2e9c6',
          300: '#7fd6a1',
          400: '#45bb74',
          500: '#239a56',
          600: '#177d45',
          700: '#146438',
          800: '#135030',
          900: '#104229'
        },
        ink: '#10241a',
        canvas: '#f5f7f4',
        line: '#dce4dd'
      },
      boxShadow: {
        panel: '0 18px 40px rgba(16, 36, 26, 0.08)'
      }
    }
  },
  plugins: []
};
