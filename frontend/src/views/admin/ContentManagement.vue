<template>
  <div class="content-management pa-6">
    <h1 class="text-h4 mb-6">Content Management</h1>

    <v-tabs v-model="activeTab" class="mb-6">
      <v-tab value="categories">Categories</v-tab>
      <v-tab value="banners">Promotional Banners</v-tab>
      <v-tab value="static">Static Content</v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <!-- Categories Management -->
      <v-window-item value="categories">
        <v-card>
          <v-card-title class="d-flex align-center">
            Food Categories
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              @click="showCategoryDialog('add')"
            >
              Add Category
            </v-btn>
          </v-card-title>

          <v-card-text>
            <v-data-table
              :headers="categoryHeaders"
              :items="categories"
              :loading="loading"
            >
              <!-- Category Image -->
              <template v-slot:item.image="{ item }">
                <v-avatar size="40">
                  <v-img :src="item.image" :alt="item.name"></v-img>
                </v-avatar>
              </template>

              <!-- Status -->
              <template v-slot:item.status="{ item }">
                <v-chip
                  :color="item.status === 'active' ? 'success' : 'error'"
                  size="small"
                >
                  {{ item.status }}
                </v-chip>
              </template>

              <!-- Actions -->
              <template v-slot:item.actions="{ item }">
                <v-btn
                  icon="mdi-pencil"
                  variant="text"
                  size="small"
                  color="primary"
                  @click="showCategoryDialog('edit', item)"
                ></v-btn>
                <v-btn
                  icon="mdi-delete"
                  variant="text"
                  size="small"
                  color="error"
                  @click="confirmDeleteCategory(item)"
                ></v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-window-item>

      <!-- Promotional Banners -->
      <v-window-item value="banners">
        <v-card>
          <v-card-title class="d-flex align-center">
            Promotional Banners
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              @click="showBannerDialog('add')"
            >
              Add Banner
            </v-btn>
          </v-card-title>

          <v-card-text>
            <v-row>
              <v-col
                v-for="banner in banners"
                :key="banner.id"
                cols="12"
                sm="6"
                md="4"
              >
                <v-card>
                  <v-img
                    :src="banner.image"
                    height="200"
                    cover
                  ></v-img>
                  <v-card-text>
                    <div class="d-flex align-center justify-space-between">
                      <div>
                        <div class="text-subtitle-1">{{ banner.title }}</div>
                        <div class="text-caption">{{ banner.position }}</div>
                      </div>
                      <v-switch
                        v-model="banner.active"
                        color="success"
                        hide-details
                        density="compact"
                        @change="updateBannerStatus(banner)"
                      ></v-switch>
                    </div>
                    <div class="text-caption mt-2">
                      Valid until: {{ formatDate(banner.expiryDate) }}
                    </div>
                  </v-card-text>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn
                      variant="text"
                      color="primary"
                      @click="showBannerDialog('edit', banner)"
                    >
                      Edit
                    </v-btn>
                    <v-btn
                      variant="text"
                      color="error"
                      @click="confirmDeleteBanner(banner)"
                    >
                      Delete
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-window-item>

      <!-- Static Content -->
      <v-window-item value="static">
        <v-row>
          <v-col cols="12" md="6">
            <v-card>
              <v-card-title>Pages</v-card-title>
              <v-card-text>
                <v-list lines="two">
                  <v-list-item
                    v-for="page in staticPages"
                    :key="page.id"
                    :value="page"
                  >
                    <v-list-item-title>{{ page.title }}</v-list-item-title>
                    <v-list-item-subtitle>
                      Last updated: {{ formatDate(page.updatedAt) }}
                    </v-list-item-subtitle>
                    <template v-slot:append>
                      <v-btn
                        icon="mdi-pencil"
                        variant="text"
                        color="primary"
                        @click="editStaticPage(page)"
                      ></v-btn>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card>
              <v-card-title>Site Configuration</v-card-title>
              <v-card-text>
                <v-form ref="configForm">
                  <v-text-field
                    v-model="siteConfig.name"
                    label="Site Name"
                    variant="outlined"
                    density="comfortable"
                  ></v-text-field>

                  <v-textarea
                    v-model="siteConfig.description"
                    label="Site Description"
                    variant="outlined"
                    rows="3"
                  ></v-textarea>

                  <v-text-field
                    v-model="siteConfig.contactEmail"
                    label="Contact Email"
                    variant="outlined"
                    density="comfortable"
                  ></v-text-field>

                  <v-text-field
                    v-model="siteConfig.supportPhone"
                    label="Support Phone"
                    variant="outlined"
                    density="comfortable"
                  ></v-text-field>

                  <v-btn
                    color="primary"
                    block
                    :loading="savingConfig"
                    @click="saveConfig"
                  >
                    Save Configuration
                  </v-btn>
                </v-form>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>
    </v-window>

    <!-- Category Dialog -->
    <v-dialog v-model="categoryDialog.show" max-width="500">
      <v-card>
        <v-card-title>
          {{ categoryDialog.mode === 'add' ? 'Add Category' : 'Edit Category' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="categoryForm">
            <v-text-field
              v-model="categoryDialog.data.name"
              label="Category Name"
              :rules="[v => !!v || 'Name is required']"
              variant="outlined"
            ></v-text-field>

            <v-file-input
              v-model="categoryDialog.data.imageFile"
              label="Category Image"
              accept="image/*"
              variant="outlined"
              :rules="categoryDialog.mode === 'add' ? [v => !!v || 'Image is required'] : []"
            ></v-file-input>

            <v-textarea
              v-model="categoryDialog.data.description"
              label="Description"
              variant="outlined"
              rows="3"
            ></v-textarea>

            <v-switch
              v-model="categoryDialog.data.status"
              :label="categoryDialog.data.status === 'active' ? 'Active' : 'Inactive'"
              color="success"
              true-value="active"
              false-value="inactive"
            ></v-switch>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="categoryDialog.show = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :loading="categoryDialog.loading"
            @click="saveCategory"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Banner Dialog -->
    <v-dialog v-model="bannerDialog.show" max-width="600">
      <v-card>
        <v-card-title>
          {{ bannerDialog.mode === 'add' ? 'Add Banner' : 'Edit Banner' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="bannerForm">
            <v-text-field
              v-model="bannerDialog.data.title"
              label="Banner Title"
              :rules="[v => !!v || 'Title is required']"
              variant="outlined"
            ></v-text-field>

            <v-file-input
              v-model="bannerDialog.data.imageFile"
              label="Banner Image"
              accept="image/*"
              variant="outlined"
              :rules="bannerDialog.mode === 'add' ? [v => !!v || 'Image is required'] : []"
            ></v-file-input>

            <v-select
              v-model="bannerDialog.data.position"
              label="Position"
              :items="['home_top', 'home_middle', 'sidebar']"
              variant="outlined"
            ></v-select>

            <v-text-field
              v-model="bannerDialog.data.link"
              label="Link URL"
              variant="outlined"
            ></v-text-field>

            <v-text-field
              v-model="bannerDialog.data.expiryDate"
              label="Expiry Date"
              type="date"
              variant="outlined"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="bannerDialog.show = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :loading="bannerDialog.loading"
            @click="saveBanner"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Page Editor Dialog -->
    <v-dialog v-model="pageDialog.show" fullscreen hide-overlay>
      <v-card>
        <v-toolbar dark color="primary">
          <v-btn icon dark @click="pageDialog.show = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title>Edit Page: {{ pageDialog.data.title }}</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn
            color="white"
            variant="text"
            :loading="pageDialog.loading"
            @click="savePage"
          >
            Save
          </v-btn>
        </v-toolbar>

        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="pageDialog.data.title"
                  label="Page Title"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="pageDialog.data.slug"
                  label="URL Slug"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <div class="text-subtitle-1 mb-2">Content</div>
                <v-textarea
                  v-model="pageDialog.data.content"
                  variant="outlined"
                  rows="20"
                  hint="Supports Markdown formatting"
                  persistent-hint
                ></v-textarea>
              </v-col>
              <v-col cols="12">
                <v-switch
                  v-model="pageDialog.data.published"
                  label="Published"
                  color="success"
                ></v-switch>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog.show" max-width="400">
      <v-card>
        <v-card-title class="text-h5">
          Confirm Delete
        </v-card-title>
        <v-card-text>
          Are you sure you want to delete this {{ deleteDialog.type }}?
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="deleteDialog.show = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            :loading="deleteDialog.loading"
            @click="confirmDelete"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import { format } from 'date-fns'

export default {
  name: 'ContentManagement',

  setup() {
    const store = useStore()
    const activeTab = ref('categories')
    const loading = ref(false)
    const savingConfig = ref(false)

    // Categories
    const categories = ref([])
    const categoryHeaders = [
      { title: 'Image', key: 'image', sortable: false },
      { title: 'Name', key: 'name', sortable: true },
      { title: 'Description', key: 'description', sortable: false },
      { title: 'Status', key: 'status', sortable: true },
      { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
    ]

    // Banners
    const banners = ref([])

    // Static Pages
    const staticPages = ref([])
    const siteConfig = ref({
      name: '',
      description: '',
      contactEmail: '',
      supportPhone: ''
    })

    // Dialog states
    const categoryDialog = ref({
      show: false,
      mode: 'add',
      loading: false,
      data: {
        name: '',
        description: '',
        imageFile: null,
        status: 'active'
      }
    })

    const bannerDialog = ref({
      show: false,
      mode: 'add',
      loading: false,
      data: {
        title: '',
        imageFile: null,
        position: 'home_top',
        link: '',
        expiryDate: ''
      }
    })

    const pageDialog = ref({
      show: false,
      loading: false,
      data: {
        title: '',
        slug: '',
        content: '',
        published: true
      }
    })

    const deleteDialog = ref({
      show: false,
      type: '',
      loading: false,
      item: null,
      callback: null
    })

    // Methods
    const loadData = async () => {
      loading.value = true
      try {
        const [categoriesData, bannersData, pagesData, configData] = await Promise.all([
          store.dispatch('admin/fetchCategories'),
          store.dispatch('admin/fetchBanners'),
          store.dispatch('admin/fetchStaticPages'),
          store.dispatch('admin/fetchSiteConfig')
        ])

        categories.value = categoriesData
        banners.value = bannersData
        staticPages.value = pagesData
        siteConfig.value = configData
      } catch (error) {
        console.error('Error loading content:', error)
      } finally {
        loading.value = false
      }
    }

    const showCategoryDialog = (mode, category = null) => {
      categoryDialog.value.mode = mode
      categoryDialog.value.data = mode === 'add' ? {
        name: '',
        description: '',
        imageFile: null,
        status: 'active'
      } : {
        ...category,
        imageFile: null
      }
      categoryDialog.value.show = true
    }

    const showBannerDialog = (mode, banner = null) => {
      bannerDialog.value.mode = mode
      bannerDialog.value.data = mode === 'add' ? {
        title: '',
        imageFile: null,
        position: 'home_top',
        link: '',
        expiryDate: ''
      } : {
        ...banner,
        imageFile: null
      }
      bannerDialog.value.show = true
    }

    const saveCategory = async () => {
      try {
        categoryDialog.value.loading = true
        const formData = new FormData()
        Object.entries(categoryDialog.value.data).forEach(([key, value]) => {
          formData.append(key, value)
        })

        if (categoryDialog.value.mode === 'add') {
          await store.dispatch('admin/addCategory', formData)
        } else {
          await store.dispatch('admin/updateCategory', formData)
        }

        categoryDialog.value.show = false
        loadData()
      } catch (error) {
        console.error('Error saving category:', error)
      } finally {
        categoryDialog.value.loading = false
      }
    }

    const saveBanner = async () => {
      try {
        bannerDialog.value.loading = true
        const formData = new FormData()
        Object.entries(bannerDialog.value.data).forEach(([key, value]) => {
          formData.append(key, value)
        })

        if (bannerDialog.value.mode === 'add') {
          await store.dispatch('admin/addBanner', formData)
        } else {
          await store.dispatch('admin/updateBanner', formData)
        }

        bannerDialog.value.show = false
        loadData()
      } catch (error) {
        console.error('Error saving banner:', error)
      } finally {
        bannerDialog.value.loading = false
      }
    }

    const updateBannerStatus = async (banner) => {
      try {
        await store.dispatch('admin/updateBanner', {
          id: banner.id,
          active: banner.active
        })
      } catch (error) {
        console.error('Error updating banner status:', error)
        banner.active = !banner.active // Revert on error
      }
    }

    const editStaticPage = (page) => {
      pageDialog.value.data = { ...page }
      pageDialog.value.show = true
    }

    const savePage = async () => {
      try {
        pageDialog.value.loading = true
        await store.dispatch('admin/updateStaticPage', pageDialog.value.data)
        pageDialog.value.show = false
        loadData()
      } catch (error) {
        console.error('Error saving page:', error)
      } finally {
        pageDialog.value.loading = false
      }
    }

    const saveConfig = async () => {
      try {
        savingConfig.value = true
        await store.dispatch('admin/updateSiteConfig', siteConfig.value)
      } catch (error) {
        console.error('Error saving configuration:', error)
      } finally {
        savingConfig.value = false
      }
    }

    const confirmDeleteCategory = (category) => {
      deleteDialog.value = {
        show: true,
        type: 'category',
        loading: false,
        item: category,
        callback: async () => {
          await store.dispatch('admin/deleteCategory', category.id)
          loadData()
        }
      }
    }

    const confirmDeleteBanner = (banner) => {
      deleteDialog.value = {
        show: true,
        type: 'banner',
        loading: false,
        item: banner,
        callback: async () => {
          await store.dispatch('admin/deleteBanner', banner.id)
          loadData()
        }
      }
    }

    const confirmDelete = async () => {
      try {
        deleteDialog.value.loading = true
        await deleteDialog.value.callback()
        deleteDialog.value.show = false
      } catch (error) {
        console.error('Error deleting item:', error)
      } finally {
        deleteDialog.value.loading = false
      }
    }

    const formatDate = (date) => {
      return format(new Date(date), 'MMM dd, yyyy')
    }

    // Load initial data
    onMounted(() => {
      loadData()
    })

    return {
      activeTab,
      loading,
      savingConfig,
      categories,
      categoryHeaders,
      banners,
      staticPages,
      siteConfig,
      categoryDialog,
      bannerDialog,
      pageDialog,
      deleteDialog,
      showCategoryDialog,
      showBannerDialog,
      saveCategory,
      saveBanner,
      updateBannerStatus,
      editStaticPage,
      savePage,
      saveConfig,
      confirmDeleteCategory,
      confirmDeleteBanner,
      confirmDelete,
      formatDate
    }
  }
}
</script>

<style scoped>
.content-management {
  max-width: 1400px;
  margin: 0 auto;
}
</style>