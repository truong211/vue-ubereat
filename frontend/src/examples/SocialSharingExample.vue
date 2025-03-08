<template>
  <div class="social-sharing-examples">
    <h2 class="text-h5 mb-4">Social Sharing Examples</h2>

    <!-- Example 1: Basic Sharing -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Basic Sharing</h3>
      <v-card>
        <v-card-text>
          <social-sharing
            title="Check out this restaurant!"
            description="Amazing food and great service"
            :url="sampleUrl"
          />
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ basicExample }}</pre>
        </v-card-text>
      </v-card>
    </section>

    <!-- Example 2: Restaurant Sharing -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Restaurant Sharing</h3>
      <v-card>
        <v-img
          :src="restaurant.image"
          height="200"
          cover
        ></v-img>
        
        <v-card-title>{{ restaurant.name }}</v-card-title>
        
        <v-card-text>
          <p>{{ restaurant.description }}</p>
          <div class="d-flex align-center mt-4">
            <v-rating
              :model-value="restaurant.rating"
              color="amber"
              density="compact"
              readonly
            ></v-rating>
            <span class="text-subtitle-2 ml-2">
              {{ restaurant.rating }} ({{ restaurant.reviewCount }} reviews)
            </span>
            <v-spacer></v-spacer>
            <social-sharing
              :title="getRestaurantShareTitle(restaurant)"
              :description="restaurant.description"
              :url="getRestaurantUrl(restaurant)"
              :image="restaurant.image"
              color="primary"
              variant="outlined"
            />
          </div>
        </v-card-text>

        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ restaurantExample }}</pre>
        </v-card-text>
      </v-card>
    </section>

    <!-- Example 3: Order Sharing -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Order Sharing</h3>
      <v-card>
        <v-card-title>Order #12345</v-card-title>
        <v-card-text>
          <v-list>
            <v-list-item>
              <template v-slot:prepend>
                <v-avatar :image="restaurant.image" size="48"></v-avatar>
              </template>
              <v-list-item-title>{{ restaurant.name }}</v-list-item-title>
              <v-list-item-subtitle>
                2 items • $24.99
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>

          <div class="d-flex justify-end mt-4">
            <social-sharing
              title="My delicious order!"
              :description="getOrderShareDescription()"
              :url="getOrderUrl('12345')"
              label="Share Order"
              color="success"
            />
          </div>
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ orderExample }}</pre>
        </v-card-text>
      </v-card>
    </section>

    <!-- Example 4: Custom Sharing -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Custom Sharing</h3>
      <v-card>
        <v-card-text>
          <v-row>
            <!-- WhatsApp Only -->
            <v-col cols="12" sm="6">
              <social-sharing
                title="Check this out!"
                :url="sampleUrl"
                label="Share on WhatsApp"
                :enabled-platforms="['whatsapp']"
                color="success"
              />
            </v-col>

            <!-- Email and Copy -->
            <v-col cols="12" sm="6">
              <social-sharing
                title="Interesting restaurant"
                :url="sampleUrl"
                label="Share via Email"
                :enabled-platforms="['email', 'copy']"
                color="info"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ customExample }}</pre>
        </v-card-text>
      </v-card>
    </section>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import SocialSharing from '@/components/social/SocialSharing.vue'

export default {
  name: 'SocialSharingExample',

  components: {
    SocialSharing
  },

  setup() {
    const sampleUrl = 'https://example.com/restaurant/123'
    
    // Sample restaurant data
    const restaurant = ref({
      id: '123',
      name: 'Pizza Paradise',
      description: 'The best pizza in town with authentic Italian recipes and fresh ingredients.',
      image: '/images/sample/restaurant.jpg',
      rating: 4.5,
      reviewCount: 128
    })

    // Methods
    const getRestaurantUrl = (restaurant) => {
      return `https://example.com/restaurant/${restaurant.id}`
    }

    const getRestaurantShareTitle = (restaurant) => {
      return `Check out ${restaurant.name} on Food Delivery!`
    }

    const getOrderShareDescription = () => {
      return `Just ordered some delicious food from ${restaurant.value.name}! 😋`
    }

    const getOrderUrl = (orderId) => {
      return `https://example.com/order/${orderId}`
    }

    // Code examples
    const basicExample = computed(() => `<social-sharing
  title="Check out this restaurant!"
  description="Amazing food and great service"
  :url="restaurantUrl"
/>`)

    const restaurantExample = computed(() => `<social-sharing
  :title="getRestaurantShareTitle(restaurant)"
  :description="restaurant.description"
  :url="getRestaurantUrl(restaurant)"
  :image="restaurant.image"
  color="primary"
  variant="outlined"
/>`)

    const orderExample = computed(() => `<social-sharing
  title="My delicious order!"
  :description="getOrderShareDescription()"
  :url="getOrderUrl(orderId)"
  label="Share Order"
  color="success"
/>`)

    const customExample = computed(() => `<!-- WhatsApp Only -->
<social-sharing
  title="Check this out!"
  :url="url"
  label="Share on WhatsApp"
  :enabled-platforms="['whatsapp']"
  color="success"
/>

<!-- Email and Copy -->
<social-sharing
  title="Interesting restaurant"
  :url="url"
  label="Share via Email"
  :enabled-platforms="['email', 'copy']"
  color="info"
/>`)

    return {
      sampleUrl,
      restaurant,
      getRestaurantUrl,
      getRestaurantShareTitle,
      getOrderShareDescription,
      getOrderUrl,
      basicExample,
      restaurantExample,
      orderExample,
      customExample
    }
  }
}
</script>

<style scoped>
.social-sharing-examples {
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