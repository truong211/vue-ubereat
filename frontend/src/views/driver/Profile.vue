<template>
  <div>
    <!-- Profile Header -->
    <v-card class="mb-6">
      <v-card-text class="d-flex align-center">
        <div class="d-flex flex-column align-center me-6">
          <v-avatar
            size="120"
            :image="profile.avatar"
            color="grey-lighten-2"
          >
            <v-icon size="48" v-if="!profile.avatar">mdi-account</v-icon>
          </v-avatar>
          <v-btn
            variant="text"
            color="primary"
            class="mt-2"
            @click="$refs.avatarInput.click()"
          >
            Change Photo
          </v-btn>
          <input
            ref="avatarInput"
            type="file"
            accept="image/*"
            class="d-none"
            @change="uploadAvatar"
          >
        </div>

        <div class="flex-grow-1">
          <h2 class="text-h4 mb-1">{{ profile.name }}</h2>
          <div class="d-flex align-center mb-2">
            <v-icon color="success" class="me-2">mdi-check-circle</v-icon>
            <span class="text-success">Verified Driver</span>
            <v-chip
              class="ml-4"
              :color="isOnline ? 'success' : 'grey'"
              size="small"
            >
              {{ isOnline ? 'Online' : 'Offline' }}
            </v-chip>
          </div>
          <div class="d-flex align-center">
            <v-rating
              :model-value="profile.rating"
              color="amber"
              density="compact"
              half-increments
              readonly
            ></v-rating>
            <span class="ms-2 text-body-1">{{ profile.rating.toFixed(1) }}</span>
            <span class="text-caption ms-2">({{ profile.totalRatings }} ratings)</span>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Profile Info & Documents -->
    <v-row>
      <v-col cols="12" md="8">
        <!-- Personal Information -->
        <v-card class="mb-6">
          <v-toolbar density="comfortable">
            <v-toolbar-title>Personal Information</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn
              variant="text"
              color="primary"
              @click="editMode = !editMode"
            >
              {{ editMode ? 'Cancel' : 'Edit' }}
            </v-btn>
          </v-toolbar>

          <v-card-text>
            <v-form ref="profileForm" v-model="form.valid">
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="form.firstName"
                    label="First Name"
                    :rules="[rules.required]"
                    :readonly="!editMode"
                    variant="outlined"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="form.lastName"
                    label="Last Name"
                    :rules="[rules.required]"
                    :readonly="!editMode"
                    variant="outlined"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="form.email"
                    label="Email"
                    type="email"
                    :rules="[rules.required, rules.email]"
                    :readonly="!editMode"
                    variant="outlined"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="form.phone"
                    label="Phone"
                    type="tel"
                    :rules="[rules.required, rules.phone]"
                    :readonly="!editMode"
                    variant="outlined"
                  ></v-text-field>
                </v-col>

                <v-col cols="12">
                  <v-text-field
                    v-model="form.address"
                    label="Address"
                    :rules="[rules.required]"
                    :readonly="!editMode"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
              </v-row>

              <v-btn
                v-if="editMode"
                color="primary"
                :loading="updating"
                @click="updateProfile"
              >
                Save Changes
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>

        <!-- Delivery Statistics -->
        <v-card>
          <v-toolbar density="comfortable">
            <v-toolbar-title>Delivery Statistics</v-toolbar-title>
          </v-toolbar>

          <v-card-text>
            <v-row>
              <v-col cols="6" sm="4">
                <div class="text-h5">{{ stats.totalDeliveries }}</div>
                <div class="text-caption">Total Deliveries</div>
              </v-col>

              <v-col cols="6" sm="4">
                <div class="text-h5">{{ stats.completionRate }}%</div>
                <div class="text-caption">Completion Rate</div>
              </v-col>

              <v-col cols="6" sm="4">
                <div class="text-h5">{{ stats.onTimeRate }}%</div>
                <div class="text-caption">On-Time Rate</div>
              </v-col>

              <v-col cols="6" sm="4">
                <div class="text-h5">{{ formatTime(stats.avgDeliveryTime) }}</div>
                <div class="text-caption">Avg. Delivery Time</div>
              </v-col>

              <v-col cols="6" sm="4">
                <div class="text-h5">{{ formatPrice(stats.totalEarnings) }}</div>
                <div class="text-caption">Total Earnings</div>
              </v-col>

              <v-col cols="6" sm="4">
                <div class="text-h5">{{ formatPrice(stats.avgOrderValue) }}</div>
                <div class="text-caption">Avg. Order Value</div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <!-- Documents -->
        <v-card class="mb-6">
          <v-toolbar density="comfortable">
            <v-toolbar-title>Documents</v-toolbar-title>
          </v-toolbar>

          <v-list lines="two">
            <v-list-item
              v-for="doc in documents"
              :key="doc.type"
              :title="doc.name"
              :subtitle="doc.status"
            >
              <template v-slot:prepend>
                <v-icon :color="getDocumentStatusColor(doc.status)">
                  {{ getDocumentStatusIcon(doc.status) }}
                </v-icon>
              </template>

              <template v-slot:append>
                <v-btn
                  v-if="doc.status === 'expired' || doc.status === 'missing'"
                  color="primary"
                  variant="text"
                  @click="uploadDocument(doc.type)"
                >
                  Upload
                </v-btn>
                <v-btn
                  v-else-if="doc.status === 'verified'"
                  icon="mdi-eye"
                  variant="text"
                  @click="viewDocument(doc)"
                ></v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-card>

        <!-- Vehicle Information -->
        <v-card>
          <v-toolbar density="comfortable">
            <v-toolbar-title>Vehicle Information</v-toolbar-title>
          </v-toolbar>

          <v-list lines="two">
            <v-list-item title="Vehicle Type">
              <template v-slot:prepend>
                <v-icon>{{ getVehicleIcon(vehicle.type) }}</v-icon>
              </template>
              <template v-slot:subtitle>
                {{ vehicle.model }}
              </template>
            </v-list-item>

            <v-list-item title="License Plate">
              <template v-slot:subtitle>
                {{ vehicle.plate }}
              </template>
            </v-list-item>

            <v-list-item title="Color">
              <template v-slot:subtitle>
                {{ vehicle.color }}
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <!-- Document Preview Dialog -->
    <v-dialog
      v-model="documentDialog.show"
      max-width="600"
    >
      <v-card v-if="documentDialog.document">
        <v-toolbar density="comfortable">
          <v-toolbar-title>{{ documentDialog.document.name }}</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" @click="documentDialog.show = false"></v-btn>
        </v-toolbar>

        <v-card-text class="pa-0">
          <v-img
            :src="documentDialog.document.url"
            class="doc-preview"
            contain
          ></v-img>
        </v-card-text>

        <v-card-text>
          <div class="text-caption">
            Uploaded: {{ formatDate(documentDialog.document.uploadDate) }}
          </div>
          <div class="text-caption">
            Expires: {{ formatDate(documentDialog.document.expiryDate) }}
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'DriverProfile',

  setup() {
    const store = useStore()
    const updating = ref(false)
    const editMode = ref(false)

    // Form refs
    const profileForm = ref(null)
    const avatarInput = ref(null)

    // Dialog state
    const documentDialog = ref({
      show: false,
      document: null
    })

    // Form data
    const profile = computed(() => store.state.driver.profile)
    const isOnline = computed(() => store.state.driver.status === 'online')
    const stats = computed(() => store.state.driver.metrics)
    const vehicle = computed(() => store.state.driver.vehicle)

    const form = ref({
      valid: false,
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: ''
    })

    const documents = ref([
      {
        type: 'id',
        name: 'Government ID',
        status: 'verified',
        url: '',
        uploadDate: '2024-01-01',
        expiryDate: '2025-01-01'
      },
      {
        type: 'license',
        name: 'Driver License',
        status: 'verified',
        url: '',
        uploadDate: '2024-01-01',
        expiryDate: '2025-01-01'
      },
      {
        type: 'insurance',
        name: 'Vehicle Insurance',
        status: 'expired',
        url: '',
        uploadDate: '2023-01-01',
        expiryDate: '2024-01-01'
      }
    ])

    // Validation rules
    const rules = {
      required: v => !!v || 'Required',
      email: v => /.+@.+\..+/.test(v) || 'Invalid email',
      phone: v => /^\+?\d{10,}$/.test(v) || 'Invalid phone number'
    }

    // Methods
    const uploadAvatar = async (event) => {
      const file = event.target.files[0]
      if (!file) return

      updating.value = true
      try {
        await store.dispatch('driver/updateAvatar', file)
      } catch (error) {
        console.error('Failed to upload avatar:', error)
      } finally {
        updating.value = false
      }
    }

    const updateProfile = async () => {
      if (!form.value.valid) return

      updating.value = true
      try {
        await store.dispatch('driver/updateProfile', {
          firstName: form.value.firstName,
          lastName: form.value.lastName,
          email: form.value.email,
          phone: form.value.phone,
          address: form.value.address
        })
        editMode.value = false
      } catch (error) {
        console.error('Failed to update profile:', error)
      } finally {
        updating.value = false
      }
    }

    const uploadDocument = async (type) => {
      // Implement document upload
    }

    const viewDocument = (document) => {
      documentDialog.value = {
        show: true,
        document
      }
    }

    const getDocumentStatusColor = (status) => {
      switch (status) {
        case 'verified': return 'success'
        case 'pending': return 'warning'
        case 'expired': return 'error'
        default: return 'grey'
      }
    }

    const getDocumentStatusIcon = (status) => {
      switch (status) {
        case 'verified': return 'mdi-check-circle'
        case 'pending': return 'mdi-clock'
        case 'expired': return 'mdi-alert'
        default: return 'mdi-file'
      }
    }

    const getVehicleIcon = (type) => {
      switch (type) {
        case 'bicycle': return 'mdi-bike'
        case 'motorcycle': return 'mdi-motorcycle'
        case 'car': return 'mdi-car'
        case 'van': return 'mdi-van-passenger'
        default: return 'mdi-help-circle'
      }
    }

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    const formatTime = (minutes) => {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours}h ${mins}m`
    }

    const formatPrice = (price) => {
      return `$${Number(price).toFixed(2)}`
    }

    // Lifecycle
    onMounted(async () => {
      try {
        await store.dispatch('driver/fetchProfile')
        form.value = {
          ...form.value,
          firstName: profile.value.firstName,
          lastName: profile.value.lastName,
          email: profile.value.email,
          phone: profile.value.phone,
          address: profile.value.address
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error)
      }
    })

    return {
      updating,
      editMode,
      profileForm,
      avatarInput,
      documentDialog,
      profile,
      isOnline,
      stats,
      vehicle,
      form,
      documents,
      rules,
      uploadAvatar,
      updateProfile,
      uploadDocument,
      viewDocument,
      getDocumentStatusColor,
      getDocumentStatusIcon,
      getVehicleIcon,
      formatDate,
      formatTime,
      formatPrice
    }
  }
}
</script>

<style scoped>
.doc-preview {
  max-height: 400px;
}
</style>
