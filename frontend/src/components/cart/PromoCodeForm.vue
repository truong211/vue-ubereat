<template>
  <div>
    <v-text-field
      v-model="code"
      label="Promo Code"
      variant="outlined"
      density="compact"
      :disabled="loading || applied"
      :error="!!errorMsg"
      hide-details
      @keyup.enter="apply"
    >
      <template #append>
        <v-btn color="primary" size="small" :loading="loading" :disabled="!code" @click="apply">
          Apply
        </v-btn>
      </template>
    </v-text-field>
    <div v-if="errorMsg" class="text-error text-caption mt-1">{{ errorMsg }}</div>
    <div v-if="applied" class="mt-2 d-flex align-center">
      <v-chip color="success" size="small" closable @click:close="remove">
        {{ applied.code }}
        <span v-if="applied.type==='percentage'"> -{{ applied.value }}%</span>
        <span v-else-if="applied.type==='fixed_amount'"> -${{ applied.value }}</span>
        <span v-else> (Free Delivery)</span>
      </v-chip>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
export default {
  name: 'PromoCodeForm',
  data() {
    return { code: '', loading: false, errorMsg: '' };
  },
  computed: {
    ...mapGetters('cart', ['appliedPromotion']),
    applied() { return this.appliedPromotion; }
  },
  methods: {
    ...mapActions('cart', ['applyPromotion', 'removePromotion']),
    async apply() {
      if (!this.code) return;
      this.loading = true;
      this.errorMsg = '';
      try {
        await this.applyPromotion(this.code);
        this.code = '';
        this.$toast?.success('Promo applied');
      } catch (e) {
        console.error(e);
        this.errorMsg = e.message || 'Invalid code';
      } finally { this.loading = false; }
    },
    async remove() {
      await this.removePromotion();
      this.$toast?.info('Promo removed');
    }
  }
};
</script>