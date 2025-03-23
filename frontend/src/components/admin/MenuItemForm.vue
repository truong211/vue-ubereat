<template>
  <v-form ref="form" v-model="valid" @submit.prevent="handleSubmit">
    <v-card>
      <v-card-title>
        {{ editMode ? 'Edit Menu Item' : 'Create New Menu Item' }}
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="formData.name"
              :rules="nameRules"
              label="Item Name"
              required
            ></v-text-field>
          </v-col>

          <v-col cols="12" md="6">
            <v-select
              v-model="formData.categoryId"
              :items="categories"
              item-text="name"
              item-value="id"
              :rules="categoryRules"
              label="Category"
              required
            ></v-select>
          </v-col>

          <v-col cols="12">
            <v-textarea
              v-model="formData.description"
              label="Description"
              :rules="descriptionRules"
              rows="3"
            ></v-textarea>
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="formData.price"
              type="number"
              :rules="priceRules"
              label="Price"
              prefix="₫"
              required
            ></v-text-field>
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="formData.discountPrice"
              type="number"
              :rules="discountPriceRules"
              label="Discount Price"
              prefix="₫"
            ></v-text-field>
          </v-col>

          <v-col cols="12">
            <v-file-input
              v-model="formData.images"
              :rules="imageRules"
              accept="image/*"
              label="Item Images"
              prepend-icon="mdi-camera"
              multiple
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

          <v-col cols="12" v-if="previewUrls.length || currentImages.length">
            <v-carousel>
              <v-carousel-item
                v-for="(image, i) in [...previewUrls, ...currentImages]"
                :key="i"
                :src="image"
                contain
              ></v-carousel-item>
            </v-carousel>
          </v-col>

          <v-col cols="12">
            <v-combobox
              v-model="formData.tags"
              :items="availableTags"
              label="Tags"
              multiple
              chips
              small-chips
              deletable-chips
            ></v-combobox>
          </v-col>

          <v-col cols="12">
            <v-select
              v-model="formData.dietaryInfo"
              :items="dietaryOptions"
              label="Dietary Information"
              multiple
              chips
              small-chips
            ></v-select>
          </v-col>

          <v-col cols="12" md="6">
            <v-select
              v-model="formData.status"
              :items="statusOptions"
              label="Status"
              required
              :rules="statusRules"
            ></v-select>
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="formData.preparationTime"
              type="number"
              label="Preparation Time (minutes)"
              min="1"
            ></v-text-field>
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
  name: 'MenuItemForm',
  props: {
    editMode: {
      type: Boolean,
      default: false
    },
    menuItem: {
      type: Object,
      default: () => ({})
    },
    categories: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      valid: false,
      loading: false,
      previewUrls: [],
      formData: {
        name: '',
        categoryId: null,
        description: '',
        price: null,
        discountPrice: null,
        images: [],
        tags: [],
        dietaryInfo: [],
        status: 'available',
        preparationTime: 15
      },
      nameRules: [
        v => !!v || 'Name is required',
        v => (v && v.length >= 2) || 'Name must be at least 2 characters',
        v => (v && v.length <= 100) || 'Name must be less than 100 characters'
      ],
      categoryRules: [
        v => !!v || 'Category is required'
      ],
      descriptionRules: [
        v => !v || v.length <= 1000 || 'Description must be less than 1000 characters'
      ],
      priceRules: [
        v => !!v || 'Price is required',
        v => v > 0 || 'Price must be greater than 0'
      ],
      discountPriceRules: [
        v => !v || v < this.formData.price || 'Discount price must be less than regular price'
      ],
      imageRules: [
        files => {
          if (!files) return true
          const totalSize = Array.isArray(files) 
            ? files.reduce((sum, file) => sum + file.size, 0)
            : files.size
          return totalSize < 10000000 || 'Total image size should be less than 10 MB!'
        }
      ],
      statusRules: [
        v => !!v || 'Status is required'
      ],
      availableTags: [
        'Spicy', 'Vegetarian', 'Vegan', 'Halal', 'Gluten-free', 'Popular', 'New'
      ],
      dietaryOptions: [
        'Vegetarian',
        'Vegan',
        'Gluten-free',
        'Dairy-free',
        'Nut-free',
        'Halal',
        'Contains nuts',
        'Contains dairy',
        'Contains gluten',
        'Contains eggs'
      ],
      statusOptions: [
        { text: 'Available', value: 'available' },
        { text: 'Out of Stock', value: 'out_of_stock' },
        { text: 'Hidden', value: 'hidden' }
      ]
    }
  },
  computed: {
    currentImages() {
      return this.menuItem.images || []
    }
  },
  watch: {
    menuItem: {
      handler(newVal) {
        if (newVal) {
          this.formData = {
            name: newVal.name || '',
            categoryId: newVal.categoryId || null,
            description: newVal.description || '',
            price: newVal.price || null,
            discountPrice: newVal.discountPrice || null,
            images: [],
            tags: newVal.tags || [],
            dietaryInfo: newVal.dietaryInfo || [],
            status: newVal.status || 'available',
            preparationTime: newVal.preparationTime || 15
          }
        }
      },
      immediate: true
    }
  },
  methods: {
    handleImageChange(files) {
      this.previewUrls.forEach(url => URL.revokeObjectURL(url))
      this.previewUrls = []
      
      if (files && files.length) {
        this.previewUrls = files.map(file => URL.createObjectURL(file))
      }
    },
    async handleSubmit() {
      if (!this.$refs.form.validate()) return

      this.loading = true
      try {
        const formData = new FormData()
        Object.keys(this.formData).forEach(key => {
          if (key === 'images' && this.formData[key].length) {
            this.formData[key].forEach((file, index) => {
              formData.append(`images[${index}]`, file)
            })
          } else if (Array.isArray(this.formData[key])) {
            formData.append(key, JSON.stringify(this.formData[key]))
          } else if (this.formData[key] !== null) {
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
    this.previewUrls.forEach(url => URL.revokeObjectURL(url))
  }
}
</script>