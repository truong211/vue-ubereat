<template>
  <div class="review-moderation">
    <v-container>
      <!-- Header -->
      <div class="d-flex align-center mb-6">
        <h1 class="text-h4">Kiểm duyệt đánh giá</h1>
        <v-spacer></v-spacer>
        <div class="d-flex align-center">
          <v-select
            v-model="filterStatus"
            :items="statusOptions"
            label="Trạng thái"
            density="compact"
            class="mr-4"
            style="width: 200px"
          ></v-select>
          <v-text-field
            v-model="searchQuery"
            prepend-inner-icon="mdi-magnify"
            label="Tìm kiếm"
            density="compact"
            hide-details
            style="width: 300px"
          ></v-text-field>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="d-flex justify-center py-8">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </div>

      <!-- Empty state -->
      <v-card v-else-if="!filteredReviews.length" class="text-center py-8">
        <v-icon size="64" color="grey">mdi-text-box-check-outline</v-icon>
        <div class="text-h6 mt-4">Không có đánh giá nào cần kiểm duyệt</div>
      </v-card>

      <!-- Reviews list -->
      <template v-else>
        <v-card v-for="review in filteredReviews" :key="review.id" class="mb-4">
          <v-card-text>
            <!-- Review header -->
            <div class="d-flex align-center mb-4">
              <v-avatar size="40" color="grey" class="mr-3">
                <v-img v-if="review.user?.profileImage" :src="review.user.profileImage"></v-img>
                <v-icon v-else>mdi-account</v-icon>
              </v-avatar>
              
              <div class="flex-grow-1">
                <div class="text-subtitle-1 font-weight-bold">
                  {{ review.user?.fullName || 'Ẩn danh' }}
                </div>
                <div class="text-caption">
                  {{ formatDate(review.createdAt) }}
                </div>
              </div>

              <v-chip
                :color="getStatusColor(review.moderationStatus)"
                size="small"
              >
                {{ getStatusText(review.moderationStatus) }}
              </v-chip>
            </div>

            <!-- Restaurant info -->
            <div class="mb-4">
              <div class="d-flex align-center">
                <v-avatar size="32" color="primary" class="mr-3">
                  <v-img v-if="review.restaurant?.logo" :src="review.restaurant.logo"></v-img>
                  <v-icon v-else color="white">mdi-store</v-icon>
                </v-avatar>
                <div>
                  <div class="text-subtitle-1">{{ review.restaurant?.name }}</div>
                </div>
              </div>
            </div>

            <!-- Review content -->
            <div class="mb-4">
              <v-rating
                :model-value="review.rating"
                color="amber"
                half-increments
                readonly
                size="small"
              ></v-rating>
              <p class="text-body-1 mt-2">{{ review.comment }}</p>

              <!-- Review photos -->
              <div v-if="review.images?.length" class="mt-3">
                <v-row>
                  <v-col v-for="(image, i) in review.images" :key="i" cols="4" sm="3" md="2">
                    <v-img
                      :src="image"
                      aspect-ratio="1"
                      cover
                      class="rounded"
                      @click="openPhotoDialog(review.images, i)"
                    ></v-img>
                  </v-col>
                </v-row>
              </div>
            </div>

            <!-- Reports -->
            <div v-if="review.reports?.length" class="mb-4">
              <div class="text-subtitle-1 font-weight-bold mb-2">
                Báo cáo ({{ review.reports.length }})
              </div>
              <v-list>
                <v-list-item v-for="report in review.reports" :key="report.id">
                  <template v-slot:prepend>
                    <v-icon color="error">mdi-flag</v-icon>
                  </template>
                  <v-list-item-title>{{ getReportReasonText(report.reason) }}</v-list-item-title>
                  <v-list-item-subtitle v-if="report.description">
                    {{ report.description }}
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </div>

            <!-- Moderation actions -->
            <v-divider></v-divider>
            <div class="d-flex justify-end pt-3">
              <v-btn
                v-if="review.moderationStatus === 'pending'"
                color="error"
                variant="text"
                class="mr-2"
                @click="openRejectDialog(review)"
              >
                Từ chối
              </v-btn>
              <v-btn
                v-if="review.moderationStatus === 'pending'"
                color="success"
                @click="approveReview(review)"
              >
                Phê duyệt
              </v-btn>
              <v-btn
                v-else
                color="primary"
                variant="text"
                @click="reopenModeration(review)"
              >
                Xem xét lại
              </v-btn>
            </div>
          </v-card-text>
        </v-card>

        <!-- Pagination -->
        <div class="text-center mt-4">
          <v-pagination
            v-if="totalPages > 1"
            v-model="currentPage"
            :length="totalPages"
            :total-visible="7"
          ></v-pagination>
        </div>
      </template>
    </v-container>

    <!-- Photo Dialog -->
    <v-dialog v-model="photoDialog.show" max-width="800">
      <v-card>
        <v-img
          :src="photoDialog.images[photoDialog.currentIndex]"
          max-height="80vh"
          contain
        ></v-img>
        <v-card-actions>
          <v-btn
            icon="mdi-chevron-left"
            variant="text"
            @click="previousPhoto"
            :disabled="photoDialog.currentIndex === 0"
          ></v-btn>
          <v-spacer></v-spacer>
          <v-btn
            icon="mdi-chevron-right"
            variant="text"
            @click="nextPhoto"
            :disabled="photoDialog.currentIndex === photoDialog.images.length - 1"
          ></v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Reject Dialog -->
    <v-dialog v-model="rejectDialog.show" max-width="500">
      <v-card>
        <v-card-title>Từ chối đánh giá</v-card-title>
        <v-card-text>
          <v-textarea
            v-model="rejectDialog.reason"
            label="Lý do từ chối"
            placeholder="Nhập lý do từ chối đánh giá này"
            rows="3"
            :rules="reasonRules"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="rejectDialog.show = false"
          >
            Hủy
          </v-btn>
          <v-btn
            color="error"
            :loading="rejectDialog.loading"
            @click="rejectReview"
          >
            Xác nhận
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

const store = useStore()

// State
const loading = ref(false)
const reviews = ref([])
const currentPage = ref(1)
const totalPages = ref(1)
const filterStatus = ref('pending')
const searchQuery = ref('')

const photoDialog = ref({
  show: false,
  images: [],
  currentIndex: 0
})

const rejectDialog = ref({
  show: false,
  review: null,
  reason: '',
  loading: false
})

// Constants
const itemsPerPage = 10

const statusOptions = [
  { title: 'Đang chờ', value: 'pending' },
  { title: 'Đã phê duyệt', value: 'approved' },
  { title: 'Đã từ chối', value: 'rejected' }
]

const reasonRules = [
  v => !!v || 'Vui lòng nhập lý do',
  v => v.length >= 10 || 'Lý do phải có ít nhất 10 ký tự'
]

// Computed
const filteredReviews = computed(() => {
  let result = [...reviews.value]

  if (filterStatus.value !== 'all') {
    result = result.filter(review => review.moderationStatus === filterStatus.value)
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(review => 
      review.comment.toLowerCase().includes(query) ||
      review.user?.fullName.toLowerCase().includes(query) ||
      review.restaurant?.name.toLowerCase().includes(query)
    )
  }

  return result
})

// Methods
const fetchReviews = async () => {
  loading.value = true
  try {
    const response = await store.dispatch('reviews/fetchPendingModeration', {
      page: currentPage.value,
      limit: itemsPerPage
    })
    reviews.value = response.reviews
    totalPages.value = response.totalPages
  } catch (error) {
    console.error('Error fetching reviews:', error)
    store.dispatch('notifications/show', {
      type: 'error',
      message: 'Không thể tải danh sách đánh giá'
    })
  } finally {
    loading.value = false
  }
}

const formatDate = (date) => {
  return format(new Date(date), 'dd MMMM yyyy, HH:mm', { locale: vi })
}

const getStatusColor = (status) => {
  switch (status) {
    case 'approved':
      return 'success'
    case 'rejected':
      return 'error'
    default:
      return 'warning'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'approved':
      return 'Đã phê duyệt'
    case 'rejected':
      return 'Đã từ chối'
    default:
      return 'Đang chờ'
  }
}

const getReportReasonText = (reason) => {
  switch (reason) {
    case 'inappropriate':
      return 'Nội dung không phù hợp'
    case 'spam':
      return 'Quảng cáo, spam'
    case 'false_info':
      return 'Thông tin sai sự thật'
    default:
      return 'Khác'
  }
}

const openPhotoDialog = (images, index) => {
  photoDialog.value = {
    show: true,
    images,
    currentIndex: index
  }
}

const previousPhoto = () => {
  if (photoDialog.value.currentIndex > 0) {
    photoDialog.value.currentIndex--
  }
}

const nextPhoto = () => {
  if (photoDialog.value.currentIndex < photoDialog.value.images.length - 1) {
    photoDialog.value.currentIndex++
  }
}

const openRejectDialog = (review) => {
  rejectDialog.value = {
    show: true,
    review,
    reason: '',
    loading: false
  }
}

const approveReview = async (review) => {
  try {
    await store.dispatch('reviews/moderateReview', {
      reviewId: review.id,
      moderationStatus: 'approved'
    })
    await fetchReviews()
    store.dispatch('notifications/show', {
      type: 'success',
      message: 'Đã phê duyệt đánh giá'
    })
  } catch (error) {
    console.error('Error approving review:', error)
    store.dispatch('notifications/show', {
      type: 'error',
      message: 'Không thể phê duyệt đánh giá'
    })
  }
}

const rejectReview = async () => {
  if (!rejectDialog.value.reason) return

  rejectDialog.value.loading = true
  try {
    await store.dispatch('reviews/moderateReview', {
      reviewId: rejectDialog.value.review.id,
      moderationStatus: 'rejected',
      moderationReason: rejectDialog.value.reason
    })
    await fetchReviews()
    rejectDialog.value.show = false
    store.dispatch('notifications/show', {
      type: 'success',
      message: 'Đã từ chối đánh giá'
    })
  } catch (error) {
    console.error('Error rejecting review:', error)
    store.dispatch('notifications/show', {
      type: 'error',
      message: 'Không thể từ chối đánh giá'
    })
  } finally {
    rejectDialog.value.loading = false
  }
}

const reopenModeration = async (review) => {
  try {
    await store.dispatch('reviews/moderateReview', {
      reviewId: review.id,
      moderationStatus: 'pending'
    })
    await fetchReviews()
    store.dispatch('notifications/show', {
      type: 'success',
      message: 'Đã mở lại kiểm duyệt đánh giá'
    })
  } catch (error) {
    console.error('Error reopening moderation:', error)
    store.dispatch('notifications/show', {
      type: 'error',
      message: 'Không thể mở lại kiểm duyệt'
    })
  }
}

// Watchers
watch([currentPage, filterStatus], () => {
  fetchReviews()
})

// Lifecycle hooks
onMounted(() => {
  fetchReviews()
})
</script>

<style scoped>
.review-moderation {
  max-width: 1200px;
  margin: 0 auto;
}

.v-card {
  transition: transform 0.2s;
}

.v-card:hover {
  transform: translateY(-2px);
}
</style>