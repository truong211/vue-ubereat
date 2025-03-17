<template>
  <v-card class="order-summary">
    <v-card-title class="d-flex align-center">
      <span>{{ title || 'Order Summary' }}</span>
      <v-spacer></v-spacer>
      <slot name="title-actions"></slot>
    </v-card-title>
    
    <v-divider></v-divider>
    
    <!-- Restaurant Info -->
    <div v-if="restaurant" class="pa-4">
      <div class="d-flex align-center">
        <v-avatar size="40" class="mr-3">
          <v-img v-if="restaurant.image" :src="restaurant.image" alt="Restaurant"></v-img>
          <v-icon v-else size="24" color="grey">mdi-store</v-icon>
        </v-avatar>
        <div>
          <div class="text-h6">{{ restaurant.name }}</div>
          <div v-if="restaurant.address" class="text-caption text-medium-emphasis">
            <v-icon size="small" class="mr-1">mdi-map-marker</v-icon>
            {{ restaurant.address }}
          </div>
        </div>
      </div>
    </div>
    
    <v-divider v-if="restaurant"></v-divider>
    
    <!-- Items List -->
    <v-list v-if="items && items.length > 0">
      <v-list-subheader v-if="showSubheaders">Items</v-list-subheader>
      
      <v-list-item
        v-for="(item, index) in items"
        :key="index"
        class="px-4"
      >
        <template v-slot:prepend>
          <div class="item-quantity mr-2">{{ item.quantity }}x</div>
        </template>
        
        <v-list-item-title>{{ item.name }}</v-list-item-title>
        
        <div v-if="hasOptions(item)" class="text-caption text-medium-emphasis">
          {{ formatOptions(item) }}
        </div>
        
        <template v-slot:append>
          <div class="text-body-1 font-weight-medium">
            ${{ calculateItemTotal(item).toFixed(2) }}
          </div>
        </template>
      </v-list-item>
    </v-list>
    
    <v-divider></v-divider>
    
    <!-- Price Summary -->
    <v-card-text class="pa-4">
      <div class="d-flex justify-space-between mb-2">
        <span class="text-body-1">Subtotal</span>
        <span class="text-body-1">${{ subtotal.toFixed(2) }}</span>
      </div>
      
      <div v-if="discount > 0" class="d-flex justify-space-between mb-2 text-success">
        <span class="text-body-1">Discount</span>
        <span class="text-body-1">-${{ discount.toFixed(2) }}</span>
      </div>
      
      <div v-if="promoCode" class="d-flex justify-space-between mb-2 text-success">
        <span class="text-body-1">Promo: {{ promoCode }}</span>
        <span class="text-body-1">-${{ promoDiscount.toFixed(2) }}</span>
      </div>
      
      <div class="d-flex justify-space-between mb-2">
        <span class="text-body-1">Delivery Fee</span>
        <span class="text-body-1">${{ deliveryFee.toFixed(2) }}</span>
      </div>
      
      <div v-if="showTip && tip > 0" class="d-flex justify-space-between mb-2">
        <span class="text-body-1">Tip</span>
        <span class="text-body-1">${{ tip.toFixed(2) }}</span>
      </div>
      
      <div class="d-flex justify-space-between mb-4">
        <span class="text-body-1">Tax</span>
        <span class="text-body-1">${{ tax.toFixed(2) }}</span>
      </div>
      
      <v-divider class="mb-4"></v-divider>
      
      <div class="d-flex justify-space-between">
        <span class="text-h6 font-weight-bold">Total</span>
        <span class="text-h6 font-weight-bold">${{ total.toFixed(2) }}</span>
      </div>
      
      <slot name="summary-actions"></slot>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'OrderSummary',
  
  props: {
    title: {
      type: String,
      default: ''
    },
    items: {
      type: Array,
      required: true
    },
    restaurant: {
      type: Object,
      default: null
    },
    subtotal: {
      type: Number,
      default: 0
    },
    deliveryFee: {
      type: Number,
      default: 0
    },
    tax: {
      type: Number,
      default: 0
    },
    tip: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    promoCode: {
      type: String,
      default: ''
    },
    promoDiscount: {
      type: Number,
      default: 0
    },
    showTip: {
      type: Boolean,
      default: true
    },
    showSubheaders: {
      type: Boolean,
      default: true
    },
    editable: {
      type: Boolean,
      default: false
    }
  },
  
  computed: {
    total() {
      return this.subtotal + this.deliveryFee + this.tax + this.tip - this.discount - this.promoDiscount
    }
  },
  
  methods: {
    hasOptions(item) {
      return item.options && (
        (Array.isArray(item.options) && item.options.length > 0) ||
        (typeof item.options === 'object' && Object.keys(item.options).length > 0)
      )
    },
    
    formatOptions(item) {
      if (!item.options) return ''
      
      if (Array.isArray(item.options)) {
        return item.options.join(', ')
      } else if (typeof item.options === 'object') {
        // Handle case where options is an object with addons, size, etc.
        const optionParts = []
        
        if (item.options.size) {
          optionParts.push(`Size: ${item.options.size}`)
        }
        
        if (item.options.addons && Array.isArray(item.options.addons) && item.options.addons.length > 0) {
          optionParts.push(`Add-ons: ${item.options.addons.join(', ')}`)
        }
        
        return optionParts.join(' | ')
      }
      
      return ''
    },
    
    calculateItemTotal(item) {
      let total = item.price * item.quantity
      
      // Add option prices if available
      if (item.optionPrice) {
        total += item.optionPrice * item.quantity
      }
      
      return total
    }
  }
}
</script>

<style scoped>
.item-quantity {
  min-width: 30px;
  text-align: center;
  font-weight: 500;
}
</style>