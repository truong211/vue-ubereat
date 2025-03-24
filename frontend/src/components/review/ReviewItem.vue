<template>
  <div class="review-item">
    <v-card class="mb-4" variant="outlined">
      <!-- Main Review Content -->
      <v-card-text>
        <div class="d-flex align-start">
          <!-- User Avatar -->
          <v-avatar size="48" class="mr-3">
            <v-img v-if="review.user?.profileImage" :src="review.user.profileImage" alt="User profile"></v-img>
            <v-icon v-else>mdi-account</v-icon>
          </v-avatar>
          
          <!-- Review details -->
          <div class="flex-grow-1">
            <div class="d-flex justify-space-between align-center mb-1">
              <div class="text-subtitle-1 font-weight-bold">{{ review.user?.fullName || 'Anonymous' }}</div>
              <div class="text-caption">{{ formatDate(review.createdAt) }}</div>
            </div>
            
            <div class="d-flex align-center mb-2">
              <v-rating
                :model-value="review.rating"
                color="amber"
                density="compact"
                half-increments
                readonly
                size="small"
              ></v-rating>
              
              <v-chip
                v-if="review.order"
                size="x-small"
                color="success"
                class="ml-2"
                title="Verified Purchase"
              >
                <v-icon size="x-small" start>mdi-check-circle</v-icon>
                Verified
              </v-chip>
            </div>
            
            <!-- Review content -->
            <p class="text-body-1 mb-3">{{ review.comment }}</p>
            
            <!-- Review images -->
            <div v-if="review.images && review.images.length > 0" class="review-images-container mb-3">
              <v-row>
                <v-col v-for="(image, index) in review.images" :key="index" cols="3" sm="2" class="pa-1">
                  <v-img
                    :src="image"
                    aspect-ratio="1"
                    cover
                    class="rounded cursor-pointer"
                    @click="openImageDialog(review.images, index)"
                  ></v-img>
                </v-col>
              </v-row>
            </div>
            
            <!-- Review tags -->
            <div v-if="review.tags && (review.tags.positive?.length || review.tags.negative?.length)" class="mb-3">
              <v-chip-group v-if="review.tags.positive?.length" class="mb-1">
                <v-chip
                  v-for="tag in review.tags.positive"
                  :key="tag"
                  size="small"
                  color="success"
                  variant="outlined"
                >
                  {{ formatTag(tag) }}
                </v-chip>
              </v-chip-group>
              
              <v-chip-group v-if="review.tags.negative?.length">
                <v-chip
                  v-for="tag in review.tags.negative"
                  :key="tag"
                  size="small"
                  color="error"
                  variant="outlined"
                >
                  {{ formatTag(tag) }}
                </v-chip>
              </v-chip-group>
            </div>
            
            <!-- Helpful vote and report system -->
            <div class="d-flex align-center">
              <div class="d-flex align-center">
                <v-btn
                  variant="text"
                  density="compact"
                  :color="userVote === 'helpful' ? 'success' : ''"
                  prepend-icon="mdi-thumb-up"
                  @click="voteHelpful"
                  :disabled="isVoting"
                >
                  {{ review.helpfulVotes || 0 }}
                </v-btn>
                
                <v-btn
                  variant="text"
                  density="compact"
                  :color="userVote === 'unhelpful' ? 'error' : ''"
                  prepend-icon="mdi-thumb-down"
                  @click="voteUnhelpful"
                  :disabled="isVoting"
                  class="mr-2"
                >
                  {{ review.unhelpfulVotes || 0 }}
                </v-btn>
              </div>
              
              <v-spacer></v-spacer>
              
              <v-menu v-if="canReport">
                <template v-slot:activator="{ props }">
                  <v-btn
                    variant="text"
                    density="compact"
                    v-bind="props"
                    icon="mdi-flag-outline"
                    size="small"
                  ></v-btn>
                </template>
                <v-list>
                  <v-list-item @click="reportDialog = true">
                    <v-list-item-title>Report Review</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
          </div>
          
          <!-- Review actions -->
          <v-menu v-if="canManageReview">
            <template v-slot:activator="{ props }">
              <v-btn
                variant="text"
                icon="mdi-dots-vertical"
                v-bind="props"
              ></v-btn>
            </template>
            <v-list>
              <v-list-item
                v-if="isRestaurantOwner && !review.response"
                @click="responseDialog = true"
              >
                <template v-slot:prepend>
                  <v-icon>mdi-reply</v-icon>
                </template>
                <v-list-item-title>Respond</v-list-item-title>
              </v-list-item>
              
              <v-list-item
                v-if="isOwnReview"
                @click="$emit('edit', review)"
              >
                <template v-slot:prepend>
                  <v-icon>mdi-pencil</v-icon>
                </template>
                <v-list-item-title>Edit</v-list-item-title>
              </v-list-item>
              
              <v-list-item
                v-if="isOwnReview || isModerator"
                @click="confirmDeleteDialog = true"
                color="error"
              >
                <template v-slot:prepend>
                  <v-icon>mdi-delete</v-icon>
                </template>
                <v-list-item-title>Delete</v-list-item-title>
              </v-list-item>
              
              <v-list-item
                v-if="isModerator && review.moderationStatus !== 'rejected'"
                @click="moderationDialog = true"
                color="warning"
              >
                <template v-slot:prepend>
                  <v-icon>mdi-flag</v-icon>
                </template>
                <v-list-item-title>Moderate</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </v-card-text>
      
      <!-- Moderation status -->
      <v-card-text v-if="isModerator && review.moderationStatus === 'pending'" class="pt-0">
        <v-alert
          type="warning"
          variant="tonal"
          density="compact"
          class="mt-2"
          border="start"
        >
          This review is pending moderation
        </v-alert>
      </v-card-text>
      
      <v-card-text v-else-if="isModerator && review.moderationStatus === 'rejected'" class="pt-0">
        <v-alert
          type="error"
          variant="tonal"
          density="compact"
          class="mt-2"
          border="start"
        >
          <div class="d-flex justify-space-between">
            <div>This review was rejected</div>
            <div class="text-caption">{{ formatDate(review.moderatedAt) }}</div>
          </div>
          <div v-if="review.moderationReason" class="text-body-2">
            Reason: {{ review.moderationReason }}
          </div>
        </v-alert>
      </v-card-text>
      
      <!-- Restaurant response -->
      <template v-if="review.response">
        <v-divider></v-divider>
        <v-card-text class="restaurant-response pt-3">
          <div class="d-flex align-start">
            <v-avatar size="36" color="primary" class="mr-3">
              <v-img v-if="review.restaurant?.logo" :src="review.restaurant.logo"></v-img>
              <v-icon v-else color="white">mdi-store</v-icon>
            </v-avatar>
            
            <div class="flex-grow-1">
              <div class="d-flex justify-space-between align-center mb-1">
                <div class="text-subtitle-2 font-weight-bold">
                  Response from {{ review.restaurant?.name || 'Restaurant' }}
                </div>
                <div class="text-caption">{{ formatDate(review.responseDate) }}</div>
              </div>
              <p class="text-body-2">{{ review.response }}</p>
            </div>
            
            <v-btn
              v-if="isRestaurantOwner"
              icon="mdi-pencil"
              variant="text"
              size="small"
              @click="editResponseDialog = true"
            ></v-btn>
          </div>
        </v-card-text>
      </template>
      
      <!-- Individual Item Reviews -->
      <order-item-review 
        v-if="review.itemRatings && review.itemRatings.length"
        :review="review"
        :products="orderItems"
      ></order-item-review>
    </v-card>
    
    <!-- Restaurant Response Dialog -->
    <v-dialog v-model="responseDialog" max-width="500">
      <v-card>
        <v-card-title>Respond to Review</v-card-title>
        <v-card-text>
          <v-textarea
            v-model="responseText"
            label="Your response"
            hint="Your response will be publicly visible"
            counter="1000"
            :rules="responseRules"
            rows="5"
            auto-grow
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="responseDialog = false"
            :disabled="isSubmitting"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="submitResponse"
            :loading="isSubmitting"
            :disabled="!isResponseValid"
          >
            Submit Response
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Edit Restaurant Response Dialog -->
    <v-dialog v-model="editResponseDialog" max-width="500">
      <v-card>
        <v-card-title>Edit Response</v-card-title>
        <v-card-text>
          <v-textarea
            v-model="editResponseText"
            label="Your response"
            hint="Your response will be publicly visible"
            counter="1000"
            :rules="responseRules"
            rows="5"
            auto-grow
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="editResponseDialog = false"
            :disabled="isSubmitting"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="updateResponse"
            :loading="isSubmitting"
            :disabled="!isEditResponseValid"
          >
            Update Response
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Report Dialog -->
    <v-dialog v-model="reportDialog" max-width="500">
      <v-card>
        <v-card-title>Report Review</v-card-title>
        <v-card-text>
          <v-select
            v-model="reportReason"
            label="Reason for reporting"
            :items="reportReasons"
            item-title="text"
            item-value="value"
            required
          ></v-select>
          
          <v-textarea
            v-model="reportDescription"
            label="Additional details (optional)"
            rows="3"
            counter="500"
            hint="Please provide any additional information about your report"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="reportDialog = false"
            :disabled="isSubmitting"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            @click="submitReport"
            :loading="isSubmitting"
            :disabled="!reportReason"
          >
            Submit Report
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Moderation Dialog -->
    <v-dialog v-model="moderationDialog" max-width="500">
      <v-card>
        <v-card-title>Moderate Review</v-card-title>
        <v-card-text>
          <v-radio-group v-model="moderationStatus">
            <v-radio value="approved" label="Approve review"></v-radio>
            <v-radio value="rejected" label="Reject review"></v-radio>
          </v-radio-group>
          
          <v-expand-transition>
            <div v-if="moderationStatus === 'rejected'">
              <v-textarea
                v-model="moderationReason"
                label="Reason for rejection"
                hint="This will be visible to the reviewer"
                counter="500"
                rows="3"
              ></v-textarea>
            </div>
          </v-expand-transition>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="moderationDialog = false"
            :disabled="isSubmitting"
          >
            Cancel
          </v-btn>
          <v-btn
            :color="moderationStatus === 'approved' ? 'success' : 'error'"
            @click="submitModeration"
            :loading="isSubmitting"
          >
            {{ moderationStatus === 'approved' ? 'Approve' : 'Reject' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Confirm Delete Dialog -->
    <v-dialog v-model="confirmDeleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Review</v-card-title>
        <v-card-text>
          Are you sure you want to delete this review? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="confirmDeleteDialog = false"
            :disabled="isSubmitting"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            @click="deleteReview"
            :loading="isSubmitting"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
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
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { format } from 'date-fns';
import OrderItemReview from './OrderItemReview.vue';

export default {
  name: 'ReviewItem',
  
  components: {
    OrderItemReview
  },
  
  props: {
    review: {
      type: Object,
      required: true
    },
    currentUserId: {
      type: [Number, String],
      default: null
    },
    isRestaurantOwner: {
      type: Boolean,
      default: false
    },
    isModerator: {
      type: Boolean,
      default: false
    }
  },
  
  emits: ['update', 'delete'],
  
  setup(props, { emit }) {
    const store = useStore();
    
    // State
    const userVote = ref(null);
    const isVoting = ref(false);
    const isSubmitting = ref(false);
    
    // Dialogs state
    const responseDialog = ref(false);
    const editResponseDialog = ref(false);
    const reportDialog = ref(false);
    const moderationDialog = ref(false);
    const confirmDeleteDialog = ref(false);
    const imageDialog = ref({
      show: false,
      images: [],
      currentIndex: 0
    });
    
    // Form values
    const responseText = ref('');
    const editResponseText = ref('');
    const reportReason = ref('');
    const reportDescription = ref('');
    const moderationStatus = ref('approved');
    const moderationReason = ref('');
    
    // Validation rules
    const responseRules = [
      v => !!v || 'Response is required',
      v => v.length >= 10 || 'Response must be at least 10 characters',
      v => v.length <= 1000 || 'Response cannot exceed 1000 characters'
    ];
    
    const reportReasons = [
      { text: 'Inappropriate content', value: 'inappropriate' },
      { text: 'False information', value: 'fake' },
      { text: 'Spam', value: 'spam' },
      { text: 'Offensive language', value: 'offensive' },
      { text: 'Other', value: 'other' }
    ];
    
    // Computed
    const canManageReview = computed(() => {
      return (
        props.isRestaurantOwner ||
        props.isModerator ||
        isOwnReview.value
      );
    });
    
    const isOwnReview = computed(() => {
      return props.currentUserId && props.review.user && 
        props.review.user.id == props.currentUserId;
    });
    
    const canReport = computed(() => {
      return props.currentUserId && !isOwnReview.value;
    });
    
    const isResponseValid = computed(() => {
      return responseText.value && responseText.value.length >= 10 && responseText.value.length <= 1000;
    });
    
    const isEditResponseValid = computed(() => {
      return editResponseText.value && editResponseText.value.length >= 10 && editResponseText.value.length <= 1000;
    });
    
    const currentImage = computed(() => {
      if (imageDialog.value.show && imageDialog.value.images.length > 0) {
        return imageDialog.value.images[imageDialog.value.currentIndex];
      }
      return '';
    });
    
    const orderItems = computed(() => {
      return props.review.order?.items || [];
    });
    
    // Methods
    const formatDate = (date) => {
      if (!date) return '';
      return format(new Date(date), 'MMM d, yyyy');
    };
    
    const formatTag = (tag) => {
      return tag
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };
    
    const voteHelpful = async () => {
      if (!props.currentUserId) {
        store.dispatch('auth/showLoginPrompt');
        return;
      }
      
      if (isVoting.value) return;
      isVoting.value = true;
      
      try {
        // If already voted helpful, remove vote; otherwise add helpful vote
        const isHelpful = userVote.value !== 'helpful';
        const response = await store.dispatch('reviews/voteReview', {
          reviewId: props.review.id,
          isHelpful
        });
        
        userVote.value = isHelpful ? 'helpful' : null;
        emit('update', {
          ...props.review,
          helpfulVotes: response.data.helpfulVotes,
          unhelpfulVotes: response.data.unhelpfulVotes
        });
      } catch (error) {
        console.error('Failed to vote on review:', error);
      } finally {
        isVoting.value = false;
      }
    };
    
    const voteUnhelpful = async () => {
      if (!props.currentUserId) {
        store.dispatch('auth/showLoginPrompt');
        return;
      }
      
      if (isVoting.value) return;
      isVoting.value = true;
      
      try {
        // If already voted unhelpful, remove vote; otherwise add unhelpful vote
        const isHelpful = false;
        const shouldRemove = userVote.value === 'unhelpful';
        
        const response = await store.dispatch('reviews/voteReview', {
          reviewId: props.review.id,
          isHelpful,
          remove: shouldRemove
        });
        
        userVote.value = shouldRemove ? null : 'unhelpful';
        emit('update', {
          ...props.review,
          helpfulVotes: response.data.helpfulVotes,
          unhelpfulVotes: response.data.unhelpfulVotes
        });
      } catch (error) {
        console.error('Failed to vote on review:', error);
      } finally {
        isVoting.value = false;
      }
    };
    
    const submitResponse = async () => {
      if (!isResponseValid.value) return;
      
      isSubmitting.value = true;
      
      try {
        const response = await store.dispatch('reviews/respondToReview', {
          reviewId: props.review.id,
          response: responseText.value
        });
        
        // Update review with the new response
        emit('update', {
          ...props.review,
          response: responseText.value,
          responseDate: new Date()
        });
        
        responseDialog.value = false;
        responseText.value = '';
        
        store.dispatch('notifications/show', {
          type: 'success',
          message: 'Response submitted successfully'
        });
      } catch (error) {
        console.error('Failed to submit response:', error);
        store.dispatch('notifications/show', {
          type: 'error',
          message: 'Failed to submit response'
        });
      } finally {
        isSubmitting.value = false;
      }
    };
    
    const updateResponse = async () => {
      if (!isEditResponseValid.value) return;
      
      isSubmitting.value = true;
      
      try {
        const response = await store.dispatch('reviews/updateReviewResponse', {
          reviewId: props.review.id,
          response: editResponseText.value
        });
        
        // Update review with the updated response
        emit('update', {
          ...props.review,
          response: editResponseText.value,
          responseDate: new Date()
        });
        
        editResponseDialog.value = false;
        editResponseText.value = '';
        
        store.dispatch('notifications/show', {
          type: 'success',
          message: 'Response updated successfully'
        });
      } catch (error) {
        console.error('Failed to update response:', error);
        store.dispatch('notifications/show', {
          type: 'error',
          message: 'Failed to update response'
        });
      } finally {
        isSubmitting.value = false;
      }
    };
    
    const submitReport = async () => {
      if (!reportReason.value) return;
      
      isSubmitting.value = true;
      
      try {
        await store.dispatch('reviews/reportReview', {
          reviewId: props.review.id,
          reason: reportReason.value,
          description: reportDescription.value
        });
        
        reportDialog.value = false;
        reportReason.value = '';
        reportDescription.value = '';
        
        store.dispatch('notifications/show', {
          type: 'success',
          message: 'Report submitted successfully'
        });
      } catch (error) {
        console.error('Failed to submit report:', error);
        store.dispatch('notifications/show', {
          type: 'error',
          message: 'Failed to submit report'
        });
      } finally {
        isSubmitting.value = false;
      }
    };
    
    const submitModeration = async () => {
      isSubmitting.value = true;
      
      try {
        await store.dispatch('reviews/moderateReview', {
          reviewId: props.review.id,
          moderationStatus: moderationStatus.value,
          moderationReason: moderationReason.value
        });
        
        // Update review with moderation status
        emit('update', {
          ...props.review,
          moderationStatus: moderationStatus.value,
          moderationReason: moderationReason.value,
          moderatedAt: new Date(),
          isVisible: moderationStatus.value === 'approved'
        });
        
        moderationDialog.value = false;
        moderationReason.value = '';
        
        store.dispatch('notifications/show', {
          type: 'success',
          message: `Review ${moderationStatus.value === 'approved' ? 'approved' : 'rejected'} successfully`
        });
      } catch (error) {
        console.error('Failed to moderate review:', error);
        store.dispatch('notifications/show', {
          type: 'error',
          message: 'Failed to moderate review'
        });
      } finally {
        isSubmitting.value = false;
      }
    };
    
    const deleteReview = async () => {
      isSubmitting.value = true;
      
      try {
        await store.dispatch('reviews/deleteReview', {
          reviewId: props.review.id
        });
        
        emit('delete', props.review);
        confirmDeleteDialog.value = false;
        
        store.dispatch('notifications/show', {
          type: 'success',
          message: 'Review deleted successfully'
        });
      } catch (error) {
        console.error('Failed to delete review:', error);
        store.dispatch('notifications/show', {
          type: 'error',
          message: 'Failed to delete review'
        });
      } finally {
        isSubmitting.value = false;
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
    
    // Check for existing user vote
    const checkUserVote = async () => {
      if (!props.currentUserId) return;
      
      try {
        const userVoteData = await store.dispatch('reviews/getUserVote', {
          reviewId: props.review.id
        });
        
        if (userVoteData) {
          userVote.value = userVoteData.isHelpful ? 'helpful' : 'unhelpful';
        }
      } catch (error) {
        console.error('Failed to get user vote:', error);
      }
    };
    
    // Lifecycle hooks
    onMounted(() => {
      checkUserVote();
      
      // Pre-fill edit response dialog
      if (props.review.response) {
        editResponseText.value = props.review.response;
      }
    });
    
    return {
      // State
      userVote,
      isVoting,
      isSubmitting,
      responseDialog,
      editResponseDialog,
      reportDialog,
      moderationDialog,
      confirmDeleteDialog,
      imageDialog,
      responseText,
      editResponseText,
      reportReason,
      reportDescription,
      moderationStatus,
      moderationReason,
      responseRules,
      reportReasons,
      
      // Computed
      canManageReview,
      isOwnReview,
      canReport,
      isResponseValid,
      isEditResponseValid,
      currentImage,
      orderItems,
      
      // Methods
      formatDate,
      formatTag,
      voteHelpful,
      voteUnhelpful,
      submitResponse,
      updateResponse,
      submitReport,
      submitModeration,
      deleteReview,
      openImageDialog,
      nextImage,
      prevImage
    };
  }
};
</script>

<style scoped>
.restaurant-response {
  background-color: rgba(0, 0, 0, 0.02);
}

.review-images-container {
  max-width: 100%;
  overflow-x: auto;
}

.cursor-pointer {
  cursor: pointer;
}

.cursor-pointer:hover {
  opacity: 0.9;
}
</style>