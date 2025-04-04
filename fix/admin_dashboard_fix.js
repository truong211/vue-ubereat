// Fix for admin dashboard to prevent navigation to invalid tables

// For Dashboard.vue or similar admin navigation component

import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useToast } from 'vue-toastification';

export default {
  name: 'AdminDashboard',
  
  setup() {
    const toast = useToast();
    const router = useRouter();
    
    // List of available tables in the system
    const availableTables = ref([]);
    const loading = ref(false);
    const error = ref(null);
    
    // Load available tables on component mount
    onMounted(async () => {
      await fetchAvailableTables();
    });
    
    // Fetch available tables from the API
    const fetchAvailableTables = async () => {
      loading.value = true;
      error.value = null;
      
      try {
        const response = await axios.get('/admin/tables');
        
        if (response.data && response.data.data && Array.isArray(response.data.data.tables)) {
          // Filter tables to only include those that are valid and accessible
          availableTables.value = response.data.data.tables.filter(table => {
            return table && table.name && table.name !== 'undefined';
          });
        } else {
          availableTables.value = [];
          console.warn('Invalid format for available tables:', response.data);
        }
      } catch (err) {
        error.value = err.response?.data?.message || 'Failed to load available tables';
        toast.error(error.value);
        console.error('Error fetching available tables:', err);
        availableTables.value = [];
      } finally {
        loading.value = false;
      }
    };
    
    // Navigate to a specific table management page
    const navigateToTable = (tableName) => {
      // Validate table name before navigation
      if (!tableName || tableName === 'undefined') {
        toast.error('Invalid table name. Cannot navigate to this table.');
        return;
      }
      
      // Check if table is in the list of available tables
      const isValidTable = availableTables.value.some(t => t.name === tableName);
      
      if (!isValidTable) {
        toast.error(`Table "${tableName}" is not available or you don't have access to it.`);
        return;
      }
      
      // Navigate to the table management page
      router.push({
        name: 'TableManagement',
        params: { tableName: tableName }
      });
    };
    
    // Quick navigation buttons - replace with your actual table names
    const quickNavTables = [
      { name: 'restaurants', icon: 'mdi-store', label: 'Restaurants' },
      { name: 'users', icon: 'mdi-account', label: 'Users' },
      { name: 'orders', icon: 'mdi-cart', label: 'Orders' },
      { name: 'delivery_configs', icon: 'mdi-truck-delivery', label: 'Delivery Settings' }
    ];
    
    return {
      availableTables,
      loading,
      error,
      navigateToTable,
      quickNavTables
    };
  }
};

// Template section changes:
// Add validation for table links in template. For example:
/*
<template>
  <div class="admin-dashboard">
    <!-- Quick navigation cards -->
    <v-row>
      <v-col v-for="table in quickNavTables" :key="table.name" cols="12" sm="6" md="3">
        <v-card @click="navigateToTable(table.name)" class="pa-3 text-center">
          <v-icon size="large" :icon="table.icon" class="mb-2"></v-icon>
          <div class="text-body-1">{{ table.label }}</div>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Tables list -->
    <v-card class="mt-4">
      <v-card-title>Database Tables</v-card-title>
      <v-card-text>
        <v-list>
          <v-list-item 
            v-for="table in availableTables" 
            :key="table.name"
            @click="navigateToTable(table.name)"
            link
          >
            <v-list-item-title>{{ table.name }}</v-list-item-title>
            <v-list-item-subtitle v-if="table.recordCount !== undefined">
              {{ table.recordCount }} records
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </div>
</template>
*/ 