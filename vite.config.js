import { defineConfig } from 'vite';

export default defineConfig({
  // LWS serves the site from the domain root; keep asset URLs relative so the
  // build also works if the site is later moved into a subdirectory.
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
