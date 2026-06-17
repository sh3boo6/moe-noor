export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui'
  ],

  ssr: false,

  devtools: {
    enabled: true
  },
  app: {
    baseURL: './',
    buildAssetsDir: './_nuxt/'
  },

  css: ['~/assets/css/main.css'],

  nitro: {
    preset: 'static',
    output: {
      publicDir: '.output/public'
    }
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
