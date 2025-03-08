<template>
  <div class="restaurant-response">
    <template v-if="response">
      <!-- Display existing response -->
      <v-card variant="outlined" class="response-card ml-12 mt-2 mb-4">
        <v-card-text>
          <div class="d-flex align-center mb-2">
            <v-avatar size="32" color="primary" class="mr-3">
              <v-icon color="white">mdi-store</v-icon>
            </v-avatar>
            <div>
              <div class="text-subtitle-1 font-weight-medium">
                {{ response.responderName }}
                <span class="text-caption text-grey-darken-1">
                  ({{ $t('review.restaurantStaff') }})
                </span>
              </div>
              <div class="text-caption text-grey-darken-1">
                {{ formatDate(response.date) }}
              </div>
            </div>
            <!-- Edit button for restaurant staff -->
            <v-spacer></v-spacer>
            <v-btn
              v-if="canRespond"
              icon="mdi-pencil"
              variant="text"
              size="small"
              @click="startEditing"
            ></v-btn>
          </div>
          
          <template v-if="isEditing">
            <v-textarea
              v-model="editedResponse"
              :placeholder="$t('review.responsePlaceholder')"
              variant="outlined"
              rows="3"
              counter="1000"
              :rules="responseRules"
              auto-grow
              hide-details="auto"
            ></v-textarea>
            <div class="d-flex justify-end mt-2">
              <v-btn
                variant="text"
                @click="cancelEditing"
                class="mr-2"
                :disabled="isSubmitting"
              >
                {{ $t('common.cancel') }}
              </v-btn>
              <v-btn
                color="primary"
                @click="updateResponse"
                :loading="isSubmitting"
                :disabled="!isValidResponse"
              >
                {{ $t('common.save') }}
              </v-btn>
            </div>
          </template>
          <template v-else>
            <p class="text-body-1 mt-2">{{ response.content }}</p>
          </template>
        </v-card-text>
      </v-card>
    </template>

    <!-- Add response button for restaurant staff -->
    <template v-else-if="canRespond">
      <div class="ml-12 mt-2">
        <v-btn
          variant="outlined"
          color="primary"
          size="small"
          prepend-icon="mdi-reply"
          @click="startEditing"
        >
          {{ $t('review.addResponse') }}
        </v-btn>

        <v-expand-transition>
          <div v-if="isEditing" class="mt-2">
            <v-textarea
              v-model="editedResponse"
              :placeholder="$t('review.responsePlaceholder')"
              variant="outlined"
              rows="3"
              counter="1000"
              :rules="responseRules"
              auto-grow
              hide-details="auto"
            ></v-textarea>
            <div class="d-flex justify-end mt-2">
              <v-btn
                variant="text"
                @click="cancelEditing"
                class="mr-2"
                :disabled="isSubmitting"
              >
                {{ $t('common.cancel') }}
              </v-btn>
              <v-btn
                color="primary"
                @click="submitResponse"
                :loading="isSubmitting"
                :disabled="!isValidResponse"
              >
                {{ $t('common.submit') }}
              </v-btn>
            </div>
          </div>
        </v-expand-transition>
      </div>
    </template>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'

export default {
  name: 'RestaurantResponse',

  props: {
    reviewId: {
      type: String,
      required: true
    },
    restaurantId: {
      type: [String, Number],
      required: true
    },
    response: {
      type: Object,
      default: null
    }
  },

  emits: ['response-updated'],

  setup(props, { emit }) {
    const store = useStore()
    const { t } = useI18n()
    
    const isEditing = ref(false)
    const isSubmitting = ref(false)
    const editedResponse = ref('')

    // Check if current user can respond (restaurant staff)
    const canRespond = computed(() => {
      return store.getters['restaurants/canManageRestaurant'](props.restaurantId)
    })

    const responseRules = [
      v => !!v || t('review.responseRequired'),
      v => v.length >= 10 || t('review.responseTooShort'),
      v => v.length <= 1000 || t('review.responseTooLong')
    ]

    const isValidResponse = computed(() => {
      return editedResponse.value?.length >= 10 && editedResponse.value?.length <= 1000
    })

    const startEditing = () => {
      editedResponse.value = props.response?.content || ''
      isEditing.value = true
    }

    const cancelEditing = () => {
      editedResponse.value = ''
      isEditing.value = false
    }

    const submitResponse = async () => {
      if (!isValidResponse.value) return

      isSubmitting.value = true

      try {
        const response = await store.dispatch('reviews/addRestaurantResponse', {
          reviewId: props.reviewId,
          restaurantId: props.restaurantId,
          content: editedResponse.value
        })

        emit('response-updated', response)
        isEditing.value = false
        editedResponse.value = ''

        store.dispatch('showNotification', {
          type: 'success',
          message: t('review.responseAdded')
        })
      } catch (error) {
        store.dispatch('showNotification', {
          type: 'error',
          message: t('review.responseError')
        })
      } finally {
        isSubmitting.value = false
      }
    }

    const updateResponse = async () => {
      if (!isValidResponse.value) return

      isSubmitting.value = true

      try {
        const response = await store.dispatch('reviews/updateRestaurantResponse', {
          reviewId: props.reviewId,
          restaurantId: props.restaurantId,
          content: editedResponse.value
        })

        emit('response-updated', response)
        isEditing.value = false
        editedResponse.value = ''

        store.dispatch('showNotification', {
          type: 'success',
          message: t('review.responseUpdated')
        })
      } catch (error) {
        store.dispatch('showNotification', {
          type: 'error',
          message: t('review.responseError')
        })
      } finally {
        isSubmitting.value = false
      }
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    return {
      isEditing,
      isSubmitting,
      editedResponse,
      canRespond,
      responseRules,
      isValidResponse,
      startEditing,
      cancelEditing,
      submitResponse,
      updateResponse,
      formatDate
    }
  }
}
</script>

<style scoped>
.response-card {
  background-color: var(--v-surface-variant);
}

.response-card:hover {
  background-color: var(--v-surface-variant-hover);
}
</style>