<template>
  <v-container class="py-6">
    <h1 class="text-h4 font-weight-bold mb-6">Quản lý mã giảm giá</h1>
    
    <v-row>
      <v-col cols="12">
        <saved-vouchers />
      </v-col>
    </v-row>
    
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card class="pa-4">
          <v-card-title class="px-0">
            <v-icon color="info" class="mr-2">mdi-information-outline</v-icon>
            Thông tin về mã giảm giá
          </v-card-title>
          <v-card-text>
            <ul class="mb-0 pl-4">
              <li class="mb-2">Lưu mã giảm giá để sử dụng dễ dàng khi đặt hàng.</li>
              <li class="mb-2">Mỗi mã giảm giá chỉ áp dụng cho một đơn hàng và có thời hạn sử dụng.</li>
              <li class="mb-2">Một số mã giảm giá chỉ áp dụng khi đơn hàng đạt mức tối thiểu.</li>
              <li>Mã giảm giá có thể bị hạn chế sử dụng với một số nhà hàng hoặc món ăn.</li>
            </ul>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import SavedVouchers from '@/components/user/SavedVouchers.vue';
</script> 