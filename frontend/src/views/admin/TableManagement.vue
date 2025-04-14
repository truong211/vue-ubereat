<template>
  <div class="table-management">
    <v-container fluid>
      <!-- Loading overlay -->
      <v-overlay v-if="loading" :value="loading" class="d-flex justify-center align-center">
        <v-progress-circular indeterminate size="64" color="primary"></v-progress-circular>
      </v-overlay>

      <!-- Error alert -->
      <v-alert v-if="error" type="error" class="mb-4" @click:close="error = null">
        {{ error }}
      </v-alert>

      <!-- Header -->
      <v-row class="mb-6">
        <v-col cols="12" md="7">
          <div class="d-flex align-center">
            <v-btn icon class="mr-4" @click="$router.back()">
              <v-icon>mdi-arrow-left</v-icon>
            </v-btn>
            <div>
              <h1 class="text-h4 font-weight-bold mb-1">{{ formatTableName(tableName) }}</h1>
              <p class="text-subtitle-1 text-medium-emphasis">
                Manage data in the {{ formatTableName(tableName) }} table
              </p>
            </div>
          </div>
        </v-col>
        <v-col cols="12" md="5" class="d-flex justify-end align-center">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            label="Search"
            hide-details
            density="compact"
            class="mr-3"
            style="max-width: 300px;"
            @keydown.enter="loadRecords"
          ></v-text-field>
          <v-btn color="primary" @click="openCreateDialog">
            <v-icon start>mdi-plus</v-icon>
            Add New
          </v-btn>
        </v-col>
      </v-row>

      <!-- Table Structure Card -->
      <v-card class="mb-6">
        <v-card-title>
          Table Structure
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            color="primary"
            @click="showStructure = !showStructure"
          >
            {{ showStructure ? 'Hide' : 'Show' }} Structure
          </v-btn>
        </v-card-title>
        <v-expand-transition>
          <div v-if="showStructure">
            <v-divider></v-divider>
            <v-card-text>
              <v-table>
                <thead>
                  <tr>
                    <th>Column</th>
                    <th>Type</th>
                    <th>Nullable</th>
                    <th>Key</th>
                    <th>Default</th>
                    <th>Extra</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="column in structure" :key="column.name">
                    <td>{{ column.name }}</td>
                    <td>{{ column.columnType || column.dataType }}</td>
                    <td>
                      <v-icon :color="column.nullable ? 'success' : 'error'">
                        {{ column.nullable ? 'mdi-check' : 'mdi-close' }}
                      </v-icon>
                    </td>
                    <td>
                      <v-chip v-if="column.isPrimary" color="primary" size="small">Primary</v-chip>
                    </td>
                    <td>{{ column.default || '-' }}</td>
                    <td>
                      <v-chip v-if="column.auto" color="info" size="small">Auto Increment</v-chip>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </div>
        </v-expand-transition>
      </v-card>

      <!-- Data Table -->
      <v-card>
        <v-data-table
          v-model:items-per-page="limit"
          :headers="headers"
          :items="records"
          :loading="loading"
          :items-length="totalRecords"
          :page="page"
          @update:page="page = $event; loadRecords()"
          @update:items-per-page="limit = $event; page = 1; loadRecords()"
        >
          <!-- Customize headers -->
          <template v-slot:header="{ column }">
            <div class="text-subtitle-2 font-weight-bold">
              {{ column.title }}
            </div>
          </template>

          <!-- Customize item display -->
          <template v-slot:item="{ item, index, columns }">
            <tr>
              <td v-for="column in columns" :key="column.key">
                <!-- Format based on column type -->
                <template v-if="column.key === 'actions'">
                  <div class="d-flex">
                    <v-btn icon="mdi-pencil" variant="text" color="primary" @click="editRecord(item)"></v-btn>
                    <v-btn icon="mdi-delete" variant="text" color="error" @click="confirmDelete(item)"></v-btn>
                  </div>
                </template>
                <template v-else-if="isBoolean(item[column.key])">
                  <v-icon :color="item[column.key] ? 'success' : 'error'">
                    {{ item[column.key] ? 'mdi-check-circle' : 'mdi-close-circle' }}
                  </v-icon>
                </template>
                <template v-else-if="isDate(item[column.key])">
                  {{ formatDate(item[column.key]) }}
                </template>
                <template v-else-if="isJSON(item[column.key])">
                  <v-btn size="small" @click="viewJSON(item[column.key])">View JSON</v-btn>
                </template>
                <template v-else-if="isImage(column.key, item[column.key])">
                  <v-img
                    v-if="item[column.key]"
                    :src="getImageUrl(item[column.key])"
                    width="40"
                    height="40"
                    cover
                    class="rounded"
                  ></v-img>
                  <span v-else>-</span>
                </template>
                <template v-else>
                  <span v-if="truncateText(item[column.key])">{{ truncateText(item[column.key]) }}</span>
                  <span v-else>-</span>
                </template>
              </td>
            </tr>
          </template>

          <!-- Empty state -->
          <template v-slot:no-data>
            <div class="d-flex flex-column align-center justify-center py-8">
              <v-icon size="64" color="grey-lighten-1">mdi-database-off</v-icon>
              <div class="text-h6 mt-4">No Records Found</div>
              <div class="text-subtitle-2 text-grey">Try changing your search query or add a new record</div>
              <v-btn color="primary" class="mt-4" @click="openCreateDialog">
                <v-icon start>mdi-plus</v-icon>
                Add New Record
              </v-btn>
            </div>
          </template>
        </v-data-table>
      </v-card>

      <!-- Create/Edit Dialog -->
      <v-dialog v-model="dialog" max-width="900">
        <v-card>
          <v-card-title class="d-flex align-center">
            <h3 class="text-h5 font-weight-bold mb-0">{{ editMode ? 'Edit Record' : 'Create New Record' }}</h3>
            <v-spacer></v-spacer>
            <v-btn icon="mdi-close" variant="text" @click="dialog = false"></v-btn>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-form ref="form" @submit.prevent="saveRecord">
              <!-- Show one field per row in a structured format -->
              <div 
                v-for="field in editableFields" 
                :key="field.name"
                class="form-field-container"
              >
                <!-- Debugging info - will show actual field name data -->
                <div class="debug-info" style="border: 2px dashed red; padding: 8px; margin-bottom: 10px; background: #ffe6e6;">
                  <strong>Debug - Field Data:</strong>
                  <div>Raw name: "{{ field.name }}"</div>
                  <div>Formatted name: "{{ formatFieldName(field.name) }}"</div>
                  <div>Type: {{ field.dataType || field.type }}</div>
                  <div>Column Type: {{ field.columnType }}</div>
                </div>
                
                <div class="field-label-container mb-2">
                  <div class="field-label">{{ formatFieldName(field.name) }}</div>
                  <div v-if="field.required" class="field-required">*</div>
                  <div class="field-type">{{ getFieldTypeLabel(field) }}</div>
                </div>
                <div v-if="field.description" class="field-description mb-2">
                  {{ field.description }}
                </div>
                
                <!-- Different input types based on field type -->
                <template v-if="field.dataType === 'boolean' || field.columnType === 'tinyint(1)'">
                  <v-switch
                    v-model="formData[field.name]"
                    :hide-details="!field.required"
                    color="primary"
                    :disabled="field.isPrimary && editMode"
                  ></v-switch>
                </template>
                
                <template v-else-if="field.dataType === 'date' || field.dataType.includes('datetime')">
                  <v-menu
                    v-model="dateMenus[field.name]"
                    :close-on-content-click="false"
                    location="end"
                  >
                    <template v-slot:activator="{ props }">
                      <v-text-field
                        v-model="formData[field.name]"
                        :placeholder="formatFieldName(field.name)"
                        prepend-icon="mdi-calendar"
                        readonly
                        v-bind="props"
                        :hide-details="!field.required"
                        :disabled="field.isPrimary && editMode"
                      ></v-text-field>
                    </template>
                    <v-date-picker
                      v-model="formData[field.name]"
                      @update:model-value="dateMenus[field.name] = false"
                    ></v-date-picker>
                  </v-menu>
                </template>
                
                <template v-else-if="field.dataType === 'json' || field.columnType === 'json'">
                  <v-textarea
                    v-model="formData[field.name]"
                    :placeholder="formatFieldName(field.name)"
                    :hide-details="!field.required"
                    auto-grow
                    rows="3"
                    :disabled="field.isPrimary && editMode"
                  ></v-textarea>
                </template>
                
                <template v-else-if="field.dataType === 'text' || field.columnType.includes('text')">
                  <v-textarea
                    v-model="formData[field.name]"
                    :placeholder="formatFieldName(field.name)"
                    :hide-details="!field.required"
                    :disabled="field.isPrimary && editMode"
                  ></v-textarea>
                </template>
                
                <template v-else-if="field.columnType && field.columnType.includes('enum')">
                  <v-select
                    v-model="formData[field.name]"
                    :placeholder="formatFieldName(field.name)"
                    :items="getEnumOptions(field.columnType)"
                    :hide-details="!field.required"
                    :disabled="field.isPrimary && editMode"
                  ></v-select>
                </template>
                
                <template v-else-if="field.name.includes('Id') && !field.isPrimary">
                  <v-autocomplete
                    v-model="formData[field.name]"
                    :placeholder="formatFieldName(field.name)"
                    :items="relatedItems[field.name] || []"
                    item-title="name"
                    item-value="id"
                    :hide-details="!field.required"
                    :disabled="field.isPrimary && editMode"
                    :loading="relatedLoading[field.name]"
                  ></v-autocomplete>
                </template>
                
                <template v-else-if="isNumericType(field.dataType)">
                  <v-text-field
                    v-model.number="formData[field.name]"
                    :placeholder="formatFieldName(field.name)"
                    type="number"
                    :hide-details="!field.required"
                    :disabled="field.isPrimary && editMode"
                  ></v-text-field>
                </template>
                
                <template v-else>
                  <v-text-field
                    v-model="formData[field.name]"
                    :placeholder="formatFieldName(field.name)"
                    :hide-details="!field.required"
                    :disabled="field.isPrimary && editMode"
                  ></v-text-field>
                </template>
              </div>
            </v-form>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions class="pa-4">
            <v-spacer></v-spacer>
            <v-btn 
              variant="tonal" 
              color="grey"
              @click="dialog = false"
            >
              Cancel
            </v-btn>
            <v-btn 
              color="primary" 
              @click="saveRecord" 
              :loading="saving"
            >
              {{ editMode ? 'Update' : 'Create' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      
      <!-- JSON Viewer Dialog -->
      <v-dialog v-model="jsonDialog" max-width="700">
        <v-card>
          <v-card-title>
            JSON Data
            <v-spacer></v-spacer>
            <v-btn icon="mdi-close" variant="text" @click="jsonDialog = false"></v-btn>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="pa-4">
            <pre class="json-viewer">{{ JSON.stringify(jsonData, null, 2) }}</pre>
          </v-card-text>
        </v-card>
      </v-dialog>
      
      <!-- Delete Confirmation Dialog -->
      <v-dialog v-model="deleteDialog" max-width="500">
        <v-card>
          <v-card-title class="text-h5">Confirm Delete</v-card-title>
          <v-card-text>
            Are you sure you want to delete this record? This action cannot be undone.
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="tonal" @click="deleteDialog = false">Cancel</v-btn>
            <v-btn color="error" @click="deleteRecord" :loading="deleting">Delete</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </div>
</template>

<script>
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import axios from 'axios'
import { API_URL } from '@/config'

export default {
  name: 'TableManagement',
  props: {
    table: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const route = useRoute()
    const router = useRouter()
    const toast = useToast()
    
    // Table info
    const tableName = ref('')
    const structure = ref([])
    const showStructure = ref(false)
    
    // Records
    const records = ref([])
    const headers = ref([])
    const totalRecords = ref(0)
    
    // Pagination
    const page = ref(1)
    const limit = ref(10)
    
    // Search
    const search = ref('')
    const sortBy = ref('id')
    const sortDesc = ref(false)
    
    // Loading states
    const loading = ref(true)
    const error = ref(null)
    const saving = ref(false)
    const deleting = ref(false)
    
    // Dialogs
    const dialog = ref(false)
    const editMode = ref(false)
    const deleteDialog = ref(false)
    const jsonDialog = ref(false)
    const jsonData = ref(null)
    const dateMenus = reactive({})
    
    // Form data
    const formData = ref({})
    const recordToDelete = ref(null)
    
    // Related data
    const relatedItems = ref({})
    const relatedLoading = ref({})
    
    // Initialize data
    onMounted(() => {
      tableName.value = props.table
      loadData()
    })
    
    // Load table structure and records
    const loadData = async () => {
      loading.value = true
      error.value = null
      
      try {
        await loadTableStructure()
        await loadRecords()
      } catch (err) {
        console.error('Error loading data:', err)
        error.value = 'Failed to load table data. Please try again.'
        loading.value = false
      }
    }
    
    // Load table structure
    const loadTableStructure = async () => {
      loading.value = true
      console.log('Starting to load table structure for:', props.table);
      
      try {
        // First try with the configured API URL
        const url = `${API_URL}/admin/tables/${props.table}/structure`;
        console.log('Loading table structure from URL:', url);
        
        try {
          const response = await axios.get(url);
          console.log('API Response for table structure:', response.data);
          
          // Extract fields from the response based on the response format
          const fields = response.data.fields || [];
          console.log('Fields extracted from response:', fields.length);
          
          // Map fields to our structure format
          structure.value = fields.map(field => {
            console.log('Processing field:', field.name, field.type);
            return {
              name: field.name || '',
              dataType: field.dataType || field.type || '',
              columnType: field.columnType || field.type || '',
              nullable: field.required === false || field.nullable === true,
              isPrimary: field.isPrimaryKey || false,
              default: field.defaultValue || field.default || null,
              description: field.description || `${field.name || ''} field`,
              auto: field.isAutoIncrement || false,
              required: field.required || false
            };
          });
          
          console.log('Processed structure:', structure.value.length);
          
          // Create data table headers
          headers.value = structure.value.map(column => ({
            title: formatFieldName(column.name),
            key: column.name,
            sortable: true
          }));
          
          // Add actions column
          headers.value.push({
            title: 'Actions',
            key: 'actions',
            sortable: false
          });
        } catch (apiError) {
          console.error('API Error loading table structure:', apiError);
          console.error('API Error details:', apiError.response?.status, apiError.response?.data);
          
          // Fix: Construct the fallback URL correctly using the base origin or localhost
          const baseUrl = window.location.origin; // Use current origin for frontend URLs
          const fallbackUrl = `${baseUrl}/admin/tables/${props.table}/structure`;
          console.log('Trying fallback URL:', fallbackUrl);
          
          const fallbackResponse = await axios.get(fallbackUrl);
          console.log('Fallback response:', fallbackResponse.data);
          
          // Process response similar to above
          const fields = fallbackResponse.data.fields || [];
          console.log('Fields from fallback:', fields.length);
          
          structure.value = fields.map(field => ({
            name: field.name || '',
            dataType: field.dataType || field.type || '',
            columnType: field.columnType || field.type || '',
            nullable: field.required === false || field.nullable === true,
            isPrimary: field.isPrimaryKey || false,
            default: field.defaultValue || field.default || null,
            description: field.description || `${field.name || ''} field`,
            auto: field.isAutoIncrement || false,
            required: field.required || false
          }));
          
          // Create data table headers
          headers.value = structure.value.map(column => ({
            title: formatFieldName(column.name),
            key: column.name,
            sortable: true
          }));
          
          // Add actions column
          headers.value.push({
            title: 'Actions',
            key: 'actions',
            sortable: false
          });
        }
      } catch (err) {
        console.error('Error loading table structure:', err);
        error.value = 'Failed to load table structure. Please make sure the API server is running and the table exists.';
        // Create minimal structure with ID
        structure.value = [{
          name: 'id',
          dataType: 'number',
          columnType: 'number',
          nullable: false,
          isPrimary: true,
          default: null,
          description: 'ID',
          required: true
        }];
        
        // Create minimal headers
        headers.value = [{
          title: 'ID',
          key: 'id',
          sortable: true
        }, {
          title: 'Actions',
          key: 'actions',
          sortable: false
        }];
      } finally {
        loading.value = false;
        console.log('Final structure value:', structure.value.length, 'fields');
      }
    }
    
    // Load table records
    const loadRecords = async () => {
      loading.value = true
      
      try {
        // First try with the configured API URL
        const url = `${API_URL}/admin/tables/${props.table}`;
        console.log('Loading table records from URL:', url);
        
        try {
          const response = await axios.get(url, {
            params: {
              limit: limit.value,
              offset: (page.value - 1) * limit.value,
              sort: sortBy.value,
              order: sortDesc.value ? 'desc' : 'asc'
            }
          });
          
          // Correctly extract records and pagination from the response
          if (response.data && response.data.records) {
            records.value = response.data.records;
            if (response.data.pagination) {
              totalRecords.value = response.data.pagination.total || 0;
            }
          } else if (Array.isArray(response.data)) {
            // Handle case where response is just an array of records
            records.value = response.data;
            totalRecords.value = response.data.length;
          } else {
            // Fallback
            records.value = [];
            totalRecords.value = 0;
          }
        } catch (apiError) {
          console.error('API Error loading records:', apiError);
          console.error('API Error details:', apiError.response?.status, apiError.response?.data);
          
          // Fix: Construct the fallback URL correctly using the base origin or localhost
          const baseUrl = window.location.origin; // Use current origin for frontend URLs
          const fallbackUrl = `${baseUrl}/admin/tables/${props.table}`;
          console.log('Trying fallback URL:', fallbackUrl);
          
          const fallbackResponse = await axios.get(fallbackUrl, {
            params: {
              limit: limit.value,
              offset: (page.value - 1) * limit.value,
              sort: sortBy.value,
              order: sortDesc.value ? 'desc' : 'asc'
            }
          });
          
          // Process response similar to above
          if (fallbackResponse.data && fallbackResponse.data.records) {
            records.value = fallbackResponse.data.records;
            if (fallbackResponse.data.pagination) {
              totalRecords.value = fallbackResponse.data.pagination.total || 0;
            }
          } else if (Array.isArray(fallbackResponse.data)) {
            records.value = fallbackResponse.data;
            totalRecords.value = fallbackResponse.data.length;
          } else {
            records.value = [];
            totalRecords.value = 0;
          }
        }
      } catch (err) {
        console.error('Error loading records:', err);
        records.value = [];
        totalRecords.value = 0;
        error.value = 'Failed to load records. Please check the server logs.';
      } finally {
        loading.value = false;
      }
    }
    
    // Open create dialog
    const openCreateDialog = () => {
      editMode.value = false
      formData.value = {}
      dialog.value = true
    }
    
    // Edit record
    const editRecord = (item) => {
      editMode.value = true
      formData.value = { ...item }
      
      // Load related data if needed
      loadRelatedData()
      
      dialog.value = true
    }
    
    // Load related data for foreign keys
    const loadRelatedData = async () => {
      const foreignKeyFields = structure.value
        .filter(field => field.name.endsWith('Id') && !field.isPrimary)
      
      for (const field of foreignKeyFields) {
        const relatedTable = getRelatedTable(field.name)
        relatedLoading.value[field.name] = true
        
        try {
          const response = await axios.get(`${API_URL}/admin/tables/${relatedTable}`, {
            params: { limit: 100 }
          })
          
          let relatedData = [];
          if (response.data && response.data.records) {
            relatedData = response.data.records;
          } else if (Array.isArray(response.data)) {
            relatedData = response.data;
          }
          
          relatedItems.value[field.name] = relatedData.map(item => ({
            id: item.id,
            name: item.name || item.title || item.fullName || `ID: ${item.id}`
          }))
        } catch (err) {
          console.error(`Error loading related data for ${field.name}:`, err)
        } finally {
          relatedLoading.value[field.name] = false
        }
      }
    }
    
    // Get related table name from field name
    const getRelatedTable = (fieldName) => {
      // Convert userId to users, restaurantId to restaurants, etc.
      const base = fieldName.replace('Id', '')
      return base.endsWith('s') ? `${base}es` : `${base}s`
    }
    
    // Save record
    const saveRecord = async () => {
      saving.value = true
      
      try {
        let response;
        
        if (editMode.value) {
          // Update existing record
          response = await axios.put(
            `${API_URL}/admin/tables/${props.table}/${formData.value.id}`, 
            formData.value
          )
          
          // Check success message from backend response
          if (response.data && response.data.message) {
            toast.success(response.data.message);
          } else {
            toast.success('Record updated successfully');
          }
        } else {
          // Create new record
          response = await axios.post(
            `${API_URL}/admin/tables/${props.table}`, 
            formData.value
          )
          
          // Check success message from backend response
          if (response.data && response.data.message) {
            toast.success(response.data.message);
          } else {
            toast.success('Record created successfully');
          }
        }
        
        // Refresh data
        await loadRecords()
        dialog.value = false
      } catch (err) {
        console.error('Error saving record:', err)
        toast.error(err.response?.data?.message || 'Failed to save record')
      } finally {
        saving.value = false
      }
    }
    
    // Confirm delete
    const confirmDelete = (item) => {
      recordToDelete.value = item
      deleteDialog.value = true
    }
    
    // Delete record
    const deleteRecord = async () => {
      if (!recordToDelete.value || !recordToDelete.value.id) {
        toast.error('Invalid record')
        deleteDialog.value = false
        return
      }
      
      deleting.value = true
      
      try {
        const response = await axios.delete(`${API_URL}/admin/tables/${props.table}/${recordToDelete.value.id}`)
        
        // Check success message from backend response
        if (response.data && response.data.message) {
          toast.success(response.data.message);
        } else {
          toast.success('Record deleted successfully');
        }
        
        // Refresh records
        await loadRecords()
        deleteDialog.value = false
      } catch (err) {
        console.error('Error deleting record:', err)
        toast.error(err.response?.data?.message || 'Failed to delete record')
      } finally {
        deleting.value = false
      }
    }
    
    // View JSON data
    const viewJSON = (data) => {
      try {
        jsonData.value = typeof data === 'string' ? JSON.parse(data) : data
        jsonDialog.value = true
      } catch (err) {
        console.error('Error parsing JSON:', err)
        toast.error('Invalid JSON data')
      }
    }
    
    // Format table name
    const formatTableName = (name) => {
      if (!name) return ''
      return name
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    }
    
    // Format field name with additional context
    const formatFieldName = (fieldName) => {
      if (!fieldName) return 'Unknown Field';
      
      // Handle special cases
      if (fieldName === 'id') return 'ID';
      if (fieldName === 'userId') return 'User ID';
      
      // Handle camelCase
      const spacedName = fieldName
        .replace(/([A-Z])/g, ' $1') // Insert a space before all uppercase letters
        .replace(/([A-Za-z])([0-9])/g, '$1 $2') // Insert a space between letters and numbers
        .replace(/_/g, ' '); // Replace underscores with spaces
      
      // Capitalize the first letter of each word
      return spacedName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    
    // Get editable fields
    const editableFields = computed(() => {
      return structure.value.filter(field => 
        !editMode.value || field.name !== 'id'
      )
    })
    
    // Get field size for layout
    const getFieldColSize = (field) => {
      if (field.dataType === 'text' || field.dataType === 'json' || 
          field.columnType === 'text' || field.columnType === 'json') {
        return 12
      }
      return 6
    }
    
    // Check if field is numeric
    const isNumericType = (type) => {
      if (!type) return false
      const numericTypes = ['int', 'decimal', 'float', 'double', 'bigint', 'tinyint', 'smallint']
      return numericTypes.some(t => type.includes(t))
    }
    
    // Check if value is boolean
    const isBoolean = (value) => {
      return typeof value === 'boolean'
    }
    
    // Check if value is date
    const isDate = (value) => {
      if (!value) return false
      return typeof value === 'string' && 
        (value.includes('T') || value.match(/^\d{4}-\d{2}-\d{2}/))
    }
    
    // Check if value is JSON
    const isJSON = (value) => {
      if (!value) return false
      if (typeof value === 'object') return true
      
      try {
        // Check if string is valid JSON
        JSON.parse(value)
        return true
      } catch (e) {
        return false
      }
    }
    
    // Check if field is an image
    const isImage = (field, value) => {
      if (!value) return false
      const imageFields = ['image', 'logo', 'avatar', 'photo', 'thumbnail', 'cover']
      return imageFields.some(f => field.toLowerCase().includes(f))
    }
    
    // Get image URL
    const getImageUrl = (path) => {
      if (!path) return ''
      
      // If path is absolute URL, return as is
      if (path.startsWith('http')) {
        return path
      }
      
      // Otherwise assume it's a relative path to uploads directory
      return `/uploads/${path.replace(/^\/uploads\//, '')}`
    }
    
    // Truncate text to limit length
    const truncateText = (text) => {
      if (!text) return ''
      
      const str = String(text)
      return str.length > 50 ? `${str.substring(0, 50)}...` : str
    }
    
    // Format date
    const formatDate = (date) => {
      if (!date) return ''
      
      try {
        return new Date(date).toLocaleString()
      } catch (e) {
        return date
      }
    }
    
    // Get enum options from column type
    const getEnumOptions = (columnType) => {
      if (!columnType || !columnType.includes('enum')) return []
      
      try {
        // Extract values from enum('value1','value2',...) format
        const matches = columnType.match(/enum\((.+)\)/)
        if (!matches || !matches[1]) return []
        
        // Split by comma and remove quotes
        return matches[1]
          .split(',')
          .map(option => option.replace(/['"]/g, '').trim())
      } catch (e) {
        console.error('Error parsing enum options:', e)
        return []
      }
    }
    
    // Get user-friendly field type label
    const getFieldTypeLabel = (field) => {
      if (field.dataType === 'boolean' || field.columnType === 'tinyint(1)') {
        return '(Yes/No)';
      } else if (field.dataType === 'date' || field.dataType.includes('datetime')) {
        return '(Date)';
      } else if (field.dataType === 'json' || field.columnType === 'json') {
        return '(JSON)';
      } else if (field.dataType === 'text' || field.columnType.includes('text')) {
        return '(Text)';
      } else if (field.columnType && field.columnType.includes('enum')) {
        return '(Selection)';
      } else if (isNumericType(field.dataType)) {
        return '(Number)';
      } else if (field.name.includes('Id') && !field.isPrimary) {
        return '(Relationship)';
      } else {
        return '(Text)';
      }
    }
    
    // Watch for table changes
    watch(() => props.table, () => {
      loadTableStructure()
    })
    
    return {
      tableName,
      structure,
      showStructure,
      records,
      headers,
      totalRecords,
      page,
      limit,
      search,
      loading,
      error,
      dialog,
      editMode,
      formData,
      saving,
      deleting,
      deleteDialog,
      jsonDialog,
      jsonData,
      dateMenus,
      relatedItems,
      relatedLoading,
      editableFields,
      formatTableName,
      formatFieldName,
      loadData,
      loadRecords,
      openCreateDialog,
      editRecord,
      saveRecord,
      confirmDelete,
      deleteRecord,
      viewJSON,
      isBoolean,
      isDate,
      isJSON,
      isImage,
      getImageUrl,
      truncateText,
      formatDate,
      getFieldColSize,
      isNumericType,
      getEnumOptions,
      getFieldTypeLabel
    }
  }
}
</script>

<style scoped>
.json-viewer {
  background-color: #f5f5f5;
  border-radius: 4px;
  padding: 16px;
  overflow: auto;
  max-height: 400px;
  font-family: monospace;
  white-space: pre-wrap;
}

.v-data-table {
  border-radius: 8px;
}

.form-field-container {
  margin-bottom: 16px;
  padding: 16px;
  border-radius: 6px;
  background-color: rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.field-label-container {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  background-color: rgba(25, 118, 210, 0.08);
  padding: 8px 12px;
  border-radius: 4px;
  border-left: 3px solid #1976d2;
}

.field-label {
  font-weight: 600;
  color: rgba(0, 0, 0, 0.8);
  font-size: 15px;
  margin-right: 8px;
  flex: 1;
}

.field-required {
  background-color: rgba(255, 0, 0, 0.1);
  color: rgba(255, 0, 0, 0.8);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  margin-right: 8px;
  white-space: nowrap;
}

.field-type {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
}

.field-description {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.7);
  margin-top: -8px;
  margin-bottom: 8px;
  padding: 0 4px;
}

.field-row {
  transition: all 0.2s ease-in-out;
}

.field-row:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.field-header {
  border-top-left-radius: 0.25rem;
  border-top-right-radius: 0.25rem;
}
</style> 