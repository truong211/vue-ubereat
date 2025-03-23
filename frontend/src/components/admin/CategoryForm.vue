<!-- CategoryForm.vue -->
<template>
  <v-form ref="form" v-model="valid" @submit.prevent="handleSubmit">
    <v-card>
      <v-card-title>
        {{ editMode ? 'Edit Category' : 'Create New Category' }}
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12">
            <v-text-field
              v-model="formData.name"
              :rules="nameRules"
              label="Category Name"
              required
            ></v-text-field>
          </v-col>

          <v-col cols="12">
            <v-textarea
              v-model="formData.description"
              label="Description"
              :rules="descriptionRules"
              rows="3"
            ></v-textarea>
          </v-col>

          <v-col cols="12">
            <v-file-input
              v-model="formData.image"
              :rules="imageRules"
              accept="image/*"
              label="Category Image"
              prepend-icon="mdi-camera"
              show-size
              @change="handleImageChange"
            >
              <template v-slot:selection="{ text }">
                <v-chip
                  class="ma-2"
                  color="primary"
                  label
                  text-color="white"
                >
                  {{ text }}
                </v-chip>
              </template>
            </v-file-input>
          </v-col>

          <v-col cols="12" v-if="previewUrl || currentImage">
            <v-img
              :src="previewUrl || currentImage"
              max-width="200"
              contain
              class="mx-auto"
            ></v-img>
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="formData.displayOrder"
              type="number"
              label="Display Order"
              hint="Lower numbers appear first"
              min="0"
            ></v-text-field>
          </v-col>

          <v-col cols="12" md="6">
            <v-switch
              v-model="formData.isActive"
              label="Active"
              color="success"
            ></v-switch>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="error"
          text
          @click="$emit('cancel')"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          :loading="loading"
          :disabled="!valid || loading"
          type="submit"
        >
          {{ editMode ? 'Update' : 'Create' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-form>
</template>

<script>
export default {
  name: 'CategoryForm',
  props: {
    editMode: {
      type: Boolean,
      default: false
    },
    category: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      valid: false,
      loading: false,
      previewUrl: null,
      formData: {
        name: '',
        description: '',
        image: null,
        displayOrder: 0,
        isActive: true
      },
      nameRules: [
        v => !!v || 'Name is required',
        v => (v && v.length >= 2) || 'Name must be at least 2 characters',
        v => (v && v.length <= 50) || 'Name must be less than 50 characters'
      ],
      descriptionRules: [
        v => !v || v.length <= 500 || 'Description must be less than 500 characters'
      ],
      imageRules: [
        v => !v || v.size < 2000000 || 'Image size should be less than 2 MB!'
      ]
    }
  },
  computed: {
    currentImage() {
      return this.category.image
    }
  },
  watch: {
    category: {
      handler(newVal) {
        if (newVal) {
          this.formData = {
            name: newVal.name || '',
            description: newVal.description || '',
            image: null,
            displayOrder: newVal.displayOrder || 0,
            isActive: typeof newVal.isActive === 'boolean' ? newVal.isActive : true
          }
        }
      },
      immediate: true
    }
  },
  methods: {
    handleImageChange(file) {
      if (file) {
        this.previewUrl = URL.createObjectURL(file)
      } else {
        this.previewUrl = null
      }
    },
    async handleSubmit() {
      if (!this.$refs.form.validate()) return

      this.loading = true
      try {
        const formData = new FormData()
        Object.keys(this.formData).forEach(key => {
          if (this.formData[key] !== null) {
            formData.append(key, this.formData[key])
          }
        })

        this.$emit('submit', formData)
      } catch (error) {
        console.error('Form submission error:', error)
        this.$toast.error('Failed to submit form')
      } finally {
        this.loading = false
      }
    }
  },
  beforeDestroy() {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl)
    }
  }
}
</script>