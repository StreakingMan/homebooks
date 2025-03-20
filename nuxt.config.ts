// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  devServer: {
    host: '0.0.0.0',
    https: true,
    port: 4000,
  },
  modules: ['@nuxt/ui', '@nuxt/eslint', 'nuxt-mongoose'],

  eslint: {
    checker: true,
  },

  compatibilityDate: '2024-11-27',
});
