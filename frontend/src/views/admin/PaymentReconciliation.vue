<template>
  <div class="payment-reconciliation">
    <v-container>
      <!-- Header -->
      <div class="d-flex align-center mb-6">
        <h1 class="text-h4">Payment Reconciliation</h1>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          prepend-icon="mdi-sync"
          @click="runReconciliation"
          :loading="reconciling"
        >
          Run Reconciliation
        </v-btn>
      </div>

      <!-- Filters -->
      <v-card class="mb-6">
        <v-card-text>
          <v-row>
            <v-col cols="12" sm="4">
              <v-select
                v-model="filters.status"
                :items="statusOptions"
                label="Payment Status"
                multiple
                chips
                clearable
              ></v-select>
            </v-col>
            <v-col cols="12" sm="4">
              <v-select
                v-model="filters.paymentMethod"
                :items="paymentMethodOptions"
                label="Payment Method"
                multiple
                chips
                clearable
              ></v-select>
            </v-col>
            <v-col cols="12" sm="4">
              <v-menu
                :close-on-content-click="false"
                transition="scale-transition"
              >
                <template v-slot:activator="{ props }">
                  <v-text-field
                    v-model="filters.dateRange"
                    label="Date Range"
                    readonly
                    v-bind="props"
                    prepend-icon="mdi-calendar"
                    clearable
                    @click:clear="clearDateRange"
                  ></v-text-field>
                </template>
                <v-date-picker
                  v-model="dateRange"
                  range
                  @update:model-value="updateDateRange"
                ></v-date-picker>
              </v-menu>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Payments Table -->
      <v-card>
        <v-data-table
          :headers="headers"
          :items="payments"
          :loading="loading"
          :server-items-length="totalPayments"
          :items-per-page="itemsPerPage"
          @update:options="fetchPayments"
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

          <!-- Actions Column -->
          <template v-slot:item.actions="{ item }">
            <v-btn
              icon="mdi-sync"
              size="small"
              color="primary"
              variant="text"
              @click="reconcilePayment(item)"
              :loading="reconciling && reconcillingId === item.id"
              :disabled="!canReconcile(item)"
            ></v-btn>
            <v-btn
              icon="mdi-file-download"
              size="small"
              color="secondary"
              variant="text"
              @click="downloadReceipt(item)"
              :disabled="!canDownloadReceipt(item)"
            ></v-btn>
          </template>
        </v-data-table>
      </v-card>
    </v-container>

    <!-- Reconciliation Results Dialog -->
    <v-dialog v-model="showResults" max-width="600">
      <v-card>
        <v-card-title class="text-h5">
          Reconciliation Results
        </v-card-title>
        <v-card-text>
          <v-list>
            <v-list-item v-for="result in reconciliationResults" :key="result.payment_id">
              <template v-slot:prepend>
                <v-icon
                  :color="result.reconciled ? 'success' : 'error'"
                  :icon="result.reconciled ? 'mdi-check-circle' : 'mdi-alert-circle'"
                ></v-icon>
              </template>
              <v-list-item-title>
                Payment #{{ result.payment_id }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ result.reconciled ? 'Successfully reconciled' : result.error || result.reason }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="text"
            @click="showResults = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import paymentService from '@/services/payment.service';

export default {
  name: 'PaymentReconciliation',

  setup() {
    const loading = ref(false);
    const reconciling = ref(false);
    const reconcillingId = ref(null);
    const payments = ref([]);
    const totalPayments = ref(0);
    const itemsPerPage = ref(10);
    const showResults = ref(false);
    const reconciliationResults = ref([]);
    const dateRange = ref([]);

    const filters = ref({
      status: [],
      paymentMethod: [],
      dateRange: null
    });

    const statusOptions = [
      { title: 'Pending', value: 'pending' },
      { title: 'Completed', value: 'completed' },
      { title: 'Failed', value: 'failed' }
    ];

    const paymentMethodOptions = [
      { title: 'VNPay', value: 'vnpay' },
      { title: 'Momo', value: 'momo' },
      { title: 'ZaloPay', value: 'zalopay' },
      { title: 'Card', value: 'card' },
      { title: 'Cash', value: 'cash' }
    ];

    const headers = [
      { title: 'Payment ID', key: 'id', sortable: true },
      { title: 'Order ID', key: 'order_id', sortable: true },
      { title: 'Method', key: 'payment_method', sortable: true },
      { title: 'Amount', key: 'amount', sortable: true },
      { title: 'Status', key: 'status', sortable: true },
      { title: 'Date', key: 'created_at', sortable: true },
      { title: 'Actions', key: 'actions', sortable: false }
    ];

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

    const canReconcile = (payment) => {
      return payment.status === 'pending';
    };

    const canDownloadReceipt = (payment) => {
      return ['completed', 'succeeded'].includes(payment.status);
    };

    const fetchPayments = async (options) => {
      try {
        loading.value = true;
        const response = await paymentService.getPayments({
          page: options.page,
          itemsPerPage: options.itemsPerPage,
          sortBy: options.sortBy,
          filters: filters.value
        });
        payments.value = response.data;
        totalPayments.value = response.total;
      } catch (error) {
        console.error('Failed to fetch payments:', error);
      } finally {
        loading.value = false;
      }
    };

    const reconcilePayment = async (payment) => {
      try {
        reconciling.value = true;
        reconcillingId.value = payment.id;
        const result = await paymentService.reconcilePayment(payment.id);
        // Refresh the payments list
        fetchPayments({ page: 1, itemsPerPage: itemsPerPage.value });
      } catch (error) {
        console.error('Failed to reconcile payment:', error);
      } finally {
        reconciling.value = false;
        reconcillingId.value = null;
      }
    };

    const runReconciliation = async () => {
      try {
        reconciling.value = true;
        const results = await paymentService.reconcileAllPayments();
        reconciliationResults.value = results;
        showResults.value = true;
        // Refresh the payments list
        fetchPayments({ page: 1, itemsPerPage: itemsPerPage.value });
      } catch (error) {
        console.error('Failed to run reconciliation:', error);
      } finally {
        reconciling.value = false;
      }
    };

    const downloadReceipt = async (payment) => {
      try {
        await paymentService.downloadReceipt(payment.id);
      } catch (error) {
        console.error('Failed to download receipt:', error);
      }
    };

    const updateDateRange = (range) => {
      if (range && range.length === 2) {
        filters.value.dateRange = `${range[0]} - ${range[1]}`;
      }
    };

    const clearDateRange = () => {
      dateRange.value = [];
      filters.value.dateRange = null;
    };

    return {
      loading,
      reconciling,
      reconcillingId,
      payments,
      totalPayments,
      itemsPerPage,
      filters,
      statusOptions,
      paymentMethodOptions,
      headers,
      showResults,
      reconciliationResults,
      dateRange,
      formatCurrency,
      formatDate,
      getStatusColor,
      canReconcile,
      canDownloadReceipt,
      fetchPayments,
      reconcilePayment,
      runReconciliation,
      downloadReceipt,
      updateDateRange,
      clearDateRange
    };
  }
};
</script>

<style scoped>
.payment-reconciliation {
  padding: 24px;
}
</style>