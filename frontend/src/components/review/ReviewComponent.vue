<template>
  <div class="review-section">
    <!-- Rating Overview -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" sm="4" class="text-center">
            <div class="text-h2 font-weight-bold">{{ stats.average || 0 }}</div>
            <v-rating
              :model-value="parseFloat(stats.average)"
              color="amber"
              half-increments
              readonly
            ></v-rating>
            <div class="text-subtitle-1">{{ stats.total }} đánh giá</div>
          </v-col>
          
          <v-divider vertical class="d-none d-sm-flex"></v-divider>
          
          <v-col cols="12" sm="8">
            <div v-for="n in 5" :key="n" class="d-flex align-center mb-2">
              <div class="text-body-2 mr-4" style="width: 20px">{{ 6-n }}</div>
              <v-progress-linear
                :model-value="getRatingPercentage(6-n)"
                color="amber"
                height="8"
                rounded
              ></v-progress-linear>
              <div class="text-body-2 ml-4" style="width: 50px">
                {{ stats.distribution[6-n] || 0 }}
              </div>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Review Form -->
    <v-card v-if="canReview" class="mb-4">
      <v-card-title>Viết đánh giá</v-card-title>
      <v-card-text>
        <v-form ref="reviewForm" v-model="isReviewFormValid">
          <div class="d-flex align-center mb-4">
            <span class="text-subtitle-1 mr-4">Đánh giá của bạn</span>
            <v-rating
              v-model="newReview.rating"
              color="amber"
              hover
              :rules="ratingRules"
            ></v-rating>
          </div>

          <v-textarea
            v-model="newReview.comment"
            label="Nhận xét của bạn"
            :rules="commentRules"
            counter="2000"
            rows="4"
          ></v-textarea>

          <v-file-input
            v-model="newReview.images"
            label="Thêm hình ảnh"
            accept="image/*"
            multiple
            :rules="imageRules"
            prepend-icon="mdi-camera"
            show-size
            counter
            max-files="5"
          ></v-file-input>

          <v-btn
            color="primary"
            :loading="isSubmitting"
            :disabled="!isReviewFormValid"
            @click="submitReview"
          >
            Gửi đánh giá
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- Reviews List -->
    <div class="reviews-filters mb-4">
      <v-row>
        <v-col cols="12" sm="4">
          <v-select
            v-model="filters.rating"
            :items="ratingFilterOptions"
            label="Lọc theo số sao"
          ></v-select>
        </v-col>
        <v-col cols="12" sm="4">
          <v-select
            v-model="filters.sort"
            :items="sortOptions"
            label="Sắp xếp"
          ></v-select>
        </v-col>
      </v-row>
    </div>

    <v-card v-for="review in reviews" :key="review.id" class="mb-4">
      <v-card-text>
        <div class="d-flex justify-space-between align-center mb-2">
          <div class="d-flex align-center">
            <v-avatar size="40" class="mr-4">
              <v-img :src="review.user.profileImage || '/default-avatar.png'"></v-img>
            </v-avatar>
            <div>
              <div class="text-subtitle-1 font-weight-medium">
                {{ review.user.fullName }}
              </div>
              <div class="text-caption">
                {{ formatDate(review.createdAt) }}
              </div>
            </div>
          </div>
          <v-rating
            :model-value="review.rating"
            color="amber"
            readonly
            dense
            half-increments
          ></v-rating>
        </div>

        <p class="text-body-1 my-4">{{ review.comment }}</p>

        <v-row v-if="review.images?.length" class="mt-2">
          <v-col v-for="(image, index) in review.images" :key="index" cols="auto">
            <v-img
              :src="image"
              width="100"
              height="100"
              cover
              class="rounded cursor-pointer"
              @click="openImageDialog(review.images, index)"
            ></v-img>
          </v-col>
        </v-row>

        <div class="d-flex align-center mt-4">
          <v-btn
            variant="text"
            :color="review.userVoted?.isHelpful ? 'primary' : ''"
            @click="voteReview(review, true)"
          >
            <v-icon left>mdi-thumb-up</v-icon>
            Hữu ích ({{ review.helpfulVotes || 0 }})
          </v-btn>

          <v-btn
            variant="text"
            :color="review.userVoted?.isHelpful === false ? 'error' : ''"
            @click="voteReview(review, false)"
          >
            <v-icon left>mdi-thumb-down</v-icon>
            Không hữu ích ({{ review.unhelpfulVotes || 0 }})
          </v-btn>

          <v-btn
            v-if="canReportReview(review)"
            variant="text"
            color="warning"
            @click="openReportDialog(review)"
          >
            <v-icon left>mdi-flag</v-icon>
            Báo cáo
          </v-btn>
        </div>

        <v-divider v-if="review.response" class="my-4"></v-divider>

        <div v-if="review.response" class="response-block pa-4 rounded bg-grey-lighten-4">
          <div class="text-subtitle-1 font-weight-medium mb-2">
            Phản hồi từ nhà hàng
          </div>
          <p class="text-body-2">{{ review.response }}</p>
          <div class="text-caption mt-2">
            {{ formatDate(review.responseDate) }}
          </div>
        </div>
      </v-card-text>
    </v-card>

    <div v-if="reviews.length === 0" class="text-center pa-4">
      <v-icon size="64" color="grey">mdi-star-outline</v-icon>
      <div class="text-h6 mt-2">Chưa có đánh giá nào</div>
      <div class="text-body-2 text-grey">Hãy là người đầu tiên đánh giá nhà hàng này</div>
    </div>

    <!-- Pagination -->
    <v-pagination
      v-if="totalPages > 1"
      v-model="currentPage"
      :length="totalPages"
      :total-visible="7"
    ></v-pagination>

    <!-- Report Dialog -->
    <v-dialog v-model="reportDialog.show" max-width="500">
      <v-card>
        <v-card-title>Báo cáo đánh giá</v-card-title>
        <v-card-text>
          <v-select
            v-model="reportDialog.reason"
            :items="reportReasons"
            label="Lý do báo cáo"
            required
          ></v-select>
          <v-textarea
            v-model="reportDialog.description"
            label="Mô tả chi tiết"
            rows="3"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="text"
            @click="reportDialog.show = false"
          >
            Hủy
          </v-btn>
          <v-btn
            color="primary"
            :loading="reportDialog.loading"
            @click="submitReport"
          >
            Gửi báo cáo
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Image Dialog -->
    <v-dialog v-model="imageDialog.show" max-width="800">
      <v-card>
        <v-img
          :src="imageDialog.images[imageDialog.currentIndex]"
          max-height="80vh"
          contain
        ></v-img>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            icon="mdi-chevron-left"
            @click="imageDialog.currentIndex = Math.max(0, imageDialog.currentIndex - 1)"
            :disabled="imageDialog.currentIndex === 0"
          ></v-btn>
          <v-btn
            icon="mdi-chevron-right"
            @click="imageDialog.currentIndex = Math.min(imageDialog.images.length - 1, imageDialog.currentIndex + 1)"
            :disabled="imageDialog.currentIndex === imageDialog.images.length - 1"
          ></v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

export default {
  name: 'ReviewComponent',
  
  props: {
    restaurantId: {
      type: [String, Number],
      required: true
    }
  },

  setup(props, { emit }) {
    const store = useStore()
    const router = useRouter()

    // Data
    const reviews = ref([])
    const stats = ref({
      average: 0,
      total: 0,
      distribution: {}
    })
    const currentPage = ref(1)
    const totalPages = ref(1)
    const filters = ref({
      rating: '',
      sort: 'newest'
    })

    // Review form
    const reviewForm = ref(null)
    const isReviewFormValid = ref(false)
    const isSubmitting = ref(false)
    const newReview = ref({
      rating: 0,
      comment: '',
      images: []
    })

    // Dialogs
    const reportDialog = ref({
      show: false,
      review: null,
      reason: '',
      description: '',
      loading: false
    })

    const imageDialog = ref({
      show: false,
      images: [],
      currentIndex: 0
    })

    // Options
    const ratingFilterOptions = [
      { title: 'Tất cả', value: '' },
      { title: '5 sao', value: 5 },
      { title: '4 sao', value: 4 },
      { title: '3 sao', value: 3 },
      { title: '2 sao', value: 2 },
      { title: '1 sao', value: 1 }
    ]

    const sortOptions = [
      { title: 'Mới nhất', value: 'newest' },
      { title: 'Cũ nhất', value: 'oldest' },
      { title: 'Đánh giá cao nhất', value: 'rating-high' },
      { title: 'Đánh giá thấp nhất', value: 'rating-low' }
    ]

    const reportReasons = [
      { title: 'Nội dung không phù hợp', value: 'inappropriate' },
      { title: 'Spam', value: 'spam' },
      { title: 'Thông tin sai sự thật', value: 'false_info' },
      { title: 'Khác', value: 'other' }
    ]

    // Validation rules
    const ratingRules = [
      v => !!v || 'Vui lòng chọn số sao',
      v => v >= 1 || 'Đánh giá phải từ 1 đến 5 sao'
    ]

    const commentRules = [
      v => !!v || 'Vui lòng nhập nhận xét',
      v => v.length >= 10 || 'Nhận xét phải có ít nhất 10 ký tự',
      v => v.length <= 2000 || 'Nhận xét không được quá 2000 ký tự'
    ]

    const imageRules = [
      files => !files || files.length <= 5 || 'Không được tải lên quá 5 ảnh',
      files => {
        if (!files) return true
        const maxSize = 5 * 1024 * 1024 // 5MB
        return !files.some(file => file.size > maxSize) || 'Mỗi ảnh không được quá 5MB'
      }
    ]

    // Computed
    const canReview = computed(() => {
      return store.getters.isAuthenticated
    })

    // Methods
    const loadReviews = async () => {
      try {
        const response = await store.dispatch('reviews/getRestaurantReviews', {
          restaurantId: props.restaurantId,
          page: currentPage.value,
          ...filters.value
        })
        
        reviews.value = response.data.reviews
        stats.value = response.data.stats
        totalPages.value = response.data.pagination.pages
      } catch (error) {
        console.error('Failed to load reviews:', error)
      }
    }

    const submitReview = async () => {
      if (!reviewForm.value.validate()) return

      isSubmitting.value = true
      
      try {
        const formData = new FormData()
        formData.append('restaurantId', props.restaurantId)
        formData.append('rating', newReview.value.rating)
        formData.append('comment', newReview.value.comment)
        
        if (newReview.value.images) {
          newReview.value.images.forEach(image => {
            formData.append('images', image)
          })
        }

        await store.dispatch('reviews/submitReview', formData)
        
        // Reset form
        newReview.value = {
          rating: 0,
          comment: '',
          images: []
        }
        reviewForm.value.reset()
        
        // Refresh reviews
        await loadReviews()
        
        emit('review-submitted')
      } catch (error) {
        console.error('Failed to submit review:', error)
      } finally {
        isSubmitting.value = false
      }
    }

    const voteReview = async (review, isHelpful) => {
      if (!store.getters.isAuthenticated) {
        router.push('/auth/login')
        return
      }

      try {
        await store.dispatch('reviews/voteReview', {
          reviewId: review.id,
          isHelpful
        })
        await loadReviews()
      } catch (error) {
        console.error('Failed to vote review:', error)
      }
    }

    const canReportReview = (review) => {
      return store.getters.isAuthenticated && review.userId !== store.getters.userId
    }

    const openReportDialog = (review) => {
      reportDialog.value = {
        show: true,
        review,
        reason: '',
        description: '',
        loading: false
      }
    }

    const submitReport = async () => {
      if (!reportDialog.value.reason) return
      
      reportDialog.value.loading = true
      
      try {
        await store.dispatch('reviews/reportReview', {
          reviewId: reportDialog.value.review.id,
          reason: reportDialog.value.reason,
          description: reportDialog.value.description
        })
        
        reportDialog.value.show = false
      } catch (error) {
        console.error('Failed to report review:', error)
      } finally {
        reportDialog.value.loading = false
      }
    }

    const openImageDialog = (images, index) => {
      imageDialog.value = {
        show: true,
        images,
        currentIndex: index
      }
    }

    const getRatingPercentage = (rating) => {
      if (!stats.value.total) return 0
      return (stats.value.distribution[rating] || 0) / stats.value.total * 100
    }

    const formatDate = (date) => {
      return format(new Date(date), 'dd MMMM yyyy', { locale: vi })
    }

    // Watch for changes
    watch([currentPage, filters], () => {
      loadReviews()
    })

    // Initial load
    onMounted(() => {
      loadReviews()
    })

    return {
      reviews,
      stats,
      currentPage,
      totalPages,
      filters,
      reviewForm,
      isReviewFormValid,
      isSubmitting,
      newReview,
      reportDialog,
      imageDialog,
      ratingFilterOptions,
      sortOptions,
      reportReasons,
      ratingRules,
      commentRules,
      imageRules,
      canReview,
      submitReview,
      voteReview,
      canReportReview,
      openReportDialog,
      submitReport,
      openImageDialog,
      getRatingPercentage,
      formatDate
    }
  }
}
</script>

<style scoped>
.response-block {
  background-color: #f5f5f5;
  border-left: 4px solid var(--v-primary-base);
}

.cursor-pointer {
  cursor: pointer;
}
</style>