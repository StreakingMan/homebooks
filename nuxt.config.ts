import tailwindcss from '@tailwindcss/vite';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // 采用 Nuxt 4 默认 app/ 目录结构
  css: ['@/assets/css/tailwind.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  devtools: { enabled: true },
  devServer: {
    host: '0.0.0.0',
    https: false,
    port: 4000,
  },
  modules: ['@nuxt/eslint', 'nuxt-mongoose', '@pinia/nuxt', 'shadcn-nuxt'],

  eslint: {
    checker: true,
  },

  compatibilityDate: '2024-11-27',

  pinia: {
    storesDirs: ['./app/stores/**'],
  },

  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },
});
