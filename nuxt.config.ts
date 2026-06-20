export default defineNuxtConfig({

  modules: ['@nuxt/eslint', '@nuxt/ui', '@vite-pwa/nuxt'],
  ssr: false,

  devtools: {
    enabled: true
  },
  app: {
    baseURL: '/',
    buildAssetsDir: '/_nuxt/',
    head: {
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' }
      ]
    }
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
  },

  pwa: {
    registerType: 'autoUpdate',
    registerWebManifestInRouteRules: true,
    injectRegister: 'inline',
    manifest: {
      name: 'Nuxt 4 PWA',
      short_name: 'NuxtPWA',
      description: 'A Nuxt 4 Progressive Web App',
      theme_color: '#4A90E2',
      icons: [
        {
          src: 'icons/icon-192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: 'icons/icon-512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    },
    workbox: {
      runtimeCaching: [
        {
          urlPattern: 'http://localhost:3000/.*',
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 86400
            }
          }
        }
      ]
    },
    client: {
      installPrompt: true
    }
  }
})
