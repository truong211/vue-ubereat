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
                :src="restaurant.image_url || '/images/restaurant-placeholder.jpg'"
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
                {{ restaurant.cuisine || 'Various Cuisines' }}
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
                    ({{ restaurant.reviewCount || 0 }})
                  </span>
                </div>
                
                <div class="d-flex align-center mt-2">
                  <v-icon size="small" class="mr-1">mdi-map-marker</v-icon>
                  <span class="text-body-2 text-truncate">
                    {{ restaurant.address }}
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
import { mapState, mapActions } from 'vuex';

export default {
  name: 'UserProfile',
  
  data() {
    return {
      activeTab: 'profile',
      updating: false,
      savingAddress: false,
      deletingAddress: false,
      savingPreferences: false,
      showAddressDialog: false,
      showDeleteDialog: false,
      editingAddress: null,
      addressToDelete: null,
      profile: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        photo: null
      },
      addressForm: {
        name: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        type: 'home',
        instructions: '',
        setDefault: false
      },
      addressTypes: [
        { title: 'Home', value: 'home' },
        { title: 'Work', value: 'work' },
        { title: 'Other', value: 'other' }
      ],
      preferences: {
        dietary: [],
        cuisines: [],
        notifications: {
          orderUpdates: true,
          promotions: true,
          newsletter: false
        }
      },
      dietaryOptions: [
        { label: 'Vegetarian', value: 'vegetarian', icon: 'mdi-leaf' },
        { label: 'Vegan', value: 'vegan', icon: 'mdi-sprout' },
        { label: 'Gluten Free', value: 'gluten_free', icon: 'mdi-grain-off' },
        { label: 'Halal', value: 'halal', icon: 'mdi-food-halal' }
      ],
      cuisineOptions: [
        { label: 'Italian', value: 'italian', icon: 'mdi-pizza' },
        { label: 'Japanese', value: 'japanese', icon: 'mdi-food-sushi' },
        { label: 'Chinese', value: 'chinese', icon: 'mdi-noodles' },
        { label: 'Indian', value: 'indian', icon: 'mdi-food-curry' },
        { label: 'Thai', value: 'thai', icon: 'mdi-bowl-mix' },
        { label: 'Mexican', value: 'mexican', icon: 'mdi-taco' }
      ],
      rules: {
        required: v => !!v || 'Required',
        email: v => /.+@.+\..+/.test(v) || 'Invalid email',
        phone: v => /^\+?[\d\s-]{10,}$/.test(v) || 'Invalid phone number',
        zipCode: v => /^\d{5}(-\d{4})?$/.test(v) || 'Invalid ZIP code'
      }
    };
  },
  
  computed: {
    ...mapState({
      user: state => state.auth.user,
      addresses: state => state.profile.addresses,
      favoriteRestaurants: state => state.profile.favorites
    }),
    
    profileImage() {
      return this.profile.photo || this.user?.photo || null;
    }
  },
  
  methods: {
    ...mapActions({
      fetchUserProfile: 'profile/fetchUserProfile',
      updateUserProfile: 'profile/updateProfile',
      uploadProfileImage: 'profile/uploadProfileImage',
      fetchAddresses: 'profile/fetchAddresses',
      addAddress: 'profile/addAddress',
      updateAddress: 'profile/updateAddress',
      deleteAddressAction: 'profile/deleteAddress',
      setDefaultAddressAction: 'profile/setDefaultAddress',
      fetchFavorites: 'profile/fetchFavorites',
      removeFavorite: 'profile/removeFromFavorites',
      fetchPreferences: 'profile/fetchPreferences',
      updatePreferencesAction: 'profile/updatePreferences'
    }),
    
    async loadUserData() {
      try {
        // Load profile
        const userData = await this.fetchUserProfile();
        this.profile = {
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          photo: userData.photo || null
        };
        
        // Load addresses
        await this.fetchAddresses();
        
        // Load favorites
        await this.fetchFavorites();
        
        // Load preferences
        const userPrefs = await this.fetchPreferences();
        if (userPrefs) {
          this.preferences = {
            dietary: userPrefs.dietary || [],
            cuisines: userPrefs.cuisines || [],
            notifications: {
              ...this.preferences.notifications,
              ...userPrefs.notifications
            }
          };
        }
      } catch (error) {
        this.$toast.error('Failed to load user data');
        console.error('Failed to load user data:', error);
      }
    },
    
    async updateProfile() {
      if (!this.$refs.profileForm.validate()) return;
      
      this.updating = true;
      try {
        await this.updateUserProfile(this.profile);
        this.$toast.success('Profile updated successfully');
      } catch (error) {
        this.$toast.error('Failed to update profile');
        console.error('Failed to update profile:', error);
      } finally {
        this.updating = false;
      }
    },
    
    triggerImageUpload() {
      this.$refs.imageInput.click();
    },
    
    async handleImageUpload(event) {
      const file = event.target.files?.[0];
      if (!file) return;
      
      try {
        const imageUrl = await this.uploadProfileImage(file);
        this.profile.photo = imageUrl;
        this.$toast.success('Profile image updated');
      } catch (error) {
        this.$toast.error('Failed to upload image');
        console.error('Failed to upload image:', error);
      }
    },
    
    editAddress(address) {
      this.editingAddress = address;
      this.addressForm = {
        name: address.name,
        street: address.street,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        type: address.type,
        instructions: address.instructions || ''
      };
      this.showAddressDialog = true;
    },
    
    async saveAddress() {
      if (!this.$refs.addressForm.validate()) return;
      
      this.savingAddress = true;
      try {
        if (this.editingAddress) {
          await this.updateAddress({
            id: this.editingAddress.id,
            ...this.addressForm
          });
          this.$toast.success('Address updated successfully');
        } else {
          await this.addAddress(this.addressForm);
          this.$toast.success('Address added successfully');
        }
        
        this.showAddressDialog = false;
        this.editingAddress = null;
        this.addressForm = {
          name: '',
          street: '',
          city: '',
          state: '',
          zipCode: '',
          type: 'home',
          instructions: '',
          setDefault: false
        };
        
        // Refresh addresses
        await this.fetchAddresses();
      } catch (error) {
        this.$toast.error(this.editingAddress ? 'Failed to update address' : 'Failed to add address');
        console.error('Failed to save address:', error);
      } finally {
        this.savingAddress = false;
      }
    },
    
    confirmDeleteAddress(address) {
      this.addressToDelete = address;
      this.showDeleteDialog = true;
    },
    
    async deleteAddress() {
      if (!this.addressToDelete) return;
      
      this.deletingAddress = true;
      try {
        await this.deleteAddressAction(this.addressToDelete.id);
        this.$toast.success('Address deleted successfully');
        this.showDeleteDialog = false;
        
        // Refresh addresses
        await this.fetchAddresses();
      } catch (error) {
        this.$toast.error('Failed to delete address');
        console.error('Failed to delete address:', error);
      } finally {
        this.deletingAddress = false;
        this.addressToDelete = null;
      }
    },
    
    async setDefaultAddress(address) {
      try {
        await this.setDefaultAddressAction(address.id);
        this.$toast.success('Default address updated');
        
        // Refresh addresses
        await this.fetchAddresses();
      } catch (error) {
        this.$toast.error('Failed to set default address');
        console.error('Failed to set default address:', error);
      }
    },
    
    async removeFromFavorites(restaurant) {
      try {
        await this.removeFavorite(restaurant.id);
        this.$toast.success('Restaurant removed from favorites');
        
        // Refresh favorites
        await this.fetchFavorites();
      } catch (error) {
        this.$toast.error('Failed to remove from favorites');
        console.error('Failed to remove from favorites:', error);
      }
    },
    
    async savePreferences() {
      this.savingPreferences = true;
      try {
        await this.updatePreferencesAction(this.preferences);
        this.$toast.success('Preferences saved successfully');
      } catch (error) {
        this.$toast.error('Failed to save preferences');
        console.error('Failed to save preferences:', error);
      } finally {
        this.savingPreferences = false;
      }
    },
    
    getAddressIcon(type) {
      const icons = {
        home: 'mdi-home',
        work: 'mdi-office-building',
        other: 'mdi-map-marker'
      };
      return icons[type] || 'mdi-map-marker';
    },
    
    formatAddress(address) {
      return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
    }
  },
  
  async mounted() {
    await this.loadUserData();
  }
};
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