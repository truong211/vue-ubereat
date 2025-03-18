<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Restaurant Settings</h1>
        
        <v-card>
          <v-tabs v-model="activeTab">
            <v-tab value="hours">Opening Hours</v-tab>
            <v-tab value="delivery">Delivery Settings</v-tab>
            <v-tab value="notifications">Notifications</v-tab>
          </v-tabs>
          
          <v-card-text>
            <v-window v-model="activeTab">
              <!-- Opening Hours Tab -->
              <v-window-item value="hours">
                <v-form @submit.prevent="saveSettings('openingHours')">
                  <v-row>
                    <v-col cols="12">
                      <div v-for="(hours, day) in settings.openingHours" :key="day" class="d-flex align-center mb-4">
                        <v-checkbox
                          v-model="hours.enabled"
                          :label="day"
                          density="compact"
                          class="mr-4"
                        ></v-checkbox>
                        
                        <v-text-field
                          v-model="hours.open"
                          type="time"
                          label="Open"
                          density="compact"
                          class="mr-4"
                          :disabled="!hours.enabled"
                        ></v-text-field>
                        
                        <v-text-field
                          v-model="hours.close"
                          type="time"
                          label="Close"
                          density="compact"
                          :disabled="!hours.enabled"
                        ></v-text-field>
                      </div>
                    </v-col>
                    
                    <!-- Special Holidays Section -->
                    <v-col cols="12">
                      <div class="d-flex align-center mb-4">
                        <h3 class="text-h6">Special Holidays</h3>
                        <v-spacer></v-spacer>
                        <v-btn
                          color="primary"
                          prepend-icon="mdi-plus"
                          @click="holidayDialog.show = true"
                        >
                          Add Holiday
                        </v-btn>
                      </div>
                      
                      <v-list>
                        <v-list-item
                          v-for="holiday in settings.specialHolidays"
                          :key="holiday.id"
                        >
                          <template v-slot:prepend>
                            <v-chip
                              :color="holiday.isOpen ? 'success' : 'error'"
                              size="small"
                            >
                              {{ holiday.isOpen ? 'Open' : 'Closed' }}
                            </v-chip>
                          </template>
                          
                          <v-list-item-title>
                            {{ formatDate(holiday.date) }}
                          </v-list-item-title>
                          
                          <v-list-item-subtitle v-if="holiday.isOpen">
                            {{ formatTime(holiday.openTime) }} - {{ formatTime(holiday.closeTime) }}
                          </v-list-item-subtitle>
                          
                          <template v-slot:append>
                            <v-btn
                              icon="mdi-delete"
                              variant="text"
                              size="small"
                              color="error"
                              @click="removeHoliday(holiday.id)"
                            ></v-btn>
                          </template>
                        </v-list-item>
                      </v-list>
                    </v-col>
                    
                    <v-col cols="12">
                      <v-btn
                        color="primary"
                        type="submit"
                        :loading="loading"
                      >
                        Save Opening Hours
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-form>
              </v-window-item>
              
              <!-- Delivery Settings Tab -->
              <v-window-item value="delivery">
                <v-form @submit.prevent="saveSettings('deliverySettings')">
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model.number="settings.deliverySettings.radius"
                        label="Delivery Radius (km)"
                        type="number"
                        min="0"
                        step="0.1"
                        :rules="[v => v >= 0 || 'Radius must be positive']"
                      ></v-text-field>
                    </v-col>
                    
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model.number="settings.deliverySettings.minOrder"
                        label="Minimum Order Amount ($)"
                        type="number"
                        min="0"
                        step="0.01"
                        :rules="[v => v >= 0 || 'Amount must be positive']"
                      ></v-text-field>
                    </v-col>
                    
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model.number="settings.deliverySettings.baseFee"
                        label="Base Delivery Fee ($)"
                        type="number"
                        min="0"
                        step="0.01"
                        :rules="[v => v >= 0 || 'Fee must be positive']"
                      ></v-text-field>
                    </v-col>
                    
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model.number="settings.deliverySettings.perKmFee"
                        label="Per Kilometer Fee ($)"
                        type="number"
                        min="0"
                        step="0.01"
                        :rules="[v => v >= 0 || 'Fee must be positive']"
                      ></v-text-field>
                    </v-col>
                    
                    <v-col cols="12">
                      <v-switch
                        v-model="settings.deliverySettings.autoAccept"
                        label="Auto-accept orders"
                        density="compact"
                      ></v-switch>
                      
                      <v-switch
                        v-model="settings.deliverySettings.pickupEnabled"
                        label="Enable pickup orders"
                        density="compact"
                      ></v-switch>
                    </v-col>
                    
                    <v-col cols="12">
                      <v-btn
                        color="primary"
                        type="submit"
                        :loading="loading"
                      >
                        Save Delivery Settings
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-form>
              </v-window-item>
              
              <!-- Notifications Tab -->
              <v-window-item value="notifications">
                <v-form @submit.prevent="saveSettings('notificationPreferences')">
                  <v-row>
                    <v-col cols="12">
                      <h3 class="text-h6 mb-4">Notification Methods</h3>
                      <v-switch
                        v-model="settings.notificationPreferences.email"
                        label="Email Notifications"
                        density="compact"
                      ></v-switch>
                      
                      <v-switch
                        v-model="settings.notificationPreferences.sms"
                        label="SMS Notifications"
                        density="compact"
                      ></v-switch>
                      
                      <v-switch
                        v-model="settings.notificationPreferences.push"
                        label="Push Notifications"
                        density="compact"
                      ></v-switch>
                    </v-col>
                    
                    <v-col cols="12">
                      <h3 class="text-h6 mb-4">Notification Types</h3>
                      <v-switch
                        v-model="settings.notificationPreferences.newOrders"
                        label="New Orders"
                        density="compact"
                      ></v-switch>
                      
                      <v-switch
                        v-model="settings.notificationPreferences.orderUpdates"
                        label="Order Updates"
                        density="compact"
                      ></v-switch>
                      
                      <v-switch
                        v-model="settings.notificationPreferences.reviews"
                        label="New Reviews"
                        density="compact"
                      ></v-switch>
                    </v-col>
                    
                    <v-col cols="12">
                      <v-btn
                        color="primary"
                        type="submit"
                        :loading="loading"
                      >
                        Save Notification Settings
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-form>
              </v-window-item>
            </v-window>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Holiday Dialog -->
    <v-dialog v-model="holidayDialog.show" max-width="500">
      <v-card>
        <v-card-title>Add Special Holiday</v-card-title>
        
        <v-card-text>
          <v-form ref="holidayForm">
            <v-row>
              <v-col cols="12">
                <v-date-picker
                  v-model="holidayDialog.form.date"
                  label="Date"
                ></v-date-picker>
              </v-col>
              
              <v-col cols="12">
                <v-switch
                  v-model="holidayDialog.form.isOpen"
                  label="Open on this day?"
                  density="compact"
                ></v-switch>
              </v-col>
              
              <v-col cols="12" md="6" v-if="holidayDialog.form.isOpen">
                <v-text-field
                  v-model="holidayDialog.form.openTime"
                  type="time"
                  label="Open Time"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6" v-if="holidayDialog.form.isOpen">
                <v-text-field
                  v-model="holidayDialog.form.closeTime"
                  type="time"
                  label="Close Time"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            @click="addHoliday"
          >
            Add
          </v-btn>
          <v-btn
            variant="text"
            @click="holidayDialog.show = false"
          >
            Cancel
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import { format } from 'date-fns';

export default {
  name: 'SettingsManagement',
  
  setup() {
    const store = useStore();
    const route = useRoute();
    const restaurantId = computed(() => route.params.id);
    
    const activeTab = ref('hours');
    const loading = ref(false);
    
    // Form data
    const settings = ref({
      openingHours: {},
      deliverySettings: {},
      notificationPreferences: {},
      specialHolidays: []
    });
    
    // Holiday dialog
    const holidayDialog = ref({
      show: false,
      form: {
        date: null,
        isOpen: true,
        openTime: '09:00',
        closeTime: '22:00'
      }
    });
    
    const holidayForm = ref(null);
    
    // Load settings
    const loadSettings = async () => {
      loading.value = true;
      try {
        await store.dispatch('restaurantAdmin/fetchRestaurantSettings', restaurantId.value);
        settings.value = { ...store.state.restaurantAdmin.settings };
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        loading.value = false;
      }
    };
    
    // Save settings
    const saveSettings = async (section) => {
      loading.value = true;
      try {
        await store.dispatch('restaurantAdmin/updateRestaurantSettings', {
          restaurantId: restaurantId.value,
          section,
          data: settings.value[section]
        });
      } catch (error) {
        console.error('Error saving settings:', error);
      } finally {
        loading.value = false;
      }
    };
    
    // Holiday management
    const addHoliday = async () => {
      if (!holidayDialog.value.form.date) return;
      
      const newHoliday = {
        id: Date.now(), // temporary id
        ...holidayDialog.value.form
      };
      
      const updatedHolidays = [...settings.value.specialHolidays, newHoliday];
      
      try {
        await store.dispatch('restaurantAdmin/updateSpecialHolidays', {
          restaurantId: restaurantId.value,
          holidays: updatedHolidays
        });
        
        settings.value.specialHolidays = updatedHolidays;
        holidayDialog.value.show = false;
        holidayDialog.value.form = {
          date: null,
          isOpen: true,
          openTime: '09:00',
          closeTime: '22:00'
        };
      } catch (error) {
        console.error('Error adding holiday:', error);
      }
    };
    
    const removeHoliday = async (holidayId) => {
      const updatedHolidays = settings.value.specialHolidays.filter(h => h.id !== holidayId);
      
      try {
        await store.dispatch('restaurantAdmin/updateSpecialHolidays', {
          restaurantId: restaurantId.value,
          holidays: updatedHolidays
        });
        
        settings.value.specialHolidays = updatedHolidays;
      } catch (error) {
        console.error('Error removing holiday:', error);
      }
    };
    
    // Format helpers
    const formatDate = (date) => {
      return format(new Date(date), 'MMM dd, yyyy');
    };
    
    const formatTime = (time) => {
      return time;
    };
    
    // Load settings on mount
    onMounted(() => {
      loadSettings();
    });
    
    return {
      activeTab,
      settings,
      loading,
      holidayDialog,
      holidayForm,
      saveSettings,
      addHoliday,
      removeHoliday,
      formatDate,
      formatTime
    };
  }
};
</script>

<style scoped>
.v-row {
  margin: 0;
}

.v-col {
  padding: 8px;
}

.v-window {
  min-height: 400px;
}
</style>