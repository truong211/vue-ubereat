<template>
  <div class="contact-page">
    <v-container>
      <v-row>
        <v-col cols="12">
          <h1 class="text-h3 text-center mb-6 primary--text">Contact Us</h1>
        </v-col>
      </v-row>
      
      <v-row>
        <v-col cols="12" md="6">
          <h2 class="text-h4 mb-4">Get in Touch</h2>
          <p class="text-body-1 mb-5">
            Have a question, feedback, or need assistance? We're here to help!
            Fill out the form and our team will get back to you as soon as possible.
          </p>
          
          <v-list>
            <v-list-item>
              <v-list-item-icon>
                <v-icon color="primary">mdi-email</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>Email</v-list-item-title>
                <v-list-item-subtitle>support@fooddelivery.com</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            
            <v-list-item>
              <v-list-item-icon>
                <v-icon color="primary">mdi-phone</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>Phone</v-list-item-title>
                <v-list-item-subtitle>(555) 123-4567</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            
            <v-list-item>
              <v-list-item-icon>
                <v-icon color="primary">mdi-map-marker</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>Address</v-list-item-title>
                <v-list-item-subtitle>123 Food Street, Delivery City, FC 12345</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            
            <v-list-item>
              <v-list-item-icon>
                <v-icon color="primary">mdi-clock-outline</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>Hours</v-list-item-title>
                <v-list-item-subtitle>Monday - Friday: 9AM - 6PM<br>Saturday - Sunday: 10AM - 4PM</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>
          
          <v-divider class="my-5"></v-divider>
          
          <h3 class="text-h5 mb-3">Follow Us</h3>
          <div class="d-flex">
            <v-btn icon color="primary" href="#" target="_blank" aria-label="Facebook">
              <v-icon>mdi-facebook</v-icon>
            </v-btn>
            <v-btn icon color="primary" href="#" target="_blank" aria-label="Twitter">
              <v-icon>mdi-twitter</v-icon>
            </v-btn>
            <v-btn icon color="primary" href="#" target="_blank" aria-label="Instagram">
              <v-icon>mdi-instagram</v-icon>
            </v-btn>
            <v-btn icon color="primary" href="#" target="_blank" aria-label="LinkedIn">
              <v-icon>mdi-linkedin</v-icon>
            </v-btn>
          </div>
        </v-col>
        
        <v-col cols="12" md="6">
          <v-card elevation="3" class="pa-5">
            <v-form ref="form" v-model="valid" @submit.prevent="submitForm">
              <v-text-field
                v-model="form.name"
                :rules="nameRules"
                label="Your Name"
                required
                outlined
                dense
              ></v-text-field>
              
              <v-text-field
                v-model="form.email"
                :rules="emailRules"
                label="Email"
                required
                outlined
                dense
                type="email"
              ></v-text-field>
              
              <v-select
                v-model="form.subject"
                :items="subjectOptions"
                label="Subject"
                required
                outlined
                dense
                :rules="[v => !!v || 'Subject is required']"
              ></v-select>
              
              <v-textarea
                v-model="form.message"
                :rules="messageRules"
                label="Message"
                required
                outlined
                counter="500"
                auto-grow
                rows="5"
              ></v-textarea>
              
              <v-checkbox
                v-model="form.agreement"
                :rules="[v => !!v || 'You must agree to continue']"
                label="I agree to the privacy policy"
                required
              ></v-checkbox>
              
              <v-btn
                type="submit"
                color="primary"
                block
                :disabled="!valid"
                :loading="loading"
                class="mt-4"
              >
                Send Message
              </v-btn>
            </v-form>
          </v-card>
        </v-col>
      </v-row>
      
      <v-divider class="my-10"></v-divider>
      
      <v-row>
        <v-col cols="12">
          <h2 class="text-h4 text-center mb-6">Find Us</h2>
          <div class="map-container">
            <!-- Map placeholder - would be replaced with an actual map component -->
            <v-img
              src="/img/map-placeholder.jpg"
              alt="Map location"
              height="400"
              class="rounded-lg elevation-2"
            />
          </div>
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
  name: 'ContactPage',
  data() {
    return {
      valid: false,
      loading: false,
      form: {
        name: '',
        email: '',
        subject: '',
        message: '',
        agreement: false
      },
      nameRules: [
        v => !!v || 'Name is required',
        v => v.length <= 50 || 'Name must be less than 50 characters'
      ],
      emailRules: [
        v => !!v || 'Email is required',
        v => /.+@.+\..+/.test(v) || 'Email must be valid'
      ],
      messageRules: [
        v => !!v || 'Message is required',
        v => v.length >= 10 || 'Message must be at least 10 characters',
        v => v.length <= 500 || 'Message must be less than 500 characters'
      ],
      subjectOptions: [
        'General Inquiry',
        'Customer Support',
        'Partnership Opportunity',
        'Report an Issue',
        'Feedback',
        'Other'
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
    submitForm() {
      if (!this.$refs.form.validate()) return;
      
      this.loading = true;
      
      // Simulate API call
      setTimeout(() => {
        this.loading = false;
        this.snackbar = {
          show: true,
          text: 'Thank you for your message! We will get back to you soon.',
          color: 'success',
          timeout: 5000
        };
        this.$refs.form.reset();
      }, 1500);
    }
  },
  metaInfo: {
    title: 'Contact Us',
    meta: [
      { name: 'description', content: 'Contact our team for support, feedback, or partnership inquiries. We\'re here to help!' }
    ]
  }
}
</script>

<style scoped>
.contact-page {
  padding: 40px 0;
}

.map-container {
  width: 100%;
  overflow: hidden;
}
</style> 