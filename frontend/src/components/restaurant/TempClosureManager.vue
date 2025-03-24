<template>
  <v-card>
    <v-card-text>
      <h2 class="text-h5 mb-6">Quản Lý Trạng Thái Nhà Hàng</h2>
      
      <!-- Current Status Summary -->
      <v-card variant="outlined" class="mb-6">
        <v-card-text>
          <v-row align="center">
            <v-col cols="12" md="2" class="text-center">
              <v-avatar
                size="64"
                :color="settings.isTemporarilyClosed ? 'error' : 'success'"
                class="mb-2"
              >
                <v-icon size="36" color="white">
                  {{ settings.isTemporarilyClosed ? 'mdi-door-closed' : 'mdi-door-open' }}
                </v-icon>
              </v-avatar>
            </v-col>
            <v-col cols="12" md="10">
              <div class="d-flex align-center mb-1">
                <h3 class="text-h6 me-2">Trạng thái hiện tại:</h3>
                <v-chip
                  :color="settings.isTemporarilyClosed ? 'error' : 'success'"
                  class="text-uppercase"
                >
                  {{ settings.isTemporarilyClosed ? 'Đóng cửa' : 'Đang mở cửa' }}
                </v-chip>
              </div>
              <p v-if="settings.isTemporarilyClosed && settings.reopenDate" class="mb-0">
                Dự kiến mở cửa lại vào: 
                <strong>{{ formatDateTime(settings.reopenDate) }}</strong>
              </p>
              <p v-if="settings.isTemporarilyClosed && settings.closureReason" class="mb-0">
                Lý do: {{ settings.closureReason }}
              </p>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
      
      <!-- Quick Status Toggle -->
      <v-row class="mb-4">
        <v-col cols="12">
          <v-card variant="outlined">
            <v-card-text>
              <h3 class="text-subtitle-1 mb-4">Thay đổi nhanh trạng thái</h3>
              <v-row>
                <v-col cols="12" md="3">
                  <v-btn
                    block
                    color="success"
                    :variant="!settings.isTemporarilyClosed && availabilityStatus === 'online' ? 'flat' : 'outlined'"
                    height="56"
                    @click="quickUpdateStatus('online')"
                  >
                    <v-icon start>mdi-door-open</v-icon>
                    Mở cửa
                  </v-btn>
                </v-col>
                
                <v-col cols="12" md="3">
                  <v-btn
                    block
                    color="warning"
                    :variant="!settings.isTemporarilyClosed && availabilityStatus === 'busy' ? 'flat' : 'outlined'"
                    height="56"
                    @click="quickUpdateStatus('busy')"
                  >
                    <v-icon start>mdi-account-multiple</v-icon>
                    Đang bận
                  </v-btn>
                </v-col>
                
                <v-col cols="12" md="3">
                  <v-btn
                    block
                    color="info"
                    :variant="!settings.isTemporarilyClosed && availabilityStatus === 'pause_orders' ? 'flat' : 'outlined'"
                    height="56"
                    @click="quickUpdateStatus('pause_orders')"
                  >
                    <v-icon start>mdi-pause-circle</v-icon>
                    Tạm ngưng nhận đơn
                  </v-btn>
                </v-col>
                
                <v-col cols="12" md="3">
                  <v-btn
                    block
                    color="error"
                    :variant="settings.isTemporarilyClosed ? 'flat' : 'outlined'"
                    height="56"
                    @click="openTemporaryClosureDialog"
                  >
                    <v-icon start>mdi-door-closed</v-icon>
                    Đóng cửa
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      
      <!-- Operating Hours Section -->
      <v-card variant="outlined" class="mb-6">
        <v-card-text>
          <h3 class="text-subtitle-1 mb-4">Giờ mở cửa thông thường</h3>
          <v-table density="comfortable">
            <thead>
              <tr>
                <th>Ngày trong tuần</th>
                <th>Trạng thái</th>
                <th>Giờ mở cửa</th>
                <th>Giờ đóng cửa</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(day, index) in daysOfWeek" :key="index">
                <td>{{ day.label }}</td>
                <td>
                  <v-switch
                    v-model="operatingHours[day.value].enabled"
                    hide-details
                    density="compact"
                    color="success"
                    :label="operatingHours[day.value].enabled ? 'Mở cửa' : 'Đóng cửa'"
                  ></v-switch>
                </td>
                <td>
                  <v-text-field
                    v-model="operatingHours[day.value].open"
                    type="time"
                    density="compact"
                    variant="outlined"
                    hide-details
                    :disabled="!operatingHours[day.value].enabled"
                  ></v-text-field>
                </td>
                <td>
                  <v-text-field
                    v-model="operatingHours[day.value].close"
                    type="time"
                    density="compact"
                    variant="outlined"
                    hide-details
                    :disabled="!operatingHours[day.value].enabled"
                  ></v-text-field>
                </td>
              </tr>
            </tbody>
          </v-table>
          
          <div class="d-flex justify-end mt-4">
            <v-btn
              color="primary"
              @click="saveOperatingHours"
              :loading="savingHours"
            >
              Lưu giờ mở cửa
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
      
      <!-- Preparation Time Settings -->
      <v-card variant="outlined" class="mb-6">
        <v-card-text>
          <h3 class="text-subtitle-1 mb-4">Cài đặt thời gian chuẩn bị</h3>
          
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="defaultPrepTime"
                type="number"
                label="Thời gian chuẩn bị mặc định (phút)"
                variant="outlined"
                density="comfortable"
                min="1"
                :rules="[v => v > 0 || 'Thời gian phải lớn hơn 0']"
              ></v-text-field>
              <div class="text-caption">
                Áp dụng cho tất cả các món không có thời gian chuẩn bị riêng
              </div>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-select
                v-model="prepTimeAdjustment"
                :items="prepTimeAdjustOptions"
                label="Điều chỉnh thời gian chuẩn bị khi bận"
                variant="outlined"
                density="comfortable"
              ></v-select>
              <div class="text-caption">
                Tự động điều chỉnh thời gian chuẩn bị khi nhà hàng có nhiều đơn
              </div>
            </v-col>
            
            <v-col cols="12">
              <v-switch
                v-model="autoBusyMode"
                label="Tự động chuyển sang chế độ 'Đang bận' khi có nhiều đơn hàng"
                color="warning"
              ></v-switch>
              
              <v-expand-transition>
                <div v-if="autoBusyMode" class="ml-8 mt-2">
                  <v-slider
                    v-model="autoBusyThreshold"
                    :min="3"
                    :max="20"
                    :step="1"
                    label="Ngưỡng đơn hàng để chuyển sang chế độ bận"
                    show-ticks="always"
                    thumb-label
                  ></v-slider>
                </div>
              </v-expand-transition>
            </v-col>
            
            <v-col cols="12" class="d-flex justify-end">
              <v-btn
                color="primary"
                @click="savePrepTimeSettings"
                :loading="savingPrepTime"
              >
                Lưu cài đặt thời gian
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
      
      <!-- Scheduled Closures -->
      <v-card variant="outlined" class="mb-6">
        <v-card-text>
          <div class="d-flex justify-space-between align-center mb-4">
            <h3 class="text-subtitle-1">Lịch đóng cửa đã lên kế hoạch</h3>
            <v-btn
              color="primary"
              variant="text"
              prepend-icon="mdi-plus"
              @click="openScheduleDialog"
            >
              Thêm lịch đóng cửa
            </v-btn>
          </div>
          
          <v-table v-if="scheduledClosures.length > 0" density="comfortable">
            <thead>
              <tr>
                <th>Ngày bắt đầu</th>
                <th>Ngày kết thúc</th>
                <th>Lý do</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(closure, index) in scheduledClosures" :key="index">
                <td>{{ formatDate(closure.startDate) }}</td>
                <td>{{ formatDate(closure.endDate) }}</td>
                <td>{{ closure.reason }}</td>
                <td>
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    color="error"
                    size="small"
                    @click="removeScheduledClosure(index)"
                  ></v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
          
          <v-alert
            v-else
            type="info"
            variant="tonal"
            icon="mdi-information"
          >
            Chưa có lịch đóng cửa nào được lên kế hoạch.
          </v-alert>
        </v-card-text>
      </v-card>
    </v-card-text>
  </v-card>
  
  <!-- Temporary Closure Dialog -->
  <v-dialog v-model="closureDialog.show" max-width="500">
    <v-card>
      <v-card-title>Đóng cửa tạm thời</v-card-title>
      <v-card-text>
        <v-alert
          type="warning"
          variant="tonal"
          class="mb-4"
        >
          Khi đóng cửa tạm thời, nhà hàng sẽ không nhận đơn hàng mới cho đến khi mở cửa lại.
        </v-alert>

        <v-text-field
          v-model="closureDialog.reopenDate"
          type="datetime-local"
          label="Thời gian mở cửa trở lại"
          :min="minReopenDate"
          :rules="[rules.required, rules.futureDate]"
        ></v-text-field>

        <v-text-field
          v-model="closureDialog.reason"
          label="Lý do đóng cửa"
          :rules="[rules.required]"
          hint="Thông tin này sẽ hiển thị cho khách hàng"
          persistent-hint
        ></v-text-field>

        <v-switch
          v-model="closureDialog.showReason"
          label="Hiển thị lý do đóng cửa cho khách hàng"
        ></v-switch>

        <v-switch
          v-model="closureDialog.acceptPreOrders"
          label="Chấp nhận đặt trước cho thời gian mở cửa trở lại"
        ></v-switch>

        <!-- Existing Orders Alert -->
        <v-alert
          v-if="existingOrders.length > 0"
          type="info"
          variant="outlined"
          class="mt-4"
        >
          <template v-slot:title>
            Đơn hàng hiện tại ({{ existingOrders.length }})
          </template>
          <p>Bạn có {{ existingOrders.length }} đơn hàng đang chờ xử lý. Vui lòng chọn cách xử lý:</p>
          <v-radio-group v-model="existingOrdersHandling" class="mt-2">
            <v-radio
              label="Hoàn thành tất cả đơn hàng hiện tại"
              value="complete"
            ></v-radio>
            <v-radio
              label="Hủy tất cả đơn hàng và thông báo cho khách hàng"
              value="cancel"
            ></v-radio>
            <v-radio
              label="Xử lý từng đơn hàng riêng lẻ"
              value="individual"
            ></v-radio>
          </v-radio-group>

          <v-expand-transition>
            <div v-if="existingOrdersHandling === 'individual'" class="mt-4">
              <v-list>
                <v-list-item
                  v-for="order in existingOrders"
                  :key="order.id"
                  :subtitle="`Đơn #${order.id} - ${order.items.length} món - ${formatPrice(order.total)}`"
                >
                  <template v-slot:append>
                    <v-btn-group>
                      <v-btn
                        color="success"
                        size="small"
                        @click="handleExistingOrder(order.id, 'complete')"
                      >
                        Hoàn thành
                      </v-btn>
                      <v-btn
                        color="error"
                        size="small"
                        @click="handleExistingOrder(order.id, 'cancel')"
                      >
                        Hủy
                      </v-btn>
                    </v-btn-group>
                  </template>
                </v-list-item>
              </v-list>
            </div>
          </v-expand-transition>
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          @click="closureDialog.show = false"
        >
          Hủy
        </v-btn>
        <v-btn
          color="error"
          :loading="saving"
          @click="saveTemporaryClosure"
        >
          Xác nhận đóng cửa
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  
  <!-- Schedule Closure Dialog -->
  <v-dialog v-model="scheduleDialog.show" max-width="500">
    <v-card>
      <v-card-title>Lên lịch đóng cửa</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="scheduleDialog.startDate"
              type="date"
              label="Ngày bắt đầu"
              :min="minReopenDate.split('T')[0]"
              :rules="[rules.required]"
            ></v-text-field>
          </v-col>
          
          <v-col cols="12" md="6">
            <v-text-field
              v-model="scheduleDialog.endDate"
              type="date"
              label="Ngày kết thúc"
              :min="scheduleDialog.startDate || minReopenDate.split('T')[0]"
              :rules="[rules.required]"
            ></v-text-field>
          </v-col>
          
          <v-col cols="12">
            <v-text-field
              v-model="scheduleDialog.reason"
              label="Lý do đóng cửa"
              :rules="[rules.required]"
            ></v-text-field>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          @click="scheduleDialog.show = false"
        >
          Hủy
        </v-btn>
        <v-btn
          color="primary"
          :loading="saving"
          @click="addScheduledClosure"
        >
          Lưu lịch
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

export default {
  name: 'TempClosureManager',

  setup() {
    const store = useStore()
    const saving = ref(false)
    const savingHours = ref(false)
    const savingPrepTime = ref(false)
    const availabilityStatus = ref('online')

    // Settings state
    const settings = ref({
      isTemporarilyClosed: false,
      reopenDate: null,
      closureReason: '',
      showReason: true,
      acceptPreOrders: false
    })
    
    // Operating hours
    const daysOfWeek = [
      { value: 'monday', label: 'Thứ 2' },
      { value: 'tuesday', label: 'Thứ 3' },
      { value: 'wednesday', label: 'Thứ 4' },
      { value: 'thursday', label: 'Thứ 5' },
      { value: 'friday', label: 'Thứ 6' },
      { value: 'saturday', label: 'Thứ 7' },
      { value: 'sunday', label: 'Chủ nhật' }
    ]
    
    const operatingHours = ref({
      monday: { enabled: true, open: '09:00', close: '22:00' },
      tuesday: { enabled: true, open: '09:00', close: '22:00' },
      wednesday: { enabled: true, open: '09:00', close: '22:00' },
      thursday: { enabled: true, open: '09:00', close: '22:00' },
      friday: { enabled: true, open: '09:00', close: '22:00' },
      saturday: { enabled: true, open: '10:00', close: '23:00' },
      sunday: { enabled: true, open: '10:00', close: '22:00' }
    })
    
    // Preparation time settings
    const defaultPrepTime = ref(15)
    const prepTimeAdjustment = ref('auto')
    const autoBusyMode = ref(true)
    const autoBusyThreshold = ref(10)
    
    const prepTimeAdjustOptions = [
      { title: 'Tự động điều chỉnh theo số lượng đơn', value: 'auto' },
      { title: 'Tăng 25% khi bận', value: '25_percent' },
      { title: 'Tăng 50% khi bận', value: '50_percent' },
      { title: 'Tăng 5 phút khi bận', value: '5_minutes' },
      { title: 'Tăng 10 phút khi bận', value: '10_minutes' },
      { title: 'Không điều chỉnh', value: 'none' }
    ]
    
    // Scheduled closures
    const scheduledClosures = ref([])
    
    // Closure dialog
    const closureDialog = ref({
      show: false,
      reopenDate: null,
      reason: '',
      showReason: true,
      acceptPreOrders: false
    })
    
    // Schedule dialog
    const scheduleDialog = ref({
      show: false,
      startDate: null,
      endDate: null,
      reason: ''
    })

    // Existing orders state
    const existingOrders = ref([])
    const existingOrdersHandling = ref('complete')

    // Computed
    const minReopenDate = computed(() => {
      const now = new Date()
      return now.toISOString().slice(0, 16)
    })

    // Validation rules
    const rules = {
      required: v => !!v || 'Trường này là bắt buộc',
      futureDate: v => {
        if (!v) return true
        const date = new Date(v)
        const now = new Date()
        return date > now || 'Thời gian mở cửa phải ở tương lai'
      }
    }

    // Format date and time
    const formatDateTime = (dateStr) => {
      if (!dateStr) return ''
      return format(new Date(dateStr), 'HH:mm - dd/MM/yyyy', { locale: vi })
    }
    
    const formatDate = (dateStr) => {
      if (!dateStr) return ''
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: vi })
    }
    
    const formatPrice = (amount) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(amount)
    }

    // Methods
    const loadSettings = async () => {
      try {
        const restaurantId = store.state.restaurantAdmin.restaurant.id
        
        // Load temporary closure settings
        const response = await store.dispatch('restaurantAdmin/fetchRestaurantSettings', restaurantId)
        settings.value = response.tempClosureSettings || {
          isTemporarilyClosed: false,
          reopenDate: null,
          closureReason: '',
          showReason: true,
          acceptPreOrders: false
        }
        
        // Load operating hours
        if (response.operatingHours) {
          operatingHours.value = response.operatingHours
        }
        
        // Load scheduled closures
        if (response.scheduledClosures) {
          scheduledClosures.value = response.scheduledClosures
        }
        
        // Load preparation time settings
        if (response.prepTimeSettings) {
          defaultPrepTime.value = response.prepTimeSettings.defaultPrepTime || 15
          prepTimeAdjustment.value = response.prepTimeSettings.adjustment || 'auto'
          autoBusyMode.value = response.prepTimeSettings.autoBusyMode !== undefined ? 
            response.prepTimeSettings.autoBusyMode : true
          autoBusyThreshold.value = response.prepTimeSettings.autoBusyThreshold || 10
        }
        
        // Load availability status
        availabilityStatus.value = response.availabilityStatus || 'online'
      } catch (error) {
        console.error('Failed to load temporary closure settings:', error)
      }
    }

    const loadExistingOrders = async () => {
      try {
        const response = await store.dispatch('restaurantAdmin/fetchOrders', {
          status: 'pending'
        })
        existingOrders.value = response.orders || []
      } catch (error) {
        console.error('Failed to load existing orders:', error)
      }
    }
    
    const quickUpdateStatus = async (status) => {
      saving.value = true
      try {
        const restaurantId = store.state.restaurantAdmin.restaurant.id
        
        if (status === 'online' || status === 'busy' || status === 'pause_orders') {
          // Open restaurant or set to busy/pause orders
          settings.value.isTemporarilyClosed = false
          availabilityStatus.value = status
          
          await store.dispatch('restaurantAdmin/updateRestaurantStatus', {
            restaurantId,
            isOpen: true,
            status: status,
            settings: settings.value
          })
        }
      } catch (error) {
        console.error('Failed to update restaurant status:', error)
      } finally {
        saving.value = false
      }
    }
    
    const openTemporaryClosureDialog = () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(9, 0, 0)
      
      closureDialog.value = {
        show: true,
        reopenDate: tomorrow.toISOString().slice(0, 16),
        reason: '',
        showReason: true,
        acceptPreOrders: false
      }
    }
    
    const saveTemporaryClosure = async () => {
      if (!closureDialog.value.reopenDate || !closureDialog.value.reason) return
      
      saving.value = true
      try {
        const restaurantId = store.state.restaurantAdmin.restaurant.id
        
        // Update settings
        settings.value = {
          isTemporarilyClosed: true,
          reopenDate: closureDialog.value.reopenDate,
          closureReason: closureDialog.value.reason,
          showReason: closureDialog.value.showReason,
          acceptPreOrders: closureDialog.value.acceptPreOrders
        }
        
        await store.dispatch('restaurantAdmin/updateTempClosure', {
          restaurantId,
          settings: settings.value
        })

        // Handle existing orders
        if (existingOrders.value.length > 0) {
          if (existingOrdersHandling.value === 'complete') {
            await Promise.all(existingOrders.value.map(order => 
              store.dispatch('restaurantAdmin/updateOrder', {
                orderId: order.id,
                status: 'preparing'
              })
            ))
          } else if (existingOrdersHandling.value === 'cancel') {
            await Promise.all(existingOrders.value.map(order =>
              store.dispatch('restaurantAdmin/updateOrder', {
                orderId: order.id,
                status: 'cancelled',
                reason: 'Nhà hàng tạm thời đóng cửa'
              })
            ))
          }
        }
        
        // Close dialog
        closureDialog.value.show = false
      } catch (error) {
        console.error('Failed to save temporary closure settings:', error)
      } finally {
        saving.value = false
      }
    }
    
    const saveOperatingHours = async () => {
      savingHours.value = true
      try {
        const restaurantId = store.state.restaurantAdmin.restaurant.id
        
        await store.dispatch('restaurantAdmin/updateOperatingHours', {
          restaurantId,
          operatingHours: operatingHours.value
        })
      } catch (error) {
        console.error('Failed to save operating hours:', error)
      } finally {
        savingHours.value = false
      }
    }
    
    const savePrepTimeSettings = async () => {
      savingPrepTime.value = true
      try {
        const restaurantId = store.state.restaurantAdmin.restaurant.id
        
        await store.dispatch('restaurantAdmin/updatePrepTimeSettings', {
          restaurantId,
          settings: {
            defaultPrepTime: defaultPrepTime.value,
            adjustment: prepTimeAdjustment.value,
            autoBusyMode: autoBusyMode.value,
            autoBusyThreshold: autoBusyThreshold.value
          }
        })
      } catch (error) {
        console.error('Failed to save preparation time settings:', error)
      } finally {
        savingPrepTime.value = false
      }
    }
    
    const openScheduleDialog = () => {
      const today = new Date().toISOString().slice(0, 10)
      
      scheduleDialog.value = {
        show: true,
        startDate: today,
        endDate: today,
        reason: ''
      }
    }
    
    const addScheduledClosure = async () => {
      if (!scheduleDialog.value.startDate || !scheduleDialog.value.endDate || !scheduleDialog.value.reason) return
      
      saving.value = true
      try {
        // Add to local array
        scheduledClosures.value.push({
          startDate: scheduleDialog.value.startDate,
          endDate: scheduleDialog.value.endDate,
          reason: scheduleDialog.value.reason
        })
        
        // Save to server
        const restaurantId = store.state.restaurantAdmin.restaurant.id
        
        await store.dispatch('restaurantAdmin/updateScheduledClosures', {
          restaurantId,
          scheduledClosures: scheduledClosures.value
        })
        
        // Close dialog
        scheduleDialog.value.show = false
      } catch (error) {
        console.error('Failed to add scheduled closure:', error)
        // Remove from local array if server save failed
        scheduledClosures.value.pop()
      } finally {
        saving.value = false
      }
    }
    
    const removeScheduledClosure = async (index) => {
      saving.value = true
      try {
        // Remove from local array
        const removed = scheduledClosures.value.splice(index, 1)
        
        // Save to server
        const restaurantId = store.state.restaurantAdmin.restaurant.id
        
        await store.dispatch('restaurantAdmin/updateScheduledClosures', {
          restaurantId,
          scheduledClosures: scheduledClosures.value
        })
      } catch (error) {
        console.error('Failed to remove scheduled closure:', error)
        // Restore to local array if server save failed
        scheduledClosures.value.splice(index, 0, removed[0])
      } finally {
        saving.value = false
      }
    }

    const handleExistingOrder = async (orderId, action) => {
      try {
        await store.dispatch('restaurantAdmin/updateOrder', {
          orderId,
          status: action === 'complete' ? 'preparing' : 'cancelled',
          reason: action === 'cancel' ? 'Nhà hàng tạm thời đóng cửa' : undefined
        })
        // Remove from local list
        existingOrders.value = existingOrders.value.filter(o => o.id !== orderId)
      } catch (error) {
        console.error(`Failed to ${action} order:`, error)
      }
    }

    // Load initial data
    onMounted(() => {
      loadSettings()
      loadExistingOrders()
    })

    return {
      settings,
      saving,
      savingHours,
      savingPrepTime,
      existingOrders,
      existingOrdersHandling,
      minReopenDate,
      rules,
      daysOfWeek,
      operatingHours,
      defaultPrepTime,
      prepTimeAdjustment,
      prepTimeAdjustOptions,
      autoBusyMode,
      autoBusyThreshold,
      scheduledClosures,
      availabilityStatus,
      closureDialog,
      scheduleDialog,
      openTemporaryClosureDialog,
      saveTemporaryClosure,
      quickUpdateStatus,
      saveOperatingHours,
      savePrepTimeSettings,
      openScheduleDialog,
      addScheduledClosure,
      removeScheduledClosure,
      handleExistingOrder,
      formatDateTime,
      formatDate,
      formatPrice
    }
  }
}
</script>

<style scoped>
.cursor-move {
  cursor: move;
}
</style>