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

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description
})
</script>

<template>
  <UApp>
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
      description="نبذة مختصرة عن لوحة تحليل ملفات Excel"
      class="max-w-2xl"
    >
      <template #body>
        <div class="space-y-4 text-right leading-7">
          <p>
            هذا التطبيق يساعدك على قراءة ملفات Excel الوزارية الشاملة وتحليل بيانات المدارس بسرعة، مع عرض مؤشرات إدارية ورسوم بيانية وجداول تفاعلية تدعم البحث والفلترة والتصدير.
          </p>
          <p>
            تم بناؤه كواجهة سطح مكتب ليكون أداة محلية مستقرة وسهلة الاستخدام لإدارة ومتابعة بيانات المدارس الصادرة من برنامج نور.
          </p>
          <p class="text-primary text-center bg-accented/50 p-1 rounded-md text-sm">
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
