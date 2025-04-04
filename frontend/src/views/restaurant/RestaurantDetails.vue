<template>
  <div class="restaurant-details">
    <!-- Other restaurant details sections -->
    
    <!-- Reviews Section -->
    <section id="reviews" class="mt-8">
      <v-container>
        <ReviewComponentVi
          :restaurantId="restaurantId"
          @review-submitted="handleReviewSubmitted"
        />
      </v-container>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import ReviewComponentVi from '@/components/review/ReviewComponentVi.vue'

const route = useRoute()
const store = useStore()

const restaurantId = ref(null)

// Initialize component
onMounted(() => {
  restaurantId.value = parseInt(route.params.id)
})

// Handle new review submission
const handleReviewSubmitted = () => {
  // Refresh restaurant data to update rating
  store.dispatch('restaurants/fetchRestaurantById', { id: restaurantId.value })
}
</script>