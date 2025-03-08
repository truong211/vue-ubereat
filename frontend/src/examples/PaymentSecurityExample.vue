<template>
  <div class="payment-security-examples">
    <h2 class="text-h5 mb-4">Payment Security Examples</h2>

    <!-- Example 1: Basic Transaction Monitoring -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Transaction Monitoring</h3>
      <v-card>
        <v-card-text>
          <payment-security-manager
            :transaction="sampleTransaction"
            @verification-complete="handleVerificationComplete"
            @review-submitted="handleReviewSubmitted"
          />
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ basicExample }}</pre>
        </v-card-text>
      </v-card>
    </section>

    <!-- Example 2: Transaction List with Security -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Transaction List</h3>
      <v-card>
        <v-card-text>
          <v-row>
            <!-- Transaction List -->
            <v-col cols="12" md="4">
              <v-card variant="outlined">
                <v-card-title>Recent Transactions</v-card-title>
                <v-list select-strategy="single-select" v-model="selectedTransaction">
                  <v-list-item
                    v-for="transaction in transactions"
                    :key="transaction.id"
                    :value="transaction"
                  >
                    <template v-slot:prepend>
                      <v-avatar
                        :color="getRiskColor(transaction.riskLevel)"
                        size="32"
                      >
                        <v-icon color="white">
                          {{ getRiskIcon(transaction.riskLevel) }}
                        </v-icon>
                      </v-avatar>
                    </template>

                    <v-list-item-title>${{ transaction.amount }}</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ transaction.paymentMethod }}
                    </v-list-item-subtitle>

                    <template v-slot:append>
                      <v-chip
                        :color="getRiskColor(transaction.riskLevel)"
                        size="small"
                      >
                        {{ transaction.riskLevel }}
                      </v-chip>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-col>

            <!-- Security Manager -->
            <v-col cols="12" md="8">
              <div v-if="selectedTransaction">
                <payment-security-manager
                  :transaction="selectedTransaction"
                  @verification-complete="handleVerificationComplete"
                  @review-submitted="handleReviewSubmitted"
                />
              </div>
              <div v-else class="text-center py-8">
                <v-icon size="64" color="grey-lighten-1">mdi-shield</v-icon>
                <div class="text-h6 mt-4">Select a Transaction</div>
                <div class="text-body-1 text-medium-emphasis">
                  Choose a transaction to view security details
                </div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ listExample }}</pre>
        </v-card-text>
      </v-card>
    </section>

    <!-- Example 3: Security Dashboard -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Security Dashboard</h3>
      <v-card>
        <v-card-text>
          <v-row>
            <!-- Security Stats -->
            <v-col cols="12" md="4">
              <v-row>
                <!-- Risk Score -->
                <v-col cols="6">
                  <v-card variant="outlined">
                    <v-card-text class="text-center">
                      <div class="text-h3">{{ stats.averageRiskScore }}</div>
                      <div class="text-caption">Average Risk Score</div>
                    </v-card-text>
                  </v-card>
                </v-col>

                <!-- Flagged Transactions -->
                <v-col cols="6">
                  <v-card variant="outlined">
                    <v-card-text class="text-center">
                      <div class="text-h3">{{ stats.flaggedCount }}</div>
                      <div class="text-caption">Flagged Transactions</div>
                    </v-card-text>
                  </v-card>
                </v-col>

                <!-- Success Rate -->
                <v-col cols="12">
                  <v-card variant="outlined">
                    <v-card-text>
                      <div class="text-center mb-2">Verification Success Rate</div>
                      <v-progress-linear
                        :model-value="stats.successRate"
                        color="success"
                        height="20"
                      >
                        <template v-slot:default>
                          {{ stats.successRate }}%
                        </template>
                      </v-progress-linear>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-col>

            <!-- Risk Distribution -->
            <v-col cols="12" md="8">
              <v-card variant="outlined">
                <v-card-title>Risk Distribution</v-card-title>
                <v-card-text>
                  <v-chart
                    :option="chartOptions"
                    autoresize
                    style="width: 100%; height: 300px;"
                  />
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ dashboardExample }}</pre>
        </v-card-text>
      </v-card>
    </section>
  </div>
</template>

<script lang="ts">
import { ref, computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import PaymentSecurityManager from '@/components/payment/PaymentSecurityManager.vue'

// Register ECharts components
use([
  CanvasRenderer,
  BarChart,
  TitleComponent,
  TooltipComponent,
  GridComponent
])

export default {
  name: 'PaymentSecurityExample',

  components: {
    PaymentSecurityManager,
    VChart
  },

  setup() {
    // Sample transaction
    const sampleTransaction = {
      id: '1',
      amount: 299.99,
      paymentMethod: 'visa',
      location: 'Bangkok, Thailand',
      device: 'iPhone 13',
      ipAddress: '192.168.1.1',
      riskLevel: 'medium',
      riskScore: 65
    }

    // Transaction list
    const transactions = ref([
      {
        id: '1',
        amount: 299.99,
        paymentMethod: 'visa',
        location: 'Bangkok, Thailand',
        device: 'iPhone 13',
        ipAddress: '192.168.1.1',
        riskLevel: 'medium',
        riskScore: 65
      },
      {
        id: '2',
        amount: 999.99,
        paymentMethod: 'mastercard',
        location: 'London, UK',
        device: 'Chrome Browser',
        ipAddress: '10.0.0.1',
        riskLevel: 'high',
        riskScore: 85
      },
      {
        id: '3',
        amount: 49.99,
        paymentMethod: 'paypal',
        location: 'New York, USA',
        device: 'Android Phone',
        ipAddress: '172.16.0.1',
        riskLevel: 'low',
        riskScore: 25
      }
    ])

    const selectedTransaction = ref(null)

    // Security stats
    const stats = ref({
      averageRiskScore: 58,
      flaggedCount: 12,
      successRate: 94
    })

    // Chart options
    const chartOptions = computed(() => ({
      tooltip: {
        trigger: 'axis'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: ['Low', 'Medium', 'High']
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: 'Transactions',
          type: 'bar',
          data: [30, 15, 5],
          itemStyle: {
            color: function(params: any) {
              const colors = ['#4CAF50', '#FB8C00', '#F44336']
              return colors[params.dataIndex]
            }
          }
        }
      ]
    }))

    // Methods
    const getRiskColor = (level: string) => {
      const colors = {
        low: 'success',
        medium: 'warning',
        high: 'error'
      }
      return colors[level] || 'grey'
    }

    const getRiskIcon = (level: string) => {
      const icons = {
        low: 'mdi-shield-check',
        medium: 'mdi-shield-alert',
        high: 'mdi-shield-off'
      }
      return icons[level] || 'mdi-shield'
    }

    const handleVerificationComplete = (success: boolean) => {
      console.log('Verification complete:', success)
    }

    const handleReviewSubmitted = (review: any) => {
      console.log('Review submitted:', review)
    }

    // Code examples
    const basicExample = `<payment-security-manager
  :transaction="{
    id: '1',
    amount: 299.99,
    paymentMethod: 'visa',
    location: 'Bangkok, Thailand',
    riskLevel: 'medium',
    riskScore: 65
  }"
  @verification-complete="handleVerificationComplete"
  @review-submitted="handleReviewSubmitted"
/>`

    const listExample = `<!-- Transaction List -->
<v-list v-model="selectedTransaction">
  <v-list-item
    v-for="transaction in transactions"
    :key="transaction.id"
    :value="transaction"
  >
    <!-- Transaction details -->
  </v-list-item>
</v-list>

<!-- Security Manager -->
<payment-security-manager
  v-if="selectedTransaction"
  :transaction="selectedTransaction"
  @verification-complete="handleVerificationComplete"
/>`

    const dashboardExample = `<!-- Security Stats -->
<v-row>
  <v-col>
    <div class="text-h3">{{ stats.averageRiskScore }}</div>
    <div class="text-caption">Average Risk Score</div>
  </v-col>
</v-row>

<!-- Risk Distribution Chart -->
<v-chart
  :option="chartOptions"
  autoresize
/>`

    return {
      sampleTransaction,
      transactions,
      selectedTransaction,
      stats,
      chartOptions,
      getRiskColor,
      getRiskIcon,
      handleVerificationComplete,
      handleReviewSubmitted,
      basicExample,
      listExample,
      dashboardExample
    }
  }
}
</script>

<style scoped>
.payment-security-examples {
  padding: 16px;
}

.code-example {
  font-family: monospace;
  white-space: pre-wrap;
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
  overflow-x: auto;
}
</style>