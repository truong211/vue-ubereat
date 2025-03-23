<template>
  <div>
    <h1 class="text-h4 mb-6">Restaurant Settings</h1>

    <v-tabs v-model="activeTab" class="mb-6">
      <v-tab value="profile">Profile</v-tab>
      <v-tab value="hours">Business Hours</v-tab>
      <v-tab value="delivery">Delivery Settings</v-tab>
      <v-tab value="notifications">Notifications</v-tab>
      <v-tab value="account">Account</v-tab>
      <v-tab value="menu">Menu Availability</v-tab>
      <v-tab value="closure">Temporary Closure</v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <!-- Profile Settings -->
      <v-window-item value="profile">
        <v-form ref="profileForm" v-model="forms.profile.valid">
          <v-card>
            <v-card-text>
              <!-- Restaurant Logo -->
              <div class="d-flex align-center mb-6">
                <v-avatar size="100" color="grey-lighten-2">
                  <v-img
                    v-if="forms.profile.logo"
                    :src="forms.profile.logo"
                    alt="Restaurant Logo"
                  ></v-img>
                  <span v-else class="text-h4">
                    {{ forms.profile.name?.charAt(0) }}
                  </span>
                </v-avatar>
                <v-file-input
                  v-model="forms.profile.newLogo"
                  accept="image/*"
                  label="Change Logo"
                  variant="outlined"
                  density="comfortable"
                  class="ml-4"
                  hide-details
                  prepend-icon=""
                ></v-file-input>
              </div>

              <!-- Restaurant Cover -->
              <div class="mb-6">
                <v-img
                  v-if="forms.profile.cover"
                  :src="forms.profile.cover"
                  height="200"
                  cover
                  class="rounded"
                ></v-img>
                <v-file-input
                  v-model="forms.profile.newCover"
                  accept="image/*"
                  label="Change Cover Image"
                  variant="outlined"
                  density="comfortable"
                  prepend-icon="mdi-image"
                ></v-file-input>
              </div>

              <!-- Basic Info -->
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="forms.profile.name"
                    label="Restaurant Name"
                    :rules="[rules.required]"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="forms.profile.phone"
                    label="Phone Number"
                    :rules="[rules.required, rules.phone]"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="forms.profile.email"
                    label="Email Address"
                    :rules="[rules.required, rules.email]"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    v-model="forms.profile.description"
                    label="Restaurant Description"
                    :rules="[rules.required]"
                    variant="outlined"
                    rows="3"
                  ></v-textarea>
                </v-col>
              </v-row>

              <!-- Cuisine Types -->
              <v-combobox
                v-model="forms.profile.cuisineTypes"
                :items="availableCuisines"
                label="Cuisine Types"
                multiple
                chips
                variant="outlined"
              ></v-combobox>

              <!-- Address -->
              <div class="text-subtitle-1 mt-6 mb-2">Restaurant Address</div>
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="forms.profile.address.street"
                    label="Street Address"
                    :rules="[rules.required]"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="forms.profile.address.city"
                    label="City"
                    :rules="[rules.required]"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="forms.profile.address.postalCode"
                    label="Postal Code"
                    :rules="[rules.required]"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="forms.profile.address.latitude"
                    label="Latitude"
                    :rules="[rules.required]"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="forms.profile.address.longitude"
                    label="Longitude"
                    :rules="[rules.required]"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
              </v-row>

              <!-- Tax Information -->
              <div class="text-subtitle-1 mt-6 mb-2">Tax Information</div>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="forms.profile.taxInformation.taxId"
                    label="Tax ID"
                    :rules="[rules.required]"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="forms.profile.taxInformation.companyName"
                    label="Company Name"
                    :rules="[rules.required]"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="forms.profile.taxInformation.businessLicense"
                    label="Business License"
                    :rules="[rules.required]"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
              </v-row>

              <!-- Bank Information -->
              <div class="text-subtitle-1 mt-6 mb-2">Bank Information</div>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="forms.profile.bankInformation.bankName"
                    label="Bank Name"
                    :rules="[rules.required]"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="forms.profile.bankInformation.accountNumber"
                    label="Account Number"
                    :rules="[rules.required]"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="forms.profile.bankInformation.accountHolder"
                    label="Account Holder"
                    :rules="[rules.required]"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn
                color="primary"
                :loading="saving"
                @click="saveProfile"
              >
                Save Changes
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-form>
      </v-window-item>

      <!-- Business Hours -->
      <v-window-item value="hours">
        <v-card>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <div class="text-subtitle-1 mb-4">Regular Hours</div>
                <v-list>
                  <v-list-item
                    v-for="day in daysOfWeek"
                    :key="day"
                  >
                    <template v-slot:prepend>
                      <v-checkbox
                        v-model="forms.hours[day].enabled"
                        hide-details
                      ></v-checkbox>
                    </template>

                    <v-list-item-title>{{ day }}</v-list-item-title>

                    <template v-slot:append>
                      <div class="d-flex align-center" v-if="forms.hours[day].enabled">
                        <v-select
                          v-model="forms.hours[day].open"
                          :items="timeSlots"
                          density="comfortable"
                          hide-details
                          class="time-select"
                        ></v-select>
                        <span class="mx-2">to</span>
                        <v-select
                          v-model="forms.hours[day].close"
                          :items="timeSlots"
                          density="comfortable"
                          hide-details
                          class="time-select"
                        ></v-select>
                      </div>
                      <div v-else class="text-caption text-grey">
                        Closed
                      </div>
                    </template>
                  </v-list-item>
                </v-list>
              </v-col>

              <v-col cols="12" md="6">
                <div class="text-subtitle-1 mb-4">Special Hours</div>
                <v-btn
                  prepend-icon="mdi-plus"
                  @click="addSpecialHours"
                >
                  Add Special Hours
                </v-btn>

                <v-list class="mt-4">
                  <v-list-item
                    v-for="(special, index) in forms.specialHours"
                    :key="index"
                  >
                    <v-list-item-title>
                      <v-text-field
                        v-model="special.date"
                        type="date"
                        label="Date"
                        hide-details
                        density="comfortable"
                      ></v-text-field>
                    </v-list-item-title>

                    <template v-slot:append>
                      <div class="d-flex align-center">
                        <v-select
                          v-model="special.open"
                          :items="timeSlots"
                          density="comfortable"
                          hide-details
                          class="time-select"
                        ></v-select>
                        <span class="mx-2">to</span>
                        <v-select
                          v-model="special.close"
                          :items="timeSlots"
                          density="comfortable"
                          hide-details
                          class="time-select"
                        ></v-select>
                        <v-btn
                          icon="mdi-delete"
                          variant="text"
                          color="error"
                          density="comfortable"
                          @click="removeSpecialHours(index)"
                        ></v-btn>
                      </div>
                    </template>
                  </v-list-item>
                </v-list>
              </v-col>
            </v-row>
          </v-card-text>

          <v-divider></v-divider>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              :loading="saving"
              @click="saveHours"
            >
              Save Changes
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-window-item>

      <!-- Delivery Settings -->
      <v-window-item value="delivery">
        <v-card>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <div class="text-subtitle-1 mb-4">Delivery Area</div>
                <v-text-field
                  v-model="forms.delivery.radius"
                  type="number"
                  label="Delivery Radius (km)"
                  variant="outlined"
                  :rules="[rules.required]"
                ></v-text-field>
                <v-text-field
                  v-model="forms.delivery.minOrder"
                  type="number"
                  label="Minimum Order Amount"
                  prefix="$"
                  variant="outlined"
                  :rules="[rules.required]"
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="6">
                <div class="text-subtitle-1 mb-4">Delivery Fees</div>
                <v-text-field
                  v-model="forms.delivery.baseFee"
                  type="number"
                  label="Base Delivery Fee"
                  prefix="$"
                  variant="outlined"
                  :rules="[rules.required]"
                ></v-text-field>
                <v-text-field
                  v-model="forms.delivery.perKmFee"
                  type="number"
                  label="Per Kilometer Fee"
                  prefix="$"
                  variant="outlined"
                  :rules="[rules.required]"
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-switch
                  v-model="forms.delivery.autoAccept"
                  label="Auto-accept orders"
                ></v-switch>
                <v-switch
                  v-model="forms.delivery.pickupEnabled"
                  label="Enable pickup orders"
                ></v-switch>
              </v-col>
            </v-row>
          </v-card-text>

          <v-divider></v-divider>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              :loading="saving"
              @click="saveDelivery"
            >
              Save Changes
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-window-item>

      <!-- Notification Settings -->
      <v-window-item value="notifications">
        <v-card>
          <v-card-text>
            <div class="text-subtitle-1 mb-4">Order Notifications</div>
            <v-list>
              <v-list-item>
                <template v-slot:prepend>
                  <v-checkbox
                    v-model="forms.notifications.email"
                    hide-details
                  ></v-checkbox>
                </template>
                <v-list-item-title>Email Notifications</v-list-item-title>
              </v-list-item>

              <v-list-item>
                <template v-slot:prepend>
                  <v-checkbox
                    v-model="forms.notifications.sms"
                    hide-details
                  ></v-checkbox>
                </template>
                <v-list-item-title>SMS Notifications</v-list-item-title>
              </v-list-item>

              <v-list-item>
                <template v-slot:prepend>
                  <v-checkbox
                    v-model="forms.notifications.push"
                    hide-details
                  ></v-checkbox>
                </template>
                <v-list-item-title>Push Notifications</v-list-item-title>
              </v-list-item>
            </v-list>

            <div class="text-subtitle-1 mt-6 mb-4">Review Notifications</div>
            <v-list>
              <v-list-item>
                <template v-slot:prepend>
                  <v-checkbox
                    v-model="forms.notifications.newReviews"
                    hide-details
                  ></v-checkbox>
                </template>
                <v-list-item-title>New Reviews</v-list-item-title>
              </v-list-item>

              <v-list-item>
                <template v-slot:prepend>
                  <v-checkbox
                    v-model="forms.notifications.lowRatings"
                    hide-details
                  ></v-checkbox>
                </template>
                <v-list-item-title>Low Ratings (3 stars or below)</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>

          <v-divider></v-divider>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              :loading="saving"
              @click="saveNotifications"
            >
              Save Changes
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-window-item>

      <!-- Account Settings -->
      <v-window-item value="account">
        <v-card>
          <v-card-text>
            <div class="text-subtitle-1 mb-4">Change Password</div>
            <v-form ref="passwordForm" v-model="forms.account.valid">
              <v-text-field
                v-model="forms.account.currentPassword"
                label="Current Password"
                type="password"
                variant="outlined"
                :rules="[rules.required]"
              ></v-text-field>

              <v-text-field
                v-model="forms.account.newPassword"
                label="New Password"
                type="password"
                variant="outlined"
                :rules="[rules.required, rules.password]"
              ></v-text-field>

              <v-text-field
                v-model="forms.account.confirmPassword"
                label="Confirm New Password"
                type="password"
                variant="outlined"
                :rules="[
                  rules.required,
                  value => value === forms.account.newPassword || 'Passwords must match'
                ]"
              ></v-text-field>
            </v-form>

            <v-divider class="my-6"></v-divider>

            <div class="text-subtitle-1 mb-4">Delete Account</div>
            <p class="text-body-2 mb-4">
              Once you delete your restaurant account, all of your data will be permanently deleted.
              This action cannot be undone.
            </p>
            <v-btn
              color="error"
              variant="outlined"
              @click="confirmDelete"
            >
              Delete Restaurant Account
            </v-btn>
          </v-card-text>

          <v-divider></v-divider>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              :loading="saving"
              @click="savePassword"
            >
              Update Password
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-window-item>

      <!-- Menu Availability -->
      <v-window-item value="menu">
        <menu-availability-manager />
      </v-window-item>

      <!-- Temporary Closure -->
      <v-window-item value="closure">
        <temp-closure-manager />
      </v-window-item>
    </v-window>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h5">Delete Restaurant Account</v-card-title>
        <v-card-text>
          <p class="mb-4">Please type "DELETE" to confirm account deletion:</p>
          <v-text-field
            v-model="deleteConfirmation"
            variant="outlined"
            density="comfortable"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="deleteDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            :disabled="deleteConfirmation !== 'DELETE'"
            :loading="deleting"
            @click="deleteAccount"
          >
            Delete Account
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import MenuAvailabilityManager from '@/components/restaurant/MenuAvailabilityManager.vue'
import TempClosureManager from '@/components/restaurant/TempClosureManager.vue'

export default {
  name: 'RestaurantSettings',

  components: {
    MenuAvailabilityManager,
    TempClosureManager
  },

  setup() {
    const store = useStore()
    const router = useRouter()
    const profileForm = ref(null)
    const passwordForm = ref(null)

    // Tab state
    const activeTab = ref('profile')
    const saving = ref(false)
    const deleting = ref(false)

    // Delete dialog
    const deleteDialog = ref(false)
    const deleteConfirmation = ref('')

    // Form data
    const forms = ref({
      profile: {
        valid: false,
        logo: null,
        newLogo: null,
        cover: null,
        newCover: null,
        name: '',
        phone: '',
        email: '',
        description: '',
        cuisineTypes: [],
        address: {
          street: '',
          city: '',
          postalCode: '',
          latitude: null,
          longitude: null
        },
        taxInformation: {
          taxId: '',
          companyName: '',
          businessLicense: ''
        },
        bankInformation: {
          bankName: '',
          accountNumber: '',
          accountHolder: ''
        }
      },
      hours: {
        Monday: { enabled: true, open: '09:00', close: '22:00' },
        Tuesday: { enabled: true, open: '09:00', close: '22:00' },
        Wednesday: { enabled: true, open: '09:00', close: '22:00' },
        Thursday: { enabled: true, open: '09:00', close: '22:00' },
        Friday: { enabled: true, open: '09:00', close: '22:00' },
        Saturday: { enabled: true, open: '10:00', close: '23:00' },
        Sunday: { enabled: true, open: '10:00', close: '22:00' }
      },
      specialHours: [],
      delivery: {
        radius: 5,
        minOrder: 10,
        baseFee: 2,
        perKmFee: 0.5,
        autoAccept: false,
        pickupEnabled: true
      },
      notifications: {
        email: true,
        sms: true,
        push: true,
        newReviews: true,
        lowRatings: true
      },
      account: {
        valid: false,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
    })

    // Validation rules
    const rules = {
      required: v => !!v || 'Required',
      email: v => /.+@.+\..+/.test(v) || 'Invalid email',
      phone: v => /^\+?[\d\s-]{10,}$/.test(v) || 'Invalid phone number',
      password: v => v.length >= 8 || 'Password must be at least 8 characters'
    }

    // Helper data
    const daysOfWeek = [
      'Monday', 'Tuesday', 'Wednesday', 'Thursday',
      'Friday', 'Saturday', 'Sunday'
    ]

    const timeSlots = computed(() => {
      const slots = []
      for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
          slots.push(time)
        }
      }
      return slots
    })

    const availableCuisines = [
      'American', 'Chinese', 'French', 'Indian', 'Italian',
      'Japanese', 'Korean', 'Mexican', 'Thai', 'Vietnamese'
    ]

    // Methods
    const loadSettings = async () => {
      try {
        const settings = await store.dispatch('restaurantAdmin/fetchSettings')
        // Update form data with fetched settings
        forms.value = {
          ...forms.value,
          ...settings
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }

    const saveProfile = async () => {
      const valid = await profileForm.value.validate()
      if (!valid.valid) return

      saving.value = true
      try {
        await store.dispatch('restaurantAdmin/updateProfile', forms.value.profile)
      } catch (error) {
        console.error('Failed to save profile:', error)
      } finally {
        saving.value = false
      }
    }

    const saveHours = async () => {
      saving.value = true
      try {
        await store.dispatch('restaurantAdmin/updateHours', {
          regularHours: forms.value.hours,
          specialHours: forms.value.specialHours
        })
      } catch (error) {
        console.error('Failed to save hours:', error)
      } finally {
        saving.value = false
      }
    }

    const saveDelivery = async () => {
      saving.value = true
      try {
        await store.dispatch('restaurantAdmin/updateDelivery', forms.value.delivery)
      } catch (error) {
        console.error('Failed to save delivery settings:', error)
      } finally {
        saving.value = false
      }
    }

    const saveNotifications = async () => {
      saving.value = true
      try {
        await store.dispatch('restaurantAdmin/updateNotifications', forms.value.notifications)
      } catch (error) {
        console.error('Failed to save notification settings:', error)
      } finally {
        saving.value = false
      }
    }

    const savePassword = async () => {
      const valid = await passwordForm.value.validate()
      if (!valid.valid) return

      saving.value = true
      try {
        await store.dispatch('restaurantAdmin/updatePassword', {
          currentPassword: forms.value.account.currentPassword,
          newPassword: forms.value.account.newPassword
        })
        forms.value.account.currentPassword = ''
        forms.value.account.newPassword = ''
        forms.value.account.confirmPassword = ''
      } catch (error) {
        console.error('Failed to update password:', error)
      } finally {
        saving.value = false
      }
    }

    const addSpecialHours = () => {
      forms.value.specialHours.push({
        date: '',
        open: '09:00',
        close: '22:00'
      })
    }

    const removeSpecialHours = (index) => {
      forms.value.specialHours.splice(index, 1)
    }

    const confirmDelete = () => {
      deleteDialog.value = true
      deleteConfirmation.value = ''
    }

    const deleteAccount = async () => {
      if (deleteConfirmation.value !== 'DELETE') return

      deleting.value = true
      try {
        await store.dispatch('restaurantAdmin/deleteAccount')
        await store.dispatch('logout')
        router.push('/auth/login')
      } catch (error) {
        console.error('Failed to delete account:', error)
      } finally {
        deleting.value = false
        deleteDialog.value = false
      }
    }

    // Lifecycle
    onMounted(() => {
      loadSettings()
    })

    return {
      activeTab,
      forms,
      rules,
      saving,
      deleting,
      profileForm,
      passwordForm,
      daysOfWeek,
      timeSlots,
      availableCuisines,
      deleteDialog,
      deleteConfirmation,
      saveProfile,
      saveHours,
      saveDelivery,
      saveNotifications,
      savePassword,
      addSpecialHours,
      removeSpecialHours,
      confirmDelete,
      deleteAccount
    }
  }
}
</script>

<style scoped>
.time-select {
  width: 120px;
}
</style>
