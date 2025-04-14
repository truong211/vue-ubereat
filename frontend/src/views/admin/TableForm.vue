<template>
  <div class="table-form">
    <v-card>
      <v-card-title class="text-h5">
        {{ isEdit ? 'Edit' : 'Create' }} {{ formattedTableName }}
      </v-card-title>
      
      <v-card-text>
        <v-form ref="form" @submit.prevent="saveRecord">
          <div v-if="loading" class="d-flex justify-center align-center pa-4">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
          </div>
          
          <template v-else>
            <!-- Each field gets its own row -->
            <div class="form-field-container" v-for="(field, index) in formFields" :key="index">
              <div class="field-label mb-2">{{ formatFieldLabel(field.name) }}</div>
              
              <!-- Text field for most types -->
              <v-text-field
                v-if="isTextField(field)"
                v-model="formData[field.name]"
                :placeholder="field.placeholder || formatFieldLabel(field.name)"
                :hint="field.hint"
                :rules="field.rules"
                :disabled="field.name === 'id' || field.auto"
                :type="getFieldType(field)"
                density="comfortable"
                class="mb-4"
              ></v-text-field>
              
              <!-- Textarea for long text -->
              <v-textarea
                v-else-if="isTextareaField(field)"
                v-model="formData[field.name]"
                :placeholder="field.placeholder || formatFieldLabel(field.name)"
                :hint="field.hint"
                :rules="field.rules"
                rows="4"
                density="comfortable"
                class="mb-4"
              ></v-textarea>
              
              <!-- Select for enum types -->
              <v-select
                v-else-if="isEnumField(field)"
                v-model="formData[field.name]"
                :placeholder="formatFieldLabel(field.name)"
                :items="field.options"
                :hint="field.hint"
                :rules="field.rules"
                density="comfortable"
                class="mb-4"
              ></v-select>
              
              <!-- Checkbox for boolean fields -->
              <v-checkbox
                v-else-if="isBooleanField(field)"
                v-model="formData[field.name]"
                :hint="field.hint"
                :rules="field.rules"
                density="comfortable"
                class="mb-4"
              ></v-checkbox>
              
              <!-- Date picker for date fields -->
              <v-menu
                v-else-if="isDateField(field)"
                v-model="dateMenus[field.name]"
                :close-on-content-click="false"
                :nudge-right="40"
                transition="scale-transition"
                offset-y
                min-width="auto"
                class="mb-4"
              >
                <template v-slot:activator="{ props }">
                  <v-text-field
                    v-model="formData[field.name]"
                    :placeholder="formatFieldLabel(field.name)"
                    prepend-icon="mdi-calendar"
                    readonly
                    v-bind="props"
                    density="comfortable"
                  ></v-text-field>
                </template>
                <v-date-picker
                  v-model="formData[field.name]"
                  @input="dateMenus[field.name] = false"
                ></v-date-picker>
              </v-menu>
              
              <!-- JSON editor for JSON fields -->
              <div v-else-if="isJSONField(field)" class="mb-4">
                <v-textarea
                  v-model="jsonStrings[field.name]"
                  :placeholder="'Enter valid JSON data'"
                  :error-messages="jsonErrors[field.name]"
                  @input="validateJSON(field.name)"
                  rows="8"
                  auto-grow
                  density="comfortable"
                  monospace
                ></v-textarea>
              </div>
              
              <!-- Foreign key selector -->
              <v-autocomplete
                v-else-if="isForeignKey(field)"
                v-model="formData[field.name]"
                :placeholder="formatFieldLabel(field.name)"
                :items="foreignKeyOptions[field.name]"
                :loading="foreignKeyLoading[field.name]"
                :item-title="foreignKeyDisplayFields[field.name] || 'name'"
                item-value="id"
                :hint="field.hint"
                :rules="field.rules"
                density="comfortable"
                clearable
                @focus="loadForeignKeyOptions(field)"
                class="mb-4"
              ></v-autocomplete>
            </div>
          </template>
        </v-form>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          variant="text"
          :to="`/admin/tables/${tableName}`"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          :loading="saving"
          @click="saveRecord"
        >
          {{ isEdit ? 'Update' : 'Create' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import axios from 'axios'

export default {
  name: 'TableForm',
  
  props: {
    tableName: {
      type: String,
      required: true
    },
    isEdit: {
      type: Boolean,
      default: false
    },
    id: {
      type: [String, Number],
      default: null
    }
  },
  
  setup(props) {
    const route = useRoute()
    const router = useRouter()
    const toast = useToast()
    const form = ref(null)
    
    // Form state
    const loading = ref(true)
    const saving = ref(false)
    const formData = ref({})
    const formFields = ref([])
    const jsonStrings = ref({})
    const jsonErrors = ref({})
    const dateMenus = ref({})
    
    // Foreign key handling
    const foreignKeyTables = ref({})
    const foreignKeyOptions = ref({})
    const foreignKeyLoading = ref({})
    const foreignKeyDisplayFields = ref({})
    
    // Field type mapping
    const fieldTypeMap = {
      'VARCHAR': 'text',
      'CHAR': 'text',
      'TEXT': 'textarea',
      'MEDIUMTEXT': 'textarea',
      'LONGTEXT': 'textarea',
      'INT': 'number',
      'TINYINT': 'number',
      'SMALLINT': 'number',
      'MEDIUMINT': 'number',
      'BIGINT': 'number',
      'FLOAT': 'number',
      'DOUBLE': 'number',
      'DECIMAL': 'number',
      'DATE': 'date',
      'DATETIME': 'datetime-local',
      'TIMESTAMP': 'datetime-local',
      'TIME': 'time',
      'YEAR': 'number',
      'BOOLEAN': 'checkbox',
      'BOOL': 'checkbox',
      'ENUM': 'select',
      'SET': 'select',
      'JSON': 'json'
    }
    
    // Computed properties
    const formattedTableName = computed(() => {
      return props.tableName
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    })
    
    // Methods
    const loadStructure = async () => {
      loading.value = true
      
      try {
        // Use API_URL from config if available
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const url = `${baseUrl}/api/admin/tables/${props.tableName}/structure`;
        
        console.log('Loading table structure from:', url);
        const response = await axios.get(url);
        formFields.value = response.data.fields || [];
        
        // Initialize JSON string fields
        formFields.value.forEach(field => {
          if (field.type === 'json' && formData.value[field.name]) {
            jsonStrings.value[field.name] = JSON.stringify(formData.value[field.name], null, 2);
          }
        });
        
        // Initialize foreign key data
        initializeForeignKeyData();
      } catch (error) {
        console.error('Error loading table structure:', error);
        if (error.response?.status === 404) {
          try {
            // Try fallback direct URL
            const baseUrl = window.location.origin; // Use current origin for frontend URLs
            const fallbackUrl = `${baseUrl}/admin/tables/${props.tableName}/structure`;
            console.log('Trying fallback URL:', fallbackUrl);
            
            const fallbackResponse = await axios.get(fallbackUrl);
            formFields.value = fallbackResponse.data.fields || [];
            
            // Initialize JSON string fields
            formFields.value.forEach(field => {
              if (field.type === 'json' && formData.value[field.name]) {
                jsonStrings.value[field.name] = JSON.stringify(formData.value[field.name], null, 2);
              }
            });
            
            // Initialize foreign key data
            initializeForeignKeyData();
          } catch (fallbackError) {
            console.error('Fallback call also failed:', fallbackError);
            toast.error('Failed to load table structure');
          }
        } else {
          toast.error('Failed to load table structure');
        }
      } finally {
        loading.value = false
      }
    }
    
    const loadRecord = async () => {
      if (!props.isEdit || !props.id) return;
      
      loading.value = true;
      
      try {
        // Use API_URL from config if available
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const url = `${baseUrl}/api/admin/tables/${props.tableName}/${props.id}`;
        
        console.log('Loading record from:', url);
        const response = await axios.get(url);
        formData.value = response.data;
        
        // Handle JSON fields
        for (const field in formData.value) {
          const fieldDef = formFields.value.find(f => f.name === field);
          
          if (fieldDef?.type === 'json' && formData.value[field]) {
            try {
              // If it's already a JSON object
              if (typeof formData.value[field] === 'object') {
                jsonStrings.value[field] = JSON.stringify(formData.value[field], null, 2);
              } else {
                // If it's a JSON string
                const parsed = JSON.parse(formData.value[field]);
                jsonStrings.value[field] = JSON.stringify(parsed, null, 2);
                formData.value[field] = parsed;
              }
            } catch (e) {
              console.error(`Error parsing JSON for field ${field}:`, e);
              jsonStrings.value[field] = formData.value[field];
            }
          }
        }
      } catch (error) {
        console.error('Error loading record:', error);
        if (error.response?.status === 404) {
          try {
            // Try fallback direct URL
            const baseUrl = window.location.origin; // Use current origin for frontend URLs
            const fallbackUrl = `${baseUrl}/admin/tables/${props.tableName}/${props.id}`;
            console.log('Trying fallback URL:', fallbackUrl);
            
            const fallbackResponse = await axios.get(fallbackUrl);
            formData.value = fallbackResponse.data;
            
            // Handle JSON fields
            for (const field in formData.value) {
              const fieldDef = formFields.value.find(f => f.name === field);
              
              if (fieldDef?.type === 'json' && formData.value[field]) {
                try {
                  // If it's already a JSON object
                  if (typeof formData.value[field] === 'object') {
                    jsonStrings.value[field] = JSON.stringify(formData.value[field], null, 2);
                  } else {
                    // If it's a JSON string
                    const parsed = JSON.parse(formData.value[field]);
                    jsonStrings.value[field] = JSON.stringify(parsed, null, 2);
                    formData.value[field] = parsed;
                  }
                } catch (e) {
                  console.error(`Error parsing JSON for field ${field}:`, e);
                  jsonStrings.value[field] = formData.value[field];
                }
              }
            }
          } catch (fallbackError) {
            console.error('Fallback call also failed:', fallbackError);
            toast.error('Failed to load record');
          }
        } else {
          toast.error('Failed to load record');
        }
      } finally {
        loading.value = false;
      }
    }
    
    const loadForeignKeyOptions = async (field) => {
      const tableName = foreignKeyTables.value[field.name]
      
      // Skip if already loaded or no table defined
      if (!tableName || foreignKeyOptions.value[field.name].length > 0) {
        return
      }
      
      foreignKeyLoading.value[field.name] = true
      
      try {
        // Get display field name
        const displayField = foreignKeyDisplayFields.value[field.name]
        
        // Use proper URL construction with API base
        // Construct API URL using environment variable
        const apiUrl = import.meta.env.VITE_API_URL || ''; // Fallback to empty string if not set
        const url = `${apiUrl}/api/admin/tables/${tableName}`;
        
        console.log('Loading foreign key options from:', url);
        
        // Fetch options from the foreign table
        const response = await axios.get(url, {
          params: { limit: 100 }
        });
        
        // Process the response data based on its format
        let data = [];
        if (response.data && response.data.records) {
          data = response.data.records;
        } else if (Array.isArray(response.data)) {
          data = response.data;
        } else if (response.data && response.data.data) {
          data = response.data.data;
        }
        
        // Map data to options format
        foreignKeyOptions.value[field.name] = data.map(item => ({
          id: item.id,
          [displayField]: item[displayField] || item.name || item.title || `ID: ${item.id}`
        }));
      } catch (error) {
        console.error(`Error loading ${field.name} options:`, error);
        
        // Try alternative URL as fallback
          try {
            const baseUrl = window.location.origin; // Use current origin for frontend URLs
          const fallbackUrl = `${baseUrl}/admin/tables/${tableName}`;
            console.log('Trying fallback URL:', fallbackUrl);
            
            const fallbackResponse = await axios.get(fallbackUrl, {
              params: { limit: 100 }
          });
          
          // Process the fallback response
          let data = [];
          if (fallbackResponse.data && fallbackResponse.data.records) {
            data = fallbackResponse.data.records;
          } else if (Array.isArray(fallbackResponse.data)) {
            data = fallbackResponse.data;
          } else if (fallbackResponse.data && fallbackResponse.data.data) {
            data = fallbackResponse.data.data;
          }
          
          // Get display field name
          const displayField = foreignKeyDisplayFields.value[field.name];
            
            // Map data to options format
          foreignKeyOptions.value[field.name] = data.map(item => ({
              id: item.id,
              [displayField]: item[displayField] || item.name || item.title || `ID: ${item.id}`
          }));
          } catch (fallbackError) {
          console.error('Fallback API call also failed:', fallbackError);
          toast.error(`Failed to load ${formatFieldLabel(field.name)} options`);
        }
      } finally {
        foreignKeyLoading.value[field.name] = false
      }
    }
    
    const validateJSON = (fieldName) => {
      try {
        JSON.parse(jsonStrings.value[fieldName])
        jsonErrors.value[fieldName] = null
        return true
      } catch (error) {
        jsonErrors.value[fieldName] = 'Invalid JSON format'
        return false
      }
    }
    
    const saveRecord = async () => {
      // Validate all JSON fields
      let jsonValid = true
      Object.keys(jsonStrings.value).forEach(field => {
        if (!validateJSON(field)) {
          jsonValid = false
        } else {
          // Update formData with parsed JSON
          formData.value[field] = JSON.parse(jsonStrings.value[field])
        }
      })
      
      if (!jsonValid) {
        toast.error('Please correct the JSON format errors')
        return
      }
      
      // Validate form
      if (form.value) {
        const { valid } = await form.value.validate()
        if (!valid) {
          toast.error('Please fill all required fields correctly')
          return
        }
      }
      
      saving.value = true
      
      try {
        let response
        
        // Use proper URL construction
        // Base URL for API calls is handled by Axios instance or constructed below
        
        if (props.isEdit) {
          // Update existing record
          const apiUrl = import.meta.env.VITE_API_URL || ''; // Fallback to empty string
          const url = `${apiUrl}/api/admin/tables/${props.tableName}/${props.id}`;
          console.log('Updating record at:', url);
          
          response = await axios.put(url, formData.value);
          toast.success('Record updated successfully');
        } else {
          // Create new record
          const apiUrl = import.meta.env.VITE_API_URL || ''; // Fallback to empty string
          const url = `${apiUrl}/api/admin/tables/${props.tableName}`;
          console.log('Creating record at:', url);
          
          response = await axios.post(url, formData.value);
          toast.success('Record created successfully');
        }
        
        // Redirect back to table list
        router.push(`/admin/tables/${props.tableName}`);
      } catch (error) {
        console.error('Error saving record:', error);
        
        // Try fallback URL
          try {
            const baseUrl = window.location.origin; // Use current origin for fallback API URL attempt
            
            if (props.isEdit) {
              // Update existing record
              const fallbackUrl = `${baseUrl}/admin/tables/${props.tableName}/${props.id}`;
              console.log('Trying fallback URL for update:', fallbackUrl);
              
              const fallbackResponse = await axios.put(fallbackUrl, formData.value);
              toast.success('Record updated successfully');
            } else {
              // Create new record
              const fallbackUrl = `${baseUrl}/admin/tables/${props.tableName}`;
              console.log('Trying fallback URL for create:', fallbackUrl);
              
              const fallbackResponse = await axios.post(fallbackUrl, formData.value);
              toast.success('Record created successfully');
          }
              
              // Redirect back to table list
              router.push(`/admin/tables/${props.tableName}`);
          } catch (fallbackError) {
          console.error('Fallback request also failed:', fallbackError);
          toast.error(error.response?.data?.message || 'Failed to save record');
        }
      } finally {
        saving.value = false;
      }
    }
    
    const formatFieldLabel = (name) => {
      // First handle the special case of names ending with 'Id'
      if (name.endsWith('Id') && name !== 'id') {
        // Convert 'restaurantId' to 'Restaurant'
        const baseName = name.substring(0, name.length - 2);
        return baseName.charAt(0).toUpperCase() + baseName.slice(1);
      }
      
      // Normal case: Convert snake_case or camelCase to Title Case
      return name
        .replace(/([A-Z])/g, ' $1') // Insert a space before all uppercase letters
        .split(/[_\s]/) // Split by underscore or space
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
        .trim();
    }
    
    const getFieldType = (field) => {
      switch (field.type) {
        case 'number':
          return 'number'
        case 'password':
          return 'password'
        case 'email':
          return 'email'
        case 'tel':
          return 'tel'
        case 'url':
          return 'url'
        case 'date':
          return 'date'
        case 'datetime-local':
          return 'datetime-local'
        case 'time':
          return 'time'
        default:
          return 'text'
      }
    }
    
    const isTextField = (field) => {
      return ['text', 'password', 'email', 'tel', 'url', 'number'].includes(field.type)
    }
    
    const isTextareaField = (field) => {
      return field.type === 'textarea'
    }
    
    const isEnumField = (field) => {
      return field.type === 'select'
    }
    
    const isBooleanField = (field) => {
      return field.type === 'checkbox'
    }
    
    const isDateField = (field) => {
      return field.type === 'date' || field.type === 'datetime-local' || field.type === 'time'
    }
    
    const isJSONField = (field) => {
      return field.type === 'json' || field.dataType === 'JSON'
    }
    
    const isForeignKey = (field) => {
      return field.name.endsWith('Id') && field.name !== 'id' && foreignKeyTables.value[field.name]
    }
    
    const initializeForeignKeyData = () => {
      formFields.value.forEach(field => {
        if (field.name.endsWith('Id') && field.name !== 'id') {
          const foreignTable = field.name.replace('Id', '')
          if (foreignTable) {
            foreignKeyTables.value[field.name] = foreignTable
            foreignKeyOptions.value[field.name] = []
            foreignKeyLoading.value[field.name] = false
            
            // Set display field based on table
            if (foreignTable === 'user') {
              foreignKeyDisplayFields.value[field.name] = 'username'
            } else if (foreignTable === 'restaurant') {
              foreignKeyDisplayFields.value[field.name] = 'name'
            } else if (foreignTable === 'product') {
              foreignKeyDisplayFields.value[field.name] = 'name'
            } else {
              foreignKeyDisplayFields.value[field.name] = 'name'
            }
          }
        }
      })
    }
    
    // Load table structure on mount
    onMounted(() => {
      loadStructure()
    })
    
    return {
      form,
      loading,
      saving,
      formData,
      formFields,
      formattedTableName,
      jsonStrings,
      jsonErrors,
      dateMenus,
      foreignKeyOptions,
      foreignKeyLoading,
      foreignKeyDisplayFields,
      saveRecord,
      formatFieldLabel,
      getFieldType,
      isTextField,
      isTextareaField,
      isEnumField,
      isBooleanField,
      isDateField,
      isJSONField,
      isForeignKey,
      validateJSON
    }
  }
}
</script>

<style scoped>
.table-form {
  padding: 16px;
}

.form-field-container {
  margin-bottom: 16px;
  padding: 12px 8px;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.02);
}

.field-label {
  font-weight: 600;
  color: rgba(0, 0, 0, 0.8);
  font-size: 14px;
  margin-bottom: 8px;
  padding-left: 4px;
}

.monospace {
  font-family: monospace;
}

/* Add a little extra styling for the last field to avoid double bottom dividers */
.form-field-container:last-child .mb-3 {
  display: none;
}
</style> 