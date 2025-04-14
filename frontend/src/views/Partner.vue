<template>
  <div class="partner">
    <v-container>
      <v-row justify="center">
        <v-col cols="12" md="8">
          <h1 class="text-h3 mb-6">Trở thành đối tác của chúng tôi</h1>
          
          <v-card class="mb-6">
            <v-card-text>
              <h2 class="text-h5 mb-4">Lợi ích khi trở thành đối tác</h2>
              <v-row>
                <v-col cols="12" md="4">
                  <v-icon size="48" color="primary" class="mb-2">mdi-store-outline</v-icon>
                  <h3 class="text-h6">Tiếp cận khách hàng mới</h3>
                  <p>Mở rộng kinh doanh của bạn với hàng nghìn khách hàng tiềm năng.</p>
                </v-col>
                <v-col cols="12" md="4">
                  <v-icon size="48" color="primary" class="mb-2">mdi-chart-line</v-icon>
                  <h3 class="text-h6">Tăng doanh thu</h3>
                  <p>Tăng doanh số bán hàng thông qua nền tảng giao hàng trực tuyến của chúng tôi.</p>
                </v-col>
                <v-col cols="12" md="4">
                  <v-icon size="48" color="primary" class="mb-2">mdi-tablet-dashboard</v-icon>
                  <h3 class="text-h6">Quản lý dễ dàng</h3>
                  <p>Công cụ quản lý đơn hàng và nhà hàng hiện đại, dễ sử dụng.</p>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <v-card class="mb-6">
            <v-card-text>
              <h2 class="text-h5 mb-4">Đăng ký trở thành đối tác</h2>
              <v-form @submit.prevent="submitForm">
                <v-text-field
                  v-model="form.name"
                  label="Tên nhà hàng"
                  required
                ></v-text-field>

                <v-text-field
                  v-model="form.ownerName"
                  label="Tên chủ nhà hàng"
                  required
                ></v-text-field>

                <v-text-field
                  v-model="form.phone"
                  label="Số điện thoại"
                  required
                ></v-text-field>

                <v-text-field
                  v-model="form.email"
                  label="Email"
                  type="email"
                  required
                ></v-text-field>

                <v-text-field
                  v-model="form.address"
                  label="Địa chỉ nhà hàng"
                  required
                ></v-text-field>

                <v-textarea
                  v-model="form.description"
                  label="Mô tả về nhà hàng"
                  rows="3"
                ></v-textarea>

                <v-btn
                  type="submit"
                  color="primary"
                  block
                  :loading="loading"
                  size="large"
                  class="mt-4"
                >
                  Đăng ký ngay
                </v-btn>
              </v-form>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useNotification } from '@/composables/useNotification'

export default {
  name: 'Partner',

  setup() {
    const { notify } = useNotification()
    const loading = ref(false)
    const form = ref({
      name: '',
      ownerName: '',
      phone: '',
      email: '',
      address: '',
      description: ''
    })

    const submitForm = async () => {
      loading.value = true
      try {
        // TODO: Implement API call to submit partner application
        await new Promise(resolve => setTimeout(resolve, 1000)) // Simulated API call
        notify('Đăng ký thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.', 'success')
        form.value = {
          name: '',
          ownerName: '',
          phone: '',
          email: '',
          address: '',
          description: ''
        }
      } catch (error) {
        console.error('Error submitting form:', error)
        notify('Có lỗi xảy ra. Vui lòng thử lại sau.', 'error')
      } finally {
        loading.value = false
      }
    }

    return {
      form,
      loading,
      submitForm
    }
  }
}
</script>

<style scoped>
.partner {
  padding: 40px 0;
}
</style>
