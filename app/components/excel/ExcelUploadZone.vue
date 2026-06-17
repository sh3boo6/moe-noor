<script setup lang="ts">
const emit = defineEmits<{
  'file-selected': [file: File]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

// تفتح نافذة اختيار الملف من زر أو من الضغط على منطقة الرفع.
function chooseFile() {
  inputRef.value?.click()
}

// تستقبل الملف بعد اختياره من input وتخفي قيمته للسماح باختيار نفس الملف مرة أخرى.
function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (file) {
    emit('file-selected', file)
  }

  input.value = ''
}

// تسمح بسحب الملف وإفلاته مباشرة داخل منطقة الرفع.
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
    class="rounded-3xl border border-dashed border-primary/40 bg-card p-6 text-right shadow-sm transition-colors sm:p-8"
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

    <div class="mx-auto flex max-w-2xl flex-col items-center text-center">
      <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <UIcon
          name="i-lucide-table"
          class="h-8 w-8"
        />
      </div>

      <h2 class="text-xl font-semibold text-foreground">
        رفع ملف Excel
      </h2>

      <p class="mt-2 max-w-xl text-sm leading-7 text-muted-foreground">
        اسحب ملف Excel وأفلته هنا، أو اختره من الجهاز. سيقوم التطبيق بقراءة الأعمدة المطلوبة وتحويلها إلى لوحة بيانات تفاعلية.
      </p>

      <div class="mt-5 flex flex-col gap-3 sm:flex-row">
        <UButton
          type="button"
          label="اختيار ملف"
          icon="i-lucide-upload"
          @click="chooseFile"
        />

        <UButton
          type="button"
          color="neutral"
          variant="ghost"
          label="xlsx / xls / csv"
          icon="i-lucide-file-spreadsheet"
        />
      </div>
    </div>
  </section>
</template>
