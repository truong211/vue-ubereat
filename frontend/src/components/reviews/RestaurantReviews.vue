<!-- Restaurant Reviews Component -->
<template>
  <div class="restaurant-reviews">
    <!-- Review Statistics -->
    <div class="review-stats bg-white p-4 rounded-lg shadow mb-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="overall-rating text-center">
          <div class="text-4xl font-bold text-primary">{{ stats.average }}</div>
          <div class="text-sm text-gray-600">{{ stats.total }} đánh giá</div>
          <star-rating :rating="parseFloat(stats.average)" :readonly="true" />
        </div>
        <div class="rating-distribution col-span-2">
          <div v-for="i in 5" :key="i" class="flex items-center mb-1">
            <span class="w-8 text-sm">{{ i }}★</span>
            <div class="flex-1 mx-2">
              <div class="bg-gray-200 rounded-full h-2">
                <div
                  class="bg-primary h-2 rounded-full"
                  :style="{
                    width: `${(stats.distribution[i] || 0) / stats.total * 100}%`
                  }"
                ></div>
              </div>
            </div>
            <span class="w-12 text-sm text-gray-600">
              {{ stats.distribution[i] || 0 }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter & Sort Controls -->
    <div class="controls bg-white p-4 rounded-lg shadow mb-4">
      <div class="flex flex-wrap gap-4 items-center">
        <!-- Rating Filter -->
        <div class="rating-filter">
          <select
            v-model="filters.rating"
            @change="loadReviews"
            class="form-select rounded-md border-gray-300"
          >
            <option value="">Tất cả đánh giá</option>
            <option v-for="i in 5" :key="i" :value="i">
              {{ i }} sao
            </option>
          </select>
        </div>

        <!-- Has Response Filter -->
        <div class="has-response-filter">
          <select
            v-model="filters.hasResponse"
            @change="loadReviews"
            class="form-select rounded-md border-gray-300"
          >
            <option value="">Tất cả phản hồi</option>
            <option value="true">Có phản hồi</option>
            <option value="false">Chưa phản hồi</option>
          </select>
        </div>

        <!-- Sort Control -->
        <div class="sort-control ml-auto">
          <select
            v-model="sortBy"
            @change="loadReviews"
            class="form-select rounded-md border-gray-300"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="highest">Điểm cao nhất</option>
            <option value="lowest">Điểm thấp nhất</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Review List -->
    <div class="review-list space-y-4">
      <div
        v-for="review in reviews"
        :key="review.id"
        class="review-item bg-white p-4 rounded-lg shadow"
      >
        <div class="flex items-start">
          <!-- User Info -->
          <div class="user-info w-16">
            <img
              :src="review.user.profileImage || '/img/default-avatar.png'"
              :alt="review.user.fullName"
              class="w-12 h-12 rounded-full object-cover"
            />
          </div>

          <!-- Review Content -->
          <div class="flex-1">
            <div class="flex items-center mb-2">
              <h4 class="font-semibold mr-2">{{ review.user.fullName }}</h4>
              <span class="text-sm text-gray-500">
                {{ formatDate(review.createdAt) }}
              </span>
            </div>

            <star-rating
              :rating="review.rating"
              :readonly="true"
              class="mb-2"
            />

            <p class="text-gray-700 mb-4">{{ review.comment }}</p>

            <!-- Review Images -->
            <div v-if="review.images?.length" class="review-images mb-4">
              <div class="grid grid-cols-5 gap-2">
                <div
                  v-for="(image, index) in review.images"
                  :key="index"
                  class="relative"
                >
                  <img
                    :src="image"
                    @click="openImageGallery(review.images, index)"
                    class="w-full h-24 object-cover rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <!-- Review Actions -->
            <div class="review-actions flex items-center space-x-4 text-sm">
              <button
                @click="handleVote(review.id, true)"
                :class="{
                  'text-primary': review.userLiked,
                  'text-gray-500': !review.userLiked
                }"
                class="flex items-center space-x-1 hover:text-primary"
              >
                <i class="fas fa-thumbs-up"></i>
                <span>{{ review.helpfulVotes || 0 }}</span>
              </button>

              <button
                @click="handleVote(review.id, false)"
                :class="{
                  'text-primary': review.userDisliked,
                  'text-gray-500': !review.userDisliked
                }"
                class="flex items-center space-x-1 hover:text-primary"
              >
                <i class="fas fa-thumbs-down"></i>
                <span>{{ review.unhelpfulVotes || 0 }}</span>
              </button>

              <button
                @click="showReportDialog(review)"
                class="text-gray-500 hover:text-red-500"
              >
                <i class="fas fa-flag"></i>
                <span>Báo cáo</span>
              </button>
            </div>

            <!-- Restaurant Response -->
            <div
              v-if="review.response"
              class="restaurant-response mt-4 pl-4 border-l-4 border-primary"
            >
              <div class="text-sm text-gray-500 mb-1">
                Phản hồi từ nhà hàng - {{ formatDate(review.responseDate) }}
              </div>
              <p class="text-gray-700">{{ review.response }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination mt-4 flex justify-center">
      <button
        v-for="page in totalPages"
        :key="page"
        @click="changePage(page)"
        :class="{
          'bg-primary text-white': currentPage === page,
          'bg-gray-200 text-gray-700': currentPage !== page
        }"
        class="mx-1 px-4 py-2 rounded"
      >
        {{ page }}
      </button>
    </div>

    <!-- Report Dialog -->
    <modal v-model="showReport">
      <template #title>Báo cáo đánh giá</template>
      <template #content>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Lý do báo cáo
            </label>
            <select
              v-model="reportForm.reason"
              class="form-select w-full rounded-md border-gray-300"
            >
              <option value="spam">Spam</option>
              <option value="inappropriate">Nội dung không phù hợp</option>
              <option value="fake">Đánh giá giả mạo</option>
              <option value="other">Lý do khác</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Mô tả chi tiết
            </label>
            <textarea
              v-model="reportForm.description"
              rows="3"
              class="form-textarea w-full rounded-md border-gray-300"
              placeholder="Vui lòng mô tả chi tiết lý do báo cáo..."
            ></textarea>
          </div>
        </div>
      </template>
      <template #footer>
        <button
          @click="submitReport"
          class="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark"
        >
          Gửi báo cáo
        </button>
        <button
          @click="showReport = false"
          class="ml-2 px-4 py-2 rounded border hover:bg-gray-100"
        >
          Hủy
        </button>
      </template>
    </modal>

    <!-- Image Gallery -->
    <modal v-model="showGallery" class="image-gallery-modal">
      <template #content>
        <div class="relative">
          <button
            @click="prevImage"
            class="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-3xl"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          <img
            :src="currentGalleryImage"
            class="max-w-full max-h-[80vh] mx-auto"
          />
          <button
            @click="nextImage"
            class="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-3xl"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </template>
    </modal>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import StarRating from '@/components/common/StarRating.vue'
import Modal from '@/components/common/Modal.vue'
import { formatDate } from '@/utils/date'
import reviewApi from '@/services/api/review'

export default {
  name: 'RestaurantReviews',
  components: {
    StarRating,
    Modal
  },
  props: {
    restaurantId: {
      type: Number,
      required: true
    }
  },
  setup(props) {
    const toast = useToast()
    const reviews = ref([])
    const stats = ref({
      average: 0,
      total: 0,
      distribution: {}
    })
    const currentPage = ref(1)
    const totalPages = ref(1)
    const sortBy = ref('newest')
    const filters = ref({
      rating: '',
      hasResponse: ''
    })

    // Report dialog
    const showReport = ref(false)
    const reportedReview = ref(null)
    const reportForm = ref({
      reason: '',
      description: ''
    })

    // Image gallery
    const showGallery = ref(false)
    const galleryImages = ref([])
    const currentImageIndex = ref(0)
    const currentGalleryImage = computed(() => galleryImages.value[currentImageIndex.value])

    const loadReviews = async (page = 1) => {
      try {
        const response = await reviewApi.getRestaurantReviews(props.restaurantId, {
          page,
          sort: sortBy.value,
          ...filters.value
        })

        reviews.value = response.data.reviews
        stats.value = response.data.stats
        totalPages.value = response.data.totalPages
        currentPage.value = page
      } catch (error) {
        toast.error('Có lỗi khi tải đánh giá')
      }
    }

    const handleVote = async (reviewId, isHelpful) => {
      try {
        const response = await reviewApi.voteReview(reviewId, { isHelpful })
        const index = reviews.value.findIndex(r => r.id === reviewId)
        if (index !== -1) {
          reviews.value[index] = response.data.review
        }
      } catch (error) {
        toast.error('Có lỗi khi đánh giá bình luận')
      }
    }

    const showReportDialog = (review) => {
      reportedReview.value = review
      reportForm.value = { reason: '', description: '' }
      showReport.value = true
    }

    const submitReport = async () => {
      try {
        await reviewApi.reportReview(reportedReview.value.id, reportForm.value)
        toast.success('Đã gửi báo cáo thành công')
        showReport.value = false
      } catch (error) {
        toast.error('Có lỗi khi gửi báo cáo')
      }
    }

    const openImageGallery = (images, index) => {
      galleryImages.value = images
      currentImageIndex.value = index
      showGallery.value = true
    }

    const prevImage = () => {
      currentImageIndex.value = (currentImageIndex.value - 1 + galleryImages.value.length) % galleryImages.value.length
    }

    const nextImage = () => {
      currentImageIndex.value = (currentImageIndex.value + 1) % galleryImages.value.length
    }

    onMounted(() => {
      loadReviews()
    })

    return {
      reviews,
      stats,
      currentPage,
      totalPages,
      sortBy,
      filters,
      showReport,
      reportForm,
      showGallery,
      currentGalleryImage,
      formatDate,
      loadReviews,
      handleVote,
      showReportDialog,
      submitReport,
      openImageGallery,
      prevImage,
      nextImage
    }
  }
}
</script>

<style scoped>
.review-stats {
  background: linear-gradient(to right, #ffffff, #f8f9fa);
}

.image-gallery-modal {
  :deep(.modal-container) {
    max-width: 90vw;
    background: rgba(0, 0, 0, 0.9);
  }
}
</style>