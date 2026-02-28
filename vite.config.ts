import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  ssr: {
    // Ne pas bundler ces packages côté serveur : chargés depuis node_modules au runtime
    external: ['better-auth', 'postgres', 'drizzle-orm']
  }
});
