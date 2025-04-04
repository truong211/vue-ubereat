<template>
  <div class="about-page">
    <v-container>
      <v-row>
        <v-col cols="12">
          <h1 class="text-h3 text-center mb-6 primary--text">About Us</h1>
        </v-col>
      </v-row>
      
      <v-row>
        <v-col cols="12" md="6">
          <v-img
            src="/img/about-us.jpg"
            alt="About our food delivery service"
            class="rounded-lg elevation-3"
            height="400"
            cover
          />
        </v-col>
        
        <v-col cols="12" md="6">
          <h2 class="text-h4 mb-4">Our Story</h2>
          <p class="text-body-1 mb-4">
            Welcome to our premium food delivery service! We started in 2023 with a simple mission:
            to bring the best local restaurants directly to your door with speed, reliability, and excellence.
          </p>
          <p class="text-body-1 mb-4">
            What began as a small operation has now grown into a service that partners with hundreds of
            restaurants across the city, delivering thousands of meals daily to hungry customers.
          </p>
          <p class="text-body-1">
            Our platform makes it easy to discover new restaurants, order your favorite meals,
            and track your delivery in real-time. We're committed to supporting local businesses
            and providing exceptional service to our community.
          </p>
        </v-col>
      </v-row>
      
      <v-divider class="my-10"></v-divider>
      
      <v-row>
        <v-col cols="12">
          <h2 class="text-h4 text-center mb-6">Our Values</h2>
        </v-col>
        
        <v-col cols="12" md="4">
          <v-card class="h-100" elevation="2">
            <v-card-title class="primary--text">
              <v-icon large color="primary" class="mr-2">mdi-food</v-icon>
              Quality
            </v-card-title>
            <v-card-text>
              We partner only with the best restaurants that maintain high standards
              of food quality. Your satisfaction with every meal is our top priority.
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="4">
          <v-card class="h-100" elevation="2">
            <v-card-title class="primary--text">
              <v-icon large color="primary" class="mr-2">mdi-clock-fast</v-icon>
              Speed
            </v-card-title>
            <v-card-text>
              We understand that time matters. Our efficient delivery network ensures
              that your food arrives promptly and at the perfect temperature.
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="4">
          <v-card class="h-100" elevation="2">
            <v-card-title class="primary--text">
              <v-icon large color="primary" class="mr-2">mdi-heart</v-icon>
              Community
            </v-card-title>
            <v-card-text>
              We're more than just a delivery service - we're part of your community.
              We support local restaurants and employ local drivers to strengthen our economy.
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      
      <v-divider class="my-10"></v-divider>
      
      <v-row>
        <v-col cols="12">
          <h2 class="text-h4 text-center mb-6">Our Team</h2>
        </v-col>
        
        <v-col cols="12" md="4" v-for="(member, index) in team" :key="index">
          <v-card class="h-100" elevation="2">
            <v-img
              :src="member.image"
              height="250"
              cover
            ></v-img>
            <v-card-title class="primary--text">{{ member.name }}</v-card-title>
            <v-card-subtitle>{{ member.position }}</v-card-subtitle>
            <v-card-text>{{ member.description }}</v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
export default {
  name: 'AboutPage',
  data() {
    return {
      team: [
        {
          name: 'Jane Doe',
          position: 'Founder & CEO',
          image: '/img/team/ceo.jpg',
          description: 'Jane founded our company with a vision to revolutionize food delivery through technology and exceptional service.'
        },
        {
          name: 'John Smith',
          position: 'Head of Operations',
          image: '/img/team/operations.jpg',
          description: 'John oversees our entire delivery network, ensuring efficiency and reliability for every order.'
        },
        {
          name: 'Emily Chen',
          position: 'Restaurant Partnership Manager',
          image: '/img/team/partnerships.jpg',
          description: 'Emily works closely with our restaurant partners to create the best possible experience for both restaurants and customers.'
        }
      ]
    }
  },
  metaInfo: {
    title: 'About Us',
    meta: [
      { name: 'description', content: 'Learn about our food delivery service, our mission, values, and the team behind it all.' }
    ]
  }
}
</script>

<style scoped>
.about-page {
  padding: 40px 0;
}

.h-100 {
  height: 100%;
}
</style> 