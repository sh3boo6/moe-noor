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
    <UHeader :ui="{ toggle: 'hidden' }">
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

    <UFooter>
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
    </UFooter>
  </UApp>
</template>
