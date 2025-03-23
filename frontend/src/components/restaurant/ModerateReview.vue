<template>
  <div class="moderate-review">
    <v-data-table
      :headers="headers"
      :items="reviews"
      :loading="isLoading"
      class="elevation-1"
    >
      <template v-slot:top>
        <v-toolbar flat>
          <v-toolbar-title>Quản lý đánh giá và báo cáo</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-text-field
            v-model="search"
            append-icon="mdi-magnify"
            label="Tìm kiếm"
            single-line
            hide-details
            class="mx-4"
          ></v-text-field>
          <v-select
            v-model="filterStatus"
            :items="statusOptions"
            label="Trạng thái"
            hide-details
            class="mx-4"
            style="max-width: 200px"
          ></v-select>
        </v-toolbar>
      </template>

      <template v-slot:item.rating="{ item }">
        <v-rating
          :model-value="item.rating"
          color="amber"
          dense
          half-increments
          readonly
          size="small"
        ></v-rating>
      </template>

      <template v-slot:item.status="{ item }">
        <v-chip
          :color="getStatusColor(item.moderationStatus)"
          small
        >
          {{ getStatusText(item.moderationStatus) }}
        </v-chip>
      </template>

      <template v-slot:item.images="{ item }">
        <v-btn
          v-if="item.images?.length"
          icon="mdi-image"
          size="small"
          @click="openImageDialog(item.images)"
        >
          <v-badge
            :content="item.images.length"
            color="primary"
          ></v-badge>
        </v-btn>
      </template>

      <template v-slot:item.reports="{ item }">
        <v-chip
          v-if="item.reports?.length"
          color="error"
          small
          @click="openReportsDialog(item)"
        >
          {{ item.reports.length }} báo cáo
        </v-chip>
      </template>

      <template v-slot:item.actions="{ item }">
        <v-btn
          icon="mdi-check"
          color="success"
          size="small"
          @click="approveReview(item)"
          :loading="moderating === item.id"
          :disabled="item.moderationStatus === 'approved'"
        ></v-btn>
        <v-btn
          icon="mdi-block-helper"
          color="error"
          size="small"
          @click="openRejectDialog(item)"
          :loading="moderating === item.id"
          :disabled="item.moderationStatus === 'rejected'"
        ></v-btn>
        <v-btn
          icon="mdi-reply"
          color="primary"
          size="small"
          @click="openResponseDialog(item)"
        ></v-btn>
      </template>
    </v-data-table>

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

    <!-- Reports Dialog -->
    <v-dialog v-model="reportsDialog.show" max-width="600">
      <v-card>
        <v-card-title>Báo cáo</v-card-title>
        <v-card-text>
          <v-list>
            <v-list-item
              v-for="report in reportsDialog.reports"
              :key="report.id"
            >
              <v-list-item-content>
                <v-list-item-title>{{ report.reason }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ report.description }}
                </v-list-item-subtitle>
                <v-list-item-subtitle class="text-caption">
                  Báo cáo bởi {{ report.user.fullName }} - {{ formatDate(report.createdAt) }}
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            text
            @click="reportsDialog.show = false"
          >
            Đóng
          </v-btn>
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
            :rules="[v => !!v || 'Vui lòng nhập lý do từ chối']"
            rows="3"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            text
            @click="rejectDialog.show = false"
          >
            Hủy
          </v-btn>
          <v-btn
            color="error"
            :loading="moderating === rejectDialog.review?.id"
            @click="rejectReview"
          >
            Từ chối
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Response Dialog -->
    <v-dialog v-model="responseDialog.show" max-width="600">
      <v-card>
        <v-card-title>Phản hồi đánh giá</v-card-title>
        <v-card-text>
          <v-textarea
            v-model="responseDialog.content"
            label="Nội dung phản hồi"
            :rules="[v => !!v || 'Vui lòng nhập nội dung phản hồi']"
            counter="1000"
            rows="4"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            text
            @click="responseDialog.show = false"
          >
            Hủy
          </v-btn>
          <v-btn
            color="primary"
            :loading="responding"
            @click="submitResponse"
          >
            Gửi phản hồi
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

export default {
  name: 'ModerateReview',

  setup() {
    const store = useStore()
    const search = ref('')
    const filterStatus = ref('pending')
    const moderating = ref(null)
    const responding = ref(false)

    const headers = [
      { title: 'Người đánh giá', key: 'user.fullName' },
      { title: 'Đánh giá', key: 'rating', width: '150px' },
      { title: 'Nội dung', key: 'comment' },
      { title: 'Hình ảnh', key: 'images', sortable: false, width: '100px' },
      { title: 'Báo cáo', key: 'reports', sortable: false, width: '120px' },
      { title: 'Trạng thái', key: 'status', width: '120px' },
      { title: 'Thao tác', key: 'actions', sortable: false, width: '150px' }
    ]

    const statusOptions = [
      { title: 'Chờ duyệt', value: 'pending' },
      { title: 'Đã duyệt', value: 'approved' },
      { title: 'Đã từ chối', value: 'rejected' },
      { title: 'Tất cả', value: 'all' }
    ]

    // Dialogs
    const imageDialog = ref({
      show: false,
      images: [],
      currentIndex: 0
    })

    const reportsDialog = ref({
      show: false,
      reports: []
    })

    const rejectDialog = ref({
      show: false,
      review: null,
      reason: ''
    })

    const responseDialog = ref({
      show: false,
      review: null,
      content: ''
    })

    // Load reviews based on filters
    const loadReviews = async () => {
      try {
        await store.dispatch('reviews/getPendingReviews', {
          status: filterStatus.value,
          search: search.value
        })
      } catch (error) {
        console.error('Failed to load reviews:', error)
      }
    }

    // Watch for filter changes
    watch([filterStatus, search], () => {
      loadReviews()
    })

    const reviews = computed(() => {
      return store.getters['reviews/pendingReviews']
    })

    const isLoading = computed(() => {
      return store.getters['reviews/isLoading']
    })

    // Methods
    const getStatusColor = (status) => {
      switch (status) {
        case 'approved': return 'success'
        case 'rejected': return 'error'
        case 'pending': return 'warning'
        default: return 'grey'
      }
    }

    const getStatusText = (status) => {
      switch (status) {
        case 'approved': return 'Đã duyệt'
        case 'rejected': return 'Đã từ chối'
        case 'pending': return 'Chờ duyệt'
        default: return 'Không xác định'
      }
    }

    const openImageDialog = (images) => {
      imageDialog.value = {
        show: true,
        images,
        currentIndex: 0
      }
    }

    const openReportsDialog = (review) => {
      reportsDialog.value = {
        show: true,
        reports: review.reports
      }
    }

    const openRejectDialog = (review) => {
      rejectDialog.value = {
        show: true,
        review,
        reason: ''
      }
    }

    const openResponseDialog = (review) => {
      responseDialog.value = {
        show: true,
        review,
        content: review.response || ''
      }
    }

    const approveReview = async (review) => {
      moderating.value = review.id
      try {
        await store.dispatch('reviews/moderateReview', {
          reviewId: review.id,
          status: 'approved'
        })
        await loadReviews()
      } catch (error) {
        console.error('Failed to approve review:', error)
      } finally {
        moderating.value = null
      }
    }

    const rejectReview = async () => {
      if (!rejectDialog.value.reason) return

      moderating.value = rejectDialog.value.review.id
      try {
        await store.dispatch('reviews/moderateReview', {
          reviewId: rejectDialog.value.review.id,
          status: 'rejected',
          reason: rejectDialog.value.reason
        })
        rejectDialog.value.show = false
        await loadReviews()
      } catch (error) {
        console.error('Failed to reject review:', error)
      } finally {
        moderating.value = null
      }
    }

    const submitResponse = async () => {
      if (!responseDialog.value.content) return

      responding.value = true
      try {
        await store.dispatch('reviews/respondToReview', {
          reviewId: responseDialog.value.review.id,
          response: responseDialog.value.content
        })
        responseDialog.value.show = false
        await loadReviews()
      } catch (error) {
        console.error('Failed to submit response:', error)
      } finally {
        responding.value = false
      }
    }

    const formatDate = (date) => {
      return format(new Date(date), 'dd MMMM yyyy, HH:mm', { locale: vi })
    }

    // Initial load
    loadReviews()

    return {
      search,
      filterStatus,
      headers,
      statusOptions,
      imageDialog,
      reportsDialog,
      rejectDialog,
      responseDialog,
      reviews,
      isLoading,
      moderating,
      responding,
      getStatusColor,
      getStatusText,
      openImageDialog,
      openReportsDialog,
      openRejectDialog,
      openResponseDialog,
      approveReview,
      rejectReview,
      submitResponse,
      formatDate
    }
  }
}
</script>

<style scoped>
.moderate-review {
  padding: 16px;
}
</style>