// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxt/eslint'],

  eslint: {
    checker: true,
  },

  compatibilityDate: '2024-11-27',
});