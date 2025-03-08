<template>
  <div class="user-profile-examples">
    <h2 class="text-h5 mb-4">User Profile Examples</h2>

    <!-- Example 1: Basic Profile -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Basic Profile</h3>
      <v-card>
        <v-card-text>
          <user-profile
            :initial-tab="'profile'"
            @profile-updated="handleProfileUpdate"
          />
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ basicExample }}</pre>
        </v-card-text>
      </v-card>
    </section>

    <!-- Example 2: Address Management Integration -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Address Selection with Profile</h3>
      <v-card>
        <v-card-text>
          <v-row>
            <!-- Order Summary -->
            <v-col cols="12" md="4">
              <v-card variant="outlined">
                <v-card-title>Order Summary</v-card-title>
                <v-card-text>
                  <div class="d-flex justify-space-between mb-2">
                    <span>Subtotal</span>
                    <span>${{ orderTotal.toFixed(2) }}</span>
                  </div>
                  <div class="d-flex justify-space-between mb-2">
                    <span>Delivery Fee</span>
                    <span>${{ deliveryFee.toFixed(2) }}</span>
                  </div>
                  <v-divider class="my-2"></v-divider>
                  <div class="d-flex justify-space-between font-weight-bold">
                    <span>Total</span>
                    <span>${{ (orderTotal + deliveryFee).toFixed(2) }}</span>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Address Selection -->
            <v-col cols="12" md="8">
              <user-profile
                :initial-tab="'addresses'"
                :hide-tabs="true"
                @address-selected="handleAddressSelect"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ addressExample }}</pre>
        </v-card-text>
      </v-card>
    </section>

    <!-- Example 3: Restaurant Recommendations -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Personalized Recommendations</h3>
      <v-card>
        <v-card-text>
          <v-row>
            <!-- Preferences -->
            <v-col cols="12" md="4">
              <user-profile
                :initial-tab="'preferences'"
                :hide-tabs="true"
                @preferences-updated="handlePreferencesUpdate"
              />
            </v-col>

            <!-- Recommendations -->
            <v-col cols="12" md="8">
              <div v-if="recommendations.length > 0">
                <h3 class="text-h6 mb-4">Recommended for You</h3>
                <v-row>
                  <v-col
                    v-for="restaurant in recommendations"
                    :key="restaurant.id"
                    cols="12"
                    sm="6"
                  >
                    <v-card variant="outlined">
                      <v-img
                        :src="restaurant.image"
                        height="150"
                        cover
                      ></v-img>
                      <v-card-title>{{ restaurant.name }}</v-card-title>
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
                            ({{ restaurant.reviewCount }})
                          </span>
                        </div>
                      </v-card-text>
                      <v-card-actions>
                        <v-btn
                          variant="text"
                          color="primary"
                          :to="{ name: 'RestaurantDetail', params: { id: restaurant.id }}"
                        >
                          View Menu
                        </v-btn>
                      </v-card-actions>
                    </v-card>
                  </v-col>
                </v-row>
              </div>
              <div v-else class="text-center py-8">
                <v-icon size="64" color="grey-lighten-1">mdi-food</v-icon>
                <div class="text-h6 mt-4">Set your preferences</div>
                <div class="text-body-1 text-medium-emphasis">
                  We'll show you restaurants that match your taste
                </div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ recommendationsExample }}</pre>
        </v-card-text>
      </v-card>
    </section>
  </div>
</template>

<script>
import { ref } from 'vue'
import UserProfile from '@/components/profile/UserProfile.vue'

export default {
  name: 'UserProfileExample',
  
  components: {
    UserProfile
  },
  
  setup() {
    // Mock data
    const orderTotal = ref(45.99)
    const deliveryFee = ref(4.99)
    const recommendations = ref([
      {
        id: 1,
        name: 'Pizza Palace',
        image: '/images/restaurants/pizza.jpg',
        cuisines: ['Italian', 'Pizza'],
        rating: 4.5,
        reviewCount: 234
      },
      {
        id: 2,
        name: 'Sushi Bar',
        image: '/images/restaurants/sushi.jpg',
        cuisines: ['Japanese', 'Sushi'],
        rating: 4.8,
        reviewCount: 186
      }
    ])
    
    // Event handlers
    const handleProfileUpdate = (profile) => {
      console.log('Profile updated:', profile)
    }
    
    const handleAddressSelect = (address) => {
      console.log('Address selected:', address)
    }
    
    const handlePreferencesUpdate = (preferences) => {
      console.log('Preferences updated:', preferences)
      // In a real app, this would trigger a recommendation update
    }
    
    // Code examples
    const basicExample = `<user-profile
  :initial-tab="'profile'"
  @profile-updated="handleProfileUpdate"
/>`

    const addressExample = `<v-row>
  <!-- Order Summary -->
  <v-col cols="12" md="4">
    <!-- Order details -->
  </v-col>

  <!-- Address Selection -->
  <v-col cols="12" md="8">
    <user-profile
      :initial-tab="'addresses'"
      :hide-tabs="true"
      @address-selected="handleAddressSelect"
    />
  </v-col>
</v-row>`

    const recommendationsExample = `<v-row>
  <!-- Preferences -->
  <v-col cols="12" md="4">
    <user-profile
      :initial-tab="'preferences'"
      :hide-tabs="true"
      @preferences-updated="handlePreferencesUpdate"
    />
  </v-col>

  <!-- Recommendations -->
  <v-col cols="12" md="8">
    <!-- Restaurant recommendations based on preferences -->
  </v-col>
</v-row>`

    return {
      orderTotal,
      deliveryFee,
      recommendations,
      handleProfileUpdate,
      handleAddressSelect,
      handlePreferencesUpdate,
      basicExample,
      addressExample,
      recommendationsExample
    }
  }
}
</script>

<style scoped>
.user-profile-examples {
  padding: 16px;
}

.code-example {
  font-family: monospace;
  white-space: pre-wrap;
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
  overflow-x: auto;
}
</style>