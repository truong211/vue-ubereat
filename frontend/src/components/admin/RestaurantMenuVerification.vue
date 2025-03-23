<template>
  <div class="menu-verification">
    <v-card>
      <v-tabs v-model="activeTab">
        <v-tab value="menu">Menu Items</v-tab>
        <v-tab value="categories">Categories</v-tab>
      </v-tabs>

      <v-card-text>
        <v-window v-model="activeTab">
          <!-- Menu Items Tab -->
          <v-window-item value="menu">
            <v-data-table
              :headers="menuHeaders"
              :items="menuItems"
              :loading="loading"
            >
              <!-- Image -->
              <template v-slot:item.image="{ item }">
                <v-avatar size="40">
                  <v-img
                    :src="item.image || '/img/food-placeholder.jpg'"
                    :alt="item.name"
                  ></v-img>
                </v-avatar>
              </template>

              <!-- Price -->
              <template v-slot:item.price="{ item }">
                {{ formatPrice(item.price) }}
              </template>

              <!-- Status -->
              <template v-slot:item.status="{ item }">
                <v-chip
                  :color="item.approved ? 'success' : 'warning'"
                  size="small"
                >
                  {{ item.approved ? 'Approved' : 'Pending' }}
                </v-chip>
              </template>

              <!-- Actions -->
              <template v-slot:item.actions="{ item }">
                <v-btn-group density="comfortable">
                  <v-btn
                    icon="mdi-eye"
                    variant="text"
                    @click="viewMenuItem(item)"
                  ></v-btn>
                  <v-btn
                    v-if="!item.approved"
                    icon="mdi-check-circle"
                    variant="text"
                    color="success"
                    @click="approveMenuItem(item)"
                  ></v-btn>
                  <v-btn
                    v-if="!item.approved"
                    icon="mdi-close-circle"
                    variant="text"
                    color="error"
                    @click="rejectMenuItem(item)"
                  ></v-btn>
                </v-btn-group>
              </template>
            </v-data-table>
          </v-window-item>

          <!-- Categories Tab -->
          <v-window-item value="categories">
            <v-data-table
              :headers="categoryHeaders"
              :items="categories"
              :loading="loading"
            >
              <!-- Status -->
              <template v-slot:item.status="{ item }">
                <v-chip
                  :color="item.approved ? 'success' : 'warning'"
                  size="small"
                >
                  {{ item.approved ? 'Approved' : 'Pending' }}
                </v-chip>
              </template>

              <!-- Actions -->
              <template v-slot:item.actions="{ item }">
                <v-btn-group density="comfortable">
                  <v-btn
                    v-if="!item.approved"
                    icon="mdi-check-circle"
                    variant="text"
                    color="success"
                    @click="approveCategory(item)"
                  ></v-btn>
                  <v-btn
                    v-if="!item.approved"
                    icon="mdi-close-circle"
                    variant="text"
                    color="error"
                    @click="rejectCategory(item)"
                  ></v-btn>
                </v-btn-group>
              </template>
            </v-data-table>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>

    <!-- Menu Item Details Dialog -->
    <v-dialog v-model="itemDialog.show" max-width="600">
      <v-card v-if="itemDialog.item">
        <v-card-title>
          Menu Item Details
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="itemDialog.show = false"></v-btn>
        </v-card-title>

        <v-card-text>
          <div class="d-flex mb-4">
            <v-img
              :src="itemDialog.item.image || '/img/food-placeholder.jpg'"
              width="200"
              height="200"
              cover
              class="rounded-lg"
            ></v-img>
            <div class="ml-4">
              <h3 class="text-h6">{{ itemDialog.item.name }}</h3>
              <p class="text-subtitle-1">{{ formatPrice(itemDialog.item.price) }}</p>
              <p class="text-body-2">{{ itemDialog.item.description }}</p>
            </div>
          </div>

          <!-- Options & Add-ons -->
          <template v-if="itemDialog.item.options?.length">
            <div class="text-h6 mb-2">Options</div>
            <v-list>
              <v-list-item v-for="option in itemDialog.item.options" :key="option.id">
                <v-list-item-title>{{ option.name }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ option.choices.map(c => `${c.name} (${formatPrice(c.price)})`).join(', ') }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </template>

          <v-textarea
            v-model="itemDialog.notes"
            label="Review Notes"
            rows="3"
            variant="outlined"
            class="mt-4"
          ></v-textarea>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="itemDialog.show = false"
          >
            Close
          </v-btn>
          <v-btn
            v-if="!itemDialog.item.approved"
            color="error"
            variant="text"
            @click="rejectMenuItem(itemDialog.item)"
          >
            Reject
          </v-btn>
          <v-btn
            v-if="!itemDialog.item.approved"
            color="success"
            @click="approveMenuItem(itemDialog.item)"
          >
            Approve
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Confirm Dialog -->
    <v-dialog v-model="confirmDialog.show" max-width="400">
      <v-card>
        <v-card-title>{{ confirmDialog.title }}</v-card-title>
        <v-card-text>
          <p>{{ confirmDialog.message }}</p>
          <v-textarea
            v-if="confirmDialog.showNotes"
            v-model="confirmDialog.notes"
            label="Notes"
            rows="3"
            variant="outlined"
            class="mt-4"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="confirmDialog.show = false">Cancel</v-btn>
          <v-btn :color="confirmDialog.color" @click="confirmAction">Confirm</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useToast } from 'vue-toastification'

export default {
  name: 'RestaurantMenuVerification',

  props: {
    restaurantId: {
      type: [String, Number],
      required: true
    }
  },

  setup(props) {
    const store = useStore()
    const toast = useToast()

    // State
    const loading = ref(false)
    const activeTab = ref('menu')
    const menuItems = ref([])
    const categories = ref([])

    // Dialogs
    const itemDialog = ref({
      show: false,
      item: null,
      notes: ''
    })

    const confirmDialog = ref({
      show: false,
      title: '',
      message: '',
      notes: '',
      showNotes: false,
      color: 'primary',
      action: null,
      item: null
    })

    // Table headers
    const menuHeaders = [
      { title: '', key: 'image', sortable: false, width: '60px' },
      { title: 'Name', key: 'name', sortable: true },
      { title: 'Category', key: 'categoryName', sortable: true },
      { title: 'Price', key: 'price', sortable: true },
      { title: 'Status', key: 'status', sortable: true },
      { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
    ]

    const categoryHeaders = [
      { title: 'Name', key: 'name', sortable: true },
      { title: 'Item Count', key: 'itemCount', sortable: true },
      { title: 'Status', key: 'status', sortable: true },
      { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
    ]

    // Methods
    const loadData = async () => {
      loading.value = true
      try {
        const [menuRes, categoryRes] = await Promise.all([
          store.dispatch('admin/getPendingMenuItems', props.restaurantId),
          store.dispatch('admin/getPendingCategories', props.restaurantId)
        ])
        menuItems.value = menuRes.data
        categories.value = categoryRes.data
      } catch (error) {
        toast.error('Failed to load menu data')
      } finally {
        loading.value = false
      }
    }

    const viewMenuItem = (item) => {
      itemDialog.value = {
        show: true,
        item,
        notes: ''
      }
    }

    const approveMenuItem = (item) => {
      confirmDialog.value = {
        show: true,
        title: 'Approve Menu Item',
        message: `Are you sure you want to approve "${item.name}"?`,
        showNotes: true,
        color: 'success',
        action: () => confirmApproveMenuItem(item),
        item
      }
    }

    const confirmApproveMenuItem = async (item) => {
      try {
        await store.dispatch('admin/approveMenuItem', {
          restaurantId: props.restaurantId,
          itemId: item.id,
          notes: confirmDialog.value.notes
        })
        toast.success('Menu item approved')
        confirmDialog.value.show = false
        itemDialog.value.show = false
        await loadData()
      } catch (error) {
        toast.error('Failed to approve menu item')
      }
    }

    const rejectMenuItem = (item) => {
      confirmDialog.value = {
        show: true,
        title: 'Reject Menu Item',
        message: `Are you sure you want to reject "${item.name}"?`,
        showNotes: true,
        color: 'error',
        action: () => confirmRejectMenuItem(item),
        item
      }
    }

    const confirmRejectMenuItem = async (item) => {
      try {
        await store.dispatch('admin/rejectMenuItem', {
          restaurantId: props.restaurantId,
          itemId: item.id,
          notes: confirmDialog.value.notes
        })
        toast.success('Menu item rejected')
        confirmDialog.value.show = false
        itemDialog.value.show = false
        await loadData()
      } catch (error) {
        toast.error('Failed to reject menu item')
      }
    }

    const approveCategory = (category) => {
      confirmDialog.value = {
        show: true,
        title: 'Approve Category',
        message: `Are you sure you want to approve "${category.name}"?`,
        showNotes: true,
        color: 'success',
        action: () => confirmApproveCategory(category),
        item: category
      }
    }

    const confirmApproveCategory = async (category) => {
      try {
        await store.dispatch('admin/approveCategory', {
          restaurantId: props.restaurantId,
          categoryId: category.id,
          notes: confirmDialog.value.notes
        })
        toast.success('Category approved')
        confirmDialog.value.show = false
        await loadData()
      } catch (error) {
        toast.error('Failed to approve category')
      }
    }

    const rejectCategory = (category) => {
      confirmDialog.value = {
        show: true,
        title: 'Reject Category',
        message: `Are you sure you want to reject "${category.name}"?`,
        showNotes: true,
        color: 'error',
        action: () => confirmRejectCategory(category),
        item: category
      }
    }

    const confirmRejectCategory = async (category) => {
      try {
        await store.dispatch('admin/rejectCategory', {
          restaurantId: props.restaurantId,
          categoryId: category.id,
          notes: confirmDialog.value.notes
        })
        toast.success('Category rejected')
        confirmDialog.value.show = false
        await loadData()
      } catch (error) {
        toast.error('Failed to reject category')
      }
    }

    const confirmAction = () => {
      if (confirmDialog.value.action) {
        confirmDialog.value.action()
      }
    }

    const formatPrice = (price) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(price)
    }

    // Initialize
    onMounted(() => {
      loadData()
    })

    return {
      loading,
      activeTab,
      menuItems,
      categories,
      menuHeaders,
      categoryHeaders,
      itemDialog,
      confirmDialog,
      viewMenuItem,
      approveMenuItem,
      rejectMenuItem,
      approveCategory,
      rejectCategory,
      confirmAction,
      formatPrice
    }
  }
}
</script>

<style scoped>
.menu-verification {
  padding: 16px;
}
</style>