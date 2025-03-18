<template>
  <div class="content-management">
    <h2 class="text-h4 mb-6">Content Management</h2>

    <!-- Content Selection and Actions -->
    <v-row>
      <v-col cols="12" md="3">
        <v-card class="mb-4">
          <v-card-title>Content Types</v-card-title>
          <v-divider></v-divider>
          <v-list nav>
            <v-list-item
              v-for="type in contentTypes"
              :key="type.value"
              :value="type.value"
              :active="selectedContentType === type.value"
              @click="selectedContentType = type.value"
            >
              <template v-slot:prepend>
                <v-icon :icon="type.icon"></v-icon>
              </template>
              <v-list-item-title>{{ type.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
        
        <v-card>
          <v-card-title>Actions</v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-btn 
              color="success" 
              variant="elevated" 
              block 
              class="mb-3"
              @click="createNewContent"
            >
              <v-icon start>mdi-plus</v-icon>
              Create New
            </v-btn>
            
            <v-btn 
              color="primary" 
              variant="elevated" 
              block
              class="mb-3"
              :disabled="!selectedContent"
              @click="publishContent"
            >
              <v-icon start>mdi-publish</v-icon>
              Publish
            </v-btn>
            
            <v-btn 
              color="error" 
              variant="outlined" 
              block
              :disabled="!selectedContent"
              @click="confirmDelete"
            >
              <v-icon start>mdi-delete</v-icon>
              Delete
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
      
      <!-- Content List and Editor -->
      <v-col cols="12" md="9">
        <v-card class="mb-4">
          <v-card-title class="d-flex align-center">
            <span>{{ getSelectedTypeTitle }}</span>
            <v-spacer></v-spacer>
            <v-text-field
              v-model="search"
              variant="outlined"
              hide-details
              density="compact"
              placeholder="Search"
              prepend-inner-icon="mdi-magnify"
              class="max-width-200"
            ></v-text-field>
          </v-card-title>

          <v-data-table
            :headers="headers"
            :items="filteredContent"
            :loading="loading"
            :items-per-page="10"
            class="elevation-1"
          >
            <template v-slot:item.status="{ item }">
              <v-chip
                :color="item.status === 'published' ? 'success' : 'warning'"
                size="small"
                class="text-capitalize"
              >
                {{ item.status }}
              </v-chip>
            </template>

            <template v-slot:item.lastUpdated="{ item }">
              {{ formatDate(item.lastUpdated) }}
            </template>

            <template v-slot:item.actions="{ item }">
              <v-btn
                icon
                variant="text"
                size="small"
                color="primary"
                @click="editContent(item)"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn
                icon
                variant="text"
                size="small"
                color="info"
                @click="previewContent(item)"
              >
                <v-icon>mdi-eye</v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </v-card>

        <!-- Content Editor -->
        <v-card v-if="editingContent">
          <v-toolbar color="primary" :theme="isDark ? 'dark' : undefined">
            <v-toolbar-title>{{ isNewContent ? 'Create New' : 'Edit' }} {{ getSelectedTypeTitle }}</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn icon @click="closeEditor">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-toolbar>

          <v-card-text class="pa-4">
            <v-form ref="contentForm">
              <v-text-field
                v-model="editingContent.title"
                label="Title"
                variant="outlined"
                :rules="[v => !!v || 'Title is required']"
                class="mb-4"
              ></v-text-field>

              <v-text-field
                v-if="selectedContentType === 'page'"
                v-model="editingContent.slug"
                label="Slug"
                variant="outlined"
                hint="URL-friendly name (e.g., 'about-us')"
                persistent-hint
                class="mb-4"
              ></v-text-field>

              <!-- Rich Text Editor -->
              <div class="mb-4">
                <label class="text-subtitle-1 mb-2 d-block">Content</label>
                <v-textarea
                  v-model="editingContent.content"
                  variant="outlined"
                  rows="15"
                  :rules="[v => !!v || 'Content is required']"
                  placeholder="Enter content here..."
                ></v-textarea>
                <div class="text-caption text-grey">
                  Note: In a production environment, this would be replaced with a rich text editor like TinyMCE or CKEditor.
                </div>
              </div>

              <v-row>
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="editingContent.status"
                    label="Status"
                    :items="['draft', 'published']"
                    variant="outlined"
                    class="mb-4"
                  ></v-select>
                </v-col>
                
                <v-col cols="12" sm="6" v-if="selectedContentType === 'announcement'">
                  <v-checkbox
                    v-model="editingContent.isPinned"
                    label="Pin announcement"
                  ></v-checkbox>
                </v-col>
              </v-row>

              <!-- SEO Settings for Pages -->
              <v-expansion-panels v-if="selectedContentType === 'page'" variant="accordion">
                <v-expansion-panel title="SEO Settings">
                  <v-expansion-panel-text>
                    <v-text-field
                      v-model="editingContent.metaTitle"
                      label="Meta Title"
                      variant="outlined"
                      class="mb-4"
                    ></v-text-field>
                    
                    <v-textarea
                      v-model="editingContent.metaDescription"
                      label="Meta Description"
                      variant="outlined"
                      rows="3"
                      class="mb-4"
                      hint="Recommended length: 150-160 characters"
                      persistent-hint
                    ></v-textarea>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-form>
          </v-card-text>

          <v-card-actions class="pa-4">
            <v-spacer></v-spacer>
            <v-btn variant="outlined" class="mr-2" @click="closeEditor">
              Cancel
            </v-btn>
            <v-btn color="primary" @click="saveContent">
              Save
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Preview Dialog -->
    <v-dialog v-model="previewDialog" max-width="800">
      <v-card>
        <v-card-title>
          Preview: {{ previewingContent?.title }}
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pa-4">
          <div v-html="previewingContent?.content"></div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="text"
            @click="previewDialog = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Content</v-card-title>
        <v-card-text>
          Are you sure you want to delete "{{ selectedContent?.title }}"? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="deleteDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="elevated"
            @click="deleteContent"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useToast } from 'vue-toastification';

export default {
  name: 'ContentManagement',
  
  setup() {
    const toast = useToast();
    const loading = ref(false);
    const search = ref('');
    const editingContent = ref(null);
    const selectedContent = ref(null);
    const previewDialog = ref(false);
    const previewingContent = ref(null);
    const deleteDialog = ref(false);
    const isNewContent = ref(false);
    const selectedContentType = ref('page');
    const contentForm = ref(null);

    const contentTypes = [
      { title: 'Pages', value: 'page', icon: 'mdi-file-document-outline' },
      { title: 'Legal Documents', value: 'legal', icon: 'mdi-gavel' },
      { title: 'FAQs', value: 'faq', icon: 'mdi-help-circle' },
      { title: 'Announcements', value: 'announcement', icon: 'mdi-bullhorn' }
    ];

    const headers = [
      { title: 'Title', key: 'title', sortable: true },
      { title: 'Status', key: 'status', sortable: true, width: '120px' },
      { title: 'Last Updated', key: 'lastUpdated', sortable: true, width: '150px' },
      { title: 'Actions', key: 'actions', sortable: false, align: 'end', width: '100px' }
    ];

    const staticPages = ref([]);

    // Fetch all static pages
    const fetchPages = async () => {
      try {
        loading.value = true;
        const response = await axios.get('/api/pages');
        staticPages.value = response.data.data.pages;
      } catch (error) {
        toast.error('Failed to fetch pages');
        console.error('Error fetching pages:', error);
      } finally {
        loading.value = false;
      }
    };

    // Create new content
    const createNewContent = () => {
      isNewContent.value = true;
      editingContent.value = {
        title: '',
        slug: '',
        content: '',
        status: 'draft',
        metaTitle: '',
        metaDescription: '',
        isPinned: false
      };
    };

    // Edit content
    const editContent = (item) => {
      isNewContent.value = false;
      editingContent.value = { ...item };
    };

    // Preview content
    const previewContent = (item) => {
      previewingContent.value = item;
      previewDialog.value = true;
    };

    // Save content
    const saveContent = async () => {
      if (!contentForm.value) return;
      
      const isValid = await contentForm.value.validate();
      if (!isValid.valid) return;

      try {
        loading.value = true;
        const data = { ...editingContent.value };
        
        if (isNewContent.value) {
          await axios.post('/api/pages', data);
          toast.success('Content created successfully');
        } else {
          await axios.put(`/api/pages/${editingContent.value.id}`, data);
          toast.success('Content updated successfully');
        }
        
        await fetchPages();
        closeEditor();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to save content');
      } finally {
        loading.value = false;
      }
    };

    // Delete content
    const deleteContent = async () => {
      if (!selectedContent.value) return;

      try {
        loading.value = true;
        await axios.delete(`/api/pages/${selectedContent.value.id}`);
        toast.success('Content deleted successfully');
        await fetchPages();
        deleteDialog.value = false;
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete content');
      } finally {
        loading.value = false;
      }
    };

    // Publish content
    const publishContent = async () => {
      if (!selectedContent.value) return;

      try {
        loading.value = true;
        await axios.put(`/api/pages/${selectedContent.value.id}`, {
          ...selectedContent.value,
          published: true
        });
        toast.success('Content published successfully');
        await fetchPages();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to publish content');
      } finally {
        loading.value = false;
      }
    };

    const closeEditor = () => {
      editingContent.value = null;
      isNewContent.value = false;
    };

    const confirmDelete = () => {
      deleteDialog.value = true;
    };

    // Format date for display
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };

    // Filter content based on search term and type
    const filteredContent = computed(() => {
      let contents = staticPages.value;
      if (search.value) {
        const searchLower = search.value.toLowerCase();
        contents = contents.filter(item => 
          item.title.toLowerCase().includes(searchLower) ||
          (item.slug && item.slug.toLowerCase().includes(searchLower))
        );
      }
      return contents;
    });

    // Load initial data
    onMounted(() => {
      fetchPages();
    });

    return {
      loading,
      search,
      selectedContentType,
      selectedContent,
      editingContent,
      isNewContent,
      previewDialog,
      previewingContent,
      deleteDialog,
      contentForm,
      contentTypes,
      headers,
      createNewContent,
      editContent,
      previewContent,
      saveContent,
      deleteContent,
      publishContent,
      closeEditor,
      confirmDelete,
      formatDate,
      filteredContent
    };
  }
};
</script>

<style scoped>
.max-width-200 {
  max-width: 200px;
}

/* Proper spacing for rich text preview */
:deep(.v-card-text p) {
  margin-bottom: 1rem;
}

:deep(.v-card-text h1),
:deep(.v-card-text h2),
:deep(.v-card-text h3) {
  margin-top: 1.5rem;
  margin-bottom: 1rem;
}
</style>