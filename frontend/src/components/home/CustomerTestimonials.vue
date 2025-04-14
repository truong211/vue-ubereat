<template>
  <div class="customer-testimonials">
    <h2 class="text-h4 text-center mb-8">{{ title || 'Khách hàng nói gì về chúng tôi' }}</h2>
    
    <v-carousel
      hide-delimiter-background
      show-arrows="hover"
      cycle
      interval="5000"
      height="auto"
      class="mb-4 testimonial-carousel"
    >
      <v-carousel-item
        v-for="(testimonial, index) in testimonials"
        :key="index"
      >
        <v-container>
          <v-row justify="center">
            <v-col cols="12" md="8">
              <v-card class="pa-6 pa-md-8 testimonial-card">
                <div class="d-flex flex-column align-center text-center">
                  <v-avatar size="100" class="mb-4 testimonial-avatar">
                    <v-img :src="testimonial.avatar" :alt="testimonial.name">
                      <template v-slot:placeholder>
                        <v-avatar color="primary" size="100">
                          <v-icon color="white" size="40">mdi-account</v-icon>
                        </v-avatar>
                      </template>
                    </v-img>
                  </v-avatar>
                  
                  <div class="quote-marks">
                    <v-icon size="40" color="primary" opacity="0.2">mdi-format-quote-open</v-icon>
                  </div>
                  
                  <p class="text-body-1 font-italic mb-4 testimonial-text">
                    {{ testimonial.quote }}
                  </p>
                  
                  <v-rating
                    :model-value="testimonial.rating"
                    color="amber"
                    dense
                    size="small"
                    readonly
                    half-increments
                    class="mb-3"
                  ></v-rating>
                  
                  <h3 class="text-h6 font-weight-bold mb-1">{{ testimonial.name }}</h3>
                  <p class="text-caption text-medium-emphasis mb-0">{{ testimonial.location }}</p>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-carousel-item>
    </v-carousel>
    
    <!-- Testimonial stats -->
    <v-container>
      <v-row class="mt-8">
        <v-col 
          v-for="(stat, index) in stats" 
          :key="index" 
          cols="6" 
          md="3"
        >
          <v-card class="pa-4 stat-card text-center h-100">
            <div class="d-flex flex-column align-center">
              <v-avatar color="primary" size="50" class="mb-3">
                <v-icon color="white" size="24">{{ stat.icon }}</v-icon>
              </v-avatar>
              <div class="text-h4 font-weight-bold mb-2">{{ stat.value }}</div>
              <div class="text-body-2">{{ stat.label }}</div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
export default {
  name: 'CustomerTestimonials',
  
  props: {
    title: {
      type: String,
      default: ''
    },
    customTestimonials: {
      type: Array,
      default: () => []
    },
    customStats: {
      type: Array,
      default: () => []
    }
  },
  
  setup(props) {
    const defaultTestimonials = [
      {
        name: 'Nguyễn Văn A',
        location: 'Hà Nội',
        avatar: '/images/testimonials/avatar1.jpg',
        quote: 'Dịch vụ giao hàng rất nhanh và đồ ăn luôn nóng hổi khi đến nơi. Tôi đặc biệt thích cách họ đóng gói các món ăn rất cẩn thận và chuyên nghiệp.',
        rating: 5
      },
      {
        name: 'Trần Thị B',
        location: 'Hồ Chí Minh',
        avatar: '/images/testimonials/avatar2.jpg',
        quote: 'Đây là ứng dụng giao đồ ăn tốt nhất mà tôi từng sử dụng. Nhiều lựa chọn nhà hàng, giá cả hợp lý và dịch vụ khách hàng tuyệt vời. Tôi sẽ tiếp tục sử dụng dịch vụ này.',
        rating: 4.5
      },
      {
        name: 'Lê Văn C',
        location: 'Đà Nẵng',
        avatar: '/images/testimonials/avatar3.jpg',
        quote: 'Tôi rất ấn tượng với tốc độ giao hàng và sự chính xác của đơn hàng. Nhân viên giao hàng luôn lịch sự và thân thiện. Ứng dụng rất dễ sử dụng và có nhiều ưu đãi hấp dẫn.',
        rating: 5
      }
    ];
    
    const defaultStats = [
      {
        icon: 'mdi-account-group',
        value: '100K+',
        label: 'Khách hàng hài lòng'
      },
      {
        icon: 'mdi-store',
        value: '2,500+',
        label: 'Nhà hàng đối tác'
      },
      {
        icon: 'mdi-moped',
        value: '15K+',
        label: 'Đơn hàng mỗi ngày'
      },
      {
        icon: 'mdi-map-marker',
        value: '20+',
        label: 'Thành phố phủ sóng'
      }
    ];
    
    return {
      testimonials: props.customTestimonials.length > 0 ? props.customTestimonials : defaultTestimonials,
      stats: props.customStats.length > 0 ? props.customStats : defaultStats
    };
  }
};
</script>

<style scoped>
.testimonial-carousel {
  margin-bottom: 40px;
}

.testimonial-card {
  border-radius: 16px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  overflow: hidden;
}

.testimonial-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1) !important;
}

.testimonial-avatar {
  border: 3px solid var(--v-primary-base);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.testimonial-card:hover .testimonial-avatar {
  transform: scale(1.05);
}

.quote-marks {
  margin: -10px 0 10px;
}

.testimonial-text {
  line-height: 1.7;
  font-size: 1.1rem;
  position: relative;
  z-index: 1;
}

.stat-card {
  border-radius: 12px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
  height: 100%;
  animation: fadeInUp 0.8s ease forwards;
  opacity: 0;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1) !important;
}

/* Animation for the testimonial cards */
.testimonial-card {
  animation: fadeIn 0.8s ease-out;
}

/* Stagger animation for stats cards */
.stat-card:nth-child(1) { animation-delay: 0.1s; }
.stat-card:nth-child(2) { animation-delay: 0.2s; }
.stat-card:nth-child(3) { animation-delay: 0.3s; }
.stat-card:nth-child(4) { animation-delay: 0.4s; }

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
</style> 