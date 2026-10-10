// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },

  experimental: {
    componentIslands: true,
  },

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

  css: ['vue-sonner/style.css'],

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    configPath: '~/tailwind.config.ts',
  },

  // Componentes do shadcn-vue ficam em ~/components/ui e são usados sem prefixo
  // (<Button/>, <Card/>…). O restante de ~/components segue o padrão do Nuxt.
  components: [
    { path: '~/components/ui', extensions: ['vue'], pathPrefix: false },
    { path: '~/components', pathPrefix: false },
  ],

  app: {
    head: {
      htmlAttrs: { lang: 'pt-BR' },
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Schibsted+Grotesk:wght@400;500;600;700&display=swap',
        },
      ],
    },
  },

  runtimeConfig: {
    // Apenas no servidor — nunca exposto ao cliente (LGPD).
    apiSecret: process.env.API_SECRET || '',
    apiUrl: process.env.API_URL || 'http://localhost:8080',
    public: {
      lgpdExportEnabled: process.env.NUXT_PUBLIC_LGPD_EXPORT_ENABLED === 'true',
      // E-mail do "Fale com a gente" da landing (plano Clínica). Vazio = botão "Em breve".
      // Contato de suporte provisório (Joyce, 2026-10-10); troca por NUXT_PUBLIC_CONTACT_EMAIL.
      contactEmail: process.env.NUXT_PUBLIC_CONTACT_EMAIL || 'joyccekelly5.0@gmail.com',
    },
  },
})
