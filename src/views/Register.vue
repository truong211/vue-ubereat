<template>
  <div class="register-container">
    <div class="register-form">
      <h1 class="text-2xl font-bold mb-6">Đăng ký tài khoản</h1>

      <div v-if="message" :class="['alert', messageType === 'error' ? 'alert-error' : 'alert-success']">
        {{ message }}
      </div>

      <!-- Registration Form -->
      <form v-if="!registrationSuccess" @submit.prevent="register">
        <div class="form-group">
          <label for="name">Họ và tên</label>
          <input
            type="text"
            id="name"
            v-model="formData.name"
            class="form-control"
            required
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            type="email"
            id="email"
            v-model="formData.email"
            class="form-control"
            required
          />
        </div>

        <div class="form-group">
          <label for="phone">Số điện thoại</label>
          <input
            type="tel"
            id="phone"
            v-model="formData.phone"
            class="form-control"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Mật khẩu</label>
          <input
            type="password"
            id="password"
            v-model="formData.password"
            class="form-control"
            required
          />
        </div>

        <div class="form-group">
          <label for="confirmPassword">Xác nhận mật khẩu</label>
          <input
            type="password"
            id="confirmPassword"
            v-model="formData.confirmPassword"
            class="form-control"
            required
          />
        </div>

        <button
          type="submit"
          class="btn btn-primary w-full mt-4"
          :disabled="isLoading"
        >
          {{ isLoading ? 'Đang xử lý...' : 'Đăng ký' }}
        </button>
      </form>

      <!-- OTP Verification Form Removed -->

      <!-- Registration Success Message -->
      <div v-if="registrationSuccess" class="text-center success-message">
        <div class="success-icon mb-4">✓</div>
        <h2 class="text-xl font-bold mb-2">Đăng ký thành công!</h2>
        <p class="mb-4">Tài khoản của bạn đã được tạo thành công.</p>
        <router-link to="/login" class="btn btn-primary">Đăng nhập ngay</router-link>
      </div>

      <!-- Social Login Options Temporarily Removed -->

      <div class="mt-6 text-center" v-if="!registrationSuccess">
        <p>Đã có tài khoản? <router-link to="/login" class="text-primary">Đăng nhập</router-link></p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onUnmounted } from 'vue';
// import { useRouter } from 'vue-router'; // Temporarily removed for social login
import { useAuthStore } from '@/stores/auth';

export default {
  name: 'Register',

  setup() {
    // const router = useRouter(); // Temporarily removed for social login
    const authStore = useAuthStore();

    const formData = ref({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: ''
    });

    // const otpData = ref({ code: '', phone: '' }); // Removed OTP data

    const isLoading = ref(false);
    const message = ref('');
    const messageType = ref('');
    // const showVerificationForm = ref(false); // Removed OTP flag
    const registrationSuccess = ref(false);
    // const resendCountdown = ref(0); // Removed OTP countdown
    // let countdownTimer = null; // Removed OTP timer

    // Register function
    const register = async () => {
      try {
        // Validate form
        if (formData.value.password !== formData.value.confirmPassword) {
          message.value = 'Mật khẩu không khớp';
          messageType.value = 'error';
          return;
        }

        isLoading.value = true;
        message.value = '';

        // Register via store and capture response
        const response = await authStore.register({
          name: formData.value.name,
          email: formData.value.email,
          phone: formData.value.phone,
          password: formData.value.password,
          // Generate a username from email
          username: formData.value.email.split('@')[0] + Math.floor(Math.random() * 1000)
        });

        console.log('Registration response:', response);

        // Always set success message and state for now (simplified flow)
        message.value = 'Đăng ký thành công!';
        messageType.value = 'success';
        registrationSuccess.value = true;

        // Clear form
        formData.value = {
          name: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: ''
        };
      } catch (error) {
        console.error("Registration failed:", error); // Log the full error

        // Set error message
        messageType.value = 'error';
        message.value = 'Đăng ký thất bại. Vui lòng thử lại.';
      } finally {
        isLoading.value = false;
      }
    };

    // Verify OTP function (Removed)
    // const verifyOTP = async () => { ... };

    // Resend OTP function (Removed)
    // const resendOTP = async () => { ... };

    // Start countdown for resend button (Removed)
    // const startResendCountdown = () => { ... };

    // Social login functions temporarily removed

    // Clean up on component unmount (OTP timer cleanup removed)
    onUnmounted(() => {
      // No timer cleanup needed now
    });

    return {
      formData,
      // otpData, // Removed
      isLoading,
      message,
      messageType,
      // showVerificationForm, // Removed
      registrationSuccess,
      // resendCountdown, // Removed
      register
      // verifyOTP, // Removed
      // resendOTP, // Removed
      // Social login functions temporarily removed
    };
  }
};
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background-color: #f5f5f5;
}

.register-form {
  width: 100%;
  max-width: 480px;
  padding: 30px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.success-message {
  animation: fadeIn 0.5s ease-in-out;
  padding: 20px;
  background-color: #f0fff4;
  border-radius: 8px;
  border: 1px solid #c6f6d5;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary {
  background-color: #FF5A5F;
  color: white;
}

.btn-primary:hover {
  background-color: #FF2D55;
}

.social-login {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.btn-google, .btn-facebook {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.btn-google {
  background-color: white;
  color: #4285F4;
  border: 1px solid #4285F4;
}

.btn-facebook {
  background-color: #3b5998;
  color: white;
}

.alert {
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.alert-error {
  background-color: #FECACA;
  color: #B91C1C;
}

.alert-success {
  background-color: #D1FAE5;
  color: #047857;
}

.text-primary {
  color: #FF5A5F;
}

.success-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin: 0 auto;
  background-color: #D1FAE5;
  color: #047857;
  font-size: 32px;
  font-weight: bold;
  border-radius: 50%;
}

.tracking-widest {
  letter-spacing: 0.25em;
}
</style>
