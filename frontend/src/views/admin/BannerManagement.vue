<template>
  <v-container fluid>
    <v-card class="mb-4">
      <v-card-title class="d-flex align-center justify-space-between">
        <h1 class="text-h5">Quản lý banner quảng cáo</h1>
        <v-btn color="primary" @click="openBannerDialog()">
          <v-icon left>mdi-plus</v-icon>
          Thêm banner mới
        </v-btn>
      </v-card-title>
      
      <v-card-text>
        <v-row>
          <v-col cols="12" sm="4">
            <v-select
              v-model="filters.position"
              :items="positionOptions"
              label="Vị trí hiển thị"
              outlined
              dense
              clearable
              @change="loadBanners"
            ></v-select>
          </v-col>
          <v-col cols="12" sm="4">
            <v-select
              v-model="filters.active"
              :items="activeOptions"
              label="Trạng thái"
              outlined
              dense
              clearable
              @change="loadBanners"
            ></v-select>
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="filters.search"
              label="Tìm kiếm banner"
              outlined
              dense
              clearable
              append-icon="mdi-magnify"
              @keyup.enter="loadBanners"
              @click:append="loadBanners"
            ></v-text-field>
          </v-col>
        </v-row>
        
        <v-data-table
          :headers="headers"
          :items="banners"
          :loading="loading"
          class="elevation-1"
        >
          <template v-slot:item.image="{ item }">
            <v-img
              :src="item.image"
              max-width="150"
              max-height="80"
              contain
              class="grey lighten-3"
            ></v-img>
          </template>
          
          <template v-slot:item.title="{ item }">
            <div class="font-weight-medium">{{ item.title }}</div>
            <div class="text-caption grey--text">{{ item.description }}</div>
          </template>
          
          <template v-slot:item.position="{ item }">
            <v-chip small>
              {{ getPositionLabel(item.position) }}
            </v-chip>
          </template>
          
          <template v-slot:item.active="{ item }">
            <v-chip
              small
              :color="item.active ? 'success' : 'grey'"
              text-color="white"
            >
              {{ item.active ? 'Hoạt động' : 'Không hoạt động' }}
            </v-chip>
          </template>
          
          <template v-slot:item.dateRange="{ item }">
            <div v-if="item.startDate || item.endDate">
              <div v-if="item.startDate">Từ: {{ formatDate(item.startDate) }}</div>
              <div v-if="item.endDate">Đến: {{ formatDate(item.endDate) }}</div>
            </div>
            <div v-else class="text-caption grey--text">Không giới hạn</div>
          </template>
          
          <template v-slot:item.actions="{ item }">
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  icon
                  small
                  color="primary"
                  v-bind="attrs"
                  v-on="on"
                  @click="openBannerDialog(item)"
                >
                  <v-icon small>mdi-pencil</v-icon>
                </v-btn>
              </template>
              <span>Chỉnh sửa</span>
            </v-tooltip>
            
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  icon
                  small
                  color="error"
                  v-bind="attrs"
                  v-on="on"
                  @click="confirmDeleteBanner(item)"
                >
                  <v-icon small>mdi-delete</v-icon>
                </v-btn>
              </template>
              <span>Xóa</span>
            </v-tooltip>
            
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  icon
                  small
                  :color="item.active ? 'warning' : 'success'"
                  v-bind="attrs"
                  v-on="on"
                  @click="toggleActiveStatus(item)"
                >
                  <v-icon small>{{ item.active ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
                </v-btn>
              </template>
              <span>{{ item.active ? 'Ẩn banner' : 'Kích hoạt' }}</span>
            </v-tooltip>
          </template>
          
          <template v-slot:no-data>
            <v-alert
              type="info"
              outlined
              dense
              class="ma-0"
            >
              Chưa có banner nào.
            </v-alert>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
    
    <!-- Banner Dialog -->
    <v-dialog v-model="bannerDialog" max-width="900px" persistent>
      <v-card>
        <v-card-title class="primary white--text">
          {{ editedIndex === -1 ? 'Thêm banner mới' : 'Chỉnh sửa banner' }}
          <v-spacer></v-spacer>
          <v-btn icon dark @click="closeBannerDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text class="pt-4">
          <v-form ref="form" v-model="valid" lazy-validation>
            <v-container>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="editedItem.title"
                    label="Tiêu đề banner"
                    required
                    :rules="[v => !!v || 'Tiêu đề là bắt buộc']"
                    outlined
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-select
                    v-model="editedItem.position"
                    :items="positionOptions"
                    label="Vị trí hiển thị"
                    required
                    :rules="[v => !!v || 'Vị trí hiển thị là bắt buộc']"
                    outlined
                  ></v-select>
                </v-col>
                
                <v-col cols="12">
                  <v-textarea
                    v-model="editedItem.description"
                    label="Mô tả"
                    outlined
                    rows="3"
                  ></v-textarea>
                </v-col>
                
                <v-col cols="12" md="12">
                  <v-text-field
                    v-model="editedItem.link"
                    label="Liên kết (URL)"
                    outlined
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12">
                  <v-file-input
                    v-model="bannerImage"
                    label="Hình ảnh banner"
                    :rules="editedIndex === -1 ? [v => !!v || 'Hình ảnh là bắt buộc'] : []"
                    outlined
                    accept="image/*"
                    prepend-icon="mdi-camera"
                    :show-size="1000"
                  ></v-file-input>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-menu
                    ref="startDateMenu"
                    v-model="startDateMenu"
                    :close-on-content-click="false"
                    transition="scale-transition"
                    offset-y
                    min-width="auto"
                  >
                    <template v-slot:activator="{ on, attrs }">
                      <v-text-field
                        v-model="formattedStartDate"
                        label="Ngày bắt đầu (tùy chọn)"
                        prepend-icon="mdi-calendar"
                        readonly
                        outlined
                        v-bind="attrs"
                        v-on="on"
                        clearable
                        @click:clear="editedItem.startDate = null"
                      ></v-text-field>
                    </template>
                    <v-date-picker
                      v-model="editedItem.startDate"
                      @input="startDateMenu = false"
                    ></v-date-picker>
                  </v-menu>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-menu
                    ref="endDateMenu"
                    v-model="endDateMenu"
                    :close-on-content-click="false"
                    transition="scale-transition"
                    offset-y
                    min-width="auto"
                  >
                    <template v-slot:activator="{ on, attrs }">
                      <v-text-field
                        v-model="formattedEndDate"
                        label="Ngày kết thúc (tùy chọn)"
                        prepend-icon="mdi-calendar"
                        readonly
                        outlined
                        v-bind="attrs"
                        v-on="on"
                        clearable
                        @click:clear="editedItem.endDate = null"
                      ></v-text-field>
                    </template>
                    <v-date-picker
                      v-model="editedItem.endDate"
                      @input="endDateMenu = false"
                    ></v-date-picker>
                  </v-menu>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="editedItem.priority"
                    label="Độ ưu tiên"
                    type="number"
                    hint="Số càng cao càng ưu tiên hiển thị"
                    outlined
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-switch
                    v-model="editedItem.active"
                    label="Kích hoạt"
                    color="primary"
                  ></v-switch>
                </v-col>
              </v-row>
            </v-container>
          </v-form>
        </v-card-text>
        
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            color="grey darken-1"
            text
            @click="closeBannerDialog"
          >
            Hủy
          </v-btn>
          <v-btn
            color="primary"
            :disabled="!valid"
            :loading="saving"
            @click="saveBanner"
          >
            Lưu
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h6">Xác nhận xóa banner?</v-card-title>
        <v-card-text>Bạn có chắc chắn muốn xóa banner "{{ editedItem.title }}"? Hành động này không thể hoàn tác.</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey darken-1" text @click="deleteDialog = false">Hủy</v-btn>
          <v-btn color="error" text :loading="deleting" @click="deleteBanner">Xóa</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { format, parseISO } from 'date-fns';
import BannerService from '@/services/banner.service';

export default {
  name: 'BannerManagement',
  
  data() {
    return {
      // Table & filters
      loading: false,
      banners: [],
      filters: {
        position: null,
        active: null,
        search: '',
      },
      headers: [
        { text: 'Hình ảnh', value: 'image', sortable: false, width: '150px' },
        { text: 'Tiêu đề/Mô tả', value: 'title', sortable: false },
        { text: 'Vị trí', value: 'position', sortable: false },
        { text: 'Trạng thái', value: 'active', sortable: false },
        { text: 'Thời gian hiển thị', value: 'dateRange', sortable: false },
        { text: 'Hành động', value: 'actions', sortable: false, align: 'center' },
      ],
      
      // Banner positions
      positionOptions: [
        { text: 'Trang chủ', value: 'home' },
        { text: 'Trang danh mục', value: 'category' },
        { text: 'Trang nhà hàng', value: 'restaurant' },
        { text: 'Thanh bên', value: 'sidebar' },
      ],
      
      // Active options
      activeOptions: [
        { text: 'Kích hoạt', value: 'true' },
        { text: 'Không kích hoạt', value: 'false' },
      ],
      
      // Dialog state
      bannerDialog: false,
      deleteDialog: false,
      valid: true,
      saving: false,
      deleting: false,
      
      // Date pickers
      startDateMenu: false,
      endDateMenu: false,
      
      // Edited item
      editedIndex: -1,
      editedItem: {
        id: null,
        title: '',
        description: '',
        image: '',
        link: '',
        position: 'home',
        active: true,
        startDate: null,
        endDate: null,
        priority: 0,
      },
      defaultItem: {
        id: null,
        title: '',
        description: '',
        image: '',
        link: '',
        position: 'home',
        active: true,
        startDate: null,
        endDate: null,
        priority: 0,
      },
      
      // File upload
      bannerImage: null,
    };
  },
  
  computed: {
    formattedStartDate() {
      return this.editedItem.startDate ? format(parseISO(this.editedItem.startDate), 'dd/MM/yyyy') : '';
    },
    
    formattedEndDate() {
      return this.editedItem.endDate ? format(parseISO(this.editedItem.endDate), 'dd/MM/yyyy') : '';
    },
  },
  
  created() {
    this.loadBanners();
  },
  
  methods: {
    async loadBanners() {
      this.loading = true;
      
      try {
        const { position, active } = this.filters;
        const params = {};
        
        if (position) params.position = position;
        if (active !== null) params.active = active;
        
        const response = await BannerService.getBanners(params);
        this.banners = response.data;
      } catch (error) {
        console.error('Error loading banners:', error);
        this.$store.dispatch('alert/setAlert', {
          type: 'error',
          message: 'Không thể tải danh sách banner. Vui lòng thử lại sau.'
        });
      } finally {
        this.loading = false;
      }
    },
    
    formatDate(dateString) {
      return dateString ? format(new Date(dateString), 'dd/MM/yyyy') : '';
    },
    
    getPositionLabel(position) {
      const found = this.positionOptions.find(opt => opt.value === position);
      return found ? found.text : position;
    },
    
    openBannerDialog(item) {
      this.editedIndex = item ? this.banners.indexOf(item) : -1;
      
      if (item) {
        this.editedItem = Object.assign({}, item);
      } else {
        this.editedItem = Object.assign({}, this.defaultItem);
      }
      
      this.bannerDialog = true;
      this.$nextTick(() => {
        this.$refs.form.resetValidation();
      });
    },
    
    closeBannerDialog() {
      this.bannerDialog = false;
      this.bannerImage = null;
      
      // Allow dialog to close before resetting data
      this.$nextTick(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
      });
    },
    
    async saveBanner() {
      if (this.$refs.form.validate()) {
        this.saving = true;
        
        try {
          const formData = new FormData();
          
          // Append banner data
          Object.keys(this.editedItem).forEach(key => {
            if (key !== 'image' && this.editedItem[key] !== null) {
              formData.append(key, this.editedItem[key]);
            }
          });
          
          // Append image if selected
          if (this.bannerImage) {
            formData.append('image', this.bannerImage);
          }
          
          if (this.editedIndex > -1) {
            // Update existing banner
            await BannerService.updateBanner(this.editedItem.id, formData);
            this.$store.dispatch('alert/setAlert', {
              type: 'success',
              message: 'Banner đã được cập nhật thành công!'
            });
          } else {
            // Create new banner
            await BannerService.createBanner(formData);
            this.$store.dispatch('alert/setAlert', {
              type: 'success',
              message: 'Banner đã được tạo thành công!'
            });
          }
          
          this.closeBannerDialog();
          this.loadBanners();
        } catch (error) {
          console.error('Error saving banner:', error);
          this.$store.dispatch('alert/setAlert', {
            type: 'error',
            message: 'Không thể lưu banner. Vui lòng thử lại sau.'
          });
        } finally {
          this.saving = false;
        }
      }
    },
    
    confirmDeleteBanner(item) {
      this.editedItem = Object.assign({}, item);
      this.deleteDialog = true;
    },
    
    async deleteBanner() {
      this.deleting = true;
      
      try {
        await BannerService.deleteBanner(this.editedItem.id);
        
        this.$store.dispatch('alert/setAlert', {
          type: 'success',
          message: 'Banner đã được xóa thành công!'
        });
        
        this.loadBanners();
      } catch (error) {
        console.error('Error deleting banner:', error);
        this.$store.dispatch('alert/setAlert', {
          type: 'error',
          message: 'Không thể xóa banner. Vui lòng thử lại sau.'
        });
      } finally {
        this.deleting = false;
        this.deleteDialog = false;
      }
    },
    
    async toggleActiveStatus(item) {
      try {
        await BannerService.updateBanner(item.id, {
          active: !item.active
        });
        
        this.$store.dispatch('alert/setAlert', {
          type: 'success',
          message: `Banner đã được ${item.active ? 'ẩn' : 'kích hoạt'} thành công!`
        });
        
        this.loadBanners();
      } catch (error) {
        console.error('Error updating active status:', error);
        this.$store.dispatch('alert/setAlert', {
          type: 'error',
          message: 'Không thể cập nhật trạng thái banner. Vui lòng thử lại sau.'
        });
      }
    }
  }
};
</script>