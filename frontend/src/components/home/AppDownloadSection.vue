<template>
  <div class="app-download-section">
    <v-container>
      <v-row align="center" justify="space-between">
        <v-col cols="12" md="6" order="2" order-md="1">
          <div class="content-wrapper py-4">
            <h2 class="text-h4 mb-4">{{ title || 'Tải ứng dụng ngay hôm nay' }}</h2>
            <p class="text-body-1 mb-6">{{ description || 'Trải nghiệm dịch vụ giao đồ ăn tuyệt vời hơn với ứng dụng di động của chúng tôi. Đặt món dễ dàng, theo dõi đơn hàng theo thời gian thực và nhận nhiều ưu đãi độc quyền.' }}</p>
            
            <div class="d-flex flex-wrap">
              <v-hover v-slot="{ isHovering, props }">
                <v-img
                  src="/images/app-store.png"
                  max-width="180"
                  class="mr-4 mb-4 store-badge"
                  v-bind="props"
                  :class="{ 'on-hover': isHovering }"
                ></v-img>
              </v-hover>

              <v-hover v-slot="{ isHovering, props }">
                <v-img
                  src="/images/google-play.png"
                  max-width="180"
                  class="mb-4 store-badge"
                  v-bind="props"
                  :class="{ 'on-hover': isHovering }"
                ></v-img>
              </v-hover>
            </div>

            <div class="app-features mt-8">
              <div class="d-flex align-center mb-4">
                <v-avatar color="primary" size="36" class="mr-3">
                  <v-icon color="white">mdi-bell</v-icon>
                </v-avatar>
                <div>
                  <h4 class="text-subtitle-1 font-weight-bold">Thông báo theo thời gian thực</h4>
                  <p class="text-body-2 text-medium-emphasis">Cập nhật trạng thái đơn hàng tức thì</p>
                </div>
              </div>

              <div class="d-flex align-center mb-4">
                <v-avatar color="primary" size="36" class="mr-3">
                  <v-icon color="white">mdi-map-marker</v-icon>
                </v-avatar>
                <div>
                  <h4 class="text-subtitle-1 font-weight-bold">Theo dõi đơn hàng trực tiếp</h4>
                  <p class="text-body-2 text-medium-emphasis">Xem chính xác vị trí người giao hàng</p>
                </div>
              </div>

              <div class="d-flex align-center">
                <v-avatar color="primary" size="36" class="mr-3">
                  <v-icon color="white">mdi-tag-multiple</v-icon>
                </v-avatar>
                <div>
                  <h4 class="text-subtitle-1 font-weight-bold">Ưu đãi độc quyền</h4>
                  <p class="text-body-2 text-medium-emphasis">Tiếp cận sớm các khuyến mãi hấp dẫn</p>
                </div>
              </div>
            </div>
          </div>
        </v-col>

        <v-col cols="12" md="5" order="1" order-md="2">
          <div class="app-mockup text-center">
            <v-img
              src="/images/app-mockup.png"
              alt="Mobile App Mockup"
              class="mx-auto app-image"
              max-width="300"
              contain
            >
              <template v-slot:placeholder>
                <v-row class="fill-height ma-0" align="center" justify="center">
                  <v-progress-circular indeterminate color="primary"></v-progress-circular>
                </v-row>
              </template>
            </v-img>
            
            <!-- QR Code -->
            <div class="qr-code-container mt-4">
              <v-img
                src="/images/app-qr-code.png"
                max-width="120"
                class="mx-auto"
                alt="Download QR Code"
              ></v-img>
              <p class="text-caption text-center mt-2">Quét mã để tải ứng dụng</p>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
export default {
  name: 'AppDownloadSection',
  
  props: {
    title: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    }
  }
};
</script>

<style scoped>
.app-download-section {
  padding: 40px 0;
  position: relative;
  overflow: hidden;
}

.content-wrapper {
  animation: fadeInLeft 0.8s ease-out;
  position: relative;
  z-index: 2;
}

.app-mockup {
  position: relative;
  z-index: 2;
}

.app-image {
  animation: floatAnimation 6s ease-in-out infinite;
  filter: drop-shadow(0 15px 15px rgba(0, 0, 0, 0.2));
}

.store-badge {
  transition: all 0.3s ease;
  border-radius: 8px;
  cursor: pointer;
}

.store-badge.on-hover {
  transform: translateY(-5px);
  filter: drop-shadow(0 5px 10px rgba(0, 0, 0, 0.2));
}

.app-features {
  animation: fadeInUp 1s ease-out;
}

.qr-code-container {
  animation: fadeIn 1s ease-out;
  transition: transform 0.3s ease;
}

.qr-code-container:hover {
  transform: scale(1.05);
}

@keyframes floatAnimation {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-15px);
  }
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
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

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (max-width: 960px) {
  .app-mockup {
    margin-bottom: 30px;
  }
}
</style> 