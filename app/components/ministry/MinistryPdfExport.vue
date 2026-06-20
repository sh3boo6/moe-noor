<script setup lang="ts">
import type { MinistrySchoolRecord } from '~/types/ministrySchool'

const props = defineProps<{
  schools: MinistrySchoolRecord[]
}>()

const { exportMinistryReport, exportChartsReport } = usePdfExport()

const chartData = computed(() => {
  const stages = ['الابتدائية', 'المتوسطة', 'الثانوية', 'رياض الأطفال']
  const stageCounts = stages.map(stage => ({
    stage,
    count: props.schools.filter(s => s.identity.stage === stage).length
  }))

  const total = stageCounts.reduce((sum, s) => sum + s.count, 0)
  const genderDistribution = props.schools.reduce((acc, school) => {
    const gender = school.identity.gender || 'غير محدد'
    acc[gender] = (acc[gender] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const regionFacilities = props.schools.reduce((acc, school) => {
    const region = school.identity.administrativeRegion || school.identity.educationDepartment || 'غير محدد'
    if (!acc[region]) {
      acc[region] = {
        region,
        computerLabs: 0,
        physicsLabs: 0,
        chemistryLabs: 0
      }
    }
    acc[region].computerLabs += school.facilities.computerLabs
    acc[region].physicsLabs += school.facilities.physicsLabs
    acc[region].chemistryLabs += school.facilities.chemistryLabs
    return acc
  }, {} as Record<string, {
    region: string
    computerLabs: number
    physicsLabs: number
    chemistryLabs: number
  }>)

  return {
    title: 'التقرير الإحصائي',
    stageStudents: stageCounts.map(s => ({
      ...s,
      percentage: total > 0 ? (s.count / total) * 100 : 0
    })),
    genderDistribution: Object.entries(genderDistribution).map(([label, count]) => ({
      label,
      count,
      percentage: (count / props.schools.length) * 100
    })),
    facilityRegions: Object.values(regionFacilities)
  }
})

async function handleExport() {
  await exportMinistryReport(props.schools)
}

async function handleExportCharts() {
  await exportChartsReport(props.schools, chartData.value)
}
</script>

<template>
  <div
    dir="rtl"
    class="flex gap-2"
  >
    <UButton
      icon="i-lucide-file-text"
      label="تصدير PDF تفصيلي"
      color="primary"
      variant="solid"
      @click="handleExport"
    />
    <UButton
      icon="i-lucide-chart-column"
      label="تصدير PDF إحصائي"
      color="secondary"
      variant="outline"
      @click="handleExportCharts"
    />
  </div>
</template>
