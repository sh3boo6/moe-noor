<script setup lang="ts">
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

import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { getVersion } from '@tauri-apps/api/app'

const isDesktop = ref(false)
const title = 'لوحة تحليل ملفات Excel'
const description = 'لوحة تحليل تفاعلية لقراءة ملفات Excel وعرض إحصائيات المدارس باستخدام Nuxt و Tauri.'
const isAboutOpen = ref(false)
const toaster = { position: 'top-right' } as const
const isUpdateOpen = ref(false)
const updateInfo = ref<any>(null)
const currentVersion = ref('')
const updateLoading = ref(false)

const osName = ref('Detecting OS...')

onMounted(async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isDesktop.value = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

  const ua = navigator.userAgent

  if (ua.indexOf('Win') !== -1) osName.value = 'Windows'
  else if (ua.indexOf('Mac') !== -1) osName.value = 'macOS'
  else if (ua.indexOf('Linux') !== -1) osName.value = 'Linux'
  else if (ua.indexOf('Android') !== -1) osName.value = 'Android'
  else if (ua.indexOf('like Mac OS X') !== -1) osName.value = 'iOS'
  else osName.value = 'Unknown OS'

  if (isDesktop.value) {
    try {
      currentVersion.value = await getVersion()
      updateLoading.value = true
      const update = await check()
      if (update) {
        updateInfo.value = update
        // تنفيذ التحديث وتثبيته مباشرة وتلقائياً فور توفره
        await update.downloadAndInstall()
        await relaunch()
      }
    } catch (e) {
      console.error('Failed to check or perform direct update:', e)
    } finally {
      updateLoading.value = false
    }
  }
})

const osIcon = computed(() => {
  const icons: Record<string, string> = {
    Windows: 'i-simple-icons-windows',
    macOS: 'i-simple-icons-apple',
    Linux: 'i-simple-icons-linux',
    Android: 'i-simple-icons-android',
    iOS: 'i-simple-icons-ios'
  }
  return icons[osName.value] || 'i-lucide-monitor'
})

const installAndUpdate = async () => {
  if (!updateInfo.value) return
  try {
    updateLoading.value = true
    await updateInfo.value.downloadAndInstall()
    await relaunch()
  } catch (e) {
    console.error('Failed to install update:', e)
  }
}

interface DownloadLink {
  label: string
  href: string
}

interface DownloadOs {
  os: string
  icon: string
  links: DownloadLink[]
}

const downloads: DownloadOs[] = [
  {
    os: 'Windows',
    icon: 'i-simple-icons-windows',
    links: [
      { label: 'تثبيت EXE', href: 'https://github.com/sh3boo6/moe-noor/releases/download/v1.0.5/Moe.Noor.Data_1.0.5_x64-setup.exe' },
      { label: 'تثبيت MSI', href: 'https://github.com/sh3boo6/moe-noor/releases/download/v1.0.5/Moe.Noor.Data_1.0.5_x64_en-US.msi' }
    ]
  },
  {
    os: 'macOS',
    icon: 'i-simple-icons-apple',
    links: [
      { label: 'تحميل DMG', href: 'https://github.com/sh3boo6/moe-noor/releases/download/v1.0.5/Moe.Noor.Data_1.0.5_aarch64.dmg' }
    ]
  },
  {
    os: 'Linux',
    icon: 'i-simple-icons-linux',
    links: [
      { label: 'AppImage', href: 'https://github.com/sh3boo6/moe-noor/releases/download/v1.0.5/Moe.Noor.Data_1.0.5_amd64.AppImage' }
    ]
  }
]

const detectedOsDownloadLink = computed(() => {
  const os = downloads.find(d => d.os === osName.value)
  return os?.links[0]?.href ?? (downloads[0] as DownloadOs).links[0]!.href
})

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
          <UDropdownMenu
            v-if="!isDesktop"
            :items="downloads.map(os => ({
              label: os.os,
              icon: os.icon,
              children: os.links.map(link => ({
                label: link.label,
                href: link.href,
                target: '_blank'
              }))
            }))"
            :content="{ align: 'start' }"
            :ui="{ content: 'min-w-48' }"
            size="sm"
          >
            <UButton
              label="تحميل البرنامج"
              variant="ghost"
              color="neutral"
              size="sm"
              trailing-icon="i-lucide-download"
              class="hidden xl:inline-flex"
            />
          </UDropdownMenu>
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

    <UModal
      v-model:open="isUpdateOpen"
      title="تحديث متاح"
      icon="i-lucide-download"
      description="يوجد إصدار جديد من التطبيق"
      class="max-w-md"
    >
      <template #header>
        <div class="flex justify-between items-center gap-2 w-full">
          <div class="flex items-center gap-3">
            <UIcon
              name="i-lucide-download"
              class="size-10 text-primary"
            />
            <div>
              <h3 class="text-lg font-semibold">
                تحديث متاح
              </h3>
              <p class="text-sm text-muted">
                الإصدار الحالي: {{ currentVersion }}
              </p>
            </div>
          </div>
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            @click="isUpdateOpen = false"
          />
        </div>
      </template>
      <template #body>
        <div class="space-y-4 text-right leading-7">
          <p v-if="updateInfo">
            <span class="font-semibold">الإصدار الجديد:</span> {{ updateInfo.version }}
          </p>
          <p class="text-sm text-muted">
            {{ updateInfo?.date ? new Date(updateInfo.date).toLocaleDateString('ar-SA') : '' }}
          </p>
          <div class="flex justify-end gap-2">
            <UButton
              label="تحديث لاحقاً"
              color="neutral"
              variant="ghost"
              @click="isUpdateOpen = false"
            />
            <UButton
              label="بدء التحديث الآن"
              :loading="updateLoading"
              icon="i-lucide-download"
              @click="installAndUpdate"
            />
          </div>
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
            v-if="!isDesktop"
            class="hidden lg:flex items-center gap-2"
          >
            <UButton
              v-for="os in downloads"
              :key="os.os"
              :href="(os.links[0] as DownloadLink).href"
              variant="outline"
              color="neutral"
              size="sm"
              :icon="os.icon"
            >
              {{ os.os }}
            </UButton>
          </div>
        </ClientOnly>
      </template>
    </UFooter>
  </UApp>
</template>
