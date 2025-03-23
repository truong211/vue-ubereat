<template>
  <v-container fluid>
    <v-card class="mb-4">
      <v-card-title class="d-flex align-center justify-space-between">
        <h1 class="text-h5">Quản lý bài viết</h1>
        <v-btn color="primary" @click="openArticleDialog()">
          <v-icon left>mdi-plus</v-icon>
          Thêm bài viết mới
        </v-btn>
      </v-card-title>
      
      <v-card-text>
        <v-row>
          <v-col cols="12" sm="3">
            <v-select
              v-model="filters.type"
              :items="articleTypes"
              label="Loại bài viết"
              outlined
              dense
              clearable
              @change="loadArticles"
            ></v-select>
          </v-col>
          <v-col cols="12" sm="3">
            <v-select
              v-model="filters.published"
              :items="publishedOptions"
              label="Trạng thái"
              outlined
              dense
              clearable
              @change="loadArticles"
            ></v-select>
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="filters.search"
              label="Tìm kiếm bài viết"
              outlined
              dense
              clearable
              append-icon="mdi-magnify"
              @keyup.enter="loadArticles"
              @click:append="loadArticles"
            ></v-text-field>
          </v-col>
        </v-row>
        
        <v-data-table
          :headers="headers"
          :items="articles"
          :loading="loading"
          :server-items-length="totalArticles"
          :footer-props="{
            'items-per-page-options': [10, 20, 50],
          }"
          :items-per-page="filters.limit"
          @update:page="page => updatePagination('page', page)"
          @update:items-per-page="limit => updatePagination('limit', limit)"
          class="elevation-1"
        >
          <template v-slot:item.title="{ item }">
            <div class="font-weight-medium">{{ item.title }}</div>
            <div class="text-caption grey--text">{{ formatDate(item.createdAt) }}</div>
          </template>
          
          <template v-slot:item.type="{ item }">
            <v-chip
              small
              :color="getTypeColor(item.type)"
              text-color="white"
            >
              {{ getTypeLabel(item.type) }}
            </v-chip>
          </template>
          
          <template v-slot:item.published="{ item }">
            <v-chip
              small
              :color="item.published ? 'success' : 'grey'"
              text-color="white"
            >
              {{ item.published ? 'Đã xuất bản' : 'Bản nháp' }}
            </v-chip>
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
                  @click="openArticleDialog(item)"
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
                  @click="confirmDeleteArticle(item)"
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
                  :color="item.published ? 'warning' : 'success'"
                  v-bind="attrs"
                  v-on="on"
                  @click="togglePublishStatus(item)"
                >
                  <v-icon small>{{ item.published ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
                </v-btn>
              </template>
              <span>{{ item.published ? 'Ẩn bài viết' : 'Xuất bản' }}</span>
            </v-tooltip>
          </template>
          
          <template v-slot:no-data>
            <v-alert
              type="info"
              outlined
              dense
              class="ma-0"
            >
              Chưa có bài viết nào.
            </v-alert>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
    
    <!-- Article Dialog -->
    <v-dialog v-model="articleDialog" max-width="900px" persistent>
      <v-card>
        <v-card-title class="primary white--text">
          {{ editedIndex === -1 ? 'Thêm bài viết mới' : 'Chỉnh sửa bài viết' }}
          <v-spacer></v-spacer>
          <v-btn icon dark @click="closeArticleDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text class="pt-4">
          <v-form ref="form" v-model="valid" lazy-validation>
            <v-container>
              <v-row>
                <v-col cols="12" md="8">
                  <v-text-field
                    v-model="editedItem.title"
                    label="Tiêu đề bài viết"
                    required
                    :rules="[v => !!v || 'Tiêu đề là bắt buộc']"
                    outlined
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="4">
                  <v-select
                    v-model="editedItem.type"
                    :items="articleTypes"
                    label="Loại bài viết"
                    required
                    :rules="[v => !!v || 'Loại bài viết là bắt buộc']"
                    outlined
                  ></v-select>
                </v-col>
                
                <v-col cols="12">
                  <v-textarea
                    v-model="editedItem.content"
                    label="Nội dung"
                    required
                    :rules="[v => !!v || 'Nội dung là bắt buộc']"
                    outlined
                    rows="10"
                  ></v-textarea>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="editedItem.category"
                    label="Danh mục (tùy chọn)"
                    outlined
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-file-input
                    v-model="articleImage"
                    label="Hình ảnh bài viết"
                    outlined
                    accept="image/*"
                    prepend-icon="mdi-camera"
                    :show-size="1000"
                  ></v-file-input>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="editedItem.metaTitle"
                    label="Meta title (SEO)"
                    outlined
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="editedItem.metaDescription"
                    label="Meta description (SEO)"
                    outlined
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12">
                  <v-switch
                    v-model="editedItem.published"
                    label="Xuất bản ngay"
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
            @click="closeArticleDialog"
          >
            Hủy
          </v-btn>
          <v-btn
            color="primary"
            :disabled="!valid"
            :loading="saving"
            @click="saveArticle"
          >
            Lưu
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h6">Xác nhận xóa bài viết?</v-card-title>
        <v-card-text>Bạn có chắc chắn muốn xóa bài viết "{{ editedItem.title }}"? Hành động này không thể hoàn tác.</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey darken-1" text @click="deleteDialog = false">Hủy</v-btn>
          <v-btn color="error" text :loading="deleting" @click="deleteArticle">Xóa</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { format } from 'date-fns';
import ArticleService from '@/services/article.service';

export default {
  name: 'ArticleManagement',
  
  data() {
    return {
      // Table & filters
      loading: false,
      articles: [],
      totalArticles: 0,
      filters: {
        page: 1,
        limit: 10,
        type: null,
        published: null,
        search: '',
      },
      headers: [
        { text: 'Tiêu đề', value: 'title', sortable: false },
        { text: 'Loại', value: 'type', sortable: false },
        { text: 'Trạng thái', value: 'published', sortable: false },
        { text: 'Hành động', value: 'actions', sortable: false, align: 'center' },
      ],
      
      // Article types
      articleTypes: [
        { text: 'Tin tức', value: 'news' },
        { text: 'Câu hỏi thường gặp', value: 'faq' },
        { text: 'Hướng dẫn', value: 'guide' },
      ],
      
      // Published options
      publishedOptions: [
        { text: 'Đã xuất bản', value: 'true' },
        { text: 'Bản nháp', value: 'false' },
      ],
      
      // Dialog state
      articleDialog: false,
      deleteDialog: false,
      valid: true,
      saving: false,
      deleting: false,
      
      // Edited item
      editedIndex: -1,
      editedItem: {
        id: null,
        title: '',
        slug: '',
        content: '',
        type: 'news',
        category: '',
        image: '',
        published: false,
        metaTitle: '',
        metaDescription: '',
      },
      defaultItem: {
        id: null,
        title: '',
        slug: '',
        content: '',
        type: 'news',
        category: '',
        image: '',
        published: false,
        metaTitle: '',
        metaDescription: '',
      },
      
      // File upload
      articleImage: null,
    };
  },
  
  created() {
    this.loadArticles();
  },
  
  methods: {
    async loadArticles() {
      this.loading = true;
      
      try {
        const { page, limit, type, published, search } = this.filters;
        const params = { page, limit };
        
        if (type) params.type = type;
        if (published !== null) params.published = published;
        if (search) params.search = search;
        
        const response = await ArticleService.getArticles(params);
        
        this.articles = response.data.articles;
        this.totalArticles = response.data.total;
      } catch (error) {
        console.error('Error loading articles:', error);
        this.$store.dispatch('alert/setAlert', {
          type: 'error',
          message: 'Không thể tải danh sách bài viết. Vui lòng thử lại sau.'
        });
      } finally {
        this.loading = false;
      }
    },
    
    updatePagination(prop, value) {
      this.filters[prop] = value;
      this.loadArticles();
    },
    
    formatDate(dateString) {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    },
    
    getTypeColor(type) {
      switch (type) {
        case 'news': return 'primary';
        case 'faq': return 'orange';
        case 'guide': return 'green';
        default: return 'grey';
      }
    },
    
    getTypeLabel(type) {
      switch (type) {
        case 'news': return 'Tin tức';
        case 'faq': return 'FAQ';
        case 'guide': return 'Hướng dẫn';
        default: return type;
      }
    },
    
    openArticleDialog(item) {
      this.editedIndex = item ? this.articles.indexOf(item) : -1;
      
      if (item) {
        this.editedItem = Object.assign({}, item);
      } else {
        this.editedItem = Object.assign({}, this.defaultItem);
      }
      
      this.articleDialog = true;
      this.$nextTick(() => {
        this.$refs.form.resetValidation();
      });
    },
    
    closeArticleDialog() {
      this.articleDialog = false;
      this.articleImage = null;
      
      // Allow dialog to close before resetting data
      this.$nextTick(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
      });
    },
    
    async saveArticle() {
      if (this.$refs.form.validate()) {
        this.saving = true;
        
        try {
          const formData = new FormData();
          
          // Append article data
          Object.keys(this.editedItem).forEach(key => {
            if (key !== 'image') {
              formData.append(key, this.editedItem[key]);
            }
          });
          
          // Append image if selected
          if (this.articleImage) {
            formData.append('image', this.articleImage);
          }
          
          if (this.editedIndex > -1) {
            // Update existing article
            await ArticleService.updateArticle(this.editedItem.id, formData);
            this.$store.dispatch('alert/setAlert', {
              type: 'success',
              message: 'Bài viết đã được cập nhật thành công!'
            });
          } else {
            // Create new article
            await ArticleService.createArticle(formData);
            this.$store.dispatch('alert/setAlert', {
              type: 'success',
              message: 'Bài viết đã được tạo thành công!'
            });
          }
          
          this.closeArticleDialog();
          this.loadArticles();
        } catch (error) {
          console.error('Error saving article:', error);
          this.$store.dispatch('alert/setAlert', {
            type: 'error',
            message: 'Không thể lưu bài viết. Vui lòng thử lại sau.'
          });
        } finally {
          this.saving = false;
        }
      }
    },
    
    confirmDeleteArticle(item) {
      this.editedItem = Object.assign({}, item);
      this.deleteDialog = true;
    },
    
    async deleteArticle() {
      this.deleting = true;
      
      try {
        await ArticleService.deleteArticle(this.editedItem.id);
        
        this.$store.dispatch('alert/setAlert', {
          type: 'success',
          message: 'Bài viết đã được xóa thành công!'
        });
        
        this.loadArticles();
      } catch (error) {
        console.error('Error deleting article:', error);
        this.$store.dispatch('alert/setAlert', {
          type: 'error',
          message: 'Không thể xóa bài viết. Vui lòng thử lại sau.'
        });
      } finally {
        this.deleting = false;
        this.deleteDialog = false;
      }
    },
    
    async togglePublishStatus(item) {
      try {
        await ArticleService.updateArticle(item.id, {
          published: !item.published,
          publishedAt: !item.published ? new Date() : null
        });
        
        this.$store.dispatch('alert/setAlert', {
          type: 'success',
          message: `Bài viết đã được ${item.published ? 'ẩn' : 'xuất bản'} thành công!`
        });
        
        this.loadArticles();
      } catch (error) {
        console.error('Error updating publish status:', error);
        this.$store.dispatch('alert/setAlert', {
          type: 'error',
          message: 'Không thể cập nhật trạng thái xuất bản. Vui lòng thử lại sau.'
        });
      }
    }
  }
};
</script>