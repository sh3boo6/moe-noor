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
    baseURL: '/',
    buildAssetsDir: '/_nuxt/'
  },

  css: ['~/assets/css/main.css'],

  compatibilityDate: '2025-01-15',

  nitro: {
    preset: 'static',
    output: {
      publicDir: '.output/public'
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
