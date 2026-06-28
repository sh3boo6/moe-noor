<script setup>
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'ar',
    dir: 'rtl'
  }
})

const title = 'لوحة تحليل ملفات Excel'
const description = 'لوحة تحليل تفاعلية لقراءة ملفات Excel وعرض إحصائيات المدارس باستخدام Nuxt و Tauri.'
const isAboutOpen = ref(false)
const toaster = { position: 'top-right' }

const osName = ref('Detecting OS...')
const isTauri = ref(false)

onMounted(() => {
  // Check if running in Tauri
  isTauri.value = typeof window !== 'undefined' && '__TAURI__' in window
  // Safe from SSR because onMounted only fires in the browser
  const ua = navigator.userAgent

  if (ua.indexOf('Win') !== -1) osName.value = 'Windows'
  else if (ua.indexOf('Mac') !== -1) osName.value = 'macOS'
  else if (ua.indexOf('Linux') !== -1) osName.value = 'Linux'
  else if (ua.indexOf('Android') !== -1) osName.value = 'Android'
  else if (ua.indexOf('like Mac OS X') !== -1) osName.value = 'iOS'
  else osName.value = 'Unknown OS'
})

const osIcon = computed(() => {
  const icons = {
    Windows: 'i-simple-icons-windows',
    macOS: 'i-simple-icons-apple',
    Linux: 'i-simple-icons-linux',
    Android: 'i-simple-icons-android',
    iOS: 'i-simple-icons-ios'
  }
  return icons[osName.value] || 'i-lucide-monitor'
})

const downloadLinks = computed(() => ({
  Windows: 'https://github.com/sh3boo6/moe-noor/releases/download/0.1.0/Moe.Noor.Data_0.1.0_x64.msi',
  macOS: 'https://github.com/sh3boo6/moe-noor/releases/download/0.1.0/Moe.Noor.Data_0.1.0_aarch64.dmg',
  Linux: 'https://github.com/sh3boo6/moe-noor/releases/download/0.1.0/Moe.Noor.Data_0.1.0_x64.AppImage'
}))

const detectedOsDownloadLink = computed(() => downloadLinks.value[osName.value])

const social = ref([
  { name: 'i-simple-icons-whatsapp', href: 'https://wa.me/966507770383' },
  { name: 'i-simple-icons-x', href: 'https://twitter.com/sh3boo6' },
  { name: 'i-simple-icons-linkedin', href: 'https://www.linkedin.com/in/mohammed-alomari-65a884230/' },
  { name: 'i-lucide-mail', href: 'mailto:momri1029@moe.gov.sa' }
])

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description
})
</script>

<template>
  <UApp :toaster="toaster">
    <AppIntro />
    <UHeader
      :ui="{
        toggle: 'hidden',
        container: 'max-w-full mx-auto px-4 sm:px-6 lg:px-8'
      }"
    >
      <template #left>
        <NuxtLink
          to="/"
          class="flex items-center gap-3 text-sm font-semibold"
        >
          <img
            src="/img/logo.png"
            alt="شعار وزارة التعليم"
            class="h-16 w-auto"
          >
          وزارة التعليم
        </NuxtLink>
      </template>

      <template #right>
        <ClientOnly>
          <UButton
            v-if="!isTauri"
            :label="`تحميل لـ ${osName}`"
            :href="detectedOsDownloadLink"
            variant="ghost"
            :tooltip="osName"
            color="neutral"
            class="hidden xl:inline-flex cursor-pointer"
            :trailing-icon="osIcon"
            size="sm"
          />
        </ClientOnly>
        <UButton
          label="حول التطبيق"
          variant="ghost"
          icon="i-lucide-info"
          @click="isAboutOpen = true"
        />
        <UColorModeButton />
      </template>
    </UHeader>

    <UModal
      v-model:open="isAboutOpen"
      title="حول التطبيق"
      icon="i-lucide-info"
      description="نبذة مختصرة عن لوحة تحليل ملفات Excel"
      class="max-w-2xl"
    >
      <template #header>
        <div class="flex justify-between items-center gap-2 w-full">
          <div class="flex items-center gap-3">
            <UIcon
              name="i-lucide-info"
              class="size-10 text-primary"
            />
            <div>
              <h3 class="text-lg font-semibold">
                حول التطبيق
              </h3>
              <p class="text-sm text-muted">
                نبذة مختصرة عن لوحة تحليل ملفات Excel
              </p>
            </div>
          </div>
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            @click="isAboutOpen = false"
          />
        </div>
      </template>
      <template #body>
        <div class="space-y-4 text-right leading-7">
          <p>
            هذا التطبيق يساعدك على قراءة ملفات Excel الوزارية الشاملة وتحليل بيانات المدارس بسرعة، مع عرض مؤشرات إدارية ورسوم بيانية وجداول تفاعلية تدعم البحث والفلترة والتصدير.
          </p>
          <p>
            تم بناؤه كواجهة ويب و سطح مكتب ليكون أداة محلية مستقرة وسهلة الاستخدام لإدارة ومتابعة بيانات المدارس الصادرة من برنامج نور.
          </p>
          <p class="text-sm font-semibold text-center">
            تابعنا على القنوات التالية
          </p>
          <div class="flex justify-around items-center mx-auto p-4 border border-dotted border-default/95 rounded-xl">
            <a
              v-for="link in social"
              :key="link.name"
              :href="link.href"
              target="_blank"
              class="hover:text-default/50"
            >
              <UIcon
                :name="link.name"
                class="size-7"
              />
            </a>
          </div>
          <p class="text-primary text-center bg-accented/20 p-1 rounded-md text-sm">
            برمجة وتصميم: محمد عبدالرحمن - فكرة: هاشم العمري
          </p>
        </div>
      </template>
    </UModal>

    <UMain>
      <NuxtPage />
    </UMain>

    <USeparator />

    <UFooter
      :ui="{
        container: 'max-w-full mx-auto px-4 sm:px-6 lg:px-8'
      }"
    >
      <template #left>
        <UAvatar
          class="me-2 border border-default"
          size="2xl"
          src="/img/avatar.PNG"
        />
        <p class="text-sm text-muted">
          برمجة وتصميم: محمد عبدالرحمن - فكرة: هاشم العمري
        </p>
      </template>
      <template #right>
        <ClientOnly>
          <div
            v-if="!isTauri"
            class="hidden lg:flex items-center gap-2"
          >
            <UButton
              :href="downloadLinks.Windows"
              variant="outline"
              color="neutral"
              size="sm"
              icon="i-simple-icons-windows"
            >
              Windows
            </UButton>
            <UButton
              :href="downloadLinks.macOS"
              variant="outline"
              color="neutral"
              size="sm"
              icon="i-simple-icons-apple"
            >
              macOS
            </UButton>
            <UButton
              :href="downloadLinks.Linux"
              variant="outline"
              color="neutral"
              size="sm"
              icon="i-simple-icons-linux"
            >
              Linux
            </UButton>
          </div>
        </ClientOnly>
      </template>
    </UFooter>
  </UApp>
</template>
