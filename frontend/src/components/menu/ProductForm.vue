<template>
  <div class="product-form">
    <v-form ref="form" v-model="formValid" @submit.prevent="saveProduct">
      <v-card>
        <v-card-title>
          {{ editMode ? 'Edit Product' : 'Add New Product' }}
        </v-card-title>
        
        <v-card-text>
          <v-row>
            <!-- Left Column -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.name"
                label="Product Name"
                :rules="[v => !!v || 'Name is required']"
                required
                variant="outlined"
                class="mb-4"
              ></v-text-field>
              
              <v-select
                v-model="formData.categoryId"
                :items="categories"
                item-title="name"
                item-value="id"
                label="Category"
                :rules="[v => !!v || 'Category is required']"
                required
                variant="outlined"
                class="mb-4"
              ></v-select>
              
              <v-textarea
                v-model="formData.description"
                label="Description"
                variant="outlined"
                rows="3"
                class="mb-4"
              ></v-textarea>
              
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="formData.price"
                    label="Price"
                    type="number"
                    prefix="₫"
                    :rules="[
                      v => !!v || 'Price is required',
                      v => v > 0 || 'Price must be greater than 0'
                    ]"
                    required
                    variant="outlined"
                    class="mb-4"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="formData.status"
                    :items="statusOptions"
                    label="Status"
                    variant="outlined"
                    class="mb-4"
                  ></v-select>
                </v-col>
              </v-row>
              
              <v-switch
                v-model="formData.featured"
                color="primary"
                label="Featured Product"
                hint="Featured products appear at the top of the menu"
                persistent-hint
                class="mb-4"
              ></v-switch>
            </v-col>
            
            <!-- Right Column -->
            <v-col cols="12" md="6">
              <v-file-input
                v-model="formData.image"
                label="Product Image"
                accept="image/*"
                variant="outlined"
                prepend-icon="mdi-camera"
                class="mb-4"
                :show-size="1000"
              >
                <template v-slot:selection="{ fileNames }">
                  <template v-for="(fileName, index) in fileNames" :key="index">
                    <v-chip
                      size="small"
                      label
                      color="primary"
                      class="me-2"
                    >
                      {{ fileName }}
                    </v-chip>
                  </template>
                </template>
              </v-file-input>
              
              <div v-if="editMode && productImage" class="text-center mb-4">
                <v-img
                  :src="productImage"
                  max-height="200"
                  contain
                  class="rounded"
                ></v-img>
                <div class="text-caption mt-1">Current image</div>
              </div>
              
              <v-expansion-panels variant="accordion" class="mb-4">
                <v-expansion-panel title="Product Options">
                  <v-expansion-panel-text>
                    <p class="text-caption mb-2">
                      Add options like sizes or variants with different prices
                    </p>
                    
                    <div
                      v-for="(option, index) in formData.options"
                      :key="index"
                      class="option-item mb-3 pa-2 rounded-lg border"
                    >
                      <div class="d-flex align-center mb-2">
                        <div class="text-subtitle-2">Option {{ index + 1 }}</div>
                        <v-spacer></v-spacer>
                        <v-btn
                          icon
                          variant="text"
                          color="error"
                          size="small"
                          @click="removeOption(index)"
                        >
                          <v-icon>mdi-delete</v-icon>
                        </v-btn>
                      </div>
                      
                      <v-row>
                        <v-col cols="12" sm="7">
                          <v-text-field
                            v-model="option.name"
                            label="Option Name"
                            placeholder="e.g. Small, Medium, Large"
                            variant="outlined"
                            density="compact"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="12" sm="5">
                          <v-text-field
                            v-model="option.price_adjustment"
                            label="Price Adjustment"
                            type="number"
                            prefix="₫"
                            placeholder="0"
                            variant="outlined"
                            density="compact"
                          ></v-text-field>
                        </v-col>
                      </v-row>
                    </div>
                    
                    <v-btn
                      prepend-icon="mdi-plus"
                      variant="outlined"
                      size="small"
                      @click="addOption"
                      class="mt-2"
                    >
                      Add Option
                    </v-btn>
                  </v-expansion-panel-text>
                </v-expansion-panel>
                
                <v-expansion-panel title="Extra Add-ons">
                  <v-expansion-panel-text>
                    <p class="text-caption mb-2">
                      Add optional extras that customers can add to this product
                    </p>
                    
                    <div
                      v-for="(extra, index) in formData.extras"
                      :key="index"
                      class="extra-item mb-3 pa-2 rounded-lg border"
                    >
                      <div class="d-flex align-center mb-2">
                        <div class="text-subtitle-2">Extra {{ index + 1 }}</div>
                        <v-spacer></v-spacer>
                        <v-btn
                          icon
                          variant="text"
                          color="error"
                          size="small"
                          @click="removeExtra(index)"
                        >
                          <v-icon>mdi-delete</v-icon>
                        </v-btn>
                      </div>
                      
                      <v-row>
                        <v-col cols="12" sm="7">
                          <v-text-field
                            v-model="extra.name"
                            label="Extra Name"
                            placeholder="e.g. Extra Cheese, Bacon"
                            variant="outlined"
                            density="compact"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="12" sm="5">
                          <v-text-field
                            v-model="extra.price"
                            label="Price"
                            type="number"
                            prefix="₫"
                            placeholder="0"
                            variant="outlined"
                            density="compact"
                          ></v-text-field>
                        </v-col>
                      </v-row>
                    </div>
                    
                    <v-btn
                      prepend-icon="mdi-plus"
                      variant="outlined"
                      size="small"
                      @click="addExtra"
                      class="mt-2"
                    >
                      Add Extra
                    </v-btn>
                  </v-expansion-panel-text>
                </v-expansion-panel>
                
                <v-expansion-panel title="Dietary Information">
                  <v-expansion-panel-text>
                    <v-checkbox
                      v-model="formData.dietary.vegetarian"
                      label="Vegetarian"
                      color="success"
                      hide-details
                      class="mb-2"
                    ></v-checkbox>
                    
                    <v-checkbox
                      v-model="formData.dietary.vegan"
                      label="Vegan"
                      color="success"
                      hide-details
                      class="mb-2"
                    ></v-checkbox>
                    
                    <v-checkbox
                      v-model="formData.dietary.glutenFree"
                      label="Gluten Free"
                      color="success"
                      hide-details
                      class="mb-2"
                    ></v-checkbox>
                    
                    <v-checkbox
                      v-model="formData.dietary.containsNuts"
                      label="Contains Nuts"
                      color="warning"
                      hide-details
                      class="mb-2"
                    ></v-checkbox>
                    
                    <v-checkbox
                      v-model="formData.dietary.spicy"
                      label="Spicy"
                      color="error"
                      hide-details
                      class="mb-2"
                    ></v-checkbox>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-col>
          </v-row>
        </v-card-text>
        
        <v-divider></v-divider>
        
        <v-card-actions>
          <v-btn
            color="grey"
            variant="text"
            @click="$emit('cancel')"
          >
            Cancel
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            type="submit"
            :disabled="!formValid"
            :loading="saving"
          >
            {{ editMode ? 'Update Product' : 'Create Product' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-form>
  </div>
</template>

<script>
export default {
  name: 'ProductForm',
  
  props: {
    product: {
      type: Object,
      default: null
    },
    categories: {
      type: Array,
      required: true
    },
    restaurantId: {
      type: [Number, String],
      required: true
    }
  },
  
  data() {
    return {
      formValid: false,
      saving: false,
      statusOptions: [
        { title: 'Available', value: 'available' },
        { title: 'Unavailable', value: 'unavailable' },
        { title: 'Sold Out', value: 'sold_out' }
      ],
      formData: {
        name: '',
        description: '',
        price: '',
        categoryId: null,
        status: 'available',
        featured: false,
        image: null,
        options: [],
        extras: [],
        dietary: {
          vegetarian: false,
          vegan: false,
          glutenFree: false,
          containsNuts: false,
          spicy: false
        }
      }
    };
  },
  
  computed: {
    editMode() {
      return !!this.product;
    },
    
    productImage() {
      return this.product?.image_url || null;
    }
  },
  
  watch: {
    product: {
      handler(newVal) {
        if (newVal) {
          this.initFormData();
        }
      },
      immediate: true
    }
  },
  
  methods: {
    initFormData() {
      if (!this.product) return;
      
      this.formData = {
        name: this.product.name || '',
        description: this.product.description || '',
        price: this.product.price || '',
        categoryId: this.product.category_id || null,
        status: this.product.status || 'available',
        featured: this.product.featured || false,
        image: null,
        options: this.product.options?.map(option => ({
          id: option.id,
          name: option.name,
          price_adjustment: option.price_adjustment
        })) || [],
        extras: this.product.extras?.map(extra => ({
          id: extra.id,
          name: extra.name,
          price: extra.price
        })) || [],
        dietary: {
          vegetarian: this.product.dietary?.vegetarian || false,
          vegan: this.product.dietary?.vegan || false,
          glutenFree: this.product.dietary?.glutenFree || false,
          containsNuts: this.product.dietary?.containsNuts || false,
          spicy: this.product.dietary?.spicy || false
        }
      };
    },
    
    addOption() {
      this.formData.options.push({
        name: '',
        price_adjustment: 0
      });
    },
    
    removeOption(index) {
      this.formData.options.splice(index, 1);
    },
    
    addExtra() {
      this.formData.extras.push({
        name: '',
        price: 0
      });
    },
    
    removeExtra(index) {
      this.formData.extras.splice(index, 1);
    },
    
    async saveProduct() {
      if (!this.formValid) return;
      
      this.saving = true;
      
      try {
        const formData = new FormData();
        
        // Basic product information
        formData.append('name', this.formData.name);
        formData.append('description', this.formData.description);
        formData.append('price', this.formData.price);
        formData.append('categoryId', this.formData.categoryId);
        formData.append('status', this.formData.status);
        formData.append('featured', this.formData.featured);
        formData.append('restaurantId', this.restaurantId);
        
        // Product image
        if (this.formData.image) {
          formData.append('image', this.formData.image);
        }
        
        // Options and extras
        formData.append('options', JSON.stringify(this.formData.options));
        formData.append('extras', JSON.stringify(this.formData.extras));
        
        // Dietary information
        formData.append('dietary', JSON.stringify(this.formData.dietary));
        
        // Emit event with form data
        this.$emit('save', {
          id: this.product?.id,
          formData
        });
      } catch (error) {
        console.error('Error preparing product data:', error);
      } finally {
        this.saving = false;
      }
    },
    
    resetForm() {
      this.formData = {
        name: '',
        description: '',
        price: '',
        categoryId: null,
        status: 'available',
        featured: false,
        image: null,
        options: [],
        extras: [],
        dietary: {
          vegetarian: false,
          vegan: false,
          glutenFree: false,
          containsNuts: false,
          spicy: false
        }
      };
      
      if (this.$refs.form) {
        this.$refs.form.reset();
      }
    }
  }
};
</script>

<style scoped>
.border {
  border: 1px solid rgba(0, 0, 0, 0.12);
}

.option-item, .extra-item {
  background-color: rgba(0, 0, 0, 0.02);
}
</style> 