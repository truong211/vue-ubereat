<template>
  <v-list>
    <template v-if="orders.length">
      <v-list-item
        v-for="order in orders"
        :key="order.id"
        @click="$emit('click', order)"
        class="order-item"
      >
        <!-- Order Header -->
        <template v-slot:prepend>
          <div class="order-time text-caption text-grey">
            {{ formatTime(order.createdAt) }}
          </div>
        </template>

        <v-list-item-title class="d-flex align-center">
          <span class="font-weight-medium">#{{ order.id }}</span>
          <v-chip
            size="x-small"
            :color="getPaymentStatusColor(order.paymentStatus)"
            class="ml-2"
          >
            {{ formatPaymentStatus(order.paymentStatus) }}
          </v-chip>
        </v-list-item-title>

        <v-list-item-subtitle>
          <div class="d-flex align-center mt-1">
            <v-icon size="small" color="grey" class="mr-1">
              mdi-food
            </v-icon>
            {{ formatOrderItems(order.items) }}
          </div>
          <div class="d-flex align-center mt-1">
            <v-icon size="small" color="grey" class="mr-1">
              mdi-map-marker
            </v-icon>
            {{ formatAddress(order.address) }}
          </div>
        </v-list-item-subtitle>

        <!-- Order Actions -->
        <template v-slot:append>
          <div class="d-flex flex-column align-end">
            <div class="text-h6 mb-1">
              {{ formatPrice(order.total) }}
            </div>
            <div class="actions">
              <template v-if="order.status === 'pending'">
                <v-btn
                  color="success"
                  variant="text"
                  density="comfortable"
                  icon="mdi-check"
                  @click.stop="$emit('accept', order)"
                ></v-btn>
                <v-btn
                  color="error"
                  variant="text"
                  density="comfortable"
                  icon="mdi-close"
                  @click.stop="$emit('reject', order)"
                ></v-btn>
              </template>

              <template v-if="order.status === 'preparing'">
                <v-btn
                  color="success"
                  variant="text"
                  density="comfortable"
                  icon="mdi-check-all"
                  @click.stop="$emit('ready', order)"
                ></v-btn>
              </template>

              <template v-if="order.status === 'ready'">
                <v-btn
                  color="success"
                  variant="text"
                  density="comfortable"
                  icon="mdi-bike"
                  @click.stop="$emit('pickup', order)"
                ></v-btn>
              </template>
            </div>
          </div>
        </template>
      </v-list-item>
    </template>

    <v-list-item v-else class="text-center pa-4">
      <v-list-item-title class="text-grey">
        No orders
      </v-list-item-title>
    </v-list-item>
  </v-list>
</template>

<script>
export default {
  name: 'OrderList',

  props: {
    orders: {
      type: Array,
      required: true
    }
  },

  emits: ['click', 'accept', 'reject', 'ready', 'pickup'],

  setup() {
    const formatTime = (timestamp) => {
      return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      })
    }

    const formatPrice = (price) => {
      return `$${Number(price).toFixed(2)}`
    }

    const formatOrderItems = (items) => {
      if (!items?.length) return ''
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
      const firstItem = items[0]
      if (items.length === 1) {
        return `${firstItem.quantity}x ${firstItem.name}`
      }
      return `${firstItem.quantity}x ${firstItem.name} + ${itemCount - firstItem.quantity} more`
    }

    const formatAddress = (address) => {
      if (!address) return ''
      return [address.street, address.city].filter(Boolean).join(', ')
    }

    const getPaymentStatusColor = (status) => {
      switch (status) {
        case 'paid': return 'success'
        case 'pending': return 'warning'
        case 'failed': return 'error'
        default: return 'grey'
      }
    }

    const formatPaymentStatus = (status) => {
      if (!status) return ''
      return status.charAt(0).toUpperCase() + status.slice(1)
    }

    return {
      formatTime,
      formatPrice,
      formatOrderItems,
      formatAddress,
      getPaymentStatusColor,
      formatPaymentStatus
    }
  }
}
</script>

<style scoped>
.order-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.order-item:last-child {
  border-bottom: none;
}

.order-time {
  min-width: 70px;
}

.actions {
  display: flex;
  gap: 4px;
}
</style>
