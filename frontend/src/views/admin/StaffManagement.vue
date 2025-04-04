<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Staff Management</h1>
        
        <v-card>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="search"
                  label="Search by name or email"
                  prepend-inner-icon="mdi-magnify"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="roleFilter"
                  :items="['All Roles', 'admin', 'restaurant', 'driver']"
                  label="Role"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                ></v-select>
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="permissionGroupFilter"
                  :items="['All Groups', 'basic', 'standard', 'manager', 'admin']"
                  label="Permission Group"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                ></v-select>
              </v-col>
              <v-col cols="12" md="2" class="d-flex align-center">
                <v-btn
                  color="primary"
                  prepend-icon="mdi-refresh"
                  @click="loadStaff"
                  variant="tonal"
                >
                  Refresh
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12">
        <v-data-table
          :headers="headers"
          :items="filteredStaff"
          :loading="loading"
          item-value="id"
          class="elevation-1"
        >
          <template v-slot:item.role="{ item }">
            <v-chip
              :color="getRoleColor(item.role)"
              size="small"
              text-color="white"
            >
              {{ item.role }}
            </v-chip>
          </template>
          
          <template v-slot:item.permissions.permissionGroup="{ item }">
            <v-chip
              v-if="item.permissions"
              :color="getPermissionGroupColor(item.permissions.permissionGroup)"
              size="small"
              text-color="white"
            >
              {{ item.permissions.permissionGroup }}
            </v-chip>
            <v-chip
              v-else
              color="grey"
              size="small"
              text-color="white"
            >
              Not Set
            </v-chip>
          </template>
          
          <template v-slot:item.actions="{ item }">
            <v-btn
              icon
              variant="text"
              density="comfortable"
              color="primary"
              @click="editStaffPermissions(item)"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
    
    <!-- Edit Staff Permissions Dialog -->
    <v-dialog v-model="editDialog" max-width="900px">
      <v-card>
        <v-card-title class="text-h5">
          Edit Staff Permissions
        </v-card-title>
        
        <v-card-text>
          <div v-if="selectedStaff" class="mt-2">
            <div class="d-flex mb-4">
              <div>
                <div class="text-h6">{{ selectedStaff.fullName }}</div>
                <div class="text-body-1 text-medium-emphasis">{{ selectedStaff.email }}</div>
                <div class="mt-1">
                  <v-chip
                    :color="getRoleColor(selectedStaff.role)"
                    size="small"
                    text-color="white"
                  >
                    {{ selectedStaff.role }}
                  </v-chip>
                </div>
              </div>
              
              <v-spacer></v-spacer>
              
              <div>
                <v-select
                  v-model="editedPermissions.permissionGroup"
                  :items="['basic', 'standard', 'manager', 'admin']"
                  label="Permission Group"
                  density="comfortable"
                  variant="outlined"
                  @update:model-value="applyPermissionGroup"
                ></v-select>
              </div>
            </div>
            
            <v-divider class="mb-4"></v-divider>
            
            <v-row>
              <!-- Order Management Permissions -->
              <v-col cols="12" md="6">
                <div class="text-subtitle-1 font-weight-bold mb-2">Order Management</div>
                <v-switch
                  v-model="editedPermissions.canViewOrders"
                  label="View Orders"
                  color="primary"
                  hide-details
                  class="mb-2"
                ></v-switch>
                <v-switch
                  v-model="editedPermissions.canManageOrders"
                  label="Manage Orders"
                  color="primary"
                  hide-details
                  class="mb-2"
                ></v-switch>
                <v-switch
                  v-model="editedPermissions.canCancelOrders"
                  label="Cancel Orders"
                  color="primary"
                  hide-details
                  class="mb-2"
                ></v-switch>
                <v-switch
                  v-model="editedPermissions.canAssignDrivers"
                  label="Assign Drivers"
                  color="primary"
                  hide-details
                ></v-switch>
              </v-col>
              
              <!-- Delivery Management Permissions -->
              <v-col cols="12" md="6">
                <div class="text-subtitle-1 font-weight-bold mb-2">Delivery Management</div>
                <v-switch
                  v-model="editedPermissions.canViewDeliveries"
                  label="View Deliveries"
                  color="primary"
                  hide-details
                  class="mb-2"
                ></v-switch>
                <v-switch
                  v-model="editedPermissions.canManageDeliveries"
                  label="Manage Deliveries"
                  color="primary"
                  hide-details
                  class="mb-2"
                ></v-switch>
                <v-switch
                  v-model="editedPermissions.canConfigureDeliveryZones"
                  label="Configure Delivery Zones"
                  color="primary"
                  hide-details
                  class="mb-2"
                ></v-switch>
                <v-switch
                  v-model="editedPermissions.canSetDeliveryFees"
                  label="Set Delivery Fees"
                  color="primary"
                  hide-details
                ></v-switch>
              </v-col>
              
              <!-- Restaurant Management Permissions -->
              <v-col cols="12" md="6">
                <div class="text-subtitle-1 font-weight-bold mb-2">Restaurant Management</div>
                <v-switch
                  v-model="editedPermissions.canManageMenu"
                  label="Manage Menu"
                  color="primary"
                  hide-details
                  class="mb-2"
                ></v-switch>
                <v-switch
                  v-model="editedPermissions.canManageRestaurantSettings"
                  label="Manage Restaurant Settings"
                  color="primary"
                  hide-details
                ></v-switch>
              </v-col>
              
              <!-- Admin Permissions -->
              <v-col cols="12" md="6">
                <div class="text-subtitle-1 font-weight-bold mb-2">Admin Privileges</div>
                <v-switch
                  v-model="editedPermissions.canManageUsers"
                  label="Manage Users"
                  color="primary"
                  hide-details
                  class="mb-2"
                ></v-switch>
                <v-switch
                  v-model="editedPermissions.canManageSettings"
                  label="Manage System Settings"
                  color="primary"
                  hide-details
                ></v-switch>
              </v-col>
            </v-row>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="error"
            variant="text"
            @click="editDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="saving"
            @click="savePermissions"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Snackbar for notifications -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
    >
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script>
import { ref, computed, onMounted, reactive } from 'vue';
import axios from 'axios';

export default {
  name: 'StaffManagement',
  
  setup() {
    const loading = ref(false);
    const saving = ref(false);
    const search = ref('');
    const roleFilter = ref('All Roles');
    const permissionGroupFilter = ref('All Groups');
    const staff = ref([]);
    const editDialog = ref(false);
    const selectedStaff = ref(null);
    const editedPermissions = ref({});
    
    const snackbar = reactive({
      show: false,
      text: '',
      color: 'success'
    });
    
    const headers = [
      { title: 'ID', key: 'id', sortable: true, width: '80px' },
      { title: 'Name', key: 'fullName', sortable: true },
      { title: 'Email', key: 'email', sortable: true },
      { title: 'Role', key: 'role', sortable: true, width: '120px' },
      { title: 'Permission Group', key: 'permissions.permissionGroup', sortable: true, width: '150px' },
      { title: 'Actions', key: 'actions', sortable: false, align: 'end', width: '100px' }
    ];
    
    const filteredStaff = computed(() => {
      let filtered = [...staff.value];
      
      // Apply search filter
      if (search.value) {
        const searchLower = search.value.toLowerCase();
        filtered = filtered.filter(item => 
          item.fullName.toLowerCase().includes(searchLower) || 
          item.email.toLowerCase().includes(searchLower)
        );
      }
      
      // Apply role filter
      if (roleFilter.value !== 'All Roles') {
        filtered = filtered.filter(item => item.role === roleFilter.value);
      }
      
      // Apply permission group filter
      if (permissionGroupFilter.value !== 'All Groups') {
        filtered = filtered.filter(item => 
          item.permissions && 
          item.permissions.permissionGroup === permissionGroupFilter.value
        );
      }
      
      return filtered;
    });
    
    const loadStaff = async () => {
      loading.value = true;
      try {
        // Load staff with employee-like roles (admin, restaurant, driver)
        const response = await axios.get('/api/users?roles=admin,restaurant,driver');
        staff.value = response.data.data;
        
        // Load permissions for each staff member
        const userIds = staff.value.map(user => user.id);
        const permissionsResponse = await axios.get('/api/staff-permissions');
        const permissions = permissionsResponse.data.data;
        
        // Attach permissions to staff members
        staff.value.forEach(user => {
          const userPermission = permissions.find(p => p.userId === user.id);
          user.permissions = userPermission || null;
        });
      } catch (error) {
        showSnackbar('Error loading staff data', 'error');
        console.error('Error loading staff:', error);
      } finally {
        loading.value = false;
      }
    };
    
    const editStaffPermissions = (item) => {
      selectedStaff.value = item;
      
      if (item.permissions) {
        // Use existing permissions
        editedPermissions.value = { ...item.permissions };
      } else {
        // Create default permissions based on role
        editedPermissions.value = {
          userId: item.id,
          permissionGroup: 'basic',
          canViewOrders: true,
          canManageOrders: false,
          canCancelOrders: false,
          canAssignDrivers: false,
          canViewDeliveries: true,
          canManageDeliveries: false,
          canConfigureDeliveryZones: false,
          canSetDeliveryFees: false,
          canManageMenu: false,
          canManageRestaurantSettings: false,
          canManageUsers: false,
          canManageSettings: false
        };
        
        // Apply role-based defaults
        if (item.role === 'admin') {
          editedPermissions.value.permissionGroup = 'admin';
          Object.keys(editedPermissions.value).forEach(key => {
            if (key !== 'userId' && key !== 'permissionGroup') {
              editedPermissions.value[key] = true;
            }
          });
        } else if (item.role === 'restaurant') {
          editedPermissions.value.permissionGroup = 'manager';
          editedPermissions.value.canManageOrders = true;
          editedPermissions.value.canViewDeliveries = true;
          editedPermissions.value.canManageMenu = true;
          editedPermissions.value.canManageRestaurantSettings = true;
        } else if (item.role === 'driver') {
          editedPermissions.value.canViewDeliveries = true;
          editedPermissions.value.canManageDeliveries = true;
        }
      }
      
      editDialog.value = true;
    };
    
    const applyPermissionGroup = () => {
      const group = editedPermissions.value.permissionGroup;
      
      // Apply template based on selected group
      if (group === 'basic') {
        editedPermissions.value = {
          ...editedPermissions.value,
          canViewOrders: true,
          canManageOrders: false,
          canCancelOrders: false,
          canAssignDrivers: false,
          canViewDeliveries: true,
          canManageDeliveries: false,
          canConfigureDeliveryZones: false,
          canSetDeliveryFees: false,
          canManageMenu: false,
          canManageRestaurantSettings: false,
          canManageUsers: false,
          canManageSettings: false
        };
      } else if (group === 'standard') {
        editedPermissions.value = {
          ...editedPermissions.value,
          canViewOrders: true,
          canManageOrders: true,
          canCancelOrders: false,
          canAssignDrivers: false,
          canViewDeliveries: true,
          canManageDeliveries: false,
          canConfigureDeliveryZones: false,
          canSetDeliveryFees: false,
          canManageMenu: false,
          canManageRestaurantSettings: false,
          canManageUsers: false,
          canManageSettings: false
        };
      } else if (group === 'manager') {
        editedPermissions.value = {
          ...editedPermissions.value,
          canViewOrders: true,
          canManageOrders: true,
          canCancelOrders: true,
          canAssignDrivers: true,
          canViewDeliveries: true,
          canManageDeliveries: true,
          canConfigureDeliveryZones: true,
          canSetDeliveryFees: true,
          canManageMenu: true,
          canManageRestaurantSettings: true,
          canManageUsers: false,
          canManageSettings: false
        };
      } else if (group === 'admin') {
        editedPermissions.value = {
          ...editedPermissions.value,
          canViewOrders: true,
          canManageOrders: true,
          canCancelOrders: true,
          canAssignDrivers: true,
          canViewDeliveries: true,
          canManageDeliveries: true,
          canConfigureDeliveryZones: true,
          canSetDeliveryFees: true,
          canManageMenu: true,
          canManageRestaurantSettings: true,
          canManageUsers: true,
          canManageSettings: true
        };
      }
    };
    
    const savePermissions = async () => {
      saving.value = true;
      try {
        if (selectedStaff.value.permissions) {
          // Update existing permissions
          await axios.put(
            `/api/staff-permissions/${selectedStaff.value.permissions.id}`,
            editedPermissions.value
          );
          showSnackbar('Permissions updated successfully');
        } else {
          // Create new permissions
          const response = await axios.post(
            '/api/staff-permissions',
            editedPermissions.value
          );
          // Attach the new permissions to the staff member
          selectedStaff.value.permissions = response.data.data;
          showSnackbar('Permissions created successfully');
        }
        
        // Refresh staff data to get updated permissions
        await loadStaff();
        editDialog.value = false;
      } catch (error) {
        showSnackbar('Error saving permissions', 'error');
        console.error('Error saving permissions:', error);
      } finally {
        saving.value = false;
      }
    };
    
    const showSnackbar = (text, color = 'success') => {
      snackbar.text = text;
      snackbar.color = color;
      snackbar.show = true;
    };
    
    const getRoleColor = (role) => {
      switch (role) {
        case 'admin': return 'red-darken-1';
        case 'restaurant': return 'amber-darken-2';
        case 'driver': return 'blue-darken-1';
        default: return 'grey';
      }
    };
    
    const getPermissionGroupColor = (group) => {
      switch (group) {
        case 'admin': return 'purple-darken-1';
        case 'manager': return 'indigo-darken-1';
        case 'standard': return 'teal-darken-1';
        case 'basic': return 'green-darken-1';
        default: return 'grey';
      }
    };
    
    onMounted(() => {
      loadStaff();
    });
    
    return {
      loading,
      saving,
      search,
      roleFilter,
      permissionGroupFilter,
      headers,
      staff,
      filteredStaff,
      editDialog,
      selectedStaff,
      editedPermissions,
      snackbar,
      loadStaff,
      editStaffPermissions,
      applyPermissionGroup,
      savePermissions,
      getRoleColor,
      getPermissionGroupColor
    };
  }
};
</script> 