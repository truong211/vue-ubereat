<template>
  <div class="restaurant-page">
    <div class="restaurant-header" :style="headerStyle">
      <div class="restaurant-header-overlay">
        <div class="restaurant-info-container">
          <h1 class="restaurant-name">{{ restaurant.name }}</h1>
          <div class="restaurant-meta">
            <span class="restaurant-rating">
              <i class="fas fa-star"></i> {{ restaurant.rating }} ({{ restaurant.reviewCount }} reviews)
            </span>
            <span class="restaurant-category">{{ restaurant.category }}</span>
            <span class="restaurant-delivery-time">
              <i class="fas fa-clock"></i> {{ restaurant.deliveryTime }} min
            </span>
            <span class="restaurant-delivery-fee">
              <i class="fas fa-bicycle"></i> Delivery: {{ formatPrice(restaurant.deliveryFee) }}
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="restaurant-content">
      <div class="restaurant-menu-wrapper">
        <RestaurantMenu :restaurant-id="restaurantId" />
      </div>
      
      <div class="restaurant-info-sidebar">
        <div class="restaurant-hours info-section">
          <h3><i class="fas fa-clock"></i> Opening Hours</h3>
          <ul class="hours-list">
            <li v-for="(hours, day) in restaurant.hours" :key="day" :class="{ 'today': isToday(day) }">
              <span class="day">{{ day }}</span>
              <span class="time">{{ hours }}</span>
            </li>
          </ul>
        </div>
        
        <div class="restaurant-address info-section">
          <h3><i class="fas fa-map-marker-alt"></i> Address</h3>
          <p>{{ restaurant.address }}</p>
          <a :href="mapUrl" target="_blank" class="map-link">View on Map</a>
        </div>
        
        <div class="restaurant-contact info-section">
          <h3><i class="fas fa-phone"></i> Contact</h3>
          <p>{{ restaurant.phone }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import RestaurantMenu from '../components/menu/RestaurantMenu.vue';

export default {
  name: 'RestaurantPage',
  components: {
    RestaurantMenu
  },
  props: {
    restaurantId: {
      type: [String, Number],
      required: true
    }
  },
  data() {
    return {
      restaurant: {
        name: 'Sample Restaurant',
        description: 'A delicious sample restaurant with various cuisines.',
        coverImage: null,
        rating: 4.7,
        reviewCount: 253,
        category: 'Italian, Pizza',
        deliveryTime: 25,
        deliveryFee: 2.99,
        address: '123 Main St, City, Country',
        phone: '+1 234 567 8900',
        hours: {
          Monday: '11:00 AM - 10:00 PM',
          Tuesday: '11:00 AM - 10:00 PM',
          Wednesday: '11:00 AM - 10:00 PM',
          Thursday: '11:00 AM - 10:00 PM',
          Friday: '11:00 AM - 11:00 PM',
          Saturday: '12:00 PM - 11:00 PM',
          Sunday: '12:00 PM - 9:00 PM'
        }
      }
    }
  },
  computed: {
    headerStyle() {
      return {
        backgroundImage: this.restaurant.coverImage 
          ? `url(${this.restaurant.coverImage})` 
          : 'url(/img/restaurant-placeholder.jpg)'
      };
    },
    mapUrl() {
      return `https://maps.google.com/?q=${encodeURIComponent(this.restaurant.address)}`;
    }
  },
  created() {
    this.fetchRestaurantData();
  },
  methods: {
    fetchRestaurantData() {
      // Replace with actual API call
      // Example: this.$store.dispatch('fetchRestaurantById', this.restaurantId)
      
      // Placeholder implementation with static data
      console.log(`Fetching data for restaurant ${this.restaurantId}`);
      // Already initialized with sample data in data()
    },
    formatPrice(price) {
      return `$${parseFloat(price).toFixed(2)}`;
    },
    isToday(day) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = days[new Date().getDay()];
      return day === today;
    }
  }
}
</script>

<style scoped>
.restaurant-page {
  display: flex;
  flex-direction: column;
  max-width: 1400px;
  margin: 0 auto;
}

.restaurant-header {
  height: 250px;
  background-size: cover;
  background-position: center;
  position: relative;
}

.restaurant-header-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.7));
  display: flex;
  align-items: flex-end;
  padding: 30px;
  color: white;
}

.restaurant-info-container {
  max-width: 800px;
}

.restaurant-name {
  font-size: 2.5rem;
  margin: 0 0 10px;
  text-shadow: 1px 1px 3px rgba(0,0,0,0.5);
}

.restaurant-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  font-size: 1rem;
}

.restaurant-content {
  display: flex;
  flex-direction: row;
  gap: 30px;
  padding: 30px;
}

.restaurant-menu-wrapper {
  flex: 1;
  min-width: 0; /* Prevent flexbox issues with overflow */
}

.restaurant-info-sidebar {
  width: 300px;
  flex-shrink: 0;
}

@media (max-width: 992px) {
  .restaurant-content {
    flex-direction: column;
  }
  
  .restaurant-info-sidebar {
    width: 100%;
    order: -1; /* Display above menu on mobile */
    margin-bottom: 20px;
  }
}

.info-section {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.info-section h3 {
  margin-top: 0;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #333;
}

.info-section i {
  font-size: 1.2em;
  color: #e74c3c;
}

.hours-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.hours-list li {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.hours-list li:last-child {
  border-bottom: none;
}

.hours-list .today {
  font-weight: bold;
  color: #e74c3c;
}

.map-link {
  display: inline-block;
  margin-top: 10px;
  color: #e74c3c;
  text-decoration: none;
}

.map-link:hover {
  text-decoration: underline;
}
</style>