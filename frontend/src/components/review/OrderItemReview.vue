<template>
  <div class="order-item-review">
    <!-- Item reviews section -->
    <v-expansion-panels v-if="review.itemRatings && review.itemRatings.length">
      <v-expansion-panel>
        <v-expansion-panel-title>
          <div class="d-flex align-center">
            <v-icon color="primary" class="mr-2">mdi-silverware-fork-knife</v-icon>
            <span>Individual Item Ratings ({{ review.itemRatings.length }})</span>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-list>
            <template v-for="(itemRating, index) in review.itemRatings" :key="itemRating.productId">
              <v-list-item>
                <div class="d-flex flex-column w-100">
                  <!-- Item info with rating -->
                  <div class="d-flex align-center mb-2">
                    <v-avatar size="40" class="mr-3">
                      <v-img v-if="getProductImage(itemRating.productId)" :src="getProductImage(itemRating.productId)" alt="Food item"></v-img>
                      <v-icon v-else>mdi-food</v-icon>
                    </v-avatar>
                    <div>
                      <div class="text-subtitle-1">{{ getProductName(itemRating.productId) }}</div>
                      <v-rating
                        :model-value="itemRating.rating"
                        color="amber"
                        density="compact"
                        half-increments
                        readonly
                        size="small"
                      ></v-rating>
                    </div>
                  </div>
                  
                  <!-- Item comment -->
                  <p v-if="itemRating.comment" class="text-body-2 mb-2 ml-12">{{ itemRating.comment }}</p>
                  
                  <!-- Item tags/aspects -->
                  <div v-if="itemRating.aspects && itemRating.aspects.length" class="ml-12 mb-2">
                    <v-chip-group>
                      <v-chip
                        v-for="aspect in itemRating.aspects"
                        :key="aspect"
                        size="small"
                        color="success"
                        variant="outlined"
                      >
                        {{ formatAspect(aspect) }}
                      </v-chip>
                    </v-chip-group>
                  </div>
                  
                  <!-- Item images -->
                  <div v-if="itemRating.images && itemRating.images.length" class="ml-12 mt-2">
                    <div class="d-flex flex-wrap">
                      <div 
                        v-for="(image, i) in itemRating.images" 
                        :key="i" 
                        class="ma-1"
                      >
                        <v-img
                          :src="image"
                          width="80"
                          height="80"
                          cover
                          class="rounded cursor-pointer"
                          @click="openGallery(itemRating.images, i)"
                        ></v-img>
                      </div>
                    </div>
                  </div>
                </div>
              </v-list-item>
              <v-divider v-if="index < review.itemRatings.length - 1"></v-divider>
            </template>
          </v-list>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    
    <!-- Image gallery dialog -->
    <v-dialog v-model="galleryDialog.show" max-width="90vw">
      <v-card>
        <v-toolbar density="compact" color="primary" dark>
          <v-toolbar-title>Food Photos</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="galleryDialog.show = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        
        <v-card-text class="pa-0">
          <v-carousel
            v-if="galleryDialog.images.length"
            v-model="galleryDialog.currentIndex"
            height="80vh"
            hide-delimiters
            show-arrows="hover"
          >
            <v-carousel-item
              v-for="(image, i) in galleryDialog.images"
              :key="i"
            >
              <div class="d-flex justify-center align-center" style="height: 100%">
                <v-img
                  :src="image"
                  max-height="80vh"
                  max-width="100%"
                  contain
                ></v-img>
              </div>
            </v-carousel-item>
          </v-carousel>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed } from 'vue';

export default {
  name: 'OrderItemReview',
  
  props: {
    review: {
      type: Object,
      required: true
    },
    products: {
      type: Array,
      default: () => []
    }
  },
  
  setup(props) {
    const galleryDialog = ref({
      show: false,
      images: [],
      currentIndex: 0
    });
    
    const getProductName = (productId) => {
      const product = props.products.find(p => p.id === productId);
      return product ? product.name : 'Unknown Item';
    };
    
    const getProductImage = (productId) => {
      const product = props.products.find(p => p.id === productId);
      return product ? product.image : null;
    };
    
    const formatAspect = (aspect) => {
      // Convert snake_case to Title Case
      return aspect
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };
    
    const openGallery = (images, index) => {
      galleryDialog.value = {
        show: true,
        images,
        currentIndex: index
      };
    };
    
    return {
      galleryDialog,
      getProductName,
      getProductImage,
      formatAspect,
      openGallery
    };
  }
};
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.order-item-review {
  margin-top: 1rem;
}
</style> 