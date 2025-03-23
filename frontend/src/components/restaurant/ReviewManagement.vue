<!-- Review Management Component -->
<template>
  <div class="review-management">
    <div class="stats-cards grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="stat-card bg-white p-4 rounded-lg shadow">
        <div class="text-sm text-gray-600">Tổng số đánh giá</div>
        <div class="text-2xl font-bold">{{ stats.totalReviews }}</div>
      </div>
      <div class="stat-card bg-white p-4 rounded-lg shadow">
        <div class="text-sm text-gray-600">Điểm trung bình</div>
        <div class="text-2xl font-bold text-primary">{{ stats.averageRating }}</div>
      </div>
      <div class="stat-card bg-white p-4 rounded-lg shadow">
        <div class="text-sm text-gray-600">Chưa phản hồi</div>
        <div class="text-2xl font-bold text-orange-500">{{ stats.pendingResponses }}</div>
      </div>
      <div class="stat-card bg-white p-4 rounded-lg shadow">
        <div class="text-sm text-gray-600">Đã phản hồi</div>
        <div class="text-2xl font-bold text-green-500">{{ stats.respondedReviews }}</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters bg-white p-4 rounded-lg shadow mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="filter-group">
          <label class="block text-sm text-gray-600 mb-1">Trạng thái phản hồi</label>
          <select 
            v-model="filters.responseStatus" 
            class="form-select w-full rounded-md border-gray-300"
            @change="loadReviews"
          >
            <option value="">Tất cả</option>
            <option value="pending">Chưa phản hồi</option>
            <option value="responded">Đã phản hồi</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="block text-sm text-gray-600 mb-1">Đánh giá</label>
          <select 
            v-model="filters.rating" 
            class="form-select w-full rounded-md border-gray-300"
            @change="loadReviews"
          >
            <option value="">Tất cả</option>
            <option v-for="i in 5" :key="i" :value="i">{{ i }} sao</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="block text-sm text-gray-600 mb-1">Sắp xếp theo</label>
          <select 
            v-model="filters.sortBy" 
            class="form-select w-full rounded-md border-gray-300"
            @change="loadReviews"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="rating-high">Điểm cao nhất</option>
            <option value="rating-low">Điểm thấp nhất</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="block text-sm text-gray-600 mb-1">Tìm kiếm</label>
          <input 
            v-model="filters.search" 
            type="text" 
            class="form-input w-full rounded-md border-gray-300"
            placeholder="Tìm theo nội dung..."
            @input="debounceSearch"
          />
        </div>
      </div>
    </div>

    <!-- Reviews List -->
    <div class="reviews-list space-y-4">
      <div v-for="review in reviews" :key="review.id" class="review-item bg-white p-4 rounded-lg shadow">
        <div class="flex items-start">
          <div class="flex-1">
            <div class="flex justify-between items-start mb-2">
              <div>
                <div class="flex items-center">
                  <h4 class="font-semibold">{{ review.user.fullName }}</h4>
                  <span class="mx-2 text-gray-400">•</span>
                  <star-rating :rating="review.rating" :readonly="true" />
                </div>
                <div class="text-sm text-gray-500">{{ formatDate(review.createdAt) }}</div>
              </div>
              <div class="text-sm">
                <span 
                  :class="{
                    'text-orange-500': !review.response,
                    'text-green-500': review.response
                  }"
                >
                  {{ review.response ? 'Đã phản hồi' : 'Chưa phản hồi' }}
                </span>
              </div>
            </div>

            <p class="text-gray-700 mb-4">{{ review.comment }}</p>

            <!-- Review Images -->
            <div v-if="review.images?.length" class="review-images mb-4">
              <div class="grid grid-cols-6 gap-2">
                <div 
                  v-for="(image, index) in review.images" 
                  :key="index"
                  class="relative"
                >
                  <img 
                    :src="image" 
                    @click="openImageGallery(review.images, index)"
                    class="w-full h-20 object-cover rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <!-- Response Section -->
            <div class="response-section mt-4">
              <template v-if="review.response">
                <div class="existing-response pl-4 border-l-4 border-green-500">
                  <div class="text-sm text-gray-500 mb-1">
                    Phản hồi của bạn - {{ formatDate(review.responseDate) }}
                  </div>
                  <p class="text-gray-700">{{ review.response }}</p>
                  <div class="mt-2">
                    <button 
                      @click="editResponse(review)"
                      class="text-sm text-primary hover:text-primary-dark"
                    >
                      Chỉnh sửa phản hồi
                    </button>
                  </div>
                </div>
              </template>
              <template v-else>
                <button 
                  @click="addResponse(review)"
                  class="text-primary hover:text-primary-dark"
                >
                  + Thêm phản hồi
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination mt-6 flex justify-center">
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

    <!-- Response Dialog -->
    <modal v-model="showResponseDialog">
      <template #title>
        {{ editingResponse ? 'Chỉnh sửa phản hồi' : 'Thêm phản hồi' }}
      </template>
      <template #content>
        <div class="space-y-4">
          <div class="original-review p-4 bg-gray-50 rounded">
            <div class="flex items-center mb-2">
              <span class="font-semibold">{{ selectedReview?.user?.fullName }}</span>
              <span class="mx-2">•</span>
              <star-rating :rating="selectedReview?.rating" :readonly="true" />
            </div>
            <p class="text-gray-700">{{ selectedReview?.comment }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Phản hồi của bạn
            </label>
            <textarea
              v-model="responseForm.content"
              rows="4"
              class="form-textarea w-full rounded-md border-gray-300"
              placeholder="Nhập phản hồi của bạn..."
            ></textarea>
          </div>
        </div>
      </template>
      <template #footer>
        <button
          @click="submitResponse"
          class="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark"
          :disabled="!responseForm.content.trim()"
        >
          {{ editingResponse ? 'Cập nhật' : 'Gửi phản hồi' }}
        </button>
        <button
          @click="showResponseDialog = false"
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
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import StarRating from '@/components/common/StarRating.vue'
import Modal from '@/components/common/Modal.vue'
import { formatDate } from '@/utils/date'
import reviewApi from '@/services/api/review'
import debounce from 'lodash/debounce'

export default {
  name: 'ReviewManagement',
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
      totalReviews: 0,
      averageRating: 0,
      pendingResponses: 0,
      respondedReviews: 0
    })
    const currentPage = ref(1)
    const totalPages = ref(1)
    const filters = ref({
      responseStatus: '',
      rating: '',
      sortBy: 'newest',
      search: ''
    })

    // Response dialog
    const showResponseDialog = ref(false)
    const selectedReview = ref(null)
    const editingResponse = ref(false)
    const responseForm = ref({
      content: ''
    })

    // Image gallery
    const showGallery = ref(false)
    const galleryImages = ref([])
    const currentImageIndex = ref(0)
    const currentGalleryImage = computed(() => galleryImages.value[currentImageIndex.value])

    const loadReviews = async (page = 1) => {
      try {
        const response = await reviewApi.getRestaurantReviewsForManagement(
          props.restaurantId,
          {
            page,
            ...filters.value
          }
        )

        reviews.value = response.data.reviews
        stats.value = response.data.stats
        totalPages.value = response.data.totalPages
        currentPage.value = page
      } catch (error) {
        toast.error('Có lỗi khi tải đánh giá')
      }
    }

    const debounceSearch = debounce(() => {
      loadReviews(1)
    }, 300)

    const addResponse = (review) => {
      selectedReview.value = review
      editingResponse.value = false
      responseForm.value.content = ''
      showResponseDialog.value = true
    }

    const editResponse = (review) => {
      selectedReview.value = review
      editingResponse.value = true
      responseForm.value.content = review.response
      showResponseDialog.value = true
    }

    const submitResponse = async () => {
      if (!responseForm.value.content.trim()) return

      try {
        const response = await reviewApi.respondToReview(
          selectedReview.value.id,
          {
            response: responseForm.value.content
          }
        )

        const index = reviews.value.findIndex(r => r.id === selectedReview.value.id)
        if (index !== -1) {
          reviews.value[index] = response.data.review
        }

        stats.value = response.data.stats
        showResponseDialog.value = false
        toast.success(
          editingResponse.value 
            ? 'Đã cập nhật phản hồi thành công'
            : 'Đã gửi phản hồi thành công'
        )
      } catch (error) {
        toast.error('Có lỗi khi gửi phản hồi')
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

    const changePage = (page) => {
      loadReviews(page)
    }

    onMounted(() => {
      loadReviews()
    })

    return {
      reviews,
      stats,
      currentPage,
      totalPages,
      filters,
      showResponseDialog,
      selectedReview,
      editingResponse,
      responseForm,
      showGallery,
      currentGalleryImage,
      formatDate,
      loadReviews,
      addResponse,
      editResponse,
      submitResponse,
      openImageGallery,
      prevImage,
      nextImage,
      changePage
    }
  }
}
</script>

<style scoped>
.image-gallery-modal {
  :deep(.modal-container) {
    max-width: 90vw;
    background: rgba(0, 0, 0, 0.9);
  }
}
</style>