<template>
  <div class="customer-account-details">
    <v-container>
      <v-row>
        <v-col cols="12">
          <v-card v-if="customer">
            <v-card-title class="headline d-flex align-center">
              <div>
                <v-btn icon small class="mr-2" @click="goBack">
                  <v-icon>mdi-arrow-left</v-icon>
                </v-btn>
                Chi tiết tài khoản khách hàng
              </div>
              <v-spacer></v-spacer>
              <v-chip :color="getAccountStatusColor(customer.status)" dark>
                {{ customer.status }}
              </v-chip>
            </v-card-title>

            <v-card-text>
              <v-row>
                <v-col cols="12" md="4">
                  <v-card outlined class="mb-4">
                    <v-card-text class="text-center">
                      <v-avatar size="120" class="mb-3">
                        <v-img
                          v-if="customer.avatar"
                          :src="customer.avatar"
                          alt="Avatar"
                        ></v-img>
                        <v-icon v-else size="64" color="grey lighten-1">mdi-account</v-icon>
                      </v-avatar>
                      <h2 class="headline mb-2">{{ customer.fullName }}</h2>
                      <p class="mb-0 grey--text">ID: {{ customer.id }}</p>
                      <p class="mb-0 grey--text">Tham gia: {{ formatDate(customer.createdAt) }}</p>
                    </v-card-text>
                  </v-card>

                  <v-card outlined class="mb-4">
                    <v-list>
                      <v-list-item>
                        <v-list-item-icon>
                          <v-icon>mdi-email</v-icon>
                        </v-list-item-icon>
                        <v-list-item-content>
                          <v-list-item-title>Email</v-list-item-title>
                          <v-list-item-subtitle>{{ customer.email }}</v-list-item-subtitle>
                        </v-list-item-content>
                      </v-list-item>

                      <v-list-item>
                        <v-list-item-icon>
                          <v-icon>mdi-phone</v-icon>
                        </v-list-item-icon>
                        <v-list-item-content>
                          <v-list-item-title>Số điện thoại</v-list-item-title>
                          <v-list-item-subtitle>{{ customer.phone }}</v-list-item-subtitle>
                        </v-list-item-content>
                      </v-list-item>

                      <v-list-item>
                        <v-list-item-icon>
                          <v-icon>mdi-check-decagram</v-icon>
                        </v-list-item-icon>
                        <v-list-item-content>
                          <v-list-item-title>Xác thực</v-list-item-title>
                          <v-list-item-subtitle>
                            <v-chip
                              small
                              :color="customer.verified ? 'success' : 'error'"
                              text-color="white"
                            >
                              {{ customer.verified ? 'Đã xác thực' : 'Chưa xác thực' }}
                            </v-chip>
                          </v-list-item-subtitle>
                        </v-list-item-content>
                      </v-list-item>
                    </v-list>
                  </v-card>

                  <v-card outlined>
                    <v-card-title>Thao tác</v-card-title>
                    <v-card-text>
                      <v-btn
                        block
                        color="primary"
                        class="mb-2"
                        @click="editAccount"
                      >
                        <v-icon left>mdi-account-edit</v-icon>
                        Chỉnh sửa thông tin
                      </v-btn>
                      
                      <v-btn
                        block
                        :color="customer.isLocked ? 'success' : 'error'"
                        class="mb-2"
                        @click="toggleAccountStatus"
                      >
                        <v-icon left>{{ customer.isLocked ? 'mdi-lock-open' : 'mdi-lock' }}</v-icon>
                        {{ customer.isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản' }}
                      </v-btn>
                      
                      <v-btn
                        block
                        color="warning"
                        class="mb-2"
                        @click="resetPassword"
                      >
                        <v-icon left>mdi-lock-reset</v-icon>
                        Đặt lại mật khẩu
                      </v-btn>
                      
                      <v-btn
                        block
                        color="info"
                        @click="viewActivity"
                      >
                        <v-icon left>mdi-history</v-icon>
                        Xem lịch sử hoạt động
                      </v-btn>
                    </v-card-text>
                  </v-card>
                </v-col>

                <v-col cols="12" md="8">
                  <v-card outlined class="mb-4">
                    <v-tabs v-model="activeTab">
                      <v-tab>Thông tin chi tiết</v-tab>
                      <v-tab>Đơn hàng</v-tab>
                      <v-tab>Yêu cầu hỗ trợ</v-tab>
                      <v-tab>Địa chỉ</v-tab>
                      <v-tab>Nhà hàng yêu thích</v-tab>
                      <v-tab>Nhà hàng đã đặt</v-tab>
                    </v-tabs>

                    <v-tabs-items v-model="activeTab">
                      <!-- Tab 1: Detailed Information -->
                      <v-tab-item>
                        <v-card flat>
                          <v-card-text>
                            <v-list>
                              <v-subheader>THÔNG TIN CÁ NHÂN</v-subheader>

                              <v-list-item>
                                <v-list-item-content>
                                  <v-list-item-title>Họ và tên</v-list-item-title>
                                  <v-list-item-subtitle>{{ customer.fullName }}</v-list-item-subtitle>
                                </v-list-item-content>
                              </v-list-item>

                              <v-list-item>
                                <v-list-item-content>
                                  <v-list-item-title>Ngày sinh</v-list-item-title>
                                  <v-list-item-subtitle>{{ formatDate(customer.dateOfBirth) }}</v-list-item-subtitle>
                                </v-list-item-content>
                              </v-list-item>

                              <v-list-item>
                                <v-list-item-content>
                                  <v-list-item-title>Giới tính</v-list-item-title>
                                  <v-list-item-subtitle>{{ customer.gender }}</v-list-item-subtitle>
                                </v-list-item-content>
                              </v-list-item>

                              <v-divider></v-divider>
                              <v-subheader>THÔNG TIN TÀI KHOẢN</v-subheader>

                              <v-list-item>
                                <v-list-item-content>
                                  <v-list-item-title>Cấp độ thành viên</v-list-item-title>
                                  <v-list-item-subtitle>
                                    <v-chip small color="amber" text-color="white">
                                      {{ customer.membershipLevel }}
                                    </v-chip>
                                  </v-list-item-subtitle>
                                </v-list-item-content>
                              </v-list-item>

                              <v-list-item>
                                <v-list-item-content>
                                  <v-list-item-title>Điểm tích lũy</v-list-item-title>
                                  <v-list-item-subtitle>{{ customer.loyaltyPoints }} điểm</v-list-item-subtitle>
                                </v-list-item-content>
                              </v-list-item>

                              <v-list-item>
                                <v-list-item-content>
                                  <v-list-item-title>Đăng nhập cuối</v-list-item-title>
                                  <v-list-item-subtitle>{{ formatDate(customer.lastLogin) }}</v-list-item-subtitle>
                                </v-list-item-content>
                              </v-list-item>

                              <v-list-item>
                                <v-list-item-content>
                                  <v-list-item-title>Thiết bị đăng nhập</v-list-item-title>
                                  <v-list-item-subtitle>{{ customer.lastDevice }}</v-list-item-subtitle>
                                </v-list-item-content>
                              </v-list-item>

                              <v-divider></v-divider>
                              <v-subheader>GHI CHÚ</v-subheader>

                              <v-list-item>
                                <v-list-item-content>
                                  <v-textarea
                                    v-model="customerNotes"
                                    outlined
                                    rows="3"
                                    label="Ghi chú về khách hàng"
                                    hint="Chỉ nhân viên nội bộ có thể xem"
                                  ></v-textarea>
                                  <v-btn color="primary" small class="mt-2" @click="saveNotes">
                                    <v-icon small left>mdi-content-save</v-icon>
                                    Lưu ghi chú
                                  </v-btn>
                                </v-list-item-content>
                              </v-list-item>
                            </v-list>
                          </v-card-text>
                        </v-card>
                      </v-tab-item>

                      <!-- Tab 2: Orders -->
                      <v-tab-item>
                        <v-card flat>
                          <v-card-text>
                            <v-data-table
                              :headers="orderHeaders"
                              :items="customerOrders"
                              :items-per-page="5"
                              class="elevation-1"
                            >
                              <template v-slot:item.status="{ item }">
                                <v-chip small :color="getOrderStatusColor(item.status)" dark>
                                  {{ item.status }}
                                </v-chip>
                              </template>
                              
                              <template v-slot:item.restaurant="{ item }">
                                <div class="d-flex align-center">
                                  <v-avatar size="24" class="mr-2" v-if="item.restaurantLogo">
                                    <v-img :src="item.restaurantLogo"></v-img>
                                  </v-avatar>
                                  {{ item.restaurantName }}
                                </div>
                              </template>
                              
                              <template v-slot:item.date="{ item }">
                                {{ formatDate(item.date) }}
                              </template>
                              
                              <template v-slot:item.total="{ item }">
                                {{ formatCurrency(item.total) }}
                              </template>
                              
                              <template v-slot:item.actions="{ item }">
                                <v-btn small color="primary" text @click="viewOrder(item)">
                                  <v-icon small>mdi-eye</v-icon> Xem
                                </v-btn>
                              </template>
                            </v-data-table>
                          </v-card-text>
                        </v-card>
                      </v-tab-item>

                      <!-- Tab 3: Support Tickets -->
                      <v-tab-item>
                        <v-card flat>
                          <v-card-text>
                            <v-data-table
                              :headers="ticketHeaders"
                              :items="customerTickets"
                              :items-per-page="5"
                              class="elevation-1"
                            >
                              <template v-slot:item.status="{ item }">
                                <v-chip small :color="getTicketStatusColor(item.status)" dark>
                                  {{ item.status }}
                                </v-chip>
                              </template>
                              
                              <template v-slot:item.createdAt="{ item }">
                                {{ formatDate(item.createdAt) }}
                              </template>
                              
                              <template v-slot:item.actions="{ item }">
                                <v-btn small color="primary" text @click="viewTicket(item)">
                                  <v-icon small>mdi-eye</v-icon> Xem
                                </v-btn>
                              </template>
                            </v-data-table>
                          </v-card-text>
                        </v-card>
                      </v-tab-item>

                      <!-- Tab 4: Addresses -->
                      <v-tab-item>
                        <v-card flat>
                          <v-card-text>
                            <div v-if="customerAddresses.length === 0" class="text-center pa-5">
                              <v-icon large color="grey lighten-1">mdi-map-marker-off</v-icon>
                              <p class="mt-2 grey--text">Khách hàng chưa có địa chỉ nào</p>
                            </div>
                            
                            <v-row v-else>
                              <v-col cols="12" md="6" v-for="(address, index) in customerAddresses" :key="index">
                                <v-card outlined>
                                  <v-card-title class="subtitle-1">
                                    {{ address.title }}
                                    <v-spacer></v-spacer>
                                    <v-chip x-small v-if="address.isDefault" color="green" text-color="white">
                                      Mặc định
                                    </v-chip>
                                  </v-card-title>
                                  <v-card-text>
                                    <p class="mb-1"><strong>Người nhận:</strong> {{ address.receiverName }}</p>
                                    <p class="mb-1"><strong>Điện thoại:</strong> {{ address.phone }}</p>
                                    <p class="mb-1"><strong>Địa chỉ:</strong> {{ address.detail }}</p>
                                    <p class="mb-1"><strong>Phường/Xã:</strong> {{ address.ward }}</p>
                                    <p class="mb-1"><strong>Quận/Huyện:</strong> {{ address.district }}</p>
                                    <p class="mb-1"><strong>Tỉnh/Thành:</strong> {{ address.province }}</p>
                                  </v-card-text>
                                </v-card>
                              </v-col>
                            </v-row>
                          </v-card-text>
                        </v-card>
                      </v-tab-item>

                      <!-- Tab 5: Favorite Restaurants -->
                      <v-tab-item>
                        <v-card flat>
                          <v-card-text>
                            <div v-if="favoriteRestaurants.length === 0" class="text-center pa-5">
                              <v-icon large color="grey lighten-1">mdi-heart-off</v-icon>
                              <p class="mt-2 grey--text">Khách hàng chưa có nhà hàng yêu thích nào</p>
                            </div>
                            
                            <v-row v-else>
                              <v-col cols="12" md="6" v-for="(restaurant, index) in favoriteRestaurants" :key="index">
                                <v-card outlined hover>
                                  <div class="d-flex pa-4">
                                    <v-avatar size="64" class="mr-4">
                                      <v-img :src="restaurant.image || 'https://via.placeholder.com/64'" :alt="restaurant.name"></v-img>
                                    </v-avatar>
                                    <div>
                                      <h3 class="subtitle-1 font-weight-medium">{{ restaurant.name }}</h3>
                                      <div class="caption grey--text">
                                        <v-icon x-small color="amber darken-2">mdi-star</v-icon> {{ restaurant.rating }} ({{ restaurant.reviewCount }})
                                      </div>
                                      <div class="caption grey--text mt-1">
                                        <v-icon x-small color="grey">mdi-map-marker</v-icon> {{ restaurant.address }}
                                      </div>
                                      <div class="mt-2">
                                        <v-chip x-small v-for="(category, i) in restaurant.categories" :key="i" class="mr-1 mb-1">
                                          {{ category }}
                                        </v-chip>
                                      </div>
                                    </div>
                                  </div>
                                  <v-divider></v-divider>
                                  <v-card-actions>
                                    <v-btn small text color="primary" @click="viewRestaurant(restaurant)">
                                      <v-icon small left>mdi-eye</v-icon> Xem nhà hàng
                                    </v-btn>
                                    <v-spacer></v-spacer>
                                    <v-btn small text color="grey" @click="viewFavoriteDishes(restaurant)">
                                      <v-icon small left>mdi-food</v-icon> Món ăn yêu thích
                                    </v-btn>
                                  </v-card-actions>
                                </v-card>
                              </v-col>
                            </v-row>
                          </v-card-text>
                        </v-card>
                      </v-tab-item>

                      <!-- Tab 6: Restaurants Ordered From -->
                      <v-tab-item>
                        <v-card flat>
                          <v-card-text>
                            <div v-if="orderedRestaurants.length === 0" class="text-center pa-5">
                              <v-icon large color="grey lighten-1">mdi-store-off</v-icon>
                              <p class="mt-2 grey--text">Khách hàng chưa đặt đơn từ nhà hàng nào</p>
                            </div>
                            
                            <v-row v-else>
                              <v-col cols="12">
                                <v-data-table
                                  :headers="restaurantOrdersHeaders"
                                  :items="orderedRestaurants"
                                  :items-per-page="5"
                                  class="elevation-1"
                                >
                                  <template v-slot:item.restaurant="{ item }">
                                    <div class="d-flex align-center">
                                      <v-avatar size="32" class="mr-2">
                                        <v-img :src="item.image || 'https://via.placeholder.com/32'" :alt="item.name"></v-img>
                                      </v-avatar>
                                      <div>
                                        <div class="font-weight-medium">{{ item.name }}</div>
                                        <div class="caption grey--text">
                                          <v-icon x-small color="amber darken-2">mdi-star</v-icon> {{ item.rating }}
                                        </div>
                                      </div>
                                    </div>
                                  </template>
                                  
                                  <template v-slot:item.lastOrder="{ item }">
                                    {{ formatDate(item.lastOrder) }}
                                  </template>
                                  
                                  <template v-slot:item.totalSpent="{ item }">
                                    {{ formatCurrency(item.totalSpent) }}
                                  </template>
                                  
                                  <template v-slot:item.actions="{ item }">
                                    <v-btn small color="primary" text @click="viewRestaurantOrders(item)">
                                      <v-icon small left>mdi-history</v-icon> Đơn hàng
                                    </v-btn>
                                    <v-btn small color="info" text @click="viewRestaurantDetails(item)">
                                      <v-icon small left>mdi-store</v-icon> Chi tiết
                                    </v-btn>
                                  </template>
                                </v-data-table>
                              </v-col>
                            </v-row>
                          </v-card-text>
                        </v-card>
                      </v-tab-item>
                    </v-tabs-items>
                  </v-card>

                  <v-card outlined class="mb-4">
                    <v-card-title>
                      Hoạt động gần đây
                      <v-spacer></v-spacer>
                      <v-btn text color="primary" @click="viewAllActivity">Xem tất cả</v-btn>
                    </v-card-title>
                    <v-card-text class="px-0">
                      <v-timeline dense>
                        <v-timeline-item
                          v-for="(activity, i) in recentActivities"
                          :key="i"
                          :color="getActivityColor(activity.type)"
                          small
                        >
                          <div class="font-weight-normal">
                            <strong>{{ activity.title }}</strong>
                          </div>
                          <div class="text-caption">{{ activity.description }}</div>
                          <div class="text-caption grey--text">{{ formatDate(activity.timestamp) }}</div>
                        </v-timeline-item>
                      </v-timeline>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <v-card v-else>
            <v-card-text class="text-center">
              <v-progress-circular indeterminate color="primary" v-if="loading"></v-progress-circular>
              <div v-else>Không tìm thấy thông tin khách hàng</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Dialogs -->
      <v-dialog v-model="lockDialog" max-width="500px">
        <v-card>
          <v-card-title>{{ customer && customer.isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản' }}</v-card-title>
          <v-card-text>
            <p v-if="customer && customer.isLocked">
              Bạn có chắc chắn muốn mở khóa tài khoản này?
            </p>
            <div v-else>
              <p>Bạn có chắc chắn muốn khóa tài khoản này?</p>
              <v-textarea
                v-model="lockReason"
                label="Lý do khóa tài khoản"
                rows="3"
                hint="Thông tin này sẽ được hiển thị cho người dùng khi họ cố gắng đăng nhập"
                required
              ></v-textarea>
              <v-select
                v-model="lockDuration"
                :items="lockDurationOptions"
                label="Thời gian khóa"
                required
              ></v-select>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="error" text @click="lockDialog = false">Hủy</v-btn>
            <v-btn color="success" text @click="confirmLockAccount">Xác nhận</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="resetPasswordDialog" max-width="500px">
        <v-card>
          <v-card-title>Đặt lại mật khẩu</v-card-title>
          <v-card-text>
            <p>Bạn có chắc chắn muốn đặt lại mật khẩu cho tài khoản này?</p>
            <p>Hệ thống sẽ gửi email hướng dẫn đặt lại mật khẩu đến người dùng.</p>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="error" text @click="resetPasswordDialog = false">Hủy</v-btn>
            <v-btn color="success" text @click="confirmResetPassword">Xác nhận</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </div>
</template>

<script>
import { format } from 'date-fns';

export default {
  name: 'CustomerAccountDetails',
  
  props: {
    id: {
      type: [String, Number],
      required: true
    }
  },
  
  data() {
    return {
      loading: true,
      customer: null,
      customerNotes: '',
      activeTab: 0,
      lockDialog: false,
      resetPasswordDialog: false,
      lockReason: '',
      lockDuration: 'temporary',
      lockDurationOptions: [
        { text: 'Tạm thời (24 giờ)', value: 'temporary' },
        { text: '1 tuần', value: '1week' },
        { text: '1 tháng', value: '1month' },
        { text: 'Vĩnh viễn', value: 'permanent' }
      ],
      orderHeaders: [
        { text: 'Mã đơn hàng', value: 'id' },
        { text: 'Nhà hàng', value: 'restaurant' },
        { text: 'Ngày đặt', value: 'date' },
        { text: 'Tổng tiền', value: 'total' },
        { text: 'Trạng thái', value: 'status' },
        { text: 'Thao tác', value: 'actions', sortable: false }
      ],
      ticketHeaders: [
        { text: 'ID', value: 'id' },
        { text: 'Tiêu đề', value: 'title' },
        { text: 'Ngày tạo', value: 'createdAt' },
        { text: 'Trạng thái', value: 'status' },
        { text: 'Thao tác', value: 'actions', sortable: false }
      ],
      restaurantOrdersHeaders: [
        { text: 'Nhà hàng', value: 'restaurant' },
        { text: 'Đơn hàng cuối', value: 'lastOrder' },
        { text: 'Tổng chi tiêu', value: 'totalSpent' },
        { text: 'Thao tác', value: 'actions', sortable: false }
      ],
      customerOrders: [],
      customerTickets: [],
      customerAddresses: [],
      favoriteRestaurants: [],
      orderedRestaurants: [],
      recentActivities: []
    };
  },
  
  created() {
    this.fetchCustomerDetails();
    this.fetchCustomerOrders();
    this.fetchCustomerTickets();
    this.fetchCustomerAddresses();
    this.fetchFavoriteRestaurants();
    this.fetchOrderedRestaurants();
    this.fetchRecentActivities();
  },
  
  methods: {
    fetchCustomerDetails() {
      this.loading = true;
      // Replace with actual API call
      setTimeout(() => {
        // Mock data
        this.customer = {
          id: this.id,
          fullName: 'Nguyễn Văn A',
          email: 'nguyenvana@example.com',
          phone: '+84 987 654 321',
          dateOfBirth: new Date('1990-01-15'),
          gender: 'Nam',
          createdAt: new Date('2023-05-10'),
          status: 'active',
          verified: true,
          isLocked: false,
          membershipLevel: 'Gold',
          loyaltyPoints: 2500,
          avatar: null,
          lastLogin: new Date('2025-04-05T18:30:00'),
          lastDevice: 'iPhone 15 - iOS 18.0'
        };
        
        this.customerNotes = 'Khách hàng thân thiết, thường xuyên đặt đồ ăn vào buổi tối. Ưa thích món ăn Nhật Bản.';
        this.loading = false;
      }, 500);
    },
    
    fetchCustomerOrders() {
      // Replace with actual API call
      setTimeout(() => {
        this.customerOrders = [
          {
            id: 'ORD12345',
            restaurantName: 'Sushi Express',
            restaurantLogo: 'https://example.com/logo-sushi-express.png',
            date: new Date('2025-04-05'),
            total: 250000,
            status: 'completed'
          },
          {
            id: 'ORD12346',
            restaurantName: 'Pizza Paradise',
            restaurantLogo: 'https://example.com/logo-pizza-paradise.png',
            date: new Date('2025-04-03'),
            total: 180000,
            status: 'completed'
          },
          {
            id: 'ORD12347',
            restaurantName: 'Burger World',
            restaurantLogo: 'https://example.com/logo-burger-world.png',
            date: new Date('2025-04-01'),
            total: 320000,
            status: 'completed'
          },
          {
            id: 'ORD12348',
            restaurantName: 'Vegan Delight',
            restaurantLogo: 'https://example.com/logo-vegan-delight.png',
            date: new Date('2025-03-28'),
            total: 150000,
            status: 'cancelled'
          }
        ];
      }, 500);
    },
    
    fetchCustomerTickets() {
      // Replace with actual API call
      setTimeout(() => {
        this.customerTickets = [
          {
            id: 1,
            title: 'Không thể thanh toán đơn hàng',
            createdAt: new Date('2025-04-01'),
            status: 'closed'
          },
          {
            id: 2,
            title: 'Thiếu món trong đơn hàng',
            createdAt: new Date('2025-03-15'),
            status: 'resolved'
          }
        ];
      }, 500);
    },
    
    fetchCustomerAddresses() {
      // Replace with actual API call
      setTimeout(() => {
        this.customerAddresses = [
          {
            id: 1,
            title: 'Nhà riêng',
            isDefault: true,
            receiverName: 'Nguyễn Văn A',
            phone: '+84 987 654 321',
            detail: '123 Đường Lê Lợi',
            ward: 'Phường Bến Nghé',
            district: 'Quận 1',
            province: 'TP Hồ Chí Minh'
          },
          {
            id: 2,
            title: 'Văn phòng',
            isDefault: false,
            receiverName: 'Nguyễn Văn A',
            phone: '+84 987 654 321',
            detail: '456 Đường Nguyễn Huệ',
            ward: 'Phường Bến Nghé',
            district: 'Quận 1',
            province: 'TP Hồ Chí Minh'
          }
        ];
      }, 500);
    },
    
    fetchFavoriteRestaurants() {
      // Replace with actual API call
      setTimeout(() => {
        this.favoriteRestaurants = [
          {
            id: 1,
            name: 'Sushi Express',
            image: 'https://example.com/logo-sushi-express.png',
            rating: 4.8,
            reviewCount: 120,
            address: '123 Đường Lê Lợi, Quận 1, TP Hồ Chí Minh',
            categories: ['Sushi', 'Nhật Bản']
          },
          {
            id: 2,
            name: 'Pizza Paradise',
            image: 'https://example.com/logo-pizza-paradise.png',
            rating: 4.5,
            reviewCount: 85,
            address: '456 Đường Nguyễn Huệ, Quận 1, TP Hồ Chí Minh',
            categories: ['Pizza', 'Ý']
          }
        ];
      }, 500);
    },
    
    fetchOrderedRestaurants() {
      // Replace with actual API call
      setTimeout(() => {
        this.orderedRestaurants = [
          {
            id: 1,
            name: 'Sushi Express',
            image: 'https://example.com/logo-sushi-express.png',
            rating: 4.8,
            lastOrder: new Date('2025-04-05'),
            totalSpent: 500000
          },
          {
            id: 2,
            name: 'Pizza Paradise',
            image: 'https://example.com/logo-pizza-paradise.png',
            rating: 4.5,
            lastOrder: new Date('2025-04-03'),
            totalSpent: 360000
          }
        ];
      }, 500);
    },
    
    fetchRecentActivities() {
      // Replace with actual API call
      setTimeout(() => {
        this.recentActivities = [
          {
            id: 1,
            type: 'login',
            title: 'Đăng nhập',
            description: 'Đăng nhập từ thiết bị iPhone 15',
            timestamp: new Date('2025-04-05T18:30:00')
          },
          {
            id: 2,
            type: 'order',
            title: 'Đặt đơn hàng',
            description: 'Đặt đơn hàng ORD12345 trị giá 250.000₫',
            timestamp: new Date('2025-04-05T18:45:00')
          },
          {
            id: 3,
            type: 'review',
            title: 'Đánh giá nhà hàng',
            description: 'Đánh giá 5 sao cho nhà hàng Sushi Express',
            timestamp: new Date('2025-04-05T20:15:00')
          },
          {
            id: 4,
            type: 'profile',
            title: 'Cập nhật hồ sơ',
            description: 'Cập nhật số điện thoại liên hệ',
            timestamp: new Date('2025-04-04T16:30:00')
          }
        ];
      }, 500);
    },
    
    goBack() {
      this.$router.push({ name: 'CustomerAccounts' });
    },
    
    editAccount() {
      // Implement edit functionality
      console.log('Edit account:', this.customer.id);
      
      // Show success message
      this.$store.dispatch('ui/showSnackbar', {
        message: 'Chức năng đang được phát triển',
        color: 'info'
      });
    },
    
    toggleAccountStatus() {
      this.lockDialog = true;
    },
    
    resetPassword() {
      this.resetPasswordDialog = true;
    },
    
    viewActivity() {
      this.activeTab = 0; // Switch to details tab
      this.viewAllActivity();
    },
    
    viewAllActivity() {
      // Navigate to detailed activity view
      console.log('View all activity for user:', this.customer.id);
      
      // Show information message
      this.$store.dispatch('ui/showSnackbar', {
        message: 'Đang tải lịch sử hoạt động...',
        color: 'info'
      });
    },
    
    viewOrder(order) {
      this.$router.push({ 
        name: 'AdminOrders',
        query: { orderId: order.id }
      });
    },
    
    viewTicket(ticket) {
      this.$router.push({ 
        name: 'SupportTicketDetails', 
        params: { id: ticket.id } 
      });
    },
    
    viewRestaurant(restaurant) {
      console.log('View restaurant:', restaurant.id);
    },
    
    viewFavoriteDishes(restaurant) {
      console.log('View favorite dishes for restaurant:', restaurant.id);
    },
    
    viewRestaurantOrders(restaurant) {
      console.log('View orders for restaurant:', restaurant.id);
    },
    
    viewRestaurantDetails(restaurant) {
      console.log('View details for restaurant:', restaurant.id);
    },
    
    saveNotes() {
      // Replace with actual API call
      console.log('Saving notes for customer:', this.customer.id, this.customerNotes);
      
      this.$store.dispatch('ui/showSnackbar', {
        message: 'Đã lưu ghi chú thành công!',
        color: 'success'
      });
    },
    
    confirmLockAccount() {
      // Replace with actual API call
      if (this.customer.isLocked) {
        console.log(`Unlocking account for customer #${this.id}`);
        this.customer.isLocked = false;
        this.customer.status = 'active';
        
        this.$store.dispatch('ui/showSnackbar', {
          message: 'Đã mở khóa tài khoản thành công!',
          color: 'success'
        });
      } else {
        console.log(`Locking account for customer #${this.id}. Reason: ${this.lockReason}, Duration: ${this.lockDuration}`);
        this.customer.isLocked = true;
        this.customer.status = 'locked';
        
        this.$store.dispatch('ui/showSnackbar', {
          message: 'Đã khóa tài khoản thành công!',
          color: 'success'
        });
        
        this.lockReason = '';
      }
      
      this.lockDialog = false;
    },
    
    confirmResetPassword() {
      // Replace with actual API call
      console.log(`Sending password reset for customer #${this.id}`);
      
      this.$store.dispatch('ui/showSnackbar', {
        message: 'Đã gửi email đặt lại mật khẩu thành công!',
        color: 'success'
      });
      
      this.resetPasswordDialog = false;
    },
    
    formatDate(date) {
      if (!date) return 'N/A';
      return format(new Date(date), 'dd/MM/yyyy');
    },
    
    formatCurrency(amount) {
      return new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND',
        maximumFractionDigits: 0
      }).format(amount);
    },
    
    getAccountStatusColor(status) {
      switch (status) {
        case 'active':
          return 'success';
        case 'locked':
          return 'error';
        case 'pending':
          return 'warning';
        default:
          return 'grey';
      }
    },
    
    getOrderStatusColor(status) {
      switch (status) {
        case 'completed':
          return 'success';
        case 'processing':
          return 'info';
        case 'cancelled':
          return 'error';
        case 'pending':
          return 'warning';
        default:
          return 'grey';
      }
    },
    
    getTicketStatusColor(status) {
      switch (status) {
        case 'open':
          return 'error';
        case 'in_progress':
          return 'info';
        case 'resolved':
          return 'success';
        case 'closed':
          return 'grey';
        default:
          return 'grey';
      }
    },
    
    getActivityColor(type) {
      switch (type) {
        case 'login':
          return 'primary';
        case 'order':
          return 'success';
        case 'review':
          return 'amber';
        case 'support':
          return 'error';
        case 'profile':
          return 'info';
        default:
          return 'grey';
      }
    }
  }
};
</script>

<style scoped>
.customer-account-details {
  padding: 20px 0;
}
</style>