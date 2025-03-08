<template>
  <div class="review-highlights">
    <!-- Restaurant Rating Summary -->
    <div v-if="restaurantId" class="rating-summary mb-4">
      <div class="d-flex align-center justify-space-between">
        <div class="text-h6">Overall Rating</div>
        <div class="d-flex align-center">
          <span class="text-h5 font-weight-bold mr-2">{{ averageRating }}</span>
          <v-rating
            :model-value="parseFloat(averageRating)"
            color="amber"
            half-increments
            readonly
            size="small"
          ></v-rating>
        </div>
      </div>
      <div class="text-caption text-medium-emphasis">
        Based on {{ totalReviews }} reviews
      </div>
    </div>

    <!-- Highlighted Reviews -->
    <div class="highlighted-reviews">
      <div class="text-h6 mb-4">Featured Reviews</div>
      
      <div v-if="loading" class="text-center py-4">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </div>

      <div v-else-if="!reviews.length" class="text-center py-4">
        <div class="text-body-1 text-medium-emphasis">No reviews yet</div>
      </div>

      <v-list v-else>
        <v-list-item
          v-for="review in reviews"
          :key="review.id"
          class="mb-4"
        >
          <template v-slot:prepend>
            <v-avatar color="grey-lighten-1">
              <v-icon icon="mdi-account"></v-icon>
            </v-avatar>
          </template>

          <v-list-item-title class="d-flex align-center justify-space-between">
            <span>{{ review.userName }}</span>
            <v-rating
              :model-value="review.rating"
              color="amber"
              half-increments
              readonly
              size="x-small"
            ></v-rating>
          </v-list-item-title>

          <v-list-item-subtitle class="text-caption text-medium-emphasis">
            {{ formatDate(review.date) }}
          </v-list-item-subtitle>

          <v-list-item-text class="mt-2">
            {{ review.comment }}
          </v-list-item-text>

          <!-- Review Photos -->
          <div v-if="review.photos?.length" class="review-photos mt-2">
            <v-row>
              <v-col
                v-for="(photo, index) in review.photos"
                :key="index"
                cols="4"
                sm="3"
                class="pa-1"
              >
                <v-img
                  :src="photo"
                  aspect-ratio="1"
                  cover
                  class="rounded"
                  @click="openPhotoDialog(photo)"
                ></v-img>
              </v-col>
            </v-row>
          </div>
        </v-list-item>
      </v-list>

      <!-- Photo Dialog -->
      <v-dialog v-model="showPhotoDialog" max-width="800">
        <v-card>
          <v-img :src="selectedPhoto"></v-img>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" variant="text" @click="showPhotoDialog = false">
              Close
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { format } from 'date-fns';

export default {
  name: 'ReviewHighlights',

  props: {
    restaurantId: {
      type: [String, Number],
      default: null
    },
    productId: {
      type: [String, Number],
      default: null
    }
  },

  setup(props) {
    const store = useStore();
    const loading = ref(false);
    const showPhotoDialog = ref(false);
    const selectedPhoto = ref(null);

    // Computed properties
    const reviews = computed(() => store.state.reviews.highlightedReviews);
    
    const averageRating = computed(() => {
      if (props.restaurantId) {
        return store.getters['reviews/getRestaurantRating'](props.restaurantId);
      } else if (props.productId) {
        return store.getters['reviews/getProductRating'](props.productId);
      }
      return 0;
    });

    const totalReviews = computed(() => reviews.value.length);

    // Methods
    const fetchReviews = async () => {
      loading.value = true;
      try {
        if (props.restaurantId) {
          await store.dispatch('reviews/fetchRestaurantReviews', props.restaurantId);
        } else if (props.productId) {
          await store.dispatch('reviews/fetchProductReviews', props.productId);
        }
        await store.dispatch('reviews/fetchHighlightedReviews');
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        loading.value = false;
      }
    };

    const formatDate = (date) => {
      return format(new Date(date), 'MMM d, yyyy');
    };

    const openPhotoDialog = (photo) => {
      selectedPhoto.value = photo;
      showPhotoDialog.value = true;
    };

    // Lifecycle hooks
    onMounted(() => {
      fetchReviews();
    });

    return {
      loading,
      reviews,
      averageRating,
      totalReviews,
      showPhotoDialog,
      selectedPhoto,
      formatDate,
      openPhotoDialog
    };
  }
};
</script>

<style scoped>
.review-highlights {
  max-width: 800px;
  margin: 0 auto;
}

.rating-summary {
  background-color: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
}

.review-photos {
  cursor: pointer;
}
</style>