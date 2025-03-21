<template>
  <div class="payment-reports">
    <v-container>
      <!-- Header -->
      <div class="d-flex align-center mb-6">
        <h1 class="text-h4">Payment Reports</h1>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          prepend-icon="mdi-file-download"
          @click="downloadReport"
          :loading="downloading"
        >
          Download Report
        </v-btn>
      </div>

      <!-- Summary Cards -->
      <v-row>
        <v-col cols="12" sm="6" md="3">
          <v-card>
            <v-card-text>
              <div class="d-flex align-center">
                <div>
                  <div class="text-overline mb-1">Total Transactions</div>
                  <div class="text-h4">{{ stats.totalTransactions }}</div>
                </div>
                <v-spacer></v-spacer>
                <v-icon color="primary" size="48">mdi-cash-multiple</v-icon>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card>
            <v-card-text>
              <div class="d-flex align-center">
                <div>
                  <div class="text-overline mb-1">Total Revenue</div>
                  <div class="text-h4">{{ formatCurrency(stats.totalRevenue) }}</div>
                </div>
                <v-spacer></v-spacer>
                <v-icon color="success" size="48">mdi-currency-usd</v-icon>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card>
            <v-card-text>
              <div class="d-flex align-center">
                <div>
                  <div class="text-overline mb-1">Success Rate</div>
                  <div class="text-h4">{{ stats.successRate }}%</div>
                </div>
                <v-spacer></v-spacer>
                <v-icon :color="getSuccessRateColor" size="48">mdi-chart-line-variant</v-icon>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card>
            <v-card-text>
              <div class="d-flex align-center">
                <div>
                  <div class="text-overline mb-1">Avg. Transaction</div>
                  <div class="text-h4">{{ formatCurrency(stats.avgTransaction) }}</div>
                </div>
                <v-spacer></v-spacer>
                <v-icon color="info" size="48">mdi-calculator</v-icon>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Charts -->
      <v-row class="mt-6">
        <!-- Payment Methods Distribution -->
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title>Payment Methods Distribution</v-card-title>
            <v-card-text>
              <v-chart class="chart" :option="paymentMethodsChart" autoresize />
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Daily Transactions -->
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title>Daily Transactions</v-card-title>
            <v-card-text>
              <v-chart class="chart" :option="dailyTransactionsChart" autoresize />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Transaction History Table -->
      <v-card class="mt-6">
        <v-card-title>Recent Transactions</v-card-title>
        <v-data-table
          :headers="headers"
          :items="recentTransactions"
          :loading="loading"
        >
          <!-- Status Column -->
          <template v-slot:item.status="{ item }">
            <v-chip
              :color="getStatusColor(item.status)"
              size="small"
            >
              {{ item.status }}
            </v-chip>
          </template>

          <!-- Amount Column -->
          <template v-slot:item.amount="{ item }">
            {{ formatCurrency(item.amount) }}
          </template>

          <!-- Date Column -->
          <template v-slot:item.created_at="{ item }">
            {{ formatDate(item.created_at) }}
          </template>
        </v-data-table>
      </v-card>
    </v-container>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { PieChart, LineChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components';
import VChart from 'vue-echarts';
import paymentService from '@/services/payment.service';

use([
  CanvasRenderer,
  PieChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
]);

export default {
  name: 'PaymentReports',

  components: {
    VChart
  },

  setup() {
    const loading = ref(false);
    const downloading = ref(false);
    const stats = ref({
      totalTransactions: 0,
      totalRevenue: 0,
      successRate: 0,
      avgTransaction: 0
    });
    const recentTransactions = ref([]);

    const headers = [
      { title: 'Transaction ID', key: 'id' },
      { title: 'Order ID', key: 'order_id' },
      { title: 'Method', key: 'payment_method' },
      { title: 'Amount', key: 'amount' },
      { title: 'Status', key: 'status' },
      { title: 'Date', key: 'created_at' }
    ];

    const paymentMethodsChart = ref({
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      series: [{
        type: 'pie',
        radius: '70%',
        data: [],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    });

    const dailyTransactionsChart = ref({
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: []
      },
      yAxis: {
        type: 'value'
      },
      series: [{
        data: [],
        type: 'line',
        smooth: true
      }]
    });

    const getSuccessRateColor = computed(() => {
      const rate = stats.value.successRate;
      if (rate >= 90) return 'success';
      if (rate >= 70) return 'warning';
      return 'error';
    });

    const formatCurrency = (value) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(value);
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleString('vi-VN');
    };

    const getStatusColor = (status) => {
      const colors = {
        completed: 'success',
        pending: 'warning',
        failed: 'error'
      };
      return colors[status.toLowerCase()] || 'grey';
    };

    const loadData = async () => {
      try {
        loading.value = true;
        const data = await paymentService.getPaymentStats();
        
        // Update stats
        stats.value = data.stats;
        recentTransactions.value = data.recentTransactions;

        // Update payment methods chart
        paymentMethodsChart.value.series[0].data = data.paymentMethodsDistribution.map(item => ({
          name: item.method,
          value: item.count
        }));

        // Update daily transactions chart
        dailyTransactionsChart.value.xAxis.data = data.dailyTransactions.map(item => item.date);
        dailyTransactionsChart.value.series[0].data = data.dailyTransactions.map(item => item.count);
      } catch (error) {
        console.error('Failed to load payment statistics:', error);
      } finally {
        loading.value = false;
      }
    };

    const downloadReport = async () => {
      try {
        downloading.value = true;
        await paymentService.downloadPaymentReport();
      } catch (error) {
        console.error('Failed to download report:', error);
      } finally {
        downloading.value = false;
      }
    };

    onMounted(() => {
      loadData();
    });

    return {
      loading,
      downloading,
      stats,
      recentTransactions,
      headers,
      paymentMethodsChart,
      dailyTransactionsChart,
      getSuccessRateColor,
      formatCurrency,
      formatDate,
      getStatusColor,
      downloadReport
    };
  }
};
</script>

<style scoped>
.payment-reports {
  padding: 24px;
}

.chart {
  height: 400px;
}
</style>