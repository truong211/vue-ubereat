<template>
  <div>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4">Restaurant Management</h1>
      <v-spacer></v-spacer>
      <v-btn-group>
        <v-btn
          v-for="tab in tabs"
          :key="tab.value"
          :color="activeTab === tab.value ? 'primary' : undefined"
          variant="tonal"
          @click="activeTab = tab.value"
        >
          {{ tab.title }}
          <template v-if="tab.count">
            <v-badge
              :content="tab.count.toString()"
              :color="tab.color"
              class="ml-2"
              floating
            ></v-badge>
          </template>
        </v-btn>
      </v-btn-group>
    </div>

    <!-- Search and Filters -->
    <v-card class="mb-6">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="filters.search"
              label="Search restaurants"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="comfortable"
              hide-details
            ></v-text-field>
          </v-col>

          <v-col cols="12" sm="3">
            <v-select
              v-model="filters.cuisine"
              :items="cuisineTypes"
              label="Cuisine Type"
              variant="outlined"
              density="comfortable"
              hide-details
            ></v-select>
          </v-col>

          <v-col cols="12" sm="3">
            <v-select
              v-model="filters.status"
              :items="statusOptions"
              label="Status"
              variant="outlined"
              density="comfortable"
              hide-details
            ></v-select>
          </v-col>

          <v-col cols="12" sm="2">
            <v-btn
              color="primary"
              block
              prepend-icon="mdi-filter"
              @click="applyFilters"
            >
              Filter
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Restaurant List -->
    <v-data-table-server
      v-model:items-per-page="itemsPerPage"
      :headers="headers"
      :items="restaurants"
      :loading="loading"
      :items-length="totalRestaurants"
      @update:options="loadRestaurants"
    >
      <!-- Restaurant Logo -->
      <template v-slot:item.logo="{ item }">
        <v-avatar size="40">
          <v-img
            v-if="item.logo"
            :src="item.logo"
            :alt="item.name"
          ></v-img>
          <span v-else class="text-h6">
            {{ item.name.charAt(0) }}
          </span>
        </v-avatar>
      </template>

      <!-- Status -->
      <template v-slot:item.status="{ item }">
        <v-chip
          :color="getStatusColor(item.status)"
          size="small"
        >
          {{ formatStatus(item.status) }}
        </v-chip>
      </template>

      <!-- Rating -->
      <template v-slot:item.rating="{ item }">
        <v-rating
          :model-value="item.rating"
          color="amber"
          density="compact"
          half-increments
          readonly
          size="small"
        ></v-rating>
        <span class="text-caption ml-1">({{ item.reviewCount }})</span>
      </template>

      <!-- Actions -->
      <template v-slot:item.actions="{ item }">
        <v-btn-group density="comfortable">
          <v-btn
            icon="mdi-eye"
            variant="text"
            @click="viewRestaurant(item)"
          ></v-btn>

          <v-btn
            v-if="item.status === 'pending'"
            icon="mdi-check-circle"
            variant="text"
            color="success"
            @click="approveRestaurant(item)"
          ></v-btn>

          <v-btn
            v-if="item.status === 'pending'"
            icon="mdi-close-circle"
            variant="text"
            color="error"
            @click="rejectRestaurant(item)"
          ></v-btn>

          <v-btn
            v-if="item.status === 'active'"
            icon="mdi-pencil"
            variant="text"
            color="primary"
            @click="editRestaurant(item)"
          ></v-btn>

          <v-btn
            v-if="item.status === 'active'"
            icon="mdi-block-helper"
            variant="text"
            color="warning"
            @click="suspendRestaurant(item)"
          ></v-btn>

          <v-btn
            v-if="item.status === 'suspended'"
            icon="mdi-restore"
            variant="text"
            color="success"
            @click="activateRestaurant(item)"
          ></v-btn>

          <v-btn
            icon="mdi-delete"
            variant="text"
            color="error"
            @click="deleteRestaurant(item)"
          ></v-btn>
        </v-btn-group>
      </template>
    </v-data-table-server>

    <!-- Restaurant Verification Dialog -->
    <v-dialog
      v-model="verificationDialog.show"
      max-width="900"
    >
      <v-card v-if="verificationDialog.restaurant">
        <v-card-title class="d-flex align-center">
          Restaurant Verification
          <v-spacer></v-spacer>
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="verificationDialog.show = false"
          ></v-btn>
        </v-card-title>

        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <div class="d-flex align-center mb-4">
                <v-avatar size="64" color="primary" class="mr-4">
                  <v-img
                    v-if="verificationDialog.restaurant.logo"
                    :src="verificationDialog.restaurant.logo"
                    :alt="verificationDialog.restaurant.name"
                  ></v-img>
                  <span v-else class="text-h4 white--text">
                    {{ verificationDialog.restaurant.name.charAt(0) }}
                  </span>
                </v-avatar>
                <div>
                  <h3 class="text-h6 mb-1">{{ verificationDialog.restaurant.name }}</h3>
                  <div class="text-subtitle-2 text-medium-emphasis">
                    {{ verificationDialog.restaurant.cuisine }}
                  </div>
                </div>
              </div>

              <v-list density="comfortable">
                <v-list-item prepend-icon="mdi-account">
                  <div class="text-subtitle-2">Owner</div>
                  <div>{{ verificationDialog.restaurant.ownerName }}</div>
                </v-list-item>
                <v-list-item prepend-icon="mdi-email">
                  <div class="text-subtitle-2">Email</div>
                  <div>{{ verificationDialog.restaurant.email }}</div>
                </v-list-item>
                <v-list-item prepend-icon="mdi-phone">
                  <div class="text-subtitle-2">Phone</div>
                  <div>{{ verificationDialog.restaurant.phone }}</div>
                </v-list-item>
                <v-list-item prepend-icon="mdi-map-marker">
                  <div class="text-subtitle-2">Address</div>
                  <div>{{ verificationDialog.restaurant.address }}</div>
                </v-list-item>
                <v-list-item prepend-icon="mdi-calendar">
                  <div class="text-subtitle-2">Applied On</div>
                  <div>{{ formatDate(verificationDialog.restaurant.createdAt) }}</div>
                </v-list-item>
              </v-list>
            </v-col>

            <v-col cols="12" md="6">
              <div class="text-subtitle-1 font-weight-bold mb-2">Documents</div>
              <v-list density="comfortable">
                <v-list-item v-for="doc in verificationDialog.restaurant.documents" :key="doc.id">
                  <template v-slot:prepend>
                    <v-icon>{{ getDocumentIcon(doc.type) }}</v-icon>
                  </template>
                  
                  <v-list-item-title>{{ doc.name }}</v-list-item-title>
                  
                  <template v-slot:append>
                    <v-btn
                      icon="mdi-eye"
                      variant="text"
                      @click="viewDocument(doc)"
                    ></v-btn>
                  </template>
                </v-list-item>
              </v-list>
              
              <div class="mt-4">
                <div class="text-subtitle-1 font-weight-bold mb-2">Notes</div>
                <v-textarea
                  v-model="verificationDialog.notes"
                  label="Admin Notes"
                  variant="outlined"
                  rows="4"
                ></v-textarea>
              </div>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="outlined"
            @click="verificationDialog.show = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            @click="confirmRejectRestaurant(verificationDialog.restaurant)"
          >
            Reject
          </v-btn>
          <v-btn
            color="success"
            @click="confirmApproveRestaurant(verificationDialog.restaurant)"
          >
            Approve
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Restaurant Details Dialog -->
    <v-dialog
      v-model="detailsDialog.show"
      max-width="800"
    >
      <v-card v-if="detailsDialog.restaurant">
        <v-card-title class="d-flex align-center">
          Restaurant Details
          <v-chip
            :color="getStatusColor(detailsDialog.restaurant.status)"
            class="ml-4"
            size="small"
          >
            {{ formatStatus(detailsDialog.restaurant.status) }}
          </v-chip>
          <v-spacer></v-spacer>
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="detailsDialog.show = false"
          ></v-btn>
        </v-card-title>
        
        <v-img
          :src="detailsDialog.restaurant.cover || 'default-cover.jpg'"
          height="200"
          cover
        >
          <template v-slot:placeholder>
            <v-row
              class="fill-height ma-0"
              align="center"
              justify="center"
            >
              <v-progress-circular
                indeterminate
                color="grey-lighten-5"
              ></v-progress-circular>
            </v-row>
          </template>
        </v-img>

        <v-card-text class="pa-4">
          <v-row>
            <v-col cols="12" md="8">
              <div class="d-flex align-center mb-4">
                <v-avatar size="64" color="primary" class="mr-4">
                  <v-img
                    v-if="detailsDialog.restaurant.logo"
                    :src="detailsDialog.restaurant.logo"
                    alt="Restaurant logo"
                  ></v-img>
                  <span v-else class="text-h4 white--text">
                    {{ detailsDialog.restaurant.name.charAt(0) }}
                  </span>
                </v-avatar>
                <div>
                  <h2 class="text-h5 mb-1">{{ detailsDialog.restaurant.name }}</h2>
                  <div class="d-flex align-center">
                    <v-rating
                      :model-value="detailsDialog.restaurant.rating"
                      color="amber"
                      density="compact"
                      half-increments
                      readonly
                      size="small"
                    ></v-rating>
                    <span class="text-body-2 ml-2">
                      ({{ detailsDialog.restaurant.reviewCount }} reviews)
                    </span>
                  </div>
                </div>
              </div>

              <div class="text-subtitle-1 font-weight-bold mb-2">Description</div>
              <p class="text-body-1 mb-4">{{ detailsDialog.restaurant.description }}</p>

              <div class="text-subtitle-1 font-weight-bold mb-2">Cuisine Types</div>
              <v-chip-group>
                <v-chip
                  v-for="cuisine in detailsDialog.restaurant.cuisineTypes"
                  :key="cuisine"
                  color="primary"
                  size="small"
                >
                  {{ cuisine }}
                </v-chip>
              </v-chip-group>
            </v-col>

            <v-col cols="12" md="4">
              <div class="text-subtitle-1 font-weight-bold mb-2">Contact Info</div>
              <v-list density="comfortable">
                <v-list-item prepend-icon="mdi-phone">
                  {{ detailsDialog.restaurant.phone }}
                </v-list-item>
                <v-list-item prepend-icon="mdi-email">
                  {{ detailsDialog.restaurant.email }}
                </v-list-item>
                <v-list-item prepend-icon="mdi-map-marker">
                  {{ detailsDialog.restaurant.address }}
                </v-list-item>
              </v-list>

              <div class="text-subtitle-1 font-weight-bold mt-4 mb-2">Business Hours</div>
              <v-list density="comfortable">
                <v-list-item
                  v-for="(hours, day) in detailsDialog.restaurant.businessHours"
                  :key="day"
                >
                  <template v-slot:prepend>
                    <div class="text-caption text-medium-emphasis" style="width: 100px">
                      {{ day }}
                    </div>
                  </template>
                  {{ formatBusinessHours(hours) }}
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>

          <v-divider class="my-4"></v-divider>

          <div class="d-flex">
            <div class="mr-4">
              <div class="text-subtitle-2">Orders</div>
              <div class="text-h6">{{ detailsDialog.restaurant.totalOrders }}</div>
            </div>
            <div class="mr-4">
              <div class="text-subtitle-2">Revenue</div>
              <div class="text-h6">{{ formatPrice(detailsDialog.restaurant.totalRevenue) }}</div>
            </div>
            <div>
              <div class="text-subtitle-2">Customers</div>
              <div class="text-h6">{{ detailsDialog.restaurant.uniqueCustomers }}</div>
            </div>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="detailsDialog.show = false"
          >
            Close
          </v-btn>
          <v-btn
            color="primary"
            @click="editRestaurant(detailsDialog.restaurant)"
          >
            Edit
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Restaurant Dialog -->
    <v-dialog
      v-model="editDialog.show"
      max-width="800"
    >
      <v-card v-if="editDialog.restaurant">
        <v-card-title>
          {{ editDialog.isNew ? 'Add Restaurant' : 'Edit Restaurant' }}
          <v-spacer></v-spacer>
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="editDialog.show = false"
          ></v-btn>
        </v-card-title>
        
        <v-card-text>
          <v-form ref="restaurantForm">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editDialog.restaurant.name"
                  label="Restaurant Name"
                  variant="outlined"
                  :rules="[v => !!v || 'Name is required']"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="editDialog.restaurant.cuisine"
                  :items="cuisineTypes"
                  label="Cuisine Type"
                  variant="outlined"
                  :rules="[v => !!v || 'Cuisine type is required']"
                ></v-select>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editDialog.restaurant.phone"
                  label="Phone Number"
                  variant="outlined"
                  :rules="[v => !!v || 'Phone number is required']"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editDialog.restaurant.email"
                  label="Email"
                  variant="outlined"
                  :rules="[
                    v => !!v || 'Email is required',
                    v => /.+@.+\..+/.test(v) || 'Email must be valid'
                  ]"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12">
                <v-text-field
                  v-model="editDialog.restaurant.address"
                  label="Address"
                  variant="outlined"
                  :rules="[v => !!v || 'Address is required']"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editDialog.restaurant.city"
                  label="City"
                  variant="outlined"
                  :rules="[v => !!v || 'City is required']"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editDialog.restaurant.zipCode"
                  label="ZIP Code"
                  variant="outlined"
                  :rules="[v => !!v || 'ZIP code is required']"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12">
                <v-file-input
                  v-model="editDialog.restaurant.logoFile"
                  label="Restaurant Logo"
                  variant="outlined"
                  accept="image/*"
                  prepend-icon="mdi-camera"
                  show-size
                ></v-file-input>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="editDialog.show = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="saveRestaurant"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Reject/Suspend Dialog -->
    <v-dialog v-model="actionDialog.show" max-width="500">
      <v-card>
        <v-card-title>{{ actionDialog.title }}</v-card-title>
        <v-card-text>
          <v-textarea
            v-model="actionDialog.reason"
            :label="actionDialog.reasonLabel"
            :rules="[v => !!v || 'Reason is required']"
            variant="outlined"
            rows="3"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="actionDialog.show = false"
          >
            Cancel
          </v-btn>
          <v-btn
            :color="actionDialog.color"
            @click="confirmAction"
          >
            {{ actionDialog.confirmText }}
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
import { adminAPI } from '@/services/api.service'
import { useToast } from 'vue-toastification'

export default {
  name: 'AdminRestaurants',

  setup() {
    const store = useStore()
    const router = useRouter()
    const toast = useToast()

    // Table state
    const loading = ref(false)
    const itemsPerPage = ref(10)
    const totalRestaurants = ref(0)
    const restaurants = ref([])

    // Active tab
    const activeTab = ref('all')
    const tabs = ref([
      { title: 'All Restaurants', value: 'all' },
      { title: 'Pending Approval', value: 'pending', count: 0, color: 'warning' },
      { title: 'Active', value: 'active' },
      { title: 'Suspended', value: 'suspended' }
    ])

    // Filters
    const filters = ref({
      search: '',
      cuisine: 'all',
      status: 'all',
      sortBy: 'createdAt_desc'
    })

    // Restaurant data
    const restaurantsData = computed(() => store.state.admin.restaurants)
    restaurants.value = restaurantsData.value

    // Dialogs
    const verificationDialog = ref({
      show: false,
      restaurant: null,
      notes: ''
    })

    const detailsDialog = ref({
      show: false,
      restaurant: null
    })

    const editDialog = ref({
      show: false,
      isNew: false,
      restaurant: null
    })

    const confirmDialog = ref({
      show: false,
      title: '',
      message: '',
      action: null,
      restaurant: null,
      color: 'primary'
    })

    const actionDialog = ref({
      show: false,
      title: '',
      reason: '',
      reasonLabel: '',
      color: '',
      confirmText: '',
      action: null,
      restaurant: null
    })

    // Options
    const cuisineTypes = [
      { title: 'All Cuisines', value: 'all' },
      { title: 'Italian', value: 'Italian' },
      { title: 'Chinese', value: 'Chinese' },
      { title: 'Mexican', value: 'Mexican' },
      { title: 'Japanese', value: 'Japanese' },
      { title: 'American', value: 'American' },
      { title: 'Indian', value: 'Indian' },
      { title: 'Thai', value: 'Thai' },
      { title: 'Vietnamese', value: 'Vietnamese' }
    ]

    const statusOptions = [
      { title: 'All Statuses', value: 'all' },
      { title: 'Active', value: 'active' },
      { title: 'Pending', value: 'pending' },
      { title: 'Suspended', value: 'suspended' },
      { title: 'Rejected', value: 'rejected' }
    ]

    // Table headers
    const headers = [
      { title: '', key: 'logo', sortable: false, width: '60px' },
      { title: 'Name', key: 'name', sortable: true },
      { title: 'Owner', key: 'ownerName', sortable: true },
      { title: 'Cuisine', key: 'cuisine', sortable: true },
      { title: 'City', key: 'city', sortable: true },
      { title: 'Status', key: 'status', sortable: true },
      { title: 'Rating', key: 'rating', sortable: true },
      { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
    ]

    // Methods
    const loadRestaurants = async (options = {}) => {
      loading.value = true
      
      try {
        const params = {
          page: options.page || 1,
          limit: options.itemsPerPage || itemsPerPage.value,
          status: activeTab.value !== 'all' ? activeTab.value : undefined,
          cuisine: filters.value.cuisine !== 'all' ? filters.value.cuisine : undefined,
          search: filters.value.search || undefined,
          sort: filters.value.sortBy || 'createdAt_desc'
        }
        
        const response = await adminAPI.getRestaurants(params)
        restaurants.value = response.data.restaurants
        totalRestaurants.value = response.data.total
      } catch (error) {
        toast.error('Failed to load restaurants: ' + (error.response?.data?.message || error.message))
      } finally {
        loading.value = false
      }
    }

    const loadRestaurantCounts = async () => {
      try {
        const response = await adminAPI.getRestaurantCounts()
        const counts = response.data
        
        tabs.value.forEach(tab => {
          if (tab.value in counts) {
            tab.count = counts[tab.value]
          }
        })
      } catch (error) {
        console.error('Failed to load restaurant counts:', error)
      }
    }

    const applyFilters = () => {
      loadRestaurants()
    }

    const viewRestaurant = (restaurant) => {
      detailsDialog.value = {
        show: true,
        restaurant
      }
    }

    const editRestaurant = (restaurant) => {
      editDialog.value = {
        show: true,
        isNew: false,
        restaurant: { ...restaurant, logoFile: null }
      }
    }

    const createRestaurant = () => {
      editDialog.value = {
        show: true,
        isNew: true,
        restaurant: {
          name: '',
          cuisine: '',
          phone: '',
          email: '',
          address: '',
          city: '',
          zipCode: '',
          logoFile: null,
          status: 'active'
        }
      }
    }

    const saveRestaurant = async () => {
      try {
        const formData = new FormData()
        const restaurant = editDialog.value.restaurant
        
        // Add all text fields
        for (const key in restaurant) {
          if (key !== 'logoFile' && key !== 'logo' && restaurant[key] !== null) {
            formData.append(key, restaurant[key])
          }
        }
        
        // Add logo file if provided
        if (restaurant.logoFile) {
          formData.append('logo', restaurant.logoFile)
        }
        
        if (editDialog.value.isNew) {
          await adminAPI.createRestaurant(formData)
          toast.success('Restaurant created successfully')
        } else {
          await adminAPI.updateRestaurant(restaurant.id, formData)
          toast.success('Restaurant updated successfully')
        }
        
        editDialog.value.show = false
        loadRestaurants()
        loadRestaurantCounts()
      } catch (error) {
        toast.error('Failed to save restaurant: ' + (error.response?.data?.message || error.message))
      }
    }

    const approveRestaurant = (restaurant) => {
      verificationDialog.value = {
        show: true,
        restaurant,
        notes: ''
      }
    }

    const confirmApproveRestaurant = async (restaurant) => {
      try {
        await adminAPI.approveRestaurant(restaurant.id, { 
          adminNotes: verificationDialog.value.notes 
        })
        
        toast.success('Restaurant approved successfully')
        verificationDialog.value.show = false
        loadRestaurants()
        loadRestaurantCounts()
      } catch (error) {
        toast.error('Failed to approve restaurant: ' + (error.response?.data?.message || error.message))
      }
    }

    const rejectRestaurant = (restaurant) => {
      confirmDialog.value = {
        show: true,
        title: 'Reject Restaurant',
        message: `Are you sure you want to reject the application for ${restaurant.name}?`,
        action: () => confirmRejectRestaurant(restaurant),
        restaurant,
        color: 'error'
      }
    }

    const confirmRejectRestaurant = async (restaurant) => {
      try {
        await adminAPI.rejectRestaurant(restaurant.id, {
          adminNotes: verificationDialog.value.notes
        })
        
        toast.success('Restaurant application rejected')
        verificationDialog.value.show = false
        confirmDialog.value.show = false
        loadRestaurants()
        loadRestaurantCounts()
      } catch (error) {
        toast.error('Failed to reject restaurant: ' + (error.response?.data?.message || error.message))
      }
    }

    const suspendRestaurant = (restaurant) => {
      confirmDialog.value = {
        show: true,
        title: 'Suspend Restaurant',
        message: `Are you sure you want to suspend ${restaurant.name}? They will be temporarily unable to operate.`,
        action: () => confirmSuspendRestaurant(restaurant),
        restaurant,
        color: 'warning'
      }
    }

    const confirmSuspendRestaurant = async (restaurant) => {
      try {
        await adminAPI.updateRestaurant(restaurant.id, { status: 'suspended' })
        
        toast.success('Restaurant suspended successfully')
        confirmDialog.value.show = false
        loadRestaurants()
        loadRestaurantCounts()
      } catch (error) {
        toast.error('Failed to suspend restaurant: ' + (error.response?.data?.message || error.message))
      }
    }

    const activateRestaurant = (restaurant) => {
      confirmDialog.value = {
        show: true,
        title: 'Activate Restaurant',
        message: `Are you sure you want to reactivate ${restaurant.name}?`,
        action: () => confirmActivateRestaurant(restaurant),
        restaurant,
        color: 'success'
      }
    }

    const confirmActivateRestaurant = async (restaurant) => {
      try {
        await adminAPI.updateRestaurant(restaurant.id, { status: 'active' })
        
        toast.success('Restaurant activated successfully')
        confirmDialog.value.show = false
        loadRestaurants()
        loadRestaurantCounts()
      } catch (error) {
        toast.error('Failed to activate restaurant: ' + (error.response?.data?.message || error.message))
      }
    }

    const deleteRestaurant = (restaurant) => {
      confirmDialog.value = {
        show: true,
        title: 'Delete Restaurant',
        message: `Are you sure you want to permanently delete ${restaurant.name}? This action cannot be undone.`,
        action: () => confirmDeleteRestaurant(restaurant),
        restaurant,
        color: 'error'
      }
    }

    const confirmDeleteRestaurant = async (restaurant) => {
      try {
        await adminAPI.deleteRestaurant(restaurant.id)
        
        toast.success('Restaurant deleted successfully')
        confirmDialog.value.show = false
        if (detailsDialog.value.show) {
          detailsDialog.value.show = false
        }
        loadRestaurants()
        loadRestaurantCounts()
      } catch (error) {
        toast.error('Failed to delete restaurant: ' + (error.response?.data?.message || error.message))
      }
    }

    const getStatusColor = (status) => {
      switch (status) {
        case 'active': return 'success'
        case 'suspended': return 'error'
        case 'pending': return 'warning'
        case 'rejected': return 'grey'
        default: return 'grey'
      }
    }

    const formatStatus = (status) => {
      return status.charAt(0).toUpperCase() + status.slice(1)
    }

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date)
    }

    const getDocumentIcon = (type) => {
      switch (type) {
        case 'id': return 'mdi-card-account-details'
        case 'license': return 'mdi-license'
        case 'certificate': return 'mdi-certificate'
        case 'menu': return 'mdi-food'
        case 'photos': return 'mdi-image'
        default: return 'mdi-file-document'
      }
    }

    const viewDocument = (document) => {
      window.open(document.url, '_blank')
    }

    const formatBusinessHours = (hours) => {
      if (!hours.enabled) return 'Closed'
      return `${hours.open} - ${hours.close}`
    }

    const formatPrice = (price) => {
      return `$${Number(price).toFixed(2)}`
    }

    const confirmAction = async () => {
      if (!actionDialog.value.reason) return

      try {
        if (actionDialog.value.action === 'reject') {
          await adminAPI.rejectRestaurant(actionDialog.value.restaurant.id, {
            adminNotes: actionDialog.value.reason
          })
        } else if (actionDialog.value.action === 'suspend') {
          await adminAPI.updateRestaurant(actionDialog.value.restaurant.id, {
            status: 'suspended'
          })
        }
        actionDialog.value.show = false
      } catch (error) {
        console.error('Action failed:', error)
      }
    }

    // Initialize data
    onMounted(() => {
      loadRestaurants()
      loadRestaurantCounts()
    })

    return {
      loading,
      itemsPerPage,
      totalRestaurants,
      restaurants,
      activeTab,
      tabs,
      filters,
      cuisineTypes,
      statusOptions,
      headers,
      verificationDialog,
      detailsDialog,
      editDialog,
      confirmDialog,
      actionDialog,
      loadRestaurants,
      applyFilters,
      viewRestaurant,
      editRestaurant,
      createRestaurant,
      saveRestaurant,
      approveRestaurant,
      confirmApproveRestaurant,
      rejectRestaurant,
      suspendRestaurant,
      activateRestaurant,
      deleteRestaurant,
      getStatusColor,
      formatStatus,
      formatDate,
      getDocumentIcon,
      viewDocument,
      formatBusinessHours,
      formatPrice,
      confirmAction
    }
  }
}
</script>

<style scoped>
.time-range-select {
  max-width: 150px;
}
</style>
