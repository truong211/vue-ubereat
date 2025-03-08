<template>
  <div class="restaurant-detail">
    <v-container v-if="loading">
      <v-row>
        <v-col cols="12" class="text-center py-12">
          <v-progress-circular
            indeterminate
            color="primary"
            size="64"
          ></v-progress-circular>
          <div class="mt-4">Loading restaurant details...</div>
        </v-col>
      </v-row>
    </v-container>

    <v-container v-else-if="error">
      <v-row>
        <v-col cols="12">
          <v-alert
            type="error"
            title="Error loading restaurant"
            :text="error"
          ></v-alert>
          <div class="text-center mt-4">
            <v-btn color="primary" @click="$router.push('/restaurants')">
              Back to Restaurants
            </v-btn>
          </div>
        </v-col>
      </v-row>
    </v-container>

    <template v-else-if="restaurant">
      <!-- Restaurant Header -->
      <div class="restaurant-header">
        <v-img
          :src="restaurant.image_url || '/images/restaurant-placeholder.jpg'"
          height="300"
          class="restaurant-banner"
          gradient="to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.7)"
        >
          <v-container class="fill-height">
            <v-row align="end">
              <v-col cols="12" class="text-white">
                <h1 class="text-h3 font-weight-bold">{{ restaurant.name }}</h1>
                <div class="d-flex align-center mt-2">
                  <v-rating
                    :model-value="restaurant.rating"
                    color="amber"
                    half-increments
                    readonly
                    size="small"
                  ></v-rating>
                  <span class="ml-2 text-subtitle-1">{{ restaurant.rating.toFixed(1) }} ({{ restaurant.reviewCount || 0 }} reviews)</span>
                </div>
                <div class="mt-2 d-flex align-center">
                  <v-chip
                    v-if="restaurant.status === 'active'"
                    color="success"
                    size="small"
                    class="mr-2"
                  >
                    Open
                  </v-chip>
                  <v-chip
                    v-else
                    color="error"
                    size="small"
                    class="mr-2"
                  >
                    Closed
                  </v-chip>
                  <span class="text-subtitle-1">
                    <v-icon size="small" class="mr-1">mdi-map-marker</v-icon>
                    {{ restaurant.address }}
                  </span>
                </div>
              </v-col>
            </v-row>
          </v-container>
        </v-img>
      </div>

      <v-container>
        <!-- Restaurant Info -->
        <v-row class="mt-4">
          <v-col cols="12" md="8">
            <v-card class="mb-4">
              <v-card-title>About {{ restaurant.name }}</v-card-title>
              <v-card-text>
                <p>{{ restaurant.description || 'No description available.' }}</p>
                <v-divider class="my-4"></v-divider>
                <div class="d-flex align-center mb-2">
                  <v-icon class="mr-2">mdi-phone</v-icon>
                  <span>{{ restaurant.phone || 'No phone number available' }}</span>
                </div>
                <div class="d-flex align-center mb-2">
                  <v-icon class="mr-2">mdi-clock-outline</v-icon>
                  <span>{{ restaurant.hours || 'Hours not specified' }}</span>
                </div>
                <div class="d-flex align-center">
                  <v-icon class="mr-2">mdi-currency-usd</v-icon>
                  <span>{{ restaurant.priceRange || 'Price range not specified' }}</span>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card>
              <v-card-title>Location</v-card-title>
              <v-card-text>
                <div class="map-container">
                  <!-- Map placeholder - would integrate with a real map service -->
                  <v-img
                    src="/images/map-placeholder.jpg"
                    height="200"
                    class="rounded"
                  ></v-img>
                </div>
                <v-btn
                  color="primary"
                  block
                  class="mt-4"
                  prepend-icon="mdi-directions"
                  @click="getDirections"
                >
                  Get Directions
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Menu Categories Tabs -->
        <v-row class="mt-4">
          <v-col cols="12">
            <h2 class="text-h4 mb-4">Menu</h2>
            
            <v-card>
              <v-tabs
                v-model="activeCategory"
                bg-color="primary"
                centered
                show-arrows
              >
                <v-tab
                  v-for="category in categories"
                  :key="category.id"
                  :value="category.id"
                >
                  {{ category.name }}
                </v-tab>
              </v-tabs>

              <v-window v-model="activeCategory">
                <v-window-item
                  v-for="category in categories"
                  :key="category.id"
                  :value="category.id"
                >
                  <v-container>
                    <v-row>
                      <v-col
                        v-for="product in getProductsByCategory(category.id)"
                        :key="product.id"
                        cols="12"
                        sm="6"
                        md="4"
                      >
                        <v-card class="product-card h-100">
                          <div class="d-flex">
                            <div class="flex-grow-1">
                              <v-card-title class="text-subtitle-1 font-weight-bold">
                                {{ product.name }}
                              </v-card-title>
                              <v-card-subtitle>
                                {{ formatPrice(product.price) }}
                              </v-card-subtitle>
                              <v-card-text>
                                <p class="text-caption text-truncate-2">
                                  {{ product.description || 'No description available.' }}
                                </p>
                              </v-card-text>
                              <v-card-actions>
                                <v-btn
                                  color="primary"
                                  variant="text"
                                  @click="showProductDetails(product)"
                                >
                                  Details
                                </v-btn>
                                <v-spacer></v-spacer>
                                <v-btn
                                  color="primary"
                                  @click="addToCart(product)"
                                  :disabled="product.status !== 'available'"
                                >
                                  Add to Cart
                                </v-btn>
                              </v-card-actions>
                            </div>
                            <div class="product-image-container">
                              <v-img
                                :src="product.image_url || '/images/food-placeholder.jpg'"
                                height="120"
                                width="120"
                                class="rounded-lg ma-2"
                                cover
                              ></v-img>
                            </div>
                          </div>
                        </v-card>
                      </v-col>
                    </v-row>
                  </v-container>
                </v-window-item>
              </v-window>
            </v-card>
          </v-col>
        </v-row>

        <!-- Reviews Section -->
        <v-row class="mt-6">
          <v-col cols="12">
            <h2 class="text-h4 mb-4">Customer Reviews</h2>
            
            <v-card v-if="reviews.length === 0" class="text-center pa-4">
              <v-icon size="large" color="grey">mdi-comment-outline</v-icon>
              <p class="mt-2">No reviews yet. Be the first to review!</p>
              <v-btn
                color="primary"
                class="mt-2"
                @click="showReviewDialog = true"
              >
                Write a Review
              </v-btn>
            </v-card>
            
            <template v-else>
              <v-card class="mb-4">
                <v-card-text>
                  <div class="d-flex align-center">
                    <div class="text-center mr-6">
                      <div class="text-h2 font-weight-bold">{{ restaurant.rating.toFixed(1) }}</div>
                      <v-rating
                        :model-value="restaurant.rating"
                        color="amber"
                        half-increments
                        readonly
                      ></v-rating>
                      <div class="text-caption">{{ reviews.length }} reviews</div>
                    </div>
                    <v-divider vertical class="mx-4"></v-divider>
                    <div class="flex-grow-1">
                      <div v-for="i in 5" :key="i" class="d-flex align-center mb-1">
                        <div class="text-caption mr-2">{{ 6 - i }}</div>
                        <v-progress-linear
                          :model-value="getRatingPercentage(6 - i)"
                          color="amber"
                          height="8"
                          rounded
                          class="flex-grow-1"
                        ></v-progress-linear>
                        <div class="text-caption ml-2">{{ getRatingCount(6 - i) }}</div>
                      </div>
                    </div>
                  </div>
                </v-card-text>
                <v-card-actions class="justify-center">
                  <v-btn
                    color="primary"
                    @click="showReviewDialog = true"
                  >
                    Write a Review
                  </v-btn>
                </v-card-actions>
              </v-card>
              
              <!-- Review List -->
              <v-card
                v-for="review in reviews.slice(0, displayedReviewsCount)"
                :key="review.id"
                class="mb-4"
              >
                <v-card-text>
                  <div class="d-flex align-center mb-2">
                    <v-avatar color="primary" class="mr-3">
                      <span class="text-h6 text-white">{{ review.user.full_name.charAt(0) }}</span>
                    </v-avatar>
                    <div>
                      <div class="font-weight-bold">{{ review.user.full_name }}</div>
                      <div class="text-caption">{{ formatDate(review.created_at) }}</div>
                    </div>
                    <v-spacer></v-spacer>
                    <v-rating
                      :model-value="review.rating"
                      color="amber"
                      half-increments
                      readonly
                      size="small"
                    ></v-rating>
                  </div>
                  <p>{{ review.comment }}</p>
                </v-card-text>
              </v-card>
              
              <div class="text-center mt-4" v-if="reviews.length > displayedReviewsCount">
                <v-btn
                  variant="outlined"
                  @click="loadMoreReviews"
                >
                  Load More Reviews
                </v-btn>
              </div>
            </template>
          </v-col>
        </v-row>
      </v-container>

      <!-- Product Detail Dialog -->
      <v-dialog v-model="productDialog" max-width="600">
        <v-card v-if="selectedProduct">
          <v-img
            :src="selectedProduct.image_url || '/images/food-placeholder.jpg'"
            height="250"
            cover
          ></v-img>
          <v-card-title>{{ selectedProduct.name }}</v-card-title>
          <v-card-subtitle>{{ formatPrice(selectedProduct.price) }}</v-card-subtitle>
          <v-card-text>
            <p>{{ selectedProduct.description }}</p>
            <v-divider class="my-4"></v-divider>
            <div v-if="selectedProduct.options && selectedProduct.options.length > 0">
              <h3 class="text-subtitle-1 font-weight-bold mb-2">Options</h3>
              <v-radio-group v-model="selectedOptions.size">
                <v-radio
                  v-for="option in selectedProduct.options"
                  :key="option.id"
                  :label="`${option.name} (+${formatPrice(option.price_adjustment)})`"
                  :value="option.id"
                ></v-radio>
              </v-radio-group>
            </div>
            <div v-if="selectedProduct.extras && selectedProduct.extras.length > 0">
              <h3 class="text-subtitle-1 font-weight-bold mb-2">Extras</h3>
              <v-checkbox
                v-for="extra in selectedProduct.extras"
                :key="extra.id"
                v-model="selectedOptions.extras"
                :label="`${extra.name} (+${formatPrice(extra.price)})`"
                :value="extra.id"
              ></v-checkbox>
            </div>
            <v-textarea
              v-model="selectedOptions.notes"
              label="Special instructions"
              rows="2"
              placeholder="Any special requests?"
              class="mt-4"
            ></v-textarea>
          </v-card-text>
          <v-card-actions>
            <v-row>
              <v-col cols="4">
                <v-text-field
                  v-model="selectedOptions.quantity"
                  type="number"
                  min="1"
                  max="99"
                  label="Quantity"
                  hide-details
                  density="compact"
                ></v-text-field>
              </v-col>
              <v-col cols="8" class="d-flex justify-end">
                <v-btn
                  color="grey"
                  variant="text"
                  @click="productDialog = false"
                >
                  Cancel
                </v-btn>
                <v-btn
                  color="primary"
                  @click="addToCartWithOptions"
                  :disabled="selectedProduct.status !== 'available'"
                >
                  Add to Cart - {{ formatPrice(calculateTotalPrice()) }}
                </v-btn>
              </v-col>
            </v-row>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Review Dialog -->
      <v-dialog v-model="showReviewDialog" max-width="600">
        <v-card>
          <v-card-title>Write a Review</v-card-title>
          <v-card-text>
            <div class="text-center mb-4">
              <v-rating
                v-model="newReview.rating"
                color="amber"
                hover
                size="large"
              ></v-rating>
            </div>
            <v-textarea
              v-model="newReview.comment"
              label="Your review"
              rows="4"
              placeholder="Share your experience with this restaurant"
              counter
              maxlength="500"
            ></v-textarea>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="grey"
              variant="text"
              @click="showReviewDialog = false"
            >
              Cancel
            </v-btn>
            <v-btn
              color="primary"
              @click="submitReview"
              :disabled="!newReview.rating || !newReview.comment"
              :loading="submittingReview"
            >
              Submit Review
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </template>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';

export default {
  name: 'RestaurantDetail',
  
  props: {
    restaurantId: {
      type: [Number, String],
      required: true
    }
  },
  
  data() {
    return {
      loading: true,
      error: null,
      activeCategory: null,
      productDialog: false,
      selectedProduct: null,
      selectedOptions: {
        quantity: 1,
        size: null,
        extras: [],
        notes: ''
      },
      showReviewDialog: false,
      submittingReview: false,
      newReview: {
        rating: 0,
        comment: ''
      },
      displayedReviewsCount: 3
    };
  },
  
  computed: {
    ...mapState({
      restaurant: state => state.restaurant.currentRestaurant,
      categories: state => state.restaurant.categories,
      products: state => state.restaurant.products,
      reviews: state => state.reviews.restaurantReviews
    })
  },
  
  methods: {
    ...mapActions({
      fetchRestaurant: 'restaurant/fetchRestaurantById',
      fetchCategories: 'restaurant/fetchCategories',
      fetchProducts: 'restaurant/fetchProducts',
      fetchReviews: 'reviews/fetchRestaurantReviews',
      addItemToCart: 'cart/addItem',
      submitNewReview: 'reviews/submitReview'
    }),
    
    getProductsByCategory(categoryId) {
      return this.products.filter(product => product.category_id === categoryId);
    },
    
    formatPrice(price) {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(price);
    },
    
    formatDate(dateString) {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    },
    
    showProductDetails(product) {
      this.selectedProduct = product;
      this.selectedOptions = {
        quantity: 1,
        size: product.options && product.options.length > 0 ? product.options[0].id : null,
        extras: [],
        notes: ''
      };
      this.productDialog = true;
    },
    
    addToCart(product) {
      this.addItemToCart({
        product,
        quantity: 1,
        options: [],
        notes: ''
      });
      
      this.$toast.success(`Added ${product.name} to cart`);
    },
    
    addToCartWithOptions() {
      const options = [];
      
      // Add selected size option
      if (this.selectedOptions.size) {
        const sizeOption = this.selectedProduct.options.find(
          option => option.id === this.selectedOptions.size
        );
        if (sizeOption) {
          options.push(sizeOption);
        }
      }
      
      // Add selected extras
      if (this.selectedOptions.extras.length > 0) {
        this.selectedOptions.extras.forEach(extraId => {
          const extra = this.selectedProduct.extras.find(
            extra => extra.id === extraId
          );
          if (extra) {
            options.push(extra);
          }
        });
      }
      
      this.addItemToCart({
        product: this.selectedProduct,
        quantity: parseInt(this.selectedOptions.quantity) || 1,
        options,
        notes: this.selectedOptions.notes
      });
      
      this.productDialog = false;
      this.$toast.success(`Added ${this.selectedProduct.name} to cart`);
    },
    
    calculateTotalPrice() {
      if (!this.selectedProduct) return 0;
      
      let total = this.selectedProduct.price;
      
      // Add size option price adjustment
      if (this.selectedOptions.size) {
        const sizeOption = this.selectedProduct.options.find(
          option => option.id === this.selectedOptions.size
        );
        if (sizeOption) {
          total += sizeOption.price_adjustment;
        }
      }
      
      // Add extras prices
      if (this.selectedOptions.extras.length > 0) {
        this.selectedOptions.extras.forEach(extraId => {
          const extra = this.selectedProduct.extras.find(
            extra => extra.id === extraId
          );
          if (extra) {
            total += extra.price;
          }
        });
      }
      
      // Multiply by quantity
      total *= parseInt(this.selectedOptions.quantity) || 1;
      
      return total;
    },
    
    getRatingCount(rating) {
      return this.reviews.filter(review => Math.floor(review.rating) === rating).length;
    },
    
    getRatingPercentage(rating) {
      if (this.reviews.length === 0) return 0;
      return (this.getRatingCount(rating) / this.reviews.length) * 100;
    },
    
    loadMoreReviews() {
      this.displayedReviewsCount += 5;
    },
    
    async submitReview() {
      if (!this.newReview.rating || !this.newReview.comment) return;
      
      this.submittingReview = true;
      
      try {
        await this.submitNewReview({
          restaurantId: this.restaurantId,
          rating: this.newReview.rating,
          comment: this.newReview.comment
        });
        
        this.showReviewDialog = false;
        this.newReview = { rating: 0, comment: '' };
        this.$toast.success('Review submitted successfully');
        
        // Refresh reviews
        await this.fetchReviews(this.restaurantId);
      } catch (error) {
        this.$toast.error('Failed to submit review. Please try again.');
        console.error('Error submitting review:', error);
      } finally {
        this.submittingReview = false;
      }
    },
    
    getDirections() {
      // This would typically open a map with directions
      window.open(`https://maps.google.com/?q=${encodeURIComponent(this.restaurant.address)}`, '_blank');
    }
  },
  
  async mounted() {
    this.loading = true;
    this.error = null;
    
    try {
      // Fetch restaurant details
      await this.fetchRestaurant(this.restaurantId);
      
      // Fetch categories and products
      await this.fetchCategories(this.restaurantId);
      await this.fetchProducts(this.restaurantId);
      
      // Fetch reviews
      await this.fetchReviews(this.restaurantId);
      
      // Set active category to first category if available
      if (this.categories.length > 0) {
        this.activeCategory = this.categories[0].id;
      }
    } catch (error) {
      console.error('Error loading restaurant details:', error);
      this.error = 'Failed to load restaurant details. Please try again later.';
    } finally {
      this.loading = false;
    }
  }
};
</script>

<style scoped>
.restaurant-banner {
  position: relative;
}

.product-card {
  transition: transform 0.2s, box-shadow 0.2s;
  overflow: hidden;
}

.product-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1) !important;
}

.product-image-container {
  display: flex;
  align-items: center;
}

.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.map-container {
  border-radius: 8px;
  overflow: hidden;
}
</style>
