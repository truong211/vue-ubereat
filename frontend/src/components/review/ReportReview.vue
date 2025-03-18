<template>
  <div class="report-review">
    <v-dialog v-model="dialog" max-width="500">
      <template v-slot:activator="{ props }">
        <v-btn
          variant="text"
          size="small"
          density="compact"
          color="error"
          prepend-icon="mdi-flag"
          v-bind="props"
        >
          {{ $t('review.report') }}
        </v-btn>
      </template>

      <v-card>
        <v-card-title class="text-h6 pa-4">
          {{ $t('review.reportTitle') }}
        </v-card-title>

        <v-card-text>
          <v-form ref="form" v-model="isFormValid">
            <v-select
              v-model="reportReason"
              :items="reportReasons"
              :label="$t('review.reasonLabel')"
              :rules="[v => !!v || $t('review.reasonRequired')]"
              variant="outlined"
              class="mb-4"
            ></v-select>

            <v-textarea
              v-model="additionalInfo"
              :label="$t('review.additionalInfo')"
              :placeholder="$t('review.additionalInfoPlaceholder')"
              variant="outlined"
              rows="4"
              counter="500"
              :rules="[
                v => v.length <= 500 || $t('review.additionalInfoTooLong')
              ]"
            ></v-textarea>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="dialog = false"
          >
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            :loading="isSubmitting"
            :disabled="!isFormValid || isSubmitting"
            @click="submitReport"
          >
            {{ $t('review.submitReport') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'

export default {
  name: 'ReportReview',

  props: {
    reviewId: {
      type: String,
      required: true
    },
    itemType: {
      type: String,
      required: true,
      validator: (value) => ['restaurant', 'menuItem'].includes(value)
    },
    itemId: {
      type: [String, Number],
      required: true
    }
  },

  setup(props) {
    const { t } = useI18n()
    const store = useStore()
    const form = ref(null)
    const dialog = ref(false)
    const isFormValid = ref(false)
    const isSubmitting = ref(false)
    const reportReason = ref(null)
    const additionalInfo = ref('')

    const reportReasons = [
      { text: t('review.reportReasons.inappropriate'), value: 'inappropriate' },
      { text: t('review.reportReasons.spam'), value: 'spam' },
      { text: t('review.reportReasons.fake'), value: 'fake' },
      { text: t('review.reportReasons.offensive'), value: 'offensive' },
      { text: t('review.reportReasons.other'), value: 'other' }
    ]

    const submitReport = async () => {
      isSubmitting.value = true
      try {
        await store.dispatch('reviews/reportReview', {
          reviewId: props.reviewId,
          itemType: props.itemType,
          itemId: props.itemId,
          reason: reportReason.value,
          additionalInfo: additionalInfo.value
        })

        store.dispatch('showNotification', {
          type: 'success',
          message: t('review.reportSubmitted')
        })

        // Reset form
        reportReason.value = ''
        additionalInfo.value = ''
        dialog.value = false
      } catch (error) {
        console.error('Failed to submit report:', error)
        store.dispatch('showNotification', {
          type: 'error',
          message: t('review.reportError')
        })
      } finally {
        isSubmitting.value = false
      }
    }

    return {
      form,
      dialog,
      isFormValid,
      isSubmitting,
      reportReason,
      additionalInfo,
      reportReasons,
      submitReport
    }
  }
}
</script>

<style scoped>
.report-review {
  display: inline-block;
}
</style>