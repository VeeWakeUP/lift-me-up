import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Optional: bundles the whole app (JS, CSS, fonts) into ONE self-contained HTML file.
// Handy for sharing a quick preview. The normal `npm run build` is what you deploy.
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  build: { outDir: 'dist-single', emptyOutDir: true },
});
