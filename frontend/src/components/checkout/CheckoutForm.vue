<template>
  <v-form @submit.prevent="handleSubmit" v-model="isFormValid">
    <v-container>
      <v-row>
        <v-col cols="12">
          <h2 class="text-h5 mb-4">Checkout Information</h2>
        </v-col>

        <!-- Delivery Address Section -->
        <v-col cols="12">
          <v-text-field
            v-model="formData.address"
            :rules="[rules.required]"
            label="Delivery Address"
            placeholder="Enter your delivery address"
            variant="outlined"
            density="comfortable"
          ></v-text-field>
        </v-col>

        <!-- Scheduled Delivery Section -->
        <v-col cols="12" md="6">
          <v-checkbox
            v-model="formData.isScheduled"
            label="Schedule for later"
            color="primary"
          ></v-checkbox>
        </v-col>

        <v-col cols="12" md="6" v-if="formData.isScheduled">
          <v-dialog
            ref="dialog"
            v-model="dateDialog"
            :return-value.sync="formData.scheduledDate"
            persistent
            width="290px"
          >
            <template v-slot:activator="{ props }">
              <v-text-field
                v-model="formattedScheduledDate"
                label="Scheduled Delivery Time"
                readonly
                v-bind="props"
                :rules="[rules.required]"
                variant="outlined"
                density="comfortable"
              ></v-text-field>
            </template>
            <v-date-picker
              v-model="formData.scheduledDate"
              :min="minDate"
              :max="maxDate"
              @save="saveDate"
            >
              <v-time-picker
                v-model="formData.scheduledTime"
                format="24hr"
                :allowed-hours="allowedHours"
                :allowed-minutes="allowedMinutes"
              ></v-time-picker>
            </v-date-picker>
          </v-dialog>
        </v-col>

        <!-- Delivery Notes Section -->
        <v-col cols="12">
          <v-textarea
            v-model="formData.deliveryNotes"
            label="Delivery Notes"
            placeholder="Add special instructions for delivery (optional)"
            variant="outlined"
            auto-grow
            rows="3"
            density="comfortable"
          ></v-textarea>
        </v-col>

        <!-- Submit Button -->
        <v-col cols="12" class="text-center">
          <v-btn
            type="submit"
            color="primary"
            size="large"
            :loading="loading"
            :disabled="!isFormValid || loading"
            block
          >
            Place Order
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </v-form>
</template>

<script>
import { ref, computed } from 'vue'
import { format, addDays, setHours, setMinutes } from 'date-fns'

export default {
  name: 'CheckoutForm',
  setup(props, { emit }) {
    const isFormValid = ref(false)
    const loading = ref(false)
    const dateDialog = ref(false)

    const formData = ref({
      address: '',
      isScheduled: false,
      scheduledDate: null,
      scheduledTime: null,
      deliveryNotes: ''
    })

    const rules = {
      required: value => !!value || 'This field is required'
    }

    // Date and time constraints
    const minDate = new Date().toISOString().substr(0, 10)
    const maxDate = addDays(new Date(), 7).toISOString().substr(0, 10)

    const allowedHours = hours => hours >= 9 && hours <= 22
    const allowedMinutes = minutes => minutes % 15 === 0

    const formattedScheduledDate = computed(() => {
      if (!formData.value.scheduledDate || !formData.value.scheduledTime) return ''
      const date = new Date(formData.value.scheduledDate)
      const [hours, minutes] = formData.value.scheduledTime.split(':')
      const datetime = setMinutes(setHours(date, hours), minutes)
      return format(datetime, 'PPpp')
    })

    const saveDate = () => {
      dateDialog.value = false
    }

    const handleSubmit = async () => {
      if (!isFormValid.value) return

      loading.value = true
      try {
        const orderData = {
          ...formData.value,
          scheduledDelivery: formData.value.isScheduled
            ? new Date(`${formData.value.scheduledDate}T${formData.value.scheduledTime}`)
            : null
        }
        emit('submit', orderData)
      } catch (error) {
        console.error('Order submission failed:', error)
      } finally {
        loading.value = false
      }
    }

    return {
      formData,
      isFormValid,
      loading,
      dateDialog,
      rules,
      minDate,
      maxDate,
      allowedHours,
      allowedMinutes,
      formattedScheduledDate,
      saveDate,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.v-container {
  max-width: 800px;
}
</style>