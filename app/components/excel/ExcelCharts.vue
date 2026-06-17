<script setup lang="ts">
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import type { SchoolRecord } from '~/types/school'

interface DistributionItem {
  label: string
  count: number
}

const props = defineProps<{
  schools: SchoolRecord[]
}>()

const ApexChart = VueApexCharts

const chartColors = ['#16a34a', '#2563eb', '#f97316', '#9333ea', '#0f766e', '#dc2626', '#ca8a04', '#4f46e5']
const fontFamily = 'Public Sans, sans-serif'

// تجمع عدد المدارس حسب الحقل المطلوب وتعيد النتيجة مرتبة تنازلياً.
function groupBy(field: keyof Pick<SchoolRecord, 'governorate' | 'gender' | 'authority' | 'stage'>): DistributionItem[] {
  const grouped = new Map<string, number>()

  for (const school of props.schools) {
    const label = school[field] || 'غير محدد'
    grouped.set(label, (grouped.get(label) || 0) + 1)
  }

  return Array.from(grouped.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
}

const genderDistribution = computed(() => groupBy('gender'))
const governorateDistribution = computed(() => groupBy('governorate').slice(0, 10))
const authorityDistribution = computed(() => groupBy('authority'))

// إعدادات الرسم الدائري لتوزيع المدارس حسب الجنس.
const genderChart = computed<ApexOptions>(() => ({
  chart: {
    type: 'donut',
    fontFamily,
    toolbar: { show: false }
  },
  labels: genderDistribution.value.map(item => item.label),
  series: genderDistribution.value.map(item => item.count),
  colors: chartColors.slice(0, genderDistribution.value.length),
  legend: {
    position: 'bottom',
    rtl: true,
    fontFamily,
    fontSize: '12px'
  },
  plotOptions: {
    pie: {
      donut: {
        size: '72%',
        labels: {
          show: true,
          total: {
            show: true,
            label: 'المجموع',
            formatter: () => String(props.schools.length)
          }
        }
      }
    }
  },
  dataLabels: { enabled: false },
  tooltip: { enabled: true }
}))

// إعدادات الرسم الشريطي لتوزيع المدارس حسب المحافظة.
const governorateChart = computed<ApexOptions>(() => ({
  chart: {
    type: 'bar',
    fontFamily,
    toolbar: { show: false }
  },
  plotOptions: {
    bar: {
      borderRadius: 8,
      columnWidth: '56%',
      distributed: true
    }
  },
  colors: chartColors.slice(0, governorateDistribution.value.length),
  xaxis: {
    categories: governorateDistribution.value.map(item => item.label),
    labels: {
      style: { fontFamily },
      rotate: -35
    },
    title: {
      text: 'المحافظة',
      style: { fontFamily }
    }
  },
  yaxis: {
    title: {
      text: 'عدد المدارس',
      style: { fontFamily }
    },
    labels: { style: { fontFamily } }
  },
  tooltip: {
    theme: 'light'
  }
}))

// إعدادات الرسم الدائري لتوزيع المدارس حسب السلطة.
const authorityChart = computed<ApexOptions>(() => ({
  chart: {
    type: 'donut',
    fontFamily,
    toolbar: { show: false }
  },
  labels: authorityDistribution.value.map(item => item.label),
  series: authorityDistribution.value.map(item => item.count),
  colors: chartColors.slice(0, authorityDistribution.value.length),
  legend: {
    position: 'bottom',
    rtl: true,
    fontFamily,
    fontSize: '12px'
  },
  plotOptions: {
    pie: {
      donut: {
        size: '72%',
        labels: {
          show: true,
          total: {
            show: true,
            label: 'المجموع',
            formatter: () => String(props.schools.length)
          }
        }
      }
    }
  },
  dataLabels: { enabled: false },
  tooltip: { enabled: true }
}))
</script>

<template>
  <section
    dir="rtl"
    class="grid gap-6 xl:grid-cols-3"
  >
    <UCard>
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-lg font-semibold text-foreground">
            توزيع المدارس حسب الجنس
          </h2>
          <UIcon
            name="i-lucide-chart-pie"
            class="h-5 w-5 text-primary"
          />
        </div>
      </template>

      <ApexChart
        v-if="genderDistribution.length"
        type="donut"
        :options="genderChart"
        :series="genderChart.series"
        height="280"
      />
    </UCard>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-lg font-semibold text-foreground">
            المدارس حسب المحافظة
          </h2>
          <UIcon
            name="i-lucide-map"
            class="h-5 w-5 text-primary"
          />
        </div>
      </template>

      <ApexChart
        v-if="governorateDistribution.length"
        type="bar"
        :options="governorateChart"
        :series="governorateChart.series"
        height="280"
      />
    </UCard>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-lg font-semibold text-foreground">
            توزيع المدارس حسب السلطة
          </h2>
          <UIcon
            name="i-lucide-circle-help"
            class="h-5 w-5 text-primary"
          />
        </div>
      </template>

      <ApexChart
        v-if="authorityDistribution.length"
        type="donut"
        :options="authorityChart"
        :series="authorityChart.series"
        height="280"
      />
    </UCard>
  </section>
</template>
