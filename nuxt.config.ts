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

  // 配置运行时环境变量（仅服务端可访问）
  runtimeConfig: {
    mongoose: { uri: process.env.NUXT_MONGOOSE_URI || 'mongodb://localhost:27017/homebooks' },
    // 其他 API 使用的环境变量
    tanshuapiKey: process.env.TANSHUAPI_KEY || '',
    haToken: process.env.HA_TOKEN || '',
    haUrl: process.env.HA_URL || '',
    haLedEntityId: process.env.HA_LED_ENTITY_ID || '',
  },
});
