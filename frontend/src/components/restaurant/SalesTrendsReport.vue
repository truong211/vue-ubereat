<template>
  <!-- Previous template content remains the same -->
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Store } from 'vuex'
import { storeKey } from '@/store'
import { inject } from 'vue'
import type { ComposeOption } from 'echarts/core'
import {
  LineChart,
  BarChart,
  PieChart,
  LineSeriesOption,
  BarSeriesOption,
  PieSeriesOption
} from 'echarts/charts'
import {
  TitleComponent,
  TitleComponentOption,
  TooltipComponent,
  TooltipComponentOption,
  GridComponent,
  GridComponentOption,
  LegendComponent,
  LegendComponentOption
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'

// Define chart option types
type ECOption = ComposeOption<
  | LineSeriesOption
  | BarSeriesOption
  | PieSeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | GridComponentOption
  | LegendComponentOption
>

// Register ECharts components
use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
])

interface BestSeller {
  id: string
  name: string
  image: string
  quantity: number
  revenue: number
  trend: number
}

interface KeyMetric {
  name: string
  value: number
  change: number
  format: 'currency' | 'percent' | 'number'
}

interface Insight {
  id: string
  title: string
  description: string
  icon: string
  type: 'success' | 'warning' | 'error' | 'info'
}

const { t } = useI18n()
const store = inject<Store<any>>(storeKey)!

// State
const timePeriod = ref('month')
const timePeriods = computed(() => [
  { title: t('restaurant.reports.periods.week'), value: 'week' },
  { title: t('restaurant.reports.periods.month'), value: 'month' },
  { title: t('restaurant.reports.periods.quarter'), value: 'quarter' },
  { title: t('restaurant.reports.periods.year'), value: 'year' },
])

// Data
const bestSellers = ref<BestSeller[]>([])
const keyMetrics = ref<KeyMetric[]>([])
const insights = ref<Insight[]>([])

// Charts
const categoryChartOption = computed<ECOption>(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c} ({d}%)'
  },
  legend: {
    orient: 'vertical',
    left: 'left'
  },
  series: [
    {
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 20,
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: [
        { value: 1048, name: t('restaurant.reports.chart.mainDishes') },
        { value: 735, name: t('restaurant.reports.chart.beverages') },
        { value: 580, name: t('restaurant.reports.chart.appetizers') },
        { value: 484, name: t('restaurant.reports.chart.desserts') },
        { value: 300, name: t('restaurant.reports.chart.others') }
      ]
    }
  ]
}))

const trendsChartOption = computed<ECOption>(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
      label: {
        backgroundColor: '#6a7985'
      }
    }
  },
  legend: {
    data: [
      t('restaurant.reports.chart.revenue'),
      t('restaurant.reports.chart.orders'),
      t('restaurant.reports.chart.averageOrder')
    ]
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: [
    {
      type: 'category',
      boundaryGap: false,
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    }
  ],
  yAxis: [
    {
      type: 'value'
    }
  ],
  series: [
    {
      name: t('restaurant.reports.chart.revenue'),
      type: 'line',
      stack: 'Total',
      areaStyle: {},
      emphasis: {
        focus: 'series'
      },
      data: [120, 132, 101, 134, 90, 230, 210]
    },
    {
      name: t('restaurant.reports.chart.orders'),
      type: 'line',
      stack: 'Total',
      areaStyle: {},
      emphasis: {
        focus: 'series'
      },
      data: [220, 182, 191, 234, 290, 330, 310]
    },
    {
      name: t('restaurant.reports.chart.averageOrder'),
      type: 'line',
      stack: 'Total',
      areaStyle: {},
      emphasis: {
        focus: 'series'
      },
      data: [150, 232, 201, 154, 190, 330, 410]
    }
  ]
}))

// Methods
const loadData = async () => {
  try {
    const data = await store.dispatch('restaurant/getSalesTrends', {
      period: timePeriod.value
    })
    bestSellers.value = data.bestSellers
    keyMetrics.value = data.metrics
    insights.value = data.insights
  } catch (error) {
    console.error('Error loading sales trends:', error)
  }
}

const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)
}

const formatMetricValue = (metric: KeyMetric): string => {
  switch (metric.format) {
    case 'currency':
      return formatPrice(metric.value)
    case 'percent':
      return `${metric.value}%`
    default:
      return metric.value.toLocaleString('vi-VN')
  }
}

const downloadReport = async () => {
  try {
    const response = await store.dispatch('restaurant/downloadSalesReport', {
      period: timePeriod.value
    })
    // Handle file download
    const url = window.URL.createObjectURL(new Blob([response]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `sales-report-${timePeriod.value}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
  } catch (error) {
    console.error('Error downloading report:', error)
  }
}

// Watch for period changes
watch(timePeriod, () => {
  loadData()
})

// Load initial data
onMounted(() => {
  loadData()
})

// Expose to template
defineExpose({
  timePeriod,
  timePeriods,
  bestSellers,
  keyMetrics,
  insights,
  categoryChartOption,
  trendsChartOption,
  formatPrice,
  formatMetricValue,
  downloadReport
})
</script>

<style scoped>
.sales-trends-report {
  padding: 16px;
}

.chart {
  height: 400px;
}

:deep(.v-card-text) {
  padding: 16px;
}

.metric-value {
  font-size: 2rem;
  font-weight: 500;
}

.metric-label {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.6);
}
</style>