<template>
  <div class="services-section">
    <h2 class="text-h4 text-center mb-8">Dịch vụ của chúng tôi</h2>
    
    <v-row>
      <v-col v-for="(service, index) in services" :key="index" cols="12" sm="6" md="3">
        <v-card class="service-card h-100 text-center pa-4" flat>
          <v-avatar size="80" color="primary" class="mb-4">
            <v-icon size="40" color="white">{{ service.icon }}</v-icon>
          </v-avatar>
          
          <h3 class="text-h5 mb-2">{{ service.title }}</h3>
          <p class="text-body-1">{{ service.description }}</p>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
export default {
  name: 'ServicesSection',
  
  setup() {
    const services = [
      {
        icon: 'mdi-food',
        title: 'Đa dạng món ăn',
        description: 'Hàng ngàn món ăn từ các nhà hàng nổi tiếng, đáp ứng mọi khẩu vị.'
      },
      {
        icon: 'mdi-truck-delivery',
        title: 'Giao hàng nhanh chóng',
        description: 'Giao hàng trong vòng 30 phút, đảm bảo thức ăn luôn nóng hổi.'
      },
      {
        icon: 'mdi-wallet-giftcard',
        title: 'Khuyến mãi hấp dẫn',
        description: 'Nhiều ưu đãi và mã giảm giá hàng tuần dành cho khách hàng.'
      },
      {
        icon: 'mdi-shield-check',
        title: 'Đảm bảo chất lượng',
        description: 'Cam kết về chất lượng thực phẩm và dịch vụ giao hàng.'
      }
    ];
    
    return {
      services
    };
  }
};
</script>

<style scoped>
.service-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.service-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1) !important;
}
</style>
