<template>
  <div class="order-management">
    <!-- Order Tabs -->
    <v-card>
      <v-tabs v-model="activeTab" grow color="primary">
        <v-tab value="new">{{ $t('restaurant.orders.new') }} 
          <v-badge
            :content="newOrdersCount.toString()"
            :model-value="newOrdersCount > 0"
            color="error"
            class="ml-2"
          ></v-badge>
        </v-tab>
        <v-tab value="processing">{{ $t('restaurant.orders.processing') }}</v-tab>
        <v-tab value="ready">{{ $t('restaurant.orders.ready') }}</v-tab>
        <v-tab value="delivering">{{ $t('restaurant.orders.delivering') }}</v-tab>
        <v-tab value="completed">{{ $t('restaurant.orders.completed') }}</v-tab>
      </v-tabs>

      <!-- Filters -->
      <v-card-text>
        <v-row>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="search"
              :label="$t('restaurant.orders.search')"
              prepend-inner-icon="mdi-magnify"
              density="compact"
              variant="outlined"
              hide-details
              class="mb-2"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="4">
            <v-select
              v-model="sortBy"
              :items="sortOptions"
              :label="$t('restaurant.orders.sortBy')"
              density="compact"
              variant="outlined"
              hide-details
              class="mb-2"
            ></v-select>
          </v-col>
          <v-col cols="12" sm="4" class="d-flex align-center">
            <v-switch
              v-model="showCancelled"
              :label="$t('restaurant.orders.showCancelled')"
              density="compact"
              hide-details
              class="mb-2"
            ></v-switch>
          </v-col>
        </v-row>
      </v-card-text>

      <!-- Orders List -->
      <v-card-text class="px-0">
        <v-window v-model="activeTab">
          <v-window-item
            v-for="tab in ['new', 'processing', 'ready', 'delivering', 'completed']"
            :key="tab"
            :value="tab"
          >
            <v-list>
              <div v-for="order in filteredOrders(tab)" :key="order.id">
                <v-list-item>
                  <template v-slot:prepend>
                    <v-badge
                      :color="getOrderStatusColor(order.status)"
                      dot
                      offset-x="2"
                      offset-y="2"
                    >
                      <v-avatar size="48" color="grey-lighten-3">
                        <v-icon size="32">mdi-receipt</v-icon>
                      </v-avatar>
                    </v-badge>
                  </template>

                  <v-list-item-title class="text-h6">
                    {{ $t('restaurant.orders.orderNumber', { number: order.number }) }}
                  </v-list-item-title>

                  <v-list-item-subtitle>
                    {{ formatDateTime(order.createdAt) }} · {{ formatPrice(order.total) }}
                  </v-list-item-subtitle>

                  <template v-slot:append>
                    <div class="d-flex align-center">
                      <!-- Status Actions -->
                      <div class="mr-4" v-if="!isOrderCompleted(order.status)">
                        <v-btn
                          v-if="order.status === 'new'"
                          color="success"
                          variant="tonal"
                          size="small"
                          class="mr-2"
                          @click="updateOrderStatus(order.id, 'accepted')"
                        >
                          {{ $t('restaurant.orders.accept') }}
                        </v-btn>
                        <v-btn
                          v-if="order.status === 'accepted'"
                          color="primary"
                          variant="tonal"
                          size="small"
                          @click="updateOrderStatus(order.id, 'preparing')"
                        >
                          {{ $t('restaurant.orders.startPreparing') }}
                        </v-btn>
                        <v-btn
                          v-if="order.status === 'preparing'"
                          color="primary"
                          variant="tonal"
                          size="small"
                          @click="updateOrderStatus(order.id, 'ready')"
                        >
                          {{ $t('restaurant.orders.markReady') }}
                        </v-btn>
                      </div>

                      <!-- Order Details Button -->
                      <v-btn
                        icon="mdi-chevron-right"
                        variant="text"
                        size="small"
                        @click="openOrderDetails(order)"
                      ></v-btn>
                    </div>
                  </template>
                </v-list-item>

                <v-divider></v-divider>
              </div>
            </v-list>

            <!-- Empty State -->
            <div v-if="!filteredOrders(tab).length" class="text-center py-8">
              <v-icon size="64" color="grey-lighten-1">mdi-receipt-text-outline</v-icon>
              <div class="text-h6 mt-2">{{ $t('restaurant.orders.noOrders') }}</div>
              <div class="text-body-2 text-grey">{{ $t('restaurant.orders.noOrdersDescription') }}</div>
            </div>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>

    <!-- Order Details Dialog -->
    <v-dialog v-model="detailsDialog" max-width="700">
      <v-card v-if="selectedOrder">
        <v-card-title class="d-flex justify-space-between align-center">
          <span>{{ $t('restaurant.orders.orderDetails') }}</span>
          <v-chip :color="getOrderStatusColor(selectedOrder.status)">
            {{ $t(`restaurant.orders.status.${selectedOrder.status}`) }}
          </v-chip>
        </v-card-title>

        <v-card-text>
          <!-- Order Info -->
          <div class="d-flex justify-space-between mb-4">
            <div>
              <div class="text-h6">
                {{ $t('restaurant.orders.orderNumber', { number: selectedOrder.number }) }}
              </div>
              <div class="text-body-2">
                {{ formatDateTime(selectedOrder.createdAt) }}
              </div>
            </div>
            <div class="text-right">
              <div class="text-h6">{{ formatPrice(selectedOrder.total) }}</div>
              <div class="text-body-2">
                {{ selectedOrder.items.length }} {{ $t('restaurant.orders.items') }}
              </div>
            </div>
          </div>

          <!-- Customer Info -->
          <v-card variant="outlined" class="mb-4">
            <v-card-text>
              <div class="d-flex align-start">
                <v-icon size="24" class="mr-2">mdi-account</v-icon>
                <div>
                  <div class="font-weight-medium">{{ selectedOrder.customer.name }}</div>
                  <div class="text-body-2">{{ selectedOrder.customer.phone }}</div>
                  <div class="text-body-2">{{ selectedOrder.deliveryAddress }}</div>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- Order Items -->
          <v-list>
            <v-list-subheader>{{ $t('restaurant.orders.items') }}</v-list-subheader>
            <v-list-item
              v-for="item in selectedOrder.items"
              :key="item.id"
              :title="item.name"
              :subtitle="item.notes"
            >
              <template v-slot:prepend>
                <div class="text-body 2">{{ item.quantity }}x</div>
              </template>
              <template v-slot:append>
                {{ formatPrice(item.price * item.quantity) }}
              </template>
            </v-list-item>

            <v-divider></v-divider>

            <!-- Order Summary -->
            <v-list-item>
              <template v-slot:title>
                <div class="d-flex justify-space-between">
                  <span>{{ $t('restaurant.orders.subtotal') }}</span>
                  <span>{{ formatPrice(selectedOrder.subtotal) }}</span>
                </div>
              </template>
            </v-list-item>
            <v-list-item>
              <template v-slot:title>
                <div class="d-flex justify-space-between">
                  <span>{{ $t('restaurant.orders.deliveryFee') }}</span>
                  <span>{{ formatPrice(selectedOrder.deliveryFee) }}</span>
                </div>
              </template>
            </v-list-item>
            <v-list-item>
              <template v-slot:title>
                <div class="d-flex justify-space-between text-primary font-weight-bold">
                  <span>{{ $t('restaurant.orders.total') }}</span>
                  <span>{{ formatPrice(selectedOrder.total) }}</span>
                </div>
              </template>
            </v-list-item>
          </v-list>

          <!-- Order Timeline -->
          <v-list-subheader>{{ $t('restaurant.orders.timeline') }}</v-list-subheader>
          <v-timeline density="compact" align="start">
            <v-timeline-item
              v-for="event in selectedOrder.timeline"
              :key="event.timestamp"
              :dot-color="getTimelineDotColor(event)"
              :icon="getTimelineIcon(event)"
            >
              <template v-slot:opposite>
                <div class="text-caption">
                  {{ formatTime(event.timestamp) }}
                </div>
              </template>
              <div class="text-body-2">
                {{ $t(`restaurant.orders.events.${event.type}`) }}
              </div>
            </v-timeline-item>
          </v-timeline>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            v-if="selectedOrder.status === 'new'"
            color="error"
            variant="text"
            @click="rejectOrder"
          >
            {{ $t('restaurant.orders.reject') }}
          </v-btn>
          <v-btn
            color="primary"
            @click="detailsDialog = false"
          >
            {{ $t('common.close') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Reject Order Dialog -->
    <v-dialog v-model="rejectDialog" max-width="500">
      <v-card>
        <v-card-title>{{ $t('restaurant.orders.rejectTitle') }}</v-card-title>
        <v-card-text>
          <v-select
            v-model="rejectReason"
            :items="rejectReasons"
            :label="$t('restaurant.orders.rejectReason')"
            variant="outlined"
            required
          ></v-select>
          <v-textarea
            v-model="rejectNote"
            :label="$t('restaurant.orders.rejectNote')"
            variant="outlined"
            rows="3"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="rejectDialog = false"
          >
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            :loading="isRejecting"
            @click="confirmReject"
          >
            {{ $t('restaurant.orders.confirmReject') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

interface OrderCustomer {
  id: string
  name: string
  phone: string
}

interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
  notes?: string
}

interface OrderEvent {
  type: string
  timestamp: string
}

interface Order {
  id: string
  number: string
  status: string
  createdAt: string
  customer: OrderCustomer
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  deliveryAddress: string
  timeline: OrderEvent[]
}

const { t } = useI18n()
const store = useStore()

// State
const activeTab = ref('new')
const search = ref('')
const sortBy = ref('newest')
const showCancelled = ref(false)
const detailsDialog = ref(false)
const rejectDialog = ref(false)
const selectedOrder = ref<Order | null>(null)
const rejectReason = ref('')
const rejectNote = ref('')
const isRejecting = ref(false)

// Options
const sortOptions = [
  { title: t('restaurant.orders.sortOptions.newest'), value: 'newest' },
  { title: t('restaurant.orders.sortOptions.oldest'), value: 'oldest' }
]

const rejectReasons = [
  { title: t('restaurant.orders.rejectReasons.outOfStock'), value: 'out_of_stock' },
  { title: t('restaurant.orders.rejectReasons.tooBusy'), value: 'too_busy' },
  { title: t('restaurant.orders.rejectReasons.closingSoon'), value: 'closing_soon' },
  { title: t('restaurant.orders.rejectReasons.other'), value: 'other' }
]

// Computed
const newOrdersCount = computed(() => {
  return store.getters['restaurant/newOrdersCount']
})

// Methods
const filteredOrders = (status: string) => {
  let orders = store.getters['restaurant/getOrdersByStatus'](status)

  if (search.value) {
    const searchLower = search.value.toLowerCase()
    orders = orders.filter(order => 
      order.number.toLowerCase().includes(searchLower) ||
      order.customer.name.toLowerCase().includes(searchLower) ||
      order.customer.phone.includes(searchLower)
    )
  }

  if (!showCancelled.value) {
    orders = orders.filter(order => order.status !== 'cancelled')
  }

  if (sortBy.value === 'oldest') {
    orders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  } else {
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  return orders
}

const getOrderStatusColor = (status: string): string => {
  const colors = {
    new: 'warning',
    accepted: 'info',
    preparing: 'primary',
    ready: 'success',
    delivering: 'purple',
    completed: 'success',
    cancelled: 'error'
  }
  return colors[status] || 'grey'
}

const isOrderCompleted = (status: string): boolean => {
  return ['completed', 'cancelled'].includes(status)
}

const openOrderDetails = (order: Order) => {
  selectedOrder.value = order
  detailsDialog.value = true
}

const updateOrderStatus = async (orderId: string, newStatus: string) => {
  try {
    await store.dispatch('restaurant/updateOrderStatus', {
      orderId,
      status: newStatus
    })
    store.dispatch('showNotification', {
      type: 'success',
      message: t('restaurant.orders.statusUpdated')
    })
  } catch (error) {
    store.dispatch('showNotification', {
      type: 'error',
      message: t('restaurant.orders.updateFailed')
    })
  }
}

const rejectOrder = () => {
  rejectReason.value = ''
  rejectNote.value = ''
  rejectDialog.value = true
}

const confirmReject = async () => {
  if (!selectedOrder.value || !rejectReason.value) return

  isRejecting.value = true
  try {
    await store.dispatch('restaurant/rejectOrder', {
      orderId: selectedOrder.value.id,
      reason: rejectReason.value,
      note: rejectNote.value
    })
    rejectDialog.value = false
    detailsDialog.value = false
    store.dispatch('showNotification', {
      type: 'success',
      message: t('restaurant.orders.rejectSuccess')
    })
  } catch (error) {
    store.dispatch('showNotification', {
      type: 'error',
      message: t('restaurant.orders.rejectFailed')
    })
  } finally {
    isRejecting.value = false
  }
}

const getTimelineDotColor = (event: OrderEvent): string => {
  const colors = {
    created: 'grey',
    accepted: 'info',
    preparing: 'primary',
    ready: 'success',
    picked_up: 'purple',
    delivered: 'success',
    cancelled: 'error'
  }
  return colors[event.type] || 'grey'
}

const getTimelineIcon = (event: OrderEvent): string => {
  const icons = {
    created: 'mdi-receipt',
    accepted: 'mdi-check-circle',
    preparing: 'mdi-food',
    ready: 'mdi-food-takeout-box',
    picked_up: 'mdi-bike',
    delivered: 'mdi-check-circle',
    cancelled: 'mdi-close-circle'
  }
  return icons[event.type] || 'mdi-circle'
}

const formatDateTime = (date: string): string => {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: vi })
}

const formatTime = (date: string): string => {
  return new Date(date).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)
}
</script>

<style scoped>
.order-management {
  padding: 16px;
}

.v-timeline-item.completed .v-timeline-divider__dot {
  background-color: var(--v-success-base) !important;
}

.v-timeline-item.active .v-timeline-divider__dot {
  background-color: var(--v-primary-base) !important;
}
</style>