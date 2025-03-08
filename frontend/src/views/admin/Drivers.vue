<template>
  <div>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4">Driver Management</h1>
      <v-spacer></v-spacer>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="showDriverForm"
      >
        Add New Driver
      </v-btn>
    </div>

    <!-- Statistics Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="text-subtitle-1">Active Drivers</div>
            <div class="text-h4">{{ stats.activeDrivers }}</div>
            <div class="d-flex align-center">
              <v-icon
                :color="stats.activeDriversTrend >= 0 ? 'success' : 'error'"
                size="small"
              >
                {{ stats.activeDriversTrend >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
              </v-icon>
              <span class="text-caption ml-1">vs last week</span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="text-subtitle-1">Online Now</div>
            <div class="text-h4">{{ stats.onlineDrivers }}</div>
            <div class="text-caption text-primary">
              {{ stats.onlineDriversPercent }}% of active drivers
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="text-subtitle-1">Avg. Rating</div>
            <div class="d-flex align-center">
              <div class="text-h4 mr-2">{{ stats.avgRating.toFixed(1) }}</div>
              <v-rating
                :model-value="stats.avgRating"
                color="amber"
                density="compact"
                half-increments
                readonly
                size="small"
              ></v-rating>
            </div>
            <div class="text-caption">Based on {{ stats.totalRatings }} ratings</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="text-subtitle-1">Today's Deliveries</div>
            <div class="text-h4">{{ stats.todayDeliveries }}</div>
            <div class="text-caption">Avg. {{ stats.avgDeliveryTime }} min per delivery</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Map View -->
    <v-card class="mb-6">
      <v-toolbar density="comfortable">
        <v-toolbar-title>Live Driver Locations</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn-toggle v-model="mapMode" mandatory density="comfortable">
          <v-btn value="all">All</v-btn>
          <v-btn value="available">Available</v-btn>
          <v-btn value="delivering">Delivering</v-btn>
        </v-btn-toggle>
      </v-toolbar>
      <div style="height: 400px; position: relative;">
        <!-- Map Component will be implemented here -->
        <div class="text-center pa-4">Map Component Placeholder</div>
      </div>
    </v-card>

    <!-- Filters -->
    <v-card class="mb-6">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="search"
              label="Search drivers"
              prepend-inner-icon="mdi-magnify"
              density="comfortable"
              hide-details
              @input="filterDrivers"
            ></v-text-field>
          </v-col>

          <v-col cols="12" sm="3">
            <v-select
              v-model="statusFilter"
              :items="statusOptions"
              label="Status"
              density="comfortable"
              hide-details
              @update:model-value="filterDrivers"
            ></v-select>
          </v-col>

          <v-col cols="12" sm="3">
            <v-select
              v-model="sortBy"
              :items="sortOptions"
              label="Sort by"
              density="comfortable"
              hide-details
              @update:model-value="filterDrivers"
            ></v-select>
          </v-col>

          <v-col cols="12" sm="2">
            <v-btn
              color="primary"
              block
              prepend-icon="mdi-filter"
              @click="filterDrivers"
            >
              Filter
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Drivers Table -->
    <v-data-table
      :headers="headers"
      :items="filteredDrivers"
      :loading="loading"
      sort-by="name"
      class="elevation-1"
    >
      <!-- Avatar Column -->
      <template v-slot:item.avatar="{ item }">
        <v-avatar size="36">
          <v-img
            v-if="item.avatar"
            :src="item.avatar"
            :alt="item.name"
          ></v-img>
          <span v-else class="text-h6">
            {{ item.name.charAt(0) }}
          </span>
        </v-avatar>
      </template>
      
      <!-- Status Column -->
      <template v-slot:item.status="{ item }">
        <v-chip
          :color="getStatusColor(item.status)"
          size="small"
        >
          {{ item.status }}
        </v-chip>
      </template>
      
      <!-- Online Column -->
      <template v-slot:item.online="{ item }">
        <v-icon
          :color="item.online ? 'success' : 'grey'"
          size="small"
        >
          mdi-circle-small
        </v-icon>
        {{ item.online ? 'Online' : 'Offline' }}
      </template>
      
      <!-- Rating Column -->
      <template v-slot:item.rating="{ item }">
        <div class="d-flex align-center">
          <span class="mr-2">{{ item.rating.toFixed(1) }}</span>
          <v-rating
            :model-value="item.rating"
            color="amber"
            density="compact"
            half-increments
            readonly
            size="small"
          ></v-rating>
        </div>
      </template>
      
      <!-- Actions Column -->
      <template v-slot:item.actions="{ item }">
        <v-btn-group density="comfortable">
          <v-btn
            icon="mdi-eye"
            variant="text"
            @click="viewDriver(item)"
          ></v-btn>
          <v-btn
            icon="mdi-calendar-clock"
            variant="text"
            color="primary"
            @click="assignOrder(item)"
            :disabled="!item.online || item.currentOrder"
          ></v-btn>
          <v-btn
            v-if="item.status === 'active'"
            icon="mdi-block-helper"
            variant="text"
            color="warning"
            @click="suspendDriver(item)"
          ></v-btn>
          <v-btn
            v-if="item.status === 'suspended'"
            icon="mdi-account-reactivate"
            variant="text"
            color="success"
            @click="activateDriver(item)"
          ></v-btn>
          <v-btn
            icon="mdi-delete"
            variant="text"
            color="error"
            @click="deleteDriver(item)"
          ></v-btn>
        </v-btn-group>
      </template>
    </v-data-table>

    <!-- Driver Details Dialog -->
    <v-dialog
      v-model="detailsDialog.show"
      max-width="800"
    >
      <v-card v-if="detailsDialog.driver">
        <v-card-title class="d-flex align-center">
          Driver Details
          <v-spacer></v-spacer>
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="detailsDialog.show = false"
          ></v-btn>
        </v-card-title>
        
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <div class="d-flex align-center mb-4">
                <v-avatar size="64" color="primary" class="mr-4">
                  <v-img
                    v-if="detailsDialog.driver.avatar"
                    :src="detailsDialog.driver.avatar"
                    :alt="detailsDialog.driver.name"
                  ></v-img>
                  <span v-else class="text-h4 white--text">
                    {{ detailsDialog.driver.name.charAt(0) }}
                  </span>
                </v-avatar>
                <div>
                  <h3 class="text-h6 mb-1">{{ detailsDialog.driver.name }}</h3>
                  <div class="d-flex align-center">
                    <v-icon
                      :color="detailsDialog.driver.online ? 'success' : 'grey'"
                      size="small"
                      class="mr-1"
                    >
                      mdi-circle-small
                    </v-icon>
                    <span class="text-subtitle-2 text-medium-emphasis">
                      {{ detailsDialog.driver.online ? 'Online' : 'Offline' }}
                    </span>
                  </div>
                </div>
              </div>
              
              <v-list density="comfortable">
                <v-list-item prepend-icon="mdi-email">
                  <v-list-item-title>{{ detailsDialog.driver.email }}</v-list-item-title>
                </v-list-item>
                <v-list-item prepend-icon="mdi-phone">
                  <v-list-item-title>{{ detailsDialog.driver.phone }}</v-list-item-title>
                </v-list-item>
                <v-list-item prepend-icon="mdi-map-marker">
                  <v-list-item-title>{{ detailsDialog.driver.address }}</v-list-item-title>
                </v-list-item>
                <v-list-item prepend-icon="mdi-car">
                  <v-list-item-title>{{ detailsDialog.driver.vehicle.model }} ({{ detailsDialog.driver.vehicle.plateNumber }})</v-list-item-title>
                </v-list-item>
                <v-list-item prepend-icon="mdi-calendar">
                  <v-list-item-title>Joined {{ formatDate(detailsDialog.driver.createdAt) }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-col>
            
            <v-col cols="12" md="6">
              <div class="text-subtitle-1 font-weight-bold mb-2">Performance</div>
              
              <div class="d-flex mb-4">
                <div class="flex-grow-1">
                  <div class="text-h6">{{ detailsDialog.driver.deliveryCount }}</div>
                  <div class="text-caption">Total Deliveries</div>
                </div>
                <div class="flex-grow-1">
                  <div class="text-h6">{{ detailsDialog.driver.rating.toFixed(1) }}</div>
                  <div class="text-caption">Rating</div>
                </div>
                <div class="flex-grow-1">
                  <div class="text-h6">{{ detailsDialog.driver.avgDeliveryTime }} min</div>
                  <div class="text-caption">Avg. Delivery Time</div>
                </div>
              </div>
              
              <div class="text-subtitle-1 font-weight-bold mb-2">Current Order</div>
              
              <v-card v-if="detailsDialog.driver.currentOrder" variant="outlined" class="mb-4">
                <v-card-text class="pa-2">
                  <div class="d-flex align-center">
                    <v-avatar size="36" class="mr-2">
                      <v-img :src="detailsDialog.driver.currentOrder.restaurant.logo"></v-img>
                    </v-avatar>
                    <div>
                      <div class="text-subtitle-2">{{ detailsDialog.driver.currentOrder.restaurant.name }}</div>
                      <div class="text-caption">Order #{{ detailsDialog.driver.currentOrder.number }}</div>
                    </div>
                    <v-spacer></v-spacer>
                    <v-chip
                      :color="getOrderStatusColor(detailsDialog.driver.currentOrder.status)"
                      size="small"
                    >
                      {{ detailsDialog.driver.currentOrder.status }}
                    </v-chip>
                  </div>
                </v-card-text>
              </v-card>
              <div v-else class="text-subtitle-2 text-medium-emphasis">
                No active order
              </div>
              
              <div class="text-subtitle-1 font-weight-bold mb-2">Documents</div>
              
              <v-list density="comfortable">
                <v-list-item v-for="doc in detailsDialog.driver.documents" :key="doc.id">
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
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Order Assignment Dialog -->
    <v-dialog
      v-model="assignDialog.show"
      max-width="800"
    >
      <v-card v-if="assignDialog.driver">
        <v-card-title>
          Assign Order to {{ assignDialog.driver.name }}
          <v-spacer></v-spacer>
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="assignDialog.show = false"
          ></v-btn>
        </v-card-title>
        
        <v-card-text>
          <div class="text-subtitle-1 font-weight-bold mb-4">Pending Orders</div>
          
          <v-radio-group v-model="assignDialog.selectedOrder">
            <v-card
              v-for="order in pendingOrders"
              :key="order.id"
              variant="outlined"
              class="mb-2"
              :class="{ 'selected-order': assignDialog.selectedOrder === order.id }"
            >
              <v-card-text>
                <v-radio :value="order.id" hide-details>
                  <template v-slot:label>
                    <div class="d-flex align-center">
                      <v-avatar size="36" class="mr-2">
                        <v-img :src="order.restaurant.logo"></v-img>
                      </v-avatar>
                      <div>
                        <div class="text-subtitle-2">{{ order.restaurant.name }}</div>
                        <div class="text-caption">Order #{{ order.number }} (${{ order.total }})</div>
                      </div>
                      <v-spacer></v-spacer>
                      <div class="text-caption text-right">
                        <div>{{ formatTime(order.createdAt) }}</div>
                        <div>{{ order.restaurant.address }}</div>
                      </div>
                    </div>
                  </template>
                </v-radio>
              </v-card-text>
            </v-card>
          </v-radio-group>
          
          <div v-if="pendingOrders.length === 0" class="text-center my-6 text-medium-emphasis">
            No pending orders available for assignment
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="assignDialog.show = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :disabled="!assignDialog.selectedOrder || pendingOrders.length === 0"
            @click="confirmAssignOrder"
          >
            Assign Order
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Driver Form Dialog -->
    <v-dialog
      v-model="driverForm.show"
      max-width="800"
    >
      <v-card>
        <v-card-title>
          {{ driverForm.isEdit ? 'Edit Driver' : 'Add New Driver' }}
          <v-spacer></v-spacer>
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="driverForm.show = false"
          ></v-btn>
        </v-card-title>
        
        <v-card-text>
          <v-form ref="form">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="driverForm.driver.name"
                  label="Full Name"
                  variant="outlined"
                  :rules="[v => !!v || 'Name is required']"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="driverForm.driver.email"
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
                  v-model="driverForm.driver.phone"
                  label="Phone Number"
                  variant="outlined"
                  :rules="[v => !!v || 'Phone number is required']"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="driverForm.driver.address"
                  label="Address"
                  variant="outlined"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12">
                <div class="text-subtitle-1 font-weight-bold mb-2">Vehicle Information</div>
              </v-col>
              
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="driverForm.driver.vehicle.model"
                  label="Vehicle Model"
                  variant="outlined"
                  :rules="[v => !!v || 'Vehicle model is required']"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="driverForm.driver.vehicle.plateNumber"
                  label="License Plate"
                  variant="outlined"
                  :rules="[v => !!v || 'License plate is required']"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="4">
                <v-select
                  v-model="driverForm.driver.vehicle.type"
                  :items="vehicleTypes"
                  label="Vehicle Type"
                  variant="outlined"
                ></v-select>
              </v-col>
              
              <v-col cols="12">
                <div class="text-subtitle-1 font-weight-bold mb-2">Documents</div>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-file-input
                  v-model="driverForm.driver.driverLicense"
                  label="Driver's License"
                  variant="outlined"
                  accept="image/*, application/pdf"
                  show-size
                  prepend-icon="mdi-license"
                ></v-file-input>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-file-input
                  v-model="driverForm.driver.vehicleRegistration"
                  label="Vehicle Registration"
                  variant="outlined"
                  accept="image/*, application/pdf"
                  show-size
                  prepend-icon="mdi-car"
                ></v-file-input>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-file-input
                  v-model="driverForm.driver.insurance"
                  label="Insurance Document"
                  variant="outlined"
                  accept="image/*, application/pdf"
                  show-size
                  prepend-icon="mdi-file-document"
                ></v-file-input>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-file-input
                  v-model="driverForm.driver.photo"
                  label="Profile Photo"
                  variant="outlined"
                  accept="image/*"
                  show-size
                  prepend-icon="mdi-camera"
                ></v-file-input>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="driverForm.show = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="saveDriver"
          >
            {{ driverForm.isEdit ? 'Update' : 'Save' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Confirmation Dialog -->
    <v-dialog
      v-model="confirmDialog.show"
      max-width="500"
    >
      <v-card>
        <v-card-title>{{ confirmDialog.title }}</v-card-title>
        <v-card-text>{{ confirmDialog.message }}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="confirmDialog.show = false"
          >
            Cancel
          </v-btn>
          <v-btn
            :color="confirmDialog.color"
            @click="confirmAction"
          >
            Confirm
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { adminAPI } from '@/services/api.service'
import { useToast } from 'vue-toastification'

use([
  CanvasRenderer,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent
])

export default {
  name: 'AdminDrivers',

  components: {
    VChart
  },

  setup() {
    const store = useStore()
    const toast = useToast()

    // State
    const loading = ref(false)
    const itemsPerPage = ref(10)
    const totalDrivers = ref(0)
    const mapMode = ref('all')

    // Stats
    const stats = computed(() => store.state.admin.driverStats)

    // Table headers
    const headers = [
      { title: 'Name', key: 'name', sortable: true },
      { title: 'Status', key: 'status', sortable: true },
      { title: 'Rating', key: 'rating', sortable: true },
      { title: 'Service Area', key: 'area', sortable: true },
      { title: 'Total Deliveries', key: 'deliveries', sortable: true },
      { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
    ]

    // Filters
    const search = ref('')
    const statusFilter = ref('all')
    const sortBy = ref('rating')

    // Options
    const statusOptions = [
      { title: 'All Statuses', value: 'all' },
      { title: 'Online', value: 'online' },
      { title: 'Offline', value: 'offline' },
      { title: 'On Delivery', value: 'delivering' },
      { title: 'Suspended', value: 'suspended' }
    ]

    const sortOptions = [
      { title: 'Name', value: 'name' },
      { title: 'Rating (High to Low)', value: 'rating' },
      { title: 'Newest Drivers', value: 'newest' },
      { title: 'Most Deliveries', value: 'deliveries' }
    ]

    const vehicleTypes = [
      { title: 'Car', value: 'car' },
      { title: 'Motorcycle', value: 'motorcycle' },
      { title: 'Bicycle', value: 'bicycle' },
      { title: 'Scooter', value: 'scooter' },
      { title: 'Van', value: 'van' }
    ]

    // Dialogs
    const detailsDialog = ref({
      show: false,
      driver: null
    })

    const earningsDialog = ref({
      show: false,
      driver: null,
      period: 'week',
      summary: {
        total: 0,
        deliveries: 0,
        avgPerDelivery: 0,
        basePay: 0,
        tips: 0,
        bonuses: 0
      },
      breakdown: []
    })

    const actionDialog = ref({
      show: false,
      title: '',
      reason: '',
      reasonLabel: '',
      color: '',
      confirmText: '',
      action: null,
      driver: null
    })

    const assignDialog = ref({
      show: false,
      driver: null,
      selectedOrder: null
    })

    const driverForm = ref({
      show: false,
      isEdit: false,
      driver: {
        name: '',
        email: '',
        phone: '',
        address: '',
        vehicle: {
          model: '',
          plateNumber: '',
          type: 'car'
        },
        driverLicense: null,
        vehicleRegistration: null,
        insurance: null,
        photo: null
      }
    })

    const confirmDialog = ref({
      show: false,
      title: '',
      message: '',
      action: null,
      color: 'primary'
    })

    // Methods
    const loadDrivers = async (options) => {
      loading.value = true
      try {
        const response = await store.dispatch('admin/fetchDrivers', {
          page: options.page,
          itemsPerPage: options.itemsPerPage,
          sortBy: options.sortBy[0]?.key,
          sortDesc: options.sortBy[0]?.order === 'desc',
          ...filters.value
        })
        totalDrivers.value = response.total
      } catch (error) {
        console.error('Failed to load drivers:', error)
      } finally {
        loading.value = false
      }
    }

    const filterDrivers = () => {
      let filtered = [...drivers.value]
      
      // Apply search filter
      if (search.value) {
        const searchLower = search.value.toLowerCase()
        filtered = filtered.filter(driver => 
          driver.name.toLowerCase().includes(searchLower) ||
          driver.email.toLowerCase().includes(searchLower) ||
          driver.phone.includes(search.value)
        )
      }
      
      // Apply status filter
      if (statusFilter.value !== 'all') {
        filtered = filtered.filter(driver => driver.status === statusFilter.value)
      }
      
      // Apply sorting
      switch (sortBy.value) {
        case 'name':
          filtered.sort((a, b) => a.name.localeCompare(b.name))
          break
        case 'rating':
          filtered.sort((a, b) => b.rating - a.rating)
          break
        case 'newest':
          filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          break
        case 'deliveries':
          filtered.sort((a, b) => b.deliveryCount - a.deliveryCount)
          break
      }
      
      filteredDrivers.value = filtered
    }

    const showDriverForm = () => {
      driverForm.value = {
        show: true,
        isEdit: false,
        driver: {
          name: '',
          email: '',
          phone: '',
          address: '',
          vehicle: {
            model: '',
            plateNumber: '',
            type: 'car'
          },
          driverLicense: null,
          vehicleRegistration: null,
          insurance: null,
          photo: null
        }
      }
    }

    const editDriver = (driver) => {
      driverForm.value = {
        show: true,
        isEdit: true,
        driver: {
          id: driver.id,
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          address: driver.address,
          vehicle: { ...driver.vehicle },
          driverLicense: null,
          vehicleRegistration: null,
          insurance: null,
          photo: null
        }
      }
    }

    const saveDriver = async () => {
      try {
        const formData = new FormData()
        const driver = driverForm.value.driver
        
        // Add text fields
        formData.append('name', driver.name)
        formData.append('email', driver.email)
        formData.append('phone', driver.phone)
        formData.append('address', driver.address)
        formData.append('vehicleModel', driver.vehicle.model)
        formData.append('vehiclePlateNumber', driver.vehicle.plateNumber)
        formData.append('vehicleType', driver.vehicle.type)
        
        // Add files if provided
        if (driver.driverLicense) {
          formData.append('driverLicense', driver.driverLicense)
        }
        
        if (driver.vehicleRegistration) {
          formData.append('vehicleRegistration', driver.vehicleRegistration)
        }
        
        if (driver.insurance) {
          formData.append('insurance', driver.insurance)
        }
        
        if (driver.photo) {
          formData.append('photo', driver.photo)
        }
        
        if (driverForm.value.isEdit) {
          await adminAPI.updateDriver(driver.id, formData)
          toast.success('Driver updated successfully')
        } else {
          await adminAPI.createDriver(formData)
          toast.success('New driver added successfully')
        }
        
        driverForm.value.show = false
        loadDrivers()
      } catch (error) {
        toast.error('Failed to save driver: ' + (error.response?.data?.message || error.message))
      }
    }

    const viewDriver = (driver) => {
      detailsDialog.value = {
        show: true,
        driver
      }
    }

    const assignOrder = (driver) => {
      assignDialog.value = {
        show: true,
        driver,
        selectedOrder: null
      }
      
      loadPendingOrders()
    }

    const confirmAssignOrder = async () => {
      try {
        await adminAPI.assignOrder({
          orderId: assignDialog.value.selectedOrder,
          driverId: assignDialog.value.driver.id
        })
        
        toast.success('Order assigned successfully')
        assignDialog.value.show = false
        loadDrivers() // Refresh driver list with updated order info
      } catch (error) {
        toast.error('Failed to assign order: ' + (error.response?.data?.message || error.message))
      }
    }

    const suspendDriver = (driver) => {
      confirmDialog.value = {
        show: true,
        title: 'Suspend Driver',
        message: `Are you sure you want to suspend ${driver.name}? They will not be able to accept orders until reactivated.`,
        action: () => performSuspendDriver(driver.id),
        color: 'warning'
      }
    }

    const performSuspendDriver = async (driverId) => {
      try {
        await adminAPI.updateDriver(driverId, { status: 'suspended' })
        
        toast.success('Driver suspended successfully')
        confirmDialog.value.show = false
        loadDrivers()
      } catch (error) {
        toast.error('Failed to suspend driver: ' + (error.response?.data?.message || error.message))
      }
    }

    const activateDriver = (driver) => {
      confirmDialog.value = {
        show: true,
        title: 'Activate Driver',
        message: `Are you sure you want to reactivate ${driver.name}?`,
        action: () => performActivateDriver(driver.id),
        color: 'success'
      }
    }

    const performActivateDriver = async (driverId) => {
      try {
        await adminAPI.updateDriver(driverId, { status: 'active' })
        
        toast.success('Driver activated successfully')
        confirmDialog.value.show = false
        loadDrivers()
      } catch (error) {
        toast.error('Failed to activate driver: ' + (error.response?.data?.message || error.message))
      }
    }

    const deleteDriver = (driver) => {
      confirmDialog.value = {
        show: true,
        title: 'Delete Driver',
        message: `Are you sure you want to permanently delete ${driver.name}? This action cannot be undone.`,
        action: () => performDeleteDriver(driver.id),
        color: 'error'
      }
    }

    const performDeleteDriver = async (driverId) => {
      try {
        await adminAPI.deleteDriver(driverId)
        
        toast.success('Driver deleted successfully')
        confirmDialog.value.show = false
        loadDrivers()
      } catch (error) {
        toast.error('Failed to delete driver: ' + (error.response?.data?.message || error.message))
      }
    }

    const confirmAction = () => {
      if (confirmDialog.value.action) {
        confirmDialog.value.action()
      }
    }

    const getStatusColor = (status) => {
      switch (status) {
        case 'online': return 'success'
        case 'offline': return 'grey'
        case 'delivering': return 'info'
        case 'suspended': return 'error'
        default: return 'grey'
      }
    }

    const getOrderStatusColor = (status) => {
      switch (status) {
        case 'pickup': return 'primary'
        case 'delivery': return 'info'
        case 'completed': return 'success'
        default: return 'grey'
      }
    }

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date)
    }

    const formatTime = (dateString) => {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }).format(date)
    }

    const getDocumentIcon = (type) => {
      switch (type) {
        case 'license': return 'mdi-license'
        case 'registration': return 'mdi-car'
        case 'insurance': return 'mdi-shield-check'
        case 'id': return 'mdi-card-account-details'
        default: return 'mdi-file-document'
      }
    }

    const viewDocument = (document) => {
      window.open(document.url, '_blank')
    }

    // Lifecycle
    onMounted(async () => {
      await Promise.all([
        store.dispatch('admin/fetchDriverStats'),
        loadDrivers({
          page: 1,
          itemsPerPage: itemsPerPage.value,
          sortBy: []
        })
      ])
    })

    return {
      loading,
      itemsPerPage,
      totalDrivers,
      mapMode,
      stats,
      headers,
      search,
      statusFilter,
      sortBy,
      statusOptions,
      sortOptions,
      vehicleTypes,
      detailsDialog,
      earningsDialog,
      actionDialog,
      assignDialog,
      driverForm,
      confirmDialog,
      loadDrivers,
      filterDrivers,
      showDriverForm,
      editDriver,
      saveDriver,
      viewDriver,
      assignOrder,
      confirmAssignOrder,
      suspendDriver,
      activateDriver,
      deleteDriver,
      confirmAction,
      getStatusColor,
      getOrderStatusColor,
      formatDate,
      formatTime,
      getDocumentIcon,
      viewDocument
    }
  }
}
</script>

<style scoped>
.selected-order {
  border: 2px solid var(--v-primary-base) !important;
}
</style>
