<template>
  <div class="payment-security">
    <!-- Risk Status -->
    <v-card :color="getRiskStatusColor" variant="outlined">
      <v-card-text>
        <div class="d-flex align-center">
          <v-icon :color="getRiskStatusColor" size="32" class="mr-4">
            {{ getRiskStatusIcon }}
          </v-icon>
          <div>
            <div class="text-h6">Risk Level: {{ transaction.riskLevel }}</div>
            <div class="text-subtitle-2">Score: {{ transaction.riskScore }}/100</div>
          </div>
          <v-spacer></v-spacer>
          <v-btn
            v-if="requiresReview"
            color="primary"
            :loading="reviewing"
            @click="reviewTransaction"
          >
            Review
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- Risk Factors -->
    <v-card class="mt-4">
      <v-card-title>Risk Analysis</v-card-title>
      <v-card-text>
        <v-list>
          <v-list-item
            v-for="factor in riskFactors"
            :key="factor.id"
            :value="factor"
          >
            <template v-slot:prepend>
              <v-icon :color="getRiskFactorColor(factor.severity)">
                {{ getRiskFactorIcon(factor.type) }}
              </v-icon>
            </template>

            <v-list-item-title>{{ factor.name }}</v-list-item-title>
            <v-list-item-subtitle>{{ factor.description }}</v-list-item-subtitle>

            <template v-slot:append>
              <v-chip
                :color="getRiskFactorColor(factor.severity)"
                size="small"
              >
                {{ factor.severity }}
              </v-chip>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>

    <!-- Verification Steps -->
    <v-card class="mt-4">
      <v-card-title class="d-flex justify-space-between align-center">
        Verification Steps
        <v-btn
          v-if="!allStepsCompleted"
          color="primary"
          prepend-icon="mdi-shield"
          :loading="verifying"
          @click="startVerification"
        >
          Verify Now
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-timeline density="compact">
          <v-timeline-item
            v-for="step in verificationSteps"
            :key="step.id"
            :dot-color="getStepColor(step.status)"
            :icon="getStepIcon(step.status)"
            :size="small"
          >
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-subtitle-1">{{ step.name }}</div>
                <div class="text-body-2">{{ step.description }}</div>
              </div>
              <v-btn
                v-if="step.status === 'pending'"
                size="small"
                :loading="verifyingStep === step.id"
                @click="verifyStep(step)"
              >
                Verify
              </v-btn>
            </div>
          </v-timeline-item>
        </v-timeline>
      </v-card-text>
    </v-card>

    <!-- Transaction Details -->
    <v-card class="mt-4">
      <v-card-title>Transaction Details</v-card-title>
      <v-card-text>
        <v-list density="compact">
          <v-list-item>
            <v-list-item-title>Amount</v-list-item-title>
            <v-list-item-subtitle>${{ transaction.amount }}</v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <v-list-item-title>Payment Method</v-list-item-title>
            <v-list-item-subtitle>
              <v-icon start>{{ getPaymentMethodIcon }}</v-icon>
              {{ transaction.paymentMethod }}
            </v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <v-list-item-title>Location</v-list-item-title>
            <v-list-item-subtitle>{{ transaction.location }}</v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <v-list-item-title>Device</v-list-item-title>
            <v-list-item-subtitle>{{ transaction.device }}</v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <v-list-item-title>IP Address</v-list-item-title>
            <v-list-item-subtitle>{{ transaction.ipAddress }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>

    <!-- Review Dialog -->
    <v-dialog v-model="showReviewDialog" max-width="500">
      <v-card>
        <v-card-title>Review Transaction</v-card-title>
        <v-card-text>
          <v-form ref="reviewForm" v-model="reviewFormValid">
            <v-select
              v-model="reviewDecision"
              :items="reviewDecisions"
              label="Decision"
              :rules="[rules.required]"
            ></v-select>

            <v-textarea
              v-model="reviewNotes"
              label="Review Notes"
              :rules="[rules.required]"
              rows="3"
            ></v-textarea>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showReviewDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :loading="submittingReview"
            :disabled="!reviewFormValid"
            @click="submitReview"
          >
            Submit Review
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { useToast } from '@/composables/useToast'

interface Transaction {
  id: string;
  amount: number;
  paymentMethod: string;
  location: string;
  device: string;
  ipAddress: string;
  riskLevel: string;
  riskScore: number;
}

interface RiskFactor {
  id: string;
  name: string;
  description: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
}

interface VerificationStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'completed' | 'failed';
}

export default {
  name: 'PaymentSecurityManager',

  props: {
    transaction: {
      type: Object as () => Transaction,
      required: true
    }
  },

  emits: ['verification-complete', 'review-submitted'],

  setup(props, { emit }) {
    const store = useStore()
    const { showToast } = useToast()

    // State
    const reviewing = ref(false)
    const verifying = ref(false)
    const verifyingStep = ref<string | null>(null)
    const showReviewDialog = ref(false)
    const reviewFormValid = ref(false)
    const reviewDecision = ref('')
    const reviewNotes = ref('')
    const submittingReview = ref(false)

    // Review form
    const reviewForm = ref(null)
    const reviewDecisions = [
      { title: 'Approve', value: 'approve' },
      { title: 'Reject', value: 'reject' },
      { title: 'Flag for Further Review', value: 'flag' }
    ]

    // Validation rules
    const rules = {
      required: (v: any) => !!v || 'Required'
    }

    // Risk factors
    const riskFactors = ref<RiskFactor[]>([
      {
        id: '1',
        name: 'Location Mismatch',
        description: 'Transaction location differs from usual pattern',
        type: 'location',
        severity: 'medium'
      },
      {
        id: '2',
        name: 'Large Transaction',
        description: 'Amount exceeds typical spending pattern',
        type: 'amount',
        severity: 'high'
      },
      {
        id: '3',
        name: 'New Device',
        description: 'First time using this device',
        type: 'device',
        severity: 'low'
      }
    ])

    // Verification steps
    const verificationSteps = ref<VerificationStep[]>([
      {
        id: '1',
        name: 'Payment Method Verification',
        description: 'Verify payment method authenticity',
        status: 'completed'
      },
      {
        id: '2',
        name: '3D Secure Check',
        description: 'Additional security verification',
        status: 'pending'
      },
      {
        id: '3',
        name: 'Location Verification',
        description: 'Verify transaction location',
        status: 'pending'
      }
    ])

    // Computed
    const getRiskStatusColor = computed(() => {
      const colors = {
        low: 'success',
        medium: 'warning',
        high: 'error'
      }
      return colors[props.transaction.riskLevel] || 'grey'
    })

    const getRiskStatusIcon = computed(() => {
      const icons = {
        low: 'mdi-shield-check',
        medium: 'mdi-shield-alert',
        high: 'mdi-shield-off'
      }
      return icons[props.transaction.riskLevel] || 'mdi-shield'
    })

    const getPaymentMethodIcon = computed(() => {
      const icons = {
        visa: 'mdi-credit-card',
        mastercard: 'mdi-credit-card',
        paypal: 'mdi-paypal'
      }
      return icons[props.transaction.paymentMethod.toLowerCase()] || 'mdi-credit-card'
    })

    const requiresReview = computed(() => {
      return props.transaction.riskLevel === 'high' || props.transaction.riskScore > 75
    })

    const allStepsCompleted = computed(() => {
      return verificationSteps.value.every(step => step.status === 'completed')
    })

    // Methods
    const getRiskFactorColor = (severity: string) => {
      const colors = {
        low: 'success',
        medium: 'warning',
        high: 'error'
      }
      return colors[severity] || 'grey'
    }

    const getRiskFactorIcon = (type: string) => {
      const icons = {
        location: 'mdi-map-marker-alert',
        amount: 'mdi-currency-usd-alert',
        device: 'mdi-laptop-alert'
      }
      return icons[type] || 'mdi-alert'
    }

    const getStepColor = (status: string) => {
      const colors = {
        completed: 'success',
        pending: 'grey',
        failed: 'error'
      }
      return colors[status]
    }

    const getStepIcon = (status: string) => {
      const icons = {
        completed: 'mdi-check',
        pending: 'mdi-clock',
        failed: 'mdi-close'
      }
      return icons[status]
    }

    const reviewTransaction = () => {
      showReviewDialog.value = true
    }

    const startVerification = async () => {
      verifying.value = true
      try {
        await store.dispatch('payment/startVerification', props.transaction.id)
        await loadVerificationSteps()
      } catch (error) {
        console.error('Failed to start verification:', error)
        showToast('Failed to start verification', 'error')
      } finally {
        verifying.value = false
      }
    }

    const verifyStep = async (step: VerificationStep) => {
      verifyingStep.value = step.id
      try {
        await store.dispatch('payment/verifyStep', {
          transactionId: props.transaction.id,
          stepId: step.id
        })
        step.status = 'completed'

        if (allStepsCompleted.value) {
          emit('verification-complete', true)
        }
      } catch (error) {
        console.error('Failed to verify step:', error)
        step.status = 'failed'
        showToast('Failed to verify step', 'error')
      } finally {
        verifyingStep.value = null
      }
    }

    const submitReview = async () => {
      if (!reviewFormValid.value) return

      submittingReview.value = true
      try {
        await store.dispatch('payment/submitReview', {
          transactionId: props.transaction.id,
          decision: reviewDecision.value,
          notes: reviewNotes.value
        })

        showReviewDialog.value = false
        emit('review-submitted', {
          decision: reviewDecision.value,
          notes: reviewNotes.value
        })
        showToast('Review submitted successfully', 'success')
      } catch (error) {
        console.error('Failed to submit review:', error)
        showToast('Failed to submit review', 'error')
      } finally {
        submittingReview.value = false
      }
    }

    const loadVerificationSteps = async () => {
      try {
        const steps = await store.dispatch(
          'payment/getVerificationSteps',
          props.transaction.id
        )
        verificationSteps.value = steps
      } catch (error) {
        console.error('Failed to load verification steps:', error)
        showToast('Failed to load verification steps', 'error')
      }
    }

    return {
      // State
      reviewing,
      verifying,
      verifyingStep,
      showReviewDialog,
      reviewFormValid,
      reviewDecision,
      reviewNotes,
      submittingReview,
      reviewForm,
      reviewDecisions,
      riskFactors,
      verificationSteps,
      rules,

      // Computed
      getRiskStatusColor,
      getRiskStatusIcon,
      getPaymentMethodIcon,
      requiresReview,
      allStepsCompleted,

      // Methods
      getRiskFactorColor,
      getRiskFactorIcon,
      getStepColor,
      getStepIcon,
      reviewTransaction,
      startVerification,
      verifyStep,
      submitReview
    }
  }
}
</script>

<style scoped>
.payment-security {
  max-width: 800px;
  margin: 0 auto;
}
</style>