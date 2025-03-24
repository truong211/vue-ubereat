<template>
  <v-card>
    <v-card-title class="d-flex justify-space-between align-center">
      Mã giảm giá đã lưu
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="showAddVoucherDialog = true"
      >
        Thêm mã
      </v-btn>
    </v-card-title>

    <v-card-text>
      <v-tabs v-model="activeTab" color="primary">
        <v-tab value="active">Có hiệu lực</v-tab>
        <v-tab value="expired">Đã hết hạn</v-tab>
      </v-tabs>

      <v-window v-model="activeTab" class="mt-4">
        <v-window-item value="active">
          <div v-if="loadingVouchers" class="text-center pa-4">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
          </div>
          
          <v-row v-else-if="activeVouchers.length > 0" dense>
            <v-col v-for="voucher in activeVouchers" :key="voucher.id" cols="12" sm="6" md="4" class="pa-2">
              <v-card variant="outlined" :color="getVoucherColor(voucher.type)" class="voucher-card">
                <v-card-item>
                  <template v-slot:prepend>
                    <v-avatar :color="getVoucherColor(voucher.type)" class="text-white">
                      <v-icon>{{ getVoucherIcon(voucher.type) }}</v-icon>
                    </v-avatar>
                  </template>
                  <v-card-title>
                    {{ formatDiscountValue(voucher) }}
                  </v-card-title>
                  <v-card-subtitle>
                    {{ voucher.description }}
                  </v-card-subtitle>
                </v-card-item>
                
                <v-divider></v-divider>
                
                <v-card-text>
                  <div class="d-flex justify-space-between align-center">
                    <div>
                      <div class="text-caption mb-1">Mã:</div>
                      <div class="code-display">
                        <span class="font-weight-bold">{{ voucher.code }}</span>
                        <v-btn icon="mdi-content-copy" density="compact" variant="text" size="small" @click="copyCode(voucher.code)"></v-btn>
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="text-caption mb-1">Hạn sử dụng:</div>
                      <div class="text-caption font-weight-medium">{{ formatDate(voucher.endDate) }}</div>
                    </div>
                  </div>
                  
                  <div v-if="voucher.minOrderAmount" class="text-caption mt-2">
                    Đơn tối thiểu: {{ formatCurrency(voucher.minOrderAmount) }}
                  </div>
                </v-card-text>
                
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn
                    variant="text"
                    color="primary"
                    @click="useVoucher(voucher)"
                  >
                    Sử dụng ngay
                  </v-btn>
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    color="error"
                    @click="confirmRemoveVoucher(voucher)"
                  ></v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
          
          <div v-else class="text-center pa-6">
            <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-ticket-percent-off</v-icon>
            <div class="text-body-1 text-medium-emphasis">
              Bạn chưa có mã giảm giá nào
            </div>
            <v-btn
              class="mt-4"
              color="primary"
              variant="text"
              @click="showAddVoucherDialog = true"
            >
              Thêm mã giảm giá
            </v-btn>
          </div>
        </v-window-item>
        
        <v-window-item value="expired">
          <div v-if="loadingVouchers" class="text-center pa-4">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
          </div>
          
          <v-row v-else-if="expiredVouchers.length > 0" dense>
            <v-col v-for="voucher in expiredVouchers" :key="voucher.id" cols="12" sm="6" md="4" class="pa-2">
              <v-card variant="outlined" class="voucher-card expired-voucher">
                <div class="expired-overlay d-flex justify-center align-center">
                  <span class="text-uppercase font-weight-bold">Đã hết hạn</span>
                </div>
                
                <v-card-item>
                  <template v-slot:prepend>
                    <v-avatar color="grey" class="text-white">
                      <v-icon>{{ getVoucherIcon(voucher.type) }}</v-icon>
                    </v-avatar>
                  </template>
                  <v-card-title class="text-grey">
                    {{ formatDiscountValue(voucher) }}
                  </v-card-title>
                  <v-card-subtitle class="text-grey-darken-1">
                    {{ voucher.description }}
                  </v-card-subtitle>
                </v-card-item>
                
                <v-divider></v-divider>
                
                <v-card-text class="text-grey">
                  <div class="d-flex justify-space-between align-center">
                    <div>
                      <div class="text-caption mb-1">Mã:</div>
                      <div class="code-display">
                        <span>{{ voucher.code }}</span>
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="text-caption mb-1">Hết hạn:</div>
                      <div class="text-caption">{{ formatDate(voucher.endDate) }}</div>
                    </div>
                  </div>
                </v-card-text>
                
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    @click="confirmRemoveVoucher(voucher)"
                  ></v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
          
          <div v-else class="text-center pa-6">
            <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-ticket-percent-off</v-icon>
            <div class="text-body-1 text-medium-emphasis">
              Bạn không có mã giảm giá nào đã hết hạn
            </div>
          </div>
        </v-window-item>
      </v-window>
    </v-card-text>
    
    <!-- Add Voucher Dialog -->
    <v-dialog v-model="showAddVoucherDialog" max-width="500">
      <v-card>
        <v-card-title>Thêm mã giảm giá mới</v-card-title>
        
        <v-card-text>
          <v-form @submit.prevent="addVoucher" ref="voucherForm">
            <v-text-field
              v-model="voucherCode"
              label="Mã giảm giá"
              :rules="[rules.required]"
              placeholder="Nhập mã giảm giá"
              variant="outlined"
              class="mb-4"
            ></v-text-field>
            
            <v-alert
              v-if="voucherError"
              type="error"
              variant="tonal"
              class="mb-4"
            >
              {{ voucherError }}
            </v-alert>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showAddVoucherDialog = false"
          >
            Hủy
          </v-btn>
          <v-btn
            color="primary"
            :loading="addingVoucher"
            @click="addVoucher"
          >
            Thêm
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Remove Voucher Dialog -->
    <v-dialog v-model="showRemoveDialog" max-width="400">
      <v-card>
        <v-card-title>Xác nhận xóa</v-card-title>
        <v-card-text>
          Bạn có chắc muốn xóa mã giảm giá này?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showRemoveDialog = false"
          >
            Hủy
          </v-btn>
          <v-btn
            color="error"
            :loading="removingVoucher"
            @click="removeVoucher"
          >
            Xóa
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';

const store = useStore();
const router = useRouter();
const toast = useToast();

// State
const activeTab = ref('active');
const voucherCode = ref('');
const voucherError = ref('');
const showAddVoucherDialog = ref(false);
const showRemoveDialog = ref(false);
const addingVoucher = ref(false);
const removingVoucher = ref(false);
const selectedVoucher = ref(null);
const voucherForm = ref(null);

// Computed
const loadingVouchers = computed(() => store.state.user.loadingVouchers);
const vouchers = computed(() => store.state.user.vouchers || []);
const today = new Date();

const activeVouchers = computed(() => {
  return vouchers.value.filter(voucher => {
    const endDate = new Date(voucher.endDate);
    return endDate >= today;
  });
});

const expiredVouchers = computed(() => {
  return vouchers.value.filter(voucher => {
    const endDate = new Date(voucher.endDate);
    return endDate < today;
  });
});

// Validation rules
const rules = {
  required: v => !!v || 'Trường này là bắt buộc'
};

// Functions
onMounted(async () => {
  try {
    await store.dispatch('user/fetchVouchers');
  } catch (error) {
    console.error('Error fetching vouchers:', error);
    toast.error('Không thể tải mã giảm giá');
  }
});

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN');
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

const getVoucherColor = (type) => {
  switch (type) {
    case 'percentage': return 'indigo';
    case 'fixed': return 'green';
    case 'free_delivery': return 'blue';
    default: return 'primary';
  }
};

const getVoucherIcon = (type) => {
  switch (type) {
    case 'percentage': return 'mdi-percent';
    case 'fixed': return 'mdi-currency-usd';
    case 'free_delivery': return 'mdi-truck-delivery';
    default: return 'mdi-ticket-percent';
  }
};

const formatDiscountValue = (voucher) => {
  switch (voucher.type) {
    case 'percentage':
      return `Giảm ${voucher.value}%`;
    case 'fixed':
      return `Giảm ${formatCurrency(voucher.value)}`;
    case 'free_delivery':
      return 'Miễn phí giao hàng';
    default:
      return voucher.description;
  }
};

const copyCode = (code) => {
  navigator.clipboard.writeText(code)
    .then(() => {
      toast.success('Đã sao chép mã giảm giá');
    })
    .catch(err => {
      console.error('Failed to copy code:', err);
      toast.error('Không thể sao chép mã giảm giá');
    });
};

const addVoucher = async () => {
  voucherError.value = '';
  if (!voucherCode.value) return;
  
  addingVoucher.value = true;
  try {
    await store.dispatch('user/addVoucher', voucherCode.value);
    showAddVoucherDialog.value = false;
    voucherCode.value = '';
    toast.success('Đã thêm mã giảm giá');
  } catch (error) {
    console.error('Error adding voucher:', error);
    voucherError.value = error.response?.data?.message || 'Mã giảm giá không hợp lệ';
  } finally {
    addingVoucher.value = false;
  }
};

const confirmRemoveVoucher = (voucher) => {
  selectedVoucher.value = voucher;
  showRemoveDialog.value = true;
};

const removeVoucher = async () => {
  if (!selectedVoucher.value) return;
  
  removingVoucher.value = true;
  try {
    await store.dispatch('user/removeVoucher', selectedVoucher.value.id);
    showRemoveDialog.value = false;
    selectedVoucher.value = null;
    toast.success('Đã xóa mã giảm giá');
  } catch (error) {
    console.error('Error removing voucher:', error);
    toast.error('Không thể xóa mã giảm giá');
  } finally {
    removingVoucher.value = false;
  }
};

const useVoucher = (voucher) => {
  // Navigate to restaurants page with the voucher pre-applied
  router.push({
    name: 'Restaurants',
    query: { voucher: voucher.code }
  });
};
</script>

<style scoped>
.voucher-card {
  position: relative;
  height: 100%;
}

.code-display {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  background-color: rgba(0, 0, 0, 0.04);
  border-radius: 4px;
}

.expired-voucher {
  opacity: 0.7;
  position: relative;
}

.expired-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.2);
  z-index: 1;
  color: white;
  font-size: 1.2rem;
}
</style> 