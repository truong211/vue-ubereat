`<template>
  <div>
    <v-card>
      <v-card-title>Temporary Closure Management</v-card-title>
      <v-card-text>
        <v-switch
          v-model="localClosureSettings.isTemporarilyClosed"
          label="Temporarily Close Restaurant"
          @change="handleClosureToggle"
        ></v-switch>

        <v-row v-if="localClosureSettings.isTemporarilyClosed">
          <v-col cols="12" md="6">
            <v-menu
              v-model="showDatePicker"
              :close-on-content-click="false"
              transition="scale-transition"
              offset-y
              min-width="auto"
            >
              <template v-slot:activator="{ on, attrs }">
                <v-text-field
                  v-model="formattedReopenDate"
                  label="Reopen Date"
                  readonly
                  v-bind="attrs"
                  v-on="on"
                  prepend-icon="mdi-calendar"
                  :rules="[v => !!v || 'Reopen date is required']"
                ></v-text-field>
              </template>
              <v-date-picker
                v-model="localClosureSettings.reopenDate"
                :min="minDate"
                @input="showDatePicker = false"
              ></v-date-picker>
            </v-menu>
          </v-col>

          <v-col cols="12" md="6">
            <v-menu
              ref="timeMenu"
              v-model="showTimePicker"
              :close-on-content-click="false"
              transition="scale-transition"
              offset-y
              max-width="290px"
              min-width="290px"
            >
              <template v-slot:activator="{ on, attrs }">
                <v-text-field
                  v-model="localClosureSettings.reopenTime"
                  label="Reopen Time"
                  readonly
                  v-bind="attrs"
                  v-on="on"
                  prepend-icon="mdi-clock-outline"
                  :rules="[v => !!v || 'Reopen time is required']"
                ></v-text-field>
              </template>
              <v-time-picker
                v-if="showTimePicker"
                v-model="localClosureSettings.reopenTime"
                full-width
                format="24hr"
                @click:minute="$refs.timeMenu.save(localClosureSettings.reopenTime)"
              ></v-time-picker>
            </v-menu>
          </v-col>

          <v-col cols="12">
            <v-textarea
              v-model="localClosureSettings.closureReason"
              label="Closure Reason"
              rows="3"
              :rules="[v => !!v || 'Please provide a reason for closure']"
            ></v-textarea>
          </v-col>

          <v-col cols="12">
            <v-switch
              v-model="localClosureSettings.showReason"
              label="Show closure reason to customers"
            ></v-switch>
          </v-col>

          <v-col cols="12">
            <v-switch
              v-model="localClosureSettings.acceptPreOrders"
              label="Accept pre-orders for after reopening"
            ></v-switch>
          </v-col>
        </v-row>

        <v-alert
          v-if="localClosureSettings.isTemporarilyClosed"
          type="warning"
          class="mt-4"
        >
          When the restaurant is temporarily closed:
          <ul class="mt-2">
            <li>New orders will not be accepted until reopening</li>
            <li v-if="!localClosureSettings.acceptPreOrders">Pre-orders will also be disabled</li>
            <li v-if="localClosureSettings.acceptPreOrders">Pre-orders will be accepted for after {{ formattedReopenDate }}</li>
            <li>Your listing will be marked as temporarily closed</li>
          </ul>
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          :loading="saving"
          @click="saveClosureSettings"
        >
          Save Changes
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import { format } from 'date-fns'

export default {
  name: 'TempClosureManager',

  data() {
    return {
      showDatePicker: false,
      showTimePicker: false,
      saving: false,
      localClosureSettings: {
        isTemporarilyClosed: false,
        reopenDate: null,
        reopenTime: null,
        closureReason: null,
        showReason: true,
        acceptPreOrders: false
      }
    }
  },

  computed: {
    ...mapState('restaurantAdmin', {
      settings: state => state.settings
    }),

    minDate() {
      return format(new Date(), 'yyyy-MM-dd')
    },

    formattedReopenDate() {
      return this.localClosureSettings.reopenDate
        ? format(new Date(this.localClosureSettings.reopenDate), 'MMM dd, yyyy')
        : ''
    }
  },

  watch: {
    'settings.tempClosureSettings': {
      handler(newVal) {
        if (newVal) {
          this.localClosureSettings = {
            ...newVal,
            reopenDate: newVal.reopenDate ? format(new Date(newVal.reopenDate), 'yyyy-MM-dd') : null
          }
        }
      },
      immediate: true
    }
  },

  methods: {
    ...mapActions('restaurantAdmin', ['updateTempClosure']),

    handleClosureToggle(value) {
      if (!value) {
        // Reset settings when disabling temporary closure
        this.localClosureSettings = {
          isTemporarilyClosed: false,
          reopenDate: null,
          reopenTime: null,
          closureReason: null,
          showReason: true,
          acceptPreOrders: false
        }
        this.saveClosureSettings()
      }
    },

    async saveClosureSettings() {
      if (!this.localClosureSettings.isTemporarilyClosed ||
          (this.localClosureSettings.reopenDate && 
           this.localClosureSettings.reopenTime && 
           this.localClosureSettings.closureReason)) {
        this.saving = true
        try {
          const settings = {
            ...this.localClosureSettings
          }
          if (settings.reopenDate && settings.reopenTime) {
            // Combine date and time
            const [hours, minutes] = settings.reopenTime.split(':')
            const reopenDateTime = new Date(settings.reopenDate)
            reopenDateTime.setHours(parseInt(hours), parseInt(minutes))
            settings.reopenDate = reopenDateTime.toISOString()
          }
          
          await this.updateTempClosure({
            restaurantId: this.settings.restaurant.id,
            settings
          })

          this.$emit('saved')
          this.$store.dispatch('showSnackbar', {
            text: 'Temporary closure settings updated successfully',
            color: 'success'
          })
        } catch (error) {
          console.error('Failed to update temporary closure settings:', error)
          this.$store.dispatch('showSnackbar', {
            text: 'Failed to update temporary closure settings',
            color: 'error'
          })
        } finally {
          this.saving = false
        }
      }
    }
  }
}
</script>`