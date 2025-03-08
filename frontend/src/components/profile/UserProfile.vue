<template>
  <div class="user-profile">
    <v-tabs
      v-model="activeTab"
      fixed-tabs
      class="mb-4"
    >
      <v-tab value="profile">
        <v-icon start>mdi-account</v-icon>
        Profile
      </v-tab>
      <v-tab value="addresses">
        <v-icon start>mdi-map-marker</v-icon>
        Addresses
      </v-tab>
      <v-tab value="favorites">
        <v-icon start>mdi-heart</v-icon>
        Favorites
      </v-tab>
      <v-tab value="preferences">
        <v-icon start>mdi-cog</v-icon>
        Preferences
      </v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <!-- Profile Tab -->
      <v-window-item value="profile">
        <v-form ref="profileForm" @submit.prevent="updateProfile">
          <!-- Profile Photo -->
          <div class="text-center mb-6">
            <v-avatar
              size="128"
              :image="profileImage || '/images/default-avatar.png'"
              class="mb-2"
            >
              <v-btn
                icon
                color="primary"
                size="x-small"
                class="avatar-edit-button"
                @click="triggerImageUpload"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
            </v-avatar>
            <input
              type="file"
              ref="imageInput"
              accept="image/*"
              class="d-none"
              @change="handleImageUpload"
            >
          </div>

          <!-- Basic Information -->
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="profile.firstName"
                label="First Name"
                :rules="[rules.required]"
                required
              ></v-text-field>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-text-field
                v-model="profile.lastName"
                label="Last Name"
                :rules="[rules.required]"
                required
              ></v-text-field>
            </v-col>
          </v-row>

          <v-text-field
            v-model="profile.email"
            label="Email"
            type="email"
            :rules="[rules.required, rules.email]"
            required
            disabled
          ></v-text-field>

          <v-text-field
            v-model="profile.phone"
            label="Phone Number"
            :rules="[rules.required, rules.phone]"
            required
          ></v-text-field>

          <div class="d-flex justify-end mt-4">
            <v-btn
              type="submit"
              color="primary"
              :loading="updating"
            >
              Save Changes
            </v-btn>
          </div>
        </v-form>
      </v-window-item>

      <!-- Addresses Tab -->
      <v-window-item value="addresses">
        <!-- Add New Address Button -->
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          class="mb-4"
          @click="showAddressDialog = true"
        >
          Add New Address
        </v-btn>

        <!-- Address List -->
        <v-list v-if="addresses.length > 0">
          <v-list-item
            v-for="address in addresses"
            :key="address.id"
            :title="address.name"
          >
            <template v-slot:prepend>
              <v-icon :color="address.isDefault ? 'primary' : undefined">
                {{ getAddressIcon(address.type) }}
              </v-icon>
            </template>

            <v-list-item-subtitle>
              {{ formatAddress(address) }}
            </v-list-item-subtitle>

            <template v-slot:append>
              <v-btn
                v-if="!address.isDefault"
                variant="text"
                color="primary"
                size="small"
                @click="setDefaultAddress(address)"
              >
                Set as Default
              </v-btn>
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn
                    icon="mdi-dots-vertical"
                    variant="text"
                    v-bind="props"
                  ></v-btn>
                </template>
                <v-list>
                  <v-list-item
                    prepend-icon="mdi-pencil"
                    title="Edit"
                    @click="editAddress(address)"
                  ></v-list-item>
                  <v-list-item
                    prepend-icon="mdi-delete"
                    title="Delete"
                    color="error"
                    @click="confirmDeleteAddress(address)"
                  ></v-list-item>
                </v-list>
              </v-menu>
            </template>
          </v-list-item>
        </v-list>

        <div v-else class="text-center py-8">
          <v-icon size="64" color="grey-lighten-1">mdi-map-marker-off</v-icon>
          <div class="text-h6 mt-4">No addresses yet</div>
          <div class="text-body-1 text-medium-emphasis mb-4">
            Add your delivery addresses to make ordering easier
          </div>
        </div>
      </v-window-item>

      <!-- Favorites Tab -->
      <v-window-item value="favorites">
        <!-- Favorite Restaurants -->
        <v-row>
          <v-col
            v-for="restaurant in favoriteRestaurants"
            :key="restaurant.id"
            cols="12"
            sm="6"
            md="4"
          >
            <v-card>
              <v-img
                :src="restaurant.image"
                height="200"
                cover
              ></v-img>
              
              <v-card-title class="d-flex justify-space-between">
                {{ restaurant.name }}
                <v-btn
                  icon="mdi-heart"
                  variant="text"
                  color="error"
                  @click="removeFromFavorites(restaurant)"
                ></v-btn>
              </v-card-title>
              
              <v-card-subtitle>
                {{ restaurant.cuisines.join(', ') }}
              </v-card-subtitle>
              
              <v-card-text>
                <div class="d-flex align-center">
                  <v-rating
                    :model-value="restaurant.rating"
                    color="amber"
                    density="compact"
                    size="small"
                    readonly
                  ></v-rating>
                  <span class="text-body-2 ml-2">
                    {{ restaurant.rating.toFixed(1) }}
                    ({{ restaurant.reviewCount }})
                  </span>
                </div>
                
                <div class="d-flex align-center mt-2">
                  <v-icon size="small" class="mr-1">mdi-clock-outline</v-icon>
                  <span class="text-body-2">
                    {{ restaurant.deliveryTime }} min
                  </span>
                  <v-icon size="small" class="mx-1">mdi-circle-small</v-icon>
                  <span class="text-body-2">
                    {{ restaurant.distance }} km
                  </span>
                </div>
              </v-card-text>
              
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                  color="primary"
                  variant="text"
                  :to="{ name: 'RestaurantDetail', params: { id: restaurant.id }}"
                >
                  Order Now
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>

        <div v-if="favoriteRestaurants.length === 0" class="text-center py-8">
          <v-icon size="64" color="grey-lighten-1">mdi-heart-off</v-icon>
          <div class="text-h6 mt-4">No favorite restaurants yet</div>
          <div class="text-body-1 text-medium-emphasis mb-4">
            Add restaurants to your favorites for quick access
          </div>
          <v-btn
            color="primary"
            to="/restaurants"
            prepend-icon="mdi-store-search"
          >
            Browse Restaurants
          </v-btn>
        </div>
      </v-window-item>

      <!-- Preferences Tab -->
      <v-window-item value="preferences">
        <!-- Dietary Preferences -->
        <div class="mb-6">
          <h3 class="text-h6 mb-3">Dietary Preferences</h3>
          <v-chip-group
            v-model="preferences.dietary"
            multiple
            selected-class="selected-preference"
          >
            <v-chip
              v-for="pref in dietaryOptions"
              :key="pref.value"
              :value="pref.value"
              filter
            >
              <v-icon start>{{ pref.icon }}</v-icon>
              {{ pref.label }}
            </v-chip>
          </v-chip-group>
        </div>

        <!-- Cuisine Preferences -->
        <div class="mb-6">
          <h3 class="text-h6 mb-3">Favorite Cuisines</h3>
          <v-chip-group
            v-model="preferences.cuisines"
            multiple
            selected-class="selected-preference"
          >
            <v-chip
              v-for="cuisine in cuisineOptions"
              :key="cuisine.value"
              :value="cuisine.value"
              filter
            >
              <v-icon start>{{ cuisine.icon }}</v-icon>
              {{ cuisine.label }}
            </v-chip>
          </v-chip-group>
        </div>

        <!-- Communication Preferences -->
        <div class="mb-6">
          <h3 class="text-h6 mb-3">Communication Preferences</h3>
          <v-list>
            <v-list-item>
              <template v-slot:prepend>
                <v-checkbox
                  v-model="preferences.notifications.orderUpdates"
                  hide-details
                ></v-checkbox>
              </template>
              <v-list-item-title>Order Updates</v-list-item-title>
              <v-list-item-subtitle>
                Get notifications about your order status
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template v-slot:prepend>
                <v-checkbox
                  v-model="preferences.notifications.promotions"
                  hide-details
                ></v-checkbox>
              </template>
              <v-list-item-title>Promotions</v-list-item-title>
              <v-list-item-subtitle>
                Receive special offers and discounts
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template v-slot:prepend>
                <v-checkbox
                  v-model="preferences.notifications.newsletter"
                  hide-details
                ></v-checkbox>
              </template>
              <v-list-item-title>Newsletter</v-list-item-title>
              <v-list-item-subtitle>
                Get weekly updates and food recommendations
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </div>

        <!-- Save Preferences -->
        <div class="d-flex justify-end">
          <v-btn
            color="primary"
            :loading="savingPreferences"
            @click="savePreferences"
          >
            Save Preferences
          </v-btn>
        </div>
      </v-window-item>
    </v-window>

    <!-- Address Dialog -->
    <v-dialog v-model="showAddressDialog" max-width="600">
      <v-card>
        <v-card-title>
          {{ editingAddress ? 'Edit Address' : 'Add New Address' }}
        </v-card-title>
        
        <v-card-text>
          <v-form ref="addressForm" @submit.prevent="saveAddress">
            <v-text-field
              v-model="addressForm.name"
              label="Address Name (e.g., Home, Work)"
              :rules="[rules.required]"
              required
            ></v-text-field>

            <v-text-field
              v-model="addressForm.street"
              label="Street Address"
              :rules="[rules.required]"
              required
            ></v-text-field>

            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="addressForm.city"
                  label="City"
                  :rules="[rules.required]"
                  required
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="addressForm.state"
                  label="State"
                  :rules="[rules.required]"
                  required
                ></v-text-field>
              </v-col>
            </v-row>

            <v-text-field
              v-model="addressForm.zipCode"
              label="ZIP Code"
              :rules="[rules.required, rules.zipCode]"
              required
            ></v-text-field>

            <v-select
              v-model="addressForm.type"
              :items="addressTypes"
              label="Address Type"
              required
            ></v-select>

            <v-textarea
              v-model="addressForm.instructions"
              label="Delivery Instructions (Optional)"
              rows="2"
              counter="200"
            ></v-textarea>

            <v-checkbox
              v-if="!editingAddress"
              v-model="addressForm.setDefault"
              label="Set as default address"
            ></v-checkbox>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showAddressDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :loading="savingAddress"
            @click="saveAddress"
          >
            Save Address
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Address Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Address?</v-card-title>
        <v-card-text>
          Are you sure you want to delete this address? This action cannot be undone.
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
            :loading="deletingAddress"
            @click="deleteAddress"
          >
            Delete
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
  name: 'UserProfile',

  setup() {
    const store = useStore()
    
    // State
    const activeTab = ref('profile')
    const updating = ref(false)
    const savingAddress = ref(false)
    const deletingAddress = ref(false)
    const savingPreferences = ref(false)
    const showAddressDialog = ref(false)
    const showDeleteDialog = ref(false)
    
    // Forms
    const profileForm = ref(null)
    const addressForm = ref(null)
    const imageInput = ref(null)
    
    // Profile data
    const profile = ref({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      photo: null
    })
    
    // Address data
    const addresses = ref([])
    const editingAddress = ref(null)
    const addressToDelete = ref(null)
    
    const addressForm = ref({
      name: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      type: 'home',
      instructions: '',
      setDefault: false
    })
    
    const addressTypes = [
      { text: 'Home', value: 'home' },
      { text: 'Work', value: 'work' },
      { text: 'Other', value: 'other' }
    ]
    
    // Favorites
    const favoriteRestaurants = ref([])
    
    // Preferences
    const preferences = ref({
      dietary: [],
      cuisines: [],
      notifications: {
        orderUpdates: true,
        promotions: true,
        newsletter: false
      }
    })
    
    const dietaryOptions = [
      { label: 'Vegetarian', value: 'vegetarian', icon: 'mdi-leaf' },
      { label: 'Vegan', value: 'vegan', icon: 'mdi-sprout' },
      { label: 'Gluten Free', value: 'gluten_free', icon: 'mdi-grain-off' },
      { label: 'Halal', value: 'halal', icon: 'mdi-food-halal' }
    ]
    
    const cuisineOptions = [
      { label: 'Italian', value: 'italian', icon: 'mdi-pizza' },
      { label: 'Japanese', value: 'japanese', icon: 'mdi-food-sushi' },
      { label: 'Chinese', value: 'chinese', icon: 'mdi-noodles' },
      { label: 'Indian', value: 'indian', icon: 'mdi-food-curry' },
      { label: 'Thai', value: 'thai', icon: 'mdi-bowl-mix' },
      { label: 'Mexican', value: 'mexican', icon: 'mdi-taco' }
    ]
    
    // Load user data
    const loadUserData = async () => {
      try {
        // Load profile
        const userData = await store.dispatch('profile/fetchUserProfile')
        profile.value = {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          phone: userData.phone,
          photo: userData.photo
        }
        
        // Load addresses
        addresses.value = await store.dispatch('profile/fetchAddresses')
        
        // Load favorites
        favoriteRestaurants.value = await store.dispatch('profile/fetchFavorites')
        
        // Load preferences
        const userPrefs = await store.dispatch('profile/fetchPreferences')
        preferences.value = {
          dietary: userPrefs.dietary || [],
          cuisines: userPrefs.cuisines || [],
          notifications: {
            ...preferences.value.notifications,
            ...userPrefs.notifications
          }
        }
      } catch (error) {
        console.error('Failed to load user data:', error)
      }
    }
    
    // Profile methods
    const updateProfile = async () => {
      if (!profileForm.value.validate()) return
      
      updating.value = true
      try {
        await store.dispatch('profile/updateProfile', profile.value)
      } catch (error) {
        console.error('Failed to update profile:', error)
      } finally {
        updating.value = false
      }
    }
    
    const triggerImageUpload = () => {
      imageInput.value?.click()
    }
    
    const handleImageUpload = async (event) => {
      const file = event.target.files?.[0]
      if (!file) return
      
      try {
        const imageUrl = await store.dispatch('profile/uploadProfileImage', file)
        profile.value.photo = imageUrl
      } catch (error) {
        console.error('Failed to upload image:', error)
      }
    }
    
    // Address methods
    const editAddress = (address) => {
      editingAddress.value = address
      addressForm.value = {
        name: address.name,
        street: address.street,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        type: address.type,
        instructions: address.instructions
      }
      showAddressDialog.value = true
    }
    
    const saveAddress = async () => {
      if (!addressForm.value?.validate()) return
      
      savingAddress.value = true
      try {
        if (editingAddress.value) {
          await store.dispatch('profile/updateAddress', {
            id: editingAddress.value.id,
            ...addressForm.value
          })
        } else {
          await store.dispatch('profile/addAddress', addressForm.value)
        }
        
        showAddressDialog.value = false
        await loadUserData()
      } catch (error) {
        console.error('Failed to save address:', error)
      } finally {
        savingAddress.value = false
      }
    }
    
    const confirmDeleteAddress = (address) => {
      addressToDelete.value = address
      showDeleteDialog.value = true
    }
    
    const deleteAddress = async () => {
      if (!addressToDelete.value) return
      
      deletingAddress.value = true
      try {
        await store.dispatch('profile/deleteAddress', addressToDelete.value.id)
        showDeleteDialog.value = false
        await loadUserData()
      } catch (error) {
        console.error('Failed to delete address:', error)
      } finally {
        deletingAddress.value = false
        addressToDelete.value = null
      }
    }
    
    const setDefaultAddress = async (address) => {
      try {
        await store.dispatch('profile/setDefaultAddress', address.id)
        await loadUserData()
      } catch (error) {
        console.error('Failed to set default address:', error)
      }
    }
    
    // Favorites methods
    const removeFromFavorites = async (restaurant) => {
      try {
        await store.dispatch('profile/removeFromFavorites', restaurant.id)
        await loadUserData()
      } catch (error) {
        console.error('Failed to remove from favorites:', error)
      }
    }
    
    // Preferences methods
    const savePreferences = async () => {
      savingPreferences.value = true
      try {
        await store.dispatch('profile/updatePreferences', preferences.value)
      } catch (error) {
        console.error('Failed to save preferences:', error)
      } finally {
        savingPreferences.value = false
      }
    }
    
    // Utility methods
    const getAddressIcon = (type) => {
      const icons = {
        home: 'mdi-home',
        work: 'mdi-office-building',
        other: 'mdi-map-marker'
      }
      return icons[type] || 'mdi-map-marker'
    }
    
    const formatAddress = (address) => {
      return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`
    }
    
    // Validation rules
    const rules = {
      required: v => !!v || 'Required',
      email: v => /.+@.+\..+/.test(v) || 'Invalid email',
      phone: v => /^\+?[\d\s-]{10,}$/.test(v) || 'Invalid phone number',
      zipCode: v => /^\d{5}(-\d{4})?$/.test(v) || 'Invalid ZIP code'
    }
    
    // Initialize
    loadUserData()
    
    return {
      activeTab,
      profile,
      updating,
      profileForm,
      addresses,
      showAddressDialog,
      showDeleteDialog,
      savingAddress,
      deletingAddress,
      editingAddress,
      addressForm,
      addressTypes,
      favoriteRestaurants,
      preferences,
      savingPreferences,
      dietaryOptions,
      cuisineOptions,
      imageInput,
      rules,
      updateProfile,
      triggerImageUpload,
      handleImageUpload,
      editAddress,
      saveAddress,
      confirmDeleteAddress,
      deleteAddress,
      setDefaultAddress,
      removeFromFavorites,
      savePreferences,
      getAddressIcon,
      formatAddress
    }
  }
}
</script>

<style scoped>
.user-profile {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
}

.avatar-edit-button {
  position: absolute;
  bottom: 0;
  right: 0;
}

.selected-preference {
  background-color: var(--v-primary-base) !important;
  color: white !important;
}
</style>