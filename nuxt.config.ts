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

  // nuxt-mongoose 配置（官方文档推荐）
  // 文档: https://docs.arashsheyda.me/nuxt-mongoose/getting-started/configuration
  mongoose: {
    // 构建时使用虚拟 URI，运行时会被环境变量覆盖
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/homebooks',
    options: {
      // 构建时避免实际连接，快速失败
      serverSelectionTimeoutMS: 1000,
    },
    modelsDir: 'models', // 相对于 server 目录
    devtools: true,
  },

  // 配置运行时环境变量（仅服务端可访问）
  runtimeConfig: {
    // 其他 API 使用的环境变量
    tanshuapiKey: process.env.TANSHUAPI_KEY || '',
    haToken: process.env.HA_TOKEN || '',
    haUrl: process.env.HA_URL || '',
    haLedEntityId: process.env.HA_LED_ENTITY_ID || '',
  },
});
