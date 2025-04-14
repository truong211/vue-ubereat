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

            <!-- Operating Hours Section -->
            <v-col cols="12" v-if="detailsDialog.restaurant.operatingHours">
              <v-card variant="outlined" class="mt-3">
                <v-card-title class="text-subtitle-1">
                  <v-icon start>mdi-clock-outline</v-icon>
                  Operating Hours
                </v-card-title>
                <v-divider></v-divider>
                <v-card-text>
                  <v-list density="compact">
                    <v-list-item v-for="(day, index) in weekDays" :key="index" density="compact">
                      <template v-slot:prepend>
                        <v-icon :color="detailsDialog.restaurant.operatingHours[index]?.isOpen ? 'success' : 'grey'">
                          {{ detailsDialog.restaurant.operatingHours[index]?.isOpen ? 'mdi-clock' : 'mdi-clock-outline' }}
                        </v-icon>
                      </template>
                      <v-list-item-title>{{ day }}</v-list-item-title>
                      <v-list-item-subtitle>
                        <span v-if="detailsDialog.restaurant.operatingHours[index]?.isOpen">
                          {{ detailsDialog.restaurant.operatingHours[index].openTime }} - {{ detailsDialog.restaurant.operatingHours[index].closeTime }}
                        </span>
                        <span v-else class="text-grey">Closed</span>
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Delivery Information -->
            <v-col cols="12">
              <v-card variant="outlined">
                <v-card-title class="text-subtitle-1">
                  <v-icon start>mdi-truck-delivery</v-icon>
                  Delivery Information
                </v-card-title>
                <v-divider></v-divider>
                <v-card-text>
                  <v-row>
                    <v-col cols="12" md="6">
                      <p><strong>Minimum Order:</strong> {{ formatPrice(detailsDialog.restaurant.minimumOrderAmount || 0) }}</p>
                      <p v-if="!detailsDialog.restaurant.hasSpecificZones">
                        <strong>Delivery Radius:</strong> {{ detailsDialog.restaurant.deliveryRadius }} km
                      </p>
                    </v-col>
                    <v-col cols="12" md="6" v-if="detailsDialog.restaurant.hasSpecificZones && detailsDialog.restaurant.deliveryZones?.length > 0">
                      <p><strong>Delivery Zones:</strong></p>
                      <v-chip-group>
                        <v-chip v-for="zone in detailsDialog.restaurant.deliveryZones" :key="zone.id" size="small">
                          {{ zone.name }}
                        </v-chip>
                      </v-chip-group>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
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
                <v-divider class="mb-3"></v-divider>
                <div class="text-subtitle-1 mb-2">Operating Hours</div>
                <v-row v-for="(day, index) in weekDays" :key="day">
                  <v-col cols="12" md="3">
                    <v-checkbox
                      v-model="editDialog.restaurant.operatingHours[index].isOpen"
                      :label="day"
                      hide-details
                    ></v-checkbox>
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="editDialog.restaurant.operatingHours[index].openTime"
                      label="Opening Time"
                      type="time"
                      variant="outlined"
                      density="compact"
                      :disabled="!editDialog.restaurant.operatingHours[index].isOpen"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="editDialog.restaurant.operatingHours[index].closeTime"
                      label="Closing Time"
                      type="time"
                      variant="outlined"
                      density="compact"
                      :disabled="!editDialog.restaurant.operatingHours[index].isOpen"
                    ></v-text-field>
                  </v-col>
                </v-row>
              </v-col>

              <v-col cols="12">
                <v-divider class="mb-3"></v-divider>
                <div class="text-subtitle-1 mb-2">Delivery Zones</div>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="editDialog.restaurant.deliveryRadius"
                      label="Delivery Radius (km)"
                      type="number"
                      variant="outlined"
                      :rules="[v => v > 0 || 'Delivery radius must be greater than 0']"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="editDialog.restaurant.minimumOrderAmount"
                      label="Minimum Order Amount (VND)"
                      type="number"
                      variant="outlined"
                      :rules="[v => v >= 0 || 'Minimum order must be non-negative']"
                    ></v-text-field>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="12" class="mb-3">
                    <v-switch
                      v-model="editDialog.restaurant.hasSpecificZones"
                      label="Use specific delivery zones instead of radius"
                      hide-details
                    ></v-switch>
                  </v-col>
                </v-row>
                <v-row v-if="editDialog.restaurant.hasSpecificZones">
                  <v-col cols="12">
                    <v-btn
                      color="primary"
                      variant="text"
                      prepend-icon="mdi-plus"
                      @click="addDeliveryZone"
                      class="mb-2"
                    >
                      Add Delivery Zone
                    </v-btn>
                    <v-data-table
                      v-if="editDialog.restaurant.deliveryZones.length > 0"
                      :headers="deliveryZoneHeaders"
                      :items="editDialog.restaurant.deliveryZones"
                      density="compact"
                      class="elevation-1"
                    >
                      <template v-slot:item.actions="{ item }">
                        <v-btn
                          icon="mdi-delete"
                          variant="text"
                          size="small"
                          color="error"
                          @click="removeDeliveryZone(item.raw)"
                        ></v-btn>
                      </template>
                    </v-data-table>
                    <v-alert v-else type="info" class="mt-2" variant="tonal">
                      No delivery zones added yet. Click "Add Delivery Zone" to create one.
                    </v-alert>
                  </v-col>
                </v-row>
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
import { adminAPI, apiClient } from '@/services/api.service'

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
    const restaurantForm = ref(null)

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

    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    const deliveryZoneHeaders = [
      { title: 'Zone Name', key: 'name' },
      { title: 'Actions', key: 'actions', align: 'end' }
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

        // Try multiple potential endpoints sequentially
        const endpoints = [
          '/api/restaurants',
          '/api/admin/restaurants'
        ];

        let success = false;
        let response = null;
        let lastError = null;

        for (const endpoint of endpoints) {
          try {
            console.log(`Attempting to load restaurants from ${endpoint}`);
            response = await apiClient.get(endpoint, { params });
            console.log(`Success with ${endpoint}`);
            success = true;
            break;
          } catch (error) {
            console.error(`Failed with ${endpoint}:`, error);
            lastError = error;
          }
        }

        if (!success || !response) {
          let errorMsg = 'Failed to load restaurants - no valid API endpoint found';

          // Try to get a more specific error message
          if (lastError?.response?.data?.message) {
            errorMsg = lastError.response.data.message;
          } else if (lastError?.message) {
            errorMsg = lastError.message;
          }

          toast.error(`Error: ${errorMsg}`);
          console.error('All restaurant endpoints failed:', lastError);
          restaurants.value = [];
          totalRestaurants.value = 0;
          loading.value = false;
          return;
        }

        // Process the successful response
        const data = response.data;
        console.log('Restaurant data received:', data);

        // Handle different API response formats
        if (data.restaurants && Array.isArray(data.restaurants)) {
          restaurants.value = data.restaurants;
          totalRestaurants.value = data.total || data.restaurants.length;
        } else if (Array.isArray(data)) {
          restaurants.value = data;
          totalRestaurants.value = data.length;
        } else if (data.data && Array.isArray(data.data)) {
          restaurants.value = data.data;
          totalRestaurants.value = data.total || data.data.length;
        } else if (data.data && !Array.isArray(data.data)) {
          // Single restaurant object in data property
          restaurants.value = [data.data];
          totalRestaurants.value = 1;
        } else {
          console.warn('Unexpected response format:', data);
          restaurants.value = [];
          totalRestaurants.value = 0;
        }
      } catch (error) {
        console.error('Error loading restaurants:', error);
        toast.error('Failed to load restaurants');
        restaurants.value = [];
        totalRestaurants.value = 0;
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
          status: 'active',
          operatingHours: weekDays.map(() => ({ isOpen: false, openTime: '', closeTime: '' })),
          deliveryRadius: 5,
          minimumOrderAmount: 0,
          hasSpecificZones: false,
          deliveryZones: []
        }
      }
    }

    const saveRestaurant = async () => {
      try {
        const restaurant = editDialog.value.restaurant

        // Manual validation as a fallback
        if (!restaurant.name || !restaurant.cuisine || !restaurant.address) {
          toast.error('Name, cuisine, and address are required!');
          return;
        }

        // Try to validate the form if the reference exists
        console.log('Restaurant form reference:', restaurantForm.value);
        if (restaurantForm.value) {
          try {
            console.log('Attempting to validate form...');
            const validationResult = await restaurantForm.value.validate();
            console.log('Form validation result:', validationResult);

            if (!validationResult.valid) {
              toast.error('Please fill in all required fields');
              return;
            }
          } catch (validationError) {
            console.error('Form validation error:', validationError);
            // Continue with manual validation if form validation fails
          }
        } else {
          console.warn('Form reference is not available, using manual validation');
        }

        const formData = new FormData()

        // Ensure required fields are explicitly added first
        formData.append('name', restaurant.name);
        formData.append('cuisine', restaurant.cuisine);
        formData.append('address', restaurant.address);

        // Add other basic fields
        if (restaurant.email) formData.append('email', restaurant.email);
        if (restaurant.phone) formData.append('phone', restaurant.phone);
        if (restaurant.status) formData.append('status', restaurant.status);
        if (restaurant.deliveryRadius) formData.append('deliveryRadius', restaurant.deliveryRadius);
        if (restaurant.minimumOrderAmount) formData.append('minimumOrderAmount', restaurant.minimumOrderAmount);
        if (restaurant.hasSpecificZones !== undefined) formData.append('hasSpecificZones', restaurant.hasSpecificZones);

        // Add the rest of text fields
        for (const key in restaurant) {
          // Skip fields we've already handled or that should be handled specially
          if (['name', 'cuisine', 'address', 'email', 'phone', 'status',
               'deliveryRadius', 'minimumOrderAmount', 'hasSpecificZones',
               'logoFile', 'logo', 'operatingHours', 'deliveryZones'].includes(key)) {
            continue;
          }

          if (restaurant[key] !== null && restaurant[key] !== undefined) {
            formData.append(key, restaurant[key]);
          }
        }

        // Handle special objects that need to be JSON stringified
        if (restaurant.operatingHours) {
          // Skip openingHours as it's not supported in the database yet
          // formData.append('openingHours', JSON.stringify(restaurant.operatingHours));
          console.log('Skipping operatingHours as it may not be supported in the database yet');
        }

        if (restaurant.deliveryZones && restaurant.deliveryZones.length > 0) {
          formData.append('deliveryZones', JSON.stringify(restaurant.deliveryZones));
        }

        // Add logo file if provided
        if (restaurant.logoFile) {
          formData.append('logo', restaurant.logoFile);
        }

        // Show form data contents for debugging
        console.log('Form data contents:');
        let hasEntries = false;
        for (const pair of formData.entries()) {
          console.log(`${pair[0]}: ${pair[1]}`);
          hasEntries = true;
        }

        // Double-check that we have form data before proceeding
        if (!hasEntries) {
          console.error('Form data is empty!');
          toast.error('Form data is empty. Please fill in all required fields.');
          return;
        }

        // Try multiple potential endpoints sequentially
        const endpoints = [
          '/api/admin/restaurants',  // Try admin endpoint first
          '/api/restaurants'
        ];

        let success = false;
        let lastError = null;

        if (editDialog.value.isNew) {
          // Create a new restaurant
          for (const endpoint of endpoints) {
            try {
              console.log(`Attempting to create restaurant with ${endpoint}`);
              const response = await apiClient.post(endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
              });
              console.log(`Success with ${endpoint}:`, response.data);
              success = true;
              toast.success('Restaurant created successfully');

              // If we got a single restaurant back, add it to the list immediately
              if (response.data && response.data.data) {
                console.log('Adding new restaurant to list:', response.data.data);
                if (!Array.isArray(response.data.data)) {
                  // Single restaurant object
                  restaurants.value.unshift(response.data.data);
                  totalRestaurants.value += 1;
                }
              }

              break;
            } catch (error) {
              console.error(`Failed with ${endpoint}:`, error.response?.data || error.message);

              // Check for specific validation errors
              if (error.response?.status === 400) {
                console.log('Validation error:', error.response.data);

                // Check if we have a specific validation message
                let errorMessage = 'Validation failed';
                if (error.response?.data?.message) {
                  errorMessage = error.response.data.message;
                }

                // Show the validation error to the user
                toast.error(`Validation error: ${errorMessage}`);

                // Don't try other endpoints if we have validation errors
                lastError = error;
                break;
              }

              lastError = error;
            }
          }
        } else {
          // Update an existing restaurant
          for (const endpoint of endpoints) {
            try {
              const updateUrl = `${endpoint}/${restaurant.id}`;
              console.log(`Attempting to update restaurant with ${updateUrl}`);
              const response = await apiClient.put(updateUrl, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
              });
              console.log(`Success with ${updateUrl}:`, response.data);
              success = true;
              toast.success('Restaurant updated successfully');
              break;
            } catch (error) {
              console.error(`Failed with ${endpoint}/${restaurant.id}:`, error.response?.data || error.message);

              // Check for specific validation errors
              if (error.response?.status === 400) {
                console.log('Validation error:', error.response.data);

                // Check if we have a specific validation message
                let errorMessage = 'Validation failed';
                if (error.response?.data?.message) {
                  errorMessage = error.response.data.message;
                }

                // Show the validation error to the user
                toast.error(`Validation error: ${errorMessage}`);

                // Don't try other endpoints if we have validation errors
                lastError = error;
                break;
              }

              lastError = error;
            }
          }
        }

        if (!success) {
          let errorMsg = 'Operation failed - no valid API endpoint found';

          // Try to get a more specific error message
          if (lastError?.response?.data?.message) {
            errorMsg = lastError.response.data.message;
          } else if (lastError?.message) {
            errorMsg = lastError.message;
          }

          toast.error(`Error: ${errorMsg}`);
          console.error('All endpoints failed:', lastError);
          return;
        }

        editDialog.value.show = false;
        loadRestaurants();
      } catch (error) {
        console.error('Error in saveRestaurant:', error);
        toast.error(`Error: ${error.response?.data?.message || 'Failed to save restaurant'}`);
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
        // Try multiple potential endpoints sequentially
        const endpoints = [
          '/api/restaurants',
          '/api/restaurant-admin/restaurants',
          '/api/admin/restaurants'
        ];

        let success = false;
        let lastError = null;

        for (const endpoint of endpoints) {
          try {
            const updateUrl = `${endpoint}/${restaurant.id}`;
            console.log(`Attempting to approve restaurant with ${updateUrl}`);
            await apiClient.put(updateUrl, { status: 'active' });
            console.log(`Success with ${updateUrl}`);
            success = true;
            toast.success('Restaurant approved successfully');
            break;
          } catch (error) {
            // Try special approval endpoints if regular update fails
            try {
              const approvalUrl = `${endpoint}/${restaurant.id}/approve`;
              console.log(`Attempting to approve restaurant with ${approvalUrl}`);
              await apiClient.post(approvalUrl);
              console.log(`Success with ${approvalUrl}`);
              success = true;
              toast.success('Restaurant approved successfully');
              break;
            } catch (approvalError) {
              console.error(`Failed with ${endpoint}/${restaurant.id}/approve:`, approvalError);
            }

            console.error(`Failed with ${endpoint}/${restaurant.id}:`, error);
            lastError = error;
          }
        }

        if (!success) {
          const errorMsg = lastError?.response?.data?.message || 'Operation failed - no valid API endpoint found';
          toast.error(`Error: ${errorMsg}`);
          console.error('All endpoints failed:', lastError);
          return;
        }

        confirmDialog.value.show = false;
        loadRestaurants();
      } catch (error) {
        console.error('Error in approveRestaurant:', error);
        toast.error(`Error: ${error.response?.data?.message || 'Failed to approve restaurant'}`);
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
        // Try multiple potential endpoints sequentially
        const endpoints = [
          '/api/restaurants',
          '/api/restaurant-admin/restaurants',
          '/api/admin/restaurants'
        ];

        let success = false;
        let lastError = null;

        for (const endpoint of endpoints) {
          try {
            const updateUrl = `${endpoint}/${restaurant.id}`;
            console.log(`Attempting to reject restaurant with ${updateUrl}`);
            await apiClient.put(updateUrl, { status: 'rejected' });
            console.log(`Success with ${updateUrl}`);
            success = true;
            toast.success('Restaurant rejected successfully');
            break;
          } catch (error) {
            // Try special reject endpoints if regular update fails
            try {
              const rejectUrl = `${endpoint}/${restaurant.id}/reject`;
              console.log(`Attempting to reject restaurant with ${rejectUrl}`);
              await apiClient.post(rejectUrl);
              console.log(`Success with ${rejectUrl}`);
              success = true;
              toast.success('Restaurant rejected successfully');
              break;
            } catch (rejectError) {
              console.error(`Failed with ${endpoint}/${restaurant.id}/reject:`, rejectError);
            }

            console.error(`Failed with ${endpoint}/${restaurant.id}:`, error);
            lastError = error;
          }
        }

        if (!success) {
          const errorMsg = lastError?.response?.data?.message || 'Operation failed - no valid API endpoint found';
          toast.error(`Error: ${errorMsg}`);
          console.error('All endpoints failed:', lastError);
          return;
        }

        confirmDialog.value.show = false;
        loadRestaurants();
      } catch (error) {
        console.error('Error in rejectRestaurant:', error);
        toast.error(`Error: ${error.response?.data?.message || 'Failed to reject restaurant'}`);
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
        // Try multiple potential endpoints sequentially
        const endpoints = [
          '/api/restaurants',
          '/api/restaurant-admin/restaurants',
          '/api/admin/restaurants'
        ];

        let success = false;
        let lastError = null;

        for (const endpoint of endpoints) {
          try {
            const updateUrl = `${endpoint}/${restaurant.id}`;
            console.log(`Attempting to suspend restaurant with ${updateUrl}`);
            await apiClient.put(updateUrl, { status: 'suspended' });
            console.log(`Success with ${updateUrl}`);
            success = true;
            toast.success('Restaurant suspended successfully');
            break;
          } catch (error) {
            console.error(`Failed with ${endpoint}/${restaurant.id}:`, error);
            lastError = error;
          }
        }

        if (!success) {
          const errorMsg = lastError?.response?.data?.message || 'Operation failed - no valid API endpoint found';
          toast.error(`Error: ${errorMsg}`);
          console.error('All endpoints failed:', lastError);
          return;
        }

        confirmDialog.value.show = false;
        loadRestaurants();
      } catch (error) {
        console.error('Error in suspendRestaurant:', error);
        toast.error(`Error: ${error.response?.data?.message || 'Failed to suspend restaurant'}`);
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
        // Try multiple potential endpoints sequentially
        const endpoints = [
          '/api/restaurants',
          '/api/restaurant-admin/restaurants',
          '/api/admin/restaurants'
        ];

        let success = false;
        let lastError = null;

        for (const endpoint of endpoints) {
          try {
            const updateUrl = `${endpoint}/${restaurant.id}`;
            console.log(`Attempting to activate restaurant with ${updateUrl}`);
            await apiClient.put(updateUrl, { status: 'active' });
            console.log(`Success with ${updateUrl}`);
            success = true;
            toast.success('Restaurant activated successfully');
            break;
          } catch (error) {
            console.error(`Failed with ${endpoint}/${restaurant.id}:`, error);
            lastError = error;
          }
        }

        if (!success) {
          const errorMsg = lastError?.response?.data?.message || 'Operation failed - no valid API endpoint found';
          toast.error(`Error: ${errorMsg}`);
          console.error('All endpoints failed:', lastError);
          return;
        }

        confirmDialog.value.show = false;
        loadRestaurants();
      } catch (error) {
        console.error('Error in activateRestaurant:', error);
        toast.error(`Error: ${error.response?.data?.message || 'Failed to activate restaurant'}`);
      }
    }

    const addDeliveryZone = () => {
      editDialog.value.restaurant.deliveryZones.push({ name: '', raw: {} })
    }

    const removeDeliveryZone = (zone) => {
      const index = editDialog.value.restaurant.deliveryZones.findIndex(z => z.raw === zone)
      if (index !== -1) {
        editDialog.value.restaurant.deliveryZones.splice(index, 1)
      }
    }

    // Utility functions
    const getStatusColor = (status) => {
      if (!status) return 'grey';

      switch (status) {
        case 'active': return 'success'
        case 'suspended': return 'error'
        case 'pending': return 'warning'
        default: return 'grey'
      }
    }

    const formatStatus = (status) => {
      if (!status) return 'Unknown';
      return status.charAt(0).toUpperCase() + status.slice(1);
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
      weekDays,
      deliveryZoneHeaders,
      restaurantForm,
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
      addDeliveryZone,
      removeDeliveryZone,
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
