<template>
  <div class="auth-demo-container">
    <v-container>
      <div class="text-center mb-8">
        <h1 class="text-h3 font-weight-bold mb-4">
          🇻🇳 Demo Hệ Thống Tài Khoản UberEat
        </h1>
        <p class="text-h6 text-medium-emphasis">
          Trải nghiệm đầy đủ các tính năng xác thực bằng tiếng Việt
        </p>
      </div>

      <!-- Feature Overview Cards -->
      <v-row class="mb-8">
        <v-col cols="12" md="6" lg="3" v-for="feature in features" :key="feature.id">
          <v-card 
            class="h-100 feature-card" 
            :class="{ 'feature-active': activeFeature === feature.id }"
            @click="showFeature(feature.id)"
            hover
          >
            <v-card-text class="text-center pa-6">
              <v-icon 
                :icon="feature.icon" 
                size="48" 
                :color="feature.color"
                class="mb-4"
              ></v-icon>
              <h3 class="text-h6 font-weight-bold mb-2">{{ feature.title }}</h3>
              <p class="text-body-2 text-medium-emphasis">{{ feature.description }}</p>
              <v-chip 
                :color="feature.color" 
                variant="tonal" 
                size="small"
                class="mt-2"
              >
                {{ feature.status }}
              </v-chip>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Demo Actions -->
      <v-row>
        <v-col cols="12" lg="8">
          <v-card class="demo-panel">
            <v-card-title class="d-flex align-center">
              <v-icon icon="mdi-play-circle" class="mr-2"></v-icon>
              Demo Tương Tác
            </v-card-title>
            
            <v-card-text>
              <v-row>
                <!-- Register Demo -->
                <v-col cols="12" md="6">
                  <v-card variant="outlined" class="mb-4">
                    <v-card-title class="text-h6">
                      <v-icon icon="mdi-account-plus" class="mr-2" color="success"></v-icon>
                      Đăng Ký Tài Khoản
                    </v-card-title>
                    <v-card-text>
                      <p class="mb-3">Trải nghiệm quy trình đăng ký hoàn chỉnh với xác thực OTP</p>
                      <v-btn 
                        color="success" 
                        variant="flat"
                        block
                        :to="{ name: 'Register' }"
                        prepend-icon="mdi-account-plus"
                      >
                        Thử Đăng Ký
                      </v-btn>
                    </v-card-text>
                  </v-card>
                </v-col>

                <!-- Login Demo -->
                <v-col cols="12" md="6">
                  <v-card variant="outlined" class="mb-4">
                    <v-card-title class="text-h6">
                      <v-icon icon="mdi-login" class="mr-2" color="primary"></v-icon>
                      Đăng Nhập
                    </v-card-title>
                    <v-card-text>
                      <p class="mb-3">Đăng nhập với email/mật khẩu hoặc mạng xã hội</p>
                      <v-btn 
                        color="primary" 
                        variant="flat"
                        block
                        :to="{ name: 'Login' }"
                        prepend-icon="mdi-login"
                      >
                        Thử Đăng Nhập
                      </v-btn>
                    </v-card-text>
                  </v-card>
                </v-col>

                <!-- Forgot Password Demo -->
                <v-col cols="12" md="6">
                  <v-card variant="outlined" class="mb-4">
                    <v-card-title class="text-h6">
                      <v-icon icon="mdi-lock-reset" class="mr-2" color="warning"></v-icon>
                      Quên Mật Khẩu
                    </v-card-title>
                    <v-card-text>
                      <p class="mb-3">Khôi phục mật khẩu qua email với mã OTP</p>
                      <v-btn 
                        color="warning" 
                        variant="flat"
                        block
                        :to="{ name: 'ForgotPassword' }"
                        prepend-icon="mdi-lock-reset"
                      >
                        Thử Quên Mật Khẩu
                      </v-btn>
                    </v-card-text>
                  </v-card>
                </v-col>

                <!-- OTP Demo -->
                <v-col cols="12" md="6">
                  <v-card variant="outlined" class="mb-4">
                    <v-card-title class="text-h6">
                      <v-icon icon="mdi-message-text" class="mr-2" color="info"></v-icon>
                      Xác Thực OTP
                    </v-card-title>
                    <v-card-text>
                      <p class="mb-3">Xác thực tài khoản qua SMS hoặc Email</p>
                      <v-btn 
                        color="info" 
                        variant="flat"
                        block
                        @click="showOTPDemo"
                        prepend-icon="mdi-message-text"
                      >
                        Xem Demo OTP
                      </v-btn>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Language & Settings -->
        <v-col cols="12" lg="4">
          <v-card class="settings-panel">
            <v-card-title>
              <v-icon icon="mdi-cog" class="mr-2"></v-icon>
              Cài Đặt Demo
            </v-card-title>
            
            <v-card-text>
              <!-- Language Switch -->
              <div class="mb-4">
                <v-label class="mb-2">Ngôn ngữ / Language</v-label>
                <v-btn-toggle 
                  v-model="currentLocale"
                  @update:modelValue="changeLanguage"
                  variant="outlined"
                  divided
                  mandatory
                >
                  <v-btn value="vi" size="small">🇻🇳 Tiếng Việt</v-btn>
                  <v-btn value="en" size="small">🇺🇸 English</v-btn>
                </v-btn-toggle>
              </div>

              <!-- Theme Toggle -->
              <div class="mb-4">
                <v-label class="mb-2">Giao diện</v-label>
                <v-switch
                  v-model="darkMode"
                  @change="toggleTheme"
                  :label="darkMode ? 'Chế độ tối' : 'Chế độ sáng'"
                  color="primary"
                  hide-details
                ></v-switch>
              </div>

              <!-- Demo Info -->
              <v-divider class="my-4"></v-divider>
              
              <div class="demo-info">
                <h4 class="text-subtitle-1 font-weight-bold mb-2">Thông tin Demo</h4>
                <v-list density="compact">
                  <v-list-item>
                    <v-list-item-title>Test Email:</v-list-item-title>
                    <v-list-item-subtitle>demo@ubereats.vn</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>Test Password:</v-list-item-title>
                    <v-list-item-subtitle>Demo123!@#</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>Test Phone:</v-list-item-title>
                    <v-list-item-subtitle>+84987654321</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </div>
            </v-card-text>
          </v-card>

          <!-- Feature List -->
          <v-card class="mt-4">
            <v-card-title>
              <v-icon icon="mdi-check-circle" class="mr-2" color="success"></v-icon>
              Tính Năng Đã Triển Khai
            </v-card-title>
            <v-card-text>
              <v-list density="compact">
                <v-list-item v-for="item in implementedFeatures" :key="item.name">
                  <template v-slot:prepend>
                    <v-icon :icon="item.icon" :color="item.color" size="small"></v-icon>
                  </template>
                  <v-list-item-title class="text-body-2">{{ item.name }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- OTP Demo Modal -->
      <v-dialog v-model="otpDemoDialog" max-width="500">
        <v-card>
          <v-card-title class="text-h6">
            <v-icon icon="mdi-message-text" class="mr-2" color="info"></v-icon>
            Demo Xác Thực OTP
          </v-card-title>
          
          <v-card-text>
            <div class="text-center mb-4">
              <p class="mb-2">Mã OTP demo đã được gửi đến:</p>
              <v-chip color="info" variant="tonal">
                <v-icon start icon="mdi-email"></v-icon>
                demo@ubereats.vn
              </v-chip>
            </div>

            <div class="otp-demo-input">
              <v-label class="mb-2">Nhập mã OTP (6 chữ số):</v-label>
              <div class="d-flex justify-center gap-2 mb-4">
                <v-text-field
                  v-for="(digit, index) in demoOTP"
                  :key="index"
                  v-model="demoOTP[index]"
                  variant="outlined"
                  density="compact"
                  maxlength="1"
                  class="otp-digit"
                  hide-details
                  @input="handleOTPInput(index)"
                ></v-text-field>
              </div>
            </div>

            <v-alert type="info" variant="tonal" class="mb-4">
              <strong>Mã demo:</strong> 123456
            </v-alert>
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn 
              color="grey" 
              variant="text" 
              @click="otpDemoDialog = false"
            >
              Đóng
            </v-btn>
            <v-btn 
              color="info" 
              variant="flat"
              @click="verifyDemoOTP"
              :disabled="demoOTP.join('').length !== 6"
            >
              Xác Thực
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Success Modal -->
      <v-dialog v-model="successDialog" max-width="400">
        <v-card>
          <v-card-text class="text-center pa-6">
            <v-icon icon="mdi-check-circle" color="success" size="64" class="mb-4"></v-icon>
            <h3 class="text-h6 font-weight-bold mb-2">Xác Thực Thành Công!</h3>
            <p class="text-body-2">Tài khoản demo đã được xác thực thành công.</p>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="success" variant="flat" @click="successDialog = false">
              Đóng
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTheme } from 'vuetify'

export default {
  name: 'AuthDemo',
  
  setup() {
    const { locale } = useI18n()
    const theme = useTheme()
    
    // Reactive data
    const activeFeature = ref(null)
    const currentLocale = ref(locale.value)
    const darkMode = ref(theme.global.current.value.dark)
    const otpDemoDialog = ref(false)
    const successDialog = ref(false)
    const demoOTP = ref(['', '', '', '', '', ''])
    
    // Features data
    const features = ref([
      {
        id: 'register',
        title: 'Đăng Ký Tài Khoản',
        description: 'Tạo tài khoản mới với email, số điện thoại hoặc mạng xã hội',
        icon: 'mdi-account-plus',
        color: 'success',
        status: '✅ Hoàn chỉnh'
      },
      {
        id: 'login',
        title: 'Đăng Nhập/Đăng Xuất',
        description: 'Xác thực với nhiều phương thức an toàn',
        icon: 'mdi-login',
        color: 'primary',
        status: '✅ Hoàn chỉnh'
      },
      {
        id: 'forgot',
        title: 'Quên Mật Khẩu',
        description: 'Khôi phục mật khẩu qua email với mã OTP',
        icon: 'mdi-lock-reset',
        color: 'warning',
        status: '✅ Hoàn chỉnh'
      },
      {
        id: 'otp',
        title: 'Xác Thực OTP',
        description: 'Xác thực qua SMS và Email với mã 6 chữ số',
        icon: 'mdi-message-text',
        color: 'info',
        status: '✅ Hoàn chỉnh'
      }
    ])
    
    const implementedFeatures = ref([
      { name: 'Đăng ký Email + Mật khẩu', icon: 'mdi-email', color: 'success' },
      { name: 'Đăng ký Số điện thoại', icon: 'mdi-phone', color: 'success' },
      { name: 'Đăng nhập Google OAuth', icon: 'mdi-google', color: 'success' },
      { name: 'Đăng nhập Facebook OAuth', icon: 'mdi-facebook', color: 'success' },
      { name: 'Xác thực Email OTP', icon: 'mdi-email-check', color: 'success' },
      { name: 'Xác thực SMS OTP', icon: 'mdi-message-check', color: 'success' },
      { name: 'Quên mật khẩu qua Email', icon: 'mdi-lock-reset', color: 'success' },
      { name: 'JWT Token Security', icon: 'mdi-shield-check', color: 'success' },
      { name: 'Giao diện Tiếng Việt', icon: 'mdi-translate', color: 'success' },
      { name: 'Responsive Design', icon: 'mdi-responsive', color: 'success' }
    ])
    
    // Methods
    const showFeature = (featureId) => {
      activeFeature.value = featureId
    }
    
    const changeLanguage = (newLocale) => {
      locale.value = newLocale
      localStorage.setItem('locale', newLocale)
    }
    
    const toggleTheme = () => {
      theme.global.name.value = darkMode.value ? 'dark' : 'light'
    }
    
    const showOTPDemo = () => {
      otpDemoDialog.value = true
      demoOTP.value = ['', '', '', '', '', '']
    }
    
    const handleOTPInput = (index) => {
      // Auto-focus next input
      if (demoOTP.value[index] && index < 5) {
        const nextInput = document.querySelectorAll('.otp-digit input')[index + 1]
        if (nextInput) nextInput.focus()
      }
    }
    
    const verifyDemoOTP = () => {
      const enteredOTP = demoOTP.value.join('')
      if (enteredOTP === '123456') {
        otpDemoDialog.value = false
        successDialog.value = true
      }
    }
    
    // Lifecycle
    onMounted(() => {
      // Auto-highlight first feature
      setTimeout(() => {
        activeFeature.value = 'register'
      }, 1000)
    })
    
    return {
      // Data
      features,
      implementedFeatures,
      activeFeature,
      currentLocale,
      darkMode,
      otpDemoDialog,
      successDialog,
      demoOTP,
      
      // Methods
      showFeature,
      changeLanguage,
      toggleTheme,
      showOTPDemo,
      handleOTPInput,
      verifyDemoOTP
    }
  }
}
</script>

<style scoped>
.auth-demo-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px 0;
}

.feature-card {
  transition: all 0.3s ease;
  cursor: pointer;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.feature-active {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.2);
  border: 2px solid #1976d2;
}

.demo-panel {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.settings-panel {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.otp-digit {
  width: 50px !important;
  text-align: center;
}

.otp-digit :deep(.v-field__input) {
  text-align: center;
  font-size: 18px;
  font-weight: bold;
}

.demo-info {
  background: rgba(25, 118, 210, 0.05);
  border-radius: 8px;
  padding: 16px;
}

/* Dark mode adjustments */
.v-theme--dark .demo-panel,
.v-theme--dark .settings-panel {
  background: rgba(0, 0, 0, 0.8);
}

.v-theme--dark .demo-info {
  background: rgba(25, 118, 210, 0.15);
}

/* Animation */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.auth-demo-container > * {
  animation: fadeInUp 0.6s ease-out;
}
</style>