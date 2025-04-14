<template>
  <div class="order-tracking">
    <v-card class="mb-4">
      <v-card-title class="d-flex align-center">
        Real-time Order Tracking
        <v-spacer></v-spacer>
        <v-chip
          :color="connectionStatus.color"
          size="small"
          class="ml-2"
        >
          {{ connectionStatus.text }}
        </v-chip>
      </v-card-title>
      
      <v-card-text>
        <div v-if="loading" class="d-flex justify-center align-center py-8">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <span class="ml-3">Loading tracking information...</span>
        </div>
        
        <div v-else-if="error" class="text-center py-6">
          <v-icon color="error" size="large" class="mb-2">mdi-alert-circle</v-icon>
          <p class="text-subtitle-1 mb-4">{{ error }}</p>
          <v-btn color="primary" @click="retryConnection">
            Retry Connection
          </v-btn>
        </div>
        
        <div v-else>
          <!-- Order Status Timeline -->
          <v-timeline density="compact" class="mb-6">
            <v-timeline-item
              v-for="(step, index) in statusSteps"
              :key="index"
              :dot-color="getStepColor(step.status)"
              :size="currentStepIndex >= index ? 'small' : 'x-small'"
              :fill-dot="currentStepIndex >= index"
            >
              <div class="d-flex justify-space-between">
                <div>
                  <div class="text-subtitle-1" :class="{ 'font-weight-bold': currentStepIndex >= index }">
                    {{ step.label }}
                  </div>
                  <div class="text-caption">{{ step.description }}</div>
                </div>
                <div v-if="step.timestamp && currentStepIndex >= index" class="text-caption text-grey">
                  {{ formatTime(step.timestamp) }}
                </div>
              </div>
            </v-timeline-item>
          </v-timeline>

          <!-- Review Order Section - Show after delivery is complete -->
          <v-expand-transition>
            <div v-if="order.status === 'delivered' && !hasReviewed">
              <v-card class="mb-6" variant="outlined">
                <v-card-title class="d-flex align-center">
                  Rate Your Experience
                  <v-spacer></v-spacer>
                  <v-chip color="success" size="small">Order Completed</v-chip>
                </v-card-title>
                
                <v-card-text>
                  <v-tabs v-model="reviewTab">
                    <v-tab value="overall">Overall Experience</v-tab>
                    <v-tab value="food">Food Items</v-tab>
                    <v-tab value="delivery">Delivery</v-tab>
                  </v-tabs>
                  
                  <v-window v-model="reviewTab" class="mt-4">
                    <!-- Overall Experience Tab -->
                    <v-window-item value="overall">
                      <div class="mb-4">
                        <div class="text-subtitle-1 mb-2">Restaurant Rating</div>
                        <v-rating
                          v-model="review.restaurantRating"
                          color="amber"
                          hover
                          half-increments
                          size="large"
                        ></v-rating>
                      </div>
                      
                      <v-textarea
                        v-model="review.comment"
                        label="Share your experience with this restaurant"
                        placeholder="Was the food good? Was the packaging well done? Would you order again?"
                        variant="outlined"
                        rows="3"
                        counter="500"
                        :rules="commentRules"
                      ></v-textarea>
                    </v-window-item>
                    
                    <!-- Food Items Tab -->
                    <v-window-item value="food">
                      <div v-if="order.items && order.items.length > 0">
                        <div v-for="(item, index) in order.items" :key="index" class="mb-6">
                          <div class="d-flex align-center mb-2">
                            <v-avatar size="40" class="mr-3">
                              <v-img v-if="item.image" :src="item.image" alt="Food item"></v-img>
                              <v-icon v-else>mdi-food</v-icon>
                            </v-avatar>
                            <div class="text-subtitle-1">{{ item.name }}</div>
                          </div>
                          
                          <v-rating
                            v-model="getItemRating(item.id)"
                            color="amber"
                            hover
                            half-increments
                            size="medium"
                            class="mb-2"
                            @update:model-value="updateItemRating(item.id, $event)"
                          ></v-rating>
                          
                          <v-textarea
                            v-model="getItemComment(item.id)"
                            label="Comment about this item (optional)"
                            placeholder="Share your thoughts about this specific dish"
                            variant="outlined"
                            rows="2"
                            class="mb-2"
                            @update:model-value="updateItemComment(item.id, $event)"
                          ></v-textarea>
                          
                          <!-- Image Upload for Item -->
                          <div class="mb-2">
                            <div class="d-flex align-center mb-2">
                              <span class="text-subtitle-2">Upload photos of this dish</span>
                              <v-tooltip location="top" text="Help other customers see what the dish looks like">
                                <template v-slot:activator="{ props }">
                                  <v-icon size="small" class="ms-1" v-bind="props">mdi-information-outline</v-icon>
                                </template>
                              </v-tooltip>
                            </div>
                            
                            <v-file-input
                              v-model="getItemImages(item.id)"
                              accept="image/*"
                              placeholder="Add photos"
                              prepend-icon="mdi-camera"
                              label="Food photos"
                              multiple
                              chips
                              :show-size="true"
                              @update:model-value="updateItemImages(item.id, $event)"
                            ></v-file-input>
                            
                            <!-- Preview Images -->
                            <div v-if="getItemImagePreviews(item.id).length > 0" class="d-flex flex-wrap gap-2 mt-2">
                              <div v-for="(preview, i) in getItemImagePreviews(item.id)" :key="i" class="image-preview-container">
                                <v-img
                                  :src="preview"
                                  width="80"
                                  height="80"
                                  class="rounded"
                                  cover
                                ></v-img>
                                <v-btn
                                  icon="mdi-close"
                                  size="x-small"
                                  color="error"
                                  variant="flat"
                                  class="image-remove-btn"
                                  @click="removeItemImage(item.id, i)"
                                ></v-btn>
                              </div>
                            </div>
                          </div>
                          
                          <v-chip-group
                            v-model="getItemTags(item.id).positive"
                            multiple
                            class="mb-2"
                          >
                            <v-chip filter value="tasty">Tasty</v-chip>
                            <v-chip filter value="good_portion">Good Portion</v-chip>
                            <v-chip filter value="fresh">Fresh</v-chip>
                            <v-chip filter value="well_presented">Well Presented</v-chip>
                            <v-chip filter value="good_value">Good Value</v-chip>
                          </v-chip-group>
                          
                          <v-divider v-if="index < order.items.length - 1" class="my-4"></v-divider>
                        </div>
                      </div>
                      <div v-else class="text-center py-4">
                        No items found for this order.
                      </div>
                    </v-window-item>
                    
                    <!-- Delivery Tab -->
                    <v-window-item value="delivery">
                      <div class="mb-4">
                        <div class="text-subtitle-1 mb-2">Delivery Rating</div>
                        <v-rating
                          v-model="review.deliveryRating"
                          color="amber"
                          hover
                          half-increments
                          size="large"
                        ></v-rating>
                      </div>
                      
                      <div class="mb-4">
                        <div class="text-subtitle-2 mb-2">How was your delivery?</div>
                        <v-chip-group
                          v-model="review.deliveryTags"
                          multiple
                          column
                        >
                          <v-chip filter value="on_time">On Time</v-chip>
                          <v-chip filter value="friendly">Friendly Driver</v-chip>
                          <v-chip filter value="careful">Careful Handling</v-chip>
                          <v-chip filter value="good_communication">Good Communication</v-chip>
                          <v-chip filter value="followed_instructions">Followed Instructions</v-chip>
                        </v-chip-group>
                      </div>
                      
                      <v-textarea
                        v-model="review.deliveryComment"
                        label="Additional comments about delivery"
                        placeholder="Any specific feedback about the delivery experience?"
                        variant="outlined"
                        rows="2"
                      ></v-textarea>
                    </v-window-item>
                  </v-window>
                </v-card-text>
                
                <v-card-actions class="px-4 pb-4">
                  <v-spacer></v-spacer>
                  <v-btn
                    variant="text"
                    @click="skipReview"
                  >
                    Skip
                  </v-btn>
                  <v-btn
                    color="primary"
                    :disabled="!isReviewValid"
                    :loading="submittingReview"
                    @click="submitReview"
                  >
                    Submit Review
                  </v-btn>
                </v-card-actions>
              </v-card>
            </div>
          </v-expand-transition>

          <!-- Restaurant Status Section - Show real-time restaurant status -->
          <v-expand-transition>
            <div v-if="restaurantStatus && ['pending', 'confirmed', 'preparing'].includes(order.status)">
              <v-alert
                :color="getRestaurantStatusColor(restaurantStatus.status)"
                variant="tonal"
                class="mb-6"
              >
                <div class="d-flex align-center">
                  <v-icon :color="getRestaurantStatusColor(restaurantStatus.status)" class="mr-2">
                    {{ getRestaurantStatusIcon(restaurantStatus.status) }}
                  </v-icon>
                  <div>
                    <div class="text-subtitle-1 font-weight-medium">
                      {{ getRestaurantStatusMessage(restaurantStatus.status) }}
                    </div>
                    <div v-if="restaurantStatus.message" class="text-body-2">
                      {{ restaurantStatus.message }}
                    </div>
                    <div v-if="restaurantStatus.busyLevel" class="d-flex align-center mt-1">
                      <v-rating
                        :model-value="restaurantStatus.busyLevel"
                        color="amber-darken-3"
                        density="compact"
                        size="x-small"
                        readonly
                      ></v-rating>
                      <span class="text-caption ml-2">{{ getBusyLevelText(restaurantStatus.busyLevel) }}</span>
                    </div>
                  </div>
                  <v-spacer></v-spacer>
                  <v-chip
                    size="small"
                    :color="restaurantStatus.estimatedPrepTime ? 'info' : 'grey'"
                    variant="tonal"
                  >
                    <v-icon size="small" start>mdi-clock-outline</v-icon>
                    {{ restaurantStatus.estimatedPrepTime ? `${restaurantStatus.estimatedPrepTime} min prep time` : 'Unknown prep time' }}
                  </v-chip>
                </div>
              </v-alert>
            </div>
          </v-expand-transition>

          <!-- Promotions Section - Show after delivery is complete or review is submitted -->
          <v-expand-transition>
            <div v-if="order.status === 'delivered' && (hasReviewed || showPromotions)">
              <v-card class="mb-6">
                <v-card-title class="d-flex align-center">
                  <v-icon color="primary" class="mr-2">mdi-ticket-percent</v-icon>
                  Promotions For You
                  <v-spacer></v-spacer>
                  <v-chip color="primary" size="small">Limited Time</v-chip>
                </v-card-title>
                
                <v-card-text>
                  <v-row>
                    <!-- Restaurant-specific promotion -->
                    <v-col cols="12" sm="6" md="4" v-if="restaurantPromotion">
                      <v-card elevation="1" class="promo-card">
                        <v-img
                          :src="order.restaurant?.image || '/img/restaurants/placeholder.jpg'"
                          height="120"
                          cover
                          class="restaurant-promo-img"
                        >
                          <div class="promo-overlay d-flex flex-column align-center justify-center">
                            <div class="text-h6 text-white font-weight-bold">{{ restaurantPromotion.title }}</div>
                            <div class="text-subtitle-2 text-white">{{ restaurantPromotion.description }}</div>
                          </div>
                        </v-img>
                        <v-card-text>
                          <v-chip color="success" size="small" class="mb-2">
                            {{ restaurantPromotion.code }}
                          </v-chip>
                          <p class="text-body-2 mb-2">Return to {{ order.restaurant?.name || 'this restaurant' }} and save!</p>
                          <div class="d-flex align-center">
                            <v-icon size="small" color="warning" class="mr-1">mdi-clock-outline</v-icon>
                            <span class="text-caption">Expires in 7 days</span>
                          </div>
                        </v-card-text>
                        <v-card-actions>
                          <v-btn
                            block
                            variant="tonal"
                            color="primary"
                            @click="savePromotion(restaurantPromotion)"
                          >
                            Save Offer
                          </v-btn>
                        </v-card-actions>
                      </v-card>
                    </v-col>
                    
                    <!-- Seasonal promotion -->
                    <v-col cols="12" sm="6" md="4" v-if="seasonalPromotion">
                      <v-card elevation="1" class="promo-card">
                        <div class="promo-badge">SEASONAL</div>
                        <v-card-item>
                          <template v-slot:prepend>
                            <v-icon size="large" color="error" class="me-3">
                              {{ getPromoIcon(seasonalPromotion.type) }}
                            </v-icon>
                          </template>
                          <v-card-title>{{ seasonalPromotion.title }}</v-card-title>
                          <v-card-subtitle>
                            <div>Code: <span class="font-weight-bold">{{ seasonalPromotion.code }}</span></div>
                            <div>
                              <v-icon size="small" class="me-1">mdi-clock-outline</v-icon>
                              Limited time offer
                            </div>
                          </v-card-subtitle>
                        </v-card-item>
                        <v-card-text>
                          <p>{{ seasonalPromotion.description }}</p>
                          <div class="d-flex align-center mt-2">
                            <v-chip size="small" :color="getPromoColor(seasonalPromotion.type)" class="me-2">
                              {{ formatPromoType(seasonalPromotion.type) }}
                            </v-chip>
                            <v-chip v-if="seasonalPromotion.minOrderAmount" size="small" variant="outlined">
                              Min. Order ${{ seasonalPromotion.minOrderAmount.toFixed(2) }}
                            </v-chip>
                          </div>
                        </v-card-text>
                        <v-card-actions>
                          <v-spacer></v-spacer>
                          <v-btn
                            variant="text"
                            :color="getPromoColor(seasonalPromotion.type)"
                            @click="savePromotion(seasonalPromotion)"
                          >
                            Save Offer
                          </v-btn>
                        </v-card-actions>
                      </v-card>
                    </v-col>
                    
                    <!-- Special discount -->
                    <v-col cols="12" sm="6" md="4" v-if="discountPromotion">
                      <v-card elevation="1" class="promo-card">
                        <v-card-item>
                          <template v-slot:prepend>
                            <v-icon size="large" color="purple" class="me-3">
                              {{ getPromoIcon(discountPromotion.type) }}
                            </v-icon>
                          </template>
                          <v-card-title>{{ discountPromotion.title }}</v-card-title>
                          <v-card-subtitle>
                            <div>Code: <span class="font-weight-bold">{{ discountPromotion.code }}</span></div>
                            <div>
                              <v-icon size="small" class="me-1">mdi-clock-outline</v-icon>
                              Expires in {{ discountPromotion.expiryDays }} days
                            </div>
                          </v-card-subtitle>
                        </v-card-item>
                        <v-card-text>
                          <p>{{ discountPromotion.description }}</p>
                          <div class="d-flex align-center mt-2">
                            <v-chip size="small" :color="getPromoColor(discountPromotion.type)" class="me-2">
                              {{ formatPromoType(discountPromotion.type) }}
                            </v-chip>
                            <v-chip v-if="discountPromotion.minOrderAmount" size="small" variant="outlined">
                              Min. Order ${{ discountPromotion.minOrderAmount.toFixed(2) }}
                            </v-chip>
                          </div>
                        </v-card-text>
                        <v-card-actions>
                          <v-spacer></v-spacer>
                          <v-btn
                            variant="text"
                            :color="getPromoColor(discountPromotion.type)"
                            @click="savePromotion(discountPromotion)"
                          >
                            Save Offer
                          </v-btn>
                          <v-btn
                            variant="text"
                            color="primary"
                            @click="applyNow(discountPromotion)"
                          >
                            Order Now
                          </v-btn>
                        </v-card-actions>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </div>
          </v-expand-transition>

          <!-- Map -->
          <div v-if="isDeliveryInProgress" class="position-relative mb-6">
            <div ref="mapContainer" class="tracking-map" style="height: 300px;"></div>
            
            <div class="map-legend pa-2">
              <div class="d-flex align-center mb-1">
                <v-avatar size="12" color="primary" class="mr-2"></v-avatar>
                <span class="text-caption">Restaurant</span>
              </div>
              <div class="d-flex align-center mb-1">
                <v-avatar size="12" color="success" class="mr-2"></v-avatar>
                <span class="text-caption">Delivery Location</span>
              </div>
              <div class="d-flex align-center">
                <v-avatar size="12" color="info" class="mr-2"></v-avatar>
                <span class="text-caption">Driver</span>
              </div>
            </div>
          </div>
          
          <!-- Driver Information -->
          <v-card v-if="order.driver && isDeliveryInProgress" class="mb-4">
            <v-card-title>Driver Information</v-card-title>
            <v-card-text>
              <div class="d-flex align-center mb-4">
                <v-avatar size="48" class="mr-4">
                  <v-img v-if="order.driver.profileImage" :src="order.driver.profileImage" alt="Driver"></v-img>
                  <v-icon v-else size="32">mdi-account</v-icon>
                </v-avatar>
                
                <div>
                  <div class="text-h6">{{ order.driver.name }}</div>
                  <div class="d-flex align-center">
                    <v-rating
                      :model-value="order.driver.rating || 5"
                      color="amber"
                      density="compact"
                      size="small"
                      readonly
                    ></v-rating>
                    <span class="text-caption ml-1">{{ order.driver.rating || 5 }} ({{ order.driver.totalRatings || 0 }}+ trips)</span>
                  </div>
                </div>
                
                <v-spacer></v-spacer>
                
                <v-chip v-if="eta" color="primary">
                  <v-icon start>mdi-clock-outline</v-icon>
                  {{ eta }} min away
                </v-chip>
              </div>
              
              <div class="d-flex gap-2">
                <v-btn
                  color="primary"
                  variant="outlined"
                  block
                  prepend-icon="mdi-phone"
                  :href="`tel:${order.driver.phone}`"
                >
                  Call
                </v-btn>
                <v-btn
                  color="primary"
                  variant="outlined"
                  block
                  prepend-icon="mdi-message"
                  @click="openChat"
                >
                  Message
                </v-btn>
              </div>
            </v-card-text>
          </v-card>

          <!-- Delivery Information -->
          <v-card v-if="order.deliveryInstructions" class="mb-4">
            <v-card-title>Delivery Instructions</v-card-title>
            <v-card-text>
              <p class="text-body-1">{{ order.deliveryInstructions }}</p>
            </v-card-text>
          </v-card>

          <!-- Delivery Updates -->
          <div v-if="isDeliveryInProgress" class="text-center">
            <p class="text-caption text-grey">
              Last updated: {{ lastUpdateTime ? formatDateTime(lastUpdateTime) : 'Waiting for updates...' }}
            </p>
          </div>
        </div>
      </v-card-text>
    </v-card>
    
    <!-- Chat Dialog -->
    <v-dialog v-model="showChatDialog" max-width="500">
      <v-card>
        <v-card-title class="d-flex align-center">
          <span>Chat with Driver</span>
          <v-spacer></v-spacer>
          <v-btn icon variant="text" @click="showChatDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-divider></v-divider>
        
        <v-card-text class="chat-container pa-0">
          <div ref="chatMessages" class="chat-messages pa-4">
            <template v-if="chatMessages.length > 0">
              <div 
                v-for="(message, index) in chatMessages"
                :key="index"
                :class="[
                  'message-bubble mb-2 pa-2',
                  message.sender === 'user' ? 'message-sent' : 'message-received'
                ]"
              >
                <p class="text-body-2 mb-0">{{ message.text }}</p>
                <span class="text-caption text-grey">{{ formatTime(message.timestamp) }}</span>
              </div>
            </template>
            <div v-else class="text-center py-4 text-grey">
              No messages yet. Start the conversation!
            </div>
          </div>
          
          <v-divider></v-divider>
          
          <div class="chat-input d-flex align-center pa-2">
            <v-text-field
              v-model="chatMessage"
              placeholder="Type a message..."
              variant="outlined"
              density="compact"
              hide-details
              @keyup.enter="sendMessage"
            ></v-text-field>
            <v-btn
              icon
              color="primary"
              class="ml-2"
              :disabled="!chatMessage.trim()"
              @click="sendMessage"
            >
              <v-icon>mdi-send</v-icon>
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import io from 'socket.io-client';
import L from 'leaflet';

// Ensure leaflet CSS is loaded
import 'leaflet/dist/leaflet.css';

export default {
  name: 'OrderTracking',
  
  props: {
    order: {
      type: Object,
      required: true
    }
  },
  
  setup(props) {
    const store = useStore();
    const router = useRouter();
    const loading = ref(false);
    const error = ref(null);
    const connected = ref(false);
    const socket = ref(null);
    const mapContainer = ref(null);
    const map = ref(null);
    const restaurantMarker = ref(null);
    const deliveryMarker = ref(null);
    const driverMarker = ref(null);
    const routeLayer = ref(null);
    const eta = ref(null);
    const lastUpdateTime = ref(null);
    const showChatDialog = ref(false);
    const chatMessage = ref('');
    const chatMessages = ref([]);
    
    // For auto-scrolling chat
    const chatMessagesContainer = ref(null);

    // Review state
    const reviewTab = ref('overall');
    const review = ref({
      restaurantRating: 0,
      comment: '',
      deliveryRating: 0,
      deliveryComment: '',
      deliveryTags: [],
      itemRatings: [],
      itemComments: [],
      itemImages: []
    });
    const hasReviewed = ref(false);
    const submittingReview = ref(false);
    const commentRules = [
      v => v.length <= 500 || 'Review cannot exceed 500 characters'
    ];

    // Promotion state
    const showPromotions = ref(false);
    const restaurantPromotion = ref(null);
    const seasonalPromotion = ref(null);
    const discountPromotion = ref(null);

    // Item ratings tracking
    const getItemRating = (itemId) => {
      const item = review.value.itemRatings.find(i => i.itemId === itemId);
      return item ? item.rating : 0;
    };

    const getItemTags = (itemId) => {
      const item = review.value.itemRatings.find(i => i.itemId === itemId);
      return item ? item.tags : { positive: [], negative: [] };
    };

    const getItemComment = (itemId) => {
      const item = review.value.itemComments.find(i => i.itemId === itemId);
      return item ? item.comment : '';
    };

    const getItemImages = (itemId) => {
      const item = review.value.itemImages.find(i => i.itemId === itemId);
      return item ? item.images : [];
    };

    const getItemImagePreviews = (itemId) => {
      const images = getItemImages(itemId);
      return images.map(image => URL.createObjectURL(image));
    };

    const updateItemRating = (itemId, rating) => {
      const existingIndex = review.value.itemRatings.findIndex(i => i.itemId === itemId);
      
      if (existingIndex >= 0) {
        review.value.itemRatings[existingIndex].rating = rating;
      } else {
        review.value.itemRatings.push({
          itemId,
          rating,
          tags: { positive: [], negative: [] }
        });
      }
    };

    const updateItemComment = (itemId, comment) => {
      const existingIndex = review.value.itemComments.findIndex(i => i.itemId === itemId);
      
      if (existingIndex >= 0) {
        review.value.itemComments[existingIndex].comment = comment;
      } else {
        review.value.itemComments.push({
          itemId,
          comment
        });
      }
    };

    const updateItemImages = (itemId, images) => {
      const existingIndex = review.value.itemImages.findIndex(i => i.itemId === itemId);
      
      if (existingIndex >= 0) {
        review.value.itemImages[existingIndex].images = images;
      } else {
        review.value.itemImages.push({
          itemId,
          images
        });
      }
    };

    const removeItemImage = (itemId, index) => {
      const images = getItemImages(itemId);
      images.splice(index, 1);
      updateItemImages(itemId, images);
    };

    // Submit review to backend
    const submitReview = async () => {
      if (!isReviewValid.value) return;
      
      submittingReview.value = true;
      
      try {
        // Prepare item ratings data
        const itemRatingsData = await Promise.all(review.value.itemRatings.map(async (item) => {
          const itemId = item.itemId;
          const comment = getItemComment(itemId);
          
          // Process images for this item
          const images = getItemImages(itemId);
          
          return {
            itemId,
            rating: item.rating,
            comment,
            aspects: item.tags?.positive || [],
            images // Will be handled by FormData in the API service
          };
        }));

        // Create the review request data
        const reviewData = {
          orderId: props.order.id,
          restaurantId: props.order.restaurant.id,
          rating: review.value.restaurantRating,
          comment: review.value.comment,
          deliveryRating: review.value.deliveryRating,
          deliveryComment: review.value.deliveryComment,
          deliveryTags: review.value.deliveryTags,
          itemRatings: itemRatingsData
        };
        
        // Create a FormData instance for handling file uploads
        const formData = new FormData();
        
        // Append basic review data
        Object.keys(reviewData).forEach(key => {
          if (key !== 'itemRatings') {
            formData.append(key, 
              typeof reviewData[key] === 'object' 
                ? JSON.stringify(reviewData[key]) 
                : reviewData[key]
            );
          }
        });
        
        // Append item ratings data
        formData.append('itemRatings', JSON.stringify(reviewData.itemRatings));
        
        // Append item images
        review.value.itemImages.forEach(item => {
          if (item.images && item.images.length) {
            item.images.forEach((file, index) => {
              formData.append(`item_${item.itemId}_images`, file);
            });
          }
        });

        // Submit the review
        await store.dispatch('orders/submitReview', formData);
        
        // Show success message
        store.dispatch('notifications/show', {
          type: 'success',
          message: 'Thank you for your review!'
        });

        // Update state to show promotions
        hasReviewed.value = true;
        showPromotions.value = true;
        
        // Reset review form
        review.value = {
          restaurantRating: 0,
          comment: '',
          deliveryRating: 0,
          deliveryComment: '',
          deliveryTags: [],
          itemRatings: [],
          itemComments: [],
          itemImages: []
        };
      } catch (error) {
        console.error('Error submitting review:', error);
        store.dispatch('notifications/show', {
          type: 'error',
          message: 'Failed to submit your review. Please try again.'
        });
      } finally {
        submittingReview.value = false;
      }
    };
    
    // Skip review
    const skipReview = () => {
      hasReviewed.value = true;
      showPromotions.value = true;
    };

    // Computed properties
    const connectionStatus = computed(() => {
      if (error.value) {
        return { text: 'Connection Error', color: 'error' };
      }
      if (loading.value) {
        return { text: 'Connecting...', color: 'warning' };
      }
      if (connected.value) {
        return { text: 'Connected', color: 'success' };
      }
      return { text: 'Disconnected', color: 'grey' };
    });

    const isDeliveryInProgress = computed(() => {
      return ['confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery'].includes(props.order.status);
    });

    const isReviewValid = computed(() => {
      return review.value.restaurantRating > 0;
    });

    const statusSteps = computed(() => [
      {
        status: 'pending',
        label: 'Order Placed',
        description: 'Waiting for restaurant confirmation',
        timestamp: props.order.createdAt
      },
      {
        status: 'confirmed',
        label: 'Order Confirmed',
        description: 'Restaurant is preparing your order',
        timestamp: props.order.confirmedAt
      },
      {
        status: 'preparing',
        label: 'Preparing',
        description: 'Your food is being prepared',
        timestamp: props.order.preparingAt
      },
      {
        status: 'ready_for_pickup',
        label: 'Ready for Pickup',
        description: 'Your order is ready and waiting for the driver',
        timestamp: props.order.readyAt
      },
      {
        status: 'out_for_delivery',
        label: 'Out for Delivery',
        description: props.order.driver ? `${props.order.driver.name} is on the way` : 'Driver is on the way',
        timestamp: props.order.pickedUpAt
      },
      {
        status: 'delivered',
        label: 'Delivered',
        description: 'Your order has been delivered',
        timestamp: props.order.deliveredAt
      }
    ]);
    
    const currentStepIndex = computed(() => {
      const statusOrder = statusSteps.value.map(step => step.status);
      return statusOrder.findIndex(status => status === props.order.status);
    });

    // Methods
    const initializeMap = () => {
      if (!mapContainer.value) return;
      
      // Initialize map
      map.value = L.map(mapContainer.value).setView([0, 0], 13);
      
      // Add tile layer (OpenStreetMap)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map.value);
      
      // Add markers if locations are available
      updateMapMarkers();
    };

    const updateMapMarkers = () => {
      if (!map.value) return;
      
      const bounds = [];
      
      // Restaurant marker
      if (props.order.restaurant && props.order.restaurant.location) {
        const { lat, lng } = props.order.restaurant.location;
        
        if (!restaurantMarker.value) {
          restaurantMarker.value = L.marker([lat, lng], {
            icon: L.divIcon({
              className: 'custom-marker restaurant-marker',
              html: '<div class="marker-icon"><i class="mdi mdi-store"></i></div>',
              iconSize: [32, 32],
              iconAnchor: [16, 32]
            })
          }).addTo(map.value);
        } else {
          restaurantMarker.value.setLatLng([lat, lng]);
        }
        
        bounds.push([lat, lng]);
      }
      
      // Delivery location marker
      if (props.order.deliveryAddress && props.order.deliveryAddress.lat && props.order.deliveryAddress.lng) {
        const { lat, lng } = props.order.deliveryAddress;
        
        if (!deliveryMarker.value) {
          deliveryMarker.value = L.marker([lat, lng], {
            icon: L.divIcon({
              className: 'custom-marker delivery-marker',
              html: '<div class="marker-icon"><i class="mdi mdi-map-marker"></i></div>',
              iconSize: [32, 32],
              iconAnchor: [16, 32]
            })
          }).addTo(map.value);
        } else {
          deliveryMarker.value.setLatLng([lat, lng]);
        }
        
        bounds.push([lat, lng]);
      }
      
      // Driver marker
      if (props.order.driver && props.order.driver.location) {
        const { lat, lng } = props.order.driver.location;
        
        if (!driverMarker.value) {
          driverMarker.value = L.marker([lat, lng], {
            icon: L.divIcon({
              className: 'custom-marker driver-marker',
              html: '<div class="marker-icon"><i class="mdi mdi-moped"></i></div>',
              iconSize: [32, 32],
              iconAnchor: [16, 32]
            })
          }).addTo(map.value);
        } else {
          driverMarker.value.setLatLng([lat, lng]);
        }
        
        bounds.push([lat, lng]);
      }
      
      // Route line between driver and delivery
      updateRouteLine();
      
      // Fit bounds if we have points
      if (bounds.length > 0) {
        map.value.fitBounds(bounds, { padding: [30, 30] });
      }
    };
    
    const updateRouteLine = () => {
      if (!map.value) return;
      
      // If we have a driver and delivery location, draw a route
      if (props.order.driver && props.order.driver.location && 
          props.order.deliveryAddress && props.order.deliveryAddress.lat && props.order.deliveryAddress.lng) {
        
        const driverPos = [props.order.driver.location.lat, props.order.driver.location.lng];
        const deliveryPos = [props.order.deliveryAddress.lat, props.order.deliveryAddress.lng];
        
        // Remove existing route
        if (routeLayer.value) {
          map.value.removeLayer(routeLayer.value);
        }
        
        // Create a simple route (straight line)
        // In a real app, you'd use a routing API to get the actual route
        routeLayer.value = L.polyline([driverPos, deliveryPos], {
          color: '#3F51B5',
          weight: 3,
          opacity: 0.7,
          dashArray: '5, 5'
        }).addTo(map.value);
      }
    };

    const connectToSocket = async () => {
      if (connected.value || loading.value) return;
      
      loading.value = true;
      error.value = null;
      
      try {
        // Initialize socket connection
        socket.value = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', { // Use Vite env var
          path: '/socket.io',
          transports: ['websocket', 'polling']
        });
        
        // Set up event handlers
        socket.value.on('connect', () => {
          connected.value = true;
          loading.value = false;
          
          // Join order room to get updates
          socket.value.emit('join_order_room', { orderId: props.order.id });
        });
        
        socket.value.on('connect_error', (err) => {
          console.error('Socket connection error:', err);
          connected.value = false;
          loading.value = false;
          error.value = 'Failed to connect to tracking server. Please check your connection.';
        });
        
        socket.value.on('disconnect', () => {
          connected.value = false;
        });
        
        // Order specific events
        socket.value.on('order_status_updated', (data) => {
          if (data.orderId === props.order.id) {
            store.dispatch('orderTracking/updateOrderStatus', {
              orderId: props.order.id,
              status: data.status,
              timestamp: data.updatedAt
            });
            lastUpdateTime.value = new Date();
          }
        });
        
        socket.value.on('driver_location_updated', (data) => {
          if (data.orderId === props.order.id) {
            store.dispatch('orderTracking/updateDriverLocation', {
              orderId: props.order.id,
              location: data.location,
              trafficCondition: data.trafficCondition || 'normal'
            });
            
            if (data.eta) {
              eta.value = data.eta;
              store.dispatch('orderTracking/updateETA', {
                orderId: props.order.id,
                eta: data.eta
              });
            }
            
            lastUpdateTime.value = new Date();
            updateMapMarkers();
          }
        });
        
        socket.value.on('chat_message', (message) => {
          if (message.orderId === props.order.id) {
            chatMessages.value.push({
              text: message.text,
              sender: message.sender,
              timestamp: message.timestamp || new Date()
            });
            scrollToLatestMessage();
          }
        });
      } catch (err) {
        console.error('Error setting up socket connection:', err);
        error.value = 'Failed to initialize tracking. Please try again later.';
        loading.value = false;
      }
    };
    
    const disconnectSocket = () => {
      if (socket.value) {
        socket.value.disconnect();
        socket.value = null;
        connected.value = false;
      }
    };
    
    const retryConnection = () => {
      disconnectSocket();
      connectToSocket();
    };
    
    const openChat = () => {
      showChatDialog.value = true;
    };
    
    const sendMessage = () => {
      if (!chatMessage.value.trim() || !connected.value) return;
      
      const message = {
        orderId: props.order.id,
        text: chatMessage.value.trim(),
        sender: 'user',
        timestamp: new Date()
      };
      
      // Add message to local chat history
      chatMessages.value.push(message);
      
      // Send message through socket
      if (socket.value) {
        socket.value.emit('send_message', message);
      }
      
      // Clear input
      chatMessage.value = '';
      
      // Scroll to latest message
      scrollToLatestMessage();
    };
    
    const scrollToLatestMessage = async () => {
      await nextTick();
      if (chatMessagesContainer.value) {
        chatMessagesContainer.value.scrollTop = chatMessagesContainer.value.scrollHeight;
      }
    };

    // Helper functions
    const formatTime = (timestamp) => {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    
    const formatDateTime = (timestamp) => {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return date.toLocaleString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
    };
    
    const getStepColor = (status) => {
      if (props.order.status === 'cancelled') return 'grey';
      
      const statusIndex = statusSteps.value.findIndex(step => step.status === status);
      const currentIndex = currentStepIndex.value;
      
      if (statusIndex === currentIndex) return 'primary';
      if (statusIndex < currentIndex) return 'success';
      return 'grey';
    };
    
    // Promotion functions
    const loadPromotions = async () => {
      try {
        // In a real app, fetch promotions from API based on order data
        // For demo purpose, we'll create some example promotions
        
        // 1. Restaurant-specific promotion (if this is a returning customer)
        restaurantPromotion.value = {
          id: 'rest-' + props.order.restaurant?.id,
          title: 'Return Customer Special',
          code: 'RETURN15',
          type: 'discount_percentage',
          value: 15,
          minOrderAmount: 20,
          expiryDays: 7,
          description: `15% off your next order at ${props.order.restaurant?.name || 'this restaurant'}`
        };
        
        // 2. Seasonal promotion based on current month
        const currentMonth = new Date().getMonth();
        let seasonalTitle, seasonalCode;
        
        if (currentMonth >= 9 && currentMonth <= 11) { // Fall/Holiday season
          seasonalTitle = 'Holiday Season Special';
          seasonalCode = 'HOLIDAY25';
        } else if (currentMonth >= 6 && currentMonth <= 8) { // Summer
          seasonalTitle = 'Summer Special';
          seasonalCode = 'SUMMER20';
        } else if (currentMonth >= 3 && currentMonth <= 5) { // Spring
          seasonalTitle = 'Spring Savings';
          seasonalCode = 'SPRING15';
        } else { // Winter
          seasonalTitle = 'Winter Warmup Deal';
          seasonalCode = 'WINTER20';
        }
        
        seasonalPromotion.value = {
          id: 'seasonal-' + new Date().getFullYear() + currentMonth,
          title: seasonalTitle,
          code: seasonalCode,
          type: 'discount_percentage',
          value: 20,
          minOrderAmount: 25,
          expiryDays: 14,
          description: 'Limited time seasonal promotion on all orders!'
        };
        
        // 3. Special discount promotion (different type)
        discountPromotion.value = {
          id: 'special-' + Date.now(),
          title: 'Free Delivery',
          code: 'FREEDEL',
          type: 'free_delivery',
          expiryDays: 10,
          description: 'Free delivery on your next order, no minimum purchase!'
        };
        
        // Show promotions
        showPromotions.value = true;
      } catch (error) {
        console.error('Failed to load promotions:', error);
      }
    };
    
    const savePromotion = (promotion) => {
      try {
        // In a real app, save this promotion to user's account via API
        // For demo, just show a success message
        store.dispatch('notifications/show', {
          type: 'success',
          message: `Promotion "${promotion.code}" has been saved to your account!`
        });
        
        // Emit event for parent component
        store.dispatch('user/addPromotion', promotion);
      } catch (error) {
        console.error('Failed to save promotion:', error);
        store.dispatch('notifications/show', {
          type: 'error',
          message: 'Failed to save promotion. Please try again.'
        });
      }
    };
    
    const applyNow = (promotion) => {
      // Save the promotion first
      savePromotion(promotion);
      
      // Navigate to restaurants page with promo code pre-applied
      router.push({
        path: '/restaurants',
        query: { promo: promotion.code }
      });
    };
    
    // Helper methods for promotions
    const getPromoIcon = (type) => {
      switch (type) {
        case 'discount_percentage':
          return 'mdi-percent';
        case 'discount_amount':
          return 'mdi-currency-usd';
        case 'free_delivery':
          return 'mdi-truck-delivery';
        case 'buy_one_get_one':
          return 'mdi-food';
        default:
          return 'mdi-ticket-percent';
      }
    };
    
    const getPromoColor = (type) => {
      switch (type) {
        case 'discount_percentage':
          return 'purple';
        case 'discount_amount':
          return 'green';
        case 'free_delivery':
          return 'blue';
        case 'buy_one_get_one':
          return 'orange';
        default:
          return 'primary';
      }
    };
    
    const formatPromoType = (type) => {
      switch (type) {
        case 'discount_percentage':
          return 'Percentage Off';
        case 'discount_amount':
          return 'Amount Off';
        case 'free_delivery':
          return 'Free Delivery';
        case 'buy_one_get_one':
          return 'Buy One Get One';
        default:
          return 'Special Offer';
      }
    };

    // Lifecycle hooks
    onMounted(() => {
      if (isDeliveryInProgress.value) {
        initializeMap();
        connectToSocket();
      }
      
      // If order is already delivered, show promotions
      if (props.order.status === 'delivered') {
        loadPromotions();
      }
    });
    
    onBeforeUnmount(() => {
      disconnectSocket();
      
      // Clean up map if exists
      if (map.value) {
        map.value.remove();
        map.value = null;
      }
    });
    
    // Watch for changes in order status
    watch(() => props.order.status, (newStatus) => {
      // If order transitions to a delivery in progress status, initialize map and connect
      if (['confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery'].includes(newStatus)) {
        nextTick(() => {
          if (!map.value && mapContainer.value) {
            initializeMap();
          }
          if (!connected.value) {
            connectToSocket();
          }
        });
      }
      
      // If order is completed or cancelled, disconnect socket
      if (['delivered', 'cancelled'].includes(newStatus)) {
        disconnectSocket();
        
        // If delivered, show promotions
        if (newStatus === 'delivered') {
          loadPromotions();
        }
      }
    });
    
    // Watch for changes in order.driver
    watch(() => props.order.driver, (newDriver) => {
      if (newDriver && map.value) {
        updateMapMarkers();
      }
    }, { deep: true });

    return {
      loading,
      error,
      connected,
      connectionStatus,
      isDeliveryInProgress,
      statusSteps,
      currentStepIndex,
      mapContainer,
      eta,
      lastUpdateTime,
      showChatDialog,
      chatMessage,
      chatMessages,
      chatMessagesContainer,
      
      // Methods
      retryConnection,
      openChat,
      sendMessage,
      scrollToLatestMessage,
      formatTime,
      formatDateTime,
      getStepColor,
      
      // Review props and methods
      reviewTab,
      review,
      hasReviewed,
      submittingReview,
      commentRules,
      getItemRating,
      getItemTags,
      getItemComment,
      getItemImages,
      getItemImagePreviews,
      updateItemRating,
      updateItemComment,
      updateItemImages,
      removeItemImage,
      submitReview,
      skipReview,
      isReviewValid,
      
      // Promotion props and methods
      showPromotions,
      restaurantPromotion,
      seasonalPromotion,
      discountPromotion,
      savePromotion,
      applyNow,
      getPromoIcon,
      getPromoColor,
      formatPromoType
    };
  }
};
</script>

<style scoped>
.order-tracking {
  position: relative;
}

.map-container {
  height: 300px;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.message-bubble {
  max-width: 80%;
  border-radius: 12px;
  position: relative;
}

.message-sent {
  background-color: #e3f2fd;
  margin-left: auto;
  border-top-right-radius: 4px;
}

.message-received {
  background-color: #f5f5f5;
  margin-right: auto;
  border-top-left-radius: 4px;
}

.restaurant-promo-img {
  position: relative;
}

.promo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  text-align: center;
}

/* Image preview styles */
.image-preview-container {
  position: relative;
  display: inline-block;
  margin-right: 8px;
  margin-bottom: 8px;
}

.image-remove-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  z-index: 1;
}

.tracking-map {
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.map-legend {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 4px;
  z-index: 999;
  padding: 8px;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 400px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.chat-input {
  padding: 8px 16px;
  border-top: 1px solid rgba(0,0,0,0.1);
}

/* Custom marker styles */
:global(.custom-marker) {
  display: flex;
  align-items: center;
  justify-content: center;
}

:global(.marker-icon) {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

:global(.restaurant-marker .marker-icon) {
  color: #1976D2;
}

:global(.delivery-marker .marker-icon) {
  color: #4CAF50;
}

:global(.driver-marker .marker-icon) {
  color: #FF9800;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}
</style>
