<template>
  <div class="restaurant-menu-management">
    <!-- Header with actions -->
    <div class="d-flex justify-space-between align-center mb-4">
      <h2 class="text-h5">Quản lý thực đơn</h2>
      <div>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          class="mr-2"
          @click="createCategory"
        >
          Thêm danh mục
        </v-btn>
        <v-btn
          color="success"
          prepend-icon="mdi-food"
          @click="createMenuItem"
        >
          Thêm món ăn
        </v-btn>
      </div>
    </div>

    <div v-if="loading" class="d-flex justify-center align-center" style="height: 200px;">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>

    <template v-else>
      <!-- Categories and Menu Items -->
      <v-expansion-panels v-if="categories.length > 0">
        <v-expansion-panel
          v-for="category in categories"
          :key="category.id"
        >
          <v-expansion-panel-title>
            <div class="d-flex align-center">
              <span>{{ category.name }}</span>
              <v-chip
                v-if="!category.isActive"
                color="error"
                size="small"
                class="ml-2"
              >
                Ẩn
              </v-chip>
            </div>
            <template v-slot:actions>
              <div class="d-flex align-center mr-2">
                <v-btn
                  icon="mdi-pencil"
                  variant="text"
                  size="small"
                  color="primary"
                  class="mr-1"
                  @click.stop="editCategory(category)"
                ></v-btn>
                <v-btn
                  icon="mdi-delete"
                  variant="text"
                  size="small"
                  color="error"
                  @click.stop="deleteCategory(category)"
                ></v-btn>
              </div>
            </template>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-table v-if="category.menuItems && category.menuItems.length > 0">
              <thead>
                <tr>
                  <th>Hình ảnh</th>
                  <th>Tên món</th>
                  <th>Mô tả</th>
                  <th>Giá</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in category.menuItems" :key="item.id">
                  <td width="80">
                    <v-avatar size="60" rounded>
                      <v-img
                        :src="item.image || '/img/food-placeholder.jpg'"
                        :alt="item.name"
                        cover
                      ></v-img>
                    </v-avatar>
                  </td>
                  <td>{{ item.name }}</td>
                  <td>{{ truncateText(item.description, 100) }}</td>
                  <td>{{ formatPrice(item.price) }}</td>
                  <td>
                    <v-chip
                      :color="item.isAvailable ? 'success' : 'error'"
                      size="small"
                    >
                      {{ item.isAvailable ? 'Có sẵn' : 'Hết hàng' }}
                    </v-chip>
                  </td>
                  <td>
                    <v-btn-group density="comfortable">
                      <v-btn
                        icon="mdi-eye"
                        variant="text"
                        @click="viewMenuItem(item)"
                      ></v-btn>
                      <v-btn
                        icon="mdi-pencil"
                        variant="text"
                        color="primary"
                        @click="editMenuItem(item)"
                      ></v-btn>
                      <v-btn
                        icon="mdi-delete"
                        variant="text"
                        color="error"
                        @click="deleteMenuItem(item)"
                      ></v-btn>
                    </v-btn-group>
                  </td>
                </tr>
              </tbody>
            </v-table>
            <div v-else class="text-center py-4">
              <v-icon size="large" color="grey-lighten-1">mdi-food-off</v-icon>
              <div class="text-body-1 mt-2">Chưa có món ăn nào trong danh mục này</div>
              <v-btn
                color="primary"
                variant="text"
                class="mt-2"
                @click="createMenuItem(category)"
              >
                Thêm món ăn
              </v-btn>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <div v-else class="text-center py-8">
        <v-icon size="64" color="grey-lighten-1">mdi-food-off</v-icon>
        <h3 class="text-h6 mt-4">Chưa có danh mục nào</h3>
        <p class="text-body-1 mt-2">Hãy tạo danh mục đầu tiên để bắt đầu thêm món ăn</p>
        <v-btn
          color="primary"
          class="mt-4"
          @click="createCategory"
        >
          Tạo danh mục
        </v-btn>
      </div>
    </template>

    <!-- Category Dialog -->
    <v-dialog v-model="categoryDialog.show" max-width="500">
      <v-card>
        <v-card-title>
          {{ categoryDialog.isNew ? 'Thêm danh mục mới' : 'Chỉnh sửa danh mục' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="categoryForm">
            <v-text-field
              v-model="categoryDialog.category.name"
              label="Tên danh mục"
              variant="outlined"
              :rules="[v => !!v || 'Tên danh mục là bắt buộc']"
            ></v-text-field>
            
            <v-textarea
              v-model="categoryDialog.category.description"
              label="Mô tả"
              variant="outlined"
              rows="3"
            ></v-textarea>
            
            <v-switch
              v-model="categoryDialog.category.isActive"
              label="Hiển thị danh mục"
              color="success"
              hide-details
            ></v-switch>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="categoryDialog.show = false">Hủy</v-btn>
          <v-btn color="primary" @click="saveCategory">Lưu</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Menu Item Dialog -->
    <v-dialog v-model="menuItemDialog.show" max-width="700">
      <v-card>
        <v-card-title>
          {{ menuItemDialog.isNew ? 'Thêm món ăn mới' : 'Chỉnh sửa món ăn' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="menuItemForm">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="menuItemDialog.menuItem.name"
                  label="Tên món ăn"
                  variant="outlined"
                  :rules="[v => !!v || 'Tên món ăn là bắt buộc']"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="menuItemDialog.menuItem.categoryId"
                  :items="categories"
                  item-title="name"
                  item-value="id"
                  label="Danh mục"
                  variant="outlined"
                  :rules="[v => !!v || 'Danh mục là bắt buộc']"
                ></v-select>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="menuItemDialog.menuItem.price"
                  label="Giá"
                  variant="outlined"
                  type="number"
                  :rules="[
                    v => !!v || 'Giá là bắt buộc',
                    v => v > 0 || 'Giá phải lớn hơn 0'
                  ]"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-switch
                  v-model="menuItemDialog.menuItem.isAvailable"
                  label="Có sẵn"
                  color="success"
                  hide-details
                ></v-switch>
              </v-col>
              
              <v-col cols="12">
                <v-textarea
                  v-model="menuItemDialog.menuItem.description"
                  label="Mô tả"
                  variant="outlined"
                  rows="3"
                ></v-textarea>
              </v-col>
              
              <v-col cols="12">
                <v-file-input
                  v-model="menuItemDialog.menuItem.imageFile"
                  label="Hình ảnh món ăn"
                  accept="image/*"
                  variant="outlined"
                  prepend-icon="mdi-camera"
                  :rules="[menuItemDialog.isNew ? v => !!v || 'Hình ảnh là bắt buộc' : undefined]"
                ></v-file-input>
              </v-col>
              
              <v-col cols="12">
                <v-expansion-panels>
                  <v-expansion-panel title="Tùy chọn nâng cao">
                    <v-expansion-panel-text>
                      <v-row>
                        <v-col cols="12" md="6">
                          <v-switch
                            v-model="menuItemDialog.menuItem.isVegetarian"
                            label="Món chay"
                            color="success"
                            hide-details
                          ></v-switch>
                        </v-col>
                        
                        <v-col cols="12" md="6">
                          <v-switch
                            v-model="menuItemDialog.menuItem.isSpicy"
                            label="Cay"
                            color="error"
                            hide-details
                          ></v-switch>
                        </v-col>
                        
                        <v-col cols="12" md="6">
                          <v-switch
                            v-model="menuItemDialog.menuItem.isFeatured"
                            label="Món đặc biệt"
                            color="warning"
                            hide-details
                          ></v-switch>
                        </v-col>
                        
                        <v-col cols="12" md="6">
                          <v-text-field
                            v-model="menuItemDialog.menuItem.preparationTime"
                            label="Thời gian chuẩn bị (phút)"
                            variant="outlined"
                            type="number"
                          ></v-text-field>
                        </v-col>
                        
                        <v-col cols="12">
                          <v-text-field
                            v-model="menuItemDialog.menuItem.ingredients"
                            label="Nguyên liệu (phân cách bằng dấu phẩy)"
                            variant="outlined"
                          ></v-text-field>
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
          <v-btn variant="text" @click="menuItemDialog.show = false">Hủy</v-btn>
          <v-btn color="primary" @click="saveMenuItem">Lưu</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Menu Item Detail Dialog -->
    <v-dialog v-model="menuItemDetailDialog.show" max-width="600">
      <v-card v-if="menuItemDetailDialog.menuItem">
        <v-img
          :src="menuItemDetailDialog.menuItem.image || '/img/food-placeholder.jpg'"
          height="250"
          cover
        ></v-img>
        
        <v-card-title>{{ menuItemDetailDialog.menuItem.name }}</v-card-title>
        
        <v-card-text>
          <div class="d-flex align-center mb-4">
            <v-chip
              :color="menuItemDetailDialog.menuItem.isAvailable ? 'success' : 'error'"
              class="mr-2"
            >
              {{ menuItemDetailDialog.menuItem.isAvailable ? 'Có sẵn' : 'Hết hàng' }}
            </v-chip>
            
            <v-chip
              v-if="menuItemDetailDialog.menuItem.isVegetarian"
              color="success"
              variant="outlined"
              class="mr-2"
            >
              Món chay
            </v-chip>
            
            <v-chip
              v-if="menuItemDetailDialog.menuItem.isSpicy"
              color="error"
              variant="outlined"
              class="mr-2"
            >
              Cay
            </v-chip>
            
            <v-chip
              v-if="menuItemDetailDialog.menuItem.isFeatured"
              color="warning"
              variant="outlined"
            >
              Món đặc biệt
            </v-chip>
          </div>
          
          <p class="text-h6 mb-2">{{ formatPrice(menuItemDetailDialog.menuItem.price) }}</p>
          
          <p class="text-body-1 mb-4">{{ menuItemDetailDialog.menuItem.description }}</p>
          
          <v-divider class="mb-4"></v-divider>
          
          <div v-if="menuItemDetailDialog.menuItem.ingredients" class="mb-4">
            <p class="text-subtitle-1 font-weight-bold mb-2">Nguyên liệu:</p>
            <div class="d-flex flex-wrap">
              <v-chip
                v-for="(ingredient, index) in menuItemDetailDialog.menuItem.ingredients.split(',')"
                :key="index"
                class="mr-2 mb-2"
                size="small"
              >
                {{ ingredient.trim() }}
              </v-chip>
            </div>
          </div>
          
          <div v-if="menuItemDetailDialog.menuItem.preparationTime" class="mb-4">
            <p class="text-subtitle-1 font-weight-bold mb-2">Thời gian chuẩn bị:</p>
            <p class="text-body-1">{{ menuItemDetailDialog.menuItem.preparationTime }} phút</p>
          </div>
          
          <div class="mb-4">
            <p class="text-subtitle-1 font-weight-bold mb-2">Danh mục:</p>
            <p class="text-body-1">{{ getCategoryName(menuItemDetailDialog.menuItem.categoryId) }}</p>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="menuItemDetailDialog.show = false">Đóng</v-btn>
          <v-btn color="primary" @click="editMenuItem(menuItemDetailDialog.menuItem)">Chỉnh sửa</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Confirm Dialog -->
    <v-dialog v-model="confirmDialog.show" max-width="400">
      <v-card>
        <v-card-title>{{ confirmDialog.title }}</v-card-title>
        <v-card-text>{{ confirmDialog.message }}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="confirmDialog.show = false">Hủy</v-btn>
          <v-btn color="error" @click="confirmDialog.action">Xác nhận</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, onMounted, watch, defineProps } from 'vue'
import { useToast } from 'vue-toastification'
import { adminAPI } from '@/services/api.service'

export default {
  name: 'RestaurantMenuManagement',
  
  props: {
    restaurantId: {
      type: [String, Number],
      required: true
    }
  },
  
  setup(props) {
    const toast = useToast()
    
    // State
    const loading = ref(true)
    const categories = ref([])
    
    // Dialog states
    const categoryDialog = ref({
      show: false,
      isNew: true,
      category: {
        name: '',
        description: '',
        isActive: true
      }
    })
    
    const menuItemDialog = ref({
      show: false,
      isNew: true,
      menuItem: {
        name: '',
        description: '',
        price: 0,
        categoryId: null,
        isAvailable: true,
        imageFile: null,
        isVegetarian: false,
        isSpicy: false,
        isFeatured: false,
        preparationTime: 15,
        ingredients: ''
      }
    })
    
    const menuItemDetailDialog = ref({
      show: false,
      menuItem: null
    })
    
    const confirmDialog = ref({
      show: false,
      title: '',
      message: '',
      action: null
    })
    
    // Methods
    const loadMenuData = async () => {
      loading.value = true
      try {
        const response = await adminAPI.getRestaurantMenu(props.restaurantId)
        categories.value = response.data.categories
      } catch (error) {
        toast.error('Không thể tải thực đơn')
        console.error('Failed to load menu data:', error)
      } finally {
        loading.value = false
      }
    }
    
    const createCategory = () => {
      categoryDialog.value = {
        show: true,
        isNew: true,
        category: {
          name: '',
          description: '',
          isActive: true
        }
      }
    }
    
    const editCategory = (category) => {
      categoryDialog.value = {
        show: true,
        isNew: false,
        category: { ...category }
      }
    }
    
    const saveCategory = async () => {
      try {
        if (categoryDialog.value.isNew) {
          await adminAPI.createMenuCategory(props.restaurantId, categoryDialog.value.category)
          toast.success('Tạo danh mục thành công')
        } else {
          await adminAPI.updateMenuCategory(
            props.restaurantId,
            categoryDialog.value.category.id,
            categoryDialog.value.category
          )
          toast.success('Cập nhật danh mục thành công')
        }
        
        categoryDialog.value.show = false
        loadMenuData()
      } catch (error) {
        toast.error('Không thể lưu danh mục')
        console.error('Failed to save category:', error)
      }
    }
    
    const deleteCategory = (category) => {
      confirmDialog.value = {
        show: true,
        title: 'Xóa danh mục',
        message: `Bạn có chắc chắn muốn xóa danh mục "${category.name}"? Tất cả món ăn trong danh mục này cũng sẽ bị xóa.`,
        action: () => confirmDeleteCategory(category.id)
      }
    }
    
    const confirmDeleteCategory = async (categoryId) => {
      try {
        await adminAPI.deleteMenuCategory(props.restaurantId, categoryId)
        toast.success('Xóa danh mục thành công')
        confirmDialog.value.show = false
        loadMenuData()
      } catch (error) {
        toast.error('Không thể xóa danh mục')
        console.error('Failed to delete category:', error)
      }
    }
    
    const createMenuItem = (category = null) => {
      menuItemDialog.value = {
        show: true,
        isNew: true,
        menuItem: {
          name: '',
          description: '',
          price: 0,
          categoryId: category ? category.id : (categories.value.length > 0 ? categories.value[0].id : null),
          isAvailable: true,
          imageFile: null,
          isVegetarian: false,
          isSpicy: false,
          isFeatured: false,
          preparationTime: 15,
          ingredients: ''
        }
      }
    }
    
    const editMenuItem = (menuItem) => {
      menuItemDialog.value = {
        show: true,
        isNew: false,
        menuItem: { 
          ...menuItem,
          imageFile: null
        }
      }
    }
    
    const saveMenuItem = async () => {
      try {
        const formData = new FormData()
        const menuItem = menuItemDialog.value.menuItem
        
        // Add all text fields
        for (const key in menuItem) {
          if (key !== 'imageFile' && key !== 'image' && menuItem[key] !== null) {
            formData.append(key, menuItem[key])
          }
        }
        
        // Add image file if provided
        if (menuItem.imageFile) {
          formData.append('image', menuItem.imageFile)
        }
        
        if (menuItemDialog.value.isNew) {
          await adminAPI.createMenuItem(props.restaurantId, formData)
          toast.success('Tạo món ăn thành công')
        } else {
          await adminAPI.updateMenuItem(props.restaurantId, menuItem.id, formData)
          toast.success('Cập nhật món ăn thành công')
        }
        
        menuItemDialog.value.show = false
        loadMenuData()
      } catch (error) {
        toast.error('Không thể lưu món ăn')
        console.error('Failed to save menu item:', error)
      }
    }
    
    const viewMenuItem = (menuItem) => {
      menuItemDetailDialog.value = {
        show: true,
        menuItem
      }
    }
    
    const deleteMenuItem = (menuItem) => {
      confirmDialog.value = {
        show: true,
        title: 'Xóa món ăn',
        message: `Bạn có chắc chắn muốn xóa món ăn "${menuItem.name}"?`,
        action: () => confirmDeleteMenuItem(menuItem.id)
      }
    }
    
    const confirmDeleteMenuItem = async (menuItemId) => {
      try {
        await adminAPI.deleteMenuItem(props.restaurantId, menuItemId)
        toast.success('Xóa món ăn thành công')
        confirmDialog.value.show = false
        loadMenuData()
      } catch (error) {
        toast.error('Không thể xóa món ăn')
        console.error('Failed to delete menu item:', error)
      }
    }
    
    // Utility functions
    const getCategoryName = (categoryId) => {
      const category = categories.value.find(c => c.id === categoryId)
      return category ? category.name : 'Unknown'
    }
    
    const formatPrice = (price) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(price)
    }
    
    const truncateText = (text, maxLength) => {
      if (!text) return ''
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
    }
    
    // Watch for restaurant ID changes
    watch(() => props.restaurantId, () => {
      if (props.restaurantId) {
        loadMenuData()
      }
    }, { immediate: true })
    
    return {
      loading,
      categories,
      categoryDialog,
      menuItemDialog,
      menuItemDetailDialog,
      confirmDialog,
      loadMenuData,
      createCategory,
      editCategory,
      saveCategory,
      deleteCategory,
      createMenuItem,
      editMenuItem,
      saveMenuItem,
      viewMenuItem,
      deleteMenuItem,
      getCategoryName,
      formatPrice,
      truncateText
    }
  }
}
</script>

<style scoped>
.restaurant-menu-management {
  padding: 16px;
}
</style>
