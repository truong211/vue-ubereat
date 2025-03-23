<template>
  <v-card>
    <v-card-text>
      <h2 class="text-h5 mb-6">Menu Availability Settings</h2>

      <v-switch
        v-model="settings.scheduleEnabled"
        label="Enable menu scheduling"
        class="mb-4"
      ></v-switch>

      <v-alert
        v-if="settings.scheduleEnabled"
        type="info"
        variant="tonal"
        class="mb-4"
      >
        When menu scheduling is enabled, you can set specific times when menu items or categories are available.
      </v-alert>

      <v-switch
        v-model="settings.defaultAvailability"
        :disabled="!settings.scheduleEnabled"
        label="Items are available by default"
        class="mb-6"
      ></v-switch>

      <!-- Menu Schedules -->
      <div v-if="settings.scheduleEnabled">
        <div class="d-flex justify-space-between align-center mb-4">
          <h3 class="text-h6">Menu Schedules</h3>
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            @click="addSchedule"
          >
            Add Schedule
          </v-btn>
        </div>

        <v-expansion-panels>
          <v-expansion-panel
            v-for="(schedule, index) in settings.schedules"
            :key="index"
          >
            <v-expansion-panel-title>
              <div class="d-flex align-center">
                <span class="text-subtitle-1">{{ getScheduleTitle(schedule) }}</span>
                <v-chip
                  size="small"
                  :color="schedule.availability ? 'success' : 'error'"
                  class="ml-2"
                >
                  {{ schedule.availability ? 'Available' : 'Unavailable' }}
                </v-chip>
              </div>
            </v-expansion-panel-title>

            <v-expansion-panel-text>
              <v-row>
                <!-- Time Range -->
                <v-col cols="12" md="6">
                  <div class="d-flex align-center">
                    <v-text-field
                      v-model="schedule.startTime"
                      type="time"
                      label="Start Time"
                      class="me-2"
                    ></v-text-field>
                    <span class="mx-2">to</span>
                    <v-text-field
                      v-model="schedule.endTime"
                      type="time"
                      label="End Time"
                    ></v-text-field>
                  </div>
                </v-col>

                <!-- Days Selection -->
                <v-col cols="12" md="6">
                  <v-select
                    v-model="schedule.days"
                    :items="daysOfWeek"
                    label="Days"
                    multiple
                    chips
                  ></v-select>
                </v-col>

                <!-- Category/Item Selection -->
                <v-col cols="12" md="6">
                  <v-select
                    v-model="schedule.type"
                    :items="[
                      { title: 'Entire Menu', value: 'menu' },
                      { title: 'Category', value: 'category' },
                      { title: 'Individual Item', value: 'item' }
                    ]"
                    label="Apply to"
                  ></v-select>
                </v-col>

                <v-col cols="12" md="6">
                  <v-select
                    v-if="schedule.type === 'category'"
                    v-model="schedule.categoryId"
                    :items="categories"
                    item-title="name"
                    item-value="id"
                    label="Select Category"
                  ></v-select>

                  <v-select
                    v-if="schedule.type === 'item'"
                    v-model="schedule.itemId"
                    :items="menuItems"
                    item-title="name"
                    item-value="id"
                    label="Select Item"
                  ></v-select>
                </v-col>

                <!-- Availability Toggle -->
                <v-col cols="12">
                  <v-switch
                    v-model="schedule.availability"
                    :label="schedule.availability ? 'Available during this time' : 'Unavailable during this time'"
                  ></v-switch>
                </v-col>

                <!-- Delete Button -->
                <v-col cols="12" class="text-right">
                  <v-btn
                    color="error"
                    variant="text"
                    @click="removeSchedule(index)"
                  >
                    Delete Schedule
                  </v-btn>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          :loading="saving"
          @click="saveSettings"
        >
          Save Changes
        </v-btn>
      </v-card-actions>
    </v-card-text>
  </v-card>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'MenuAvailabilityManager',

  setup() {
    const store = useStore()
    const saving = ref(false)

    // Settings state
    const settings = ref({
      scheduleEnabled: false,
      defaultAvailability: true,
      schedules: []
    })

    // Helper data
    const daysOfWeek = [
      'Monday', 'Tuesday', 'Wednesday', 'Thursday',
      'Friday', 'Saturday', 'Sunday'
    ]

    // Computed
    const categories = computed(() => store.state.restaurantAdmin.categories)
    const menuItems = computed(() => store.state.restaurantAdmin.menuItems)

    // Methods
    const loadSettings = async () => {
      try {
        const restaurantId = store.state.restaurantAdmin.restaurant.id
        const response = await store.dispatch('restaurantAdmin/fetchRestaurantSettings', restaurantId)
        settings.value = response.menuAvailability || {
          scheduleEnabled: false,
          defaultAvailability: true,
          schedules: []
        }
      } catch (error) {
        console.error('Failed to load menu availability settings:', error)
      }
    }

    const saveSettings = async () => {
      try {
        saving.value = true
        const restaurantId = store.state.restaurantAdmin.restaurant.id
        await store.dispatch('restaurantAdmin/updateMenuAvailability', {
          restaurantId,
          settings: settings.value
        })
      } catch (error) {
        console.error('Failed to save menu availability settings:', error)
      } finally {
        saving.value = false
      }
    }

    const addSchedule = () => {
      settings.value.schedules.push({
        type: 'menu',
        startTime: '00:00',
        endTime: '23:59',
        days: [],
        availability: true,
        categoryId: null,
        itemId: null
      })
    }

    const removeSchedule = (index) => {
      settings.value.schedules.splice(index, 1)
    }

    const getScheduleTitle = (schedule) => {
      let target = 'Entire Menu'
      if (schedule.type === 'category') {
        const category = categories.value.find(c => c.id === schedule.categoryId)
        target = category ? `Category: ${category.name}` : 'Category'
      } else if (schedule.type === 'item') {
        const item = menuItems.value.find(i => i.id === schedule.itemId)
        target = item ? `Item: ${item.name}` : 'Item'
      }

      const days = schedule.days.length > 0 
        ? schedule.days.join(', ')
        : 'No days selected'

      return `${target} - ${days}`
    }

    // Load initial data
    onMounted(() => {
      loadSettings()
      store.dispatch('restaurantAdmin/fetchCategories')
      store.dispatch('restaurantAdmin/fetchMenuItems')
    })

    return {
      settings,
      saving,
      daysOfWeek,
      categories,
      menuItems,
      saveSettings,
      addSchedule,
      removeSchedule,
      getScheduleTitle
    }
  }
}
</script>