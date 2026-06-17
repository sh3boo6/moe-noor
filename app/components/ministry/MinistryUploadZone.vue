<script setup lang="ts">
const emit = defineEmits<{
  'file-selected': [file: File]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

// تفتح نافذة اختيار الملف من الزر أو من الضغط المباشر على منطقة الرفع.
function chooseFile() {
  inputRef.value?.click()
}

// تستقبل الملف بعد اختياره وتعيد تفريغ قيمة input للسماح باختيار نفس الملف مرة أخرى.
function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (file) {
    emit('file-selected', file)
  }

  input.value = ''
}

// تتعامل مع حالة السحب والإفلات ثم تمرر الملف إلى مكون الصفحة.
function onDrop(files: FileList | null) {
  const file = files?.[0]

  if (file) {
    emit('file-selected', file)
  }

  isDragging.value = false
}
</script>

<template>
  <section
    dir="rtl"
    class="relative overflow-hidden rounded-3xl border border-dashed border-primary/40 bg-card p-6 text-right shadow-sm transition-colors sm:p-8"
    :class="isDragging ? 'border-primary bg-primary/5' : 'hover:border-primary/70'"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="onDrop($event.dataTransfer?.files)"
  >
    <input
      ref="inputRef"
      type="file"
      class="hidden"
      accept=".xlsx,.xls,.xlsm,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
      @change="onFileChange"
    >

    <div class="relative mx-auto flex max-w-4xl flex-col items-center text-center">
      <div class="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <img
          src="/img/logo.png"
          alt="شعار الإدارة العامة للتعليم بمنطقة الباحة"
          class="h-16 w-auto"
        >
      </div>

      <h2 class="text-2xl font-semibold tracking-tight text-foreground">
        استيراد الصيغة الوزارية الشاملة من برنامج نور
      </h2>

      <p class="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
        الإدارة العامة للتعليم بمنطقة الباحة - اسحب ملف Excel وأفلته هنا أو اختره من الجهاز.
      </p>

      <div class="mt-6 flex flex-col gap-3 sm:flex-row">
        <UButton
          type="button"
          label="اختيار ملف Excel"
          icon="i-lucide-upload-cloud"
          size="lg"
          @click="chooseFile"
        />
      </div>
    </div>
  </section>
</template>
