<template>
  <div class="invoice-viewer">
    <!-- Invoice Card -->
    <v-card class="mb-4">
      <v-card-title class="d-flex justify-space-between">
        <span>{{ $t('invoice.title') }}</span>
        <div>
          <v-btn
            icon="mdi-download"
            variant="text"
            @click="downloadPDF"
            :loading="downloading"
          >
            <v-tooltip activator="parent">
              {{ $t('invoice.downloadPDF') }}
            </v-tooltip>
          </v-btn>
          <v-btn
            icon="mdi-email"
            variant="text"
            @click="showEmailDialog = true"
          >
            <v-tooltip activator="parent">
              {{ $t('invoice.sendEmail') }}
            </v-tooltip>
          </v-btn>
        </div>
      </v-card-title>

      <v-divider></v-divider>

      <!-- Invoice Details -->
      <v-card-text>
        <v-row>
          <!-- Invoice Info -->
          <v-col cols="12" md="6">
            <div class="text-subtitle-1 font-weight-bold mb-2">
              {{ $t('invoice.info') }}
            </div>
            <div class="mb-2">
              <strong>{{ $t('invoice.number') }}:</strong> {{ invoice.number }}
            </div>
            <div class="mb-2">
              <strong>{{ $t('invoice.date') }}:</strong> {{ formatDate(invoice.date) }}
            </div>
            <div class="mb-2">
              <strong>{{ $t('invoice.status') }}:</strong>
              <v-chip
                :color="getStatusColor(invoice.status)"
                size="small"
                class="ml-2"
              >
                {{ $t(`invoice.statuses.${invoice.status}`) }}
              </v-chip>
            </div>
          </v-col>

          <!-- Customer Info -->
          <v-col cols="12" md="6">
            <div class="text-subtitle-1 font-weight-bold mb-2">
              {{ $t('invoice.customer') }}
            </div>
            <div class="mb-2">{{ invoice.customerName }}</div>
            <div class="mb-2">{{ invoice.customerEmail }}</div>
            <div>{{ invoice.customerAddress }}</div>
          </v-col>
        </v-row>

        <!-- Order Items -->
        <div class="mt-6">
          <div class="text-subtitle-1 font-weight-bold mb-2">
            {{ $t('invoice.items') }}
          </div>
          <v-table>
            <thead>
              <tr>
                <th>{{ $t('invoice.item') }}</th>
                <th class="text-right">{{ $t('invoice.quantity') }}</th>
                <th class="text-right">{{ $t('invoice.price') }}</th>
                <th class="text-right">{{ $t('invoice.total') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in invoice.items" :key="item.id">
                <td>{{ item.name }}</td>
                <td class="text-right">{{ item.quantity }}</td>
                <td class="text-right">{{ formatCurrency(item.price) }}</td>
                <td class="text-right">{{ formatCurrency(item.quantity * item.price) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" class="text-right font-weight-bold">{{ $t('invoice.subtotal') }}</td>
                <td class="text-right">{{ formatCurrency(invoice.subtotal) }}</td>
              </tr>
              <tr>
                <td colspan="3" class="text-right font-weight-bold">{{ $t('invoice.tax') }}</td>
                <td class="text-right">{{ formatCurrency(invoice.tax) }}</td>
              </tr>
              <tr>
                <td colspan="3" class="text-right text-h6 font-weight-bold">{{ $t('invoice.total') }}</td>
                <td class="text-right text-h6">{{ formatCurrency(invoice.total) }}</td>
              </tr>
            </tfoot>
          </v-table>
        </div>

        <!-- Refund Section -->
        <div v-if="canRequestRefund" class="mt-6">
          <v-divider class="mb-4"></v-divider>
          <div class="text-subtitle-1 font-weight-bold mb-2">
            {{ $t('invoice.refund.title') }}
          </div>
          <v-alert
            type="info"
            variant="tonal"
            class="mb-4"
          >
            {{ $t('invoice.refund.info') }}
          </v-alert>
          <v-btn
            color="error"
            variant="outlined"
            @click="showRefundDialog = true"
            :disabled="processingRefund"
          >
            {{ $t('invoice.refund.request') }}
          </v-btn>
        </div>

        <!-- Refund Status -->
        <div v-if="invoice.refund" class="mt-6">
          <v-divider class="mb-4"></v-divider>
          <div class="text-subtitle-1 font-weight-bold mb-2">
            {{ $t('invoice.refund.status') }}
          </div>
          <v-alert
            :type="getRefundStatusType(invoice.refund.status)"
            variant="tonal"
          >
            <div class="font-weight-bold mb-1">
              {{ $t(`invoice.refund.statuses.${invoice.refund.status}`) }}
            </div>
            <div v-if="invoice.refund.reason" class="text-body-2">
              {{ invoice.refund.reason }}
            </div>
            <div class="text-body-2">
              {{ formatDate(invoice.refund.date) }}
            </div>
          </v-alert>
        </div>
      </v-card-text>
    </v-card>

    <!-- Email Dialog -->
    <v-dialog v-model="showEmailDialog" max-width="400">
      <v-card>
        <v-card-title>{{ $t('invoice.sendEmail') }}</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="emailAddress"
            :label="$t('common.email')"
            type="email"
            variant="outlined"
            :rules="[v => !!v || $t('validation.required')]"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showEmailDialog = false"
          >
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            :loading="sendingEmail"
            @click="sendEmail"
          >
            {{ $t('common.send') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Refund Dialog -->
    <v-dialog v-model="showRefundDialog" max-width="500">
      <v-card>
        <v-card-title>{{ $t('invoice.refund.request') }}</v-card-title>
        <v-card-text>
          <v-textarea
            v-model="refundReason"
            :label="$t('invoice.refund.reason')"
            variant="outlined"
            :rules="[v => !!v || $t('validation.required')]"
            rows="3"
          ></v-textarea>

          <v-alert
            type="warning"
            variant="tonal"
            class="mt-4"
          >
            {{ $t('invoice.refund.warning') }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showRefundDialog = false"
          >
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            :loading="processingRefund"
            @click="requestRefund"
          >
            {{ $t('invoice.refund.confirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import InvoiceService from '@/services/invoice.service'
import PaymentService from '@/services/payment.service'

export default {
  name: 'InvoiceViewer',

  props: {
    invoice: {
      type: Object,
      required: true
    }
  },

  setup(props) {
    const { t } = useI18n()
    
    // State
    const downloading = ref(false)
    const showEmailDialog = ref(false)
    const showRefundDialog = ref(false)
    const sendingEmail = ref(false)
    const processingRefund = ref(false)
    const emailAddress = ref('')
    const refundReason = ref('')

    // Computed
    const canRequestRefund = computed(() => {
      return props.invoice.status === 'paid' && 
             !props.invoice.refund &&
             Date.now() - new Date(props.invoice.date).getTime() < 24 * 60 * 60 * 1000 // 24 hours
    })

    // Methods
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString()
    }

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(amount)
    }

    const getStatusColor = (status) => {
      const colors = {
        paid: 'success',
        pending: 'warning',
        refunded: 'error',
        cancelled: 'error'
      }
      return colors[status] || 'grey'
    }

    const getRefundStatusType = (status) => {
      const types = {
        pending: 'warning',
        approved: 'success',
        rejected: 'error'
      }
      return types[status] || 'info'
    }

    const downloadPDF = async () => {
      try {
        downloading.value = true
        const pdf = await InvoiceService.getInvoicePDF(props.invoice.id)
        
        // Create blob and download
        const blob = new Blob([pdf], { type: 'application/pdf' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `invoice-${props.invoice.number}.pdf`
        link.click()
        window.URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Error downloading PDF:', error)
      } finally {
        downloading.value = false
      }
    }

    const sendEmail = async () => {
      if (!emailAddress.value) return

      try {
        sendingEmail.value = true
        await InvoiceService.sendInvoiceEmail(props.invoice.id, emailAddress.value)
        showEmailDialog.value = false
        emailAddress.value = ''
      } catch (error) {
        console.error('Error sending email:', error)
      } finally {
        sendingEmail.value = false
      }
    }

    const requestRefund = async () => {
      if (!refundReason.value) return

      try {
        processingRefund.value = true
        await PaymentService.requestRefund({
          orderId: props.invoice.orderId,
          amount: props.invoice.total,
          reason: refundReason.value
        })
        showRefundDialog.value = false
        refundReason.value = ''
      } catch (error) {
        console.error('Error requesting refund:', error)
      } finally {
        processingRefund.value = false
      }
    }

    return {
      downloading,
      showEmailDialog,
      showRefundDialog,
      sendingEmail,
      processingRefund,
      emailAddress,
      refundReason,
      canRequestRefund,
      formatDate,
      formatCurrency,
      getStatusColor,
      getRefundStatusType,
      downloadPDF,
      sendEmail,
      requestRefund
    }
  }
}
</script>

<style scoped>
.invoice-viewer {
  max-width: 800px;
  margin: 0 auto;
}

@media print {
  .v-btn,
  .v-dialog {
    display: none !important;
  }
}
</style>