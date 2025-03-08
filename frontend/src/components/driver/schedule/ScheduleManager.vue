<template>
  <div class="schedule-manager">
    <v-card>
      <v-toolbar
        :color="showCalendar ? 'primary' : undefined"
        :dark="showCalendar"
      >
        <v-btn
          icon="mdi-menu"
          variant="text"
          @click="drawer = !drawer"
        ></v-btn>

        <v-toolbar-title>Schedule Manager</v-toolbar-title>

        <v-spacer></v-spacer>

        <v-btn-group>
          <v-btn
            :color="!showCalendar ? 'primary' : undefined"
            :variant="!showCalendar ? 'flat' : 'text'"
            prepend-icon="mdi-clock"
            @click="showCalendar = false"
          >
            Hours
          </v-btn>
          <v-btn
            :color="showCalendar ? 'primary' : undefined"
            :variant="showCalendar ? 'flat' : 'text'"
            prepend-icon="mdi-calendar"
            @click="showCalendar = true"
          >
            Calendar
          </v-btn>
        </v-btn-group>

        <v-spacer></v-spacer>

        <v-btn
          icon="mdi-cog"
          variant="text"
          @click="showSettings = true"
        ></v-btn>
      </v-toolbar>

      <!-- Calendar View -->
      <template v-if="showCalendar">
        <v-card-text>
          <v-calendar
            ref="calendar"
            v-model="selectedDate"
            :events="formattedShifts"
            :event-color="getEventColor"
            :type="calendarType"
            @click:event="showShiftDetails"
            @click:date="handleDateClick"
          >
            <template v-slot:event="{ event }">
              <div class="event-content">
                <div class="text-caption">{{ formatTimeRange(event.start, event.end) }}</div>
                <div class="text-caption">{{ event.status }}</div>
              </div>
            </template>
          </v-calendar>
        </v-card-text>
      </template>

      <!-- Hours View -->
      <template v-else>
        <v-card-text>
          <!-- Weekly Schedule -->
          <div class="weekly-schedule">
            <div
              v-for="day in weekDays"
              :key="day.value"
              class="day-schedule"
            >
              <div class="day-header">
                <div class="day-name">{{ day.label }}</div>
                <v-btn
                  icon="mdi-plus"
                  size="small"
                  variant="text"
                  @click="addShift(day.value)"
                ></v-btn>
              </div>

              <div class="shifts-list">
                <v-chip
                  v-for="shift in getShiftsForDay(day.value)"
                  :key="shift.id"
                  :color="getShiftColor(shift)"
                  closable
                  @click="editShift(shift)"
                  @click:close="removeShift(shift)"
                >
                  {{ formatTimeRange(shift.start, shift.end) }}
                </v-chip>

                <div v-if="!getShiftsForDay(day.value).length" class="no-shifts">
                  No shifts scheduled
                </div>
              </div>
            </div>
          </div>

          <!-- Summary -->
          <v-divider class="my-4"></v-divider>
          <div class="schedule-summary">
            <div class="summary-item">
              <div class="text-h6">{{ totalHours }}</div>
              <div class="text-caption">Total Hours</div>
            </div>
            <div class="summary-item">
              <div class="text-h6">{{ weeklyEarningsPotential }}</div>
              <div class="text-caption">Potential Earnings</div>
            </div>
            <div class="summary-item">
              <div class="text-h6">{{ shiftsCount }}</div>
              <div class="text-caption">Shifts</div>
            </div>
          </div>
        </v-card-text>
      </template>
    </v-card>

    <!-- Settings Drawer -->
    <v-navigation-drawer
      v-model="drawer"
      location="left"
      temporary
    >
      <v-list>
        <v-list-item
          title="Availability Preferences"
          subtitle="Set your default availability"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-clock"></v-icon>
          </template>
        </v-list-item>

        <v-divider></v-divider>

        <v-list-item
          v-for="day in weekDays"
          :key="day.value"
        >
          <v-list-item-title>{{ day.label }}</v-list-item-title>
          <template v-slot:append>
            <v-switch
              v-model="preferences[day.value].available"
              hide-details
              density="compact"
            ></v-switch>
          </template>
        </v-list-item>
      </v-list>

      <v-divider></v-divider>

      <v-list>
        <v-list-subheader>Hours</v-list-subheader>
        <v-list-item>
          <v-list-item-title>Minimum Hours per Week</v-list-item-title>
          <template v-slot:append>
            <v-text-field
              v-model="preferences.minHours"
              type="number"
              hide-details
              density="compact"
              variant="outlined"
              style="width: 80px"
            ></v-text-field>
          </template>
        </v-list-item>

        <v-list-item>
          <v-list-item-title>Maximum Hours per Week</v-list-item-title>
          <template v-slot:append>
            <v-text-field
              v-model="preferences.maxHours"
              type="number"
              hide-details
              density="compact"
              variant="outlined"
              style="width: 80px"
            ></v-text-field>
          </template>
        </v-list-item>
      </v-list>

      <template v-slot:append>
        <div class="pa-4">
          <v-btn
            color="primary"
            block
            :loading="saving"
            @click="savePreferences"
          >
            Save Preferences
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- Shift Dialog -->
    <v-dialog
      v-model="showShiftDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title>
          {{ editingShift ? 'Edit Shift' : 'Add Shift' }}
        </v-card-title>

        <v-card-text>
          <v-form ref="shiftForm" @submit.prevent="saveShift">
            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="shiftForm.day"
                  label="Day"
                  :items="weekDays"
                  item-title="label"
                  item-value="value"
                  hide-details
                ></v-select>
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="shiftForm.startTime"
                  label="Start Time"
                  type="time"
                  hide-details
                ></v-text-field>
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="shiftForm.endTime"
                  label="End Time"
                  type="time"
                  hide-details
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-select
                  v-model="shiftForm.status"
                  label="Status"
                  :items="shiftStatuses"
                  hide-details
                ></v-select>
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="shiftForm.notes"
                  label="Notes"
                  rows="2"
                  hide-details
                ></v-textarea>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showShiftDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :loading="saving"
            @click="saveShift"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'ScheduleManager',

  setup() {
    const store = useStore()
    const calendar = ref(null)
    const shiftForm = ref(null)

    // State
    const showCalendar = ref(false)
    const drawer = ref(false)
    const showShiftDialog = ref(false)
    const selectedDate = ref(new Date())
    const saving = ref(false)
    const editingShift = ref(null)

    // Form data
    const shiftForm = ref({
      day: '',
      startTime: '',
      endTime: '',
      status: 'available',
      notes: ''
    })

    const preferences = ref({
      monday: { available: true },
      tuesday: { available: true },
      wednesday: { available: true },
      thursday: { available: true },
      friday: { available: true },
      saturday: { available: true },
      sunday: { available: true },
      minHours: 20,
      maxHours: 40
    })

    // Constants
    const weekDays = [
      { label: 'Monday', value: 'monday' },
      { label: 'Tuesday', value: 'tuesday' },
      { label: 'Wednesday', value: 'wednesday' },
      { label: 'Thursday', value: 'thursday' },
      { label: 'Friday', value: 'friday' },
      { label: 'Saturday', value: 'saturday' },
      { label: 'Sunday', value: 'sunday' }
    ]

    const shiftStatuses = [
      { text: 'Available', value: 'available' },
      { text: 'Busy', value: 'busy' },
      { text: 'Time Off', value: 'time_off' }
    ]

    // Computed
    const formattedShifts = computed(() => {
      // Transform shifts for calendar display
      return store.state.driver.shifts.map(shift => ({
        name: `${formatTimeRange(shift.start, shift.end)}`,
        start: new Date(shift.start),
        end: new Date(shift.end),
        status: shift.status,
        color: getShiftColor(shift),
        timed: true
      }))
    })

    const calendarType = computed(() => {
      const width = window.innerWidth
      return width < 600 ? 'week' : 'month'
    })

    const totalHours = computed(() => {
      let total = 0
      store.state.driver.shifts.forEach(shift => {
        const start = new Date(shift.start)
        const end = new Date(shift.end)
        total += (end - start) / (1000 * 60 * 60)
      })
      return Math.round(total)
    })

    const weeklyEarningsPotential = computed(() => {
      const hourlyRate = 25 // Example hourly rate
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(totalHours.value * hourlyRate)
    })

    const shiftsCount = computed(() => store.state.driver.shifts.length)

    // Methods
    const getShiftsForDay = (day) => {
      return store.state.driver.shifts.filter(shift => {
        const date = new Date(shift.start)
        return date.getDay() === weekDays.findIndex(d => d.value === day)
      })
    }

    const formatTimeRange = (start, end) => {
      const startTime = new Date(start).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      })
      const endTime = new Date(end).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      })
      return `${startTime} - ${endTime}`
    }

    const getShiftColor = (shift) => {
      switch (shift.status) {
        case 'available': return 'success'
        case 'busy': return 'warning'
        case 'time_off': return 'error'
        default: return 'grey'
      }
    }

    const addShift = (day) => {
      editingShift.value = null
      shiftForm.value = {
        day,
        startTime: '09:00',
        endTime: '17:00',
        status: 'available',
        notes: ''
      }
      showShiftDialog.value = true
    }

    const editShift = (shift) => {
      editingShift.value = shift
      shiftForm.value = {
        day: new Date(shift.start).getDay(),
        startTime: new Date(shift.start).toTimeString().slice(0, 5),
        endTime: new Date(shift.end).toTimeString().slice(0, 5),
        status: shift.status,
        notes: shift.notes || ''
      }
      showShiftDialog.value = true
    }

    const saveShift = async () => {
      saving.value = true
      try {
        const shiftData = {
          ...shiftForm.value,
          id: editingShift.value?.id
        }
        
        if (editingShift.value) {
          await store.dispatch('driver/updateShift', shiftData)
        } else {
          await store.dispatch('driver/addShift', shiftData)
        }
        
        showShiftDialog.value = false
      } catch (error) {
        console.error('Failed to save shift:', error)
      } finally {
        saving.value = false
      }
    }

    const removeShift = async (shift) => {
      if (confirm('Are you sure you want to remove this shift?')) {
        try {
          await store.dispatch('driver/removeShift', shift.id)
        } catch (error) {
          console.error('Failed to remove shift:', error)
        }
      }
    }

    const handleDateClick = (event) => {
      const day = weekDays[event.date.getDay()].value
      addShift(day)
    }

    const showShiftDetails = (event) => {
      editShift(event.event)
    }

    const savePreferences = async () => {
      saving.value = true
      try {
        await store.dispatch('driver/updateSchedulePreferences', preferences.value)
        drawer.value = false
      } catch (error) {
        console.error('Failed to save preferences:', error)
      } finally {
        saving.value = false
      }
    }

    return {
      calendar,
      showCalendar,
      drawer,
      showShiftDialog,
      selectedDate,
      saving,
      editingShift,
      shiftForm,
      preferences,
      weekDays,
      shiftStatuses,
      formattedShifts,
      calendarType,
      totalHours,
      weeklyEarningsPotential,
      shiftsCount,
      getShiftsForDay,
      formatTimeRange,
      getShiftColor,
      addShift,
      editShift,
      saveShift,
      removeShift,
      handleDateClick,
      showShiftDetails,
      savePreferences
    }
  }
}
</script>

<style scoped>
.schedule-manager {
  height: 100%;
}

.weekly-schedule {
  display: grid;
  gap: 16px;
}

.day-schedule {
  padding: 12px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.day-name {
  font-weight: 500;
}

.shifts-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.no-shifts {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.6);
  font-style: italic;
}

.schedule-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 16px;
  text-align: center;
}

.event-content {
  font-size: 0.75rem;
  line-height: 1.2;
}

@media (max-width: 600px) {
  .weekly-schedule {
    gap: 8px;
  }

  .day-schedule {
    padding: 8px;
  }
}
</style>
