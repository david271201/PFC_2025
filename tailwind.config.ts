import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        verde: '#6A7D00',
        verdeEscuro: '#4B4E10',
        verdeClaro: '#C5D30A',
        grafite: '#333333',
        cinzaClaro: '#F0F0F0',
        vermelho: '#C70039',
        vermelhoEscuro: '#8B0000',
      },
    },
  },
  plugins: [],
};
export default config;
