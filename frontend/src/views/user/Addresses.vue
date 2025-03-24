<template>
  <v-container class="py-6">
    <h1 class="text-h4 font-weight-bold mb-6">Quản lý địa chỉ giao hàng</h1>
    
    <v-row>
      <v-col cols="12">
        <delivery-addresses />
      </v-col>
    </v-row>
    
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card class="pa-4">
          <v-card-title class="px-0">
            <v-icon color="info" class="mr-2">mdi-information-outline</v-icon>
            Thông tin về địa chỉ
          </v-card-title>
          <v-card-text>
            <ul class="mb-0 pl-4">
              <li class="mb-2">Bạn có thể lưu nhiều địa chỉ giao hàng khác nhau để thuận tiện khi đặt món.</li>
              <li class="mb-2">Địa chỉ mặc định sẽ được tự động chọn khi bạn đặt đơn hàng mới.</li>
              <li class="mb-2">Bạn có thể thay đổi địa chỉ mặc định bất cứ lúc nào.</li>
              <li>Để có trải nghiệm đặt hàng tốt nhất, hãy nhập địa chỉ chính xác với đầy đủ thông tin.</li>
            </ul>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import DeliveryAddresses from '@/components/user/DeliveryAddresses.vue';
</script> 