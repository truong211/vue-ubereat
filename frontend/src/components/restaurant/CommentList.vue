<template>
  <v-container>
    <!-- Comment List Controls -->
    <v-row class="mb-4">
      <v-col cols="12" sm="6" md="4">
        <v-select
          v-model="localSortBy"
          :items="sortOptions"
          label="Sort by"
          @update:model-value="updateSort"
        />
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-select
          v-model="localSortOrder"
          :items="orderOptions"
          label="Order"
          @update:model-value="updateSort"
        />
      </v-col>
      <v-col cols="12" sm="6" md="4" v-if="isRestaurantOwner">
        <v-select
          v-model="localFilterStatus"
          :items="statusOptions"
          label="Filter by status"
          @update:model-value="updateSort"
        />
      </v-col>
    </v-row>

    <!-- Comments List -->
    <v-row>
      <v-col cols="12">
        <v-card v-for="comment in comments" :key="comment.id" class="mb-4">
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <v-avatar size="40" class="mr-4">
                  <v-img :src="comment.user.avatar" />
                </v-avatar>
                <span class="text-h6">{{ comment.user.name }}</span>
              </div>
              <span class="text-caption">{{ formatDate(comment.createdAt) }}</span>
            </div>
            
            <p class="mt-4">{{ comment.content }}</p>

            <!-- Restaurant Owner Reply -->
            <div v-if="comment.reply" class="ml-8 mt-4 pa-4 bg-grey-lighten-4 rounded">
              <div class="d-flex align-center">
                <v-avatar size="32" class="mr-2">
                  <v-img :src="restaurantOwnerAvatar" />
                </v-avatar>
                <span class="text-subtitle-1 font-weight-bold">Restaurant Response:</span>
              </div>
              <p class="mt-2">{{ comment.reply }}</p>
            </div>

            <!-- Reply Form for Restaurant Owner -->
            <div v-if="isRestaurantOwner && !comment.reply" class="mt-4">
              <v-text-field
                v-model="replyText[comment.id]"
                label="Reply to this comment"
                variant="outlined"
                hide-details
              >
                <template v-slot:append>
                  <v-btn
                    color="primary"
                    @click="submitReply(comment.id)"
                    :loading="isSubmittingReply"
                  >
                    Reply
                  </v-btn>
                </template>
              </v-text-field>
            </div>

            <!-- Moderation Controls -->
            <div v-if="isRestaurantOwner" class="mt-4 d-flex justify-end">
              <v-btn-group variant="outlined">
                <v-btn
                  color="success"
                  :disabled="comment.status === 'approved'"
                  @click="moderateComment(comment.id, 'approved')"
                >
                  Approve
                </v-btn>
                <v-btn
                  color="error"
                  :disabled="comment.status === 'rejected'"
                  @click="moderateComment(comment.id, 'rejected')"
                >
                  Reject
                </v-btn>
              </v-btn-group>
            </div>
          </v-card-text>
        </v-card>

        <!-- Loading State -->
        <v-progress-circular
          v-if="loading"
          indeterminate
          color="primary"
          class="ma-4"
        />

        <!-- No Comments Message -->
        <v-alert
          v-if="!loading && comments.length === 0"
          type="info"
          text="No comments yet"
        />
      </v-col>
    </v-row>

    <!-- Pagination -->
    <v-row>
      <v-col cols="12" class="d-flex justify-center">
        <v-pagination
          v-if="totalPages > 1"
          v-model="currentPage"
          :length="totalPages"
          @update:model-value="handlePageChange"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { format } from 'date-fns';

export default {
  name: 'CommentList',
  props: {
    restaurantId: {
      type: String,
      required: true
    },
    isRestaurantOwner: {
      type: Boolean,
      default: false
    },
    restaurantOwnerAvatar: {
      type: String,
      default: ''
    }
  },

  setup(props) {
    const store = useStore();
    const replyText = ref({});
    const isSubmittingReply = ref(false);

    // Local state for sorting and filtering
    const localSortBy = ref(store.getters['comments/getSortBy']);
    const localSortOrder = ref(store.getters['comments/getSortOrder']);
    const localFilterStatus = ref(store.getters['comments/getFilterStatus']);

    // Options for dropdowns
    const sortOptions = [
      { title: 'Date', value: 'date' },
      { title: 'Status', value: 'status' }
    ];

    const orderOptions = [
      { title: 'Ascending', value: 'asc' },
      { title: 'Descending', value: 'desc' }
    ];

    const statusOptions = [
      { title: 'All', value: 'all' },
      { title: 'Pending', value: 'pending' },
      { title: 'Approved', value: 'approved' },
      { title: 'Rejected', value: 'rejected' }
    ];

    // Computed properties
    const comments = computed(() => store.getters['comments/getComments']);
    const loading = computed(() => store.getters['comments/isLoading']);
    const totalPages = computed(() => store.getters['comments/getTotalPages']);
    const currentPage = computed({
      get: () => store.getters['comments/getCurrentPage'],
      set: (value) => store.commit('comments/SET_CURRENT_PAGE', value)
    });

    // Methods
    const formatDate = (date) => {
      return format(new Date(date), 'MMM d, yyyy HH:mm');
    };

    const updateSort = () => {
      store.dispatch('comments/updateSortAndFilter', {
        sortBy: localSortBy.value,
        sortOrder: localSortOrder.value,
        filterStatus: localFilterStatus.value,
        restaurantId: props.restaurantId
      });
    };

    const handlePageChange = (page) => {
      store.dispatch('comments/setPage', {
        page,
        restaurantId: props.restaurantId
      });
    };

    const submitReply = async (commentId) => {
      if (!replyText.value[commentId]) return;

      isSubmittingReply.value = true;
      try {
        await store.dispatch('comments/replyToComment', {
          restaurantId: props.restaurantId,
          commentId,
          content: replyText.value[commentId]
        });
        replyText.value[commentId] = '';
      } catch (error) {
        console.error('Failed to submit reply:', error);
      } finally {
        isSubmittingReply.value = false;
      }
    };

    const moderateComment = async (commentId, status) => {
      try {
        await store.dispatch('comments/moderateComment', {
          restaurantId: props.restaurantId,
          commentId,
          status
        });
      } catch (error) {
        console.error('Failed to moderate comment:', error);
      }
    };

    // Fetch initial comments
    onMounted(() => {
      store.dispatch('comments/fetchComments', props.restaurantId);
    });

    return {
      comments,
      loading,
      totalPages,
      currentPage,
      localSortBy,
      localSortOrder,
      localFilterStatus,
      sortOptions,
      orderOptions,
      statusOptions,
      replyText,
      isSubmittingReply,
      formatDate,
      updateSort,
      handlePageChange,
      submitReply,
      moderateComment
    };
  }
};
</script>