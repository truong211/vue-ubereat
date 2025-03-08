<template>
  <div class="review-form-examples">
    <h2 class="text-h5 mb-4">Review Form Component Examples</h2>
    
    <!-- Example 1: Order Review -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Order Review</h3>
      <v-card>
        <v-card-text>
          <div class="mb-4">
            <div class="d-flex align-center mb-3">
              <v-avatar image="/images/restaurants/pizza-hut.jpg" size="64" class="mr-4"></v-avatar>
              <div>
                <div class="text-h6">Pizza Hut</div>
                <div class="text-subtitle-2">Order #876543</div>
              </div>
            </div>
            <v-divider></v-divider>
          </div>
          
          <review-form
            :restaurant-id="2"
            :order-id="876543"
            title="Rate your order from Pizza Hut"
            @submit="handleOrderReviewSubmit"
          />
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ orderReviewExample }}</pre>
        </v-card-text>
      </v-card>
    </section>
    
    <!-- Example 2: Restaurant Review -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Restaurant Review</h3>
      <v-card>
        <v-card-text>
          <review-form
            :restaurant-id="3"
            :show-delivery-rating="false"
            title="Write a review for Sushi Palace"
            comment-label="Your experience"
            comment-placeholder="Tell others what you think about this restaurant..."
            :comment-required="true"
            :comment-min-length="10"
            @submit="handleRestaurantReviewSubmit"
          />
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ restaurantReviewExample }}</pre>
        </v-card-text>
      </v-card>
    </section>
    
    <!-- Example 3: Product Review -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Product Review</h3>
      <v-card>
        <v-card-text>
          <div class="mb-4">
            <div class="d-flex align-center mb-3">
              <v-img src="/images/products/burger.jpg" width="100" height="100" class="rounded mr-4"></v-img>
              <div>
                <div class="text-h6">Classic Cheeseburger</div>
                <div class="text-subtitle-2">Burger Palace</div>
              </div>
            </div>
            <v-divider></v-divider>
          </div>
          
          <review-form
            :restaurant-id="1"
            :product-id="101"
            :show-restaurant-rating="false"
            :show-delivery-rating="false"
            food-rating-label="How was this burger?"
            title="Rate this dish"
            submit-button-text="Submit Product Review"
            @submit="handleProductReviewSubmit"
          />
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ productReviewExample }}</pre>
        </v-card-text>
      </v-card>
    </section>
    
    <!-- Example 4: Simple Driver Review -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Driver Review</h3>
      <v-card>
        <v-card-text>
          <div class="mb-4 text-center">
            <v-avatar size="80" class="mb-2">
              <v-img src="/images/drivers/driver.jpg" alt="Driver"></v-img>
            </v-avatar>
            <div class="text-h6">John Smith</div>
            <div class="text-subtitle-2 text-medium-emphasis">Your Delivery Driver</div>
          </div>
          
          <review-form
            :order-id="123456"
            :show-restaurant-rating="false"
            :show-food-rating="false"
            :show-tips="false"
            :allow-photos="false"
            :full-width-button="true"
            delivery-rating-label="How was your delivery experience?"
            comment-label="Additional comments (optional)"
            title=""
            @submit="handleDriverReviewSubmit"
          >
            <template v-slot:additional-fields="{ review }">
              <div class="mb-4">
                <div class="text-subtitle-2 mb-2">Driver was:</div>
                <div class="d-flex flex-wrap">
                  <v-chip-group v-model="driverTraits" multiple>
                    <v-chip filter value="punctual" label>Punctual</v-chip>
                    <v-chip filter value="friendly" label>Friendly</v-chip>
                    <v-chip filter value="professional" label>Professional</v-chip>
                    <v-chip filter value="careful" label>Careful</v-chip>
                  </v-chip-group>
                </div>
              </div>
            </template>
          </review-form>
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ driverReviewExample }}</pre>
        </v-card-text>
      </v-card>
    </section>
    
    <!-- Example 5: With Initial Data -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Edit Existing Review</h3>
      <v-card>
        <v-card-text>
          <review-form
            :initial-data="existingReview"
            :restaurant-id="2"
            :order-id="876543"
            title="Edit your review"
            submit-button-text="Update Review"
            @submit="handleEditReviewSubmit"
          >
            <template v-slot:actions>
              <div>
                <v-btn
                  variant="outlined"
                  class="mr-2"
                  @click="resetExample"
                >
                  Cancel
                </v-btn>
                <v-btn
                  color="primary"
                  type="submit"
                >
                  Update Review
                </v-btn>
              </div>
            </template>
          </review-form>
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ editReviewExample }}</pre>
        </v-card-text>
      </v-card>
    </section>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import ReviewForm from '@/components/review/ReviewForm.vue'

export default {
  name: 'ReviewFormExample',
  
  components: {
    ReviewForm
  },
  
  setup() {
    const driverTraits = ref(['punctual', 'friendly']);
    
    // Example of an existing review for editing
    const existingReview = ref({
      restaurantRating: 4,
      foodRating: 4.5,
      deliveryRating: 3.5,
      comment: 'The pizza was delicious and arrived on time. Would order again!',
      photos: [
        '/images/reviews/pizza-review-1.jpg',
        '/images/reviews/pizza-review-2.jpg'
      ]
    });
    
    // Example handlers
    const handleOrderReviewSubmit = (review) => {
      console.log('Order Review Submitted:', review);
      alert('Your order review has been submitted. Thank you for your feedback!');
    };
    
    const handleRestaurantReviewSubmit = (review) => {
      console.log('Restaurant Review Submitted:', review);
      alert('Your restaurant review has been submitted. Thank you for your feedback!');
    };
    
    const handleProductReviewSubmit = (review) => {
      console.log('Product Review Submitted:', review);
      alert('Your product review has been submitted. Thank you for your feedback!');
    };
    
    const handleDriverReviewSubmit = (review) => {
      // Include selected traits
      const reviewWithTraits = {
        ...review,
        driverTraits: driverTraits.value
      };
      
      console.log('Driver Review Submitted:', reviewWithTraits);
      alert('Your driver review has been submitted. Thank you for your feedback!');
    };
    
    const handleEditReviewSubmit = (review) => {
      console.log('Review Updated:', review);
      alert('Your review has been updated!');
    };
    
    // For demo purposes - reset example
    const resetExample = () => {
      alert('Edit cancelled');
    };
    
    // Code examples
    const orderReviewExample = computed(() => {
      return `<review-form
  :restaurant-id="2"
  :order-id="876543"
  title="Rate your order from Pizza Hut"
  @submit="handleOrderReviewSubmit"
/>`;
    });
    
    const restaurantReviewExample = computed(() => {
      return `<review-form
  :restaurant-id="3"
  :show-delivery-rating="false"
  title="Write a review for Sushi Palace"
  comment-label="Your experience"
  comment-placeholder="Tell others what you think about this restaurant..."
  :comment-required="true"
  :comment-min-length="10"
  @submit="handleRestaurantReviewSubmit"
/>`;
    });
    
    const productReviewExample = computed(() => {
      return `<review-form
  :restaurant-id="1"
  :product-id="101"
  :show-restaurant-rating="false"
  :show-delivery-rating="false"
  food-rating-label="How was this burger?"
  title="Rate this dish"
  submit-button-text="Submit Product Review"
  @submit="handleProductReviewSubmit"
/>`;
    });
    
    const driverReviewExample = computed(() => {
      return `<review-form
  :order-id="123456"
  :show-restaurant-rating="false"
  :show-food-rating="false"
  :show-tips="false"
  :allow-photos="false"
  :full-width-button="true"
  delivery-rating-label="How was your delivery experience?"
  comment-label="Additional comments (optional)"
  title=""
  @submit="handleDriverReviewSubmit"
>
  <template v-slot:additional-fields="{ review }">
    <div class="mb-4">
      <div class="text-subtitle-2 mb-2">Driver was:</div>
      <div class="d-flex flex-wrap">
        <v-chip-group v-model="driverTraits" multiple>
          <v-chip filter value="punctual">Punctual</v-chip>
          <v-chip filter value="friendly">Friendly</v-chip>
          <v-chip filter value="professional">Professional</v-chip>
          <v-chip filter value="careful">Careful</v-chip>
        </v-chip-group>
      </div>
    </div>
  </template>
</review-form>`;
    });
    
    const editReviewExample = computed(() => {
      return `<review-form
  :initial-data="existingReview"
  :restaurant-id="2"
  :order-id="876543"
  title="Edit your review"
  submit-button-text="Update Review"
  @submit="handleEditReviewSubmit"
>
  <template v-slot:actions>
    <div>
      <v-btn variant="outlined" class="mr-2" @click="cancel">
        Cancel
      </v-btn>
      <v-btn color="primary" type="submit">
        Update Review
      </v-btn>
    </div>
  </template>
</review-form>`;
    });
    
    return {
      driverTraits,
      existingReview,
      handleOrderReviewSubmit,
      handleRestaurantReviewSubmit,
      handleProductReviewSubmit,
      handleDriverReviewSubmit,
      handleEditReviewSubmit,
      resetExample,
      orderReviewExample,
      restaurantReviewExample,
      productReviewExample,
      driverReviewExample,
      editReviewExample
    };
  }
};
</script>

<style scoped>
.review-form-examples {
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