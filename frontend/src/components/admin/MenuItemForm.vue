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

        <v-divider class="my-4"></v-divider>

        <!-- Product Options Section -->
        <div>
          <div class="d-flex align-center mb-2">
            <h3 class="text-subtitle-1 font-weight-medium">Product Options</h3>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              text
              small
              @click="addOptionGroup"
              class="px-2"
            >
              <v-icon left small>mdi-plus</v-icon>
              Add Option Group
            </v-btn>
          </div>

          <v-alert
            v-if="!formData.optionGroups.length"
            text
            type="info"
            dense
            class="mb-3"
          >
            Add options like size, toppings, extras, etc. Optional items that customers can select.
          </v-alert>

          <v-expansion-panels
            v-if="formData.optionGroups.length"
            multiple
          >
            <v-expansion-panel
              v-for="(group, groupIndex) in formData.optionGroups"
              :key="`group-${groupIndex}`"
            >
              <v-expansion-panel-header>
                <div class="d-flex align-center">
                  <span>{{ group.name || 'Unnamed Group' }}</span>
                  <v-chip
                    class="ml-2"
                    x-small
                    :color="group.required ? 'error' : 'secondary'"
                    text-color="white"
                  >
                    {{ group.required ? 'Required' : 'Optional' }}
                  </v-chip>
                  <v-chip
                    class="ml-2"
                    x-small
                    :color="group.multiSelect ? 'primary' : 'grey'"
                    text-color="white"
                  >
                    {{ group.multiSelect ? 'Multi-select' : 'Single choice' }}
                  </v-chip>
                </div>
              </v-expansion-panel-header>

              <v-expansion-panel-content>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="group.name"
                      label="Option Group Name"
                      placeholder="e.g. Size, Toppings, Extras"
                      dense
                      :rules="[v => !!v || 'Name is required']"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="group.displayType"
                      :items="displayTypes"
                      label="Display Type"
                      dense
                    ></v-select>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-switch
                      v-model="group.required"
                      label="Required"
                      hint="Customer must select an option"
                      dense
                    ></v-switch>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-switch
                      v-model="group.multiSelect"
                      label="Multi-select"
                      hint="Customer can select multiple options"
                      dense
                    ></v-switch>
                  </v-col>
                  <v-col cols="12" sm="6" v-if="group.multiSelect">
                    <v-text-field
                      v-model.number="group.minSelections"
                      type="number"
                      label="Min Selections"
                      dense
                      min="0"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="6" v-if="group.multiSelect">
                    <v-text-field
                      v-model.number="group.maxSelections"
                      type="number"
                      label="Max Selections"
                      dense
                      min="1"
                    ></v-text-field>
                  </v-col>
                </v-row>

                <div class="d-flex align-center mb-2 mt-4">
                  <h4 class="text-body-2 font-weight-medium">Options</h4>
                  <v-spacer></v-spacer>
                  <v-btn
                    color="primary"
                    text
                    x-small
                    @click="addOption(groupIndex)"
                    class="px-2"
                  >
                    <v-icon left x-small>mdi-plus</v-icon>
                    Add Option
                  </v-btn>
                </div>

                <v-data-table
                  :headers="optionHeaders"
                  :items="group.options"
                  hide-default-footer
                  class="elevation-1 mb-4"
                  dense
                >
                  <template v-slot:item.name="{ item, index }">
                    <v-text-field
                      v-model="item.name"
                      dense
                      hide-details
                      placeholder="Option name"
                      class="my-1"
                      :rules="[v => !!v || 'Name is required']"
                    ></v-text-field>
                  </template>

                  <template v-slot:item.price="{ item }">
                    <v-text-field
                      v-model.number="item.price"
                      type="number"
                      dense
                      hide-details
                      class="my-1"
                      prefix="₫"
                    ></v-text-field>
                  </template>

                  <template v-slot:item.default="{ item }">
                    <v-checkbox
                      v-model="item.default"
                      dense
                      hide-details
                      class="my-1"
                      :disabled="group.multiSelect ? false : hasDefaultInGroup(group, item)"
                    ></v-checkbox>
                  </template>

                  <template v-slot:item.actions="{ item, index }">
                    <v-btn
                      icon
                      x-small
                      color="error"
                      @click="removeOption(groupIndex, index)"
                    >
                      <v-icon x-small>mdi-delete</v-icon>
                    </v-btn>
                  </template>
                </v-data-table>

                <div class="d-flex justify-end">
                  <v-btn
                    color="error"
                    text
                    small
                    @click="removeOptionGroup(groupIndex)"
                  >
                    <v-icon left small>mdi-delete</v-icon>
                    Remove Group
                  </v-btn>
                </div>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>

        <!-- Variants Section (for products with combinations of options) -->
        <v-divider class="my-4" v-if="showVariantsSection"></v-divider>
        <div v-if="showVariantsSection">
          <div class="d-flex align-center mb-2">
            <h3 class="text-subtitle-1 font-weight-medium">Product Variants</h3>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              text
              small
              @click="generateVariants"
              class="px-2"
            >
              <v-icon left small>mdi-refresh</v-icon>
              Generate Variants
            </v-btn>
          </div>

          <v-alert
            text
            type="info"
            dense
            class="mb-3"
          >
            Based on your option groups, you can generate product variants with different prices and inventory.
          </v-alert>

          <v-data-table
            v-if="formData.variants.length"
            :headers="variantHeaders"
            :items="formData.variants"
            class="elevation-1"
            dense
          >
            <template v-slot:item.name="{ item }">
              {{ item.name }}
            </template>

            <template v-slot:item.price="{ item }">
              <v-text-field
                v-model.number="item.price"
                type="number"
                dense
                hide-details
                class="my-1"
                prefix="₫"
              ></v-text-field>
            </template>

            <template v-slot:item.sku="{ item }">
              <v-text-field
                v-model="item.sku"
                dense
                hide-details
                class="my-1"
                placeholder="SKU"
              ></v-text-field>
            </template>

            <template v-slot:item.inventory="{ item }">
              <v-text-field
                v-model.number="item.inventory"
                type="number"
                dense
                hide-details
                class="my-1"
                min="0"
              ></v-text-field>
            </template>

            <template v-slot:item.active="{ item }">
              <v-checkbox
                v-model="item.active"
                dense
                hide-details
                class="my-1"
              ></v-checkbox>
            </template>
          </v-data-table>
        </div>
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
        preparationTime: 15,
        optionGroups: [],
        variants: []
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
      ],
      displayTypes: [
        'Dropdown', 'Radio Buttons', 'Checkboxes'
      ],
      optionHeaders: [
        { text: 'Name', value: 'name' },
        { text: 'Price', value: 'price' },
        { text: 'Default', value: 'default' },
        { text: 'Actions', value: 'actions', sortable: false }
      ],
      variantHeaders: [
        { text: 'Name', value: 'name' },
        { text: 'Price', value: 'price' },
        { text: 'SKU', value: 'sku' },
        { text: 'Inventory', value: 'inventory' },
        { text: 'Active', value: 'active' }
      ]
    }
  },
  computed: {
    currentImages() {
      return this.menuItem.images || []
    },
    showVariantsSection() {
      return this.formData.optionGroups.some(group => group.options.length > 0)
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
            preparationTime: newVal.preparationTime || 15,
            optionGroups: newVal.optionGroups || [],
            variants: newVal.variants || []
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
    addOptionGroup() {
      this.formData.optionGroups.push({
        name: '',
        displayType: 'Dropdown',
        required: false,
        multiSelect: false,
        minSelections: 0,
        maxSelections: 1,
        options: []
      })
    },
    removeOptionGroup(index) {
      this.formData.optionGroups.splice(index, 1)
    },
    addOption(groupIndex) {
      this.formData.optionGroups[groupIndex].options.push({
        name: '',
        price: 0,
        default: false
      })
    },
    removeOption(groupIndex, optionIndex) {
      this.formData.optionGroups[groupIndex].options.splice(optionIndex, 1)
    },
    hasDefaultInGroup(group, item) {
      return group.options.some(option => option.default && option !== item)
    },
    generateVariants() {
      const variants = []
      const optionGroups = this.formData.optionGroups.filter(group => group.options.length > 0)
      const combinations = this.getCombinations(optionGroups.map(group => group.options))

      combinations.forEach(combination => {
        const name = combination.map(option => option.name).join(' / ')
        const price = combination.reduce((sum, option) => sum + option.price, this.formData.price || 0)
        variants.push({
          name,
          price,
          sku: '',
          inventory: 0,
          active: true
        })
      })

      this.formData.variants = variants
    },
    getCombinations(arrays) {
      if (arrays.length === 0) return [[]]
      const [first, ...rest] = arrays
      const combinations = this.getCombinations(rest)
      return first.flatMap(item => combinations.map(combination => [item, ...combination]))
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