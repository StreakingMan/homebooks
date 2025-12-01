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
  // Nuxt 会自动将环境变量映射：NUXT_<CONFIG_KEY> -> runtimeConfig.<configKey>
  runtimeConfig: {
    // mongoose.uri 由 nuxt-mongoose 模块自动注册，通过 NUXT_MONGOOSE_URI 覆盖
    // 其他 API 使用的环境变量（运行时通过 NUXT_* 前缀的环境变量覆盖）
    tanshuapiKey: process.env.NUXT_TANSHUAPI_KEY || '',
    haToken: process.env.NUXT_HA_TOKEN || '',
    haUrl: process.env.NUXT_HA_URL || '',
    haLedEntityId: process.env.NUXT_HA_LED_ENTITY_ID || '',
  },
});
