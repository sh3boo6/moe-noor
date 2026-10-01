export default defineNuxtConfig({

  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vite-pwa/nuxt',
    '@vueuse/nuxt'
  ],
  ssr: false,

  devtools: {
    enabled: true
  },
  app: {
    baseURL: '/',
    buildAssetsDir: '/_nuxt/',
    head: {
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
        { rel: 'apple-touch-icon', href: '/img/logo.png' }
      ],
      meta: [
        { name: 'description', content: 'لوحة تحليل تفاعلية لقراءة ملفات Excel وزارية وعرض إحصائيات المدارس باستخدام Nuxt و Tauri.' },
        { name: 'format-detection', content: 'telephone=no, email=no, address=no' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'لوحة تحليل البيانات الوزارية' },
        { name: 'twitter:description', content: 'قراءة ملفات Excel وزارية وتحليل بيانات المدارس بسرعة.' },
        { name: 'twitter:image', content: '/og-image.png' },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'لوحة تحليل البيانات الوزارية' },
        { property: 'og:description', content: 'لوحة تحليل تفاعلية لقراءة ملفات Excel وزارية وعرض إحصائيات المدارس باستخدام Nuxt و Tauri.' },
        { property: 'og:image', content: '/og-image.png' },
        { property: 'og:image:alt', content: 'لوحة تحليل البيانات الوزارية' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:locale', content: 'ar_SA' }
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
      name: 'وزارة التعليم',
      short_name: 'وزارة التعليم',
      description: 'تطبيق ويب تقدمي لوزارة التعليم',
      theme_color: '#179f64',
      icons: [
        {
          src: 'icons/icon-48x48.png',
          sizes: '48x48',
          type: 'image/png'
        },
        {
          src: 'icons/icon-72x72.png',
          sizes: '72x72',
          type: 'image/png'
        },
        {
          src: 'icons/icon-96x96.png',
          sizes: '96x96',
          type: 'image/png'
        },
        {
          src: 'icons/icon-128x128.png',
          sizes: '128x128',
          type: 'image/png'
        },
        {
          src: 'icons/icon-144x144.png',
          sizes: '144x144',
          type: 'image/png'
        },
        {
          src: 'icons/icon-152x152.png',
          sizes: '152x152',
          type: 'image/png'
        },
        {
          src: 'icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: 'icons/icon-256x256.png',
          sizes: '256x256',
          type: 'image/png'
        },
        {
          src: 'icons/icon-384x384.png',
          sizes: '384x384',
          type: 'image/png'
        },
        {
          src: 'icons/icon-512x512.png',
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
