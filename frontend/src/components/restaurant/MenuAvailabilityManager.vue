`<template>
  <div>
    <v-card>
      <v-card-title>Menu Availability Settings</v-card-title>
      <v-card-text>
        <v-switch
          v-model="localScheduleEnabled"
          label="Enable Schedule-based Menu Availability"
          @change="handleScheduleToggle"
        ></v-switch>

        <v-switch
          v-model="localDefaultAvailability"
          label="Default Menu Availability"
          :disabled="!localScheduleEnabled"
        ></v-switch>

        <v-divider class="my-4"></v-divider>

        <div v-if="localScheduleEnabled">
          <v-btn
            color="primary"
            class="mb-4"
            @click="showAddScheduleDialog = true"
          >
            Add Schedule
          </v-btn>

          <v-list>
            <v-list-item
              v-for="schedule in localSchedules"
              :key="schedule.id"
              class="mb-2"
            >
              <v-list-item-content>
                <v-list-item-title>
                  {{ formatScheduleTitle(schedule) }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ formatScheduleTimes(schedule) }}
                </v-list-item-subtitle>
                <v-list-item-subtitle>
                  {{ formatScheduleDays(schedule) }}
                </v-list-item-subtitle>
              </v-list-item-content>

              <v-list-item-action>
                <v-btn
                  icon
                  small
                  color="error"
                  @click="removeSchedule(schedule)"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </v-list-item-action>
            </v-list-item>
          </v-list>
        </div>
      </v-card-text>
    </v-card>

    <!-- Add Schedule Dialog -->
    <v-dialog v-model="showAddScheduleDialog" max-width="600px">
      <v-card>
        <v-card-title>Add Schedule</v-card-title>
        <v-card-text>
          <v-form ref="scheduleForm" v-model="validScheduleForm">
            <v-select
              v-model="newSchedule.type"
              :items="scheduleTypes"
              label="Schedule Type"
              required
              :rules="[v => !!v || 'Schedule type is required']"
            ></v-select>

            <v-select
              v-if="newSchedule.type === 'category'"
              v-model="newSchedule.categoryId"
              :items="categories"
              item-text="name"
              item-value="id"
              label="Category"
              required
              :rules="[v => !!v || 'Category is required']"
            ></v-select>

            <v-select
              v-if="newSchedule.type === 'item'"
              v-model="newSchedule.itemId"
              :items="menuItems"
              item-text="name"
              item-value="id"
              label="Menu Item"
              required
              :rules="[v => !!v || 'Menu item is required']"
            ></v-select>

            <v-switch
              v-model="newSchedule.availability"
              label="Available during scheduled time"
            ></v-switch>

            <v-text-field
              v-model="newSchedule.startTime"
              type="time"
              label="Start Time"
              required
              :rules="[v => !!v || 'Start time is required']"
            ></v-text-field>

            <v-text-field
              v-model="newSchedule.endTime"
              type="time"
              label="End Time"
              required
              :rules="[v => !!v || 'End time is required']"
            ></v-text-field>

            <v-select
              v-model="newSchedule.days"
              :items="daysOfWeek"
              label="Days"
              multiple
              chips
              required
              :rules="[v => v.length > 0 || 'At least one day must be selected']"
            ></v-select>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            text
            @click="showAddScheduleDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :disabled="!validScheduleForm"
            @click="addSchedule"
          >
            Add
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import { format } from 'date-fns'

export default {
  name: 'MenuAvailabilityManager',

  data() {
    return {
      localScheduleEnabled: false,
      localDefaultAvailability: true,
      localSchedules: [],
      showAddScheduleDialog: false,
      validScheduleForm: false,
      newSchedule: this.getDefaultSchedule(),
      scheduleTypes: [
        { text: 'Entire Menu', value: 'all' },
        { text: 'Category', value: 'category' },
        { text: 'Individual Item', value: 'item' }
      ],
      daysOfWeek: [
        { text: 'Monday', value: 'Monday' },
        { text: 'Tuesday', value: 'Tuesday' },
        { text: 'Wednesday', value: 'Wednesday' },
        { text: 'Thursday', value: 'Thursday' },
        { text: 'Friday', value: 'Friday' },
        { text: 'Saturday', value: 'Saturday' },
        { text: 'Sunday', value: 'Sunday' }
      ]
    }
  },

  computed: {
    ...mapState('restaurantAdmin', {
      settings: state => state.settings,
      categories: state => state.categories,
      menuItems: state => state.menuItems
    })
  },

  watch: {
    'settings.menuAvailability': {
      handler(newVal) {
        if (newVal) {
          this.localScheduleEnabled = newVal.scheduleEnabled
          this.localDefaultAvailability = newVal.defaultAvailability
          this.localSchedules = [...newVal.schedules]
        }
      },
      immediate: true
    }
  },

  methods: {
    ...mapActions('restaurantAdmin', ['updateMenuAvailability']),

    getDefaultSchedule() {
      return {
        type: 'all',
        categoryId: null,
        itemId: null,
        availability: true,
        startTime: '',
        endTime: '',
        days: []
      }
    },

    handleScheduleToggle(value) {
      this.updateSettings()
    },

    async updateSettings() {
      try {
        await this.updateMenuAvailability({
          restaurantId: this.settings.restaurant.id,
          settings: {
            scheduleEnabled: this.localScheduleEnabled,
            defaultAvailability: this.localDefaultAvailability,
            schedules: this.localSchedules
          }
        })
      } catch (error) {
        console.error('Failed to update menu availability settings:', error)
      }
    },

    async addSchedule() {
      if (this.$refs.scheduleForm.validate()) {
        const schedule = {
          ...this.newSchedule,
          id: Date.now() // Simple temporary ID
        }
        this.localSchedules.push(schedule)
        await this.updateSettings()
        this.showAddScheduleDialog = false
        this.newSchedule = this.getDefaultSchedule()
      }
    },

    async removeSchedule(schedule) {
      const index = this.localSchedules.findIndex(s => s.id === schedule.id)
      if (index !== -1) {
        this.localSchedules.splice(index, 1)
        await this.updateSettings()
      }
    },

    formatScheduleTitle(schedule) {
      if (schedule.type === 'all') return 'Entire Menu'
      if (schedule.type === 'category') {
        const category = this.categories.find(c => c.id === schedule.categoryId)
        return `Category: ${category?.name || 'Unknown'}`
      }
      if (schedule.type === 'item') {
        const item = this.menuItems.find(i => i.id === schedule.itemId)
        return `Item: ${item?.name || 'Unknown'}`
      }
      return 'Unknown Schedule Type'
    },

    formatScheduleTimes(schedule) {
      return `${schedule.startTime} - ${schedule.endTime}`
    },

    formatScheduleDays(schedule) {
      return schedule.days.join(', ')
    }
  }
}
</script>`