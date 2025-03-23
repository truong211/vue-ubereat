<template>
  <v-container>
    <v-row>
      <v-col>
        <h1 class="text-h4 mb-4">Promotion Campaigns</h1>

        <!-- Categories Section -->
        <v-expansion-panels class="mb-6">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <div class="d-flex align-center">
                <v-icon start>mdi-tag-multiple</v-icon>
                Promotion Categories
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row>
                <v-col cols="12" md="4" v-for="category in categories" :key="category.id">
                  <v-card>
                    <v-card-title class="d-flex justify-space-between">
                      {{ category.name }}
                      <v-chip
                        :color="category.active ? 'success' : 'error'"
                        size="small"
                      >
                        {{ category.active ? 'Active' : 'Inactive' }}
                      </v-chip>
                    </v-card-title>
                    <v-card-text>
                      <p>{{ category.description }}</p>
                      <p class="text-caption">
                        {{ category.campaigns?.length || 0 }} campaigns
                      </p>
                    </v-card-text>
                    <v-card-actions>
                      <v-spacer></v-spacer>
                      <v-btn
                        variant="text"
                        color="primary"
                        @click="editCategory(category)"
                      >
                        Edit
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-col>
                <v-col cols="12" md="4">
                  <v-card
                    variant="outlined"
                    class="d-flex align-center justify-center"
                    style="min-height: 150px"
                    @click="showCategoryForm()"
                  >
                    <div class="text-center">
                      <v-icon size="large" color="primary">mdi-plus</v-icon>
                      <div class="text-body-1 mt-2">Add Category</div>
                    </div>
                  </v-card>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- Campaigns Section -->
        <div class="d-flex justify-space-between align-center mb-4">
          <div>
            <v-btn-group>
              <v-btn
                v-for="filter in statusFilters"
                :key="filter.value"
                :color="campaignFilter === filter.value ? 'primary' : undefined"
                variant="outlined"
                @click="campaignFilter = filter.value"
              >
                {{ filter.label }}
              </v-btn>
            </v-btn-group>
          </div>
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            @click="showCampaignForm()"
          >
            Create Campaign
          </v-btn>
        </div>

        <v-row>
          <v-col cols="12" md="4" v-for="campaign in filteredCampaigns" :key="campaign.id">
            <v-card>
              <v-card-title>
                {{ campaign.name }}
                <v-chip
                  :color="getCampaignStatusColor(campaign.status)"
                  size="small"
                  class="ml-2"
                >
                  {{ formatCampaignStatus(campaign.status) }}
                </v-chip>
              </v-card-title>
              
              <v-card-text>
                <p class="text-body-2">{{ campaign.description }}</p>
                
                <v-list density="compact">
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="primary">mdi-calendar</v-icon>
                    </template>
                    <v-list-item-title>
                      {{ formatDate(campaign.startDate) }} - {{ formatDate(campaign.endDate) }}
                    </v-list-item-title>
                  </v-list-item>
                  
                  <v-list-item v-if="campaign.budget">
                    <template v-slot:prepend>
                      <v-icon color="success">mdi-currency-usd</v-icon>
                    </template>
                    <v-list-item-title>
                      Budget: {{ formatCurrency(campaign.budget) }}
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      Spent: {{ formatCurrency(campaign.spentAmount) }}
                    </v-list-item-subtitle>
                  </v-list-item>
                  
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="info">mdi-tag-multiple</v-icon>
                    </template>
                    <v-list-item-title>
                      {{ campaign.promotions?.length || 0 }} Promotions
                    </v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-card-text>

              <v-divider></v-divider>

              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                  variant="text"
                  color="primary"
                  @click="viewCampaignStats(campaign)"
                >
                  Stats
                </v-btn>
                <v-btn
                  variant="text"
                  :color="campaign.status === 'active' ? 'warning' : 'success'"
                  @click="toggleCampaignStatus(campaign)"
                >
                  {{ campaign.status === 'active' ? 'Pause' : 'Activate' }}
                </v-btn>
                <v-btn
                  variant="text"
                  @click="editCampaign(campaign)"
                >
                  Edit
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- Category Form Dialog -->
    <v-dialog v-model="categoryDialog.show" max-width="500">
      <v-card>
        <v-card-title>
          {{ categoryDialog.isEdit ? 'Edit' : 'New' }} Category
        </v-card-title>
        <v-card-text>
          <v-form ref="categoryForm" v-model="categoryDialog.valid">
            <v-text-field
              v-model="categoryDialog.form.name"
              label="Category Name"
              :rules="[rules.required]"
              variant="outlined"
            ></v-text-field>
            <v-textarea
              v-model="categoryDialog.form.description"
              label="Description"
              variant="outlined"
              rows="3"
            ></v-textarea>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="categoryDialog.show = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :loading="categoryDialog.loading"
            :disabled="!categoryDialog.valid"
            @click="saveCategory"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Campaign Form Dialog -->
    <v-dialog v-model="campaignDialog.show" max-width="700">
      <v-card>
        <v-card-title>
          {{ campaignDialog.isEdit ? 'Edit' : 'New' }} Campaign
        </v-card-title>
        <v-card-text>
          <v-form ref="campaignForm" v-model="campaignDialog.valid">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="campaignDialog.form.name"
                  label="Campaign Name"
                  :rules="[rules.required]"
                  variant="outlined"
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="campaignDialog.form.description"
                  label="Description"
                  variant="outlined"
                  rows="3"
                ></v-textarea>
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="campaignDialog.form.categoryId"
                  :items="categories"
                  label="Category"
                  item-title="name"
                  item-value="id"
                  variant="outlined"
                ></v-select>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="campaignDialog.form.budget"
                  label="Budget"
                  type="number"
                  prefix="$"
                  variant="outlined"
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="6">
                <v-menu
                  v-model="startDateMenu"
                  :close-on-content-click="false"
                >
                  <template v-slot:activator="{ props }">
                    <v-text-field
                      v-model="campaignDialog.form.startDate"
                      label="Start Date"
                      readonly
                      v-bind="props"
                      variant="outlined"
                      :rules="[rules.required]"
                    ></v-text-field>
                  </template>
                  <v-date-picker
                    v-model="campaignDialog.form.startDate"
                    @update:model-value="startDateMenu = false"
                  ></v-date-picker>
                </v-menu>
              </v-col>

              <v-col cols="12" md="6">
                <v-menu
                  v-model="endDateMenu"
                  :close-on-content-click="false"
                >
                  <template v-slot:activator="{ props }">
                    <v-text-field
                      v-model="campaignDialog.form.endDate"
                      label="End Date"
                      readonly
                      v-bind="props"
                      variant="outlined"
                      :rules="[rules.required, rules.endDate]"
                    ></v-text-field>
                  </template>
                  <v-date-picker
                    v-model="campaignDialog.form.endDate"
                    @update:model-value="endDateMenu = false"
                  ></v-date-picker>
                </v-menu>
              </v-col>

              <v-col cols="12">
                <v-expansion-panels>
                  <v-expansion-panel title="Target Audience">
                    <v-expansion-panel-text>
                      <v-row>
                        <v-col cols="12" md="6">
                          <v-select
                            v-model="campaignDialog.form.targetAudience.userType"
                            :items="userTypeOptions"
                            label="User Type"
                            variant="outlined"
                          ></v-select>
                        </v-col>
                        <v-col cols="12" md="6">
                          <v-select
                            v-model="campaignDialog.form.targetAudience.orderFrequency"
                            :items="orderFrequencyOptions"
                            label="Order Frequency"
                            variant="outlined"
                          ></v-select>
                        </v-col>
                      </v-row>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="campaignDialog.show = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :loading="campaignDialog.loading"
            :disabled="!campaignDialog.valid"
            @click="saveCampaign"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Campaign Stats Dialog -->
    <v-dialog v-model="statsDialog.show" max-width="900">
      <v-card v-if="statsDialog.campaign">
        <v-card-title class="d-flex justify-space-between align-center">
          {{ statsDialog.campaign.name }} - Statistics
          <v-btn icon="mdi-close" variant="text" @click="statsDialog.show = false"></v-btn>
        </v-card-title>

        <v-card-text>
          <!-- Summary Stats -->
          <v-row>
            <v-col cols="12" md="3">
              <v-card>
                <v-card-text class="text-center">
                  <div class="text-h4">{{ statsDialog.stats.totalRedemptions }}</div>
                  <div class="text-body-2">Total Redemptions</div>
                </v-card-text>
              </v-card>
            </v-col>
            
            <v-col cols="12" md="3">
              <v-card>
                <v-card-text class="text-center">
                  <div class="text-h4">{{ formatCurrency(statsDialog.stats.totalDiscountAmount) }}</div>
                  <div class="text-body-2">Total Discount</div>
                </v-card-text>
              </v-card>
            </v-col>
            
            <v-col cols="12" md="3">
              <v-card>
                <v-card-text class="text-center">
                  <div class="text-h4">{{ formatCurrency(statsDialog.stats.totalOrderValue) }}</div>
                  <div class="text-body-2">Total Order Value</div>
                </v-card-text>
              </v-card>
            </v-col>
            
            <v-col cols="12" md="3">
              <v-card>
                <v-card-text class="text-center">
                  <div class="text-h4">{{ formatPercentage(statsDialog.stats.budgetUtilization) }}</div>
                  <div class="text-body-2">Budget Utilized</div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Performance Chart -->
          <v-card class="mt-4">
            <v-card-title class="d-flex justify-space-between align-center">
              Daily Performance
              <v-select
                v-model="statsDialog.timeRange"
                :items="timeRangeOptions"
                density="compact"
                hide-details
                class="w-25"
              ></v-select>
            </v-card-title>
            <v-card-text>
              <v-chart class="chart" :option="statsDialog.chartOption" autoresize />
            </v-card-text>
          </v-card>

          <!-- Promotions Performance -->
          <v-card class="mt-4">
            <v-card-title>Promotions Performance</v-card-title>
            <v-card-text>
              <v-table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th class="text-right">Redemptions</th>
                    <th class="text-right">Total Discount</th>
                    <th class="text-right">Avg Order Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="promo in statsDialog.campaign.promotions" :key="promo.id">
                    <td>{{ promo.code }}</td>
                    <td class="text-right">{{ promo.currentRedemptions }}</td>
                    <td class="text-right">{{ formatCurrency(promo.totalDiscountAmount) }}</td>
                    <td class="text-right">{{ formatCurrency(promo.totalOrderValue / promo.currentRedemptions) }}</td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { format } from 'date-fns'
import VChart from 'vue-echarts'
import * as echarts from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { TooltipComponent, GridComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useToast } from 'vue-toastification'
import adminAPI from '@/services/admin.api'

echarts.use([
  TooltipComponent,
  GridComponent,
  LegendComponent,
  BarChart,
  LineChart,
  CanvasRenderer
])

export default {
  name: 'PromotionCampaigns',
  components: {
    VChart
  },

  setup() {
    const toast = useToast()

    // Categories
    const categories = ref([])
    const categoryDialog = ref({
      show: false,
      isEdit: false,
      loading: false,
      valid: false,
      form: {
        name: '',
        description: ''
      }
    })

    // Campaigns
    const campaigns = ref([])
    const campaignFilter = ref('all')
    const campaignDialog = ref({
      show: false,
      isEdit: false,
      loading: false,
      valid: false,
      form: {
        name: '',
        description: '',
        categoryId: null,
        budget: null,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        targetAudience: {
          userType: 'all',
          orderFrequency: 'any'
        }
      }
    })

    // Stats dialog
    const statsDialog = ref({
      show: false,
      campaign: null,
      stats: null,
      timeRange: 30,
      chartOption: {}
    })

    // Date picker menus
    const startDateMenu = ref(false)
    const endDateMenu = ref(false)

    // Validation rules
    const rules = {
      required: v => !!v || 'This field is required',
      endDate: v => {
        if (!v) return 'End date is required'
        return v >= campaignDialog.value.form.startDate || 'End date must be after start date'
      }
    }

    // Options
    const statusFilters = [
      { label: 'All', value: 'all' },
      { label: 'Active', value: 'active' },
      { label: 'Scheduled', value: 'scheduled' },
      { label: 'Completed', value: 'completed' }
    ]

    const userTypeOptions = [
      { title: 'All Users', value: 'all' },
      { title: 'New Users', value: 'new' },
      { title: 'Existing Users', value: 'existing' }
    ]

    const orderFrequencyOptions = [
      { title: 'Any', value: 'any' },
      { title: 'First-time', value: 'first' },
      { title: 'Regular', value: 'regular' },
      { title: 'Inactive', value: 'inactive' }
    ]

    const timeRangeOptions = [
      { title: 'Last 7 Days', value: 7 },
      { title: 'Last 30 Days', value: 30 },
      { title: 'Last 90 Days', value: 90 }
    ]

    // Computed
    const filteredCampaigns = computed(() => {
      if (campaignFilter.value === 'all') return campaigns.value
      return campaigns.value.filter(c => c.status === campaignFilter.value)
    })

    // Methods
    const loadCategories = async () => {
      try {
        const response = await adminAPI.getPromotionCategories()
        categories.value = response.data.categories
      } catch (error) {
        toast.error('Failed to load categories')
      }
    }

    const loadCampaigns = async () => {
      try {
        const response = await adminAPI.getPromotionCampaigns()
        campaigns.value = response.data.campaigns
      } catch (error) {
        toast.error('Failed to load campaigns')
      }
    }

    const showCategoryForm = (category = null) => {
      if (category) {
        categoryDialog.value = {
          show: true,
          isEdit: true,
          loading: false,
          valid: true,
          form: { ...category }
        }
      } else {
        categoryDialog.value = {
          show: true,
          isEdit: false,
          loading: false,
          valid: false,
          form: {
            name: '',
            description: ''
          }
        }
      }
    }

    const showCampaignForm = (campaign = null) => {
      if (campaign) {
        campaignDialog.value = {
          show: true,
          isEdit: true,
          loading: false,
          valid: true,
          form: {
            ...campaign,
            startDate: campaign.startDate.split('T')[0],
            endDate: campaign.endDate.split('T')[0]
          }
        }
      } else {
        campaignDialog.value = {
          show: true,
          isEdit: false,
          loading: false,
          valid: false,
          form: {
            name: '',
            description: '',
            categoryId: null,
            budget: null,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            targetAudience: {
              userType: 'all',
              orderFrequency: 'any'
            }
          }
        }
      }
    }

    const saveCategory = async () => {
      if (!categoryDialog.value.valid) return

      categoryDialog.value.loading = true
      try {
        if (categoryDialog.value.isEdit) {
          await adminAPI.updatePromotionCategory(
            categoryDialog.value.form.id,
            categoryDialog.value.form
          )
          toast.success('Category updated successfully')
        } else {
          await adminAPI.createPromotionCategory(categoryDialog.value.form)
          toast.success('Category created successfully')
        }
        
        categoryDialog.value.show = false
        loadCategories()
      } catch (error) {
        toast.error('Failed to save category')
      } finally {
        categoryDialog.value.loading = false
      }
    }

    const saveCampaign = async () => {
      if (!campaignDialog.value.valid) return

      campaignDialog.value.loading = true
      try {
        if (campaignDialog.value.isEdit) {
          await adminAPI.updatePromotionCampaign(
            campaignDialog.value.form.id,
            campaignDialog.value.form
          )
          toast.success('Campaign updated successfully')
        } else {
          await adminAPI.createPromotionCampaign(campaignDialog.value.form)
          toast.success('Campaign created successfully')
        }
        
        campaignDialog.value.show = false
        loadCampaigns()
      } catch (error) {
        toast.error('Failed to save campaign')
      } finally {
        campaignDialog.value.loading = false
      }
    }

    const viewCampaignStats = async (campaign) => {
      try {
        const response = await adminAPI.getCampaignStats(campaign.id)
        statsDialog.value = {
          show: true,
          campaign: response.data.campaign,
          stats: response.data.campaign.metrics,
          timeRange: 30,
          chartOption: {
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
              data: ['Redemptions', 'Order Value']
            },
            xAxis: {
              type: 'category',
              data: response.data.campaign.metrics.timeAnalytics.map(d => d.date)
            },
            yAxis: [
              {
                type: 'value',
                name: 'Redemptions',
                position: 'left'
              },
              {
                type: 'value',
                name: 'Order Value ($)',
                position: 'right'
              }
            ],
            series: [
              {
                name: 'Redemptions',
                type: 'bar',
                data: response.data.campaign.metrics.timeAnalytics.map(d => d.totalRedemptions)
              },
              {
                name: 'Order Value',
                type: 'line',
                yAxisIndex: 1,
                data: response.data.campaign.metrics.timeAnalytics.map(d => d.totalOrderValue)
              }
            ]
          }
        }
      } catch (error) {
        toast.error('Failed to load campaign statistics')
      }
    }

    const toggleCampaignStatus = async (campaign) => {
      try {
        const newStatus = campaign.status === 'active' ? 'paused' : 'active'
        await adminAPI.updateCampaignStatus(campaign.id, { status: newStatus })
        campaign.status = newStatus
        toast.success(`Campaign ${newStatus}`)
      } catch (error) {
        toast.error('Failed to update campaign status')
      }
    }

    const formatDate = (dateString) => {
      return format(new Date(dateString), 'MMM d, yyyy')
    }

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount)
    }

    const formatPercentage = (value) => {
      return `${Math.round(value)}%`
    }

    const getCampaignStatusColor = (status) => {
      const colors = {
        draft: 'grey',
        scheduled: 'info',
        active: 'success',
        paused: 'warning',
        completed: 'primary',
        cancelled: 'error'
      }
      return colors[status] || 'grey'
    }

    const formatCampaignStatus = (status) => {
      return status.charAt(0).toUpperCase() + status.slice(1)
    }

    // Initialize data
    onMounted(() => {
      loadCategories()
      loadCampaigns()
    })

    return {
      // State
      categories,
      campaigns,
      categoryDialog,
      campaignDialog,
      statsDialog,
      startDateMenu,
      endDateMenu,
      campaignFilter,

      // Computed
      filteredCampaigns,

      // Options
      rules,
      statusFilters,
      userTypeOptions,
      orderFrequencyOptions,
      timeRangeOptions,

      // Methods
      showCategoryForm,
      showCampaignForm,
      saveCategory,
      saveCampaign,
      viewCampaignStats,
      toggleCampaignStatus,
      formatDate,
      formatCurrency,
      formatPercentage,
      getCampaignStatusColor,
      formatCampaignStatus
    }
  }
}
</script>

<style scoped>
.chart {
  height: 400px;
}
</style>