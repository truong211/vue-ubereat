<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Cài đặt giao hàng</h1>
        
        <v-card class="mb-4">
          <v-card-title>Cấu hình giao hàng chung</v-card-title>
          <v-card-text>
            <v-form ref="globalForm" @submit.prevent="saveGlobalConfig">
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="globalConfig.maxDeliveryDistance"
                    label="Khoảng cách giao hàng tối đa (km)"
                    type="number"
                    min="0"
                    step="0.5"
                    variant="outlined"
                    :rules="[v => v >= 0 || 'Khoảng cách phải lớn hơn 0']"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="globalConfig.minOrderAmountForDelivery"
                    label="Giá trị đơn hàng tối thiểu để giao hàng"
                    type="number"
                    min="0"
                    step="1000"
                    variant="outlined"
                    :rules="[v => v >= 0 || 'Giá trị phải lớn hơn 0']"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="globalConfig.baseDeliveryFee"
                    label="Phí giao hàng cơ bản"
                    type="number"
                    min="0"
                    step="1000"
                    variant="outlined"
                    :rules="[v => v >= 0 || 'Phí phải lớn hơn 0']"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="globalConfig.freeDeliveryThreshold"
                    label="Ngưỡng miễn phí giao hàng (để trống nếu không áp dụng)"
                    type="number"
                    min="0"
                    step="1000"
                    variant="outlined"
                    :rules="[v => v >= 0 || 'Giá trị phải lớn hơn 0']"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12">
                  <v-switch
                    v-model="globalConfig.useDistanceBasedFee"
                    label="Sử dụng phí giao hàng dựa trên khoảng cách"
                    density="comfortable"
                    color="primary"
                  ></v-switch>
                </v-col>
                
                <v-col cols="12" md="6" v-if="globalConfig.useDistanceBasedFee">
                  <v-text-field
                    v-model.number="globalConfig.feePerKilometer"
                    label="Phí giao hàng theo km"
                    type="number"
                    min="0"
                    step="1000"
                    variant="outlined"
                    :rules="[v => v >= 0 || 'Phí phải lớn hơn 0']"
                  ></v-text-field>
                </v-col>
              </v-row>
              
              <v-btn
                color="primary"
                type="submit"
                :loading="savingGlobal"
                class="mt-4"
              >
                Lưu cấu hình chung
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>

        <v-card v-if="globalConfig.useDistanceBasedFee" class="mb-4">
          <v-card-title class="d-flex align-center">
            <span>Thiết lập phí theo khoảng cách</span>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              size="small"
              variant="tonal"
              @click="addNewTier"
              prepend-icon="mdi-plus"
            >
              Thêm mức phí
            </v-btn>
          </v-card-title>
          
          <v-card-text>
            <div v-if="feeTiers.length === 0" class="text-center py-4">
              <p class="text-body-1 text-medium-emphasis">Chưa có mức phí nào được cấu hình. Hãy thêm mức phí mới.</p>
            </div>
            
            <v-table v-else>
              <thead>
                <tr>
                  <th>Khoảng cách tối thiểu (km)</th>
                  <th>Khoảng cách tối đa (km)</th>
                  <th>Phí giao hàng</th>
                  <th>Thứ tự hiển thị</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(tier, index) in feeTiers" :key="index">
                  <td>
                    <v-text-field
                      v-model.number="tier.minDistance"
                      type="number"
                      min="0"
                      step="0.1"
                      density="compact"
                      variant="outlined"
                      hide-details
                    ></v-text-field>
                  </td>
                  <td>
                    <v-text-field
                      v-model.number="tier.maxDistance"
                      type="number"
                      min="0"
                      step="0.1" 
                      density="compact"
                      variant="outlined"
                      hide-details
                    ></v-text-field>
                  </td>
                  <td>
                    <v-text-field
                      v-model.number="tier.fee"
                      type="number"
                      min="0"
                      step="1000"
                      density="compact"
                      variant="outlined"
                      hide-details
                    ></v-text-field>
                  </td>
                  <td>
                    <v-text-field
                      v-model.number="tier.displayOrder"
                      type="number"
                      min="1"
                      step="1"
                      density="compact"
                      variant="outlined"
                      hide-details
                    ></v-text-field>
                  </td>
                  <td>
                    <v-switch
                      v-model="tier.isActive"
                      color="primary"
                      density="compact"
                      hide-details
                    ></v-switch>
                  </td>
                  <td>
                    <v-btn
                      icon
                      variant="text"
                      color="error"
                      size="small"
                      @click="removeTier(index)"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
            
            <v-btn
              color="primary"
              @click="saveFeeTiers"
              :loading="savingTiers"
              class="mt-4"
            >
              Lưu các mức phí
            </v-btn>
          </v-card-text>
        </v-card>
        
        <v-card class="mb-4">
          <v-card-title>Ví dụ tính phí giao hàng</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model.number="simulationData.distance"
                  label="Khoảng cách (km)"
                  type="number"
                  min="0"
                  step="0.5"
                  variant="outlined"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="4">
                <v-text-field
                  v-model.number="simulationData.orderAmount"
                  label="Giá trị đơn hàng"
                  type="number"
                  min="0"
                  step="10000"
                  variant="outlined"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="4" class="d-flex align-center">
                <v-btn
                  color="primary"
                  @click="calculateFee"
                  :loading="calculating"
                  variant="tonal"
                >
                  Tính phí giao hàng
                </v-btn>
              </v-col>
            </v-row>
            
            <v-alert
              v-if="simulationResult"
              :color="simulationResult.canDeliver ? 'success' : 'warning'"
              class="mt-4"
              variant="tonal"
            >
              <div v-if="simulationResult.canDeliver">
                <strong>Có thể giao hàng!</strong>
                <div class="mt-1">Phí giao hàng: {{ formatCurrency(simulationResult.deliveryFee) }}</div>
              </div>
              <div v-else>
                <strong>Không thể giao hàng!</strong>
                <div class="mt-1">Lý do: {{ simulationResult.message }}</div>
              </div>
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Snackbar for notifications -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
    >
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">Đóng</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import axios from 'axios';

export default {
  name: 'DeliverySettings',
  
  setup() {
    const globalConfig = ref({
      maxDeliveryDistance: 10.00,
      minOrderAmountForDelivery: 50000.00,
      baseDeliveryFee: 15000.00,
      useDistanceBasedFee: true,
      feePerKilometer: 5000.00,
      freeDeliveryThreshold: null,
      isActive: true
    });
    
    const feeTiers = ref([]);
    const savingGlobal = ref(false);
    const savingTiers = ref(false);
    const calculating = ref(false);
    
    const simulationData = reactive({
      distance: 3,
      orderAmount: 100000
    });
    
    const simulationResult = ref(null);
    
    const snackbar = reactive({
      show: false,
      text: '',
      color: 'success'
    });
    
    const loadGlobalConfig = async () => {
      try {
        const response = await axios.get('/api/delivery-configs/global');
        if (response.data.success && response.data.data) {
          globalConfig.value = { ...response.data.data };
          if (response.data.data.feeTiers) {
            feeTiers.value = [...response.data.data.feeTiers];
          }
        }
      } catch (error) {
        showSnackbar('Không thể tải cấu hình giao hàng', 'error');
        console.error('Error loading delivery config:', error);
      }
    };
    
    const saveGlobalConfig = async () => {
      savingGlobal.value = true;
      try {
        let configData = { ...globalConfig.value };
        
        // Remove feeTiers if it exists in the config
        if (configData.feeTiers) {
          delete configData.feeTiers;
        }
        
        let response;
        if (configData.id) {
          // Update existing config
          response = await axios.put(`/api/delivery-configs/${configData.id}`, configData);
        } else {
          // Create new global config
          response = await axios.post('/api/delivery-configs', {
            ...configData,
            restaurantId: null
          });
        }
        
        if (response.data.success) {
          globalConfig.value = response.data.data;
          showSnackbar('Cấu hình giao hàng đã được lưu thành công');
        }
      } catch (error) {
        showSnackbar('Không thể lưu cấu hình giao hàng', 'error');
        console.error('Error saving delivery config:', error);
      } finally {
        savingGlobal.value = false;
      }
    };
    
    const addNewTier = () => {
      const maxOrder = feeTiers.value.length > 0 
        ? Math.max(...feeTiers.value.map(t => t.displayOrder)) 
        : 0;
      
      const lastTier = feeTiers.value.length > 0 
        ? feeTiers.value[feeTiers.value.length - 1] 
        : null;
        
      const minDistance = lastTier ? lastTier.maxDistance + 0.01 : 0;
      const maxDistance = lastTier ? lastTier.maxDistance + 5 : 5;
      
      feeTiers.value.push({
        deliveryConfigId: globalConfig.value.id,
        minDistance,
        maxDistance,
        fee: lastTier ? lastTier.fee + 10000 : 15000,
        displayOrder: maxOrder + 1,
        isActive: true,
        isNew: true
      });
    };
    
    const removeTier = (index) => {
      feeTiers.value.splice(index, 1);
    };
    
    const saveFeeTiers = async () => {
      savingTiers.value = true;
      try {
        if (!globalConfig.value.id) {
          showSnackbar('Vui lòng lưu cấu hình chung trước', 'warning');
          savingTiers.value = false;
          return;
        }
        
        // Validate tiers
        for (let i = 0; i < feeTiers.value.length; i++) {
          const tier = feeTiers.value[i];
          if (tier.minDistance >= tier.maxDistance) {
            showSnackbar('Khoảng cách tối thiểu phải nhỏ hơn khoảng cách tối đa', 'error');
            savingTiers.value = false;
            return;
          }
          
          // Check for overlapping ranges
          for (let j = 0; j < feeTiers.value.length; j++) {
            if (i !== j) {
              const otherTier = feeTiers.value[j];
              if ((tier.minDistance >= otherTier.minDistance && tier.minDistance <= otherTier.maxDistance) ||
                  (tier.maxDistance >= otherTier.minDistance && tier.maxDistance <= otherTier.maxDistance)) {
                showSnackbar('Các khoảng cách không được chồng chéo nhau', 'error');
                savingTiers.value = false;
                return;
              }
            }
          }
        }
        
        // Prepare data for API
        const tiersToCreate = feeTiers.value
          .filter(tier => tier.isNew)
          .map(({ isNew, ...rest }) => rest);
          
        const tiersToUpdate = feeTiers.value
          .filter(tier => !tier.isNew && tier.id)
          .map(({ isNew, ...rest }) => rest);
        
        const toClear = !feeTiers.value.length;
        
        // Save tiers
        if (toClear) {
          // Delete all tiers if empty
          await axios.delete(`/api/delivery-configs/${globalConfig.value.id}/fee-tiers`);
        } else {
          // Update existing tiers
          if (tiersToUpdate.length > 0) {
            await axios.put(`/api/delivery-configs/${globalConfig.value.id}/fee-tiers/bulk`, {
              tiers: tiersToUpdate
            });
          }
          
          // Create new tiers
          if (tiersToCreate.length > 0) {
            await axios.post(`/api/delivery-configs/${globalConfig.value.id}/fee-tiers/bulk`, {
              tiers: tiersToCreate
            });
          }
        }
        
        // Reload data
        await loadGlobalConfig();
        showSnackbar('Các mức phí giao hàng đã được lưu thành công');
      } catch (error) {
        showSnackbar('Không thể lưu các mức phí giao hàng', 'error');
        console.error('Error saving fee tiers:', error);
      } finally {
        savingTiers.value = false;
      }
    };
    
    const calculateFee = async () => {
      calculating.value = true;
      try {
        const response = await axios.post('/api/delivery-configs/calculate-fee', {
          distance: simulationData.distance,
          orderAmount: simulationData.orderAmount
        });
        
        if (response.data.success) {
          simulationResult.value = response.data.data;
        }
      } catch (error) {
        showSnackbar('Không thể tính phí giao hàng', 'error');
        console.error('Error calculating fee:', error);
      } finally {
        calculating.value = false;
      }
    };
    
    const formatCurrency = (value) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(value);
    };
    
    const showSnackbar = (text, color = 'success') => {
      snackbar.text = text;
      snackbar.color = color;
      snackbar.show = true;
    };
    
    onMounted(() => {
      loadGlobalConfig();
    });
    
    return {
      globalConfig,
      feeTiers,
      savingGlobal,
      savingTiers,
      simulationData,
      simulationResult,
      calculating,
      snackbar,
      loadGlobalConfig,
      saveGlobalConfig,
      addNewTier,
      removeTier,
      saveFeeTiers,
      calculateFee,
      formatCurrency,
      showSnackbar
    };
  }
};
</script> 