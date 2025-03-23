<template>
  <div class="restaurant-review-management">
    <v-card>
      <v-card-title class="d-flex align-center">
        <span>Quản lý đánh giá</span>
        <v-spacer></v-spacer>
        <v-select
          v-model="filterStatus"
          :items="statusOptions"
          label="Trạng thái"
          density="compact"
          hide-details
          class="ml-4"
          style="max-width: 200px"
        ></v-select>
      </v-card-title>

      <v-card-text>
        <!-- Analytics Overview -->
        <v-row class="mb-6">
          <v-col cols="12" sm="6" md="3">
            <v-card variant="outlined">
              <v-card-text>
                <div class="text-overline mb-1">Đánh giá trung bình</div>
                <div class="d-flex align-center">
                  <span class="text-h4 font-weight-bold">{{ stats.average }}</span>
                  <v-rating
                    :model-value="parseFloat(stats.average)"
                    color="amber"
                    density="compact"
                    half-increments
                    readonly
                    size="small"
                    class="ml-2"
                  ></v-rating>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-card variant="outlined">
              <v-card-text>
                <div class="text-overline mb-1">Tổng số đánh giá</div>
                <div class="text-h4 font-weight-bold">{{ stats.total }}</div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-card variant="outlined">
              <v-card-text>
                <div class="text-overline mb-1">Tỷ lệ phản hồi</div>
                <div class="text-h4 font-weight-bold">{{ responseRate }}%</div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-card variant="outlined">
              <v-card-text>
                <div class="text-overline mb-1">Đánh giá mới (30 ngày)</div>
                <div class="text-h4 font-weight-bold">{{ recentReviewsCount }}</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Rating Trends Chart -->
        <v-card variant="outlined" class="mb-6">
          <v-card-title>Xu hướng đánh giá</v-card-title>
          <v-card-text>
            <v-chart class="chart" :option="chartOptions"></v-chart>
          </v-card-text>
        </v-card>

        <!-- Reviews List -->
        <v-data-table
          :headers="headers"
          :items="reviews"
          :loading="loading"
          :items-per-page="10"
        >
          <!-- Rating Column -->
          <template v-slot:item.rating="{ item }">
            <v-rating
              :model-value="item.rating"
              color="amber"
              density="compact"
              half-increments
              readonly
              size="small"
            ></v-rating>
          </template>

          <!-- Comment Column -->
          <template v-slot:item.comment="{ item }">
            <div class="text-truncate" style="max-width: 300px">
              {{ item.comment }}
            </div>
          </template>

          <!-- Response Column -->
          <template v-slot:item.response="{ item }">
            <div v-if="item.response" class="text-truncate" style="max-width: 300px">
              {{ item.response }}
            </div>
            <v-btn
              v-else
              color="primary"
              size="small"
              @click="openResponseDialog(item)"
            >
              Phản hồi
            </v-btn>
          </template>

          <!-- Actions Column -->
          <template v-slot:item.actions="{ item }">
            <v-btn
              v-if="item.response"
              icon="mdi-pencil"
              size="small"
              variant="text"
              @click="openResponseDialog(item)"
            ></v-btn>
            <v-btn
              icon="mdi-eye"
              size="small"
              variant="text"
              @click="openReviewDialog(item)"
            ></v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Response Dialog -->
    <v-dialog v-model="responseDialog.show" max-width="600">
      <v-card>
        <v-card-title>{{ responseDialog.review ? 'Chỉnh sửa phản hồi' : 'Viết phản hồi' }}</v-card-title>
        <v-card-text>
          <div class="mb-4">
            <div class="d-flex align-center mb-2">
              <v-avatar size="40" color="grey" class="mr-3">
                <v-img
                  v-if="responseDialog.review?.user?.profileImage"
                  :src="responseDialog.review.user.profileImage"
                ></v-img>
                <v-icon v-else>mdi-account</v-icon>
              </v-avatar>
              <div>
                <div class="font-weight-medium">
                  {{ responseDialog.review?.user?.fullName || 'Ẩn danh' }}
                </div>
                <div class="d-flex align-center">
                  <v-rating
                    :model-value="responseDialog.review?.rating"
                    color="amber"
                    density="compact"
                    half-increments
                    readonly
                    size="small"
                  ></v-rating>
                  <span class="text-caption ml-2">
                    {{ formatDate(responseDialog.review?.createdAt) }}
                  </span>
                </div>
              </div>
            </div>
            <p class="text-body-1">{{ responseDialog.review?.comment }}</p>
          </div>

          <v-form ref="responseForm" v-model="responseDialog.isValid">
            <v-textarea
              v-model="responseDialog.response"
              label="Phản hồi của bạn"
              variant="outlined"
              :rules="responseRules"
              :loading="responseDialog.loading"
              rows="4"
            ></v-textarea>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="responseDialog.show = false"
          >
            Hủy
          </v-btn>
          <v-btn
            color="primary"
            :loading="responseDialog.loading"
            :disabled="!responseDialog.isValid || responseDialog.loading"
            @click="submitResponse"
          >
            Gửi phản hồi
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Review Detail Dialog -->
    <v-dialog v-model="reviewDialog.show" max-width="700">
      <v-card>
        <v-card-title>Chi tiết đánh giá</v-card-title>
        <v-card-text>
          <div class="review-detail">
            <div class="d-flex align-center mb-4">
              <v-avatar size="48" color="grey" class="mr-3">
                <v-img
                  v-if="reviewDialog.review?.user?.profileImage"
                  :src="reviewDialog.review.user.profileImage"
                ></v-img>
                <v-icon v-else>mdi-account</v-icon>
              </v-avatar>
              <div>
                <div class="text-h6">
                  {{ reviewDialog.review?.user?.fullName || 'Ẩn danh' }}
                </div>
                <div class="d-flex align-center">
                  <v-rating
                    :model-value="reviewDialog.review?.rating"
                    color="amber"
                    density="compact"
                    half-increments
                    readonly
                    size="small"
                  ></v-rating>
                  <span class="text-caption ml-2">
                    {{ formatDate(reviewDialog.review?.createdAt) }}
                  </span>
                </div>
              </div>
            </div>

            <p class="text-body-1 mb-4">{{ reviewDialog.review?.comment }}</p>

            <!-- Review Photos -->
            <div v-if="reviewDialog.review?.images?.length" class="mb-4">
              <div class="text-subtitle-1 mb-2">Hình ảnh đính kèm</div>
              <v-row>
                <v-col
                  v-for="(image, index) in reviewDialog.review.images"
                  :key="index"
                  cols="6"
                  sm="4"
                  md="3"
                >
                  <v-img
                    :src="image"
                    aspect-ratio="1"
                    cover
                    class="rounded"
                    @click="openPhotoDialog(reviewDialog.review.images, index)"
                  ></v-img>
                </v-col>
              </v-row>
            </div>

            <!-- Order Details -->
            <div v-if="reviewDialog.review?.order" class="mb-4">
              <div class="text-subtitle-1 mb-2">Thông tin đơn hàng</div>
              <v-card variant="outlined">
                <v-card-text>
                  <div class="d-flex justify-space-between mb-2">
                    <span class="text-body-2">Mã đơn hàng:</span>
                    <span class="font-weight-medium">{{ reviewDialog.review.order.orderNumber }}</span>
                  </div>
                  <div class="d-flex justify-space-between mb-2">
                    <span class="text-body-2">Ngày đặt:</span>
                    <span>{{ formatDate(reviewDialog.review.order.createdAt) }}</span>
                  </div>
                  <div class="d-flex justify-space-between">
                    <span class="text-body-2">Tổng tiền:</span>
                    <span class="font-weight-medium">{{ formatCurrency(reviewDialog.review.order.total) }}</span>
                  </div>
                </v-card-text>
              </v-card>
            </div>

            <!-- Restaurant Response -->
            <div v-if="reviewDialog.review?.response" class="mb-4">
              <div class="text-subtitle-1 mb-2">Phản hồi của nhà hàng</div>
              <v-card variant="outlined" color="surface-variant">
                <v-card-text>
                  <div class="d-flex align-center mb-2">
                    <v-avatar color="primary" size="32" class="mr-2">
                      <v-icon color="white" size="small">mdi-store</v-icon>
                    </v-avatar>
                    <span class="text-caption">
                      {{ formatDate(reviewDialog.review.responseDate) }}
                    </span>
                  </div>
                  <p class="text-body-2 mb-0">{{ reviewDialog.review.response }}</p>
                </v-card-text>
              </v-card>
            </div>

            <!-- Review Statistics -->
            <div class="d-flex align-center">
              <v-btn
                variant="text"
                :prepend-icon="reviewDialog.review?.userLiked ? 'mdi-thumb-up' : 'mdi-thumb-up-outline'"
                :color="reviewDialog.review?.userLiked ? 'success' : undefined"
              >
                {{ reviewDialog.review?.likes || 0 }}
              </v-btn>
              <v-btn
                variant="text"
                :prepend-icon="reviewDialog.review?.userDisliked ? 'mdi-thumb-down' : 'mdi-thumb-down-outline'"
                :color="reviewDialog.review?.userDisliked ? 'error' : undefined"
              >
                {{ reviewDialog.review?.dislikes || 0 }}
              </v-btn>
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="reviewDialog.show = false"
          >
            Đóng
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'

use([
  CanvasRenderer,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent
])

const store = useStore()

// State
const loading = ref(false)
const stats = ref({
  average: 0,
  total: 0,
  distribution: {}
})
const reviews = ref([])
const recentReviewsCount = ref(0)
const responseRate = ref(0)
const filterStatus = ref('all')

// Constants
const statusOptions = [
  { title: 'Tất cả', value: 'all' },
  { title: 'Chưa phản hồi', value: 'pending' },
  { title: 'Đã phản hồi', value: 'responded' }
]

const headers = [
  { title: 'Khách hàng', key: 'user.fullName', align: 'start' },
  { title: 'Đánh giá', key: 'rating', align: 'center', width: '150px' },
  { title: 'Nhận xét', key: 'comment' },
  { title: 'Ngày', key: 'createdAt', align: 'center' },
  { title: 'Phản hồi', key: 'response' },
  { title: 'Thao tác', key: 'actions', align: 'end', sortable: false }
]

const responseRules = [
  v => !!v || 'Vui lòng nhập phản hồi',
  v => v.length >= 10 || 'Phản hồi phải có ít nhất 10 ký tự',
  v => v.length <= 1000 || 'Phản hồi không được vượt quá 1000 ký tự'
]

// Dialogs
const responseDialog = ref({
  show: false,
  review: null,
  response: '',
  isValid: false,
  loading: false
})

const reviewDialog = ref({
  show: false,
  review: null
})

const photoDialog = ref({
  show: false,
  images: [],
  currentIndex: 0
})

// Chart Options
const chartOptions = computed(() => ({
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['Đánh giá trung bình', 'Số lượng đánh giá']
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'time',
    boundaryGap: false
  },
  yAxis: [
    {
      type: 'value',
      name: 'Đánh giá',
      min: 0,
      max: 5
    },
    {
      type: 'value',
      name: 'Số lượng',
      min: 0
    }
  ],
  series: [
    {
      name: 'Đánh giá trung bình',
      type: 'line',
      smooth: true,
      data: stats.value.trends?.map(t => ([t.month, t.avgRating])) || []
    },
    {
      name: 'Số lượng đánh giá',
      type: 'line',
      smooth: true,
      yAxisIndex: 1,
      data: stats.value.trends?.map(t => ([t.month, t.count])) || []
    }
  ]
}))

// Methods
const fetchReviews = async () => {
  loading.value = true
  try {
    const response = await store.dispatch('reviews/fetchReviewAnalytics')
    stats.value = response
    reviews.value = response.reviews

    // Calculate response rate
    const respondedReviews = reviews.value.filter(r => r.response).length
    responseRate.value = Math.round((respondedReviews / reviews.value.length) * 100) || 0

    // Calculate recent reviews count
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    recentReviewsCount.value = reviews.value.filter(
      r => new Date(r.createdAt) > thirtyDaysAgo
    ).length
  } catch (error) {
    console.error('Error fetching reviews:', error)
  } finally {
    loading.value = false
  }
}

const openResponseDialog = (review) => {
  responseDialog.value = {
    show: true,
    review,
    response: review.response || '',
    isValid: false,
    loading: false
  }
}

const submitResponse = async () => {
  if (!responseDialog.value.isValid) return

  responseDialog.value.loading = true
  try {
    const { review, response } = responseDialog.value
    await store.dispatch('reviews/respondToReview', {
      reviewId: review.id,
      response
    })

    // Refresh reviews
    await fetchReviews()

    responseDialog.value.show = false
    store.dispatch('notifications/show', {
      type: 'success',
      message: 'Phản hồi đã được gửi thành công'
    })
  } catch (error) {
    console.error('Error submitting response:', error)
    store.dispatch('notifications/show', {
      type: 'error',
      message: 'Có lỗi xảy ra khi gửi phản hồi'
    })
  } finally {
    responseDialog.value.loading = false
  }
}

const openReviewDialog = (review) => {
  reviewDialog.value = {
    show: true,
    review
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

const formatDate = (date) => {
  return format(new Date(date), 'dd MMMM yyyy', { locale: vi })
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)
}

// Lifecycle hooks
onMounted(() => {
  fetchReviews()
})
</script>

<style scoped>
.chart {
  height: 400px;
}

.review-detail {
  max-height: 70vh;
  overflow-y: auto;
}
</style>