<template>
  <div class="restaurant-management">
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4">Restaurant Management</h1>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="createRestaurant"
      >
        Add Restaurant
      </v-btn>
    </div>

    <!-- Filters -->
    <v-card class="mb-6">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="filters.search"
              label="Search Restaurants"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
            ></v-text-field>
          </v-col>

          <v-col cols="12" md="3">
            <v-select
              v-model="filters.cuisine"
              :items="cuisineTypes"
              label="Cuisine Type"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
            ></v-select>
          </v-col>

          <v-col cols="12" md="3">
            <v-select
              v-model="filters.status"
              :items="statusOptions"
              label="Status"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
            ></v-select>
          </v-col>

          <v-col cols="12" md="2">
            <v-btn
              color="primary"
              block
              @click="applyFilters"
            >
              Apply Filters
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Restaurants Table -->
    <v-card>
      <v-data-table
        :headers="headers"
        :items="restaurants"
        :loading="loading"
        :items-per-page="itemsPerPage"
        :total-items="totalRestaurants"
        @update:options="loadRestaurants"
      >
        <!-- Logo Column -->
        <template v-slot:item.logo="{ item }">
          <v-avatar size="40">
            <v-img
              :src="item.logo || '/img/restaurant-placeholder.jpg'"
              :alt="item.name"
            ></v-img>
          </v-avatar>
        </template>

        <!-- Status Column -->
        <template v-slot:item.status="{ item }">
          <v-chip
            :color="getStatusColor(item.status)"
            size="small"
          >
            {{ formatStatus(item.status) }}
          </v-chip>
        </template>

        <!-- Rating Column -->
        <template v-slot:item.rating="{ item }">
          <div class="d-flex align-center">
            <v-rating
              :model-value="item.rating"
              color="amber"
              density="compact"
              half-increments
              readonly
              size="small"
            ></v-rating>
            <span class="text-caption ml-1">({{ item.reviewCount }})</span>
          </div>
        </template>

        <!-- Actions Column -->
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
          </v-btn-group>
        </template>
      </v-data-table>
    </v-card>

    <!-- Restaurant Details Dialog -->
    <v-dialog v-model="detailsDialog.show" max-width="800">
      <v-card v-if="detailsDialog.restaurant">
        <v-card-title>
          Restaurant Details
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="detailsDialog.show = false"></v-btn>
        </v-card-title>

        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <!-- Basic Info -->
              <div class="d-flex align-center mb-4">
                <v-avatar size="64" class="mr-4">
                  <v-img :src="detailsDialog.restaurant.logo || '/img/restaurant-placeholder.jpg'"></v-img>
                </v-avatar>
                <div>
                  <h3 class="text-h6">{{ detailsDialog.restaurant.name }}</h3>
                  <div class="text-subtitle-2">{{ detailsDialog.restaurant.cuisine }}</div>
                </div>
              </div>

              <!-- Contact Info -->
              <v-list>
                <v-list-item prepend-icon="mdi-account">
                  <v-list-item-title>Owner</v-list-item-title>
                  <v-list-item-subtitle>{{ detailsDialog.restaurant.ownerName }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item prepend-icon="mdi-email">
                  <v-list-item-title>Email</v-list-item-title>
                  <v-list-item-subtitle>{{ detailsDialog.restaurant.email }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item prepend-icon="mdi-phone">
                  <v-list-item-title>Phone</v-list-item-title>
                  <v-list-item-subtitle>{{ detailsDialog.restaurant.phone }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item prepend-icon="mdi-map-marker">
                  <v-list-item-title>Address</v-list-item-title>
                  <v-list-item-subtitle>{{ detailsDialog.restaurant.address }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>

            <v-col cols="12" md="6">
              <!-- Stats -->
              <v-list>
                <v-list-item>
                  <v-list-item-title>Orders</v-list-item-title>
                  <v-list-item-subtitle>{{ detailsDialog.restaurant.totalOrders }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <v-list-item-title>Revenue</v-list-item-title>
                  <v-list-item-subtitle>{{ formatPrice(detailsDialog.restaurant.totalRevenue) }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <v-list-item-title>Rating</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-rating
                      :model-value="detailsDialog.restaurant.rating"
                      color="amber"
                      density="compact"
                      half-increments
                      readonly
                      size="small"
                    ></v-rating>
                    ({{ detailsDialog.restaurant.reviewCount }} reviews)
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="detailsDialog.show = false">Close</v-btn>
          <v-btn color="primary" @click="editRestaurant(detailsDialog.restaurant)">Edit</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Restaurant Dialog -->
    <v-dialog v-model="editDialog.show" max-width="800">
      <v-card>
        <v-card-title>
          {{ editDialog.isNew ? 'Add Restaurant' : 'Edit Restaurant' }}
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="editDialog.show = false"></v-btn>
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
                  v-model="editDialog.restaurant.email"
                  label="Email"
                  variant="outlined"
                  :rules="[
                    v => !!v || 'Email is required',
                    v => /.+@.+\..+/.test(v) || 'Email must be valid'
                  ]"
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editDialog.restaurant.phone"
                  label="Phone"
                  variant="outlined"
                  :rules="[v => !!v || 'Phone is required']"
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

              <v-col cols="12">
                <v-file-input
                  v-model="editDialog.restaurant.logoFile"
                  label="Restaurant Logo"
                  accept="image/*"
                  variant="outlined"
                  :rules="[editDialog.isNew ? v => !!v || 'Logo is required' : undefined]"
                ></v-file-input>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="editDialog.show = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveRestaurant">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Confirm Dialog -->
    <v-dialog v-model="confirmDialog.show" max-width="400">
      <v-card>
        <v-card-title>{{ confirmDialog.title }}</v-card-title>
        <v-card-text>{{ confirmDialog.message }}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="confirmDialog.show = false">Cancel</v-btn>
          <v-btn :color="confirmDialog.color" @click="confirmDialog.action">Confirm</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useToast } from 'vue-toastification'
import { adminAPI } from '@/services/api.service'

export default {
  name: 'AdminRestaurants',

  setup() {
    const store = useStore()
    const toast = useToast()

    // State
    const loading = ref(false)
    const itemsPerPage = ref(10)
    const totalRestaurants = ref(0)
    const restaurants = ref([])

    // Filters
    const filters = ref({
      search: '',
      cuisine: 'all',
      status: 'all',
      sortBy: 'createdAt_desc'
    })

    // Dialog states
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

    // Options
    const cuisineTypes = [
      { title: 'All Cuisines', value: 'all' },
      { title: 'Italian', value: 'Italian' },
      { title: 'Chinese', value: 'Chinese' },
      { title: 'Mexican', value: 'Mexican' },
      { title: 'Japanese', value: 'Japanese' },
      { title: 'Thai', value: 'Thai' },
      { title: 'Vietnamese', value: 'Vietnamese' }
    ]

    const statusOptions = [
      { title: 'All', value: 'all' },
      { title: 'Active', value: 'active' },
      { title: 'Pending', value: 'pending' },
      { title: 'Suspended', value: 'suspended' }
    ]

    // Methods
    const loadRestaurants = async (options = {}) => {
      loading.value = true
      try {
        const params = {
          page: options.page || 1,
          limit: options.itemsPerPage || itemsPerPage.value,
          status: filters.value.status !== 'all' ? filters.value.status : undefined,
          cuisine: filters.value.cuisine !== 'all' ? filters.value.cuisine : undefined,
          search: filters.value.search || undefined,
          sort: filters.value.sortBy || 'createdAt_desc'
        }
        
        const response = await adminAPI.getRestaurants(params)
        restaurants.value = response.data.restaurants
        totalRestaurants.value = response.data.total
      } catch (error) {
        toast.error('Failed to load restaurants')
      } finally {
        loading.value = false
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
          email: '',
          phone: '',
          address: '',
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
      } catch (error) {
        toast.error('Failed to save restaurant')
      }
    }

    const approveRestaurant = (restaurant) => {
      confirmDialog.value = {
        show: true,
        title: 'Approve Restaurant',
        message: `Are you sure you want to approve ${restaurant.name}?`,
        action: () => confirmApproveRestaurant(restaurant),
        restaurant,
        color: 'success'
      }
    }

    const confirmApproveRestaurant = async (restaurant) => {
      try {
        await adminAPI.approveRestaurant(restaurant.id)
        toast.success('Restaurant approved successfully')
        confirmDialog.value.show = false
        loadRestaurants()
      } catch (error) {
        toast.error('Failed to approve restaurant')
      }
    }

    const rejectRestaurant = (restaurant) => {
      confirmDialog.value = {
        show: true,
        title: 'Reject Restaurant',
        message: `Are you sure you want to reject ${restaurant.name}?`,
        action: () => confirmRejectRestaurant(restaurant),
        restaurant,
        color: 'error'
      }
    }

    const confirmRejectRestaurant = async (restaurant) => {
      try {
        await adminAPI.rejectRestaurant(restaurant.id)
        toast.success('Restaurant rejected successfully')
        confirmDialog.value.show = false
        loadRestaurants()
      } catch (error) {
        toast.error('Failed to reject restaurant')
      }
    }

    const suspendRestaurant = (restaurant) => {
      confirmDialog.value = {
        show: true,
        title: 'Suspend Restaurant',
        message: `Are you sure you want to suspend ${restaurant.name}?`,
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
      } catch (error) {
        toast.error('Failed to suspend restaurant')
      }
    }

    const activateRestaurant = (restaurant) => {
      confirmDialog.value = {
        show: true,
        title: 'Activate Restaurant',
        message: `Are you sure you want to activate ${restaurant.name}?`,
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
      } catch (error) {
        toast.error('Failed to activate restaurant')
      }
    }

    // Utility functions
    const getStatusColor = (status) => {
      switch (status) {
        case 'active': return 'success'
        case 'suspended': return 'error'
        case 'pending': return 'warning'
        default: return 'grey'
      }
    }

    const formatStatus = (status) => {
      return status.charAt(0).toUpperCase() + status.slice(1)
    }

    const formatPrice = (price) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(price)
    }

    // Headers for data table
    const headers = [
      { title: '', key: 'logo', sortable: false, width: '60px' },
      { title: 'Name', key: 'name', sortable: true },
      { title: 'Cuisine', key: 'cuisine', sortable: true },
      { title: 'Status', key: 'status', sortable: true },
      { title: 'Rating', key: 'rating', sortable: true },
      { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
    ]

    // Initialize
    onMounted(() => {
      loadRestaurants()
    })

    return {
      loading,
      restaurants,
      itemsPerPage,
      totalRestaurants,
      filters,
      cuisineTypes,
      statusOptions,
      headers,
      detailsDialog,
      editDialog,
      confirmDialog,
      loadRestaurants,
      applyFilters,
      viewRestaurant,
      editRestaurant,
      createRestaurant,
      saveRestaurant,
      approveRestaurant,
      rejectRestaurant,
      suspendRestaurant,
      activateRestaurant,
      getStatusColor,
      formatStatus,
      formatPrice
    }
  }
}
</script>

<style scoped>
.restaurant-management {
  padding: 16px;
}
</style>
