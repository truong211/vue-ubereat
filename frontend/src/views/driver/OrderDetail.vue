<template>
  <div class="order-detail">
    <!-- Top Section: Map and Route -->
    <v-row class="mb-6">
      <v-col cols="12">
        <DeliveryRoute
          v-if="order"
          ref="deliveryRoute"
          :order="order"
          :current-step="getCurrentStep"
          @location-update="handleLocationUpdate"
          @eta-update="handleEtaUpdate"
          @error="handleMapError"
        />
      </v-col>
    </v-row>

    <!-- Main Content -->
    <v-row>
      <!-- Left Column: Order Info & Actions -->
      <v-col cols="12" md="8">
        <!-- Action Card -->
        <v-card class="mb-6">
          <v-card-text>
            <template v-if="order.status === 'accepted'">
              <v-alert
                type="info"
                variant="tonal"
                class="mb-4"
              >
                Head to the restaurant to pick up the order
              </v-alert>

              <v-btn
                color="primary"
                block
                :loading="updating"
                @click="updateStatus('picked_up')"
              >
                Confirm Pickup
              </v-btn>
            </template>

            <template v-if="order.status === 'picked_up'">
              <v-alert
                type="info"
                variant="tonal"
                class="mb-4"
              >
                Deliver the order to the customer
              </v-alert>

              <v-btn-group class="w-100">
                <v-btn
                  color="warning"
                  class="flex-grow-1"
                  prepend-icon="mdi-phone"
                  :href="`tel:${order.customer.phone}`"
                >
                  Call Customer
                </v-btn>
                <v-btn
                  color="success"
                  class="flex-grow-1"
                  :loading="updating"
                  @click="updateStatus('completed')"
                >
                  Complete Delivery
                </v-btn>
              </v-btn-group>
            </template>

            <template v-if="order.status === 'completed'">
              <v-alert
                type="success"
                variant="tonal"
              >
                Order successfully delivered!
              </v-alert>
            </template>
          </v-card-text>
        </v-card>

        <!-- Order Items -->
        <v-card>
          <v-card-title>Order Items</v-card-title>
          <v-list>
            <v-list-item
              v-for="item in order.items"
              :key="item.id"
              :title="item.name"
              :subtitle="`Quantity: ${item.quantity}`"
            >
              <template v-slot:prepend>
                <v-avatar
                  :image="item.image"
                  size="48"
                ></v-avatar>
              </template>
              <template v-slot:append>
                {{ formatPrice(item.price * item.quantity) }}
              </template>
            </v-list-item>

            <v-divider></v-divider>

            <v-list-item>
              <template v-slot:prepend>
                <div class="text-subtitle-1">Subtotal</div>
              </template>
              <template v-slot:append>
                <div class="text-subtitle-1">
                  {{ formatPrice(order.subtotal) }}
                </div>
              </template>
            </v-list-item>

            <v-list-item>
              <template v-slot:prepend>
                <div class="text-subtitle-1">Delivery Fee</div>
              </template>
              <template v-slot:append>
                <div class="text-subtitle-1">
                  {{ formatPrice(order.deliveryFee) }}
                </div>
              </template>
            </v-list-item>

            <v-list-item>
              <template v-slot:prepend>
                <div class="text-h6">Total</div>
              </template>
              <template v-slot:append>
                <div class="text-h6">
                  {{ formatPrice(order.total) }}
                </div>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <!-- Right Column: Restaurant & Customer Info -->
      <v-col cols="12" md="4">
        <!-- Restaurant Info -->
        <v-card class="mb-6">
          <v-card-title>Restaurant</v-card-title>
          <v-card-text>
            <div class="d-flex align-center mb-4">
              <v-avatar
                size="64"
                :image="order.restaurant.logo"
                class="mr-4"
              ></v-avatar>
              <div>
                <div class="text-h6">{{ order.restaurant.name }}</div>
                <div class="text-caption">{{ order.restaurant.address }}</div>
              </div>
            </div>

            <v-btn
              color="primary"
              block
              prepend-icon="mdi-phone"
              :href="`tel:${order.restaurant.phone}`"
              class="mb-2"
            >
              Call Restaurant
            </v-btn>

            <v-btn
              variant="outlined"
              block
              prepend-icon="mdi-message"
              @click="showRestaurantChat = true"
              :class="{ 'has-unread': hasUnreadRestaurantMessages }"
            >
              Message Restaurant
              <v-badge
                v-if="unreadRestaurantMessages"
                :content="unreadRestaurantMessages"
                color="error"
                floating
              ></v-badge>
            </v-btn>
          </v-card-text>
        </v-card>

        <!-- Customer Info -->
        <v-card class="mb-6">
          <v-card-title>Customer</v-card-title>
          <v-card-text>
            <div class="mb-4">
              <div class="text-h6">{{ order.customer.name }}</div>
              <div class="text-body-1">{{ order.customer.phone }}</div>
              <div class="text-caption">{{ order.customer.address }}</div>

              <div v-if="order.customer.note" class="text-caption mt-2">
                Note: {{ order.customer.note }}
              </div>
            </div>

            <v-btn
              color="primary"
              block
              prepend-icon="mdi-phone"
              :href="`tel:${order.customer.phone}`"
              class="mb-2"
            >
              Call Customer
            </v-btn>

            <v-btn
              variant="outlined"
              block
              prepend-icon="mdi-message"
              @click="showCustomerChat = true"
              :class="{ 'has-unread': hasUnreadCustomerMessages }"
            >
              Message Customer
              <v-badge
                v-if="unreadCustomerMessages"
                :content="unreadCustomerMessages"
                color="error"
                floating
              ></v-badge>
            </v-btn>
          </v-card-text>
        </v-card>

        <!-- Issues -->
        <v-card>
          <v-card-title>Issues</v-card-title>
          <v-card-text>
            <v-btn
              color="error"
              block
              variant="outlined"
              @click="showIssueDialog = true"
            >
              Report an Issue
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialogs & Drawers -->
    <!-- Issue Dialog -->
    <v-dialog v-model="showIssueDialog" max-width="500">
      <v-card>
        <v-card-title>Report an Issue</v-card-title>
        <v-card-text>
          <v-select
            v-model="issueForm.type"
            label="Issue Type"
            :items="issueTypes"
            variant="outlined"
          ></v-select>

          <v-textarea
            v-model="issueForm.description"
            label="Description"
            variant="outlined"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showIssueDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            :loading="updating"
            @click="reportIssue"
          >
            Report Issue
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Chat Drawers -->
    <v-navigation-drawer
      v-model="showRestaurantChat"
      location="right"
      temporary
      width="400"
    >
      <OrderChat
        v-if="showRestaurantChat"
        :order-id="order.id"
        type="restaurant"
        :participant="order.restaurant"
        @close="showRestaurantChat = false"
        @error="handleChatError"
      />
    </v-navigation-drawer>

    <v-navigation-drawer
      v-model="showCustomerChat"
      location="right"
      temporary
      width="400"
    >
      <OrderChat
        v-if="showCustomerChat"
        :order-id="order.id"
        type="customer"
        :participant="order.customer"
        @close="showCustomerChat = false"
        @error="handleChatError"
      />
    </v-navigation-drawer>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import DeliveryRoute from '@/components/driver/DeliveryRoute.vue'
import OrderChat from '@/components/driver/OrderChat.vue'
import chatService from '@/services/chat'

export default {
  name: 'DriverOrderDetail',

  components: {
    DeliveryRoute,
    OrderChat
  },

  setup() {
    const store = useStore()
    const route = useRoute()
    const router = useRouter()
    const deliveryRoute = ref(null)
    const updating = ref(false)

    // Dialogs and drawers
    const showIssueDialog = ref(false)
    const showRestaurantChat = ref(false)
    const showCustomerChat = ref(false)

    // Form data
    const issueForm = ref({
      type: '',
      description: ''
    })

    const issueTypes = [
      { title: 'Wrong Address', value: 'wrong_address' },
      { title: 'Restaurant Closed', value: 'restaurant_closed' },
      { title: 'Order Not Ready', value: 'order_not_ready' },
      { title: 'Traffic/Accident', value: 'traffic' },
      { title: 'Customer Unreachable', value: 'customer_unreachable' },
      { title: 'Other', value: 'other' }
    ]

    // Computed
    const order = computed(() => store.state.driver.currentOrder)
    const getCurrentStep = computed(() => {
      switch (order.value?.status) {
        case 'accepted': return 0
        case 'picked_up': return 1
        case 'completed': return 2
        default: return 0
      }
    })

    // Chat unread indicators
    const unreadRestaurantMessages = computed(() => {
      if (!order.value) return 0
      return chatService.getUnreadCount(`order_${order.value.id}_restaurant`)
    })

    const unreadCustomerMessages = computed(() => {
      if (!order.value) return 0
      return chatService.getUnreadCount(`order_${order.value.id}_customer`)
    })

    const hasUnreadRestaurantMessages = computed(() => 
      unreadRestaurantMessages.value > 0
    )

    const hasUnreadCustomerMessages = computed(() => 
      unreadCustomerMessages.value > 0
    )

    // Methods
    const updateStatus = async (status) => {
      updating.value = true
      try {
        await store.dispatch('driver/updateOrderStatus', {
          orderId: order.value.id,
          status
        })

        if (status === 'completed') {
          router.push('/driver/dashboard')
        }
      } catch (error) {
        console.error('Failed to update status:', error)
      } finally {
        updating.value = false
      }
    }

    const reportIssue = async () => {
      updating.value = true
      try {
        await store.dispatch('driver/reportIssue', {
          orderId: order.value.id,
          ...issueForm.value
        })
        showIssueDialog.value = false
        issueForm.value = { type: '', description: '' }
      } catch (error) {
        console.error('Failed to report issue:', error)
      } finally {
        updating.value = false
      }
    }

    const handleLocationUpdate = (position) => {
      store.dispatch('driver/updateLocation', {
        orderId: route.params.id,
        ...position
      })
    }

    const handleEtaUpdate = (eta) => {
      store.dispatch('driver/updateEta', {
        orderId: route.params.id,
        eta
      })
    }

    const handleMapError = (error) => {
      console.error('Map error:', error)
      store.dispatch('ui/showError', {
        title: 'Map Error',
        message: error.message || 'Failed to load map'
      })
    }

    const handleChatError = (error) => {
      console.error('Chat error:', error)
      store.dispatch('ui/showError', {
        title: 'Chat Error',
        message: error.message || 'Failed to send message'
      })
    }

    const formatPrice = (price) => {
      return `$${Number(price).toFixed(2)}`
    }

    // Watch for chat visibility
    watch(showRestaurantChat, (value) => {
      if (!value) {
        chatService.setActiveConversation(null)
      }
    })

    watch(showCustomerChat, (value) => {
      if (!value) {
        chatService.setActiveConversation(null)
      }
    })

    // Lifecycle
    onMounted(async () => {
      await store.dispatch('driver/fetchOrder', route.params.id)
    })

    return {
      order,
      deliveryRoute,
      updating,
      showIssueDialog,
      showRestaurantChat,
      showCustomerChat,
      issueForm,
      issueTypes,
      getCurrentStep,
      unreadRestaurantMessages,
      unreadCustomerMessages,
      hasUnreadRestaurantMessages,
      hasUnreadCustomerMessages,
      updateStatus,
      reportIssue,
      handleLocationUpdate,
      handleEtaUpdate,
      handleMapError,
      handleChatError,
      formatPrice
    }
  }
}
</script>

<style scoped>
.order-detail {
  padding-bottom: 20px;
}

.v-card {
  border-radius: 12px;
}

.has-unread {
  position: relative;
}

.has-unread::after {
  content: '';
  position: absolute;
  top: -4px;
  right: -4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--v-error-base);
}
</style>
