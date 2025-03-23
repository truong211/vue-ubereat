<template>
  <v-container>
    <v-row>
      <!-- FAQ Content -->
      <v-col cols="12" md="8">
        <h1 class="text-h4 mb-6">Frequently Asked Questions</h1>
        
        <v-expansion-panels>
          <v-expansion-panel
            v-for="category in faqCategories"
            :key="category.title"
          >
            <v-expansion-panel-title>
              <div class="d-flex align-center">
                <v-icon :icon="getCategoryIcon(category.title)" class="mr-2"></v-icon>
                {{ category.title }}
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-list>
                <v-list-item
                  v-for="(item, i) in category.questions"
                  :key="i"
                  :value="item"
                >
                  <v-expansion-panels variant="popout">
                    <v-expansion-panel>
                      <v-expansion-panel-title>{{ item.q }}</v-expansion-panel-title>
                      <v-expansion-panel-text>{{ item.a }}</v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </v-list-item>
              </v-list>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>

      <!-- Support Contact Card -->
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title class="text-h6">
            <v-icon icon="mdi-headphones" class="mr-2"></v-icon>
            Contact Support
          </v-card-title>

          <v-card-text>
            <div class="mb-4">
              <div class="text-subtitle-1 mb-2">Available 24/7</div>
              <div class="d-flex align-center mb-2">
                <v-icon icon="mdi-phone" class="mr-2"></v-icon>
                <span>{{ supportPhone }}</span>
              </div>
              <div class="d-flex align-center">
                <v-icon icon="mdi-email" class="mr-2"></v-icon>
                <span>{{ supportEmail }}</span>
              </div>
            </div>

            <v-divider class="mb-4"></v-divider>

            <div class="text-subtitle-1 mb-2">Quick Support</div>
            <v-btn
              color="primary"
              block
              prepend-icon="mdi-message"
              class="mb-2"
              @click="openChat"
            >
              Start Live Chat
            </v-btn>
            <v-btn
              variant="outlined"
              block
              prepend-icon="mdi-whatsapp"
              :href="whatsappLink"
              target="_blank"
            >
              WhatsApp Support
            </v-btn>
          </v-card-text>
        </v-card>

        <!-- Popular Articles -->
        <v-card class="mt-4">
          <v-card-title class="text-h6">
            <v-icon icon="mdi-text-box-search" class="mr-2"></v-icon>
            Popular Articles
          </v-card-title>

          <v-list lines="two" select-strategy="classic">
            <v-list-item
              v-for="article in popularArticles"
              :key="article.id"
              :value="article"
              :title="article.title"
              :subtitle="article.description"
              @click="showArticle(article)"
            >
              <template v-slot:prepend>
                <v-icon :icon="article.icon"></v-icon>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <!-- Article Dialog -->
    <v-dialog v-model="showArticleDialog" max-width="600">
      <v-card v-if="selectedArticle">
        <v-card-title>{{ selectedArticle.title }}</v-card-title>
        <v-card-text>
          <div v-html="selectedArticle.content"></div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showArticleDialog = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'FAQPage',

  setup() {
    const store = useStore()
    const showArticleDialog = ref(false)
    const selectedArticle = ref(null)
    const supportPhone = ref('1-800-123-4567')
    const supportEmail = ref('support@ubereat.clone')

    const faqCategories = ref([
      {
        title: 'Orders',
        questions: [
          {
            q: 'How do I place an order?',
            a: 'Browse restaurants, select your items, add them to cart, and proceed to checkout. You can pay with various methods including credit cards and digital wallets.'
          },
          {
            q: 'Can I modify or cancel my order?',
            a: 'You can modify or cancel your order within 5 minutes of placing it. After that, please contact support for assistance.'
          },
          {
            q: 'What if my order is late?',
            a: 'We strive to deliver all orders on time. If your order is significantly delayed, you\'ll be notified and may be eligible for compensation.'
          }
        ]
      },
      {
        title: 'Delivery',
        questions: [
          {
            q: 'How is the delivery fee calculated?',
            a: 'Delivery fees are based on your distance from the restaurant, order value, and current demand.'
          },
          {
            q: 'Can I track my delivery?',
            a: 'Yes! Once your order is picked up, you can track your delivery in real-time through the app.'
          }
        ]
      },
      {
        title: 'Payment',
        questions: [
          {
            q: 'What payment methods are accepted?',
            a: 'We accept credit/debit cards, digital wallets (Apple Pay, Google Pay), and cash on delivery in select areas.'
          },
          {
            q: 'How do refunds work?',
            a: 'Refunds are processed within 5-7 business days and will be returned to your original payment method.'
          }
        ]
      },
      {
        title: 'Account',
        questions: [
          {
            q: 'How do I update my contact information?',
            a: 'Go to Profile Settings to update your email, phone number, and delivery addresses.'
          },
          {
            q: 'How do I change my notification preferences?',
            a: 'Visit Settings > Notifications to customize what notifications you receive and how you receive them.'
          }
        ]
      }
    ])

    const popularArticles = ref([
      {
        id: 1,
        title: 'Getting Started Guide',
        description: 'Learn how to use our app to order your favorite food',
        icon: 'mdi-book-open-page-variant',
        content: `
          <h3>Getting Started with UberEat Clone</h3>
          <ol>
            <li>Create an account or sign in</li>
            <li>Add your delivery address</li>
            <li>Browse restaurants near you</li>
            <li>Select your items and add to cart</li>
            <li>Choose payment method and place order</li>
            <li>Track your delivery in real-time</li>
          </ol>
        `
      },
      {
        id: 2,
        title: 'Delivery Information',
        description: 'Everything you need to know about our delivery service',
        icon: 'mdi-truck-delivery',
        content: `
          <h3>Delivery Information</h3>
          <p>Our delivery service operates 24/7 in most areas. Delivery times and fees vary based on:</p>
          <ul>
            <li>Distance from restaurant</li>
            <li>Time of day</li>
            <li>Weather conditions</li>
            <li>Current demand</li>
          </ul>
        `
      },
      {
        id: 3,
        title: 'Payment & Refunds',
        description: 'Learn about payment methods and refund policies',
        icon: 'mdi-cash-multiple',
        content: `
          <h3>Payment & Refunds</h3>
          <p>We accept various payment methods including:</p>
          <ul>
            <li>Credit/Debit cards</li>
            <li>Digital wallets</li>
            <li>Cash on delivery</li>
          </ul>
          <p>Refund requests are processed within 24 hours and credited within 5-7 business days.</p>
        `
      }
    ])

    const getCategoryIcon = (category) => {
      const icons = {
        Orders: 'mdi-clipboard-list',
        Delivery: 'mdi-truck-delivery',
        Payment: 'mdi-cash-multiple',
        Account: 'mdi-account-cog'
      }
      return icons[category] || 'mdi-help-circle'
    }

    const openChat = () => {
      store.dispatch('support/openChat')
    }

    const showArticle = (article) => {
      selectedArticle.value = article
      showArticleDialog.value = true
    }

    const whatsappLink = computed(() => {
      const phone = supportPhone.value.replace(/[^0-9]/g, '')
      return `https://wa.me/${phone}`
    })

    // Load site configuration on mount
    onMounted(async () => {
      try {
        const config = await store.dispatch('ui/getSiteConfig')
        supportPhone.value = config.supportPhone
        supportEmail.value = config.supportEmail
      } catch (error) {
        console.error('Failed to load site configuration:', error)
      }
    })

    return {
      faqCategories,
      popularArticles,
      showArticleDialog,
      selectedArticle,
      supportPhone,
      supportEmail,
      whatsappLink,
      getCategoryIcon,
      openChat,
      showArticle
    }
  }
}
</script>

<style scoped>
.v-expansion-panels {
  margin-bottom: 24px;
}

.v-list-item {
  margin-bottom: 8px;
}
</style>