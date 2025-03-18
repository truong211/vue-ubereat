<template>
  <div class="review-moderation">
    <v-container>
      <h1 class="text-h4 mb-4">Review Moderation</h1>
      
      <!-- Filters -->
      <v-card class="mb-4">
        <v-card-text>
          <v-row>
            <v-col cols="12" sm="4">
              <v-select
                v-model="filters.status"
                :items="statusOptions"
                label="Status"
                variant="outlined"
                density="comfortable"
                hide-details
              ></v-select>
            </v-col>
            <v-col cols="12" sm="8">
              <v-text-field
                v-model="filters.search"
                label="Search"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="comfortable"
                hide-details
                clearable
              ></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
      
      <!-- Loading state -->
      <div v-if="loading" class="d-flex justify-center my-8">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      </div>
      
      <!-- No reviews state -->
      <v-card v-else-if="!pendingReviews.length" class="text-center py-8">
        <v-icon size="64" color="grey">mdi-check-all</v-icon>
        <h2 class="text-h5 mt-4">No reviews pending moderation</h2>
        <p class="text-body-1 mt-2">All reviews have been processed</p>
      </v-card>
      
      <!-- Reviews List -->
      <template v-else>
        <div v-for="review in pendingReviews" :key="review.id" class="mb-4">
          <v-card>
            <v-card-title class="d-flex align-center">
              <div>
                Review #{{ review.id }}
                <v-chip
                  :color="getStatusColor(review.moderationStatus)"
                  size="small"
                  class="ml-2"
                >
                  {{ formatStatus(review.moderationStatus) }}
                </v-chip>
              </div>
              <v-spacer></v-spacer>
              <div class="text-caption text-grey">{{ formatDate(review.createdAt) }}</div>
            </v-card-title>
            
            <v-divider></v-divider>
            
            <v-card-text>
              <!-- User and review details -->
              <div class="d-flex flex-wrap mb-3">
                <div class="d-flex align-center mr-6 mb-2">
                  <v-avatar size="32" class="mr-2">
                    <v-img v-if="review.user?.profileImage" :src="review.user.profileImage"></v-img>
                    <v-icon v-else>mdi-account</v-icon>
                  </v-avatar>
                  <div>
                    <div class="text-subtitle-2">{{ review.user?.fullName || 'Anonymous' }}</div>
                    <div class="text-caption text-grey">User #{{ review.userId }}</div>
                  </div>
                </div>
                
                <div class="d-flex align-center mr-6 mb-2">
                  <v-icon size="small" color="amber-darken-2" class="mr-2">mdi-store</v-icon>
                  <div>
                    <div class="text-subtitle-2">{{ review.restaurant?.name || 'Restaurant' }}</div>
                    <div class="text-caption text-grey">Restaurant #{{ review.restaurantId }}</div>
                  </div>
                </div>
                
                <div v-if="review.product" class="d-flex align-center mb-2">
                  <v-icon size="small" color="amber-darken-2" class="mr-2">mdi-food</v-icon>
                  <div>
                    <div class="text-subtitle-2">{{ review.product.name }}</div>
                    <div class="text-caption text-grey">Product #{{ review.productId }}</div>
                  </div>
                </div>
              </div>
              
              <!-- Rating and comment -->
              <div class="mb-2">
                <v-rating
                  :model-value="review.rating"
                  color="amber"
                  density="compact"
                  half-increments
                  readonly
                  size="small"
                ></v-rating>
              </div>
              
              <div class="review-content pa-3 bg-grey-lighten-4 rounded mb-3">
                <p>{{ review.comment }}</p>
              </div>
              
              <!-- Review images if any -->
              <div v-if="review.images && review.images.length" class="mb-3">
                <div class="text-subtitle-2 mb-2">Attached Images:</div>
                <div class="d-flex flex-wrap">
                  <v-img
                    v-for="(image, index) in review.images"
                    :key="index"
                    :src="image"
                    width="100"
                    height="100"
                    cover
                    class="ma-1 rounded"
                    @click="openImageDialog(review.images, index)"
                  ></v-img>
                </div>
              </div>
              
              <!-- Review reports if any -->
              <div v-if="review.reports && review.reports.length" class="mb-3">
                <v-alert
                  type="warning"
                  variant="tonal"
                  title="This review has been reported"
                  :text="`${review.reports.length} ${review.reports.length === 1 ? 'user has' : 'users have'} reported this review`"
                  class="mb-2"
                ></v-alert>
                
                <div v-if="showReports[review.id]">
                  <div v-for="(report, index) in review.reports" :key="index" class="pa-3 mb-2 border rounded">
                    <div class="d-flex justify-space-between">
                      <div class="text-subtitle-2">{{ report.reason }}</div>
                      <div class="text-caption">{{ formatDate(report.createdAt) }}</div>
                    </div>
                    <p v-if="report.description" class="text-body-2 mt-1">{{ report.description }}</p>
                    <div class="text-caption">Reported by: {{ report.user?.fullName || 'User #' + report.userId }}</div>
                  </div>
                </div>
                
                <div class="text-center">
                  <v-btn
                    variant="text"
                    size="small"
                    @click="showReports[review.id] = !showReports[review.id]"
                  >
                    {{ showReports[review.id] ? 'Hide Reports' : 'View Reports' }}
                  </v-btn>
                </div>
              </div>
            </v-card-text>
            
            <v-divider></v-divider>
            
            <v-card-actions class="d-flex flex-wrap">
              <div class="flex-grow-1 pa-2">
                <v-radio-group
                  v-model="moderationDecisions[review.id].status"
                  inline
                  hide-details
                >
                  <v-radio value="approved" label="Approve"></v-radio>
                  <v-radio value="rejected" label="Reject"></v-radio>
                </v-radio-group>
                
                <v-expand-transition>
                  <div v-if="moderationDecisions[review.id].status === 'rejected'">
                    <v-select
                      v-model="moderationDecisions[review.id].reason"
                      :items="rejectionReasons"
                      label="Rejection Reason"
                      density="compact"
                      class="mt-2"
                    ></v-select>
                    
                    <v-textarea
                      v-if="moderationDecisions[review.id].reason === 'other'"
                      v-model="moderationDecisions[review.id].customReason"
                      label="Specify Reason"
                      rows="2"
                      auto-grow
                      density="compact"
                    ></v-textarea>
                  </div>
                </v-expand-transition>
              </div>
              
              <div>
                <v-btn
                  color="primary"
                  variant="elevated"
                  :loading="submittingReview === review.id"
                  :disabled="!isDecisionValid(review.id)"
                  @click="submitModeration(review)"
                >
                  Submit Decision
                </v-btn>
              </div>
            </v-card-actions>
          </v-card>
        </div>
        
        <!-- Pagination -->
        <div class="d-flex justify-center mt-6">
          <v-pagination
            v-model="currentPage"
            :length="totalPages"
            :total-visible="7"
            @update:model-value="loadReviews"
          ></v-pagination>
        </div>
      </template>
    </v-container>
    
    <!-- Image Dialog -->
    <v-dialog v-model="imageDialog.show" max-width="90vw">
      <v-card>
        <v-img
          :src="currentImage"
          max-height="80vh"
          contain
        ></v-img>
        
        <v-overlay
          activator="parent"
          scrim="black"
          contained
          location="bottom"
          origin="center center"
          class="bg-transparent"
        >
          <v-card-actions class="justify-center">
            <v-btn
              icon="mdi-chevron-left"
              variant="text"
              color="white"
              @click="prevImage"
              :disabled="imageDialog.currentIndex === 0"
            ></v-btn>
            <span class="text-white mx-2">
              {{ imageDialog.currentIndex + 1 }} / {{ imageDialog.images.length }}
            </span>
            <v-btn
              icon="mdi-chevron-right"
              variant="text"
              color="white"
              @click="nextImage"
              :disabled="imageDialog.currentIndex >= imageDialog.images.length - 1"
            ></v-btn>
            <v-btn
              icon="mdi-close"
              variant="text"
              color="white"
              class="ms-4"
              @click="imageDialog.show = false"
            ></v-btn>
          </v-card-actions>
        </v-overlay>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import { format } from 'date-fns';

export default {
  name: 'ReviewModeration',
  
  setup() {
    const store = useStore();
    const loading = ref(true);
    const pendingReviews = ref([]);
    const currentPage = ref(1);
    const totalPages = ref(1);
    const submittingReview = ref(null);
    const showReports = ref({});
    
    // Image dialog state
    const imageDialog = ref({
      show: false,
      images: [],
      currentIndex: 0
    });
    
    // Filters
    const filters = ref({
      status: 'pending',
      search: ''
    });
    
    const statusOptions = [
      { title: 'Pending', value: 'pending' },
      { title: 'Approved', value: 'approved' },
      { title: 'Rejected', value: 'rejected' }
    ];
    
    const rejectionReasons = [
      'Inappropriate language',
      'Spam',
      'Fake review',
      'Offensive content',
      'Unrelated to product/restaurant',
      'Personal information',
      'other'
    ];
    
    // Track moderation decisions for each review
    const moderationDecisions = ref({});
    
    // Computed
    const currentImage = computed(() => {
      if (imageDialog.value.show && imageDialog.value.images.length > 0) {
        return imageDialog.value.images[imageDialog.value.currentIndex];
      }
      return '';
    });
    
    // Methods
    const loadReviews = async () => {
      loading.value = true;
      try {
        const response = await store.dispatch('reviews/fetchPendingModeration', {
          page: currentPage.value,
          limit: 10
        });
        
        pendingReviews.value = response.data.reviews;
        totalPages.value = response.totalPages;
        
        // Initialize decision tracking for each review
        pendingReviews.value.forEach(review => {
          if (!moderationDecisions.value[review.id]) {
            moderationDecisions.value[review.id] = {
              status: 'approved',
              reason: '',
              customReason: ''
            };
          }
          
          // Initialize reports visibility
          if (review.reports && review.reports.length && !showReports.value.hasOwnProperty(review.id)) {
            showReports.value[review.id] = false;
          }
        });
      } catch (error) {
        console.error('Failed to load reviews:', error);
        store.dispatch('notifications/show', {
          type: 'error',
          message: 'Failed to load reviews for moderation'
        });
      } finally {
        loading.value = false;
      }
    };
    
    const formatDate = (dateString) => {
      if (!dateString) return '';
      return format(new Date(dateString), 'MMM d, yyyy, h:mm a');
    };
    
    const formatStatus = (status) => {
      if (!status) return 'Pending';
      return status.charAt(0).toUpperCase() + status.slice(1);
    };
    
    const getStatusColor = (status) => {
      switch (status) {
        case 'approved':
          return 'success';
        case 'rejected':
          return 'error';
        default:
          return 'warning';
      }
    };
    
    const isDecisionValid = (reviewId) => {
      const decision = moderationDecisions.value[reviewId];
      if (!decision) return false;
      
      if (decision.status === 'rejected') {
        if (!decision.reason) return false;
        if (decision.reason === 'other' && !decision.customReason.trim()) return false;
      }
      
      return true;
    };
    
    const submitModeration = async (review) => {
      submittingReview.value = review.id;
      const decision = moderationDecisions.value[review.id];
      
      try {
        let moderationReason = decision.reason;
        if (decision.reason === 'other') {
          moderationReason = decision.customReason;
        }
        
        await store.dispatch('reviews/moderateReview', {
          reviewId: review.id,
          moderationStatus: decision.status,
          moderationReason: decision.status === 'rejected' ? moderationReason : null
        });
        
        // Remove the review from the list
        pendingReviews.value = pendingReviews.value.filter(r => r.id !== review.id);
        
        store.dispatch('notifications/show', {
          type: 'success',
          message: `Review has been ${decision.status}`
        });
        
        // If we removed the last review on the page and there are more pages, load previous page
        if (pendingReviews.value.length === 0 && currentPage.value > 1) {
          currentPage.value--;
          await loadReviews();
        } else if (pendingReviews.value.length === 0) {
          // If no more reviews, reload current page to check if there are any
          await loadReviews();
        }
      } catch (error) {
        console.error('Failed to moderate review:', error);
        store.dispatch('notifications/show', {
          type: 'error',
          message: 'Failed to moderate review'
        });
      } finally {
        submittingReview.value = null;
      }
    };
    
    const openImageDialog = (images, index) => {
      imageDialog.value = {
        show: true,
        images,
        currentIndex: index
      };
    };
    
    const nextImage = () => {
      if (imageDialog.value.currentIndex < imageDialog.value.images.length - 1) {
        imageDialog.value.currentIndex++;
      }
    };
    
    const prevImage = () => {
      if (imageDialog.value.currentIndex > 0) {
        imageDialog.value.currentIndex--;
      }
    };
    
    // Watch filters to reload reviews
    watch(filters, () => {
      currentPage.value = 1;
      loadReviews();
    }, { deep: true });
    
    // Load reviews on mount
    onMounted(() => {
      loadReviews();
    });
    
    return {
      loading,
      pendingReviews,
      currentPage,
      totalPages,
      filters,
      statusOptions,
      submittingReview,
      moderationDecisions,
      showReports,
      rejectionReasons,
      imageDialog,
      currentImage,
      
      loadReviews,
      formatDate,
      formatStatus,
      getStatusColor,
      isDecisionValid,
      submitModeration,
      openImageDialog,
      nextImage,
      prevImage
    };
  }
};
</script>

<style scoped>
.border {
  border: 1px solid rgba(0, 0, 0, 0.12);
}

.review-content {
  white-space: pre-line;
}
</style>