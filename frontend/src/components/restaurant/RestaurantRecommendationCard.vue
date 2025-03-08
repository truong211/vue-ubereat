<template>
  <v-card class="recommendation-card h-100" hover @click="navigateToItem">
    <v-img :src="item.image" height="150" cover class="position-relative">
      <div class="pa-2 d-flex justify-end">
        <v-chip
          v-if="item.trending"
          color="error"
          size="x-small"
          class="trending-chip"
        >
          Trending
        </v-chip>
      </div>
    </v-img>
    
    <v-card-title class="pb-1 pt-3">
      {{ item.name }}
    </v-card-title>
    
    <v-card-text>
      <div class="d-flex align-center mb-2">
        <v-rating
          :model-value="item.rating"
          color="amber"
          density="compact"
          half-increments
          readonly
          size="x-small"
        ></v-rating>
        <span class="text-body-2 ml-1">{{ item.rating }}</span>
      </div>
      
      <div class="text-caption text-truncate mb-2">
        {{ item.categories?.join(', ') }}
      </div>
      
      <v-chip
        v-if="item.lastOrdered"
        size="x-small"
        color="grey-lighten-3"
        class="mb-2"
      >
        <v-icon start size="x-small">mdi-history</v-icon>
        {{ item.lastOrdered }}
      </v-chip>
      
      <div v-if="item.favoriteItem" class="d-flex align-center text-caption">
        <v-icon size="x-small" color="red-lighten-1" class="mr-1">mdi-heart</v-icon>
        <span>You love: {{ item.favoriteItem }}</span>
      </div>
      
      <div v-if="item.reason" class="d-flex align-center text-caption">
        <v-icon size="x-small" color="primary" class="mr-1">mdi-thumb-up</v-icon>
        <span>{{ item.reason }}</span>
      </div>
      
      <div v-if="item.popularity" class="d-flex align-center text-caption">
        <v-icon size="x-small" color="info" class="mr-1">mdi-fire</v-icon>
        <span>{{ item.popularity }}</span>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { useRouter } from 'vue-router'

export default {
  name: 'RestaurantRecommendationCard',
  
  props: {
    item: {
      type: Object,
      required: true
    }
  },
  
  setup(props) {
    const router = useRouter()
    
    const navigateToItem = () => {
      if (props.item.type === 'restaurant') {
        router.push({
          name: 'RestaurantDetail',
          params: { id: props.item.id }
        })
      } else if (props.item.type === 'dish') {
        router.push({
          name: 'RestaurantDetail',
          params: { id: props.item.restaurantId },
          query: { highlight: props.item.id }
        })
      }
    }
    
    return {
      navigateToItem
    }
  }
}
</script>

<style scoped>
.recommendation-card {
  transition: transform 0.2s ease;
}

.recommendation-card:hover {
  transform: translateY(-4px);
}

.trending-chip {
  background: rgba(244, 67, 54, 0.8) !important;
  color: white !important;
}
</style> 