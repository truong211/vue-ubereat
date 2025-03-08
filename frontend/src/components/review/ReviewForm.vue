<template>
  <div class="review-form">
    <!-- Form Title -->
    <slot name="title">
      <h3 class="text-h6 mb-4" v-if="showTitle">{{ title }}</h3>
    </slot>
    
    <v-form ref="form" v-model="valid" @submit.prevent="submitReview">
      <!-- Rating Section -->
      <div class="rating-section">
        <!-- Restaurant Rating -->
        <div v-if="showRestaurantRating" class="mb-5 text-center">
          <div class="text-subtitle-1 mb-2">{{ restaurantRatingLabel }}</div>
          <v-rating
            v-model="review.restaurantRating"
            color="amber"
            hover
            half-increments
            size="large"
            required
          ></v-rating>
          <div class="text-caption mt-1">{{ getRatingLabel(review.restaurantRating) }}</div>
        </div>
        
        <!-- Food Rating -->
        <div v-if="showFoodRating" class="mb-5 text-center">
          <div class="text-subtitle-1 mb-2">{{ foodRatingLabel }}</div>
          <v-rating
            v-model="review.foodRating"
            color="amber"
            hover
            half-increments
            size="large"
            required
          ></v-rating>
          <div class="text-caption mt-1">{{ getRatingLabel(review.foodRating) }}</div>
        </div>
        
        <!-- Delivery Rating -->
        <div v-if="showDeliveryRating" class="mb-5 text-center">
          <div class="text-subtitle-1 mb-2">{{ deliveryRatingLabel }}</div>
          <v-rating
            v-model="review.deliveryRating"
            color="amber"
            hover
            half-increments
            size="large"
            required
          ></v-rating>
          <div class="text-caption mt-1">{{ getRatingLabel(review.deliveryRating) }}</div>
        </div>
      </div>
      
      <!-- Photo Upload -->
      <div v-if="allowPhotos" class="photo-upload mb-4">
        <div class="d-flex align-center mb-2">
          <span class="text-subtitle-2">Add Photos</span>
          <v-spacer></v-spacer>
          <span class="text-caption text-medium-emphasis">{{ review.photos.length }}/{{ maxPhotos }} photos</span>
        </div>
        
        <div class="d-flex flex-wrap photos-container">
          <!-- Existing Photos -->
          <div
            v-for="(photo, index) in review.photos"
            :key="'photo-' + index"
            class="photo-preview ma-1"
          >
            <v-img
              :src="photo.url || photo"
              aspect-ratio="1"
              cover
              width="80"
              height="80"
              class="rounded"
            >
              <div class="remove-photo-overlay">
                <v-btn
                  icon="mdi-close"
                  size="small"
                  color="white"
                  variant="text"
                  @click="removePhoto(index)"
                ></v-btn>
              </div>
            </v-img>
          </div>
          
          <!-- Add Photo Button -->
          <div v-if="review.photos.length < maxPhotos" class="add-photo-btn ma-1">
            <v-btn
              icon="mdi-camera-plus"
              variant="outlined"
              size="large"
              color="primary"
              width="80"
              height="80"
              @click="triggerFileInput"
            ></v-btn>
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              multiple
              class="d-none"
              @change="handleFileUpload"
            />
          </div>
        </div>
      </div>
      
      <!-- Review Text -->
      <v-textarea
        v-model="review.comment"
        :label="commentLabel"
        :placeholder="commentPlaceholder"
        variant="outlined"
        rows="3"
        counter="500"
        :rules="commentRules"
        hide-details="auto"
        class="mb-4"
        auto-grow
      ></v-textarea>
      
      <!-- Additional Fields -->
      <slot name="additional-fields" :review="review"></slot>
      
      <!-- Review Tips -->
      <div v-if="showTips" class="review-tips mb-4 pa-3 rounded">
        <div class="text-subtitle-2 mb-2">Tips for a helpful review:</div>
        <ul class="text-body-2">
          <li>Describe your experience with the food and service</li>
          <li>Mention specific dishes you tried</li>
          <li>Did the food arrive as expected?</li>
          <li>Was the delivery on time?</li>
        </ul>
      </div>
      
      <!-- Submit Button -->
      <div class="d-flex justify-space-between mt-4">
        <slot name="actions-left"></slot>
        <slot name="actions">
          <v-btn
            type="submit"
            color="primary"
            :loading="isSubmitting"
            :disabled="!isValid"
            :block="fullWidthButton"
          >
            {{ submitButtonText }}
          </v-btn>
        </slot>
      </div>
    </v-form>
  </div>
</template>

<script>
import { ref, computed } from 'vue';

export default {
  name: 'ReviewForm',
  
  props: {
    // Review data
    initialData: {
      type: Object,
      default: () => ({})
    },
    
    // Form targets
    restaurantId: {
      type: [String, Number],
      default: null
    },
    
    orderId: {
      type: [String, Number],
      default: null
    },
    
    productId: {
      type: [String, Number],
      default: null
    },
    
    // Form configuration
    title: {
      type: String,
      default: 'Write a Review'
    },
    
    showTitle: {
      type: Boolean,
      default: true
    },
    
    showRestaurantRating: {
      type: Boolean,
      default: true
    },
    
    restaurantRatingLabel: {
      type: String,
      default: 'How would you rate this restaurant?'
    },
    
    showFoodRating: {
      type: Boolean,
      default: true
    },
    
    foodRatingLabel: {
      type: String,
      default: 'How was the food?'
    },
    
    showDeliveryRating: {
      type: Boolean,
      default: true
    },
    
    deliveryRatingLabel: {
      type: String,
      default: 'How was the delivery experience?'
    },
    
    commentLabel: {
      type: String,
      default: 'Your Review'
    },
    
    commentPlaceholder: {
      type: String,
      default: 'Tell others about your experience...'
    },
    
    commentRequired: {
      type: Boolean,
      default: false
    },
    
    commentMinLength: {
      type: Number,
      default: 0
    },
    
    submitButtonText: {
      type: String,
      default: 'Submit Review'
    },
    
    fullWidthButton: {
      type: Boolean,
      default: false
    },
    
    showTips: {
      type: Boolean,
      default: true
    },
    
    allowPhotos: {
      type: Boolean,
      default: true
    },
    
    maxPhotos: {
      type: Number,
      default: 5
    }
  },
  
  emits: ['submit', 'photo-added', 'photo-removed'],
  
  setup(props, { emit }) {
    const form = ref(null);
    const fileInput = ref(null);
    const valid = ref(false);
    const isSubmitting = ref(false);
    
    // Initialize review object
    const review = ref({
      restaurantRating: props.initialData.restaurantRating || 0,
      foodRating: props.initialData.foodRating || 0,
      deliveryRating: props.initialData.deliveryRating || 0,
      comment: props.initialData.comment || '',
      photos: props.initialData.photos || []
    });
    
    // Form validation
    const commentRules = computed(() => {
      const rules = [];
      
      if (props.commentRequired) {
        rules.push(v => !!v || 'Review text is required');
      }
      
      if (props.commentMinLength > 0) {
        rules.push(v => !v || v.length >= props.commentMinLength || 
          `Your review must be at least ${props.commentMinLength} characters`);
      }
      
      return rules;
    });
    
    // Check if form is valid for submission
    const isValid = computed(() => {
      // At least one rating must be provided
      const hasRating = 
        (props.showRestaurantRating && review.value.restaurantRating > 0) ||
        (props.showFoodRating && review.value.foodRating > 0) ||
        (props.showDeliveryRating && review.value.deliveryRating > 0);
      
      // Comment must be valid if required
      const hasValidComment = !props.commentRequired || 
        (review.value.comment && review.value.comment.length >= props.commentMinLength);
      
      return hasRating && hasValidComment && valid.value;
    });
    
    // Rating label helper
    const getRatingLabel = (rating) => {
      if (!rating) return '';
      if (rating < 1.5) return 'Poor';
      if (rating < 2.5) return 'Fair';
      if (rating < 3.5) return 'Good';
      if (rating < 4.5) return 'Very Good';
      return 'Excellent';
    };
    
    // Photo management
    const triggerFileInput = () => {
      fileInput.value?.click();
    };
    
    const handleFileUpload = (event) => {
      const files = event.target.files;
      if (!files.length) return;
      
      const availableSlots = props.maxPhotos - review.value.photos.length;
      const filesToProcess = Math.min(files.length, availableSlots);
      
      for (let i = 0; i < filesToProcess; i++) {
        const file = files[i];
        const reader = new FileReader();
        
        reader.onload = (e) => {
          const photoData = {
            file: file,
            url: e.target.result
          };
          
          review.value.photos.push(photoData);
          emit('photo-added', photoData);
          
          // Clear input value to allow selecting the same file again
          if (fileInput.value) {
            fileInput.value.value = '';
          }
        };
        
        reader.readAsDataURL(file);
      }
    };
    
    const removePhoto = (index) => {
      const removedPhoto = review.value.photos.splice(index, 1)[0];
      emit('photo-removed', removedPhoto, index);
    };
    
    // Form submission
    const submitReview = async () => {
      if (!isValid.value) return;
      
      isSubmitting.value = true;
      
      try {
        // Prepare review data
        const reviewData = {
          ...review.value,
          restaurantId: props.restaurantId,
          orderId: props.orderId,
          productId: props.productId,
          date: new Date().toISOString(),
        };
        
        // Emit submit event with review data
        emit('submit', reviewData);
      } catch (error) {
        console.error('Error submitting review:', error);
      } finally {
        isSubmitting.value = false;
      }
    };
    
    return {
      form,
      fileInput,
      valid,
      review,
      isSubmitting,
      commentRules,
      isValid,
      getRatingLabel,
      triggerFileInput,
      handleFileUpload,
      removePhoto,
      submitReview
    };
  }
};
</script>

<style scoped>
.review-tips {
  background-color: #f5f5f5;
  border-left: 4px solid #1976d2;
}

.review-tips ul {
  padding-left: 20px;
  margin: 0;
}

.photos-container {
  gap: 8px;
}

.photo-preview {
  position: relative;
}

.remove-photo-overlay {
  position: absolute;
  top: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 0 0 0 8px;
}

.add-photo-btn {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>