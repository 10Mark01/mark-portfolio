import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // If you deploy to GitHub Pages at https://<user>.github.io/<repo>/,
  // uncomment the line below and set it to '/<repo>/'.
  // Vercel, Netlify and a custom domain all want it left alone.
  // base: '/portfolio/',
});
