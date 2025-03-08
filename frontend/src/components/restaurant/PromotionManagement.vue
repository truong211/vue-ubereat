<!-- Previous template content remains the same -->

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Store } from 'vuex'
import { RootState, PromotionItem } from '@/store'
import { formatISO, format, isAfter, isBefore } from 'date-fns'
import { inject } from 'vue'

interface PromotionForm {
  name: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  minOrderValue?: number
  startDate: string
  endDate: string
  usageLimit?: number
  active: boolean
  description?: string
}

const { t } = useI18n()
const store = inject<Store<RootState>>('store')!

// State
const search = ref('')
const typeFilter = ref('all')
const statusFilter = ref('all')
const promotionDialog = ref(false)
const deleteDialog = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)
const isFormValid = ref(false)
const updatingStatus = ref<string | null>(null)

const promotionForm = ref<PromotionForm>({
  name: '',
  code: '',
  type: 'fixed',
  value: 0,
  startDate: format(new Date(), 'yyyy-MM-dd'),
  endDate: format(new Date(), 'yyyy-MM-dd'),
  active: true
})

const promotionFormRef = ref()
const editingPromotion = ref<PromotionItem | null>(null)

// Form validation rules
const nameRules = [
  (v: string) => !!v || t('validation.required'),
  (v: string) => v.length >= 3 || t('validation.minLength', { length: 3 })
]

const codeRules = [
  (v: string) => !!v || t('validation.required'),
  (v: string) => /^[A-Z0-9_-]+$/.test(v) || t('restaurant.promotions.codeFormat')
]

const valueRules = [
  (v: number) => !!v || t('validation.required'),
  (v: number) => v > 0 || t('validation.positive'),
  (v: number) => {
    if (promotionForm.value.type === 'percentage') {
      return v <= 100 || t('restaurant.promotions.maxPercentage')
    }
    return true
  }
]

const dateRules = [
  (v: string) => !!v || t('validation.required')
]

// Options
const promotionTypes = computed(() => [
  { title: t('restaurant.promotions.types.fixed'), value: 'fixed' },
  { title: t('restaurant.promotions.types.percentage'), value: 'percentage' }
])

const promotionStatuses = computed(() => [
  { title: t('restaurant.promotions.statuses.all'), value: 'all' },
  { title: t('restaurant.promotions.statuses.active'), value: 'active' },
  { title: t('restaurant.promotions.statuses.inactive'), value: 'inactive' },
  { title: t('restaurant.promotions.statuses.expired'), value: 'expired' }
])

const getValueLabel = computed(() => {
  return promotionForm.value.type === 'percentage'
    ? t('restaurant.promotions.discountPercentage')
    : t('restaurant.promotions.discountAmount')
})

const filteredPromotions = computed(() => {
  let promotions: PromotionItem[] = store.state.restaurant.promotions

  // Search filter
  if (search.value) {
    const searchLower = search.value.toLowerCase()
    promotions = promotions.filter(p => 
      p.name.toLowerCase().includes(searchLower) ||
      p.code.toLowerCase().includes(searchLower)
    )
  }

  // Type filter
  if (typeFilter.value !== 'all') {
    promotions = promotions.filter(p => p.type === typeFilter.value)
  }

  // Status filter
  if (statusFilter.value !== 'all') {
    const now = new Date()
    switch (statusFilter.value) {
      case 'active':
        promotions = promotions.filter(p => 
          p.active &&
          !isAfter(now, new Date(p.endDate))
        )
        break
      case 'inactive':
        promotions = promotions.filter(p => !p.active)
        break
      case 'expired':
        promotions = promotions.filter(p => 
          isAfter(now, new Date(p.endDate))
        )
        break
    }
  }

  return promotions
})

// Methods
const openPromotionDialog = (promotion?: PromotionItem) => {
  if (promotion) {
    editingPromotion.value = promotion
    promotionForm.value = {
      name: promotion.name,
      code: promotion.code,
      type: promotion.type,
      value: promotion.value,
      minOrderValue: promotion.minOrderValue,
      startDate: format(new Date(promotion.startDate), 'yyyy-MM-dd'),
      endDate: format(new Date(promotion.endDate), 'yyyy-MM-dd'),
      usageLimit: promotion.usageLimit,
      active: promotion.active,
      description: promotion.description
    }
  } else {
    editingPromotion.value = null
    promotionForm.value = {
      name: '',
      code: '',
      type: 'fixed',
      value: 0,
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
      active: true
    }
  }
  promotionDialog.value = true
}

const savePromotion = async () => {
  const isValid = await promotionFormRef.value?.validate()
  if (!isValid?.valid) return

  isSaving.value = true
  try {
    const promotionData = {
      ...promotionForm.value,
      startDate: formatISO(new Date(promotionForm.value.startDate)),
      endDate: formatISO(new Date(promotionForm.value.endDate))
    }

    if (editingPromotion.value) {
      await store.dispatch('updatePromotion', {
        id: editingPromotion.value.id,
        ...promotionData
      })
    } else {
      await store.dispatch('createPromotion', promotionData)
    }

    promotionDialog.value = false
    store.dispatch('showNotification', {
      type: 'success',
      message: t(editingPromotion.value 
        ? 'restaurant.promotions.updated'
        : 'restaurant.promotions.created'
      )
    })
  } catch (error) {
    store.dispatch('showNotification', {
      type: 'error',
      message: t('restaurant.promotions.saveFailed')
    })
  } finally {
    isSaving.value = false
  }
}

const confirmDelete = (promotion: PromotionItem) => {
  editingPromotion.value = promotion
  deleteDialog.value = true
}

const deletePromotion = async () => {
  if (!editingPromotion.value) return

  isDeleting.value = true
  try {
    await store.dispatch('deletePromotion', editingPromotion.value.id)
    deleteDialog.value = false
    store.dispatch('showNotification', {
      type: 'success',
      message: t('restaurant.promotions.deleted')
    })
  } catch (error) {
    store.dispatch('showNotification', {
      type: 'error',
      message: t('restaurant.promotions.deleteFailed')
    })
  } finally {
    isDeleting.value = false
  }
}

const togglePromotion = async (promotion: PromotionItem) => {
  updatingStatus.value = promotion.id
  try {
    await store.dispatch('updatePromotionStatus', {
      id: promotion.id,
      active: promotion.active
    })
    store.dispatch('showNotification', {
      type: 'success',
      message: t('restaurant.promotions.statusUpdated')
    })
  } catch (error) {
    promotion.active = !promotion.active // Revert on failure
    store.dispatch('showNotification', {
      type: 'error',
      message: t('restaurant.promotions.updateFailed')
    })
  } finally {
    updatingStatus.value = null
  }
}

const getTypeColor = (type: string): string => {
  return type === 'percentage' ? 'primary' : 'success'
}

const formatPromotionValue = (promotion: PromotionItem): string => {
  if (promotion.type === 'percentage') {
    return `${promotion.value}%`
  }
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(promotion.value)
}

const formatDate = (date: string): string => {
  return format(new Date(date), 'dd/MM/yyyy')
}

// Load promotions on mount
store.dispatch('fetchPromotions')
</script>

<style scoped>
.promotion-management {
  padding: 16px;
}

:deep(.v-table) {
  background: transparent;
}
</style>