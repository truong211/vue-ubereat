<template>
  <v-row>
    <v-col cols="12" sm="6" md="3">
      <v-card class="mb-4" color="primary" dark>
        <v-card-text>
          <div class="d-flex flex-column align-center">
            <div class="text-overline mb-1">TỔNG YÊU CẦU</div>
            <div class="text-h3 font-weight-bold">{{ stats.total || 0 }}</div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col cols="12" sm="6" md="3">
      <v-card class="mb-4" color="warning" dark>
        <v-card-text>
          <div class="d-flex flex-column align-center">
            <div class="text-overline mb-1">ĐANG CHỜ XỬ LÝ</div>
            <div class="text-h3 font-weight-bold">{{ stats.statusCounts?.open || 0 }}</div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col cols="12" sm="6" md="3">
      <v-card class="mb-4" color="info" dark>
        <v-card-text>
          <div class="d-flex flex-column align-center">
            <div class="text-overline mb-1">ĐANG XỬ LÝ</div>
            <div class="text-h3 font-weight-bold">{{ stats.statusCounts?.inProgress || 0 }}</div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col cols="12" sm="6" md="3">
      <v-card class="mb-4" color="error" dark>
        <v-card-text>
          <div class="d-flex flex-column align-center">
            <div class="text-overline mb-1">KHẨN CẤP</div>
            <div class="text-h3 font-weight-bold">{{ stats.priorityCounts?.urgent || 0 }}</div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import { defineProps } from 'vue'

defineProps({
  stats: {
    type: Object,
    required: true,
    default: () => ({
      total: 0,
      statusCounts: {
        open: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0
      },
      priorityCounts: {
        urgent: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      categoryCounts: {
        account: 0,
        order: 0,
        payment: 0,
        delivery: 0,
        restaurant: 0,
        app: 0,
        other: 0
      },
      unassigned: 0
    })
  }
})
</script>
