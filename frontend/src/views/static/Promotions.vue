<template>
  <div class="promotions-page">
    <v-container>
      <v-row>
        <v-col cols="12">
          <h1 class="text-h3 text-center mb-6 primary--text">Special Promotions</h1>
          <p class="text-h6 text-center mb-8">
            Discover our latest deals and offers to save on your favorite restaurants!
          </p>
        </v-col>
      </v-row>
      
      <!-- Featured Promotion -->
      <v-row class="mb-10">
        <v-col cols="12">
          <v-card class="promotion-card featured-promo">
            <v-img
              src="/img/promotions/featured-promo.jpg"
              max-height="300"
              class="promotion-image"
              gradient="to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.7)"
            >
              <v-card-title class="white--text text-h4 font-weight-bold">
                50% OFF Your First Order
              </v-card-title>
              <v-card-subtitle class="white--text text-h6">
                Use code: WELCOME50
              </v-card-subtitle>
            </v-img>
            
            <v-card-text>
              <p class="text-body-1">
                New to our platform? Enjoy 50% off your first order (up to $20) when you spend $30 or more.
                Valid for new customers only.
              </p>
              
              <v-chip
                color="primary"
                outlined
                class="mr-2 my-2"
              >
                <v-icon left>mdi-clock-outline</v-icon>
                Expires: June 30, 2024
              </v-chip>
              
              <v-chip
                color="primary"
                outlined
                class="my-2"
              >
                <v-icon left>mdi-ticket-percent</v-icon>
                New users only
              </v-chip>
            </v-card-text>
            
            <v-card-actions>
              <v-btn
                color="primary"
                text
                @click="copyPromoCode('WELCOME50')"
              >
                <v-icon left>mdi-content-copy</v-icon>
                Copy Code
              </v-btn>
              
              <v-spacer></v-spacer>
              
              <v-btn
                color="primary"
                outlined
                to="/"
              >
                Order Now
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
      
      <!-- Current Promotions -->
      <v-row>
        <v-col cols="12">
          <h2 class="text-h4 mb-5">Current Offers</h2>
        </v-col>
        
        <v-col
          v-for="(promo, index) in promotions"
          :key="index"
          cols="12"
          md="6"
          lg="4"
          class="mb-4"
        >
          <v-card class="h-100 promotion-card">
            <v-img
              :src="promo.image"
              height="180"
              :alt="promo.title"
              class="promotion-image"
            >
              <v-card-title 
                class="white--text" 
                :class="{'text-h5': promo.title.length < 20, 'text-h6': promo.title.length >= 20}"
              >
                {{ promo.title }}
              </v-card-title>
            </v-img>
            
            <v-card-text>
              <p class="text-body-2 mb-3">{{ promo.description }}</p>
              
              <v-chip
                color="accent"
                small
                outlined
                class="mb-2 mr-2"
              >
                {{ promo.code }}
              </v-chip>
              
              <v-chip
                v-if="promo.expires"
                color="error"
                small
                outlined
                class="mb-2"
              >
                Expires: {{ promo.expires }}
              </v-chip>
            </v-card-text>
            
            <v-card-actions>
              <v-btn
                text
                color="primary"
                @click="copyPromoCode(promo.code)"
              >
                <v-icon left small>mdi-content-copy</v-icon>
                Copy
              </v-btn>
              
              <v-spacer></v-spacer>
              
              <v-btn
                color="primary"
                small
                :to="promo.link || '/'"
              >
                Use Now
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
      
      <!-- Newsletter signup for more promos -->
      <v-row class="mt-10">
        <v-col cols="12">
          <v-card color="grey lighten-4" class="pa-5">
            <v-row align="center">
              <v-col cols="12" md="7">
                <h3 class="text-h5 mb-2">Get Exclusive Promotions</h3>
                <p class="text-body-1">
                  Subscribe to our newsletter and receive exclusive deals and promotions directly to your inbox.
                </p>
              </v-col>
              
              <v-col cols="12" md="5">
                <v-form @submit.prevent="subscribeNewsletter">
                  <v-row>
                    <v-col cols="12" sm="8">
                      <v-text-field
                        v-model="email"
                        label="Your Email"
                        outlined
                        dense
                        hide-details
                        :rules="emailRules"
                      ></v-text-field>
                    </v-col>
                    
                    <v-col cols="12" sm="4">
                      <v-btn
                        color="primary"
                        type="submit"
                        :loading="subscribing"
                        block
                      >
                        Subscribe
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-form>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
    
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
    >
      {{ snackbar.text }}
      <template v-slot:action="{ attrs }">
        <v-btn
          text
          v-bind="attrs"
          @click="snackbar.show = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
export default {
  name: 'PromotionsPage',
  data() {
    return {
      promotions: [
        {
          title: 'Free Delivery',
          code: 'FREEDEL',
          description: 'Free delivery on orders over $20. Valid for all restaurants within 5 miles.',
          image: '/img/promotions/free-delivery.jpg',
          expires: 'July 15, 2024',
          link: '/restaurants'
        },
        {
          title: '20% OFF Local Favorites',
          code: 'LOCAL20',
          description: 'Enjoy 20% off at our highest-rated local restaurants. Maximum discount $15.',
          image: '/img/promotions/local-favorites.jpg',
          expires: 'August 1, 2024',
          link: '/restaurants?sort=rating'
        },
        {
          title: 'Family Bundle Discount',
          code: 'FAMILY25',
          description: 'Save $25 when you order family-sized meals worth $100 or more.',
          image: '/img/promotions/family-bundle.jpg',
          expires: 'July 31, 2024',
          link: '/restaurants'
        },
        {
          title: 'Weekday Lunch Special',
          code: 'LUNCH15',
          description: '15% off all lunch orders (11am-2pm) Monday through Friday.',
          image: '/img/promotions/lunch-special.jpg',
          expires: 'Ongoing',
          link: '/restaurants'
        },
        {
          title: 'Refer a Friend',
          code: 'REFER10',
          description: 'Both you and your friend get $10 off when they make their first order.',
          image: '/img/promotions/refer-friend.jpg',
          expires: null,
          link: '/profile/referrals'
        },
        {
          title: 'Birthday Surprise',
          code: 'BIRTHDAY',
          description: 'Get a special surprise on your birthday! Make sure your birth date is updated in your profile.',
          image: '/img/promotions/birthday.jpg',
          expires: null,
          link: '/profile/account-settings'
        }
      ],
      email: '',
      subscribing: false,
      emailRules: [
        v => !!v || 'Email is required',
        v => /.+@.+\..+/.test(v) || 'Email must be valid'
      ],
      snackbar: {
        show: false,
        text: '',
        color: '',
        timeout: 3000
      }
    }
  },
  methods: {
    copyPromoCode(code) {
      navigator.clipboard.writeText(code).then(() => {
        this.snackbar = {
          show: true,
          text: `Promo code ${code} copied to clipboard!`,
          color: 'success',
          timeout: 2000
        };
      }).catch(err => {
        this.snackbar = {
          show: true,
          text: 'Failed to copy code. Please try again.',
          color: 'error',
          timeout: 2000
        };
      });
    },
    subscribeNewsletter() {
      if (!/.+@.+\..+/.test(this.email)) return;
      
      this.subscribing = true;
      
      // Simulate API call
      setTimeout(() => {
        this.subscribing = false;
        this.snackbar = {
          show: true,
          text: 'Thanks for subscribing! Check your email for exclusive promotions.',
          color: 'success',
          timeout: 4000
        };
        this.email = '';
      }, 1500);
    }
  },
  metaInfo: {
    title: 'Promotions & Deals',
    meta: [
      { name: 'description', content: 'Discover exclusive promotions, discount codes, and special offers for your food delivery orders.' }
    ]
  }
}
</script>

<style scoped>
.promotions-page {
  padding: 40px 0;
}

.promotion-card {
  transition: transform 0.3s ease;
}

.promotion-card:hover {
  transform: translateY(-5px);
}

.featured-promo {
  border: 2px solid #06C167;
}

.promotion-image {
  position: relative;
}

.h-100 {
  height: 100%;
}
</style> 