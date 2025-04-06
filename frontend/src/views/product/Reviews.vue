<template>
  <div class="product-reviews-page">
    <v-container>
      <!-- Breadcrumbs -->
      <v-breadcrumbs :items="breadcrumbs" class="pa-0 mb-4"></v-breadcrumbs>

      <div v-if="loading" class="d-flex justify-center my-8">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      </div>

      <template v-else>
        <div class="d-flex align-center mb-4">
          <h1 class="text-h4 font-weight-bold">Reviews for {{ product ? product.name : 'Product' }}</h1>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="openReviewDialog" v-if="canReview">
            <v-icon class="mr-2">mdi-star</v-icon>
            Write a Review
          </v-btn>
        </div>

        <v-row>
          <v-col cols="12" md="3">
            <v-card class="pa-4 mb-4">
              <div class="text-center mb-3">
                <div class="text-h3 font-weight-bold primary--text">
                  {{ averageRating.toFixed(1) }}
                </div>
                <v-rating
                  :model-value="averageRating"
                  color="amber"
                  half-increments
                  readonly
                  size="small"
                ></v-rating>
                <div class="text-subtitle-1 mt-1">
                  {{ reviewsCount }} {{ reviewsCount === 1 ? 'review' : 'reviews' }}
                </div>
              </div>

              <v-divider class="mb-3"></v-divider>

              <div class="rating-breakdown">
                <div v-for="i in 5" :key="i" class="rating-row d-flex align-center mb-2">
                  <div class="text-subtitle-2 mr-2">{{ 6 - i }}</div>
                  <v-progress-linear
                    :model-value="getRatingPercentage(6 - i)"
                    color="amber-darken-3"
                    height="8"
                    rounded
                    class="flex-grow-1 mx-2"
                  ></v-progress-linear>
                  <div class="text-caption">{{ getRatingCount(6 - i) }}</div>
                </div>
              </div>
            </v-card>

            <v-card class="pa-4 filter-card">
              <h3 class="text-h6 font-weight-bold mb-3">Filter Reviews</h3>
              
              <div class="mb-4">
                <h4 class="text-subtitle-1 font-weight-medium mb-2">Rating</h4>
                <div class="d-flex flex-wrap">
                  <v-chip
                    v-for="i in 5"
                    :key="`filter-${i}`"
                    :color="selectedRating === i ? 'amber-darken-2' : undefined"
                    :variant="selectedRating === i ? 'flat' : 'outlined'"
                    class="mr-2 mb-2"
                    @click="toggleRatingFilter(i)"
                  >
                    {{ i }} <v-icon size="small" class="ml-1">mdi-star</v-icon>
                  </v-chip>
                  <v-chip
                    :color="selectedRating === 0 ? 'primary' : undefined"
                    :variant="selectedRating === 0 ? 'flat' : 'outlined'"
                    class="mr-2 mb-2"
                    @click="toggleRatingFilter(0)"
                  >
                    All
                  </v-chip>
                </div>
              </div>
              
              <div class="mb-4">
                <h4 class="text-subtitle-1 font-weight-medium mb-2">Sort By</h4>
                <v-select
                  v-model="sortBy"
                  :items="sortOptions"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                ></v-select>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" md="9">
            <v-card v-if="filteredReviews.length === 0" class="pa-6 text-center">
              <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-star-outline</v-icon>
              <h3 class="text-h5 font-weight-medium mb-2">No Reviews Found</h3>
              <p class="text-body-1 text-medium-emphasis">
                {{ selectedRating > 0 ? 'No reviews match your filter criteria.' : 'Be the first to review this product!' }}
              </p>
              <v-btn v-if="selectedRating > 0" color="primary" class="mt-4" @click="selectedRating = 0">
                Clear Filters
              </v-btn>
              <v-btn v-else-if="canReview" color="primary" class="mt-4" @click="openReviewDialog">
                Write a Review
              </v-btn>
            </v-card>

            <div v-else class="reviews-list">
              <v-card
                v-for="review in displayedReviews"
                :key="review.id"
                class="mb-4 pa-4"
              >
                <div class="d-flex align-center mb-2">
                  <v-avatar size="40" class="mr-3">
                    <v-img
                      :src="review.user.profileImage || '/img/avatar-placeholder.jpg'"
                      alt="User avatar"
                    ></v-img>
                  </v-avatar>
                  <div>
                    <div class="font-weight-bold">{{ review.user.fullName }}</div>
                    <div class="text-caption text-medium-emphasis">
                      {{ formatDate(review.createdAt) }}
                    </div>
                  </div>
                  <v-spacer></v-spacer>
                  <v-rating
                    :model-value="review.rating"
                    color="amber"
                    density="compact"
                    size="small"
                    readonly
                  ></v-rating>
                </div>

                <p class="text-body-1 mb-3">{{ review.content }}</p>

                <div v-if="review.images && review.images.length > 0" class="review-images mb-3">
                  <v-row>
                    <v-col
                      v-for="(image, imgIndex) in review.images"
                      :key="imgIndex"
                      cols="auto"
                    >
                      <v-img
                        :src="image"
                        width="80"
                        height="80"
                        cover
                        class="rounded"
                        @click="openImagePreview(image)"
                      ></v-img>
                    </v-col>
                  </v-row>
                </div>

                <div class="d-flex align-center review-actions">
                  <v-btn
                    variant="text"
                    size="small"
                    :color="review.isHelpful ? 'success' : undefined"
                    @click="markReviewHelpful(review)"
                  >
                    <v-icon size="small" class="mr-1">
                      {{ review.isHelpful ? 'mdi-thumb-up' : 'mdi-thumb-up-outline' }}
                    </v-icon>
                    Helpful ({{ review.helpfulCount || 0 }})
                  </v-btn>

                  <v-btn
                    v-if="review.userId === currentUserId"
                    variant="text"
                    size="small"
                    color="error"
                    class="ml-auto"
                    @click="deleteReview(review.id)"
                  >
                    <v-icon size="small" class="mr-1">mdi-delete</v-icon>
                    Delete
                  </v-btn>
                </div>
              </v-card>

              <div class="d-flex justify-center mt-6" v-if="totalPages > 1">
                <v-pagination
                  v-model="currentPage"
                  :length="totalPages"
                  :total-visible="5"
                  rounded
                ></v-pagination>
              </div>
            </div>
          </v-col>
        </v-row>
      </template>

      <!-- Review Dialog -->
      <v-dialog v-model="reviewDialog" max-width="600">
        <v-card>
          <v-card-title class="text-h5 font-weight-bold">
            Write a Review
          </v-card-title>
          
          <v-card-text>
            <v-form ref="reviewForm" @submit.prevent="submitReview">
              <div class="mb-4 text-center">
                <p class="text-subtitle-1 mb-2">How would you rate this product?</p>
                <v-rating
                  v-model="newReview.rating"
                  color="amber"
                  hover
                  half-increments
                  size="large"
                  class="mb-2"
                ></v-rating>
              </div>

              <v-textarea
                v-model="newReview.content"
                label="Share your experience with this product"
                variant="outlined"
                counter="500"
                :rules="[
                  v => !!v || 'Review text is required',
                  v => v.length <= 500 || 'Maximum 500 characters'
                ]"
                rows="4"
                class="mb-4"
              ></v-textarea>

              <v-file-input
                v-model="newReview.images"
                label="Add Photos (optional)"
                variant="outlined"
                accept="image/*"
                multiple
                prepend-icon="mdi-camera"
                :rules="[
                  files => !files || !files.length || files.length <= 5 || 'Maximum 5 images'
                ]"
              ></v-file-input>
            </v-form>
          </v-card-text>
          
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="grey-darken-1" variant="text" @click="reviewDialog = false">
              Cancel
            </v-btn>
            <v-btn 
              color="primary" 
              variant="flat"
              :loading="isSubmittingReview"
              @click="submitReview"
            >
              Submit Review
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Image Preview Dialog -->
      <v-dialog v-model="imagePreviewDialog" max-width="800">
        <v-card>
          <v-img
            :src="previewImage"
            max-height="80vh"
            contain
          ></v-img>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn icon="mdi-close" @click="imagePreviewDialog = false"></v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { format } from 'date-fns';
import productService from '@/services/product.service';

export default {
  name: 'ProductReviews',
  props: {
    productId: {
      type: [String, Number],
      required: true
    }
  },
  data() {
    return {
      loading: true,
      product: null,
      reviews: [],
      totalReviews: 0,
      totalPages: 1,
      currentPage: 1,
      perPage: 10,
      selectedRating: 0,
      sortBy: 'newest',
      sortOptions: [
        { title: 'Newest First', value: 'newest' },
        { title: 'Oldest First', value: 'oldest' },
        { title: 'Highest Rating', value: 'highest' },
        { title: 'Lowest Rating', value: 'lowest' },
        { title: 'Most Helpful', value: 'helpful' }
      ],
      reviewDialog: false,
      newReview: {
        rating: 5,
        content: '',
        images: []
      },
      isSubmittingReview: false,
      imagePreviewDialog: false,
      previewImage: '',
      ratingCounts: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      }
    };
  },
  computed: {
    ...mapGetters({
      currentUserId: 'auth/getUserId',
      isAuthenticated: 'auth/isAuthenticated'
    }),
    breadcrumbs() {
      const items = [
        {
          title: 'Home',
          disabled: false,
          to: '/'
        },
        {
          title: 'Products',
          disabled: false,
          to: '/products'
        }
      ];
      
      if (this.product) {
        items.push({
          title: this.product.name,
          disabled: false,
          to: `/products/${this.productId}`
        });
      }
      
      items.push({
        title: 'Reviews',
        disabled: true
      });
      
      return items;
    },
    reviewsCount() {
      return this.totalReviews;
    },
    averageRating() {
      if (this.reviewsCount === 0) return 0;
      
      let totalStars = 0;
      Object.keys(this.ratingCounts).forEach(rating => {
        totalStars += Number(rating) * this.ratingCounts[rating];
      });
      
      return totalStars / this.reviewsCount;
    },
    canReview() {
      return this.isAuthenticated;
    },
    filteredReviews() {
      if (this.selectedRating === 0) {
        return this.reviews;
      }
      
      return this.reviews.filter(review => Math.floor(review.rating) === this.selectedRating);
    },
    displayedReviews() {
      let sorted = [...this.filteredReviews];
      
      switch (this.sortBy) {
        case 'newest':
          sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          break;
        case 'oldest':
          sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          break;
        case 'highest':
          sorted.sort((a, b) => b.rating - a.rating);
          break;
        case 'lowest':
          sorted.sort((a, b) => a.rating - b.rating);
          break;
        case 'helpful':
          sorted.sort((a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0));
          break;
      }
      
      return sorted;
    }
  },
  watch: {
    productId: {
      handler() {
        this.fetchProduct();
        this.fetchReviews();
      },
      immediate: true
    },
    currentPage() {
      this.fetchReviews();
    }
  },
  methods: {
    ...mapActions({
      showToast: 'notification/showToast'
    }),
    
    async fetchProduct() {
      try {
        const response = await productService.getProductById(this.productId);
        this.product = response.data.data.product;
      } catch (error) {
        console.error('Error fetching product:', error);
        this.showToast({
          message: 'Failed to load product information',
          type: 'error'
        });
      }
    },
    
    async fetchReviews() {
      this.loading = true;
      
      try {
        const response = await productService.getProductReviews(this.productId, {
          page: this.currentPage,
          limit: this.perPage
        });
        
        const { reviews, totalReviews, totalPages } = response.data.data;
        
        this.reviews = reviews || [];
        this.totalReviews = totalReviews || 0;
        this.totalPages = totalPages || 1;
        
        // Calculate rating counts
        this.ratingCounts = {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0
        };
        
        this.reviews.forEach(review => {
          const rating = Math.floor(review.rating);
          if (rating >= 1 && rating <= 5) {
            this.ratingCounts[rating]++;
          }
        });
      } catch (error) {
        console.error('Error fetching reviews:', error);
        this.showToast({
          message: 'Failed to load reviews',
          type: 'error'
        });
      } finally {
        this.loading = false;
      }
    },
    
    formatDate(dateString) {
      return format(new Date(dateString), 'MMM d, yyyy');
    },
    
    getRatingCount(rating) {
      return this.ratingCounts[rating] || 0;
    },
    
    getRatingPercentage(rating) {
      if (this.reviewsCount === 0) return 0;
      return (this.getRatingCount(rating) / this.reviewsCount) * 100;
    },
    
    toggleRatingFilter(rating) {
      this.selectedRating = this.selectedRating === rating ? 0 : rating;
    },
    
    openReviewDialog() {
      if (!this.isAuthenticated) {
        this.showToast({
          message: 'You need to sign in to write a review',
          type: 'info'
        });
        
        this.$router.push({
          name: 'Login',
          query: { redirect: this.$route.fullPath }
        });
        
        return;
      }
      
      this.newReview = {
        rating: 5,
        content: '',
        images: []
      };
      
      this.reviewDialog = true;
    },
    
    async submitReview() {
      if (!this.$refs.reviewForm.validate()) return;
      
      this.isSubmittingReview = true;
      
      try {
        // Create FormData for image upload
        const formData = new FormData();
        formData.append('productId', this.productId);
        formData.append('rating', this.newReview.rating);
        formData.append('content', this.newReview.content);
        
        if (this.newReview.images && this.newReview.images.length) {
          this.newReview.images.forEach(image => {
            formData.append('images', image);
          });
        }
        
        await productService.submitReview(formData);
        
        this.showToast({
          message: 'Thank you for your review!',
          type: 'success'
        });
        
        this.reviewDialog = false;
        this.fetchReviews(); // Refresh reviews
      } catch (error) {
        console.error('Error submitting review:', error);
        this.showToast({
          message: error.response?.data?.message || 'Failed to submit review',
          type: 'error'
        });
      } finally {
        this.isSubmittingReview = false;
      }
    },
    
    openImagePreview(image) {
      this.previewImage = image;
      this.imagePreviewDialog = true;
    },
    
    async markReviewHelpful(review) {
      if (!this.isAuthenticated) {
        this.showToast({
          message: 'You need to sign in to mark reviews as helpful',
          type: 'info'
        });
        return;
      }
      
      try {
        await productService.markReviewHelpful(review.id);
        
        // Update local state
        review.isHelpful = !review.isHelpful;
        review.helpfulCount = review.isHelpful 
          ? (review.helpfulCount || 0) + 1
          : Math.max(0, (review.helpfulCount || 0) - 1);
      } catch (error) {
        console.error('Error marking review as helpful:', error);
        this.showToast({
          message: 'Failed to mark review as helpful',
          type: 'error'
        });
      }
    },
    
    async deleteReview(reviewId) {
      try {
        await productService.deleteReview(reviewId);
        
        this.showToast({
          message: 'Your review has been deleted',
          type: 'success'
        });
        
        this.fetchReviews(); // Refresh reviews
      } catch (error) {
        console.error('Error deleting review:', error);
        this.showToast({
          message: 'Failed to delete review',
          type: 'error'
        });
      }
    }
  }
};
</script>

<style scoped>
.product-reviews-page {
  padding-bottom: 40px;
}

.filter-card {
  position: sticky;
  top: 24px;
}

.review-images {
  cursor: pointer;
}
</style> 