<template>
  <div class="review-list">
    <!-- Filters -->
    <div class="d-flex align-center mb-4">
      <v-select
        v-model="filters.sort"
        :items="sortOptions"
        label="Sort by"
        density="comfortable"
        hide-details
        class="me-4"
        style="max-width: 200px"
      ></v-select>

      <v-select
        v-model="filters.rating"
        :items="ratingOptions"
        label="Filter by rating"
        density="comfortable"
        hide-details
        class="me-4"
        style="max-width: 200px"
      ></v-select>

      <v-text-field
        v-model="filters.search"
        label="Search reviews"
        density="comfortable"
        hide-details
        prepend-inner-icon="mdi-magnify"
        clearable
        style="max-width: 300px"
      ></v-text-field>
    </div>

    <!-- Reviews -->
    <div v-if="loading" class="d-flex justify-center py-4">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>

    <div v-else-if="!filteredReviews.length" class="text-center py-8">
      <v-icon size="64" color="grey">mdi-comment-text-outline</v-icon>
      <div class="text-h6 mt-2">No Reviews Yet</div>
      <div class="text-body-2 text-medium-emphasis">
        {{ emptyMessage }}
      </div>
    </div>

    <v-list v-else>
      <template v-for="(review, index) in filteredReviews" :key="review.id">
        <v-list-item>
          <template v-slot:prepend>
            <v-avatar :image="review.user?.profileImage" class="mr-3">
              <v-icon v-if="!review.user?.profileImage">mdi-account</v-icon>
            </v-avatar>
          </template>

          <v-list-item-title>
            <div class="d-flex justify-space-between align-center">
              <div>
                {{ review.user?.fullName }}
                <v-chip
                  v-if="review.order"
                  color="success"
                  size="x-small"
                  class="ms-2"
                >
                  Verified Order
                </v-chip>
              </div>
              <div class="text-caption">{{ formatDate(review.createdAt) }}</div>
            </div>
          </v-list-item-title>

          <v-list-item-subtitle class="mt-2">
            <div class="d-flex align-center mb-2">
              <v-rating
                :model-value="review.rating"
                color="amber"
                density="compact"
                half-increments
                readonly
                size="small"
              ></v-rating>
              <span class="text-caption ms-2">{{ formatDate(review.createdAt) }}</span>
            </div>

            <div class="review-photos d-flex gap-2 mb-2" v-if="review.images?.length">
              <v-img
                v-for="(image, i) in review.images"
                :key="i"
                :src="image"
                width="100"
                height="100"
                cover
                class="rounded"
                @click="openPhotoDialog(review.images, i)"
              ></v-img>
            </div>

            <p class="text-body-1">{{ review.comment }}</p>

            <div v-if="review.response" class="response-block mt-3 pa-3">
              <div class="d-flex align-center mb-1">
                <v-avatar size="24" class="me-2">
                  <v-img :src="restaurantLogo" v-if="restaurantLogo"></v-img>
                  <v-icon v-else>mdi-store</v-icon>
                </v-avatar>
                <span class="text-caption font-weight-medium">
                  Response from {{ restaurantName }}
                  <span class="text-caption ms-2">{{ formatDate(review.responseDate) }}</span>
                </span>
              </div>
              <p class="text-body-2 mb-0">{{ review.response }}</p>
            </div>
          </v-list-item-subtitle>

          <template v-slot:append>
            <div class="d-flex align-center">
              <v-menu v-if="canManageReview(review)">
                <template v-slot:activator="{ props }">
                  <v-btn
                    icon="mdi-dots-vertical"
                    variant="text"
                    v-bind="props"
                  ></v-btn>
                </template>
                <v-list>
                  <v-list-item
                    v-if="isRestaurantOwner && !review.response"
                    @click="$emit('respond', review)"
                  >
                    <template v-slot:prepend>
                      <v-icon>mdi-reply</v-icon>
                    </template>
                    <v-list-item-title>Respond</v-list-item-title>
                  </v-list-item>

                  <v-list-item
                    v-if="review.userId === currentUserId"
                    @click="$emit('edit', review)"
                  >
                    <template v-slot:prepend>
                      <v-icon>mdi-pencil</v-icon>
                    </template>
                    <v-list-item-title>Edit</v-list-item-title>
                  </v-list-item>

                  <v-list-item
                    v-if="review.userId === currentUserId"
                    @click="confirmDelete(review)"
                    color="error"
                  >
                    <template v-slot:prepend>
                      <v-icon>mdi-delete</v-icon>
                    </template>
                    <v-list-item-title>Delete</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
          </template>
        </v-list-item>

        <v-divider v-if="index < filteredReviews.length - 1"></v-divider>
      </template>
    </v-list>

    <!-- Pagination -->
    <div v-if="filteredReviews.length" class="d-flex justify-center mt-4">
      <v-pagination
        v-model="currentPage"
        :length="totalPages"
        :total-visible="7"
        @update:model-value="$emit('page-change', $event)"
      ></v-pagination>
    </div>

    <!-- Photo Dialog -->
    <v-dialog v-model="photoDialog.show" max-width="800">
      <v-card>
        <v-img
          :src="photoDialog.images[photoDialog.currentIndex]"
          max-height="80vh"
          contain
        ></v-img>
        <v-card-actions class="justify-space-between">
          <v-btn
            icon="mdi-chevron-left"
            variant="text"
            @click="previousPhoto"
            :disabled="photoDialog.currentIndex === 0"
          ></v-btn>
          <div class="text-caption">
            {{ photoDialog.currentIndex + 1 }} / {{ photoDialog.images.length }}
          </div>
          <v-btn
            icon="mdi-chevron-right"
            variant="text"
            @click="nextPhoto"
            :disabled="photoDialog.currentIndex === photoDialog.images.length - 1"
          ></v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog.show" max-width="400">
      <v-card>
        <v-card-title>Delete Review?</v-card-title>
        <v-card-text>
          Are you sure you want to delete this review? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="deleteDialog.show = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            @click="deleteReview"
            :loading="deleteDialog.loading"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { format } from 'date-fns';

export default {
  name: 'ReviewList',

  props: {
    reviews: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    },
    currentPage: {
      type: Number,
      default: 1
    },
    totalPages: {
      type: Number,
      default: 1
    },
    restaurantName: {
      type: String,
      default: 'Restaurant'
    },
    restaurantLogo: {
      type: String,
      default: ''
    },
    currentUserId: {
      type: [String, Number],
      default: null
    },
    isRestaurantOwner: {
      type: Boolean,
      default: false
    },
    emptyMessage: {
      type: String,
      default: 'No reviews available'
    }
  },

  data() {
    return {
      filters: {
        sort: 'recent',
        rating: 'all',
        search: ''
      },
      sortOptions: [
        { title: 'Most Recent', value: 'recent' },
        { title: 'Highest Rated', value: 'highest' },
        { title: 'Lowest Rated', value: 'lowest' },
        { title: 'Most Helpful', value: 'helpful' }
      ],
      ratingOptions: [
        { title: 'All Ratings', value: 'all' },
        { title: '5 Stars', value: 5 },
        { title: '4 Stars', value: 4 },
        { title: '3 Stars', value: 3 },
        { title: '2 Stars', value: 2 },
        { title: '1 Star', value: 1 }
      ],
      photoDialog: {
        show: false,
        images: [],
        currentIndex: 0
      },
      deleteDialog: {
        show: false,
        review: null,
        loading: false
      }
    };
  },

  computed: {
    filteredReviews() {
      let filtered = [...this.reviews];

      // Filter by rating
      if (this.filters.rating !== 'all') {
        filtered = filtered.filter(review => 
          Math.round(review.rating) === this.filters.rating
        );
      }

      // Filter by search
      if (this.filters.search) {
        const search = this.filters.search.toLowerCase();
        filtered = filtered.filter(review =>
          review.comment.toLowerCase().includes(search) ||
          review.user?.fullName.toLowerCase().includes(search)
        );
      }

      // Sort reviews
      switch (this.filters.sort) {
        case 'highest':
          filtered.sort((a, b) => b.rating - a.rating);
          break;
        case 'lowest':
          filtered.sort((a, b) => a.rating - b.rating);
          break;
        case 'helpful':
          filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
          break;
        default: // recent
          filtered.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
          );
      }

      return filtered;
    }
  },

  methods: {
    formatDate(date) {
      return format(new Date(date), 'MMM d, yyyy');
    },

    canManageReview(review) {
      return this.isRestaurantOwner || review.userId === this.currentUserId;
    },

    openPhotoDialog(images, index) {
      this.photoDialog = {
        show: true,
        images,
        currentIndex: index
      };
    },

    previousPhoto() {
      if (this.photoDialog.currentIndex > 0) {
        this.photoDialog.currentIndex--;
      }
    },

    nextPhoto() {
      if (this.photoDialog.currentIndex < this.photoDialog.images.length - 1) {
        this.photoDialog.currentIndex++;
      }
    },

    confirmDelete(review) {
      this.deleteDialog = {
        show: true,
        review,
        loading: false
      };
    },

    async deleteReview() {
      this.deleteDialog.loading = true;
      try {
        await this.$emit('delete', this.deleteDialog.review);
        this.deleteDialog.show = false;
      } finally {
        this.deleteDialog.loading = false;
      }
    }
  },

  watch: {
    filters: {
      deep: true,
      handler() {
        this.$emit('filter', this.filters);
      }
    }
  }
};
</script>

<style scoped>
.review-list {
  max-width: 800px;
  margin: 0 auto;
}

.response-block {
  background-color: var(--v-surface-variant);
  border-radius: 4px;
}
</style>