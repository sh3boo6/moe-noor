<script setup lang="ts">
const emit = defineEmits<{
  'file-selected': [file: File]
  'file-stored': [data: { name: string, uploadedAt: string }]
  'file-cleared': []
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

const STORAGE_KEY = 'ministry_pending_excel'

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function base64ToFile(base64: string, name: string, type: string): File {
  const parts = base64.split(',')
  const header = parts[0] ?? ''
  const data = parts[1] ?? ''
  const mime = (header.match(/:(.*?);/)?.[1] ?? type) as string
  const byteCharacters = atob(data)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  return new File([byteArray], name, { type: mime })
}

// تفتح نافذة اختيار الملف من الزر أو من الضغط المباشر على منطقة الرفع.
function chooseFile() {
  inputRef.value?.click()
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (file) {
    emit('file-selected', file)
    const storedAt = new Date().toISOString()
    emit('file-stored', { name: file.name, uploadedAt: storedAt })
    fileToBase64(file).then((base64) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        name: file.name,
        type: file.type,
        size: file.size,
        content: base64,
        uploadedAt: storedAt
      }))
    })
  }

  input.value = ''
}

async function onDrop(files: FileList | null) {
  const file = files?.[0]

  if (file) {
    emit('file-selected', file)
    const storedAt = new Date().toISOString()
    emit('file-stored', { name: file.name, uploadedAt: storedAt })
    fileToBase64(file).then((base64) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        name: file.name,
        type: file.type,
        size: file.size,
        content: base64,
        uploadedAt: storedAt
      }))
    })
  }

  isDragging.value = false
}

onMounted(async () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const data = JSON.parse(saved)
      const file = base64ToFile(data.content, data.name, data.type)
      emit('file-selected', file)
      if (data.uploadedAt) {
        emit('file-stored', { name: data.name, uploadedAt: data.uploadedAt })
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }
})
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
      <div class="hidden lg:flex mb-5 h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <img
          src="/img/logo.png"
          alt="شعار وزارة التعليم"
          class="h-16 w-auto"
        >
      </div>

      <h2 class="text-2xl font-semibold tracking-tight text-foreground">
        استيراد الصيغة الوزارية الشاملة من برنامج نور
      </h2>

      <p class="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
        اسحب ملف Excel وأفلته هنا أو اختره من الجهاز.
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
