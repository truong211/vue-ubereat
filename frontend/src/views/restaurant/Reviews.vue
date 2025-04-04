<template>
  <v-container>
    <!-- Rating Overview -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" sm="4" class="text-center">
            <div class="text-h2 font-weight-bold">{{ restaurant.rating }}</div>
            <v-rating
              :model-value="restaurant.rating"
              color="amber"
              half-increments
              readonly
            ></v-rating>
            <div class="text-subtitle-1">{{ restaurant.reviewCount }} đánh giá</div>
          </v-col>
          
          <v-divider vertical class="d-none d-sm-flex"></v-divider>
          
          <v-col cols="12" sm="8">
            <div v-for="n in 5" :key="n" class="d-flex align-center mb-2">
              <div class="text-body-2 mr-4" style="width: 20px">{{ 6-n }}</div>
              <v-progress-linear
                :model-value="getRatingPercentage(6-n)"
                color="amber"
                height="8"
                class="flex-grow-1 mr-4"
                rounded
              ></v-progress-linear>
              <div class="text-body-2" style="width: 40px">{{ getRatingCount(6-n) }}</div>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Write Review Section -->
    <v-card v-if="canReview" class="mb-4">
      <v-card-text>
        <h3 class="text-h6 mb-4">Viết đánh giá</h3>
        <v-form ref="reviewForm" v-model="isReviewFormValid">
          <div class="mb-4">
            <div class="text-subtitle-1 mb-2">Đánh giá của bạn</div>
            <v-rating
              v-model="newReview.rating"
              color="amber"
              hover
              half-increments
              size="large"
            ></v-rating>
          </div>
          
          <v-textarea
            v-model="newReview.comment"
            label="Nhận xét của bạn"
            placeholder="Chia sẻ trải nghiệm của bạn về nhà hàng này"
            variant="outlined"
            rows="4"
            counter="500"
            :rules="reviewRules"
          ></v-textarea>

          <v-file-input
            v-model="newReview.images"
            label="Thêm hình ảnh (tối đa 5 ảnh)"
            accept="image/*"
            multiple
            :rules="imageRules"
            chips
            variant="outlined"
            class="mt-4"
          ></v-file-input>
          
          <div class="d-flex justify-end mt-4">
            <v-btn
              color="primary"
              :loading="isSubmitting"
              :disabled="!isReviewFormValid || isSubmitting"
              @click="submitReview"
            >
              Gửi đánh giá
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- Review Filters -->
    <div class="d-flex align-center mb-4 flex-wrap">
      <v-select
        v-model="filters.sort"
        :items="sortOptions"
        label="Sắp xếp theo"
        variant="outlined"
        density="compact"
        hide-details
        class="mr-4 mb-2"
        style="width: 150px"
      ></v-select>
      
      <v-btn-toggle
        v-model="filters.rating"
        mandatory
        color="primary"
        class="mb-2"
      >
        <v-btn value="all">Tất cả</v-btn>
        <v-btn value="positive">Tích cực</v-btn>
        <v-btn value="critical">Phản hồi</v-btn>
      </v-btn-toggle>
    </div>

    <!-- Reviews List -->
    <v-card>
      <v-list v-if="reviews.length">
        <template v-for="(review, index) in displayedReviews" :key="review.id">
          <v-list-item>
            <template v-slot:prepend>
              <v-avatar :image="review.user.profileImage" size="40">
                <v-icon v-if="!review.user.profileImage">mdi-account</v-icon>
              </v-avatar>
            </template>

            <v-list-item-title>
              <div class="d-flex justify-space-between align-center">
                <div>
                  <div class="font-weight-bold">{{ review.user.fullName }}</div>
                  <div class="d-flex align-center mt-1">
                    <v-rating
                      :model-value="review.rating"
                      color="amber"
                      density="compact"
                      half-increments
                      readonly
                      size="small"
                    ></v-rating>
                    <span class="text-caption text-grey ml-2">{{ formatDate(review.createdAt) }}</span>
                  </div>
                </div>
              </div>

              <p class="text-body-1 mt-2">{{ review.comment }}</p>

              <!-- Review Images -->
              <v-row v-if="review.images?.length" class="mt-2">
                <v-col v-for="(image, i) in review.images" :key="i" cols="auto">
                  <v-img
                    :src="image"
                    width="100"
                    height="100"
                    cover
                    class="rounded"
                    @click="openImageDialog(review.images, i)"
                  ></v-img>
                </v-col>
              </v-row>

              <!-- Review Actions -->
              <div class="d-flex align-center mt-3">
                <v-btn
                  variant="text"
                  size="small"
                  density="compact"
                  prepend-icon="mdi-thumb-up"
                  :color="review.userVoted === 'helpful' ? 'primary' : ''"
                  @click="voteReview(review.id, true)"
                >
                  {{ review.helpfulCount || 0 }}
                </v-btn>
                
                <v-btn
                  variant="text"
                  size="small"
                  density="compact"
                  prepend-icon="mdi-thumb-down"
                  :color="review.userVoted === 'not_helpful' ? 'error' : ''"
                  @click="voteReview(review.id, false)"
                  class="ml-2"
                >
                  {{ review.notHelpfulCount || 0 }}
                </v-btn>

                <v-btn
                  v-if="canReportReview(review)"
                  variant="text"
                  size="small"
                  density="compact"
                  prepend-icon="mdi-flag"
                  class="ml-2"
                  @click="openReportDialog(review)"
                >
                  Báo cáo
                </v-btn>
              </div>

              <!-- Restaurant Response -->
              <div v-if="review.response" class="response-block mt-4 pa-3 bg-grey-lighten-4 rounded">
                <div class="d-flex align-center mb-2">
                  <v-icon size="small" color="primary" class="mr-2">mdi-reply</v-icon>
                  <span class="text-primary">Phản hồi từ nhà hàng</span>
                </div>
                {{ review.response }}
              </div>
            </v-list-item-title>
          </v-list-item>
          
          <v-divider v-if="index < reviews.length - 1"></v-divider>
        </template>
      </v-list>

      <v-card-text v-else class="text-center py-8">
        <v-icon size="64" color="grey">mdi-message-text-outline</v-icon>
        <h3 class="text-h6 mt-4 mb-2">Chưa có đánh giá nào</h3>
        <p class="text-body-2 text-grey">Hãy là người đầu tiên đánh giá nhà hàng này</p>
      </v-card-text>

      <v-card-actions v-if="reviews.length">
        <v-spacer></v-spacer>
        <v-pagination
          v-model="currentPage"
          :length="totalPages"
          :total-visible="7"
        ></v-pagination>
        <v-spacer></v-spacer>
      </v-card-actions>
    </v-card>

    <!-- Report Review Dialog -->
    <v-dialog v-model="reportDialog.show" max-width="500">
      <v-card>
        <v-card-title>Báo cáo đánh giá</v-card-title>
        <v-card-text>
          <v-select
            v-model="reportDialog.reason"
            :items="reportReasons"
            label="Lý do báo cáo"
            variant="outlined"
            required
          ></v-select>
          
          <v-textarea
            v-model="reportDialog.description"
            label="Mô tả chi tiết"
            variant="outlined"
            rows="3"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" variant="text" @click="reportDialog.show = false">
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

    <!-- Image Preview Dialog -->
    <v-dialog v-model="imageDialog.show" max-width="800">
      <v-card>
        <v-card-text class="pa-0">
          <v-carousel
            v-model="imageDialog.currentIndex"
            hide-delimiter-background
            show-arrows="hover"
          >
            <v-carousel-item
              v-for="(image, i) in imageDialog.images"
              :key="i"
              :src="image"
              cover
            ></v-carousel-item>
          </v-carousel>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="imageDialog.show = false">
            Đóng
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import reviewService from '@/services/review.service';

export default {
  name: 'RestaurantReviews',

  props: {
    id: {
      type: [String, Number],
      required: true
    }
  },

  setup(props) {
    const store = useStore();
    const route = useRoute();
    const reviewForm = ref(null);

    // State
    const restaurant = ref({});
    const reviews = ref([]);
    const currentPage = ref(1);
    const totalPages = ref(1);
    const isSubmitting = ref(false);
    const isReviewFormValid = ref(false);

    // New review form
    const newReview = ref({
      rating: 0,
      comment: '',
      images: []
    });

    // Filters
    const filters = ref({
      sort: 'newest',
      rating: 'all'
    });

    // Dialogs
    const reportDialog = ref({
      show: false,
      reviewId: null,
      reason: '',
      description: '',
      loading: false
    });

    const imageDialog = ref({
      show: false,
      images: [],
      currentIndex: 0
    });

    // Constants
    const sortOptions = [
      { title: 'Mới nhất', value: 'newest' },
      { title: 'Đánh giá cao nhất', value: 'highest' },
      { title: 'Đánh giá thấp nhất', value: 'lowest' },
      { title: 'Hữu ích nhất', value: 'helpful' }
    ];

    const reportReasons = [
      { title: 'Nội dung không phù hợp', value: 'inappropriate' },
      { title: 'Thông tin sai lệch', value: 'misleading' },
      { title: 'Spam', value: 'spam' },
      { title: 'Khác', value: 'other' }
    ];

    // Validation rules
    const reviewRules = [
      v => !!v || 'Vui lòng nhập nhận xét',
      v => v.length >= 10 || 'Nhận xét phải có ít nhất 10 ký tự',
      v => v.length <= 500 || 'Nhận xét không được quá 500 ký tự'
    ];

    const imageRules = [
      files => !files || files.length <= 5 || 'Không được tải lên quá 5 ảnh'
    ];

    // Computed
    const canReview = computed(() => {
      return store.getters.isAuthenticated;
    });

    const displayedReviews = computed(() => {
      let filtered = [...reviews.value];

      // Apply rating filter
      if (filters.value.rating === 'positive') {
        filtered = filtered.filter(review => review.rating >= 4);
      } else if (filters.value.rating === 'critical') {
        filtered = filtered.filter(review => review.rating < 4);
      }

      // Apply sort
      switch (filters.value.sort) {
        case 'highest':
          filtered.sort((a, b) => b.rating - a.rating);
          break;
        case 'lowest':
          filtered.sort((a, b) => a.rating - b.rating);
          break;
        case 'helpful':
          filtered.sort((a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0));
          break;
        default: // newest
          filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      return filtered;
    });

    // Methods
    const loadReviews = async () => {
      try {
        const response = await reviewService.getRestaurantReviews(props.id, {
          page: currentPage.value,
          sort: filters.value.sort
        });
        reviews.value = response.data.data.reviews;
        totalPages.value = response.data.totalPages;
        restaurant.value = response.data.data.restaurant;
      } catch (error) {
        console.error('Error loading reviews:', error);
      }
    };

    const submitReview = async () => {
      if (!reviewForm.value) return;
      
      const { valid } = await reviewForm.value.validate();
      if (!valid) return;

      isSubmitting.value = true;
      try {
        await reviewService.createReview({
          restaurantId: props.id,
          ...newReview.value
        });

        // Reset form
        newReview.value = {
          rating: 0,
          comment: '',
          images: []
        };
        
        // Reload reviews
        await loadReviews();
        
        // Show success message
        store.dispatch('showSnackbar', {
          text: 'Đánh giá của bạn đã được gửi thành công',
          color: 'success'
        });
      } catch (error) {
        store.dispatch('showSnackbar', {
          text: error.response?.data?.message || 'Có lỗi xảy ra khi gửi đánh giá',
          color: 'error'
        });
      } finally {
        isSubmitting.value = false;
      }
    };

    const voteReview = async (reviewId, isHelpful) => {
      if (!store.getters.isAuthenticated) {
        store.dispatch('showLoginDialog');
        return;
      }

      try {
        await reviewService.voteReview(reviewId, isHelpful);
        await loadReviews();
      } catch (error) {
        console.error('Error voting review:', error);
      }
    };

    const canReportReview = (review) => {
      const user = store.getters.user;
      return user && review.userId !== user.id;
    };

    const openReportDialog = (review) => {
      reportDialog.value = {
        show: true,
        reviewId: review.id,
        reason: '',
        description: '',
        loading: false
      };
    };

    const submitReport = async () => {
      if (!reportDialog.value.reason) {
        store.dispatch('showSnackbar', {
          text: 'Vui lòng chọn lý do báo cáo',
          color: 'error'
        });
        return;
      }

      reportDialog.value.loading = true;
      try {
        await reviewService.reportReview(reportDialog.value.reviewId, {
          reason: reportDialog.value.reason,
          description: reportDialog.value.description
        });

        store.dispatch('showSnackbar', {
          text: 'Báo cáo đã được gửi thành công',
          color: 'success'
        });
        reportDialog.value.show = false;
      } catch (error) {
        store.dispatch('showSnackbar', {
          text: error.response?.data?.message || 'Có lỗi xảy ra khi gửi báo cáo',
          color: 'error'
        });
      } finally {
        reportDialog.value.loading = false;
      }
    };

    const openImageDialog = (images, index) => {
      imageDialog.value = {
        show: true,
        images,
        currentIndex: index
      };
    };

    const getRatingCount = (rating) => {
      return reviews.value.filter(review => Math.floor(review.rating) === rating).length;
    };

    const getRatingPercentage = (rating) => {
      if (!reviews.value.length) return 0;
      return (getRatingCount(rating) / reviews.value.length) * 100;
    };

    const formatDate = (date) => {
      return format(new Date(date), 'dd MMMM yyyy', { locale: vi });
    };

    // Watchers
    watch([currentPage, filters], () => {
      loadReviews();
    });

    // Lifecycle hooks
    onMounted(() => {
      loadReviews();
    });

    return {
      restaurant,
      reviews,
      currentPage,
      totalPages,
      filters,
      sortOptions,
      reportReasons,
      newReview,
      isSubmitting,
      isReviewFormValid,
      reviewForm,
      reviewRules,
      imageRules,
      reportDialog,
      imageDialog,
      displayedReviews,
      canReview,
      submitReview,
      voteReview,
      canReportReview,
      openReportDialog,
      submitReport,
      openImageDialog,
      getRatingCount,
      getRatingPercentage,
      formatDate
    };
  }
};
</script>

<style scoped>
.response-block {
  border-left: 4px solid var(--v-primary-base);
}
</style>