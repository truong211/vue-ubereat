<template>
  <div>
    <v-radio-group v-model="timeOption" @change="onOptionChange">
      <v-radio
        label="Deliver ASAP"
        value="asap"
        :hint="timeOption==='asap' ? `Estimated: ${estimated}` : ''"
        persistent-hint
      />
      <v-radio label="Schedule for later" value="scheduled" />
    </v-radio-group>

    <v-expand-transition>
      <div v-if="timeOption==='scheduled'" class="mt-4">
        <v-row>
          <v-col cols="6">
            <v-menu v-model="dateMenu" :close-on-content-click="false">
              <template v-slot:activator="{ props }">
                <v-text-field
                  v-bind="props"
                  v-model="scheduleDate"
                  label="Date"
                  readonly
                  variant="outlined"
                  density="compact"
                  prepend-inner-icon="mdi-calendar"
                />
              </template>
              <v-date-picker v-model="scheduleDate" :min="minDate" :max="maxDate" @update:model-value="dateMenu=false" />
            </v-menu>
          </v-col>
          <v-col cols="6">
            <v-menu v-model="timeMenu" :close-on-content-click="false">
              <template v-slot:activator="{ props }">
                <v-text-field
                  v-bind="props"
                  v-model="scheduleTime"
                  label="Time"
                  readonly
                  variant="outlined"
                  density="compact"
                  prepend-inner-icon="mdi-clock-outline"
                />
              </template>
              <v-time-picker v-model="scheduleTime" format="24hr" :allowed-minutes="allowedMinutes" @update:model-value="timeMenu=false" />
            </v-menu>
          </v-col>
        </v-row>
        <v-btn color="primary" :disabled="!isValid" @click="confirmSchedule" :loading="saving">Confirm</v-btn>
      </div>
    </v-expand-transition>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { format, addDays, addMinutes, isAfter, parse } from 'date-fns';

export default {
  name: 'DeliveryTimeSelector',
  props: {
    modelValue: { type: String, default: 'asap' }
  },
  emits: ['update:modelValue'],
  data() {
    const now = new Date();
    return {
      timeOption: this.modelValue,
      scheduleDate: format(now, 'yyyy-MM-dd'),
      scheduleTime: format(addMinutes(now, 60), 'HH:mm'),
      dateMenu: false,
      timeMenu: false,
      saving: false
    };
  },
  computed: {
    ...mapGetters('cart', ['deliveryType', 'scheduledTime']),
    minDate() { return format(new Date(), 'yyyy-MM-dd'); },
    maxDate() { return format(addDays(new Date(), 7), 'yyyy-MM-dd'); },
    estimated() {
      return '30-45 min';
    },
    isValid() {
      const dt = parse(`${this.scheduleDate} ${this.scheduleTime}`, 'yyyy-MM-dd HH:mm', new Date());
      return isAfter(dt, addMinutes(new Date(), 45));
    },
    allowedMinutes() { return m => m % 15 === 0; }
  },
  watch: {
    modelValue(v) { this.timeOption = v; }
  },
  methods: {
    ...mapActions('cart', ['scheduleDelivery', 'cancelScheduledDelivery']),
    async onOptionChange() {
      this.$emit('update:modelValue', this.timeOption);
      if (this.timeOption === 'asap') {
        await this.cancelScheduledDelivery();
      }
    },
    async confirmSchedule() {
      if (!this.isValid) return;
      this.saving = true;
      try {
        const dt = parse(`${this.scheduleDate} ${this.scheduleTime}`, 'yyyy-MM-dd HH:mm', new Date());
        await this.scheduleDelivery(dt.toISOString());
        this.$emit('update:modelValue', 'scheduled');
        this.$toast?.success('Delivery scheduled');
      } catch (e) {
        console.error(e);
        this.$toast?.error('Failed to schedule delivery');
      } finally {
        this.saving = false;
      }
    }
  }
};
</script>