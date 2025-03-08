<template>
  <div class="delivery-zone-manager">
    <v-row>
      <!-- Zone Map -->
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            Delivery Zones
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              @click="showZoneDialog = true"
            >
              Add Zone
            </v-btn>
          </v-card-title>

          <v-card-text>
            <div class="zone-map" ref="mapElement"></div>

            <!-- Zone Legend -->
            <div class="zone-legend mt-4">
              <div
                v-for="zone in zones"
                :key="zone.id"
                class="d-flex align-center mb-2"
              >
                <v-checkbox
                  v-model="zone.visible"
                  :label="zone.name"
                  hide-details
                  class="mr-4"
                  @change="toggleZoneVisibility(zone)"
                ></v-checkbox>
                <v-chip
                  :color="zone.color"
                  size="small"
                  class="mr-2"
                >
                  ${{ zone.deliveryFee }}
                </v-chip>
                <v-btn
                  icon="mdi-pencil"
                  variant="text"
                  size="small"
                  @click="editZone(zone)"
                >
                  <v-tooltip activator="parent" location="top">
                    Edit Zone
                  </v-tooltip>
                </v-btn>
                <v-btn
                  icon="mdi-delete"
                  variant="text"
                  size="small"
                  color="error"
                  @click="confirmDeleteZone(zone)"
                >
                  <v-tooltip activator="parent" location="top">
                    Delete Zone
                  </v-tooltip>
                </v-btn>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Zone Settings -->
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>Delivery Settings</v-card-title>
          <v-card-text>
            <v-form v-model="settingsForm.valid">
              <!-- Minimum Order -->
              <v-text-field
                v-model.number="settings.minimumOrder"
                label="Minimum Order Amount"
                prefix="$"
                type="number"
                :rules="[rules.required, rules.positiveNumber]"
              ></v-text-field>

              <!-- Maximum Distance -->
              <v-text-field
                v-model.number="settings.maxDistance"
                label="Maximum Delivery Distance"
                suffix="km"
                type="number"
                :rules="[rules.required, rules.positiveNumber]"
              ></v-text-field>

              <!-- Order Capacity -->
              <v-text-field
                v-model.number="settings.orderCapacity"
                label="Maximum Orders per Hour"
                type="number"
                :rules="[rules.required, rules.positiveNumber]"
              ></v-text-field>

              <!-- Peak Hours -->
              <div class="text-subtitle-1 mb-2">Peak Hours</div>
              <v-row
                v-for="(peak, index) in settings.peakHours"
                :key="index"
                class="mb-2"
              >
                <v-col cols="5">
                  <v-text-field
                    v-model="peak.start"
                    label="Start"
                    type="time"
                    :rules="[rules.required]"
                  ></v-text-field>
                </v-col>
                <v-col cols="5">
                  <v-text-field
                    v-model="peak.end"
                    label="End"
                    type="time"
                    :rules="[rules.required]"
                  ></v-text-field>
                </v-col>
                <v-col cols="2">
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    color="error"
                    @click="settings.peakHours.splice(index, 1)"
                  ></v-btn>
                </v-col>
              </v-row>
              <v-btn
                block
                variant="outlined"
                prepend-icon="mdi-plus"
                @click="addPeakHour"
                class="mb-4"
              >
                Add Peak Hours
              </v-btn>

              <!-- Peak Hour Surcharge -->
              <v-text-field
                v-model.number="settings.peakSurcharge"
                label="Peak Hour Surcharge"
                prefix="$"
                type="number"
                :rules="[rules.required, rules.positiveNumber]"
              ></v-text-field>

              <v-btn
                block
                color="primary"
                :loading="savingSettings"
                :disabled="!settingsForm.valid"
                @click="saveSettings"
              >
                Save Settings
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Zone Dialog -->
    <v-dialog v-model="showZoneDialog" max-width="500">
      <v-card>
        <v-card-title>
          {{ editingZone ? 'Edit Zone' : 'Add Zone' }}
        </v-card-title>

        <v-card-text>
          <v-form v-model="zoneForm.valid">
            <v-text-field
              v-model="zoneForm.name"
              label="Zone Name"
              :rules="[rules.required]"
            ></v-text-field>

            <v-text-field
              v-model.number="zoneForm.deliveryFee"
              label="Delivery Fee"
              prefix="$"
              type="number"
              :rules="[rules.required, rules.positiveNumber]"
            ></v-text-field>

            <v-select
              v-model="zoneForm.color"
              :items="zoneColors"
              label="Zone Color"
            >
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props">
                  <template v-slot:prepend>
                    <v-avatar :color="item.raw.value" size="24"></v-avatar>
                  </template>
                  <v-list-item-title>{{ item.raw.title }}</v-list-item-title>
                </v-list-item>
              </template>
            </v-select>

            <v-text-field
              v-model.number="zoneForm.minOrder"
              label="Minimum Order Amount"
              prefix="$"
              type="number"
              :rules="[rules.required, rules.positiveNumber]"
            ></v-text-field>

            <v-text-field
              v-model.number="zoneForm.estimatedTime"
              label="Estimated Delivery Time"
              suffix="min"
              type="number"
              :rules="[rules.required, rules.positiveNumber]"
            ></v-text-field>
          </v-form>

          <v-alert
            v-if="!editingZone"
            type="info"
            variant="outlined"
            class="mt-4"
          >
            Click on the map to draw the delivery zone area
          </v-alert>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="cancelZone"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :loading="savingZone"
            :disabled="!zoneForm.valid"
            @click="saveZone"
          >
            {{ editingZone ? 'Update' : 'Add' }} Zone
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Zone?</v-card-title>
        <v-card-text>
          Are you sure you want to delete this delivery zone? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showDeleteDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            :loading="deletingZone"
            @click="deleteZone"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useStore } from 'vuex'
import { useToast } from '@/composables/useToast'
import mapService from '@/services/map.service'

interface DeliveryZone {
  id: string;
  name: string;
  color: string;
  deliveryFee: number;
  minOrder: number;
  estimatedTime: number;
  coordinates: Array<{ lat: number; lng: number }>;
  visible: boolean;
}

interface PeakHour {
  start: string;
  end: string;
}

interface DeliverySettings {
  minimumOrder: number;
  maxDistance: number;
  orderCapacity: number;
  peakHours: PeakHour[];
  peakSurcharge: number;
}

export default {
  name: 'DeliveryZoneManager',

  props: {
    restaurantId: {
      type: String,
      required: true
    },
    initialLocation: {
      type: Object,
      required: true,
      validator: (value: any) => {
        return value.lat !== undefined && value.lng !== undefined
      }
    }
  },

  setup(props) {
    const store = useStore()
    const { showToast } = useToast()

    // Map refs
    const mapElement = ref<HTMLElement | null>(null)
    const map = ref<any>(null)

    // State
    const zones = ref<DeliveryZone[]>([])
    const settings = ref<DeliverySettings>({
      minimumOrder: 0,
      maxDistance: 5,
      orderCapacity: 20,
      peakHours: [],
      peakSurcharge: 0
    })

    // Form state
    const settingsForm = ref({ valid: true })
    const zoneForm = ref({
      valid: true,
      name: '',
      deliveryFee: 0,
      color: '',
      minOrder: 0,
      estimatedTime: 30
    })

    // Dialog state
    const showZoneDialog = ref(false)
    const showDeleteDialog = ref(false)
    const editingZone = ref<DeliveryZone | null>(null)
    const zoneToDelete = ref<DeliveryZone | null>(null)

    // Loading state
    const savingSettings = ref(false)
    const savingZone = ref(false)
    const deletingZone = ref(false)

    // Zone colors
    const zoneColors = [
      { title: 'Red', value: 'red-lighten-3' },
      { title: 'Green', value: 'green-lighten-3' },
      { title: 'Blue', value: 'blue-lighten-3' },
      { title: 'Purple', value: 'purple-lighten-3' },
      { title: 'Orange', value: 'orange-lighten-3' }
    ]

    // Validation rules
    const rules = {
      required: (v: any) => !!v || 'Required',
      positiveNumber: (v: number) => v >= 0 || 'Must be 0 or greater'
    }

    // Initialize map
    onMounted(async () => {
      if (mapElement.value) {
        map.value = await mapService.createMap(mapElement.value, {
          center: props.initialLocation,
          zoom: 13
        })

        // Add restaurant marker
        await mapService.addMarker(map.value, props.initialLocation, {
          title: 'Restaurant Location',
          icon: 'restaurant'
        })

        // Load zones
        await loadZones()
        await loadSettings()
      }
    })

    // Methods
    const loadZones = async () => {
      try {
        const response = await store.dispatch('restaurant/getDeliveryZones', props.restaurantId)
        zones.value = response.map((zone: DeliveryZone) => ({
          ...zone,
          visible: true
        }))
        zones.value.forEach(zone => drawZone(zone))
      } catch (error) {
        console.error('Failed to load delivery zones:', error)
        showToast('Failed to load delivery zones', 'error')
      }
    }

    const loadSettings = async () => {
      try {
        const response = await store.dispatch('restaurant/getDeliverySettings', props.restaurantId)
        settings.value = response
      } catch (error) {
        console.error('Failed to load delivery settings:', error)
        showToast('Failed to load delivery settings', 'error')
      }
    }

    const drawZone = (zone: DeliveryZone) => {
      // Implementation will depend on the map service being used
      mapService.drawPolygon(map.value, zone.coordinates, {
        color: zone.color,
        id: zone.id
      })
    }

    const toggleZoneVisibility = (zone: DeliveryZone) => {
      mapService.togglePolygonVisibility(map.value, zone.id, zone.visible)
    }

    const saveSettings = async () => {
      savingSettings.value = true
      try {
        await store.dispatch('restaurant/updateDeliverySettings', {
          restaurantId: props.restaurantId,
          settings: settings.value
        })
        showToast('Settings saved successfully', 'success')
      } catch (error) {
        console.error('Failed to save settings:', error)
        showToast('Failed to save settings', 'error')
      } finally {
        savingSettings.value = false
      }
    }

    const addPeakHour = () => {
      settings.value.peakHours.push({
        start: '12:00',
        end: '14:00'
      })
    }

    const editZone = (zone: DeliveryZone) => {
      editingZone.value = zone
      zoneForm.value = {
        ...zoneForm.value,
        name: zone.name,
        deliveryFee: zone.deliveryFee,
        color: zone.color,
        minOrder: zone.minOrder,
        estimatedTime: zone.estimatedTime
      }
      showZoneDialog.value = true
    }

    const saveZone = async () => {
      savingZone.value = true
      try {
        const zoneData = {
          ...zoneForm.value,
          coordinates: [] // Get coordinates from map drawing
        }

        if (editingZone.value) {
          await store.dispatch('restaurant/updateDeliveryZone', {
            restaurantId: props.restaurantId,
            zoneId: editingZone.value.id,
            data: zoneData
          })
        } else {
          await store.dispatch('restaurant/addDeliveryZone', {
            restaurantId: props.restaurantId,
            data: zoneData
          })
        }

        showZoneDialog.value = false
        loadZones()
        showToast(`Zone ${editingZone.value ? 'updated' : 'added'} successfully`, 'success')
      } catch (error) {
        console.error('Failed to save zone:', error)
        showToast('Failed to save zone', 'error')
      } finally {
        savingZone.value = false
      }
    }

    const cancelZone = () => {
      showZoneDialog.value = false
      editingZone.value = null
      zoneForm.value = {
        ...zoneForm.value,
        name: '',
        deliveryFee: 0,
        color: '',
        minOrder: 0,
        estimatedTime: 30
      }
    }

    const confirmDeleteZone = (zone: DeliveryZone) => {
      zoneToDelete.value = zone
      showDeleteDialog.value = true
    }

    const deleteZone = async () => {
      if (!zoneToDelete.value) return

      deletingZone.value = true
      try {
        await store.dispatch('restaurant/deleteDeliveryZone', {
          restaurantId: props.restaurantId,
          zoneId: zoneToDelete.value.id
        })
        showDeleteDialog.value = false
        loadZones()
        showToast('Zone deleted successfully', 'success')
      } catch (error) {
        console.error('Failed to delete zone:', error)
        showToast('Failed to delete zone', 'error')
      } finally {
        deletingZone.value = false
        zoneToDelete.value = null
      }
    }

    return {
      // Refs
      mapElement,
      zones,
      settings,
      settingsForm,
      zoneForm,
      showZoneDialog,
      showDeleteDialog,
      editingZone,
      savingSettings,
      savingZone,
      deletingZone,
      zoneColors,
      rules,

      // Methods
      toggleZoneVisibility,
      saveSettings,
      addPeakHour,
      editZone,
      saveZone,
      cancelZone,
      confirmDeleteZone,
      deleteZone
    }
  }
}
</script>

<style scoped>
.delivery-zone-manager {
  max-width: 1400px;
  margin: 0 auto;
}

.zone-map {
  width: 100%;
  height: 500px;
  border-radius: 4px;
  overflow: hidden;
}
</style>