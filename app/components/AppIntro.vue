<script setup lang="ts">
const colorMode = useColorMode()
const isVisible = ref(true)
const isFading = ref(false)

const introImage = computed(() =>
  colorMode.value === 'dark' ? '/img/intro-dark.gif' : '/img/intro-light.gif'
)

// Declare timer variables outside so they can be accessed by onUnmounted
let fadeTimer: ReturnType<typeof setTimeout>
let hideTimer: ReturnType<typeof setTimeout>

onMounted(() => {
  // 1. Disable scrolling as soon as the intro mounts
  document.body.style.overflow = 'hidden'

  fadeTimer = setTimeout(() => {
    isFading.value = true
  }, 3200)

  hideTimer = setTimeout(() => {
    isVisible.value = false
    // 2. Re-enable scrolling when the intro is finished
    document.body.style.overflow = ''
  }, 3500)
})

// Moved OUTSIDE of onMounted
onUnmounted(() => {
  clearTimeout(fadeTimer)
  clearTimeout(hideTimer)

  // 3. Failsafe: Re-enable scrolling if the component is destroyed before timers finish (e.g., user navigates away early)
  document.body.style.overflow = ''
})
</script>

<template>
  <div
    v-if="isVisible"
    :class="{ 'opacity-0': isFading }"
    class="fixed overflow-auto inset-0 z-[999999] flex top-0 left-0 right-0 bottom-0 items-center justify-center bg-default dark:bg-[#0e172b] transition-opacity duration-300"
  >
    <img
      :src="introImage"
      alt="مقدمة التطبيق"
      class="h-auto w-full max-w-60"
    >
  </div>
</template>
