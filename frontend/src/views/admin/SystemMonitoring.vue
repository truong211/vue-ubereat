<template>
  <div class="system-monitoring pa-6">
    <h1 class="text-h4 mb-6">System Monitoring</h1>

    <!-- System Health Overview -->
    <v-row>
      <v-col cols="12" md="3" v-for="service in serviceHealth" :key="service.name">
        <v-card>
          <v-card-text class="text-center">
            <v-icon :color="service.status === 'healthy' ? 'success' : 'error'" size="48">
              {{ service.status === 'healthy' ? 'mdi-check-circle' : 'mdi-alert-circle' }}
            </v-icon>
            <div class="text-h6 mt-2">{{ service.name }}</div>
            <div class="text-caption">Response Time: {{ service.responseTime }}ms</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- System Metrics -->
    <v-row class="mt-6">
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>CPU & Memory Usage</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="6">
                <v-progress-circular
                  :model-value="cpuUsage"
                  :color="getCpuColor"
                  size="100"
                  width="10"
                >
                  {{ cpuUsage }}%
                </v-progress-circular>
                <div class="text-center mt-2">CPU Usage</div>
              </v-col>
              <v-col cols="6">
                <v-progress-circular
                  :model-value="memoryUsage"
                  :color="getMemoryColor"
                  size="100"
                  width="10"
                >
                  {{ memoryUsage }}%
                </v-progress-circular>
                <div class="text-center mt-2">Memory Usage</div>
              </v-col>
            </v-row>
            <v-list density="compact" class="mt-4">
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon>mdi-chip</v-icon>
                </template>
                <v-list-item-title>CPU Cores: {{ systemMetrics.cpu.cores }}</v-list-item-title>
                <v-list-item-subtitle>{{ systemMetrics.cpu.model }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon>mdi-memory</v-icon>
                </template>
                <v-list-item-title>Total Memory: {{ formatBytes(systemMetrics.memory.total) }}</v-list-item-title>
                <v-list-item-subtitle>Free: {{ formatBytes(systemMetrics.memory.free) }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>API Performance</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="6" v-for="metric in apiMetrics" :key="metric.name">
                <div class="text-h5">{{ metric.value }}</div>
                <div class="text-caption">{{ metric.name }}</div>
              </v-col>
            </v-row>
            <v-chart class="mt-4" :option="apiChartOption" autoresize />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Database Metrics -->
    <v-row class="mt-6">
      <v-col cols="12">
        <v-card>
          <v-card-title>Database Performance</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="3" v-for="metric in dbMetrics" :key="metric.name">
                <div class="text-h5">{{ metric.value }}</div>
                <div class="text-caption">{{ metric.name }}</div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Active Users -->
    <v-row class="mt-6">
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            Active Users
            <v-spacer></v-spacer>
            <div class="text-h5">{{ activeSessions }}</div>
          </v-card-title>
          <v-card-text>
            <v-chart :option="userChartOption" autoresize />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, TitleComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import axios from 'axios'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, TitleComponent])

export default {
  name: 'SystemMonitoring',
  components: { VChart },

  setup() {
    const systemMetrics = ref({
      cpu: { cores: 0, model: '', usage: 0 },
      memory: { total: 0, free: 0, usage: 0 }
    })
    const dbMetrics = ref([])
    const apiMetrics = ref([])
    const serviceHealth = ref([])
    const activeSessions = ref(0)
    const updateInterval = ref(null)

    const cpuUsage = computed(() => Math.round(systemMetrics.value.cpu.usage))
    const memoryUsage = computed(() => Math.round(systemMetrics.value.memory.usage))

    const getCpuColor = computed(() => {
      if (cpuUsage.value < 60) return 'success'
      if (cpuUsage.value < 80) return 'warning'
      return 'error'
    })

    const getMemoryColor = computed(() => {
      if (memoryUsage.value < 70) return 'success'
      if (memoryUsage.value < 90) return 'warning'
      return 'error'
    })

    const apiChartOption = computed(() => ({
      title: {
        text: 'API Response Times'
      },
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'time'
      },
      yAxis: {
        type: 'value',
        name: 'Response Time (ms)'
      },
      series: [{
        name: 'Response Time',
        type: 'line',
        data: apiMetrics.value.timeData || [],
        smooth: true,
        areaStyle: {}
      }]
    }))

    const userChartOption = computed(() => ({
      title: {
        text: 'Active Users Over Time'
      },
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'time'
      },
      yAxis: {
        type: 'value',
        name: 'Users'
      },
      series: [{
        name: 'Active Users',
        type: 'line',
        data: apiMetrics.value.userData || [],
        smooth: true,
        areaStyle: {}
      }]
    }))

    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const fetchMetrics = async () => {
      try {
        const { data } = await axios.get('/api/admin/system/metrics')
        systemMetrics.value = data.data.systemMetrics
        dbMetrics.value = [
          { name: 'Active Connections', value: data.data.dbMetrics.activeConnections },
          { name: 'Total Tables', value: data.data.dbMetrics.totalTables },
          { name: 'Database Size', value: data.data.dbMetrics.dbSizeMB + ' MB' },
          { name: 'Total Processes', value: data.data.dbMetrics.totalProcesses }
        ]
        apiMetrics.value = [
          { name: 'Total Calls', value: data.data.apiMetrics.totalApiCalls },
          { name: 'Avg Response', value: Math.round(data.data.apiMetrics.avgResponseTime) + 'ms' },
          { name: 'Error Rate', value: ((data.data.apiMetrics.errorCount / data.data.apiMetrics.totalApiCalls) * 100).toFixed(2) + '%' },
          { name: 'Success Rate', value: (100 - (data.data.apiMetrics.errorCount / data.data.apiMetrics.totalApiCalls) * 100).toFixed(2) + '%' }
        ]
        serviceHealth.value = Object.entries(data.data.serviceHealth).map(([name, health]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          status: health.status,
          responseTime: health.responseTime
        }))
        activeSessions.value = data.data.activeSessions
      } catch (error) {
        console.error('Error fetching system metrics:', error)
      }
    }

    onMounted(() => {
      fetchMetrics()
      updateInterval.value = setInterval(fetchMetrics, 30000) // Update every 30 seconds
    })

    onUnmounted(() => {
      if (updateInterval.value) {
        clearInterval(updateInterval.value)
      }
    })

    return {
      systemMetrics,
      dbMetrics,
      apiMetrics,
      serviceHealth,
      activeSessions,
      cpuUsage,
      memoryUsage,
      getCpuColor,
      getMemoryColor,
      apiChartOption,
      userChartOption,
      formatBytes
    }
  }
}
</script>

<style scoped>
.system-monitoring {
  max-width: 1600px;
  margin: 0 auto;
}

.v-progress-circular {
  margin: 0 auto;
  display: block;
}
</style>