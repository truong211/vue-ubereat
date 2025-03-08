<template>
  <v-card class="mb-4">
    <v-card-text>
      <v-form @submit.prevent="validateCoupon">
        <v-row align="center">
          <v-col cols="12" sm="8">
            <v-text-field
              v-model="couponCode"
              label="Enter Coupon Code"
              :error-messages="couponError"
              :loading="isLoading"
              :disabled="isLoading"
              hide-details="auto"
              variant="outlined"
              density="compact"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="4" class="d-flex">
            <v-btn
              color="primary"
              type="submit"
              :loading="isLoading"
              :disabled="!couponCode || isLoading"
              block
            >
              Apply Coupon
            </v-btn>
          </v-col>
        </v-row>
      </v-form>

      <v-alert
        v-if="currentCoupon"
        color="success"
        variant="tonal"
        class="mt-4"
        density="compact"
      >
        <div class="d-flex align-center justify-space-between">
          <div>
            <strong>{{ currentCoupon.code }}</strong> applied!
            <div class="text-caption">
              {{ formatDiscount(currentCoupon) }}
            </div>
          </div>
          <v-btn
            variant="text"
            color="error"
            size="small"
            @click="removeCoupon"
          >
            Remove
          </v-btn>
        </div>
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'CouponInput',
  data() {
    return {
      couponCode: ''
    };
  },
  computed: {
    ...mapGetters('coupon', [
      'getCurrentCoupon',
      'getCouponError',
      'isLoading'
    ]),
    currentCoupon() {
      return this.getCurrentCoupon;
    },
    couponError() {
      return this.getCouponError;
    }
  },
  methods: {
    ...mapActions('coupon', ['validateCoupon', 'clearCoupon']),
    async handleCouponSubmit() {
      if (!this.couponCode) return;
      
      const isValid = await this.validateCoupon(this.couponCode);
      if (isValid) {
        this.couponCode = '';
      }
    },
    removeCoupon() {
      this.clearCoupon();
      this.couponCode = '';
    },
    formatDiscount(coupon) {
      if (coupon.type === 'percentage') {
        return `${coupon.value}% off`;
      } else if (coupon.type === 'fixed') {
        return `$${coupon.value.toFixed(2)} off`;
      }
      return '';
    }
  }
};
</script>