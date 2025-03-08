<template>
  <div>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4">Promotions</h1>
      <v-spacer></v-spacer>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="showPromotionForm()"
      >
        Create Promotion
      </v-btn>
    </div>

    <!-- Stats Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="text-subtitle-1">Active Promotions</div>
            <div class="text-h4">{{ stats.activePromotions }}</div>
            <div class="text-caption text-success">
              {{ stats.activePromotionsPercent }}% redemption rate
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="text-subtitle-1">Total Redemptions</div>
            <div class="text-h4">{{ stats.totalRedemptions }}</div>
            <div class="text-caption">Past 30 days</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="text-subtitle-1">Discount Value</div>
            <div class="text-h4">{{ formatPrice(stats.totalDiscountValue) }}</div>
            <div class="text-caption">Past 30 days</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="text-subtitle-1">Avg. Order Value</div>
            <div class="text-h4">{{ formatPrice(stats.avgOrderValue) }}</div>
            <div class="d-flex align-center">
              <v-icon
                :color="stats.avgOrderValueTrend >= 0 ? 'success' : 'error'"
                size="small"
              >
                {{ stats.avgOrderValueTrend >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
              </v-icon>
              <span class="text-caption ml-1">vs. no promotion</span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Chart -->
    <v-card class="mb-6">
      <v-card-title>
        Promotion Performance
        <v-spacer></v-spacer>
        <v-select
          v-model="chartPeriod"
          :items="periodOptions"
          density="comfortable"
          hide-details
          class="period-select"
        ></v-select>
      </v-card-title>
      <v-card-text>
        <v-chart class="chart" :option="chartOption" autoresize />
      </v-card-text>
    </v-card>

    <!-- Promotions Table -->
    <v-card>
      <v-card-title>
        Active Promotions
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search"
          label="Search"
          append-inner-icon="mdi-magnify"
          density="comfortable"
          hide-details
          class="search-field"
        ></v-text-field>
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="promotions"
        :search="search"
        :loading="loading"
      >
        <!-- Status Column -->
        <template v-slot:item.status="{ item }">
          <v-chip
            :color="getStatusColor(item.status)"
            size="small"
          >
            {{ formatStatus(item.status) }}
          </v-chip>
        </template>

        <!-- Progress Column -->
        <template v-slot:item.progress="{ item }">
          <div class="progress-column">
            <div class="d-flex justify-space-between mb-1">
              <span class="text-caption">{{ item.redemptions }} used</span>
              <span class="text-caption">{{ item.maxRedemptions }} max</span>
            </div>
            <v-progress-linear
              :model-value="getProgressPercentage(item)"
              :color="getProgressColor(item.redemptions, item.maxRedemptions)"
              height="6"
            ></v-progress-linear>
          </div>
        </template>

        <!-- Dates Column -->
        <template v-slot:item.dates="{ item }">
          <div class="text-caption">
            {{ formatDate(item.startDate) }} - {{ formatDate(item.endDate) }}
          </div>
        </template>

        <!-- Actions Column -->
        <template v-slot:item.actions="{ item }">
          <v-btn-group density="comfortable">
            <v-btn
              icon="mdi-pencil"
              variant="text"
              @click="editPromotion(item)"
            ></v-btn>
            <v-btn
              v-if="item.status === 'active'"
              icon="mdi-pause"
              variant="text"
              color="warning"
              @click="pausePromotion(item)"
            ></v-btn>
            <v-btn
              v-if="item.status === 'paused'"
              icon="mdi-play"
              variant="text"
              color="success"
              @click="resumePromotion(item)"
            ></v-btn>
            <v-btn
              icon="mdi-chart-bar"
              variant="text"
              color="primary"
              @click="viewStats(item)"
            ></v-btn>
            <v-btn
              icon="mdi-delete"
              variant="text"
              color="error"
              @click="deletePromotion(item)"
            ></v-btn>
          </v-btn-group>
        </template>
      </v-data-table>
    </v-card>

    <!-- Promotion Form Dialog -->
    <v-dialog
      v-model="formDialog.show"
      max-width="800"
      persistent
    >
      <v-card>
        <v-card-title>
          {{ formDialog.isEdit ? 'Edit' : 'Create' }} Promotion
        </v-card-title>

        <v-card-text>
          <v-form ref="promotionForm" v-model="formDialog.valid">
            <v-row>
              <v-col cols="12" md="8">
                <v-text-field
                  v-model="formDialog.form.name"
                  label="Promotion Name"
                  :rules="[rules.required]"
                  variant="outlined"
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field
                  v-model="formDialog.form.code"
                  label="Promo Code"
                  :rules="[rules.required, rules.code]"
                  variant="outlined"
                  :disabled="formDialog.isEdit"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12">
                <v-textarea
                  v-model="formDialog.form.description"
                  label="Description"
                  variant="outlined"
                  rows="2"
                ></v-textarea>
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="formDialog.form.type"
                  :items="discountTypes"
                  label="Discount Type"
                  :rules="[rules.required]"
                  variant="outlined"
                ></v-select>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formDialog.form.value"
                  label="Discount Value"
                  :rules="[rules.required, rules.numeric]"
                  type="number"
                  variant="outlined"
                  :suffix="formDialog.form.type === 'percentage' ? '%' : '$'"
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formDialog.form.minOrderAmount"
                  label="Minimum Order Amount"
                  type="number"
                  variant="outlined"
                  prefix="$"
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formDialog.form.maxDiscount"
                  label="Maximum Discount"
                  type="number"
                  variant="outlined"
                  prefix="$"
                  :disabled="formDialog.form.type === 'fixed'"
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formDialog.form.maxRedemptions"
                  label="Max Redemptions"
                  type="number"
                  :rules="[rules.required, rules.numeric, rules.positive]"
                  variant="outlined"
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formDialog.form.maxPerUser"
                  label="Max Uses Per User"
                  type="number"
                  :rules="[rules.required, rules.numeric, rules.positive]"
                  variant="outlined"
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="6">
                <v-menu
                  v-model="startDateMenu"
                  :close-on-content-click="false"
                  transition="scale-transition"
                  offset-y
                  max-width="290px"
                  min-width="auto"
                >
                  <template v-slot:activator="{ props }">
                    <v-text-field
                      v-model="formDialog.form.startDate"
                      label="Start Date"
                      variant="outlined"
                      readonly
                      v-bind="props"
                      :rules="[rules.required]"
                    ></v-text-field>
                  </template>
                  <v-date-picker
                    v-model="formDialog.form.startDate"
                    @update:model-value="startDateMenu = false"
                  ></v-date-picker>
                </v-menu>
              </v-col>

              <v-col cols="12" md="6">
                <v-menu
                  v-model="endDateMenu"
                  :close-on-content-click="false"
                  transition="scale-transition"
                  offset-y
                  max-width="290px"
                  min-width="auto"
                >
                  <template v-slot:activator="{ props }">
                    <v-text-field
                      v-model="formDialog.form.endDate"
                      label="End Date"
                      variant="outlined"
                      readonly
                      v-bind="props"
                      :rules="[rules.required, rules.endDate]"
                    ></v-text-field>
                  </template>
                  <v-date-picker
                    v-model="formDialog.form.endDate"
                    @update:model-value="endDateMenu = false"
                  ></v-date-picker>
                </v-menu>
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="formDialog.form.applicableTo"
                  :items="applicableToOptions"
                  label="Applicable To"
                  variant="outlined"
                ></v-select>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="formDialog.form.userType"
                  :items="userTypeOptions"
                  label="User Type"
                  variant="outlined"
                ></v-select>
              </v-col>

              <v-col cols="12">
                <v-switch
                  v-model="formDialog.form.active"
                  color="success"
                  label="Active"
                  hide-details
                ></v-switch>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="formDialog.show = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :disabled="!formDialog.valid"
            @click="savePromotion"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Promotion Stats Dialog -->
    <v-dialog
      v-model="statsDialog.show"
      max-width="800"
      >
      <v-card v-if="statsDialog.promotion">
        <v-card-title>
          {{ statsDialog.promotion.name }} - Statistics
          <v-spacer></v-spacer>
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="statsDialog.show = false"
          ></v-btn>
        </v-card-title>

        <v-card-text>
          <v-row>
            <v-col cols="12" md="4">
              <v-card>
                <v-card-text class="text-center">
                  <div class="text-h3">{{ statsDialog.stats.redemptions }}</div>
                  <div class="text-subtitle-1">Total Redemptions</div>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" md="4">
              <v-card>
                <v-card-text class="text-center">
                  <div class="text-h3">{{ formatPrice(statsDialog.stats.totalDiscount) }}</div>
                  <div class="text-subtitle-1">Total Discount</div>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" md="4">
              <v-card>
                <v-card-text class="text-center">
                  <div class="text-h3">{{ formatPrice(statsDialog.stats.avgOrderAmount) }}</div>
                  <div class="text-subtitle-1">Avg. Order</div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <v-divider class="my-4"></v-divider>

          <div class="text-h6 mb-2">Redemption History</div>
          <v-chart class="stats-chart" :option="statsDialog.chartOption" autoresize />

          <v-divider class="my-4"></v-divider>

          <div class="text-h6 mb-2">Recent Orders</div>
          <v-data-table
            :headers="orderHeaders"
            :items="statsDialog.orders"
            :items-per-page="5"
          >
            <template v-slot:item.date="{ item }">
              {{ formatDate(item.date) }}
            </template>
            <template v-slot:item.amount="{ item }">
              {{ formatPrice(item.amount) }}
            </template>
            <template v-slot:item.discount="{ item }">
              {{ formatPrice(item.discount) }}
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-dialog>
    
    <!-- Confirmation Dialog -->
    <v-dialog v-model="confirmDialog.show" max-width="500">
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
import { adminAPI } from '@/services/api.service'
import { useToast } from 'vue-toastification'
import VChart from 'vue-echarts'
import * as echarts from 'echarts/core'
import { LineChart, BarChart } from 'echarts/charts'
import { TooltipComponent, GridComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// Register ECharts components
echarts.use([
  TooltipComponent,
  GridComponent,
  LegendComponent,
  LineChart,
  BarChart,
  CanvasRenderer
])

export default {
  name: 'AdminPromotions',
  components: {
    VChart
  },
  
  setup() {
    const toast = useToast()
    
    // Data loading state
    const loading = ref(false)
    
    // Promotions
    const promotions = ref([])
    const search = ref('')
    
    // Chart data
    const chartPeriod = ref('month')
    const periodOptions = [
      { title: 'Last 7 Days', value: 'week' },
      { title: 'Last 30 Days', value: 'month' },
      { title: 'Last 90 Days', value: 'quarter' },
      { title: 'Last 365 Days', value: 'year' }
    ]

    // Statistics
    const stats = ref({
      activePromotions: 0,
      activePromotionsPercent: 0,
      totalRedemptions: 0,
      totalDiscountValue: 0,
      avgOrderValue: 0,
      avgOrderValueTrend: 0
    })

    // Table headers
    const headers = [
      { title: 'Name', key: 'name', sortable: true },
      { title: 'Code', key: 'code', sortable: true },
      { title: 'Status', key: 'status', sortable: true },
      { title: 'Discount', key: 'displayValue', sortable: true },
      { title: 'Progress', key: 'progress', sortable: false },
      { title: 'Dates', key: 'dates', sortable: true },
      { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
    ]
    
    const orderHeaders = [
      { title: 'Order #', key: 'orderNumber', sortable: true },
      { title: 'Date', key: 'date', sortable: true },
      { title: 'Customer', key: 'customer', sortable: true },
      { title: 'Order Amount', key: 'amount', sortable: true },
      { title: 'Discount', key: 'discount', sortable: true }
    ]

    // Promotion form
    const startDateMenu = ref(false)
    const endDateMenu = ref(false)
    
    const defaultForm = {
      name: '',
      code: '',
      description: '',
      type: 'percentage',
      value: 10,
      minOrderAmount: 0,
      maxDiscount: null,
      maxRedemptions: 100,
      maxPerUser: 1,
      startDate: new Date().toISOString().substr(0, 10),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substr(0, 10),
      applicableTo: 'all',
      userType: 'all',
      active: true
    }
    
    const formDialog = ref({
      show: false,
      isEdit: false,
      valid: false,
      form: { ...defaultForm }
    })
    
    // Promotion stats dialog
    const statsDialog = ref({
      show: false,
      promotion: null,
      stats: {
        redemptions: 0,
        totalDiscount: 0,
        avgOrderAmount: 0
      },
      orders: [],
      chartOption: {}
    })
    
    // Validation rules
    const rules = {
      required: v => !!v || 'This field is required',
      numeric: v => !isNaN(v) || 'Must be a number',
      positive: v => Number(v) > 0 || 'Must be greater than 0',
      code: v => /^[A-Z0-9_-]{3,15}$/.test(v) || 'Code must be 3-15 uppercase letters, numbers, _ or -',
      endDate: v => {
        if (!v) return 'End date is required'
        const start = new Date(formDialog.value.form.startDate)
        const end = new Date(v)
        return end >= start || 'End date must be after start date'
      }
    }
    
    // Options for form selects
    const discountTypes = [
      { title: 'Percentage (%)', value: 'percentage' },
      { title: 'Fixed Amount ($)', value: 'fixed' }
    ]
    
    const applicableToOptions = [
      { title: 'All Restaurants', value: 'all' },
      { title: 'Selected Restaurants', value: 'selected' },
      { title: 'Selected Categories', value: 'categories' }
    ]
    
    const userTypeOptions = [
      { title: 'All Users', value: 'all' },
      { title: 'New Users', value: 'new' },
      { title: 'Existing Users', value: 'existing' }
    ]
    
    // Confirmation dialog
    const confirmDialog = ref({
      show: false,
      title: '',
      message: '',
      action: null,
      item: null,
      color: 'primary'
    })
    
    // Chart options
    const chartOption = computed(() => {
      const dates = []
      const redemptions = []
      const discounts = []
      
      // Generate dates for the chart based on the selected period
      const days = chartPeriod.value === 'week' ? 7 : 
                 chartPeriod.value === 'month' ? 30 :
                 chartPeriod.value === 'quarter' ? 90 : 365
      
      const now = new Date()
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
        
        // Mock data - replace with actual data in production
        redemptions.push(Math.floor(Math.random() * 10))
        discounts.push(Math.floor(Math.random() * 300 + 50))
      }
      
      return {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
            label: {
              backgroundColor: '#6a7985'
            }
          }
        },
        legend: {
          data: ['Redemptions', 'Discount Value ($)']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: [
          {
            type: 'category',
            boundaryGap: false,
            data: dates
          }
        ],
        yAxis: [
          {
            type: 'value',
            name: 'Redemptions',
            position: 'left'
          },
          {
            type: 'value',
            name: 'Discount ($)',
            position: 'right'
          }
        ],
        series: [
          {
            name: 'Redemptions',
            type: 'line',
            areaStyle: {},
            emphasis: {
              focus: 'series'
            },
            data: redemptions
          },
          {
            name: 'Discount Value ($)',
            type: 'line',
            yAxisIndex: 1,
            areaStyle: {},
            emphasis: {
              focus: 'series'
            },
            data: discounts
          }
        ]
      }
    })
    
    // Methods
    const loadPromotions = async () => {
      loading.value = true
      
      try {
        const response = await adminAPI.getPromotions()
        promotions.value = response.data.promotions.map(promo => ({
          ...promo,
          displayValue: promo.type === 'percentage' 
            ? `${promo.value}%` 
            : `$${promo.value.toFixed(2)}`
        }))
        
        // Load stats
        stats.value = response.data.stats || {
          activePromotions: promotions.value.filter(p => p.status === 'active').length,
          activePromotionsPercent: 45,
          totalRedemptions: 1250,
          totalDiscountValue: 5670,
          avgOrderValue: 75.50,
          avgOrderValueTrend: 12
        }
      } catch (error) {
        toast.error('Failed to load promotions: ' + (error.response?.data?.message || error.message))
      } finally {
        loading.value = false
      }
    }
    
    const showPromotionForm = (promotion = null) => {
      if (promotion) {
        // Edit existing promotion
        formDialog.value = {
          show: true,
          isEdit: true,
          valid: true,
          form: { ...promotion }
        }
      } else {
        // Create new promotion
        formDialog.value = {
          show: true,
          isEdit: false,
          valid: false,
          form: { ...defaultForm }
        }
      }
    }
    
    const editPromotion = (promotion) => {
      showPromotionForm(promotion)
    }
    
    const savePromotion = async () => {
      try {
        const formData = formDialog.value.form
        
        if (formDialog.value.isEdit) {
          await adminAPI.updatePromotion(formData.id, formData)
          toast.success('Promotion updated successfully')
        } else {
          await adminAPI.createPromotion(formData)
          toast.success('Promotion created successfully')
        }
        
        formDialog.value.show = false
        loadPromotions()
      } catch (error) {
        toast.error('Failed to save promotion: ' + (error.response?.data?.message || error.message))
      }
    }
    
    const pausePromotion = (promotion) => {
      confirmDialog.value = {
        show: true,
        title: 'Pause Promotion',
        message: `Are you sure you want to pause the "${promotion.name}" promotion? It will not be available for redemption until resumed.`,
        action: () => performStatusUpdate(promotion.id, 'paused'),
        color: 'warning'
      }
    }
    
    const resumePromotion = (promotion) => {
      confirmDialog.value = {
        show: true,
        title: 'Resume Promotion',
        message: `Are you sure you want to resume the "${promotion.name}" promotion? It will become available for redemption.`,
        action: () => performStatusUpdate(promotion.id, 'active'),
        color: 'success'
      }
    }
    
    const deletePromotion = (promotion) => {
      confirmDialog.value = {
        show: true,
        title: 'Delete Promotion',
        message: `Are you sure you want to permanently delete the "${promotion.name}" promotion? This action cannot be undone.`,
        action: () => performDeletePromotion(promotion.id),
        color: 'error'
      }
    }
    
    const performStatusUpdate = async (id, status) => {
      try {
        await adminAPI.updatePromotion(id, { status })
        
        toast.success(`Promotion ${status === 'active' ? 'activated' : 'paused'} successfully`)
        confirmDialog.value.show = false
        loadPromotions()
      } catch (error) {
        toast.error('Failed to update promotion: ' + (error.response?.data?.message || error.message))
      }
    }
    
    const performDeletePromotion = async (id) => {
      try {
        await adminAPI.deletePromotion(id)
        
        toast.success('Promotion deleted successfully')
        confirmDialog.value.show = false
        loadPromotions()
      } catch (error) {
        toast.error('Failed to delete promotion: ' + (error.response?.data?.message || error.message))
      }
    }
    
    const viewStats = async (promotion) => {
      try {
        // In a real app, you'd get this data from the API
        // const response = await adminAPI.getPromotionStats(promotion.id)
        
        // Mock data for now
        const mockStats = {
          redemptions: promotion.redemptions,
          totalDiscount: promotion.redemptions * (promotion.type === 'percentage' 
            ? promotion.value * 0.5 
            : promotion.value),
          avgOrderAmount: 75.50 + Math.random() * 20
        }
        
        // Generate mock chart data
        const dates = []
        const redemptions = []
        
        const now = new Date()
        for (let i = 29; i >= 0; i--) {
          const date = new Date(now)
          date.setDate(date.getDate() - i)
          dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
          
          // Mock data - exponential decay with some randomness
          const daysSinceStart = Math.max(0, 30 - i - Math.floor(Math.random() * 5))
          redemptions.push(Math.max(0, Math.floor(8 * Math.exp(-daysSinceStart / 15) + Math.random() * 2)))
        }
        
        // Mock order data
        const mockOrders = []
        for (let i = 0; i < 10; i++) {
          const date = new Date(now)
          date.setDate(date.getDate() - Math.floor(Math.random() * 30))
          
          const orderAmount = 50 + Math.random() * 100
          const discount = promotion.type === 'percentage'
            ? Math.min(orderAmount * promotion.value / 100, promotion.maxDiscount || Infinity)
            : Math.min(promotion.value, orderAmount)
          
          mockOrders.push({
            orderNumber: `ORD-${10000 + i}`,
            date: date.toISOString(),
            customer: `Customer ${i + 1}`,
            amount: orderAmount,
            discount: discount
          })
        }
        
        // Sort orders by date (newest first)
        mockOrders.sort((a, b) => new Date(b.date) - new Date(a.date))
        
        statsDialog.value = {
          show: true,
          promotion,
          stats: mockStats,
          orders: mockOrders,
          chartOption: {
            tooltip: {
              trigger: 'axis'
            },
            xAxis: {
              type: 'category',
              data: dates
            },
            yAxis: {
              type: 'value'
            },
            series: [{
              data: redemptions,
              type: 'bar',
              name: 'Redemptions'
            }]
          }
        }
      } catch (error) {
        toast.error('Failed to load promotion statistics: ' + error.message)
      }
    }
    
    const confirmAction = () => {
      if (confirmDialog.value.action) {
        confirmDialog.value.action()
      }
    }
    
    const getStatusColor = (status) => {
      switch (status) {
        case 'active': return 'success'
        case 'paused': return 'warning'
        case 'expired': return 'error'
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
    
    const formatPrice = (price) => {
      return `$${Number(price).toFixed(2)}`
    }
    
    const getProgressPercentage = (item) => {
      if (!item.maxRedemptions) return 0
      return Math.min(100, (item.redemptions / item.maxRedemptions) * 100)
    }
    
    const getProgressColor = (used, max) => {
      const percentage = (used / max) * 100
      if (percentage < 50) return 'success'
      if (percentage < 75) return 'info'
      if (percentage < 90) return 'warning'
      return 'error'
    }
    
    // Initialize data
    onMounted(() => {
      loadPromotions()
    })
    
    return {
      loading,
      promotions,
      search,
      chartPeriod,
      periodOptions,
      chartOption,
      stats,
      headers,
      orderHeaders,
      formDialog,
      statsDialog,
      confirmDialog,
      startDateMenu,
      endDateMenu,
      rules,
      discountTypes,
      applicableToOptions,
      userTypeOptions,
      loadPromotions,
      showPromotionForm,
      editPromotion,
      savePromotion,
      pausePromotion,
      resumePromotion,
      deletePromotion,
      viewStats,
      confirmAction,
      getStatusColor,
      formatStatus,
      formatDate,
      formatPrice,
      getProgressPercentage,
      getProgressColor
    }
  }
}
</script>

<style scoped>
.chart {
  height: 400px;
}
.stats-chart {
  height: 300px;
}
.search-field {
  max-width: 300px;
}
.period-select {
  max-width: 200px;
}
.progress-column {
  width: 150px;
}
</style>
