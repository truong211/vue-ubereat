<template>
  <v-card>
    <v-card-text>
      <h2 class="text-h5 mb-6">Temporary Closure Management</h2>
      
      <v-switch
        v-model="settings.isTemporarilyClosed"
        :color="settings.isTemporarilyClosed ? 'error' : 'success'"
        :label="settings.isTemporarilyClosed ? 'Restaurant is temporarily closed' : 'Restaurant is open'"
        class="mb-4"
      ></v-switch>

      <v-expand-transition>
        <div v-if="settings.isTemporarilyClosed">
          <v-alert
            type="warning"
            variant="tonal"
            class="mb-4"
          >
            When the restaurant is temporarily closed, new orders will not be accepted.
            Existing orders will be handled based on your settings below.
          </v-alert>

          <v-row>
            <!-- Reopen Date -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="settings.reopenDate"
                type="datetime-local"
                label="Planned Reopen Date/Time"
                :min="minReopenDate"
                :rules="[rules.required, rules.futureDate]"
              ></v-text-field>
            </v-col>

            <!-- Closure Reason -->
            <v-col cols="12">
              <v-text-field
                v-model="settings.closureReason"
                label="Closure Reason"
                :rules="[rules.required]"
                hint="This will be shown to customers"
                persistent-hint
              ></v-text-field>
            </v-col>

            <!-- Show Reason Toggle -->
            <v-col cols="12">
              <v-switch
                v-model="settings.showReason"
                label="Show closure reason to customers"
              ></v-switch>
            </v-col>

            <!-- Pre-orders Toggle -->
            <v-col cols="12">
              <v-switch
                v-model="settings.acceptPreOrders"
                label="Accept pre-orders for after reopening"
              ></v-switch>
            </v-col>

            <!-- Existing Orders Alert -->
            <v-col cols="12">
              <v-alert
                v-if="existingOrders.length > 0"
                type="info"
                variant="outlined"
              >
                <template v-slot:title>
                  Existing Orders ({{ existingOrders.length }})
                </template>
                <p>You have {{ existingOrders.length }} pending orders. Please decide how to handle them:</p>
                <v-radio-group v-model="existingOrdersHandling" class="mt-2">
                  <v-radio
                    label="Complete all existing orders"
                    value="complete"
                  ></v-radio>
                  <v-radio
                    label="Cancel all orders and notify customers"
                    value="cancel"
                  ></v-radio>
                  <v-radio
                    label="Handle orders individually"
                    value="individual"
                  ></v-radio>
                </v-radio-group>

                <v-expand-transition>
                  <div v-if="existingOrdersHandling === 'individual'" class="mt-4">
                    <v-list>
                      <v-list-item
                        v-for="order in existingOrders"
                        :key="order.id"
                        :subtitle="`Order #${order.id} - ${order.items.length} items - $${order.total}`"
                      >
                        <template v-slot:append>
                          <v-btn-group>
                            <v-btn
                              color="success"
                              size="small"
                              @click="handleExistingOrder(order.id, 'complete')"
                            >
                              Complete
                            </v-btn>
                            <v-btn
                              color="error"
                              size="small"
                              @click="handleExistingOrder(order.id, 'cancel')"
                            >
                              Cancel
                            </v-btn>
                          </v-btn-group>
                        </template>
                      </v-list-item>
                    </v-list>
                  </div>
                </v-expand-transition>
              </v-alert>
            </v-col>
          </v-row>
        </div>
      </v-expand-transition>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          :loading="saving"
          @click="saveSettings"
        >
          Save Changes
        </v-btn>
      </v-card-actions>
    </v-card-text>
  </v-card>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'TempClosureManager',

  setup() {
    const store = useStore()
    const saving = ref(false)

    // Settings state
    const settings = ref({
      isTemporarilyClosed: false,
      reopenDate: null,
      closureReason: '',
      showReason: true,
      acceptPreOrders: false
    })

    // Existing orders state
    const existingOrders = ref([])
    const existingOrdersHandling = ref('complete')

    // Computed
    const minReopenDate = computed(() => {
      const now = new Date()
      return now.toISOString().slice(0, 16)
    })

    // Validation rules
    const rules = {
      required: v => !!v || 'This field is required',
      futureDate: v => {
        if (!v) return true
        const date = new Date(v)
        const now = new Date()
        return date > now || 'Reopen date must be in the future'
      }
    }

    // Methods
    const loadSettings = async () => {
      try {
        const restaurantId = store.state.restaurantAdmin.restaurant.id
        const response = await store.dispatch('restaurantAdmin/fetchRestaurantSettings', restaurantId)
        settings.value = response.tempClosureSettings || {
          isTemporarilyClosed: false,
          reopenDate: null,
          closureReason: '',
          showReason: true,
          acceptPreOrders: false
        }
      } catch (error) {
        console.error('Failed to load temporary closure settings:', error)
      }
    }

    const loadExistingOrders = async () => {
      try {
        const response = await store.dispatch('restaurantAdmin/fetchOrders', {
          status: 'pending'
        })
        existingOrders.value = response.orders || []
      } catch (error) {
        console.error('Failed to load existing orders:', error)
      }
    }

    const saveSettings = async () => {
      try {
        saving.value = true
        const restaurantId = store.state.restaurantAdmin.restaurant.id
        await store.dispatch('restaurantAdmin/updateTempClosure', {
          restaurantId,
          settings: settings.value
        })

        // Handle existing orders if closing
        if (settings.value.isTemporarilyClosed && existingOrders.value.length > 0) {
          if (existingOrdersHandling.value === 'complete') {
            await Promise.all(existingOrders.value.map(order => 
              store.dispatch('restaurantAdmin/updateOrder', {
                orderId: order.id,
                status: 'preparing'
              })
            ))
          } else if (existingOrdersHandling.value === 'cancel') {
            await Promise.all(existingOrders.value.map(order =>
              store.dispatch('restaurantAdmin/updateOrder', {
                orderId: order.id,
                status: 'cancelled',
                reason: 'Restaurant temporarily closed'
              })
            ))
          }
        }
      } catch (error) {
        console.error('Failed to save temporary closure settings:', error)
      } finally {
        saving.value = false
      }
    }

    const handleExistingOrder = async (orderId, action) => {
      try {
        await store.dispatch('restaurantAdmin/updateOrder', {
          orderId,
          status: action === 'complete' ? 'preparing' : 'cancelled',
          reason: action === 'cancel' ? 'Restaurant temporarily closed' : undefined
        })
        // Remove from local list
        existingOrders.value = existingOrders.value.filter(o => o.id !== orderId)
      } catch (error) {
        console.error(`Failed to ${action} order:`, error)
      }
    }

    // Load initial data
    onMounted(() => {
      loadSettings()
      loadExistingOrders()
    })

    return {
      settings,
      saving,
      existingOrders,
      existingOrdersHandling,
      minReopenDate,
      rules,
      saveSettings,
      handleExistingOrder
    }
  }
}
</script>