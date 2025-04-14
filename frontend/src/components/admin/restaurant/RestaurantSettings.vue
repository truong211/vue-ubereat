<template>
  <div class="restaurant-settings">
    <v-tabs v-model="activeTab" class="mb-4">
      <v-tab value="general">Thông tin chung</v-tab>
      <v-tab value="hours">Giờ hoạt động</v-tab>
      <v-tab value="delivery">Giao hàng</v-tab>
      <v-tab value="payment">Thanh toán</v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <!-- General Settings Tab -->
      <v-window-item value="general">
        <v-card>
          <v-card-title>Thông tin chung</v-card-title>
          <v-card-text>
            <v-form ref="generalForm">
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="settings.general.name"
                    label="Tên nhà hàng"
                    variant="outlined"
                    :rules="[v => !!v || 'Tên nhà hàng là bắt buộc']"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-select
                    v-model="settings.general.cuisine"
                    :items="cuisineTypes"
                    label="Loại ẩm thực"
                    variant="outlined"
                    :rules="[v => !!v || 'Loại ẩm thực là bắt buộc']"
                  ></v-select>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="settings.general.phone"
                    label="Số điện thoại"
                    variant="outlined"
                    :rules="[v => !!v || 'Số điện thoại là bắt buộc']"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="settings.general.email"
                    label="Email"
                    variant="outlined"
                    :rules="[
                      v => !!v || 'Email là bắt buộc',
                      v => /.+@.+\..+/.test(v) || 'Email không hợp lệ'
                    ]"
                  ></v-text-field>
                </v-col>

                <v-col cols="12">
                  <v-text-field
                    v-model="settings.general.address"
                    label="Địa chỉ"
                    variant="outlined"
                    :rules="[v => !!v || 'Địa chỉ là bắt buộc']"
                  ></v-text-field>
                </v-col>

                <v-col cols="12">
                  <v-textarea
                    v-model="settings.general.description"
                    label="Mô tả"
                    variant="outlined"
                    rows="3"
                    auto-grow
                  ></v-textarea>
                </v-col>

                <v-col cols="12" md="6">
                  <v-select
                    v-model="settings.general.priceRange"
                    :items="priceRangeOptions"
                    label="Mức giá"
                    variant="outlined"
                  ></v-select>
                </v-col>

                <v-col cols="12" md="6">
                  <v-switch
                    v-model="settings.general.isActive"
                    label="Nhà hàng đang hoạt động"
                    color="success"
                    hide-details
                  ></v-switch>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              :loading="saving.general"
              @click="saveGeneralSettings"
            >
              Lưu thay đổi
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-window-item>

      <!-- Operating Hours Tab -->
      <v-window-item value="hours">
        <v-card>
          <v-card-title>Giờ hoạt động</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12">
                <v-switch
                  v-model="settings.hours.isOpen24Hours"
                  label="Mở cửa 24/7"
                  color="success"
                  hide-details
                  class="mb-4"
                ></v-switch>
              </v-col>

              <template v-if="!settings.hours.isOpen24Hours">
                <v-col cols="12" v-for="(day, index) in daysOfWeek" :key="index">
                  <v-card variant="outlined" class="pa-3 mb-2">
                    <div class="d-flex align-center mb-2">
                      <v-checkbox
                        v-model="settings.hours.schedule[index].isOpen"
                        :label="day"
                        hide-details
                        density="compact"
                      ></v-checkbox>
                      <v-spacer></v-spacer>
                      <v-btn
                        v-if="settings.hours.schedule[index].isOpen"
                        size="small"
                        variant="text"
                        color="primary"
                        @click="addTimeSlot(index)"
                      >
                        Thêm khung giờ
                      </v-btn>
                    </div>

                    <div v-if="settings.hours.schedule[index].isOpen">
                      <div
                        v-for="(timeSlot, timeIndex) in settings.hours.schedule[index].timeSlots"
                        :key="timeIndex"
                        class="d-flex align-center mb-2"
                      >
                        <v-text-field
                          v-model="timeSlot.open"
                          label="Giờ mở cửa"
                          type="time"
                          variant="outlined"
                          density="compact"
                          class="mr-2"
                          style="width: 150px;"
                        ></v-text-field>
                        <span class="mx-2">đến</span>
                        <v-text-field
                          v-model="timeSlot.close"
                          label="Giờ đóng cửa"
                          type="time"
                          variant="outlined"
                          density="compact"
                          class="mr-2"
                          style="width: 150px;"
                        ></v-text-field>
                        <v-btn
                          v-if="settings.hours.schedule[index].timeSlots.length > 1"
                          icon="mdi-delete"
                          variant="text"
                          color="error"
                          size="small"
                          @click="removeTimeSlot(index, timeIndex)"
                        ></v-btn>
                      </div>
                    </div>
                  </v-card>
                </v-col>
              </template>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              :loading="saving.hours"
              @click="saveHoursSettings"
            >
              Lưu thay đổi
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-window-item>

      <!-- Delivery Settings Tab -->
      <v-window-item value="delivery">
        <v-card>
          <v-card-title>Cài đặt giao hàng</v-card-title>
          <v-card-text>
            <v-form ref="deliveryForm">
              <v-row>
                <v-col cols="12">
                  <v-switch
                    v-model="settings.delivery.isDeliveryEnabled"
                    label="Cho phép giao hàng"
                    color="success"
                    hide-details
                    class="mb-4"
                  ></v-switch>
                </v-col>

                <template v-if="settings.delivery.isDeliveryEnabled">
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="settings.delivery.deliveryFee"
                      label="Phí giao hàng (VND)"
                      type="number"
                      variant="outlined"
                      :rules="[v => v >= 0 || 'Phí giao hàng không được âm']"
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="settings.delivery.freeDeliveryThreshold"
                      label="Miễn phí giao hàng từ (VND)"
                      type="number"
                      variant="outlined"
                      :rules="[v => v >= 0 || 'Giá trị không được âm']"
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="settings.delivery.minOrderAmount"
                      label="Giá trị đơn hàng tối thiểu (VND)"
                      type="number"
                      variant="outlined"
                      :rules="[v => v >= 0 || 'Giá trị không được âm']"
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="settings.delivery.maxDeliveryDistance"
                      label="Khoảng cách giao hàng tối đa (km)"
                      type="number"
                      variant="outlined"
                      :rules="[v => v > 0 || 'Khoảng cách phải lớn hơn 0']"
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="settings.delivery.estimatedDeliveryTime"
                      label="Thời gian giao hàng dự kiến (phút)"
                      type="number"
                      variant="outlined"
                      :rules="[v => v > 0 || 'Thời gian phải lớn hơn 0']"
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12">
                    <v-textarea
                      v-model="settings.delivery.deliveryNotes"
                      label="Ghi chú về giao hàng"
                      variant="outlined"
                      rows="3"
                      auto-grow
                    ></v-textarea>
                  </v-col>
                </template>
              </v-row>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              :loading="saving.delivery"
              @click="saveDeliverySettings"
            >
              Lưu thay đổi
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-window-item>

      <!-- Payment Settings Tab -->
      <v-window-item value="payment">
        <v-card>
          <v-card-title>Cài đặt thanh toán</v-card-title>
          <v-card-text>
            <v-form ref="paymentForm">
              <v-row>
                <v-col cols="12">
                  <p class="text-subtitle-1 mb-2">Phương thức thanh toán được chấp nhận:</p>
                  <v-checkbox
                    v-model="settings.payment.methods.cash"
                    label="Tiền mặt khi nhận hàng (COD)"
                    hide-details
                    class="mb-2"
                  ></v-checkbox>
                  <v-checkbox
                    v-model="settings.payment.methods.creditCard"
                    label="Thẻ tín dụng/ghi nợ"
                    hide-details
                    class="mb-2"
                  ></v-checkbox>
                  <v-checkbox
                    v-model="settings.payment.methods.bankTransfer"
                    label="Chuyển khoản ngân hàng"
                    hide-details
                    class="mb-2"
                  ></v-checkbox>
                  <v-checkbox
                    v-model="settings.payment.methods.momo"
                    label="Ví MoMo"
                    hide-details
                    class="mb-2"
                  ></v-checkbox>
                  <v-checkbox
                    v-model="settings.payment.methods.zalopay"
                    label="ZaloPay"
                    hide-details
                    class="mb-2"
                  ></v-checkbox>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="settings.payment.taxRate"
                    label="Thuế suất (%)"
                    type="number"
                    variant="outlined"
                    :rules="[v => v >= 0 || 'Thuế suất không được âm']"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-switch
                    v-model="settings.payment.includeTaxInPrice"
                    label="Giá đã bao gồm thuế"
                    color="success"
                    hide-details
                  ></v-switch>
                </v-col>

                <v-col cols="12">
                  <v-textarea
                    v-model="settings.payment.paymentNotes"
                    label="Ghi chú về thanh toán"
                    variant="outlined"
                    rows="3"
                    auto-grow
                  ></v-textarea>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              :loading="saving.payment"
              @click="savePaymentSettings"
            >
              Lưu thay đổi
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-window-item>
    </v-window>
  </div>
</template>

<script>
import { ref, onMounted, watch, defineProps, defineEmits } from 'vue'
import { useToast } from 'vue-toastification'
import { adminAPI } from '@/services/api.service'

export default {
  name: 'RestaurantSettings',
  
  props: {
    restaurant: {
      type: Object,
      required: true
    }
  },
  
  emits: ['updated'],
  
  setup(props, { emit }) {
    const toast = useToast()
    
    // State
    const activeTab = ref('general')
    const settings = ref({
      general: {
        name: '',
        cuisine: '',
        phone: '',
        email: '',
        address: '',
        description: '',
        priceRange: '$',
        isActive: true
      },
      hours: {
        isOpen24Hours: false,
        schedule: []
      },
      delivery: {
        isDeliveryEnabled: true,
        deliveryFee: 0,
        freeDeliveryThreshold: 0,
        minOrderAmount: 0,
        maxDeliveryDistance: 5,
        estimatedDeliveryTime: 30,
        deliveryNotes: ''
      },
      payment: {
        methods: {
          cash: true,
          creditCard: false,
          bankTransfer: false,
          momo: false,
          zalopay: false
        },
        taxRate: 0,
        includeTaxInPrice: true,
        paymentNotes: ''
      }
    })
    
    const saving = ref({
      general: false,
      hours: false,
      delivery: false,
      payment: false
    })
    
    // Form refs
    const generalForm = ref(null)
    const deliveryForm = ref(null)
    const paymentForm = ref(null)
    
    // Options
    const cuisineTypes = [
      'Italian',
      'Chinese',
      'Mexican',
      'Japanese',
      'Thai',
      'Vietnamese',
      'Indian',
      'American',
      'French',
      'Korean',
      'Other'
    ]
    
    const priceRangeOptions = [
      { title: '$', value: '$' },
      { title: '$$', value: '$$' },
      { title: '$$$', value: '$$$' },
      { title: '$$$$', value: '$$$$' }
    ]
    
    const daysOfWeek = [
      'Thứ Hai',
      'Thứ Ba',
      'Thứ Tư',
      'Thứ Năm',
      'Thứ Sáu',
      'Thứ Bảy',
      'Chủ Nhật'
    ]
    
    // Methods
    const initializeSettings = () => {
      // Initialize general settings
      settings.value.general = {
        name: props.restaurant.name || '',
        cuisine: props.restaurant.cuisine || '',
        phone: props.restaurant.phone || '',
        email: props.restaurant.email || '',
        address: props.restaurant.address || '',
        description: props.restaurant.description || '',
        priceRange: props.restaurant.priceRange || '$',
        isActive: props.restaurant.status === 'active'
      }
      
      // Initialize hours settings
      if (props.restaurant.openingHours) {
        try {
          const openingHours = typeof props.restaurant.openingHours === 'string'
            ? JSON.parse(props.restaurant.openingHours)
            : props.restaurant.openingHours
            
          settings.value.hours.isOpen24Hours = openingHours.isOpen24Hours || false
          settings.value.hours.schedule = openingHours.schedule || initializeSchedule()
        } catch (error) {
          console.error('Error parsing opening hours:', error)
          settings.value.hours.schedule = initializeSchedule()
        }
      } else {
        settings.value.hours.schedule = initializeSchedule()
      }
      
      // Initialize delivery settings
      if (props.restaurant.deliverySettings) {
        try {
          const deliverySettings = typeof props.restaurant.deliverySettings === 'string'
            ? JSON.parse(props.restaurant.deliverySettings)
            : props.restaurant.deliverySettings
            
          settings.value.delivery = {
            isDeliveryEnabled: deliverySettings.isDeliveryEnabled !== undefined
              ? deliverySettings.isDeliveryEnabled
              : true,
            deliveryFee: deliverySettings.deliveryFee || 0,
            freeDeliveryThreshold: deliverySettings.freeDeliveryThreshold || 0,
            minOrderAmount: deliverySettings.minOrderAmount || 0,
            maxDeliveryDistance: deliverySettings.maxDeliveryDistance || 5,
            estimatedDeliveryTime: deliverySettings.estimatedDeliveryTime || 30,
            deliveryNotes: deliverySettings.deliveryNotes || ''
          }
        } catch (error) {
          console.error('Error parsing delivery settings:', error)
        }
      }
      
      // Initialize payment settings
      if (props.restaurant.paymentSettings) {
        try {
          const paymentSettings = typeof props.restaurant.paymentSettings === 'string'
            ? JSON.parse(props.restaurant.paymentSettings)
            : props.restaurant.paymentSettings
            
          settings.value.payment = {
            methods: {
              cash: paymentSettings.methods?.cash !== undefined
                ? paymentSettings.methods.cash
                : true,
              creditCard: paymentSettings.methods?.creditCard || false,
              bankTransfer: paymentSettings.methods?.bankTransfer || false,
              momo: paymentSettings.methods?.momo || false,
              zalopay: paymentSettings.methods?.zalopay || false
            },
            taxRate: paymentSettings.taxRate || 0,
            includeTaxInPrice: paymentSettings.includeTaxInPrice !== undefined
              ? paymentSettings.includeTaxInPrice
              : true,
            paymentNotes: paymentSettings.paymentNotes || ''
          }
        } catch (error) {
          console.error('Error parsing payment settings:', error)
        }
      }
    }
    
    const initializeSchedule = () => {
      return daysOfWeek.map(() => ({
        isOpen: true,
        timeSlots: [{ open: '08:00', close: '22:00' }]
      }))
    }
    
    const addTimeSlot = (dayIndex) => {
      settings.value.hours.schedule[dayIndex].timeSlots.push({
        open: '08:00',
        close: '22:00'
      })
    }
    
    const removeTimeSlot = (dayIndex, timeIndex) => {
      settings.value.hours.schedule[dayIndex].timeSlots.splice(timeIndex, 1)
    }
    
    const saveGeneralSettings = async () => {
      if (!generalForm.value.validate()) return
      
      saving.value.general = true
      try {
        const data = {
          name: settings.value.general.name,
          cuisine: settings.value.general.cuisine,
          phone: settings.value.general.phone,
          email: settings.value.general.email,
          address: settings.value.general.address,
          description: settings.value.general.description,
          priceRange: settings.value.general.priceRange,
          status: settings.value.general.isActive ? 'active' : 'suspended'
        }
        
        await adminAPI.updateRestaurant(props.restaurant.id, data)
        toast.success('Cập nhật thông tin chung thành công')
        emit('updated')
      } catch (error) {
        toast.error('Không thể cập nhật thông tin chung')
        console.error('Failed to save general settings:', error)
      } finally {
        saving.value.general = false
      }
    }
    
    const saveHoursSettings = async () => {
      saving.value.hours = true
      try {
        const data = {
          openingHours: JSON.stringify({
            isOpen24Hours: settings.value.hours.isOpen24Hours,
            schedule: settings.value.hours.schedule
          })
        }
        
        await adminAPI.updateRestaurant(props.restaurant.id, data)
        toast.success('Cập nhật giờ hoạt động thành công')
        emit('updated')
      } catch (error) {
        toast.error('Không thể cập nhật giờ hoạt động')
        console.error('Failed to save hours settings:', error)
      } finally {
        saving.value.hours = false
      }
    }
    
    const saveDeliverySettings = async () => {
      if (!deliveryForm.value.validate()) return
      
      saving.value.delivery = true
      try {
        const data = {
          deliverySettings: JSON.stringify(settings.value.delivery)
        }
        
        await adminAPI.updateRestaurant(props.restaurant.id, data)
        toast.success('Cập nhật cài đặt giao hàng thành công')
        emit('updated')
      } catch (error) {
        toast.error('Không thể cập nhật cài đặt giao hàng')
        console.error('Failed to save delivery settings:', error)
      } finally {
        saving.value.delivery = false
      }
    }
    
    const savePaymentSettings = async () => {
      if (!paymentForm.value.validate()) return
      
      saving.value.payment = true
      try {
        const data = {
          paymentSettings: JSON.stringify(settings.value.payment)
        }
        
        await adminAPI.updateRestaurant(props.restaurant.id, data)
        toast.success('Cập nhật cài đặt thanh toán thành công')
        emit('updated')
      } catch (error) {
        toast.error('Không thể cập nhật cài đặt thanh toán')
        console.error('Failed to save payment settings:', error)
      } finally {
        saving.value.payment = false
      }
    }
    
    // Watch for restaurant changes
    watch(() => props.restaurant, () => {
      if (props.restaurant) {
        initializeSettings()
      }
    }, { immediate: true })
    
    return {
      activeTab,
      settings,
      saving,
      generalForm,
      deliveryForm,
      paymentForm,
      cuisineTypes,
      priceRangeOptions,
      daysOfWeek,
      initializeSettings,
      addTimeSlot,
      removeTimeSlot,
      saveGeneralSettings,
      saveHoursSettings,
      saveDeliverySettings,
      savePaymentSettings
    }
  }
}
</script>

<style scoped>
.restaurant-settings {
  padding: 16px;
}
</style>
