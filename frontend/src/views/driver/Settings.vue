<template>
  <div>
    <!-- General Settings -->
    <v-card class="mb-6">
      <v-card-title>General Settings</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-switch
              v-model="settings.notifications.push"
              label="Push Notifications"
              color="primary"
              hide-details
            ></v-switch>
          </v-col>
          <v-col cols="12" md="6">
            <v-switch
              v-model="settings.notifications.sound"
              label="Notification Sound"
              color="primary"
              hide-details
            ></v-switch>
          </v-col>
          <v-col cols="12" md="6">
            <v-switch
              v-model="settings.notifications.email"
              label="Email Notifications"
              color="primary"
              hide-details
            ></v-switch>
          </v-col>
          <v-col cols="12" md="6">
            <v-switch
              v-model="settings.autoAccept"
              label="Auto-Accept Orders"
              color="primary"
              hide-details
            ></v-switch>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Vehicle Information -->
    <v-card class="mb-6">
      <v-card-title>Vehicle Information</v-card-title>
      <v-card-text>
        <v-form ref="vehicleForm" v-model="vehicleForm.valid">
          <v-row>
            <v-col cols="12" md="6">
              <v-select
                v-model="vehicleForm.type"
                :items="vehicleTypes"
                label="Vehicle Type"
                :rules="[rules.required]"
                variant="outlined"
              ></v-select>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="vehicleForm.model"
                label="Vehicle Model"
                :rules="[rules.required]"
                variant="outlined"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="vehicleForm.plate"
                label="License Plate"
                :rules="[rules.required]"
                variant="outlined"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="vehicleForm.color"
                label="Vehicle Color"
                :rules="[rules.required]"
                variant="outlined"
              ></v-text-field>
            </v-col>
          </v-row>

          <v-btn
            color="primary"
            :loading="updating"
            @click="updateVehicle"
          >
            Update Vehicle Information
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- Service Area -->
    <v-card class="mb-6">
      <v-card-title>Service Area</v-card-title>
      <v-card-text>
        <v-select
          v-model="settings.serviceAreas"
          :items="availableAreas"
          label="Select Service Areas"
          multiple
          chips
          variant="outlined"
        ></v-select>
      </v-card-text>
    </v-card>

    <!-- Payment Settings -->
    <v-card class="mb-6">
      <v-card-title>Payment Settings</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-select
              v-model="settings.paymentMethod"
              :items="paymentMethods"
              label="Default Payment Method"
              variant="outlined"
            ></v-select>
          </v-col>

          <v-col cols="12" md="6">
            <v-select
              v-model="settings.payoutFrequency"
              :items="payoutFrequencies"
              label="Payout Frequency"
              variant="outlined"
            ></v-select>
          </v-col>
        </v-row>

        <v-list class="bg-grey-lighten-4 rounded">
          <v-list-item>
            <template v-slot:prepend>
              <v-icon color="success">mdi-bank</v-icon>
            </template>
            <v-list-item-title>Bank Account Connected</v-list-item-title>
            <v-list-item-subtitle>
              {{ settings.bankAccount.bank }} •••• {{ settings.bankAccount.last4 }}
            </v-list-item-subtitle>
            <template v-slot:append>
              <v-btn variant="text" color="primary" @click="editBankAccount">
                Edit
              </v-btn>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>

    <!-- Account Settings -->
    <v-card>
      <v-card-title>Account Settings</v-card-title>
      <v-card-text>
        <v-list>
          <v-list-item
            prepend-icon="mdi-key"
            title="Change Password"
            append-icon="mdi-chevron-right"
            @click="showChangePassword = true"
          ></v-list-item>

          <v-list-item
            prepend-icon="mdi-phone"
            title="Update Phone Number"
            append-icon="mdi-chevron-right"
            @click="showUpdatePhone = true"
          ></v-list-item>

          <v-list-item
            prepend-icon="mdi-email"
            title="Update Email"
            append-icon="mdi-chevron-right"
            @click="showUpdateEmail = true"
          ></v-list-item>

          <v-list-item
            prepend-icon="mdi-download"
            title="Download Personal Data"
            append-icon="mdi-chevron-right"
            @click="downloadData"
          ></v-list-item>

          <v-list-item
            prepend-icon="mdi-delete"
            title="Delete Account"
            append-icon="mdi-chevron-right"
            @click="showDeleteAccount = true"
          ></v-list-item>
        </v-list>
      </v-card-text>
    </v-card>

    <!-- Change Password Dialog -->
    <v-dialog v-model="showChangePassword" max-width="500">
      <v-card>
        <v-card-title>Change Password</v-card-title>
        <v-card-text>
          <v-form ref="passwordForm" v-model="passwordForm.valid">
            <v-text-field
              v-model="passwordForm.current"
              label="Current Password"
              type="password"
              :rules="[rules.required]"
              variant="outlined"
            ></v-text-field>

            <v-text-field
              v-model="passwordForm.new"
              label="New Password"
              type="password"
              :rules="[rules.required, rules.password]"
              variant="outlined"
            ></v-text-field>

            <v-text-field
              v-model="passwordForm.confirm"
              label="Confirm Password"
              type="password"
              :rules="[rules.required, rules.passwordMatch]"
              variant="outlined"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showChangePassword = false">Cancel</v-btn>
          <v-btn
            color="primary"
            :loading="updating"
            @click="updatePassword"
          >
            Update Password
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Account Dialog -->
    <v-dialog v-model="showDeleteAccount" max-width="500">
      <v-card>
        <v-card-title>Delete Account</v-card-title>
        <v-card-text>
          <p class="text-body-1 mb-4">
            Are you sure you want to delete your account? This action cannot be undone.
          </p>
          <v-text-field
            v-model="deleteConfirm"
            label="Type 'DELETE' to confirm"
            :rules="[v => v === 'DELETE' || 'Please type DELETE to confirm']"
            variant="outlined"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showDeleteAccount = false">Cancel</v-btn>
          <v-btn
            color="error"
            :disabled="deleteConfirm !== 'DELETE'"
            :loading="updating"
            @click="deleteAccount"
          >
            Delete Account
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Bank Account Dialog -->
    <v-dialog v-model="showBankAccount" max-width="500">
      <v-card>
        <v-card-title>Update Bank Account</v-card-title>
        <v-card-text>
          <v-form ref="bankForm" v-model="bankForm.valid">
            <v-text-field
              v-model="bankForm.name"
              label="Account Holder Name"
              :rules="[rules.required]"
              variant="outlined"
            ></v-text-field>

            <v-text-field
              v-model="bankForm.number"
              label="Account Number"
              :rules="[rules.required]"
              variant="outlined"
            ></v-text-field>

            <v-text-field
              v-model="bankForm.routingNumber"
              label="Routing Number"
              :rules="[rules.required]"
              variant="outlined"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showBankAccount = false">Cancel</v-btn>
          <v-btn
            color="primary"
            :loading="updating"
            @click="updateBankAccount"
          >
            Update Bank Account
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'DriverSettings',

  setup() {
    const store = useStore()
    const updating = ref(false)



    // Dialog states
    const showChangePassword = ref(false)
    const showDeleteAccount = ref(false)
    const showBankAccount = ref(false)
    const showUpdatePhone = ref(false)
    const showUpdateEmail = ref(false)

    // Form data
    const settings = ref({
      notifications: {
        push: true,
        sound: true,
        email: true
      },
      autoAccept: false,
      serviceAreas: [],
      paymentMethod: 'bank',
      payoutFrequency: 'weekly',
      bankAccount: {
        bank: 'Chase',
        last4: '4567'
      }
    })

    const vehicleTypes = [
      { title: 'Bicycle', value: 'bicycle' },
      { title: 'Motorcycle', value: 'motorcycle' },
      { title: 'Car', value: 'car' },
      { title: 'Van', value: 'van' }
    ]

    const availableAreas = [
      { title: 'Downtown', value: 'downtown' },
      { title: 'North', value: 'north' },
      { title: 'South', value: 'south' },
      { title: 'East', value: 'east' },
      { title: 'West', value: 'west' }
    ]

    const paymentMethods = [
      { title: 'Bank Account', value: 'bank' },
      { title: 'PayPal', value: 'paypal' }
    ]

    const payoutFrequencies = [
      { title: 'Daily', value: 'daily' },
      { title: 'Weekly', value: 'weekly' },
      { title: 'Bi-weekly', value: 'biweekly' }
    ]

    const vehicleForm = ref({
      valid: false,
      type: '',
      model: '',
      plate: '',
      color: ''
    })

    const passwordForm = ref({
      valid: false,
      current: '',
      new: '',
      confirm: ''
    })

    const bankForm = ref({
      valid: false,
      name: '',
      number: '',
      routingNumber: ''
    })

    const deleteConfirm = ref('')

    // Validation rules
    const rules = {
      required: v => !!v || 'Required',
      password: v => v.length >= 8 || 'Password must be at least 8 characters',
      passwordMatch: v => v === passwordForm.value.new || 'Passwords must match'
    }

    // Methods
    const updateVehicle = async () => {
      if (!vehicleForm.value.valid) return
      
      updating.value = true
      try {
        await store.dispatch('driver/updateVehicle', vehicleForm.value)
      } catch (error) {
        console.error('Failed to update vehicle:', error)
      } finally {
        updating.value = false
      }
    }

    const updatePassword = async () => {
      if (!passwordForm.value.valid) return

      updating.value = true
      try {
        await store.dispatch('driver/updatePassword', {
          currentPassword: passwordForm.value.current,
          newPassword: passwordForm.value.new
        })
        showChangePassword.value = false
        passwordForm.value = { valid: false, current: '', new: '', confirm: '' }
      } catch (error) {
        console.error('Failed to update password:', error)
      } finally {
        updating.value = false
      }
    }

    const updateBankAccount = async () => {
      if (!bankForm.value.valid) return

      updating.value = true
      try {
        await store.dispatch('driver/updateBankAccount', bankForm.value)
        showBankAccount.value = false
      } catch (error) {
        console.error('Failed to update bank account:', error)
      } finally {
        updating.value = false
      }
    }

    const deleteAccount = async () => {
      if (deleteConfirm.value !== 'DELETE') return

      updating.value = true
      try {
        await store.dispatch('driver/deleteAccount')
      } catch (error) {
        console.error('Failed to delete account:', error)
      } finally {
        updating.value = false
      }
    }

    const downloadData = async () => {
      try {
        await store.dispatch('driver/downloadPersonalData')
      } catch (error) {
        console.error('Failed to download data:', error)
      }
    }

    const editBankAccount = () => {
      bankForm.value = {
        valid: false,
        name: '',
        number: '',
        routingNumber: ''
      }
      showBankAccount.value = true
    }

    // Lifecycle
    onMounted(async () => {
      try {
        const userSettings = await store.dispatch('driver/fetchSettings')
        settings.value = { ...settings.value, ...userSettings }
        
        const vehicleInfo = await store.dispatch('driver/fetchVehicle')
        vehicleForm.value = { ...vehicleForm.value, ...vehicleInfo }
      } catch (error) {
        console.error('Failed to fetch settings:', error)
      }
    })

    return {
      updating,
      settings,
      vehicleForm,
      passwordForm,
      bankForm,
      deleteConfirm,
      showChangePassword,
      showDeleteAccount,
      showBankAccount,
      showUpdatePhone,
      showUpdateEmail,
      vehicleTypes,
      availableAreas,
      paymentMethods,
      payoutFrequencies,
      rules,
      updateVehicle,
      updatePassword,
      updateBankAccount,
      deleteAccount,
      downloadData,
      editBankAccount
    }
  }
}
</script>

<style scoped>
.v-card {
  border-radius: 12px;
}

.v-card-title {
  padding: 20px;
}

.v-card-text {
  padding: 20px;
}
</style>
