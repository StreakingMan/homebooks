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

  // 启用颜色模式功能
  colorMode: {
    classSuffix: '',
    fallback: 'light', // 默认使用浅色模式
    preference: 'system', // 优先使用系统设置
    dataValue: 'theme', // 主题数据属性名
    storageKey: 'book-wall-theme' // localStorage 存储键名
  },
});
