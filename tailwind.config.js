/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fredoka', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        sans: ['Nunito', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      colors: {
        toti: {
          ink: '#3A1F16',
          brick: '#9B4A2F',
          'brick-hover': '#7E3A24',
          honey: '#E0A04E',
          'honey-hover': '#C8893D',
          cream: '#F6EFE6',
          alt: '#EFE4D6',
          card: '#FFFFFF',
          secondary: '#6B4A3C',
          muted: '#9C8478',
          cocoa: '#8B6A5A',
          beige: '#E8DCCB',
          divider: '#D0BFAF',
          disabled: '#D6C6B8',
          success: '#6E8B5C',
          warning: '#C97A3D',
          error: '#B84A3A',
        },
      },
    },
  },
  plugins: [],
}