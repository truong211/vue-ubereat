<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon start>mdi-alert-circle</v-icon>
      Dispute Management
      <v-spacer></v-spacer>
      <v-chip
        :color="getDisputeStatusColor(dispute.status)"
        size="small"
        v-if="dispute"
      >
        {{ formatDisputeStatus(dispute.status) }}
      </v-chip>
    </v-card-title>

    <v-card-text>
      <div v-if="!dispute">
        <v-alert
          type="info"
          text="No dispute has been filed for this order"
          class="mb-4"
        ></v-alert>
        
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="openCreateDispute"
          v-if="canCreateDispute"
        >
          Create Dispute
        </v-btn>
      </div>

      <div v-else>
        <!-- Dispute Details -->
        <v-row>
          <v-col cols="12" md="6">
            <p class="text-subtitle-1 font-weight-bold mb-2">Reason</p>
            <p>{{ dispute.reason }}</p>
            
            <p class="text-subtitle-1 font-weight-bold mt-4 mb-2">Description</p>
            <p>{{ dispute.description }}</p>
            
            <p class="text-subtitle-1 font-weight-bold mt-4 mb-2">Filed By</p>
            <p>{{ dispute.filedBy }} on {{ formatDateTime(dispute.createdAt) }}</p>
          </v-col>

          <v-col cols="12" md="6">
            <v-card variant="outlined" class="mb-4">
              <v-card-title>Refund Details</v-card-title>
              <v-card-text>
                <p><strong>Amount Requested:</strong> ${{ dispute.refundAmount.toFixed(2) }}</p>
                <p><strong>Status:</strong> {{ formatRefundStatus(dispute.refundStatus) }}</p>
                <p v-if="dispute.refundedAt">
                  <strong>Refunded At:</strong> {{ formatDateTime(dispute.refundedAt) }}
                </p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Dispute Timeline -->
        <v-timeline density="compact" class="mt-4">
          <v-timeline-item
            v-for="event in dispute.timeline"
            :key="event.id"
            :dot-color="getEventColor(event.type)"
            :icon="getEventIcon(event.type)"
          >
            <div class="d-flex justify-space-between">
              <div>
                <div class="text-subtitle-2">{{ event.title }}</div>
                <div class="text-caption">{{ event.description }}</div>
              </div>
              <div class="text-caption">
                {{ formatDateTime(event.timestamp) }}
              </div>
            </div>
          </v-timeline-item>
        </v-timeline>

        <!-- Actions -->
        <v-card-actions v-if="dispute.status === 'pending'">
          <v-spacer></v-spacer>
          <v-btn
            color="error"
            variant="text"
            @click="rejectDispute"
            :loading="loading"
          >
            Reject
          </v-btn>
          <v-btn
            color="success"
            variant="text"
            @click="approveDispute"
            :loading="loading"
          >
            Approve & Refund
          </v-btn>
        </v-card-actions>
      </div>
    </v-card-text>

    <!-- Create Dispute Dialog -->
    <v-dialog v-model="createDialog.show" max-width="600">
      <v-card>
        <v-card-title>Create Dispute</v-card-title>
        <v-card-text>
          <v-form ref="disputeForm">
            <v-select
              v-model="createDialog.reason"
              :items="disputeReasons"
              label="Reason"
              required
            ></v-select>

            <v-textarea
              v-model="createDialog.description"
              label="Description"
              rows="3"
              required
            ></v-textarea>

            <v-text-field
              v-model="createDialog.refundAmount"
              label="Refund Amount"
              type="number"
              prefix="$"
              required
              :max="order.total"
              :rules="[v => v <= order.total || 'Cannot exceed order total']"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="createDialog.show = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="createDispute"
            :loading="loading"
          >
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Reject Dialog -->
    <v-dialog v-model="rejectDialog.show" max-width="500">
      <v-card>
        <v-card-title>Reject Dispute</v-card-title>
        <v-card-text>
          <v-textarea
            v-model="rejectDialog.reason"
            label="Rejection Reason"
            rows="3"
            required
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="rejectDialog.show = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            @click="confirmRejectDispute"
            :loading="loading"
          >
            Reject
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'vue-toastification';
import { format } from 'date-fns';

const props = defineProps({
  order: {
    type: Object,
    required: true
  },
  dispute: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['update:dispute']);

const store = useStore();
const toast = useToast();

// State
const loading = ref(false);
const disputeForm = ref(null);

// Dialogs
const createDialog = ref({
  show: false,
  reason: '',
  description: '',
  refundAmount: 0
});

const rejectDialog = ref({
  show: false,
  reason: ''
});

// Options
const disputeReasons = [
  'Wrong items received',
  'Missing items',
  'Quality issues',
  'Delivery issues',
  'Long delivery time',
  'Food safety concern',
  'Other'
];

// Computed
const canCreateDispute = computed(() => {
  return ['delivered', 'cancelled'].includes(props.order.status) && !props.dispute;
});

// Methods
const formatDateTime = (date) => {
  return format(new Date(date), 'MMM d, yyyy HH:mm');
};

const getDisputeStatusColor = (status) => {
  const colors = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error',
    resolved: 'info'
  };
  return colors[status] || 'grey';
};

const formatDisputeStatus = (status) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const formatRefundStatus = (status) => {
  const statusMap = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed'
  };
  return statusMap[status] || status;
};

const getEventColor = (type) => {
  const colors = {
    created: 'info',
    updated: 'warning',
    approved: 'success',
    rejected: 'error',
    refunded: 'success'
  };
  return colors[type] || 'grey';
};

const getEventIcon = (type) => {
  const icons = {
    created: 'mdi-plus-circle',
    updated: 'mdi-pencil',
    approved: 'mdi-check-circle',
    rejected: 'mdi-close-circle',
    refunded: 'mdi-cash-refund'
  };
  return icons[type] || 'mdi-circle';
};

const openCreateDispute = () => {
  createDialog.value = {
    show: true,
    reason: '',
    description: '',
    refundAmount: 0
  };
};

const createDispute = async () => {
  if (!disputeForm.value.validate()) return;

  loading.value = true;
  try {
    const dispute = await store.dispatch('disputes/createDispute', {
      orderId: props.order.id,
      ...createDialog.value
    });
    emit('update:dispute', dispute);
    createDialog.value.show = false;
    toast.success('Dispute created successfully');
  } catch (error) {
    console.error('Failed to create dispute:', error);
    toast.error('Failed to create dispute');
  } finally {
    loading.value = false;
  }
};

const rejectDispute = () => {
  rejectDialog.value = {
    show: true,
    reason: ''
  };
};

const confirmRejectDispute = async () => {
  if (!rejectDialog.value.reason) return;

  loading.value = true;
  try {
    const updatedDispute = await store.dispatch('disputes/rejectDispute', {
      disputeId: props.dispute.id,
      reason: rejectDialog.value.reason
    });
    emit('update:dispute', updatedDispute);
    rejectDialog.value.show = false;
    toast.success('Dispute rejected');
  } catch (error) {
    console.error('Failed to reject dispute:', error);
    toast.error('Failed to reject dispute');
  } finally {
    loading.value = false;
  }
};

const approveDispute = async () => {
  loading.value = true;
  try {
    const updatedDispute = await store.dispatch('disputes/approveDispute', {
      disputeId: props.dispute.id
    });
    emit('update:dispute', updatedDispute);
    toast.success('Dispute approved and refund initiated');
  } catch (error) {
    console.error('Failed to approve dispute:', error);
    toast.error('Failed to approve dispute');
  } finally {
    loading.value = false;
  }
};
</script>