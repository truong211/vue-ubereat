<template>
  <div class="user-settings">
    <!-- Account Settings -->
    <v-card class="mb-4">
      <v-card-title>
        Account Settings
        <v-spacer></v-spacer>
        <v-btn
          icon="mdi-pencil"
          variant="text"
          @click="editMode.account = !editMode.account"
        ></v-btn>
      </v-card-title>

      <v-card-text>
        <v-form
          ref="accountForm"
          v-model="forms.account.valid"
          :disabled="!editMode.account"
        >
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="settings.account.firstName"
                label="First Name"
                :rules="[rules.required]"
              ></v-text-field>
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="settings.account.lastName"
                label="Last Name"
                :rules="[rules.required]"
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="settings.account.email"
                label="Email"
                type="email"
                :rules="[rules.required, rules.email]"
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="settings.account.phone"
                label="Phone Number"
                :rules="[rules.required, rules.phone]"
              ></v-text-field>
            </v-col>
          </v-row>

          <div v-if="editMode.account" class="d-flex justify-end">
            <v-btn
              variant="outlined"
              class="mr-2"
              @click="cancelEdit('account')"
            >
              Cancel
            </v-btn>
            <v-btn
              color="primary"
              :loading="saving.account"
              @click="saveSettings('account')"
            >
              Save Changes
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- Notification Preferences -->
    <v-card class="mb-4">
      <v-card-title>
        Notification Preferences
        <v-spacer></v-spacer>
        <v-btn
          icon="mdi-pencil"
          variant="text"
          @click="editMode.notifications = !editMode.notifications"
        ></v-btn>
      </v-card-title>

      <v-card-text>
        <v-form
          ref="notificationsForm"
          v-model="forms.notifications.valid"
          :disabled="!editMode.notifications"
        >
          <v-list>
            <v-list-item>
              <v-checkbox
                v-model="settings.notifications.orderUpdates"
                label="Order Status Updates"
              ></v-checkbox>
            </v-list-item>

            <v-list-item>
              <v-checkbox
                v-model="settings.notifications.promotions"
                label="Promotional Offers"
              ></v-checkbox>
            </v-list-item>

            <v-list-item>
              <v-checkbox
                v-model="settings.notifications.restaurantUpdates"
                label="Restaurant Updates"
              ></v-checkbox>
            </v-list-item>

            <v-list-item>
              <v-checkbox
                v-model="settings.notifications.delivery"
                label="Delivery Notifications"
              ></v-checkbox>
            </v-list-item>
          </v-list>

          <div v-if="editMode.notifications" class="d-flex justify-end">
            <v-btn
              variant="outlined"
              class="mr-2"
              @click="cancelEdit('notifications')"
            >
              Cancel
            </v-btn>
            <v-btn
              color="primary"
              :loading="saving.notifications"
              @click="saveSettings('notifications')"
            >
              Save Changes
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- Privacy Settings -->
    <v-card class="mb-4">
      <v-card-title>
        Privacy Settings
        <v-spacer></v-spacer>
        <v-btn
          icon="mdi-pencil"
          variant="text"
          @click="editMode.privacy = !editMode.privacy"
        ></v-btn>
      </v-card-title>

      <v-card-text>
        <v-form
          ref="privacyForm"
          v-model="forms.privacy.valid"
          :disabled="!editMode.privacy"
        >
          <v-list>
            <v-list-item>
              <v-checkbox
                v-model="settings.privacy.shareOrderHistory"
                label="Share Order History with Restaurants"
              ></v-checkbox>
            </v-list-item>

            <v-list-item>
              <v-checkbox
                v-model="settings.privacy.shareLocation"
                label="Share Location for Better Recommendations"
              ></v-checkbox>
            </v-list-item>

            <v-list-item>
              <v-checkbox
                v-model="settings.privacy.allowReviewTagging"
                label="Allow Tagging in Reviews"
              ></v-checkbox>
            </v-list-item>

            <v-list-item>
              <v-select
                v-model="settings.privacy.profileVisibility"
                :items="privacyOptions"
                label="Profile Visibility"
              ></v-select>
            </v-list-item>
          </v-list>

          <div v-if="editMode.privacy" class="d-flex justify-end">
            <v-btn
              variant="outlined"
              class="mr-2"
              @click="cancelEdit('privacy')"
            >
              Cancel
            </v-btn>
            <v-btn
              color="primary"
              :loading="saving.privacy"
              @click="saveSettings('privacy')"
            >
              Save Changes
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- Delivery Preferences -->
    <v-card>
      <v-card-title>
        Delivery Preferences
        <v-spacer></v-spacer>
        <v-btn
          icon="mdi-pencil"
          variant="text"
          @click="editMode.delivery = !editMode.delivery"
        ></v-btn>
      </v-card-title>

      <v-card-text>
        <v-form
          ref="deliveryForm"
          v-model="forms.delivery.valid"
          :disabled="!editMode.delivery"
        >
          <v-list>
            <v-list-item>
              <v-select
                v-model="settings.delivery.defaultInstructions"
                :items="deliveryInstructions"
                label="Default Delivery Instructions"
              ></v-select>
            </v-list-item>

            <v-list-item>
              <v-select
                v-model="settings.delivery.preferredTime"
                :items="deliveryTimes"
                label="Preferred Delivery Time"
              ></v-select>
            </v-list-item>

            <v-list-item>
              <v-checkbox
                v-model="settings.delivery.contactless"
                label="Prefer Contactless Delivery"
              ></v-checkbox>
            </v-list-item>

            <v-list-item>
              <v-textarea
                v-model="settings.delivery.additionalNotes"
                label="Additional Delivery Notes"
                rows="2"
              ></v-textarea>
            </v-list-item>
          </v-list>

          <div v-if="editMode.delivery" class="d-flex justify-end">
            <v-btn
              variant="outlined"
              class="mr-2"
              @click="cancelEdit('delivery')"
            >
              Cancel
            </v-btn>
            <v-btn
              color="primary"
              :loading="saving.delivery"
              @click="saveSettings('delivery')"
            >
              Save Changes
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useStore } from 'vuex'
import { useToast } from '@/composables/useToast'

export default {
  name: 'UserSettingsManager',

  setup() {
    const store = useStore()
    const { showToast } = useToast()

    // Form references
    const accountForm = ref(null)
    const notificationsForm = ref(null)
    const privacyForm = ref(null)
    const deliveryForm = ref(null)

    // Form validation states
    const forms = reactive({
      account: { valid: true },
      notifications: { valid: true },
      privacy: { valid: true },
      delivery: { valid: true }
    })

    // Edit mode states
    const editMode = reactive({
      account: false,
      notifications: false,
      privacy: false,
      delivery: false
    })

    // Saving states
    const saving = reactive({
      account: false,
      notifications: false,
      privacy: false,
      delivery: false
    })

    // Settings data
    const settings = reactive({
      account: {
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
      },
      notifications: {
        orderUpdates: true,
        promotions: true,
        restaurantUpdates: true,
        delivery: true
      },
      privacy: {
        shareOrderHistory: false,
        shareLocation: true,
        allowReviewTagging: true,
        profileVisibility: 'friends'
      },
      delivery: {
        defaultInstructions: 'leave_at_door',
        preferredTime: 'asap',
        contactless: true,
        additionalNotes: ''
      }
    })

    // Options
    const privacyOptions = ref([
      { title: 'Everyone', value: 'public' },
      { title: 'Friends Only', value: 'friends' },
      { title: 'Private', value: 'private' }
    ])

    const deliveryInstructions = ref([
      { title: 'Leave at Door', value: 'leave_at_door' },
      { title: 'Meet Outside', value: 'meet_outside' },
      { title: 'Meet at Door', value: 'meet_at_door' }
    ])

    const deliveryTimes = ref([
      { title: 'As Soon As Possible', value: 'asap' },
      { title: 'Schedule for Later', value: 'schedule' }
    ])

    // Validation rules
    const rules = {
      required: v => !!v || 'Required',
      email: v => /.+@.+\..+/.test(v) || 'Invalid email',
      phone: v => /^\+?[\d\s-]+$/.test(v) || 'Invalid phone number'
    }

    // Load user settings
    const loadSettings = async () => {
      try {
        const userSettings = await store.dispatch('user/getSettings')
        Object.keys(userSettings).forEach(section => {
          if (settings[section]) {
            Object.assign(settings[section], userSettings[section])
          }
        })
      } catch (error) {
        console.error('Failed to load settings:', error)
        showToast('Failed to load settings', 'error')
      }
    }

    // Save settings
    const saveSettings = async (section) => {
      const form = {
        account: accountForm,
        notifications: notificationsForm,
        privacy: privacyForm,
        delivery: deliveryForm
      }[section]

      const valid = await form.value?.validate()
      if (!valid) return

      saving[section] = true
      try {
        await store.dispatch('user/updateSettings', {
          section,
          data: settings[section]
        })
        editMode[section] = false
        showToast('Settings updated successfully', 'success')
      } catch (error) {
        console.error('Failed to save settings:', error)
        showToast('Failed to save settings', 'error')
      } finally {
        saving[section] = false
      }
    }

    // Cancel edit
    const cancelEdit = (section) => {
      editMode[section] = false
      loadSettings() // Reload original settings
    }

    // Initialize
    loadSettings()

    return {
      accountForm,
      notificationsForm,
      privacyForm,
      deliveryForm,
      forms,
      editMode,
      saving,
      settings,
      privacyOptions,
      deliveryInstructions,
      deliveryTimes,
      rules,
      saveSettings,
      cancelEdit
    }
  }
}
</script>

<style scoped>
.user-settings {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
}
</style>