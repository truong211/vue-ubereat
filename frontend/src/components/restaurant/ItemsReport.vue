<template>
  <div class="items-report">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        {{ $t('restaurant.reports.title') }}
        <v-select
          v-model="timeRange"
          :items="timeRanges"
          :label="$t('restaurant.reports.timeRange')"
          density="compact"
          variant="outlined"
          hide-details
          style="width: 150px"
        ></v-select>
      </v-card-title>

      <v-card-text>
        <!-- Filters -->
        <v-row class="mb-4">
          <v-col cols="12" sm="4">
            <v-select
              v-model="categoryFilter"
              :items="categories"
              :label="$t('restaurant.reports.category')"
              density="compact"
              variant="outlined"
              hide-details
            ></v-select>
          </v-col>
          <v-col cols="12" sm="4">
            <v-select
              v-model="sortBy"
              :items="sortOptions"
              :label="$t('restaurant.reports.sortBy')"
              density="compact"
              variant="outlined"
              hide-details
            ></v-select>
          </v-col>
          <v-col cols="12" sm="4">
            <v-checkbox
              v-model="showInactive"
              :label="$t('restaurant.reports.showInactive')"
              hide-details
            ></v-checkbox>
          </v-col>
        </v-row>

        <!-- Overview Cards -->
        <v-row>
          <v-col cols="12" sm="6" md="3">
            <v-card variant="outlined" class="pa-4">
              <div class="text-overline mb-1">
                {{ $t('restaurant.reports.totalItems') }}
              </div>
              <div class="text-h4">{{ summary.totalItems }}</div>
              <div class="d-flex align-center mt-2">
                <v-icon
                  :color="summary.itemsChange >= 0 ? 'success' : 'error'"
                  size="small"
                >
                  {{ summary.itemsChange >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
                </v-icon>
                <span class="text-body-2 ml-1" :class="{
                  'text-success': summary.itemsChange >= 0,
                  'text-error': summary.itemsChange < 0
                }">
                  {{ Math.abs(summary.itemsChange) }}%
                </span>
                <span class="text-caption ml-2">{{ $t('restaurant.reports.vsPrevPeriod') }}</span>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-card variant="outlined" class="pa-4">
              <div class="text-overline mb-1">
                {{ $t('restaurant.reports.totalSales') }}
              </div>
              <div class="text-h4">{{ formatPrice(summary.totalSales) }}</div>
              <div class="d-flex align-center mt-2">
                <v-icon
                  :color="summary.salesChange >= 0 ? 'success' : 'error'"
                  size="small"
                >
                  {{ summary.salesChange >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
                </v-icon>
                <span class="text-body-2 ml-1" :class="{
                  'text-success': summary.salesChange >= 0,
                  'text-error': summary.salesChange < 0
                }">
                  {{ Math.abs(summary.salesChange) }}%
                </span>
                <span class="text-caption ml-2">{{ $t('restaurant.reports.vsPrevPeriod') }}</span>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-card variant="outlined" class="pa-4">
              <div class="text-overline mb-1">
                {{ $t('restaurant.reports.avgOrderValue') }}
              </div>
              <div class="text-h4">{{ formatPrice(summary.avgOrderValue) }}</div>
              <div class="d-flex align-center mt-2">
                <v-icon
                  :color="summary.avgOrderChange >= 0 ? 'success' : 'error'"
                  size="small"
                >
                  {{ summary.avgOrderChange >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
                </v-icon>
                <span class="text-body-2 ml-1" :class="{
                  'text-success': summary.avgOrderChange >= 0,
                  'text-error': summary.avgOrderChange < 0
                }">
                  {{ Math.abs(summary.avgOrderChange) }}%
                </span>
                <span class="text-caption ml-2">{{ $t('restaurant.reports.vsPrevPeriod') }}</span>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-card variant="outlined" class="pa-4">
              <div class="text-overline mb-1">
                {{ $t('restaurant.reports.bestSellingCategory') }}
              </div>
              <div class="text-h4">{{ summary.bestCategory }}</div>
              <div class="d-flex align-center mt-2">
                <span class="text-caption">
                  {{ formatPrice(summary.bestCategoryRevenue) }}
                </span>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Items Table -->
        <v-table class="mt-4">
          <thead>
            <tr>
              <th>{{ $t('restaurant.reports.item') }}</th>
              <th>{{ $t('restaurant.reports.category') }}</th>
              <th class="text-right">{{ $t('restaurant.reports.quantity') }}</th>
              <th class="text-right">{{ $t('restaurant.reports.revenue') }}</th>
              <th class="text-right">{{ $t('restaurant.reports.trend') }}</th>
              <th class="text-right">{{ $t('restaurant.reports.status') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in sortedItems" :key="item.id">
              <td>
                <div class="d-flex align-center">
                  <v-img
                    :src="item.image"
                    width="40"
                    height="40"
                    class="rounded mr-2"
                  ></v-img>
                  <div>
                    <div>{{ item.name }}</div>
                    <div class="text-caption">{{ formatPrice(item.price) }}</div>
                  </div>
                </div>
              </td>
              <td>{{ item.category }}</td>
              <td class="text-right">{{ item.quantity }}</td>
              <td class="text-right">{{ formatPrice(item.revenue) }}</td>
              <td class="text-right">
                <div class="d-flex align-center justify-end">
                  <v-icon
                    :color="item.trend >= 0 ? 'success' : 'error'"
                    size="small"
                    class="mr-1"
                  >
                    {{ item.trend >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
                  </v-icon>
                  <span :class="{
                    'text-success': item.trend >= 0,
                    'text-error': item.trend < 0
                  }">{{ Math.abs(item.trend) }}%</span>
                </div>
              </td>
              <td class="text-right">
                <v-chip
                  :color="item.active ? 'success' : 'error'"
                  size="small"
                >
                  {{ item.active ? $t('restaurant.reports.active') : $t('restaurant.reports.inactive') }}
                </v-chip>
              </td>
            </tr>
          </tbody>
        </v-table>

        <!-- Export Button -->
        <div class="d-flex justify-end mt-4">
          <v-btn
            color="primary"
            prepend-icon="mdi-download"
            @click="exportReport"
          >
            {{ $t('restaurant.reports.export') }}
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
