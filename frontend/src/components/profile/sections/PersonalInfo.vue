<template>
  <div class="personal-info">
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>Thông tin cá nhân</span>
        <v-btn
          v-if="!editing"
          color="primary"
          variant="text"
          prepend-icon="mdi-pencil"
          @click="startEditing"
        >
          Chỉnh sửa
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-form
          ref="form"
          v-model="isValid"
          @submit.prevent="updateProfile"
        >
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="formData.firstName"
                label="Tên"
                :rules="[rules.required]"
                :readonly="!editing"
                variant="outlined"
                density="comfortable"
              ></v-text-field>
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="formData.lastName"
                label="Họ"
                :rules="[rules.required]"
                :readonly="!editing"
                variant="outlined"
                density="comfortable"
              ></v-text-field>
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="formData.email"
                label="Email"
                type="email"
                :rules="[rules.required, rules.email]"
                readonly
                variant="outlined"
                density="comfortable"
              ></v-text-field>
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="formData.phone"
                label="Số điện thoại"
                type="tel"
                :rules="[rules.phone]"
                :readonly="!editing"
                variant="outlined"
                density="comfortable"
              ></v-text-field>
            </v-col>
          </v-row>

          <div v-if="editing" class="d-flex justify-end mt-4">
            <v-btn
              variant="text"
              class="me-2"
              @click="cancelEditing"
            >
              Hủy
            </v-btn>
            <v-btn
              color="primary"
              type="submit"
              :loading="loading"
              :disabled="!isValid || loading"
            >
              Lưu thay đổi
            </v-btn>
          </div>
        </v-form>

        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          class="mt-4"
          closable
          @click:close="error = ''"
        >
          {{ error }}
        </v-alert>

        <v-alert
          v-if="successMessage"
          type="success"
          variant="tonal"
          class="mt-4"
          closable
          @click:close="successMessage = ''"
        >
          {{ successMessage }}
        </v-alert>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'vue-toastification';

export default {
  name: 'PersonalInfo',
  
  setup() {
    const store = useStore();
    const toast = useToast();
    const form = ref(null);
    
    // Form state
    const isValid = ref(false);
    const editing = ref(false);
    const loading = ref(false);
    const error = ref('');
    const successMessage = ref('');
    
    // Form data
    const formData = reactive({
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    });
    
    // Validation rules
    const rules = {
      required: v => !!v || 'Trường này là bắt buộc',
      email: v => /.+@.+\..+/.test(v) || 'Email không hợp lệ',
      phone: v => !v || /^(\+84|0)\d{9,10}$/.test(v) || 'Số điện thoại không hợp lệ'
    };
    
    // Methods
    const loadProfile = async () => {
      loading.value = true;
      try {
        const userData = await store.dispatch('user/fetchProfile');
        formData.firstName = userData.firstName || '';
        formData.lastName = userData.lastName || '';
        formData.email = userData.email || '';
        formData.phone = userData.phone || '';
      } catch (err) {
        console.error('Error loading profile:', err);
        error.value = 'Không thể tải thông tin người dùng';
      } finally {
        loading.value = false;
      }
    };
    
    const startEditing = () => {
      editing.value = true;
    };
    
    const cancelEditing = () => {
      editing.value = false;
      loadProfile(); // Reset form data
      form.value?.resetValidation();
    };
    
    const updateProfile = async () => {
      if (!isValid.value) return;
      
      loading.value = true;
      error.value = '';
      successMessage.value = '';
      
      try {
        await store.dispatch('user/updateProfile', {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone
        });
        
        successMessage.value = 'Cập nhật thông tin thành công!';
        toast.success('Cập nhật thông tin thành công');
        editing.value = false;
      } catch (err) {
        console.error('Error updating profile:', err);
        error.value = err.response?.data?.message || 'Không thể cập nhật thông tin';
        toast.error('Không thể cập nhật thông tin');
      } finally {
        loading.value = false;
      }
    };
    
    onMounted(loadProfile);
    
    return {
      form,
      isValid,
      editing,
      loading,
      error,
      successMessage,
      formData,
      rules,
      startEditing,
      cancelEditing,
      updateProfile
    };
  }
};
</script>