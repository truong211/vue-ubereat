<template>
  <div class="restaurant-reviews">
    <!-- Header with filters -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="filters.search"
              label="Tìm kiếm đánh giá"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
              @keyup.enter="applyFilters"
            ></v-text-field>
          </v-col>

          <v-col cols="12" md="3">
            <v-select
              v-model="filters.rating"
              :items="ratingOptions"
              label="Đánh giá"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
            ></v-select>
          </v-col>

          <v-col cols="12" md="3">
            <v-select
              v-model="filters.hasReply"
              :items="replyOptions"
              label="Trạng thái phản hồi"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
            ></v-select>
          </v-col>

          <v-col cols="12" md="2">
            <v-btn
              color="primary"
              block
              @click="applyFilters"
            >
              Áp dụng
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Reviews List -->
    <div v-if="loading" class="d-flex justify-center align-center" style="height: 200px;">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>

    <template v-else>
      <div v-if="reviews.length > 0">
        <v-card v-for="review in reviews" :key="review.id" class="mb-4">
          <v-card-text>
            <div class="d-flex justify-space-between align-center mb-2">
              <div class="d-flex align-center">
                <v-avatar size="40" class="mr-2">
                  <v-img
                    v-if="review.user.avatar"
                    :src="review.user.avatar"
                    alt="User Avatar"
                  ></v-img>
                  <v-icon v-else>mdi-account</v-icon>
                </v-avatar>
                <div>
                  <div class="font-weight-medium">{{ review.user.name }}</div>
                  <div class="text-caption">{{ formatDate(review.createdAt) }}</div>
                </div>
              </div>
              <div>
                <v-rating
                  :model-value="review.rating"
                  color="amber"
                  density="compact"
                  half-increments
                  readonly
                  size="small"
                ></v-rating>
              </div>
            </div>

            <p class="text-body-1 mb-4">{{ review.comment }}</p>

            <div v-if="review.images && review.images.length > 0" class="mb-4">
              <v-row>
                <v-col v-for="(image, index) in review.images" :key="index" cols="auto">
                  <v-img
                    :src="image"
                    width="100"
                    height="100"
                    cover
                    class="rounded"
                    @click="openImageDialog(image)"
                  ></v-img>
                </v-col>
              </v-row>
            </div>

            <v-divider class="my-3"></v-divider>

            <div v-if="review.reply" class="pl-4 ml-4 mt-3 py-2 review-reply">
              <div class="d-flex align-center mb-2">
                <v-avatar size="32" color="primary" class="mr-2">
                  <v-icon color="white" size="small">mdi-store</v-icon>
                </v-avatar>
                <div>
                  <div class="font-weight-medium">Phản hồi từ nhà hàng</div>
                  <div class="text-caption">{{ formatDate(review.replyDate) }}</div>
                </div>
              </div>
              <p class="text-body-2">{{ review.reply }}</p>
            </div>

            <div v-if="!review.reply" class="mt-3">
              <v-text-field
                v-model="review.newReply"
                label="Viết phản hồi"
                variant="outlined"
                density="comfortable"
                hide-details
                append-inner-icon="mdi-send"
                @click:append-inner="replyToReview(review)"
              ></v-text-field>
            </div>
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              v-if="review.reply"
              variant="text"
              color="primary"
              @click="editReply(review)"
            >
              Chỉnh sửa phản hồi
            </v-btn>
            <v-btn
              variant="text"
              color="error"
              @click="reportReview(review)"
            >
              Báo cáo
            </v-btn>
          </v-card-actions>
        </v-card>

        <!-- Pagination -->
        <div class="d-flex justify-center mt-4">
          <v-pagination
            v-model="page"
            :length="totalPages"
            @update:model-value="handlePageChange"
          ></v-pagination>
        </div>
      </div>

      <v-card v-else class="text-center py-8">
        <v-icon size="64" color="grey-lighten-1">mdi-star-off</v-icon>
        <h3 class="text-h6 mt-4">Chưa có đánh giá nào</h3>
        <p class="text-body-1 mt-2">Nhà hàng chưa nhận được đánh giá nào từ khách hàng</p>
      </v-card>
    </template>

    <!-- Edit Reply Dialog -->
    <v-dialog v-model="replyDialog.show" max-width="500">
      <v-card>
        <v-card-title>Chỉnh sửa phản hồi</v-card-title>
        <v-card-text>
          <v-textarea
            v-model="replyDialog.reply"
            label="Phản hồi của nhà hàng"
            variant="outlined"
            rows="5"
            auto-grow
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="replyDialog.show = false">Hủy</v-btn>
          <v-btn color="primary" @click="saveReply">Lưu</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Report Review Dialog -->
    <v-dialog v-model="reportDialog.show" max-width="500">
      <v-card>
        <v-card-title>Báo cáo đánh giá</v-card-title>
        <v-card-text>
          <p class="mb-4">Vui lòng chọn lý do báo cáo đánh giá này:</p>
          
          <v-radio-group v-model="reportDialog.reason">
            <v-radio
              v-for="option in reportReasons"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            ></v-radio>
          </v-radio-group>
          
          <v-textarea
            v-model="reportDialog.comment"
            label="Mô tả chi tiết (tùy chọn)"
            variant="outlined"
            rows="3"
            class="mt-4"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="reportDialog.show = false">Hủy</v-btn>
          <v-btn color="error" @click="submitReport">Báo cáo</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Image Dialog -->
    <v-dialog v-model="imageDialog.show" max-width="800">
      <v-card>
        <v-img
          :src="imageDialog.url"
          max-height="80vh"
          contain
        ></v-img>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" @click="imageDialog.show = false"></v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, onMounted, watch, defineProps } from 'vue'
import { useToast } from 'vue-toastification'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { adminAPI } from '@/services/api.service'

export default {
  name: 'RestaurantReviews',
  
  props: {
    restaurantId: {
      type: [String, Number],
      required: true
    }
  },
  
  setup(props) {
    const toast = useToast()
    
    // State
    const loading = ref(true)
    const reviews = ref([])
    const page = ref(1)
    const limit = ref(5)
    const totalPages = ref(1)
    
    // Filters
    const filters = ref({
      search: '',
      rating: null,
      hasReply: null
    })
    
    // Dialog states
    const replyDialog = ref({
      show: false,
      review: null,
      reply: ''
    })
    
    const reportDialog = ref({
      show: false,
      review: null,
      reason: '',
      comment: ''
    })
    
    const imageDialog = ref({
      show: false,
      url: ''
    })
    
    // Options
    const ratingOptions = [
      { title: 'Tất cả', value: null },
      { title: '5 sao', value: 5 },
      { title: '4 sao', value: 4 },
      { title: '3 sao', value: 3 },
      { title: '2 sao', value: 2 },
      { title: '1 sao', value: 1 }
    ]
    
    const replyOptions = [
      { title: 'Tất cả', value: null },
      { title: 'Đã phản hồi', value: true },
      { title: 'Chưa phản hồi', value: false }
    ]
    
    const reportReasons = [
      { label: 'Nội dung không phù hợp', value: 'inappropriate' },
      { label: 'Thông tin sai sự thật', value: 'false_information' },
      { label: 'Spam hoặc quảng cáo', value: 'spam' },
      { label: 'Đánh giá không liên quan', value: 'irrelevant' },
      { label: 'Khác', value: 'other' }
    ]
    
    // Methods
    const loadReviews = async () => {
      loading.value = true
      try {
        const params = {
          page: page.value,
          limit: limit.value,
          rating: filters.value.rating,
          hasReply: filters.value.hasReply,
          search: filters.value.search || undefined
        }
        
        const response = await adminAPI.getRestaurantReviews(props.restaurantId, params)
        reviews.value = response.data.reviews.map(review => ({
          ...review,
          newReply: ''
        }))
        totalPages.value = Math.ceil(response.data.total / limit.value)
      } catch (error) {
        toast.error('Không thể tải đánh giá')
        console.error('Failed to load reviews:', error)
      } finally {
        loading.value = false
      }
    }
    
    const handlePageChange = (newPage) => {
      page.value = newPage
      loadReviews()
    }
    
    const applyFilters = () => {
      page.value = 1
      loadReviews()
    }
    
    const replyToReview = async (review) => {
      if (!review.newReply.trim()) {
        toast.error('Vui lòng nhập nội dung phản hồi')
        return
      }
      
      try {
        await adminAPI.replyToReview(props.restaurantId, review.id, {
          reply: review.newReply
        })
        
        review.reply = review.newReply
        review.replyDate = new Date()
        review.newReply = ''
        
        toast.success('Phản hồi đánh giá thành công')
      } catch (error) {
        toast.error('Không thể phản hồi đánh giá')
        console.error('Failed to reply to review:', error)
      }
    }
    
    const editReply = (review) => {
      replyDialog.value = {
        show: true,
        review,
        reply: review.reply
      }
    }
    
    const saveReply = async () => {
      if (!replyDialog.value.reply.trim()) {
        toast.error('Vui lòng nhập nội dung phản hồi')
        return
      }
      
      try {
        await adminAPI.updateReviewReply(
          props.restaurantId,
          replyDialog.value.review.id,
          { reply: replyDialog.value.reply }
        )
        
        // Update the review in the list
        const review = reviews.value.find(r => r.id === replyDialog.value.review.id)
        if (review) {
          review.reply = replyDialog.value.reply
          review.replyDate = new Date()
        }
        
        replyDialog.value.show = false
        toast.success('Cập nhật phản hồi thành công')
      } catch (error) {
        toast.error('Không thể cập nhật phản hồi')
        console.error('Failed to update reply:', error)
      }
    }
    
    const reportReview = (review) => {
      reportDialog.value = {
        show: true,
        review,
        reason: 'inappropriate',
        comment: ''
      }
    }
    
    const submitReport = async () => {
      try {
        await adminAPI.reportReview(
          props.restaurantId,
          reportDialog.value.review.id,
          {
            reason: reportDialog.value.reason,
            comment: reportDialog.value.comment
          }
        )
        
        reportDialog.value.show = false
        toast.success('Báo cáo đánh giá thành công')
      } catch (error) {
        toast.error('Không thể báo cáo đánh giá')
        console.error('Failed to report review:', error)
      }
    }
    
    const openImageDialog = (url) => {
      imageDialog.value = {
        show: true,
        url
      }
    }
    
    // Utility functions
    const formatDate = (dateString) => {
      if (!dateString) return ''
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi })
    }
    
    // Watch for restaurant ID changes
    watch(() => props.restaurantId, () => {
      if (props.restaurantId) {
        loadReviews()
      }
    }, { immediate: true })
    
    return {
      loading,
      reviews,
      page,
      totalPages,
      filters,
      ratingOptions,
      replyOptions,
      reportReasons,
      replyDialog,
      reportDialog,
      imageDialog,
      loadReviews,
      handlePageChange,
      applyFilters,
      replyToReview,
      editReply,
      saveReply,
      reportReview,
      submitReport,
      openImageDialog,
      formatDate
    }
  }
}
</script>

<style scoped>
.restaurant-reviews {
  padding: 16px;
}

.review-reply {
  border-left: 3px solid var(--v-primary-base);
  background-color: rgba(var(--v-primary-base), 0.05);
}
</style>
