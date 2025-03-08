<template>
  <v-container class="promotions-page py-8">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-6">Manage Promotions</h1>

        <v-card class="mb-6">
          <v-card-text>
            <p class="text-body-1">
              Create and manage promotional offers for your restaurant. Attract new customers and increase orders with targeted discounts.
            </p>
          </v-card-text>
        </v-card>

        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            <div>Active Promotions</div>
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              @click="openPromotionDialog()"
            >
              Create Promotion
            </v-btn>
          </v-card-title>

          <v-card-text>
            <v-row>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="search"
                  label="Search promotions"
                  density="comfortable"
                  prepend-inner-icon="mdi-magnify"
                  hide-details
                  single-line
                  variant="outlined"
                  class="mb-4"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" sm="4">
                <v-select
                  v-model="typeFilter"
                  label="Type Filter"
                  density="comfortable"
                  :items="[
                    { title: 'All Types', value: 'all' },
                    { title: 'Percentage', value: 'percentage' },
                    { title: 'Fixed Amount', value: 'fixed' }
                  ]"
                  hide-details
                  variant="outlined"
                ></v-select>
              </v-col>
              
              <v-col cols="12" sm="4">
                <v-select
                  v-model="statusFilter"
                  label="Status Filter"
                  density="comfortable"
                  :items="[
                    { title: 'All Status', value: 'all' },
                    { title: 'Active', value: 'active' },
                    { title: 'Inactive', value: 'inactive' },
                    { title: 'Expired', value: 'expired' }
                  ]"
                  hide-details
                  variant="outlined"
                ></v-select>
              </v-col>
            </v-row>
            
            <v-data-table
              :headers="headers"
              :items="filteredPromotions"
              :loading="loading"
              density="comfortable"
              class="mt-4"
            >
              <template v-slot:item.type="{ item }">
                <v-chip
                  :color="getTypeColor(item.type)"
                  size="small"
                >
                  {{ item.type === 'percentage' ? 'Percentage' : 'Fixed Amount' }}
                </v-chip>
              </template>

              <template v-slot:item.value="{ item }">
                <span :class="`text-${getTypeColor(item.type)}`">
                  {{ formatPromotionValue(item) }}
                </span>
              </template>

              <template v-slot:item.active="{ item }">
                <v-switch
                  v-model="item.active"
                  color="success"
                  density="compact"
                  hide-details
                  :loading="updatingStatus === item.id"
                  @change="togglePromotion(item)"
                ></v-switch>
              </template>

              <template v-slot:item.dateRange="{ item }">
                {{ formatDate(item.startDate) }} - {{ formatDate(item.endDate) }}
              </template>

              <template v-slot:item.actions="{ item }">
                <v-btn icon="mdi-pencil" variant="text" size="small" @click="openPromotionDialog(item)"></v-btn>
                <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="confirmDelete(item)"></v-btn>
              </template>

              <!-- Empty state -->
              <template v-slot:no-data>
                <div class="text-center pa-4">
                  <v-icon size="large" color="grey-lighten-1" icon="mdi-tag-off" class="mb-2"></v-icon>
                  <div class="text-body-1 mb-2">No promotions found</div>
                  <div class="text-caption text-grey">Create your first promotion to attract more customers</div>
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Promotion Dialog -->
    <v-dialog v-model="promotionDialog" max-width="600">
      <v-card>
        <v-card-title>
          {{ editingPromotion ? 'Edit Promotion' : 'Create Promotion' }}
        </v-card-title>
        
        <v-card-text>
          <v-form ref="promotionFormRef" v-model="isFormValid">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="promotionForm.name"
                  :rules="nameRules"
                  label="Promotion Name"
                  required
                ></v-text-field>
              </v-col>
              
              <v-col cols="12">
                <v-text-field
                  v-model="promotionForm.code"
                  :rules="codeRules"
                  label="Promo Code"
                  required
                  hint="Uppercase letters, numbers, underscores, and hyphens only"
                  persistent-hint
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-select
                  v-model="promotionForm.type"
                  :items="[
                    { title: 'Percentage Discount', value: 'percentage' },
                    { title: 'Fixed Amount', value: 'fixed' }
                  ]"
                  label="Discount Type"
                  required
                ></v-select>
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="promotionForm.value"
                  :rules="valueRules"
                  :label="valueLabel"
                  type="number"
                  required
                  :prefix="promotionForm.type === 'fixed' ? '$' : ''"
                  :suffix="promotionForm.type === 'percentage' ? '%' : ''"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="promotionForm.startDate"
                  label="Start Date"
                  type="date"
                  required
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="promotionForm.endDate"
                  label="End Date"
                  type="date"
                  required
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="promotionForm.minOrderValue"
                  label="Minimum Order Value"
                  type="number"
                  prefix="$"
                  hint="Optional. Leave empty for no minimum"
                  persistent-hint
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="promotionForm.usageLimit"
                  label="Usage Limit"
                  type="number"
                  hint="Optional. Maximum number of redemptions"
                  persistent-hint
                ></v-text-field>
              </v-col>
              
              <v-col cols="12">
                <v-textarea
                  v-model="promotionForm.description"
                  label="Description"
                  hint="Optional. Describe the promotion details"
                  persistent-hint
                  rows="3"
                  auto-grow
                ></v-textarea>
              </v-col>
              
              <v-col cols="12">
                <v-switch
                  v-model="promotionForm.active"
                  color="success"
                  label="Promotion Active"
                  hide-details
                ></v-switch>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="promotionDialog = false">Cancel</v-btn>
          <v-btn 
            color="primary"
            :loading="isSaving"
            @click="savePromotion"
            :disabled="!isFormValid"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Promotion</v-card-title>
        <v-card-text>
          Are you sure you want to delete this promotion? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn
            color="error"
            :loading="isDeleting" 
            @click="deletePromotion"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { format, isAfter, isBefore, formatISO } from 'date-fns'

export default {
  name: 'RestaurantPromotions',
  
  setup() {
    const store = useStore()
    
    // State
    const search = ref('')
    const typeFilter = ref('all')
    const statusFilter = ref('all')
    const loading = ref(false)
    const promotionDialog = ref(false)
    const deleteDialog = ref(false)
    const isSaving = ref(false)
    const isDeleting = ref(false)
    const isFormValid = ref(false)
    const updatingStatus = ref(null)
    
    const promotionForm = ref({
      name: '',
      code: '',
      type: 'percentage',
      value: 10,
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      minOrderValue: null,
      usageLimit: null,
      description: '',
      active: true
    })
    
    const editingPromotion = ref(null)
    const promotionFormRef = ref(null)
    
    // Table headers
    const headers = [
      { title: 'Name', key: 'name', sortable: true },
      { title: 'Code', key: 'code', sortable: true },
      { title: 'Type', key: 'type', sortable: true },
      { title: 'Value', key: 'value', sortable: true },
      { title: 'Date Range', key: 'dateRange', sortable: true },
      { title: 'Active', key: 'active', sortable: true },
      { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
    ]
    
    // Form validation rules
    const nameRules = [
      v => !!v || 'Promotion name is required',
      v => v.length >= 3 || 'Name must be at least 3 characters'
    ]
    
    const codeRules = [
      v => !!v || 'Promo code is required',
      v => /^[A-Z0-9_-]+$/.test(v) || 'Code must contain only uppercase letters, numbers, underscores, or hyphens'
    ]
    
    const valueRules = [
      v => !!v || 'Value is required',
      v => v > 0 || 'Value must be greater than 0',
      v => promotionForm.value.type !== 'percentage' || v <= 100 || 'Percentage cannot exceed 100%'
    ]
    
    // Dynamic label for value field
    const valueLabel = computed(() => {
      return promotionForm.value.type === 'percentage' 
        ? 'Discount Percentage' 
        : 'Discount Amount'
    })
    
    // Filtered promotions
    const filteredPromotions = computed(() => {
      let promotions = store.state.restaurantAdmin?.promotions || []
      
      // Search filter
      if (search.value) {
        const searchLower = search.value.toLowerCase()
        promotions = promotions.filter(p => 
          p.name.toLowerCase().includes(searchLower) ||
          p.code.toLowerCase().includes(searchLower)
        )
      }
      
      // Type filter
      if (typeFilter.value !== 'all') {
        promotions = promotions.filter(p => p.type === typeFilter.value)
      }
      
      // Status filter
      if (statusFilter.value !== 'all') {
        const now = new Date()
        switch (statusFilter.value) {
          case 'active':
            promotions = promotions.filter(p => 
              p.active &&
              !isAfter(now, new Date(p.endDate))
            )
            break
          case 'inactive':
            promotions = promotions.filter(p => !p.active)
            break
          case 'expired':
            promotions = promotions.filter(p => 
              isAfter(now, new Date(p.endDate))
            )
            break
        }
      }
      
      return promotions
    })
    
    // Methods
    const openPromotionDialog = (promotion = null) => {
      if (promotion) {
        editingPromotion.value = promotion
        promotionForm.value = {
          name: promotion.name,
          code: promotion.code,
          type: promotion.type,
          value: promotion.value,
          minOrderValue: promotion.minOrderValue,
          startDate: format(new Date(promotion.startDate), 'yyyy-MM-dd'),
          endDate: format(new Date(promotion.endDate), 'yyyy-MM-dd'),
          usageLimit: promotion.usageLimit,
          active: promotion.active,
          description: promotion.description
        }
      } else {
        editingPromotion.value = null
        promotionForm.value = {
          name: '',
          code: '',
          type: 'percentage',
          value: 10,
          startDate: format(new Date(), 'yyyy-MM-dd'),
          endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
          minOrderValue: null,
          usageLimit: null,
          description: '',
          active: true
        }
      }
      promotionDialog.value = true
    }
    
    const savePromotion = async () => {
      if (!promotionFormRef.value) return
      
      const { valid } = await promotionFormRef.value.validate()
      if (!valid) return
      
      isSaving.value = true
      try {
        const promotionData = {
          ...promotionForm.value,
          startDate: formatISO(new Date(promotionForm.value.startDate)),
          endDate: formatISO(new Date(promotionForm.value.endDate))
        }
        
        if (editingPromotion.value) {
          await store.dispatch('restaurantAdmin/updatePromotion', {
            id: editingPromotion.value.id,
            ...promotionData
          })
        } else {
          await store.dispatch('restaurantAdmin/createPromotion', promotionData)
        }
        
        promotionDialog.value = false
        store.dispatch('ui/showSnackbar', {
          text: `Promotion ${editingPromotion.value ? 'updated' : 'created'} successfully`,
          color: 'success'
        })
      } catch (error) {
        console.error('Failed to save promotion:', error)
        store.dispatch('ui/showSnackbar', {
          text: 'Failed to save promotion. Please try again.',
          color: 'error'
        })
      } finally {
        isSaving.value = false
      }
    }
    
    const confirmDelete = (promotion) => {
      editingPromotion.value = promotion
      deleteDialog.value = true
    }
    
    const deletePromotion = async () => {
      if (!editingPromotion.value) return
      
      isDeleting.value = true
      try {
        await store.dispatch('restaurantAdmin/deletePromotion', editingPromotion.value.id)
        deleteDialog.value = false
        store.dispatch('ui/showSnackbar', {
          text: 'Promotion deleted successfully',
          color: 'success'
        })
      } catch (error) {
        console.error('Failed to delete promotion:', error)
        store.dispatch('ui/showSnackbar', {
          text: 'Failed to delete promotion. Please try again.',
          color: 'error'
        })
      } finally {
        isDeleting.value = false
      }
    }
    
    const togglePromotion = async (promotion) => {
      updatingStatus.value = promotion.id
      try {
        await store.dispatch('restaurantAdmin/updatePromotion', {
          id: promotion.id,
          active: promotion.active
        })
        store.dispatch('ui/showSnackbar', {
          text: `Promotion ${promotion.active ? 'activated' : 'deactivated'} successfully`,
          color: 'success'
        })
      } catch (error) {
        console.error('Failed to update promotion status:', error)
        promotion.active = !promotion.active // Revert on failure
        store.dispatch('ui/showSnackbar', {
          text: 'Failed to update promotion status. Please try again.',
          color: 'error'
        })
      } finally {
        updatingStatus.value = null
      }
    }
    
    const getTypeColor = (type) => {
      return type === 'percentage' ? 'primary' : 'success'
    }
    
    const formatPromotionValue = (promotion) => {
      if (promotion.type === 'percentage') {
        return `${promotion.value}%`
      }
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(promotion.value)
    }
    
    const formatDate = (dateString) => {
      return format(new Date(dateString), 'MM/dd/yyyy')
    }
    
    // Load promotions on mount
    onMounted(async () => {
      loading.value = true
      try {
        await store.dispatch('restaurantAdmin/fetchPromotions')
      } catch (error) {
        console.error('Failed to load promotions:', error)
        store.dispatch('ui/showSnackbar', {
          text: 'Failed to load promotions. Please try again.',
          color: 'error'
        })
      } finally {
        loading.value = false
      }
    })
    
    return {
      search,
      typeFilter,
      statusFilter,
      loading,
      promotionDialog,
      deleteDialog,
      isSaving,
      isDeleting,
      isFormValid,
      updatingStatus,
      promotionForm,
      editingPromotion,
      promotionFormRef,
      headers,
      nameRules,
      codeRules,
      valueRules,
      valueLabel,
      filteredPromotions,
      openPromotionDialog,
      savePromotion,
      confirmDelete,
      deletePromotion,
      togglePromotion,
      getTypeColor,
      formatPromotionValue,
      formatDate
    }
  }
}
</script>

<style scoped>
.promotions-page {
  max-width: 1200px;
  margin: 0 auto;
}
</style>