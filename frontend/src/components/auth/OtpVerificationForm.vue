<template>
  <div class="otp-verification-form">
    <v-card class="pa-4" variant="outlined">
      <v-card-title class="text-center">
        {{ title || 'Verification Required' }}
      </v-card-title>
      
      <v-card-subtitle class="text-center mb-4">
        {{ subtitle || `Please enter the verification code sent to your ${verificationType}` }}
      </v-card-subtitle>
      
      <!-- OTP method selector -->
      <div v-if="showMethodSelector" class="mb-4">
        <v-select
          v-model="selectedMethod"
          :items="availableMethods"
          label="Verification Method"
          variant="outlined"
          density="comfortable"
        ></v-select>
      </div>
      
      <!-- OTP input -->
      <div class="d-flex justify-center gap-2 mb-6">
        <template v-for="(_, index) in Array(6)" :key="index">
          <v-text-field
            v-model="otpDigits[index]"
            variant="outlined"
            density="compact"
            class="otp-digit"
            maxlength="1"
            autocomplete="off"
            @input="onDigitInput($event, index)"
            @keydown="onDigitKeyDown($event, index)"
            @paste="onPaste"
            :ref="el => { if (el) otpRefs[index] = el }"
            :autofocus="index === 0"
            hide-details
          ></v-text-field>
        </template>
      </div>
      
      <!-- Action buttons -->
      <div class="d-flex flex-column gap-2">
        <v-btn
          color="primary"
          block
          :loading="loading"
          :disabled="!isComplete || loading"
          @click="verify"
        >
          Verify
        </v-btn>
        
        <v-btn
          variant="text"
          block
          :disabled="resendCountdown > 0 || loading"
          @click="resend"
        >
          {{ resendButtonText }}
        </v-btn>
      </div>
      
      <!-- Error message -->
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
    </v-card>
  </div>
</template>

<script>
export default {
  name: 'OtpVerificationForm',
  props: {
    title: String,
    subtitle: String,
    verificationType: {
      type: String,
      default: 'email',
      validator: value => ['email', 'phone', 'sms'].includes(value)
    },
    value: {
      type: String,
      default: ''
    },
    availableMethods: {
      type: Array,
      default: () => [
        { title: 'Email', value: 'email' },
        { title: 'SMS', value: 'phone' }
      ]
    },
    showMethodSelector: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: ''
    }
  },
  
  data() {
    return {
      otpDigits: ['', '', '', '', '', ''],
      otpRefs: [],
      selectedMethod: this.verificationType,
      resendCountdown: 60,
      resendTimer: null
    };
  },
  
  computed: {
    isComplete() {
      return this.otpDigits.every(digit => digit !== '');
    },
    
    otpValue() {
      return this.otpDigits.join('');
    },
    
    resendButtonText() {
      return this.resendCountdown > 0
        ? `Resend code (${this.resendCountdown}s)`
        : 'Resend code';
    }
  },
  
  watch: {
    value: {
      immediate: true,
      handler(newVal) {
        if (newVal && newVal.length === 6) {
          this.otpDigits = newVal.split('');
        }
      }
    },
    
    otpValue(val) {
      this.$emit('input', val);
      if (val.length === 6) {
        this.$emit('complete', val);
      }
    },
    
    selectedMethod(val) {
      this.$emit('method-change', val);
    }
  },
  
  mounted() {
    this.startResendTimer();
  },
  
  beforeDestroy() {
    this.clearResendTimer();
  },
  
  methods: {
    onDigitInput(event, index) {
      const value = event.target.value;
      
      // Only allow numbers
      if (!/^\d*$/.test(value)) {
        this.otpDigits[index] = '';
        return;
      }
      
      // Handle paste of multiple digits
      if (value.length > 1) {
        const digits = value.split('');
        for (let i = 0; i < digits.length && index + i < 6; i++) {
          this.otpDigits[index + i] = digits[i];
        }
        
        // Focus on the next empty field or the last field
        const nextIndex = Math.min(index + value.length, 5);
        this.focusDigit(nextIndex);
        return;
      }
      
      // Auto-focus to next input
      if (value && index < 5) {
        this.focusDigit(index + 1);
      }
    },
    
    onDigitKeyDown(event, index) {
      // Handle backspace
      if (event.key === 'Backspace') {
        if (!this.otpDigits[index] && index > 0) {
          // If current field is empty, focus previous field
          this.otpDigits[index - 1] = '';
          this.focusDigit(index - 1);
        }
      }
      // Handle arrow keys
      else if (event.key === 'ArrowLeft' && index > 0) {
        this.focusDigit(index - 1);
      }
      else if (event.key === 'ArrowRight' && index < 5) {
        this.focusDigit(index + 1);
      }
    },
    
    onPaste(event) {
      event.preventDefault();
      
      // Get pasted data
      const pastedData = (event.clipboardData || window.clipboardData).getData('text');
      
      // Filter only numbers and limit to 6 digits
      const numbers = pastedData.replace(/\D/g, '').substring(0, 6);
      
      if (numbers) {
        // Fill the OTP fields
        for (let i = 0; i < numbers.length; i++) {
          if (i < 6) {
            this.otpDigits[i] = numbers[i];
          }
        }
        
        // Focus on the next empty field or the last field
        const focusIndex = Math.min(numbers.length, 5);
        this.focusDigit(focusIndex);
      }
    },
    
    focusDigit(index) {
      if (this.otpRefs[index]) {
        this.otpRefs[index].focus();
      }
    },
    
    verify() {
      if (this.isComplete) {
        this.$emit('verify', {
          otp: this.otpValue,
          method: this.selectedMethod
        });
      }
    },
    
    resend() {
      this.$emit('resend', this.selectedMethod);
      this.resetOtp();
      this.startResendTimer();
    },
    
    resetOtp() {
      this.otpDigits = ['', '', '', '', '', ''];
      this.focusDigit(0);
    },
    
    startResendTimer() {
      this.clearResendTimer();
      this.resendCountdown = 60;
      
      this.resendTimer = setInterval(() => {
        if (this.resendCountdown > 0) {
          this.resendCountdown--;
        } else {
          this.clearResendTimer();
        }
      }, 1000);
    },
    
    clearResendTimer() {
      if (this.resendTimer) {
        clearInterval(this.resendTimer);
        this.resendTimer = null;
      }
    }
  }
};
</script>

<style scoped>
.otp-digit {
  width: 50px !important;
  text-align: center;
}

.otp-digit :deep(input) {
  text-align: center;
  font-size: 1.25rem;
  font-weight: 600;
}
</style> 