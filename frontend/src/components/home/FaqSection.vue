<template>
  <div class="faq-section">
    <v-container>
      <h2 class="text-h4 text-center mb-8">{{ title || 'Câu hỏi thường gặp' }}</h2>
      
      <v-row>
        <v-col cols="12" md="6">
          <v-img
            src="/images/faq-illustration.svg"
            max-height="400"
            contain
            class="faq-illustration mb-8 mb-md-0"
          ></v-img>
        </v-col>
        
        <v-col cols="12" md="6">
          <v-expansion-panels variant="accordion" class="faq-panels">
            <v-expansion-panel
              v-for="(item, i) in faqs"
              :key="i"
              class="faq-panel mb-3"
              rounded="lg"
            >
              <v-expansion-panel-title class="text-subtitle-1 font-weight-medium">
                {{ item.question }}
              </v-expansion-panel-title>
              <v-expansion-panel-text class="pt-2">
                <p class="text-body-1">{{ item.answer }}</p>

                <v-btn
                  v-if="item.link"
                  :to="item.link"
                  variant="text"
                  color="primary"
                  class="px-0 mt-2"
                  density="comfortable"
                >
                  {{ item.linkText || 'Tìm hiểu thêm' }}
                  <v-icon end>mdi-arrow-right</v-icon>
                </v-btn>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
          
          <div class="text-center mt-6">
            <v-btn 
              color="primary" 
              variant="flat" 
              :to="helpCenterLink || '/help'" 
              class="px-6"
            >
              {{ helpCenterText || 'Xem tất cả câu hỏi' }}
            </v-btn>
          </div>
        </v-col>
      </v-row>
      
      <!-- Contact support section -->
      <v-card class="mt-12 pa-6 rounded-lg support-card">
        <v-row align="center">
          <v-col cols="12" md="8">
            <h3 class="text-h5 mb-2">Bạn vẫn cần hỗ trợ?</h3>
            <p class="text-body-1 mb-0">
              Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ bạn giải quyết mọi thắc mắc.
            </p>
          </v-col>
          <v-col cols="12" md="4" class="text-center text-md-right">
            <v-btn 
              color="primary" 
              variant="flat" 
              :to="contactLink || '/contact'" 
              size="large"
            >
              Liên hệ hỗ trợ
            </v-btn>
          </v-col>
        </v-row>
      </v-card>
    </v-container>
  </div>
</template>

<script>
export default {
  name: 'FaqSection',
  
  props: {
    title: {
      type: String,
      default: ''
    },
    customFaqs: {
      type: Array,
      default: () => []
    },
    helpCenterText: {
      type: String,
      default: ''
    },
    helpCenterLink: {
      type: String,
      default: ''
    },
    contactLink: {
      type: String,
      default: ''
    }
  },
  
  setup(props) {
    const defaultFaqs = [
      {
        question: 'Làm thế nào để đặt đồ ăn trên ứng dụng?',
        answer: 'Để đặt đồ ăn, trước tiên hãy tìm nhà hàng bạn muốn đặt, chọn món ăn yêu thích, thêm vào giỏ hàng và tiến hành thanh toán. Bạn có thể thanh toán bằng nhiều phương thức khác nhau như tiền mặt khi nhận hàng, thẻ tín dụng, hoặc ví điện tử.',
        link: '/guide/ordering',
        linkText: 'Xem hướng dẫn chi tiết'
      },
      {
        question: 'Phí giao hàng được tính như thế nào?',
        answer: 'Phí giao hàng được tính dựa trên khoảng cách từ nhà hàng đến địa điểm giao hàng của bạn và có thể thay đổi tùy theo khu vực. Một số nhà hàng cung cấp giao hàng miễn phí khi đơn hàng đạt giá trị tối thiểu. Phí giao hàng sẽ được hiển thị rõ ràng trước khi bạn hoàn tất đơn hàng.',
      },
      {
        question: 'Tôi có thể theo dõi đơn hàng của mình không?',
        answer: 'Có, bạn có thể theo dõi đơn hàng trong thời gian thực thông qua ứng dụng của chúng tôi. Sau khi đặt hàng, bạn sẽ nhận được thông báo khi nhà hàng xác nhận đơn hàng, khi người giao hàng nhận món ăn, và khi họ đang trên đường đến địa điểm của bạn.',
      },
      {
        question: 'Làm cách nào để hủy đơn hàng?',
        answer: 'Bạn có thể hủy đơn hàng thông qua ứng dụng trong khoảng thời gian nhà hàng chưa bắt đầu chuẩn bị món ăn. Vào phần "Đơn hàng của tôi", chọn đơn hàng bạn muốn hủy và nhấn vào nút "Hủy đơn hàng". Lưu ý rằng nếu nhà hàng đã bắt đầu chuẩn bị món ăn, bạn sẽ không thể hủy đơn hàng.',
        link: '/help/cancel-order',
        linkText: 'Chính sách hủy đơn'
      },
      {
        question: 'Tôi có thể đặt đồ ăn trước cho một thời điểm cụ thể không?',
        answer: 'Có, nhiều nhà hàng trên nền tảng của chúng tôi cho phép đặt trước. Khi đặt hàng, bạn có thể chọn tùy chọn "Đặt trước" và chọn ngày và giờ bạn muốn nhận đồ ăn. Lưu ý rằng không phải tất cả các nhà hàng đều cung cấp tính năng này.',
      }
    ];
    
    return {
      faqs: props.customFaqs.length > 0 ? props.customFaqs : defaultFaqs
    };
  }
};
</script>

<style scoped>
.faq-section {
  padding: 60px 0;
}

.faq-illustration {
  animation: floatAnimation 6s ease-in-out infinite;
  opacity: 0;
  animation-fill-mode: forwards;
  animation-delay: 0.3s;
}

.faq-panels {
  animation: fadeIn 0.8s ease-out forwards;
  opacity: 0;
}

.faq-panel {
  margin-bottom: 16px !important;
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: box-shadow 0.3s ease;
}

.faq-panel:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
}

.support-card {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.05) 0%, rgba(var(--v-theme-primary), 0.1) 100%);
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  animation: fadeInUp 0.8s ease-out 0.5s forwards;
  opacity: 0;
}

.support-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1) !important;
}

@keyframes floatAnimation {
  0%, 100% {
    opacity: 1;
    transform: translateY(0);
  }
  50% {
    opacity: 1;
    transform: translateY(-15px);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* For small screens, adjust padding */
@media (max-width: 600px) {
  .faq-section {
    padding: 40px 0;
  }
}
</style> 