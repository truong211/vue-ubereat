<template>
  <div class="review-manager">
    <!-- Review Analytics -->
    <v-card class="mb-6">
      <v-card-title>Thống kê đánh giá</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" sm="4" class="text-center">
            <div class="text-h2 font-weight-bold">{{ stats.average }}</div>
            <v-rating
              :model-value="parseFloat(stats.average)"
              color="amber"
              half-increments
              readonly
              size="small"
            ></v-rating>
            <div class="text-subtitle-1">{{ stats.total }} đánh giá</div>
          </v-col>
          
          <v-col cols="12" sm="8">
            <div v-for="n in 5" :key="n" class="d-flex align-center mb-2">
              <div class="text-body-2 mr-4" style="min-width: 20px">{{ 6-n }}</div>
              <v-progress-linear
                :model-value="getRatingPercentage(6-n)"
                color="amber"
                height="8"
                class="flex-grow-1 mr-4"
                rounded
              ></v-progress-linear>
              <div class="text-body-2" style="min-width: 40px">
                {{ stats.distribution?.[6-n] || 0 }}
              </div>
            </div>
          </v-col>
        </v-row>

        <!-- Trend Chart -->
        <v-chart v-if="chartData" class="mt-6" :option="chartOptions" autoresize />
      </v-card-text>
    </v-card>

    <!-- Reviews List -->
    <v-card>
      <v-card-title class="d-flex align-center">
        <span>Đánh giá của khách hàng</span>
        <v-spacer></v-spacer>
        <v-select
          v-model="filterStatus"
          :items="filterOptions"
          label="Lọc theo"
          density="compact"
          hide-details
          class="ml-4"
          style="max-width: 200px"
        ></v-select>
      </v-card-title>

      <v-card-text>
        <!-- Loading State -->
        <div v-if="loading" class="d-flex justify-center py-8">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>

        <!-- Empty State -->
        <div v-else-if="!reviews.length" class="text-center py-8">
          <v-icon size="64" color="grey">mdi-star-outline</v-icon>
          <div class="text-h6 mt-4">Chưa có đánh giá nào</div>
        </div>

        <!-- Reviews List -->
        <div v-else>
          <div v-for="(review, index) in reviews" :key="review.id" class="review-item">
            <div class="d-flex mb-4">
              <v-avatar size="40" color="grey" class="mr-3">
                <v-img v-if="review.user?.profileImage" :src="review.user.profileImage"></v-img>
                <v-icon v-else>mdi-account</v-icon>
              </v-avatar>

              <div class="flex-grow-1">
                <div class="d-flex justify-space-between align-center">
                  <div>
                    <div class="text-subtitle-1 font-weight-bold">
                      {{ review.user?.fullName || 'Ẩn danh' }}
                    </div>
                    <div class="d-flex align-center">
                      <v-rating
                        :model-value="review.rating"
                        color="amber"
                        density="compact"
                        half-increments
                        readonly
                        size="small"
                      ></v-rating>
                      <span class="text-caption ml-2">{{ formatDate(review.createdAt) }}</span>
                    </div>
                  </div>
                </div>

                <p class="text-body-1 mt-2">{{ review.comment }}</p>

                <!-- Review Photos -->
                <div v-if="review.images?.length" class="mt-3">
                  <v-row>
                    <v-col v-for="(image, i) in review.images" :key="i" cols="4" sm="3" md="2">
                      <v-img
                        :src="image"
                        aspect-ratio="1"
                        cover
                        class="rounded cursor-pointer"
                        @click="openPhotoDialog(review.images, i)"
                      ></v-img>
                    </v-col>
                  </v-row>
                </div>

                <!-- Restaurant Response -->
                <div v-if="review.response" class="restaurant-response mt-3 pa-3 rounded">
                  <div class="d-flex align-center mb-1">
                    <v-avatar size="24" color="primary" class="mr-2">
                      <v-icon color="white" size="small">mdi-store</v-icon>
                    </v-avatar>
                    <div>
                      <span class="font-weight-medium">Phản hồi của bạn</span>
                      <span class="text-caption ml-2">{{ formatDate(review.responseDate) }}</span>
                    </div>
                  </div>
                  <p class="text-body-2 mb-0">{{ review.response }}</p>
                  <div class="d-flex justify-end mt-2">
                    <v-btn
                      variant="text"
                      size="small"
                      color="primary"
                      @click="editResponse(review)"
                    >
                      Chỉnh sửa
                    </v-btn>
                  </div>
                </div>

                <!-- Response Actions -->
                <div v-else class="d-flex justify-end mt-2">
                  <v-btn
                    color="primary"
                    @click="openResponseDialog(review)"
                  >
                    Phản hồi
                  </v-btn>
                </div>
              </div>
            </div>

            <v-divider v-if="index < reviews.length - 1"></v-divider>
          </div>

          <!-- Pagination -->
          <div class="text-center mt-4">
            <v-pagination
              v-if="totalPages > 1"
              v-model="currentPage"
              :length="totalPages"
              :total-visible="7"
            ></v-pagination>
          </div>
        </div>
      </v-card-text>
    </v-card>

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

    <!-- Response Dialog -->
    <v-dialog v-model="responseDialog.show" max-width="600">
      <v-card>
        <v-card-title>{{ responseDialog.isEdit ? 'Chỉnh sửa phản hồi' : 'Phản hồi đánh giá' }}</v-card-title>
        <v-card-text>
          <v-form ref="responseForm" v-model="responseDialog.isValid">
            <v-textarea
              v-model="responseDialog.response"
              label="Nội dung phản hồi"
              placeholder="Chia sẻ phản hồi của bạn với khách hàng"
              :rules="responseRules"
              rows="5"
              counter="1000"
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
            :disabled="!responseDialog.isValid"
            @click="submitResponse"
          >
            {{ responseDialog.isEdit ? 'Cập nhật' : 'Gửi phản hồi' }}
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
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart, { THEME_KEY } from 'vue-echarts'
import { subMonths, startOfMonth, format as formatDate } from 'date-fns'

// Register ECharts components
use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const props = defineProps({
  restaurantId: {
    type: [String, Number],
    required: true
  }
})

const store = useStore()

// State
const loading = ref(false)
const reviews = ref([])
const currentPage = ref(1)
const totalPages = ref(1)
const responseForm = ref(null)
const stats = ref({
  average: 0,
  total: 0,
  distribution: {}
})
const filterStatus = ref('all')
const chartData = ref(null)

const photoDialog = ref({
  show: false,
  images: [],
  currentIndex: 0
})

const responseDialog = ref({
  show: false,
  review: null,
  response: '',
  isEdit: false,
  loading: false,
  isValid: false
})

// Constants
const itemsPerPage = 10

const filterOptions = [
  { title: 'Tất cả đánh giá', value: 'all' },
  { title: '1 sao', value: '1' },
  { title: '2 sao', value: '2' },
  { title: '3 sao', value: '3' },
  { title: '4 sao', value: '4' },
  { title: '5 sao', value: '5' },
  { title: 'Chưa phản hồi', value: 'no_response' }
]

const responseRules = [
  v => !!v || 'Vui lòng nhập nội dung phản hồi',
  v => v.length >= 10 || 'Phản hồi phải có ít nhất 10 ký tự',
  v => v.length <= 1000 || 'Phản hồi không được vượt quá 1000 ký tự'
]

// Chart options
const chartOptions = computed(() => ({
  title: {
    text: 'Xu hướng đánh giá',
    left: 'center'
  },
  tooltip: {
    trigger: 'axis',
    formatter: (params) => {
      const [ratingData, countData] = params
      return `${ratingData.name}<br/>
        Đánh giá trung bình: ${parseFloat(ratingData.value).toFixed(1)}<br/>
        Số lượng: ${countData.value}`
    }
  },
  legend: {
    data: ['Đánh giá trung bình', 'Số lượng đánh giá'],
    bottom: 0
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '10%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: chartData.value?.months || []
  },
  yAxis: [
    {
      type: 'value',
      name: 'Đánh giá',
      min: 1,
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
      data: chartData.value?.ratings || [],
      symbolSize: 8,
      lineStyle: {
        width: 3
      }
    },
    {
      name: 'Số lượng đánh giá',
      type: 'line',
      yAxisIndex: 1,
      data: chartData.value?.counts || [],
      symbolSize: 8,
      lineStyle: {
        width: 3
      }
    }
  ]
}))

// Methods
const fetchReviews = async () => {
  loading.value = true
  try {
    const response = await store.dispatch('reviews/fetchRestaurantReviews', {
      restaurantId: props.restaurantId,
      page: currentPage.value,
      limit: itemsPerPage,
      filter: filterStatus.value === 'no_response' ? { hasResponse: false } : null,
      rating: filterStatus.value !== 'all' ? parseInt(filterStatus.value) : null
    })

    reviews.value = response.reviews
    totalPages.value = response.totalPages
    stats.value = response.stats
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

const fetchAnalytics = async () => {
  try {
    const analytics = await store.dispatch('reviews/fetchReviewAnalytics', {
      restaurantId: props.restaurantId
    })

    // Process analytics data for the chart
    const months = []
    const ratings = []
    const counts = []

    // Get last 6 months
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(startOfMonth(now), i)
      months.push(formatDate(month, 'MM/yyyy'))
      
      const monthData = analytics.trends.find(t => 
        new Date(t.month).getMonth() === month.getMonth() &&
        new Date(t.month).getFullYear() === month.getFullYear()
      )

      if (monthData) {
        ratings.push(parseFloat(monthData.avgRating).toFixed(1))
        counts.push(monthData.count)
      } else {
        ratings.push(null)
        counts.push(0)
      }
    }

    chartData.value = { months, ratings, counts }
  } catch (error) {
    console.error('Error fetching analytics:', error)
  }
}

const formatDate = (date) => {
  return format(new Date(date), 'dd MMMM yyyy', { locale: vi })
}

const getRatingPercentage = (rating) => {
  if (!stats.value.total) return 0
  return ((stats.value.distribution[rating] || 0) / stats.value.total) * 100
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

const openResponseDialog = (review) => {
  responseDialog.value = {
    show: true,
    review,
    response: '',
    isEdit: false,
    loading: false,
    isValid: false
  }
}

const editResponse = (review) => {
  responseDialog.value = {
    show: true,
    review,
    response: review.response,
    isEdit: true,
    loading: false,
    isValid: true
  }
}

const submitResponse = async () => {
  if (!responseDialog.value.response) return

  responseDialog.value.loading = true
  try {
    if (responseDialog.value.isEdit) {
      await store.dispatch('reviews/updateReviewResponse', {
        reviewId: responseDialog.value.review.id,
        response: responseDialog.value.response
      })
    } else {
      await store.dispatch('reviews/respondToReview', {
        reviewId: responseDialog.value.review.id,
        response: responseDialog.value.response
      })
    }

    await fetchReviews()
    responseDialog.value.show = false
    store.dispatch('notifications/show', {
      type: 'success',
      message: responseDialog.value.isEdit 
        ? 'Đã cập nhật phản hồi'
        : 'Đã gửi phản hồi'
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

// Watchers
watch([currentPage, filterStatus], () => {
  fetchReviews()
})

// Lifecycle hooks
onMounted(() => {
  fetchReviews()
  fetchAnalytics()
})
</script>

<style scoped>
.restaurant-response {
  background-color: var(--v-surface-variant);
}

.cursor-pointer {
  cursor: pointer;
}

.cursor-pointer:hover {
  opacity: 0.9;
}

.review-item {
  padding: 16px 0;
}

.review-item:first-child {
  padding-top: 0;
}

.review-item:last-child {
  padding-bottom: 0;
}

:deep(.echarts) {
  height: 400px;
}
</style>