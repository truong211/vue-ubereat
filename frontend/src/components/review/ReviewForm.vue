<template>
  <div class="review-form">
    <v-form ref="form" v-model="isValid" @submit.prevent="submitReview">
      <div class="text-center mb-4">
        <v-rating
          v-model="review.rating"
          color="amber"
          hover
          half-increments
          size="large"
          :rules="ratingRules"
        ></v-rating>
        <div class="text-caption mt-1">{{ getRatingLabel(review.rating) }}</div>
      </div>

      <v-textarea
        v-model="review.comment"
        label="Your Review"
        placeholder="Share your experience..."
        variant="outlined"
        :rules="commentRules"
        counter="500"
        rows="4"
      ></v-textarea>

      <v-file-input
        v-model="review.photos"
        label="Add Photos"
        accept="image/*"
        prepend-icon="mdi-camera"
        :show-size="true"
        multiple
        :rules="photoRules"
      >
        <template v-slot:selection="{ fileNames }">
          <template v-for="fileName in fileNames" :key="fileName">
            <v-chip
              label
              size="small"
              class="me-2"
            >
              {{ fileName }}
            </v-chip>
          </template>
        </template>
      </v-file-input>

      <div class="d-flex justify-end mt-4">
        <v-btn
          v-if="canCancel"
          variant="outlined"
          class="me-2"
          @click="$emit('cancel')"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          type="submit"
          :loading="loading"
          :disabled="!isValid || loading"
        >
          Submit Review
        </v-btn>
      </div>
    </v-form>
  </div>
</template>

<script>
export default {
  name: 'ReviewForm',

  props: {
    orderId: {
      type: [String, Number],
      required: true
    },
    restaurantId: {
      type: [String, Number],
      required: true
    },
    productId: {
      type: [String, Number],
      default: null
    },
    initialRating: {
      type: Number,
      default: 0
    },
    initialComment: {
      type: String,
      default: ''
    },
    loading: {
      type: Boolean,
      default: false
    },
    canCancel: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      isValid: false,
      review: {
        rating: this.initialRating,
        comment: this.initialComment,
        photos: []
      },
      ratingRules: [
        v => !!v || 'Rating is required',
        v => v > 0 || 'Please select a rating'
      ],
      commentRules: [
        v => !!v || 'Review comment is required',
        v => v.length >= 10 || 'Review must be at least 10 characters',
        v => v.length <= 500 || 'Review cannot exceed 500 characters'
      ],
      photoRules: [
        files => !files || files.length <= 5 || 'Maximum 5 photos allowed',
        files => !files || !files.some(f => f.size > 5000000) || 'Photos must be less than 5MB'
      ]
    };
  },

  methods: {
    getRatingLabel(rating) {
      const labels = {
        1: 'Poor',
        2: 'Fair',
        3: 'Good',
        4: 'Very Good',
        5: 'Excellent'
      };
      return labels[Math.round(rating)] || 'Select a rating';
    },

    async submitReview() {
      if (!this.$refs.form.validate()) return;

      const reviewData = {
        orderId: this.orderId,
        restaurantId: this.restaurantId,
        productId: this.productId,
        rating: this.review.rating,
        comment: this.review.comment,
        photos: await this.processPhotos()
      };

      this.$emit('submit', reviewData);
    },

    async processPhotos() {
      if (!this.review.photos?.length) return [];

      // Convert photos to base64 strings
      const photoPromises = this.review.photos.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target.result);
          reader.readAsDataURL(file);
        });
      });

      return Promise.all(photoPromises);
    },

    reset() {
      this.$refs.form.reset();
      this.review = {
        rating: 0,
        comment: '',
        photos: []
      };
    }
  }
};
</script>

<style scoped>
.review-form {
  max-width: 600px;
  margin: 0 auto;
}
</style>