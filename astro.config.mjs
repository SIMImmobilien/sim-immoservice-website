import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import netlify from '@astrojs/netlify';

// Netlify setzt beim Build automatisch NETLIFY=true. So läuft dasselbe
// Repository auf beiden Plattformen, ohne dass etwas umgestellt werden muss.
const adapter = process.env.NETLIFY ? netlify() : vercel({ isr: false });

export default defineConfig({
  site: 'https://www.sim-immoservice.de',
  output: 'server',
  adapter,
  vite: {
    plugins: [tailwindcss()],
  },
});
