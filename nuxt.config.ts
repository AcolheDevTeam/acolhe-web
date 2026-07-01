// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },

  modules: [
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    '@nuxtjs/tailwindcss',
  ],

  // Deploy em Cloudflare Pages (SSR). O preset gera o `_worker.js` que roda no
  // runtime Workers. A Cloudflare também injeta NITRO_PRESET=cloudflare-pages no
  // build da integração Git, mas deixamos explícito pra o build ser determinístico.
  nitro: {
    preset: 'cloudflare-pages',
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    // Apenas no servidor — nunca exposto ao cliente (LGPD).
    apiSecret: process.env.API_SECRET || '',
    apiUrl: process.env.API_URL || 'http://localhost:8080',
    public: {
      // valores que podem ir ao cliente
    },
  },
})
