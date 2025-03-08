<template>
  <div class="inventory-manager">
    <!-- Header Actions -->
    <div class="d-flex align-center mb-4">
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="showAddItemDialog = true"
      >
        Add Item
      </v-btn>

      <v-spacer></v-spacer>

      <v-btn-group class="mr-4">
        <v-btn
          prepend-icon="mdi-truck"
          :color="hasReorderSuggestions ? 'warning' : undefined"
          @click="showReorderDialog = true"
        >
          Reorder ({{ reorderCount }})
        </v-btn>
        <v-btn
          prepend-icon="mdi-alert"
          :color="hasAlerts ? 'error' : undefined"
          @click="showAlertsDialog = true"
        >
          Alerts ({{ alertCount }})
        </v-btn>
      </v-btn-group>

      <v-btn
        icon="mdi-refresh"
        variant="text"
        :loading="isLoading"
        @click="refreshData"
      ></v-btn>
    </div>

    <!-- Main Content -->
    <v-row>
      <!-- Inventory List -->
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            Inventory Items
            <v-text-field
              v-model="search"
              append-inner-icon="mdi-magnify"
              label="Search items"
              single-line
              hide-details
              density="compact"
              style="max-width: 300px"
            ></v-text-field>
          </v-card-title>

          <v-data-table
            :headers="headers"
            :items="filteredItems"
            :search="search"
            :loading="isLoading"
          >
            <!-- Item Name -->
            <template v-slot:item.name="{ item }">
              <div class="d-flex align-center">
                <v-avatar size="32" class="mr-2">
                  <v-img :src="item.image" cover>
                    <template v-slot:placeholder>
                      <v-icon>mdi-package-variant</v-icon>
                    </template>
                  </v-img>
                </v-avatar>
                {{ item.name }}
              </div>
            </template>

            <!-- Stock Level -->
            <template v-slot:item.stockLevel="{ item }">
              <div class="d-flex align-center">
                <v-progress-linear
                  :model-value="getStockPercentage(item)"
                  :color="getStockColor(item)"
                  height="8"
                  rounded
                  class="mr-2"
                  style="width: 100px"
                ></v-progress-linear>
                <span>{{ item.stockLevel }} {{ item.unit }}</span>
              </div>
            </template>

            <!-- Status -->
            <template v-slot:item.status="{ item }">
              <v-chip
                :color="getStatusColor(item.status)"
                size="small"
              >
                {{ item.status }}
              </v-chip>
            </template>

            <!-- Actions -->
            <template v-slot:item.actions="{ item }">
              <v-btn
                icon="mdi-pencil"
                variant="text"
                size="small"
                @click="editItem(item)"
              >
                <v-tooltip activator="parent" location="top">
                  Edit Item
                </v-tooltip>
              </v-btn>
              <v-btn
                icon="mdi-history"
                variant="text"
                size="small"
                @click="viewHistory(item)"
              >
                <v-tooltip activator="parent" location="top">
                  View History
                </v-tooltip>
              </v-btn>
              <v-btn
                icon="mdi-delete"
                variant="text"
                size="small"
                color="error"
                @click="confirmDelete(item)"
              >
                <v-tooltip activator="parent" location="top">
                  Delete Item
                </v-tooltip>
              </v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>

      <!-- Summary Panel -->
      <v-col cols="12" md="4">
        <!-- Quick Stats -->
        <v-card class="mb-4">
          <v-card-text>
            <div class="d-flex justify-space-between mb-4">
              <div>
                <div class="text-h6">${{ formatNumber(totalValue) }}</div>
                <div class="text-caption">Total Inventory Value</div>
              </div>
              <div>
                <div class="text-h6">{{ itemCount }}</div>
                <div class="text-caption">Total Items</div>
              </div>
            </div>

            <v-divider class="mb-4"></v-divider>

            <div class="mb-4">
              <div class="d-flex justify-space-between mb-1">
                <div class="text-subtitle-2">Low Stock Items</div>
                <div>{{ lowStockCount }}</div>
              </div>
              <div class="d-flex justify-space-between mb-1">
                <div class="text-subtitle-2">Out of Stock</div>
                <div>{{ outOfStockCount }}</div>
              </div>
              <div class="d-flex justify-space-between">
                <div class="text-subtitle-2">Overstock Items</div>
                <div>{{ overstockCount }}</div>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- Recent Activity -->
        <v-card>
          <v-card-title>Recent Activity</v-card-title>
          <v-list lines="two">
            <v-list-item
              v-for="activity in recentActivity"
              :key="activity.id"
              :subtitle="formatDate(activity.timestamp)"
            >
              <template v-slot:prepend>
                <v-avatar :color="getActivityColor(activity.type)">
                  <v-icon color="white">
                    {{ getActivityIcon(activity.type) }}
                  </v-icon>
                </v-avatar>
              </template>

              <v-list-item-title>{{ activity.description }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <!-- Add/Edit Item Dialog -->
    <v-dialog v-model="showItemDialog" max-width="600">
      <v-card>
        <v-card-title>
          {{ editingItem ? 'Edit Item' : 'Add New Item' }}
        </v-card-title>

        <v-card-text>
          <v-form ref="itemForm" @submit.prevent="saveItem">
            <v-text-field
              v-model="itemForm.name"
              label="Item Name"
              :rules="[rules.required]"
              required
            ></v-text-field>

            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model.number="itemForm.stockLevel"
                  type="number"
                  label="Current Stock"
                  :rules="[rules.required, rules.positiveNumber]"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model="itemForm.unit"
                  label="Unit"
                  :rules="[rules.required]"
                  required
                ></v-text-field>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model.number="itemForm.minLevel"
                  type="number"
                  label="Minimum Level"
                  :rules="[rules.required, rules.positiveNumber]"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model.number="itemForm.maxLevel"
                  type="number"
                  label="Maximum Level"
                  :rules="[rules.required, rules.positiveNumber]"
                  required
                ></v-text-field>
              </v-col>
            </v-row>

            <v-text-field
              v-model.number="itemForm.reorderPoint"
              type="number"
              label="Reorder Point"
              :rules="[rules.required, rules.positiveNumber]"
              required
            ></v-text-field>

            <v-text-field
              v-model.number="itemForm.unitCost"
              type="number"
              label="Unit Cost"
              prefix="$"
              :rules="[rules.required, rules.positiveNumber]"
              required
            ></v-text-field>

            <v-select
              v-model="itemForm.supplierId"
              :items="suppliers"
              item-title="name"
              item-value="id"
              label="Supplier"
              :rules="[rules.required]"
              required
            ></v-select>

            <v-file-input
              v-model="itemForm.image"
              label="Item Image"
              accept="image/*"
              prepend-icon="mdi-camera"
              @change="handleImagePreview"
            ></v-file-input>

            <v-img
              v-if="imagePreview || itemForm.imageUrl"
              :src="imagePreview || itemForm.imageUrl"
              width="200"
              height="200"
              cover
              class="rounded mt-2"
            ></v-img>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showItemDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :loading="savingItem"
            @click="saveItem"
          >
            {{ editingItem ? 'Update' : 'Add' }} Item
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Reorder Dialog -->
    <v-dialog v-model="showReorderDialog" max-width="800">
      <v-card>
        <v-card-title>Reorder Suggestions</v-card-title>

        <v-card-text>
          <v-data-table
            :headers="reorderHeaders"
            :items="reorderSuggestions"
            :loading="loadingReorder"
            item-value="id"
            v-model="selectedItems"
            show-select
          >
            <template v-slot:item.suggestedAmount="{ item }">
              <v-text-field
                v-model.number="item.suggestedAmount"
                type="number"
                density="compact"
                hide-details
                min="0"
                :rules="[rules.positiveNumber]"
              ></v-text-field>
            </template>

            <template v-slot:item.totalCost="{ item }">
              ${{ (item.suggestedAmount * item.unitCost).toFixed(2) }}
            </template>
          </v-data-table>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showReorderDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :loading="processingReorder"
            :disabled="selectedItems.length === 0"
            @click="placeReorder"
          >
            Place Order
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Alerts Dialog -->
    <v-dialog v-model="showAlertsDialog" max-width="600">
      <v-card>
        <v-card-title>Inventory Alerts</v-card-title>

        <v-card-text>
          <v-list>
            <v-list-item
              v-for="alert in stockAlerts"
              :key="alert.id"
              :value="alert"
            >
              <template v-slot:prepend>
                <v-icon :color="getAlertColor(alert.type)">
                  {{ getAlertIcon(alert.type) }}
                </v-icon>
              </template>

              <v-list-item-title>{{ alert.title }}</v-list-item-title>
              <v-list-item-subtitle>{{ alert.message }}</v-list-item-subtitle>

              <template v-slot:append>
                <v-btn
                  v-if="alert.type === 'low_stock'"
                  size="small"
                  color="primary"
                  @click="reorderItem(alert.itemId)"
                >
                  Reorder
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showAlertsDialog = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Item?</v-card-title>
        <v-card-text>
          Are you sure you want to delete this item? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showDeleteDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            :loading="deletingItem"
            @click="deleteItem"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- History Dialog -->
    <v-dialog v-model="showHistoryDialog" max-width="800">
      <v-card>
        <v-card-title>Item History</v-card-title>

        <v-card-text>
          <v-data-table
            :headers="historyHeaders"
            :items="itemHistory"
            :loading="loadingHistory"
          >
            <template v-slot:item.type="{ item }">
              <v-chip
                :color="getHistoryColor(item.type)"
                size="small"
              >
                {{ item.type }}
              </v-chip>
            </template>

            <template v-slot:item.change="{ item }">
              <span :class="item.change > 0 ? 'text-success' : 'text-error'">
                {{ item.change > 0 ? '+' : '' }}{{ item.change }}
              </span>
            </template>
          </v-data-table>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showHistoryDialog = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { format } from 'date-fns'
import inventoryService from '@/services/inventory.service'

export default {
  name: 'InventoryManager',

  props: {
    restaurantId: {
      type: String,
      required: true
    }
  },

  setup(props) {
    const store = useStore()
    
    // State
    const isLoading = ref(false)
    const search = ref('')
    const items = ref([])
    const suppliers = ref([])
    const recentActivity = ref([])
    const reorderSuggestions = ref([])
    const stockAlerts = ref([])
    const itemHistory = ref([])
    
    // Dialog state
    const showItemDialog = ref(false)
    const showReorderDialog = ref(false)
    const showAlertsDialog = ref(false)
    const showDeleteDialog = ref(false)
    const showHistoryDialog = ref(false)
    
    // Form state
    const itemForm = ref({
      name: '',
      stockLevel: 0,
      unit: '',
      minLevel: 0,
      maxLevel: 0,
      reorderPoint: 0,
      unitCost: 0,
      supplierId: null,
      image: null,
      imageUrl: null
    })
    
    const editingItem = ref(null)
    const selectedItems = ref([])
    const imagePreview = ref(null)
    const savingItem = ref(false)
    const deletingItem = ref(false)
    const processingReorder = ref(false)
    const loadingReorder = ref(false)
    const loadingHistory = ref(false)
    
    // Table headers
    const headers = [
      {
        title: 'Name',
        key: 'name'
      },
      {
        title: 'Stock Level',
        key: 'stockLevel',
        align: 'center'
      },
      {
        title: 'Status',
        key: 'status',
        align: 'center'
      },
      {
        title: 'Unit Cost',
        key: 'unitCost',
        align: 'end'
      },
      {
        title: 'Total Value',
        key: 'totalValue',
        align: 'end'
      },
      {
        title: 'Actions',
        key: 'actions',
        sortable: false,
        align: 'end'
      }
    ]
    
    const reorderHeaders = [
      {
        title: 'Item',
        key: 'name'
      },
      {
        title: 'Current Stock',
        key: 'stockLevel',
        align: 'center'
      },
      {
        title: 'Suggested Amount',
        key: 'suggestedAmount',
        align: 'center'
      },
      {
        title: 'Unit Cost',
        key: 'unitCost',
        align: 'end'
      },
      {
        title: 'Total Cost',
        key: 'totalCost',
        align: 'end'
      }
    ]
    
    const historyHeaders = [
      {
        title: 'Date',
        key: 'date'
      },
      {
        title: 'Type',
        key: 'type'
      },
      {
        title: 'Change',
        key: 'change',
        align: 'center'
      },
      {
        title: 'Stock After',
        key: 'stockAfter',
        align: 'center'
      },
      {
        title: 'User',
        key: 'user'
      },
      {
        title: 'Notes',
        key: 'notes'
      }
    ]
    
    // Computed
    const filteredItems = computed(() => {
      if (!search.value) return items.value
      
      const searchTerm = search.value.toLowerCase()
      return items.value.filter(item =>
        item.name.toLowerCase().includes(searchTerm) ||
        item.status.toLowerCase().includes(searchTerm)
      )
    })
    
    const itemCount = computed(() => items.value.length)
    
    const totalValue = computed(() =>
      items.value.reduce((sum, item) => 
        sum + (item.stockLevel * item.unitCost), 0
      )
    )
    
    const lowStockCount = computed(() =>
      items.value.filter(item => 
        item.stockLevel <= item.reorderPoint
      ).length
    )
    
    const outOfStockCount = computed(() =>
      items.value.filter(item => item.stockLevel === 0).length
    )
    
    const overstockCount = computed(() =>
      items.value.filter(item => 
        item.stockLevel > item.maxLevel
      ).length
    )
    
    const reorderCount = computed(() => reorderSuggestions.value.length)
    const alertCount = computed(() => stockAlerts.value.length)
    
    const hasReorderSuggestions = computed(() => reorderCount.value > 0)
    const hasAlerts = computed(() => alertCount.value > 0)
    
    // Rules
    const rules = {
      required: v => !!v || 'Required',
      positiveNumber: v => v >= 0 || 'Must be 0 or greater'
    }
    
    // Methods
    const loadData = async () => {
      isLoading.value = true
      try {
        const [
          inventoryData,
          supplierData,
          activityData,
          alertData,
          reorderData
        ] = await Promise.all([
          inventoryService.getInventoryLevels(props.restaurantId),
          inventoryService.getSuppliers(props.restaurantId),
          inventoryService.getUsageReport(props.restaurantId),
          inventoryService.getStockAlerts(props.restaurantId),
          inventoryService.getReorderSuggestions(props.restaurantId)
        ])
        
        items.value = inventoryData
        suppliers.value = supplierData
        recentActivity.value = activityData
        stockAlerts.value = alertData
        reorderSuggestions.value = reorderData
      } catch (error) {
        console.error('Failed to load inventory data:', error)
      } finally {
        isLoading.value = false
      }
    }
    
    const refreshData = () => {
      loadData()
    }
    
    const handleImagePreview = (file) => {
      if (!file) {
        imagePreview.value = null
        return
      }

      const reader = new FileReader()
      reader.onload = e => {
        imagePreview.value = e.target.result
      }
      reader.readAsDataURL(file)
    }
    
    const resetForm = () => {
      itemForm.value = {
        name: '',
        stockLevel: 0,
        unit: '',
        minLevel: 0,
        maxLevel: 0,
        reorderPoint: 0,
        unitCost: 0,
        supplierId: null,
        image: null,
        imageUrl: null
      }
      imagePreview.value = null
      editingItem.value = null
    }
    
    const editItem = (item) => {
      editingItem.value = item
      itemForm.value = {
        ...item,
        image: null
      }
      showItemDialog.value = true
    }
    
    const saveItem = async () => {
      savingItem.value = true
      try {
        const formData = new FormData()
        Object.keys(itemForm.value).forEach(key => {
          if (key === 'image' && itemForm.value[key]) {
            formData.append(key, itemForm.value[key])
          } else {
            formData.append(key, itemForm.value[key])
          }
        })

        if (editingItem.value) {
          await inventoryService.updateInventoryItem(
            props.restaurantId,
            editingItem.value.id,
            formData
          )
        } else {
          await inventoryService.addInventoryItem(
            props.restaurantId,
            formData
          )
        }

        showItemDialog.value = false
        resetForm()
        refreshData()
      } catch (error) {
        console.error('Failed to save item:', error)
      } finally {
        savingItem.value = false
      }
    }
    
    const confirmDelete = (item) => {
      editingItem.value = item
      showDeleteDialog.value = true
    }
    
    const deleteItem = async () => {
      if (!editingItem.value) return

      deletingItem.value = true
      try {
        await inventoryService.deleteInventoryItem(
          props.restaurantId,
          editingItem.value.id
        )
        showDeleteDialog.value = false
        refreshData()
      } catch (error) {
        console.error('Failed to delete item:', error)
      } finally {
        deletingItem.value = false
        editingItem.value = null
      }
    }
    
    const viewHistory = async (item) => {
      loadingHistory.value = true
      try {
        const history = await inventoryService.getPurchaseHistory(
          props.restaurantId,
          { itemId: item.id }
        )
        itemHistory.value = history
        showHistoryDialog.value = true
      } catch (error) {
        console.error('Failed to load item history:', error)
      } finally {
        loadingHistory.value = false
      }
    }
    
    const placeReorder = async () => {
      if (selectedItems.value.length === 0) return

      processingReorder.value = true
      try {
        const order = {
          items: selectedItems.value.map(item => ({
            itemId: item.id,
            quantity: item.suggestedAmount
          }))
        }
        await inventoryService.placeReorder(props.restaurantId, order)
        showReorderDialog.value = false
        refreshData()
      } catch (error) {
        console.error('Failed to place reorder:', error)
      } finally {
        processingReorder.value = false
        selectedItems.value = []
      }
    }
    
    const reorderItem = (itemId) => {
      const item = reorderSuggestions.value.find(i => i.id === itemId)
      if (item) {
        selectedItems.value = [item]
        showAlertsDialog.value = false
        showReorderDialog.value = true
      }
    }
    
    // Utility methods
    const formatNumber = (value) => {
      return new Intl.NumberFormat().format(value)
    }
    
    const formatDate = (date) => {
      return format(new Date(date), 'MMM d, yyyy h:mm a')
    }
    
    const getStockPercentage = (item) => {
      return (item.stockLevel / item.maxLevel) * 100
    }
    
    const getStockColor = (item) => {
      const percentage = getStockPercentage(item)
      if (percentage <= 25) return 'error'
      if (percentage <= 50) return 'warning'
      return 'success'
    }
    
    const getStatusColor = (status) => {
      const colors = {
        normal: 'success',
        low: 'warning',
        out: 'error',
        overstock: 'info'
      }
      return colors[status] || 'grey'
    }
    
    const getActivityColor = (type) => {
      const colors = {
        reorder: 'primary',
        receive: 'success',
        adjust: 'warning',
        waste: 'error'
      }
      return colors[type] || 'grey'
    }
    
    const getActivityIcon = (type) => {
      const icons = {
        reorder: 'mdi-truck',
        receive: 'mdi-package-variant-plus',
        adjust: 'mdi-pencil',
        waste: 'mdi-delete'
      }
      return icons[type] || 'mdi-alert'
    }
    
    const getAlertColor = (type) => {
      const colors = {
        low_stock: 'warning',
        out_of_stock: 'error',
        overstock: 'info'
      }
      return colors[type] || 'grey'
    }
    
    const getAlertIcon = (type) => {
      const icons = {
        low_stock: 'mdi-alert',
        out_of_stock: 'mdi-alert-circle',
        overstock: 'mdi-information'
      }
      return icons[type] || 'mdi-alert'
    }
    
    const getHistoryColor = (type) => {
      const colors = {
        reorder: 'primary',
        receive: 'success',
        adjust: 'warning',
        waste: 'error'
      }
      return colors[type] || 'grey'
    }
    
    // Initialize
    onMounted(() => {
      loadData()
    })
    
    return {
      // State
      isLoading,
      search,
      items,
      suppliers,
      recentActivity,
      reorderSuggestions,
      stockAlerts,
      itemHistory,
      showItemDialog,
      showReorderDialog,
      showAlertsDialog,
      showDeleteDialog,
      showHistoryDialog,
      itemForm,
      editingItem,
      selectedItems,
      imagePreview,
      savingItem,
      deletingItem,
      processingReorder,
      loadingReorder,
      loadingHistory,
      
      // Computed
      filteredItems,
      itemCount,
      totalValue,
      lowStockCount,
      outOfStockCount,
      overstockCount,
      reorderCount,
      alertCount,
      hasReorderSuggestions,
      hasAlerts,
      
      // Data
      headers,
      reorderHeaders,
      historyHeaders,
      rules,
      
      // Methods
      refreshData,
      handleImagePreview,
      editItem,
      saveItem,
      confirmDelete,
      deleteItem,
      viewHistory,
      placeReorder,
      reorderItem,
      
      // Utility methods
      formatNumber,
      formatDate,
      getStockPercentage,
      getStockColor,
      getStatusColor,
      getActivityColor,
      getActivityIcon,
      getAlertColor,
      getAlertIcon,
      getHistoryColor
    }
  }
}
</script>

<style scoped>
.inventory-manager {
  max-width: 1600px;
  margin: 0 auto;
  padding: 16px;
}

.v-data-table {
  width: 100%;
}
</style>