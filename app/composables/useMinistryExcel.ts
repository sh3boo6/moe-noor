import type { MinistryExcelPayload, MinistrySchoolRecord } from '~/types/ministrySchool'

interface WorkerResponse {
  id: number
  type: 'parsed' | 'error'
  payload?: MinistryExcelPayload
  message?: string
}

let worker: Worker | null = null
let nextJobId = 1

export function useMinistryExcel() {
  const schools = ref<MinistrySchoolRecord[]>([])

  const headers = ref<string[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const fileName = ref('')
  const warningCount = ref(0)
  const pendingJobId = ref<number | null>(null)

  const ensureWorker = () => {
    if (worker) {
      return
    }

    worker = new Worker(new URL('../workers/excel.worker.ts', import.meta.url), { type: 'module' })

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const response = event.data

      if (response.id !== pendingJobId.value) {
        return
      }

      if (response.type === 'error') {
        error.value = response.message || 'حدث خطأ أثناء معالجة الملف'
        loading.value = false
        pendingJobId.value = null
        return
      }

      const payload = response.payload

      if (!payload) {
        error.value = 'لم يتم استلام بيانات صالحة من ملف Excel'
        loading.value = false
        pendingJobId.value = null
        return
      }

      schools.value = payload.schools
      headers.value = payload.headers
      warningCount.value = payload.warningCount
      error.value = null
      loading.value = false
      pendingJobId.value = null
    }

    worker.onerror = (event) => {
      error.value = event.message || 'تعطلت عملية معالجة ملف Excel داخل Web Worker'
      loading.value = false
      pendingJobId.value = null
    }
  }

  const parseFile = async (file: File) => {
    ensureWorker()

    loading.value = true
    error.value = null
    fileName.value = file.name
    pendingJobId.value = nextJobId

    worker?.postMessage({
      id: nextJobId,
      type: 'parse',
      file
    })

    nextJobId += 1
  }

  const clearSchools = () => {
    schools.value = []
    headers.value = []
    fileName.value = ''
    error.value = null
    warningCount.value = 0
    pendingJobId.value = null
  }

  onUnmounted(() => {
    worker?.terminate()
    worker = null
  })

  return {
    schools,
    headers,
    loading,
    error,
    fileName,
    warningCount,
    parseFile,
    clearSchools
  }
}
