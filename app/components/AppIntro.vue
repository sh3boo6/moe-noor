<script setup lang="ts">
const colorMode = useColorMode()
const isVisible = ref(true)
const isFading = ref(false)

const introImage = computed(() =>
  colorMode.value === 'dark' ? '/img/intro-dark.gif' : '/img/intro-light.gif'
)

onMounted(() => {
  const fadeTimer = setTimeout(() => {
    isFading.value = true
  }, 3200)

  const hideTimer = setTimeout(() => {
    isVisible.value = false
  }, 3500)

  onUnmounted(() => {
    clearTimeout(fadeTimer)
    clearTimeout(hideTimer)
  })
})
</script>

<template>
  <div
    v-if="isVisible"
    :class="{ 'opacity-0': isFading }"
    class="fixed overflow-hidden inset-0 z-[999] min-h-screen flex min-w-full top-0 left-0 right-0 bottom-0 items-center justify-center bg-white dark:bg-[#10172a] transition-opacity duration-300"
  >
    <img
      :src="introImage"
      alt="مقدمة التطبيق"
      class="h-auto w-full max-w-60"
    >
  </div>
</template>
