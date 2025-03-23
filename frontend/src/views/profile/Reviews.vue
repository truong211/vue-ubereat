<template>
  <v-container>
    <h2 class="text-h5 mb-6">Đánh giá của tôi</h2>

    <!-- Reviews List -->
    <v-card>
      <v-list v-if="reviews.length">
        <template v-for="(review, index) in reviews" :key="review.id">
          <v-list-item>
            <template v-slot:prepend>
              <v-avatar :image="review.restaurant?.logo" size="56">
                <v-icon v-if="!review.restaurant?.logo">mdi-store</v-icon>
              </v-avatar>
            </template>

            <v-list-item-title>
              <div class="d-flex justify-space-between align-center">
                <div>
                  <div class="text-subtitle-1 font-weight-bold">{{ review.restaurant?.name }}</div>
                  <div class="d-flex align-center mt-1">
                    <v-rating
                      v-model="review.rating"
                      color="amber"
                      density="compact"
                      half-increments
                      readonly
                      size="small"
                    ></v-rating>
                    <span class="text-caption text-grey ml-2">{{ formatDate(review.createdAt) }}</span>
                  </div>
                </div>

                <div class="d-flex">
                  <v-btn
                    icon="mdi-pencil"
                    variant="text"
                    density="compact"
                    @click="openEditDialog(review)"
                  ></v-btn>
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    density="compact"
                    color="error"
                    @click="confirmDelete(review)"
                  ></v-btn>
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
        <p class="text-body-2 text-grey">Bạn chưa viết đánh giá nào</p>
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

    <!-- Edit Review Dialog -->
    <v-dialog v-model="editDialog.show" max-width="600">
      <v-card>
        <v-card-title>Chỉnh sửa đánh giá</v-card-title>
        <v-card-text>
          <v-form ref="editForm" v-model="editDialog.isValid">
            <div class="mb-4">
              <div class="text-subtitle-1 mb-2">Đánh giá của bạn</div>
              <v-rating
                v-model="editDialog.review.rating"
                color="amber"
                hover
                half-increments
                size="large"
              ></v-rating>
            </div>
            
            <v-textarea
              v-model="editDialog.review.comment"
              label="Nhận xét của bạn"
              variant="outlined"
              rows="4"
              counter="500"
              :rules="reviewRules"
            ></v-textarea>

            <v-file-input
              v-model="editDialog.review.newImages"
              label="Thêm hình ảnh mới (tối đa 5 ảnh)"
              accept="image/*"
              multiple
              :rules="imageRules"
              chips
              variant="outlined"
              class="mt-4"
            ></v-file-input>

            <!-- Existing Images -->
            <div v-if="editDialog.review.images?.length" class="mt-4">
              <div class="text-subtitle-1 mb-2">Hình ảnh hiện tại</div>
              <v-row>
                <v-col v-for="(image, i) in editDialog.review.images" :key="i" cols="auto">
                  <v-card width="100" height="100" class="position-relative">
                    <v-img
                      :src="image"
                      width="100"
                      height="100"
                      cover
                    ></v-img>
                    <v-btn
                      icon="mdi-close"
                      size="x-small"
                      color="error"
                      variant="flat"
                      class="position-absolute"
                      style="top: 4px; right: 4px"
                      @click="removeImage(i)"
                    ></v-btn>
                  </v-card>
                </v-col>
              </v-row>
            </div>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" variant="text" @click="editDialog.show = false">
            Hủy
          </v-btn>
          <v-btn
            color="primary"
            :loading="editDialog.loading"
            @click="submitEdit"
          >
            Lưu
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog.show" max-width="400">
      <v-card>
        <v-card-title>Xác nhận xóa</v-card-title>
        <v-card-text>
          Bạn có chắc chắn muốn xóa đánh giá này không?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" variant="text" @click="deleteDialog.show = false">
            Hủy
          </v-btn>
          <v-btn
            color="primary"
            :loading="deleteDialog.loading"
            @click="confirmDeleteReview"
          >
            Xóa
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
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { format } from 'date-fns';
import { viVN } from 'date-fns/locale';
import reviewService from '@/services/review.service';

export default {
  name: 'UserReviews',

  setup() {
    const store = useStore();
    const editForm = ref(null);

    // State
    const reviews = ref([]);
    const currentPage = ref(1);
    const totalPages = ref(1);

    // Dialogs
    const editDialog = ref({
      show: false,
      loading: false,
      isValid: false,
      review: null
    });

    const deleteDialog = ref({
      show: false,
      loading: false,
      review: null
    });

    const imageDialog = ref({
      show: false,
      images: [],
      currentIndex: 0
    });

    // Validation rules
    const reviewRules = [
      v => !!v || 'Vui lòng nhập nhận xét',
      v => v.length >= 10 || 'Nhận xét phải có ít nhất 10 ký tự',
      v => v.length <= 500 || 'Nhận xét không được quá 500 ký tự'
    ];

    const imageRules = [
      files => !files || files.length <= 5 || 'Không được tải lên quá 5 ảnh'
    ];

    // Methods
    const loadReviews = async () => {
      try {
        const response = await reviewService.getUserReviews({
          page: currentPage.value
        });
        reviews.value = response.data.data.reviews;
        totalPages.value = response.data.totalPages;
      } catch (error) {
        console.error('Error loading reviews:', error);
        store.dispatch('showSnackbar', {
          text: 'Không thể tải danh sách đánh giá',
          color: 'error'
        });
      }
    };

    const openEditDialog = (review) => {
      editDialog.value = {
        show: true,
        loading: false,
        isValid: true,
        review: {
          ...review,
          newImages: []
        }
      };
    };

    const removeImage = (index) => {
      editDialog.value.review.images.splice(index, 1);
    };

    const submitEdit = async () => {
      if (!editForm.value) return;
      
      const { valid } = await editForm.value.validate();
      if (!valid) return;

      editDialog.value.loading = true;
      try {
        await reviewService.updateReview(editDialog.value.review.id, {
          rating: editDialog.value.review.rating,
          comment: editDialog.value.review.comment,
          images: editDialog.value.review.images,
          newImages: editDialog.value.review.newImages
        });

        await loadReviews();
        editDialog.value.show = false;
        
        store.dispatch('showSnackbar', {
          text: 'Đánh giá đã được cập nhật',
          color: 'success'
        });
      } catch (error) {
        store.dispatch('showSnackbar', {
          text: error.response?.data?.message || 'Không thể cập nhật đánh giá',
          color: 'error'
        });
      } finally {
        editDialog.value.loading = false;
      }
    };

    const confirmDelete = (review) => {
      deleteDialog.value = {
        show: true,
        loading: false,
        review
      };
    };

    const confirmDeleteReview = async () => {
      deleteDialog.value.loading = true;
      try {
        await reviewService.deleteReview(deleteDialog.value.review.id);
        await loadReviews();
        deleteDialog.value.show = false;
        
        store.dispatch('showSnackbar', {
          text: 'Đánh giá đã được xóa',
          color: 'success'
        });
      } catch (error) {
        store.dispatch('showSnackbar', {
          text: error.response?.data?.message || 'Không thể xóa đánh giá',
          color: 'error'
        });
      } finally {
        deleteDialog.value.loading = false;
      }
    };

    const openImageDialog = (images, index) => {
      imageDialog.value = {
        show: true,
        images,
        currentIndex: index
      };
    };

    const formatDate = (date) => {
      return format(new Date(date), 'dd MMMM yyyy', { locale: viVN });
    };

    // Lifecycle hooks
    onMounted(() => {
      loadReviews();
    });

    return {
      reviews,
      currentPage,
      totalPages,
      editDialog,
      deleteDialog,
      imageDialog,
      editForm,
      reviewRules,
      imageRules,
      openEditDialog,
      removeImage,
      submitEdit,
      confirmDelete,
      confirmDeleteReview,
      openImageDialog,
      formatDate
    };
  }
};
</script>

<style scoped>
.response-block {
  border-left: 4px solid var(--v-primary-base);
}

.position-relative {
  position: relative;
}

.position-absolute {
  position: absolute;
}
</style>