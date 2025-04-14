<template>
  <div class="table-view">
    <v-card>
      <v-card-title class="d-flex align-center">
        <span class="text-h5">{{ formattedTableName }} Details</span>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          variant="text"
          :to="`/admin/tables/${tableName}`"
          prepend-icon="mdi-arrow-left"
        >
          Back to List
        </v-btn>
        <v-btn
          color="warning"
          variant="text"
          :to="`/admin/tables/${tableName}/edit/${id}`"
          prepend-icon="mdi-pencil"
          class="ml-2"
        >
          Edit
        </v-btn>
      </v-card-title>
      
      <v-card-text>
        <div v-if="loading" class="d-flex justify-center align-center pa-4">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>
        
        <v-alert
          v-if="error"
          type="error"
          title="Error Loading Data"
          text="Failed to load record data. Please try again."
          class="mb-4"
        ></v-alert>
        
        <template v-if="!loading && !error">
          <v-row>
            <v-col cols="12">
              <!-- Main data display -->
              <v-list lines="two">
                <v-list-subheader>Basic Information</v-list-subheader>
                
                <v-list-item v-for="(value, key) in recordData" :key="key">
                  <template v-slot:prepend>
                    <v-icon :icon="getFieldIcon(key)" class="mr-3"></v-icon>
                  </template>
                  
                  <v-list-item-title>{{ formatFieldLabel(key) }}</v-list-item-title>
                  
                  <v-list-item-subtitle>
                    <!-- Format based on field type -->
                    <template v-if="isDateField(key)">
                      {{ formatDate(value) }}
                    </template>
                    
                    <template v-else-if="isBooleanField(key)">
                      <v-chip
                        :color="value ? 'success' : 'error'"
                        size="small"
                      >
                        {{ value ? 'Yes' : 'No' }}
                      </v-chip>
                    </template>
                    
                    <template v-else-if="isJSONField(key)">
                      <v-btn
                        size="small"
                        color="info"
                        @click="showJsonDialog(value, key)"
                        prepend-icon="mdi-code-json"
                        variant="text"
                      >
                        View JSON Data
                      </v-btn>
                    </template>
                    
                    <template v-else-if="isEnumField(key)">
                      <v-chip
                        size="small"
                        :color="getEnumColor(key, value)"
                      >
                        {{ value }}
                      </v-chip>
                    </template>
                    
                    <template v-else-if="isImageField(key)">
                      <v-img
                        :src="value"
                        max-width="150"
                        max-height="100"
                        class="mt-2"
                        v-if="value"
                      >
                        <template v-slot:placeholder>
                          <v-sheet color="grey-lighten-3" width="150" height="100" class="d-flex align-center justify-center">
                            <v-icon icon="mdi-image-off"></v-icon>
                          </v-sheet>
                        </template>
                      </v-img>
                      <span v-else class="text-disabled">No image</span>
                    </template>
                    
                    <template v-else-if="isForeignKeyField(key)">
                      <v-chip
                        size="small"
                        color="primary"
                        class="mt-1"
                        :to="`/admin/tables/${getForeignTable(key)}/view/${value}`"
                      >
                        ID: {{ value }} (View)
                      </v-chip>
                    </template>
                    
                    <template v-else-if="isPasswordField(key)">
                      <span class="text-disabled">********</span>
                    </template>
                    
                    <template v-else>
                      {{ value || 'N/A' }}
                    </template>
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>
            
            <!-- Related records section (if applicable) -->
            <v-col cols="12" v-if="hasRelatedRecords">
              <v-card outlined class="mt-4">
                <v-card-title>Related Records</v-card-title>
                <v-card-text>
                  <v-tabs v-model="activeTab">
                    <v-tab
                      v-for="relation in relatedTables"
                      :key="relation.table"
                      :value="relation.table"
                    >
                      {{ formatTableName(relation.table) }}
                      <v-badge
                        color="primary"
                        :content="relation.count"
                        :model-value="relation.count > 0"
                        class="ml-2"
                      ></v-badge>
                    </v-tab>
                  </v-tabs>
                  
                  <v-window v-model="activeTab" class="mt-4">
                    <v-window-item
                      v-for="relation in relatedTables"
                      :key="relation.table"
                      :value="relation.table"
                    >
                      <div v-if="relation.loading" class="d-flex justify-center py-4">
                        <v-progress-circular indeterminate color="primary"></v-progress-circular>
                      </div>
                      
                      <div v-else-if="relation.items.length === 0" class="pa-4 text-center text-disabled">
                        No related records found.
                      </div>
                      
                      <v-list v-else>
                        <v-list-item
                          v-for="item in relation.items"
                          :key="item.id"
                          :to="`/admin/tables/${relation.table}/view/${item.id}`"
                        >
                          <v-list-item-title>
                            {{ getItemDisplayName(item, relation.displayField) }}
                          </v-list-item-title>
                          <v-list-item-subtitle>ID: {{ item.id }}</v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                      
                      <div class="text-center pt-2" v-if="relation.count > 5">
                        <v-btn
                          variant="text"
                          color="primary"
                          :to="`/admin/tables/${relation.table}?${relation.foreignKey}=${id}`"
                        >
                          View All {{ relation.count }} Records
                        </v-btn>
                      </div>
                    </v-window-item>
                  </v-window>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </template>
      </v-card-text>
    </v-card>
    
    <!-- JSON Viewer Dialog -->
    <v-dialog v-model="jsonDialog" max-width="800">
      <v-card>
        <v-card-title class="text-h5">
          {{ selectedJsonField ? formatFieldLabel(selectedJsonField) : 'JSON Data' }}
        </v-card-title>
        <v-card-text>
          <v-sheet
            class="json-viewer pa-4 overflow-auto"
            style="max-height: 500px; font-family: monospace;"
          >
            <pre>{{ formattedJsonData }}</pre>
          </v-sheet>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="jsonDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import axios from 'axios'
import { formatDistanceToNow } from 'date-fns'

export default {
  name: 'TableView',
  
  props: {
    tableName: {
      type: String,
      required: true
    },
    id: {
      type: [String, Number],
      required: true
    }
  },
  
  setup(props) {
    const route = useRoute()
    const router = useRouter()
    const toast = useToast()
    
    // State
    const loading = ref(true)
    const error = ref(false)
    const recordData = ref({})
    const jsonDialog = ref(false)
    const selectedJsonData = ref(null)
    const selectedJsonField = ref(null)
    const activeTab = ref(null)
    
    // Related records
    const relatedTables = ref([])
    const hasRelatedRecords = computed(() => relatedTables.value.length > 0)
    
    // Field metadata
    const dateFields = ref([
      'createdAt', 'updatedAt', 'lastLogin', 'emailVerificationExpires', 
      'phoneVerificationExpires', 'resetPasswordExpires', 'verificationExpires',
      'start_date', 'end_date', 'publishedAt', 'expiresAt', 'startDate', 'endDate'
    ])
    
    const booleanFields = ref([
      'isActive', 'isEmailVerified', 'isPhoneVerified', 'isDefault', 'isAvailable',
      'isVisible', 'isRated', 'isUsed', 'published', 'isPromoted', 'isEdited'
    ])
    
    const jsonFields = ref([
      'notificationPreferences', 'favoriteRestaurants', 'favoriteDishes', 
      'openingHours', 'specialHolidays', 'options', 'images', 'details', 
      'targetAudience', 'metrics', 'paymentDetails', 'deviceInfo', 'data'
    ])
    
    const imageFields = ref([
      'image', 'logo', 'coverImage', 'profileImage', 'thumbnail'
    ])
    
    const passwordFields = ref([
      'password', 'passwordHash', 'hashedPassword'
    ])
    
    // Computed properties
    const formattedTableName = computed(() => {
      return formatTableName(props.tableName)
    })
    
    const formattedJsonData = computed(() => {
      if (!selectedJsonData.value) return '{}'
      
      try {
        if (typeof selectedJsonData.value === 'string') {
          return JSON.stringify(JSON.parse(selectedJsonData.value), null, 2)
        }
        return JSON.stringify(selectedJsonData.value, null, 2)
      } catch (error) {
        return selectedJsonData.value
      }
    })
    
    // Methods
    const loadRecord = async () => {
      loading.value = true
      error.value = false
      
      try {
        const response = await axios.get(`/api/admin/${props.tableName}/${props.id}`)
        recordData.value = response.data
        
        // After loading record, discover related tables
        await discoverRelatedTables()
      } catch (err) {
        console.error('Error loading record:', err)
        error.value = true
        toast.error('Failed to load record')
      } finally {
        loading.value = false
      }
    }
    
    const discoverRelatedTables = async () => {
      try {
        // Get potential related tables based on common patterns
        const response = await axios.get(`/api/admin/related-tables/${props.tableName}/${props.id}`)
        
        if (response.data.length > 0) {
          relatedTables.value = response.data.map(relation => ({
            table: relation.table,
            foreignKey: relation.foreignKey,
            count: relation.count,
            items: [],
            loading: true,
            displayField: getDisplayFieldForTable(relation.table)
          }))
          
          // Set active tab to the first related table
          activeTab.value = relatedTables.value[0].table
          
          // Load initial data for each related table
          relatedTables.value.forEach(relation => {
            loadRelatedRecords(relation)
          })
        }
      } catch (err) {
        console.error('Error discovering related tables:', err)
      }
    }
    
    const loadRelatedRecords = async (relation) => {
      try {
        const response = await axios.get(`/api/admin/${relation.table}`, {
          params: {
            [`${relation.foreignKey}`]: props.id,
            limit: 5
          }
        })
        
        // Find the relation in our array and update it
        const index = relatedTables.value.findIndex(r => r.table === relation.table)
        if (index !== -1) {
          relatedTables.value[index].items = response.data.data
          relatedTables.value[index].loading = false
        }
      } catch (err) {
        console.error(`Error loading related records for ${relation.table}:`, err)
        
        // Mark as not loading even on error
        const index = relatedTables.value.findIndex(r => r.table === relation.table)
        if (index !== -1) {
          relatedTables.value[index].loading = false
        }
      }
    }
    
    const getDisplayFieldForTable = (tableName) => {
      const commonDisplayFields = {
        'users': 'username',
        'restaurants': 'name',
        'products': 'name',
        'categories': 'name',
        'orders': 'orderNumber',
        'promotions': 'code',
        'articles': 'title',
        'faqs': 'question'
      }
      
      return commonDisplayFields[tableName] || 'name'
    }
    
    const getItemDisplayName = (item, displayField) => {
      // Try to get a meaningful display name
      if (item[displayField]) {
        return item[displayField]
      }
      
      // Fallbacks
      if (item.name) return item.name
      if (item.title) return item.title
      if (item.label) return item.label
      if (item.description) return item.description.substring(0, 50) + '...'
      
      return `ID: ${item.id}`
    }
    
    const formatTableName = (name) => {
      return name
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    }
    
    const formatFieldLabel = (name) => {
      return name
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    }
    
    const showJsonDialog = (data, fieldName) => {
      selectedJsonData.value = data
      selectedJsonField.value = fieldName
      jsonDialog.value = true
    }
    
    const formatDate = (date) => {
      if (!date) return 'N/A'
      
      try {
        const dateObj = new Date(date)
        return `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString()} (${formatDistanceToNow(dateObj, { addSuffix: true })})`
      } catch {
        return date
      }
    }
    
    const isDateField = (field) => {
      return dateFields.value.includes(field) || field.toLowerCase().includes('date') || field.toLowerCase().includes('time')
    }
    
    const isBooleanField = (field) => {
      return booleanFields.value.includes(field) || field.startsWith('is') || field.startsWith('has')
    }
    
    const isJSONField = (field) => {
      return jsonFields.value.includes(field) || 
        typeof recordData.value[field] === 'object' && recordData.value[field] !== null
    }
    
    const isEnumField = (field) => {
      // Common enum fields
      const enumFields = ['status', 'type', 'role', 'paymentStatus', 'moderationStatus', 'priority']
      return enumFields.includes(field)
    }
    
    const isImageField = (field) => {
      return imageFields.value.includes(field)
    }
    
    const isPasswordField = (field) => {
      return passwordFields.value.includes(field)
    }
    
    const isForeignKeyField = (field) => {
      return field.endsWith('Id') && field !== 'id'
    }
    
    const getForeignTable = (field) => {
      if (!field.endsWith('Id')) return null
      return field.replace('Id', '').toLowerCase()
    }
    
    const getFieldIcon = (field) => {
      const iconMap = {
        'id': 'mdi-key-variant',
        'name': 'mdi-rename-box',
        'email': 'mdi-email',
        'phone': 'mdi-phone',
        'address': 'mdi-map-marker',
        'password': 'mdi-lock',
        'createdAt': 'mdi-calendar-plus',
        'updatedAt': 'mdi-calendar-edit',
        'description': 'mdi-text-box',
        'status': 'mdi-information',
        'role': 'mdi-account-multiple',
        'price': 'mdi-cash',
        'isActive': 'mdi-toggle-switch'
      }
      
      // Return specific icon if defined
      if (iconMap[field]) {
        return iconMap[field]
      }
      
      // Check field patterns
      if (isDateField(field)) return 'mdi-calendar'
      if (isBooleanField(field)) return 'mdi-checkbox-marked-outline'
      if (isJSONField(field)) return 'mdi-code-json'
      if (isImageField(field)) return 'mdi-image'
      if (isForeignKeyField(field)) return 'mdi-link-variant'
      
      // Default icon
      return 'mdi-information'
    }
    
    const getEnumColor = (field, value) => {
      // Common status colors
      const statusColors = {
        'pending': 'warning',
        'processing': 'info',
        'confirmed': 'info',
        'preparing': 'info',
        'ready': 'success',
        'completed': 'success',
        'delivered': 'success',
        'cancelled': 'error',
        'failed': 'error',
        'active': 'success',
        'inactive': 'error',
        'approved': 'success',
        'rejected': 'error',
        'draft': 'grey',
        'published': 'success',
        'archived': 'grey'
      }
      
      // Role-specific colors
      if (field === 'role') {
        const roleColors = {
          'admin': 'red',
          'customer': 'blue',
          'restaurant': 'green',
          'driver': 'purple'
        }
        return roleColors[value] || 'primary'
      }
      
      return statusColors[value] || 'primary'
    }
    
    // Load data when component mounts or props change
    onMounted(() => {
      loadRecord()
    })
    
    watch([() => props.tableName, () => props.id], () => {
      loadRecord()
    })
    
    return {
      loading,
      error,
      recordData,
      jsonDialog,
      selectedJsonData,
      selectedJsonField,
      formattedTableName,
      formattedJsonData,
      relatedTables,
      activeTab,
      hasRelatedRecords,
      showJsonDialog,
      formatDate,
      formatFieldLabel,
      formatTableName,
      isDateField,
      isBooleanField,
      isJSONField,
      isEnumField,
      isImageField,
      isPasswordField,
      isForeignKeyField,
      getForeignTable,
      getFieldIcon,
      getEnumColor,
      getItemDisplayName
    }
  }
}
</script>

<style scoped>
.table-view {
  padding: 16px;
}

.json-viewer {
  background-color: #f5f5f5;
  border-radius: 4px;
}

.json-viewer pre {
  white-space: pre-wrap;
  word-break: break-word;
}
</style> 