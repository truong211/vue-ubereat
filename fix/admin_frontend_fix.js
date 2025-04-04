// Fix for frontend admin table management component to prevent sending undefined table names

// For TableManagement.vue component

import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useToast } from 'vue-toastification';

export default {
  name: 'TableManagement',
  props: {
    tableName: {
      type: String,
      required: true
    }
  },
  
  setup(props, { emit }) {
    const toast = useToast();
    const route = useRoute();
    const router = useRouter();
    
    // Reactive state
    const records = ref([]);
    const columns = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const totalRecords = ref(0);
    const currentPage = ref(1);
    const pageSize = ref(10);
    const sortBy = ref('id');
    const sortDirection = ref('asc');
    const searchQuery = ref('');
    const filters = ref({});
    
    // Computed properties
    const currentTableName = computed(() => {
      // Guard against undefined tableName
      return props.tableName && props.tableName !== 'undefined' 
        ? props.tableName 
        : null;
    });
    
    const isTableValid = computed(() => {
      return !!currentTableName.value;
    });
    
    // Watch for route changes to update the table
    watch(() => route.params.tableName, (newTableName) => {
      if (newTableName && newTableName !== 'undefined') {
        fetchTableStructure();
        fetchRecords();
      } else if (route.name === 'TableManagement') {
        // If we're on the table management route but no valid table is selected,
        // redirect to the admin dashboard or show an error
        toast.error('Invalid table name. Please select a valid table.');
        router.push({ name: 'AdminDashboard' });
      }
    });
    
    // Fetch table structure
    const fetchTableStructure = async () => {
      if (!isTableValid.value) {
        error.value = 'Invalid table name. Please select a valid table.';
        toast.error(error.value);
        return;
      }
      
      loading.value = true;
      error.value = null;
      
      try {
        const response = await axios.get(`/admin/tables/${currentTableName.value}/structure`);
        columns.value = response.data.data.columns;
      } catch (err) {
        error.value = err.response?.data?.message || 'Failed to load table structure';
        toast.error(error.value);
        console.error('Error fetching table structure:', err);
      } finally {
        loading.value = false;
      }
    };
    
    // Fetch records
    const fetchRecords = async () => {
      if (!isTableValid.value) {
        error.value = 'Invalid table name. Please select a valid table.';
        toast.error(error.value);
        return;
      }
      
      loading.value = true;
      error.value = null;
      
      try {
        const params = {
          limit: pageSize.value,
          offset: (currentPage.value - 1) * pageSize.value,
          sort: sortBy.value,
          order: sortDirection.value
        };
        
        if (searchQuery.value) {
          params.q = searchQuery.value;
        }
        
        if (Object.keys(filters.value).length > 0) {
          params.filters = JSON.stringify(filters.value);
        }
        
        const response = await axios.get(`/admin/tables/${currentTableName.value}`, { params });
        records.value = response.data.data.records;
        totalRecords.value = response.data.data.total;
      } catch (err) {
        error.value = err.response?.data?.message || 'Failed to load records';
        toast.error(error.value);
        console.error('Error fetching records:', err);
      } finally {
        loading.value = false;
      }
    };
    
    // Handle page change
    const changePage = (page) => {
      currentPage.value = page;
      fetchRecords();
    };
    
    // Handle sort change
    const changeSort = (field) => {
      if (sortBy.value === field) {
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
      } else {
        sortBy.value = field;
        sortDirection.value = 'asc';
      }
      fetchRecords();
    };
    
    // Handle search
    const handleSearch = () => {
      currentPage.value = 1;
      fetchRecords();
    };
    
    // Handle filter change
    const applyFilters = (newFilters) => {
      filters.value = newFilters;
      currentPage.value = 1;
      fetchRecords();
    };
    
    // Handle record deletion
    const deleteRecord = async (id) => {
      if (!isTableValid.value || !id) {
        toast.error('Cannot delete: Invalid table or record ID');
        return;
      }
      
      if (!confirm('Are you sure you want to delete this record? This cannot be undone.')) {
        return;
      }
      
      loading.value = true;
      
      try {
        await axios.delete(`/admin/tables/${currentTableName.value}/${id}`);
        toast.success('Record deleted successfully');
        fetchRecords();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete record');
        console.error('Error deleting record:', err);
      } finally {
        loading.value = false;
      }
    };
    
    // Initialize component
    onMounted(() => {
      if (isTableValid.value) {
        fetchTableStructure();
        fetchRecords();
      } else if (route.name === 'TableManagement') {
        // If we're on the table management route but no valid table is selected,
        // redirect to the admin dashboard or show an error
        toast.error('Invalid table name. Please select a valid table.');
        router.push({ name: 'AdminDashboard' });
      }
    });
    
    return {
      records,
      columns,
      loading,
      error,
      totalRecords,
      currentPage,
      pageSize,
      sortBy,
      sortDirection,
      searchQuery,
      filters,
      currentTableName,
      isTableValid,
      changePage,
      changeSort,
      handleSearch,
      applyFilters,
      deleteRecord
    };
  }
}; 