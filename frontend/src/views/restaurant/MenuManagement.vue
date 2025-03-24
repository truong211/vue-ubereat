<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Menu Management</h1>
        
        <!-- Menu Categories -->
        <v-card class="mb-4">
          <v-card-title class="d-flex align-center">
            Categories
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              @click="openCategoryDialog()"
            >
              Add Category
            </v-btn>
          </v-card-title>
          
          <v-card-text>
            <v-list>
              <draggable 
                v-model="sortableCategories" 
                item-key="id"
                handle=".drag-handle"
                @end="handleCategoryReorder"
              >
                <template #item="{ element: category }">
                  <v-list-item
                    :key="category.id"
                    :title="category.name"
                    :subtitle="category.description"
                  >
                    <template v-slot:prepend>
                      <v-icon
                        class="drag-handle me-2 cursor-move"
                        icon="mdi-drag"
                        size="small"
                      ></v-icon>
                      <v-icon
                        :color="category.isActive ? 'success' : 'grey'"
                        :icon="category.isActive ? 'mdi-eye' : 'mdi-eye-off'"
                        size="small"
                        class="me-2"
                      ></v-icon>
                    </template>
                    <template v-slot:append>
                      <v-btn
                        icon="mdi-pencil"
                        variant="text"
                        size="small"
                        @click="openCategoryDialog(category)"
                      ></v-btn>
                      <v-btn
                        icon="mdi-delete"
                        variant="text"
                        size="small"
                        color="error"
                        @click="confirmDeleteCategory(category)"
                      ></v-btn>
                    </template>
                  </v-list-item>
                </template>
              </draggable>
            </v-list>
          </v-card-text>
        </v-card>
        
        <!-- Menu Items -->
        <v-card>
          <v-card-title class="d-flex align-center">
            Menu Items
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              @click="openItemDialog()"
            >
              Add Item
            </v-btn>
          </v-card-title>
          
          <v-card-text>
            <!-- Search and Filter -->
            <v-row class="mb-4">
              <v-col cols="12" sm="3">
                <v-select
                  v-model="selectedCategory"
                  :items="categories"
                  item-title="name"
                  item-value="id"
                  label="Filter by Category"
                  clearable
                ></v-select>
              </v-col>
              <v-col cols="12" sm="3">
                <v-select
                  v-model="selectedStatus"
                  :items="statusOptions"
                  item-title="title"
                  item-value="value"
                  label="Filter by Status"
                  clearable
                ></v-select>
              </v-col>
              <v-col cols="12" sm="3">
                <v-select
                  v-model="selectedHighlight"
                  :items="highlightOptions"
                  item-title="title"
                  item-value="value"
                  label="Filter by Highlight"
                  clearable
                ></v-select>
              </v-col>
              <v-col cols="12" sm="3">
                <v-text-field
                  v-model="searchQuery"
                  label="Search Items"
                  prepend-inner-icon="mdi-magnify"
                  clearable
                ></v-text-field>
              </v-col>
            </v-row>

            <v-data-table
              :headers="tableHeaders"
              :items="filteredItems"
              density="comfortable"
              :items-per-page="10"
              :items-per-page-options="[5, 10, 15, 20]"
              class="elevation-1"
            >
              <!-- Image Column -->
              <template v-slot:item.image="{ item }">
                <v-avatar size="48">
                  <v-img :src="item.imageUrl || '/img/placeholder-food.png'" cover></v-img>
                </v-avatar>
              </template>

              <!-- Name Column with Badges -->
              <template v-slot:item.name="{ item }">
                <div class="d-flex align-center">
                  {{ item.name }}
                  <v-chip
                    v-if="item.isNew"
                    color="green"
                    size="x-small"
                    class="ms-2"
                  >NEW</v-chip>
                  <v-chip
                    v-if="item.isBestSeller"
                    color="amber-darken-3"
                    size="x-small"
                    class="ms-2"
                  >BEST SELLER</v-chip>
                  <v-chip
                    v-if="item.featured"
                    color="primary"
                    size="x-small"
                    class="ms-2"
                  >FEATURED</v-chip>
                </div>
              </template>

              <!-- Category Column -->
              <template v-slot:item.categoryId="{ item }">
                {{ getCategoryName(item.categoryId) }}
              </template>
              
              <!-- Price Column -->
              <template v-slot:item.price="{ item }">
                ${{ item.price.toFixed(2) }}
                <span v-if="item.sizes && item.sizes.length > 0" class="text-caption text-grey">+{{ item.sizes.length }} size options</span>
              </template>
              
              <!-- Prep Time Column -->
              <template v-slot:item.prepTime="{ item }">
                <div class="d-flex align-center">
                  <v-icon size="small" color="info" class="mr-1">mdi-clock-outline</v-icon>
                  {{ item.prepTime || 0 }} phút
                </div>
              </template>
              
              <!-- Status Column -->
              <template v-slot:item.status="{ item }">
                <v-chip
                  size="small"
                  :color="getStatusColor(item.status || (item.available ? 'available' : 'out_of_stock'))"
                  :text-color="getStatusTextColor(item.status || (item.available ? 'available' : 'out_of_stock'))"
                >
                  {{ getStatusLabel(item.status || (item.available ? 'available' : 'out_of_stock')) }}
                </v-chip>
              </template>

              <!-- Actions Column -->
              <template v-slot:item.actions="{ item }">
                <v-btn
                  icon="mdi-pencil"
                  variant="text"
                  color="primary"
                  size="small"
                  @click="openItemDialog(item)"
                ></v-btn>
                <v-btn
                  icon="mdi-delete"
                  variant="text"
                  color="error"
                  size="small"
                  @click="confirmDeleteItem(item)"
                ></v-btn>
                <v-menu>
                  <template v-slot:activator="{ props }">
                    <v-btn
                      icon="mdi-dots-vertical"
                      variant="text"
                      size="small"
                      v-bind="props"
                    ></v-btn>
                  </template>
                  <v-list>
                    <v-list-item
                      v-if="item.status !== 'available'"
                      title="Mark as Available"
                      @click="updateItemStatus(item, 'available')"
                    >
                      <template v-slot:prepend>
                        <v-icon color="success">mdi-check-circle</v-icon>
                      </template>
                    </v-list-item>
                    <v-list-item
                      v-if="item.status !== 'out_of_stock'"
                      title="Mark as Out of Stock"
                      @click="updateItemStatus(item, 'out_of_stock')"
                    >
                      <template v-slot:prepend>
                        <v-icon color="error">mdi-close-circle</v-icon>
                      </template>
                    </v-list-item>
                    <v-list-item
                      v-if="item.status !== 'unavailable'"
                      title="Mark as Temporarily Unavailable"
                      @click="updateItemStatus(item, 'unavailable')"
                    >
                      <template v-slot:prepend>
                        <v-icon color="warning">mdi-clock</v-icon>
                      </template>
                    </v-list-item>
                    <v-divider></v-divider>
                    <v-list-item
                      :title="item.featured ? 'Remove from Featured' : 'Add to Featured'"
                      @click="toggleFeatured(item)"
                    >
                      <template v-slot:prepend>
                        <v-icon :color="item.featured ? 'grey' : 'primary'">
                          {{ item.featured ? 'mdi-star-off' : 'mdi-star' }}
                        </v-icon>
                      </template>
                    </v-list-item>
                    <v-list-item
                      :title="item.isNew ? 'Remove New Label' : 'Mark as New'"
                      @click="toggleNew(item)"
                    >
                      <template v-slot:prepend>
                        <v-icon :color="item.isNew ? 'grey' : 'green'">
                          mdi-new-box
                        </v-icon>
                      </template>
                    </v-list-item>
                    <v-list-item
                      :title="item.isBestSeller ? 'Remove Best Seller Label' : 'Mark as Best Seller'"
                      @click="toggleBestSeller(item)"
                    >
                      <template v-slot:prepend>
                        <v-icon :color="item.isBestSeller ? 'grey' : 'amber-darken-3'">
                          mdi-trophy
                        </v-icon>
                      </template>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Category Dialog -->
    <v-dialog v-model="categoryDialog.show" max-width="600">
      <v-card>
        <v-card-title>
          {{ categoryDialog.isEdit ? 'Edit' : 'Add' }} Category
        </v-card-title>
        
        <v-card-text>
          <v-form ref="categoryForm">
            <v-text-field
              v-model="categoryDialog.form.name"
              label="Category Name"
              :rules="[rules.required]"
              required
            ></v-text-field>
            
            <v-textarea
              v-model="categoryDialog.form.description"
              label="Description"
              rows="3"
              placeholder="Enter a detailed description of this category"
              hint="A good description helps customers understand what kinds of items they can find in this category"
            ></v-textarea>

            <v-text-field
              v-model.number="categoryDialog.form.displayOrder"
              label="Display Order"
              type="number"
              hint="Lower numbers will appear first in the menu"
              persistent-hint
              class="mt-4"
            ></v-text-field>

            <v-file-input
              v-model="categoryDialog.form.image"
              label="Category Image"
              accept="image/*"
              prepend-icon="mdi-camera"
              :show-size="true"
              hint="Upload a representative image for this category"
              persistent-hint
              class="mt-4"
            >
              <template v-slot:selection="{ fileNames }">
                <template v-for="fileName in fileNames" :key="fileName">
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

            <v-switch
              v-model="categoryDialog.form.isActive"
              color="success"
              label="Category is active and visible to customers"
              class="mt-4"
            ></v-switch>

            <!-- Availability Schedule -->
            <div class="d-flex align-center mt-4">
              <div class="text-subtitle-1">Availability Schedule</div>
              <v-spacer></v-spacer>
              <v-switch
                v-model="categoryDialog.form.hasSchedule"
                label="Use Schedule"
                color="primary"
                hide-details
              ></v-switch>
            </div>

            <v-expand-transition>
              <div v-if="categoryDialog.form.hasSchedule" class="mt-2">
                <v-row v-for="(day, index) in daysOfWeek" :key="day">
                  <v-col cols="3">
                    <v-checkbox 
                      v-model="categoryDialog.form.schedule[index].active" 
                      :label="day"
                      hide-details
                    ></v-checkbox>
                  </v-col>
                  <v-col cols="4">
                    <v-text-field
                      v-model="categoryDialog.form.schedule[index].from"
                      label="From"
                      type="time"
                      density="comfortable"
                      :disabled="!categoryDialog.form.schedule[index].active"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="4">
                    <v-text-field
                      v-model="categoryDialog.form.schedule[index].to"
                      label="To"
                      type="time"
                      density="comfortable"
                      :disabled="!categoryDialog.form.schedule[index].active"
                    ></v-text-field>
                  </v-col>
                </v-row>
              </div>
            </v-expand-transition>
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

    <!-- Item Dialog -->
    <v-dialog v-model="itemDialog.show" max-width="800" persistent>
      <v-card>
        <v-card-title>
          {{ itemDialog.isEdit ? 'Edit' : 'Add' }} Menu Item
        </v-card-title>
        
        <v-card-text>
          <v-form ref="itemForm">
            <v-row>
              <v-col cols="12">
                <v-tabs v-model="activeItemTab">
                  <v-tab value="basic">Basic Info</v-tab>
                  <v-tab value="variants">Variants & Options</v-tab>
                  <v-tab value="status">Status & Display</v-tab>
                </v-tabs>
              </v-col>

              <v-col cols="12">
                <v-window v-model="activeItemTab">
                  <!-- Basic Info Tab -->
                  <v-window-item value="basic">
                    <v-row>
                      <!-- Basic Info -->
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="itemDialog.form.name"
                          label="Item Name"
                          :rules="[rules.required]"
                        ></v-text-field>
                      </v-col>
                      
                      <v-col cols="12" md="6">
                        <v-select
                          v-model="itemDialog.form.categoryId"
                          :items="categories"
                          item-title="name"
                          item-value="id"
                          label="Category"
                          :rules="[rules.required]"
                        ></v-select>
                      </v-col>
                      
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model.number="itemDialog.form.price"
                          label="Base Price"
                          type="number"
                          prefix="$"
                          :rules="[rules.required, rules.price]"
                        ></v-text-field>
                      </v-col>
                      
                      <v-col cols="12" md="6">
                        <v-file-input
                          v-model="itemDialog.form.image"
                          label="Item Image"
                          accept="image/*"
                          :rules="[itemDialog.isEdit ? undefined : rules.required]"
                          @change="handleImagePreview"
                          prepend-icon="mdi-camera"
                          :show-size="true"
                          hint="Upload a clear, appetizing photo of the dish"
                          persistent-hint
                        >
                          <template v-slot:selection="{ fileNames }">
                            <template v-for="fileName in fileNames" :key="fileName">
                              <v-chip size="small" label color="primary" class="me-2">
                                {{ fileName }}
                              </v-chip>
                            </template>
                          </template>
                        </v-file-input>
                        
                        <!-- Image Preview -->
                        <v-img
                          v-if="imagePreview || itemDialog.form.imageUrl"
                          :src="imagePreview || itemDialog.form.imageUrl"
                          height="200"
                          cover
                          class="mt-2 rounded-lg"
                        ></v-img>
                      </v-col>
                      
                      <v-col cols="12">
                        <v-textarea
                          v-model="itemDialog.form.description"
                          label="Description"
                          :rules="[rules.required]"
                          rows="3"
                          counter="500"
                          placeholder="Describe the dish, including main ingredients and preparation method"
                          hint="A detailed description helps customers make informed choices"
                          persistent-hint
                        ></v-textarea>
                      </v-col>

                      <!-- Dietary Information -->
                      <v-col cols="12">
                        <div class="text-subtitle-1 mb-2">Dietary Information</div>
                        <v-chip-group
                          v-model="itemDialog.form.dietaryTags"
                          multiple
                          column
                        >
                          <v-chip
                            v-for="tag in dietaryOptions"
                            :key="tag.value"
                            filter
                            :value="tag.value"
                          >
                            <v-icon start>{{ tag.icon }}</v-icon>
                            {{ tag.label }}
                          </v-chip>
                        </v-chip-group>
                      </v-col>

                      <!-- Preparation Time -->
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model.number="itemDialog.form.prepTime"
                          label="Thời gian chuẩn bị (phút)"
                          type="number"
                          hint="Thời gian ước tính để chuẩn bị món này"
                          persistent-hint
                          min="0"
                          :rules="[
                            v => v >= 0 || 'Thời gian chuẩn bị không được âm',
                            v => v !== null || 'Vui lòng nhập thời gian chuẩn bị'
                          ]"
                        ></v-text-field>
                      </v-col>

                      <!-- Calories -->
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model.number="itemDialog.form.calories"
                          label="Calories"
                          type="number"
                          hint="Nutritional information (optional)"
                          persistent-hint
                        ></v-text-field>
                      </v-col>
                    </v-row>
                  </v-window-item>

                  <!-- Variants & Options Tab -->
                  <v-window-item value="variants">
                    <v-row>
                      <!-- Size Options -->
                      <v-col cols="12">
                        <div class="d-flex align-center mb-2">
                          <div class="text-subtitle-1">Size Options</div>
                          <v-spacer></v-spacer>
                          <v-btn
                            size="small"
                            icon="mdi-plus"
                            variant="text"
                            @click="addSizeOption"
                          ></v-btn>
                        </div>
                        <v-row
                          v-for="(size, index) in itemDialog.form.sizes"
                          :key="index"
                          class="align-center"
                        >
                          <v-col cols="5">
                            <v-text-field
                              v-model="size.name"
                              label="Size Name"
                              density="comfortable"
                            ></v-text-field>
                          </v-col>
                          <v-col cols="4">
                            <v-text-field
                              v-model.number="size.price"
                              label="Additional Price"
                              type="number"
                              prefix="$"
                              density="comfortable"
                            ></v-text-field>
                          </v-col>
                          <v-col cols="2">
                            <v-switch
                              v-model="size.isDefault"
                              color="primary"
                              label="Default"
                              density="comfortable"
                              hide-details
                            ></v-switch>
                          </v-col>
                          <v-col cols="1">
                            <v-btn
                              icon="mdi-delete"
                              variant="text"
                              color="error"
                              density="comfortable"
                              @click="removeSizeOption(index)"
                            ></v-btn>
                          </v-col>
                        </v-row>
                      </v-col>

                      <!-- Toppings -->
                      <v-col cols="12">
                        <div class="d-flex align-center mb-2">
                          <div class="text-subtitle-1">Toppings/Add-ons</div>
                          <v-spacer></v-spacer>
                          <v-btn
                            size="small"
                            icon="mdi-plus"
                            variant="text"
                            @click="addTopping"
                          ></v-btn>
                        </div>
                        <v-row
                          v-for="(topping, index) in itemDialog.form.toppings"
                          :key="index"
                          class="align-center"
                        >
                          <v-col cols="5">
                            <v-text-field
                              v-model="topping.name"
                              label="Topping Name"
                              density="comfortable"
                            ></v-text-field>
                          </v-col>
                          <v-col cols="3">
                            <v-text-field
                              v-model.number="topping.price"
                              label="Price"
                              type="number"
                              prefix="$"
                              density="comfortable"
                            ></v-text-field>
                          </v-col>
                          <v-col cols="3">
                            <v-select
                              v-model="topping.selectionType"
                              :items="toppingSelectionTypes"
                              label="Selection"
                              density="comfortable"
                            ></v-select>
                          </v-col>
                          <v-col cols="1">
                            <v-btn
                              icon="mdi-delete"
                              variant="text"
                              color="error"
                              density="comfortable"
                              @click="removeTopping(index)"
                            ></v-btn>
                          </v-col>
                        </v-row>
                      </v-col>

                      <!-- Spice Levels -->
                      <v-col cols="12">
                        <div class="d-flex align-center mb-2">
                          <div class="text-subtitle-1">Spice Levels</div>
                          <v-spacer></v-spacer>
                          <v-btn
                            size="small"
                            icon="mdi-plus"
                            variant="text"
                            @click="addSpiceLevel"
                          ></v-btn>
                        </div>
                        <v-row
                          v-for="(level, index) in itemDialog.form.spiceLevels"
                          :key="index"
                          class="align-center"
                        >
                          <v-col cols="5">
                            <v-text-field
                              v-model="level.name"
                              label="Level Name"
                              density="comfortable"
                            ></v-text-field>
                          </v-col>
                          <v-col cols="6">
                            <v-slider
                              v-model="level.value"
                              min="1"
                              max="5"
                              step="1"
                              show-ticks="always"
                              :ticks="{ 1: '1', 2: '2', 3: '3', 4: '4', 5: '5' }"
                              density="comfortable"
                            >
                              <template v-slot:prepend>
                                <v-icon color="green">mdi-fire</v-icon>
                              </template>
                              <template v-slot:append>
                                <v-icon color="red">mdi-fire</v-icon>
                              </template>
                            </v-slider>
                          </v-col>
                          <v-col cols="1">
                            <v-btn
                              icon="mdi-delete"
                              variant="text"
                              color="error"
                              density="comfortable"
                              @click="removeSpiceLevel(index)"
                            ></v-btn>
                          </v-col>
                        </v-row>
                      </v-col>
                    </v-row>
                  </v-window-item>

                  <!-- Status & Display Tab -->
                  <v-window-item value="status">
                    <v-row>
                      <!-- Item Status -->
                      <v-col cols="12" md="6">
                        <v-card variant="outlined" class="pa-4">
                          <div class="text-subtitle-1 mb-4">Item Status</div>
                          
                          <v-radio-group v-model="itemDialog.form.status">
                            <v-radio
                              label="Available"
                              color="success"
                              value="available"
                            >
                              <template v-slot:prepend>
                                <v-icon color="success">mdi-check-circle</v-icon>
                              </template>
                            </v-radio>
                            
                            <v-radio
                              label="Out of Stock"
                              color="error"
                              value="out_of_stock"
                            >
                              <template v-slot:prepend>
                                <v-icon color="error">mdi-close-circle</v-icon>
                              </template>
                            </v-radio>
                            
                            <v-radio
                              label="Temporarily Unavailable"
                              color="warning"
                              value="unavailable"
                            >
                              <template v-slot:prepend>
                                <v-icon color="warning">mdi-clock</v-icon>
                              </template>
                            </v-radio>
                          </v-radio-group>

                          <v-expand-transition>
                            <div v-if="itemDialog.form.status === 'unavailable'">
                              <v-text-field
                                v-model="itemDialog.form.unavailableUntil"
                                label="Unavailable Until"
                                type="datetime-local"
                                hint="Leave blank if unknown"
                                persistent-hint
                              ></v-text-field>
                            </div>
                          </v-expand-transition>
                        </v-card>
                      </v-col>

                      <!-- Item Highlighting -->
                      <v-col cols="12" md="6">
                        <v-card variant="outlined" class="pa-4">
                          <div class="text-subtitle-1 mb-4">Item Highlighting</div>
                          
                          <v-switch
                            v-model="itemDialog.form.featured"
                            color="primary"
                            label="Featured Item"
                            hint="Feature this item on your menu"
                            persistent-hint
                          ></v-switch>
                          
                          <v-switch
                            v-model="itemDialog.form.isNew"
                            color="green"
                            label="New Item"
                            hint="Mark this as a new addition to your menu"
                            persistent-hint
                            class="mt-3"
                          ></v-switch>
                          
                          <v-switch
                            v-model="itemDialog.form.isBestSeller"
                            color="amber-darken-3"
                            label="Best Seller"
                            hint="Highlight this as one of your best selling items"
                            persistent-hint
                            class="mt-3"
                          ></v-switch>
                          
                          <v-switch
                            v-model="itemDialog.form.isSeasonalSpecial"
                            color="deep-purple"
                            label="Seasonal Special"
                            hint="Mark this as a seasonal or limited-time dish"
                            persistent-hint
                            class="mt-3"
                          ></v-switch>
                        </v-card>
                      </v-col>

                      <!-- Availability Schedule -->
                      <v-col cols="12">
                        <v-card variant="outlined" class="pa-4">
                          <div class="d-flex align-center mb-4">
                            <div class="text-subtitle-1">Availability Schedule</div>
                            <v-spacer></v-spacer>
                            <v-switch
                              v-model="itemDialog.form.hasSchedule"
                              label="Use Schedule"
                              color="primary"
                              hide-details
                            ></v-switch>
                          </div>

                          <v-expand-transition>
                            <div v-if="itemDialog.form.hasSchedule">
                              <v-row class="mt-2" v-for="(day, index) in daysOfWeek" :key="day">
                                <v-col cols="3">
                                  <v-checkbox 
                                    v-model="itemDialog.form.schedule[index].active" 
                                    :label="day"
                                    hide-details
                                  ></v-checkbox>
                                </v-col>
                                <v-col cols="4">
                                  <v-text-field
                                    v-model="itemDialog.form.schedule[index].from"
                                    label="From"
                                    type="time"
                                    density="comfortable"
                                    :disabled="!itemDialog.form.schedule[index].active"
                                  ></v-text-field>
                                </v-col>
                                <v-col cols="4">
                                  <v-text-field
                                    v-model="itemDialog.form.schedule[index].to"
                                    label="To"
                                    type="time"
                                    density="comfortable"
                                    :disabled="!itemDialog.form.schedule[index].active"
                                  ></v-text-field>
                                </v-col>
                              </v-row>
                            </div>
                          </v-expand-transition>
                        </v-card>
                      </v-col>
                    </v-row>
                  </v-window-item>
                </v-window>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="closeItemDialog"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :loading="itemDialog.loading"
            @click="saveItem"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog.show" max-width="400">
      <v-card>
        <v-card-title>Delete {{ deleteDialog.type }}</v-card-title>
        <v-card-text>
          Are you sure you want to delete "{{ deleteDialog.item?.name }}"?
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
            :loading="deleteDialog.loading"
            @click="handleDelete"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import draggable from 'vuedraggable'

export default {
  name: 'MenuManagement',
  
  components: {
    draggable
  },
  
  setup() {
    const store = useStore()
    const itemForm = ref(null)
    const categoryForm = ref(null)
    
    // State
    const loading = ref(false)
    const searchQuery = ref('')
    const selectedCategory = ref(null)
    const selectedStatus = ref(null)
    const selectedHighlight = ref(null)
    const imagePreview = ref(null)
    const activeItemTab = ref('basic')

    // Dialog states
    const categoryDialog = ref({
      show: false,
      isEdit: false,
      loading: false,
      form: {
        name: '',
        description: '',
        displayOrder: 0,
        isActive: true,
        hasSchedule: false,
        schedule: [
          { active: true, from: '', to: '' },
          { active: true, from: '', to: '' },
          { active: true, from: '', to: '' },
          { active: true, from: '', to: '' },
          { active: true, from: '', to: '' },
          { active: true, from: '', to: '' },
          { active: true, from: '', to: '' }
        ]
      }
    })

    const itemDialog = ref({
      show: false,
      isEdit: false,
      loading: false,
      form: {
        name: '',
        description: '',
        price: 0,
        categoryId: null,
        image: null,
        sizes: [],
        toppings: [],
        dietaryTags: [],
        available: true,
        featured: false,
        imageUrl: null,
        status: 'available',
        unavailableUntil: '',
        hasSchedule: false,
        schedule: [
          { active: true, from: '', to: '' },
          { active: true, from: '', to: '' },
          { active: true, from: '', to: '' },
          { active: true, from: '', to: '' },
          { active: true, from: '', to: '' },
          { active: true, from: '', to: '' },
          { active: true, from: '', to: '' }
        ]
      }
    })

    const deleteDialog = ref({
      show: false,
      loading: false,
      type: '',
      item: null
    })

    // Validation rules
    const rules = {
      required: v => !!v || 'This field is required',
      price: v => v >= 0 || 'Price must be non-negative'
    }

    // Computed
    const categories = computed(() => store.state.restaurantAdmin.categories)
    const menuItems = computed(() => store.state.restaurantAdmin.menuItems)
    
    // Sortable categories with drag-and-drop functionality
    const sortableCategories = computed({
      get: () => {
        return [...categories.value].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
      },
      set: (newValue) => {
        // This will be handled by handleCategoryReorder
      }
    })

    // Table headers for the data table
    const tableHeaders = [
      { title: 'Hình ảnh', key: 'image', sortable: false },
      { title: 'Tên món', key: 'name', align: 'start' },
      { title: 'Danh mục', key: 'categoryId' },
      { title: 'Giá', key: 'price' },
      { title: 'T.gian chuẩn bị', key: 'prepTime' },
      { title: 'Trạng thái', key: 'status' },
      { title: 'Thao tác', key: 'actions', sortable: false, align: 'end' }
    ]

    // Status options for filter dropdown
    const statusOptions = [
      { title: 'Available', value: 'available' },
      { title: 'Out of Stock', value: 'out_of_stock' },
      { title: 'Temporarily Unavailable', value: 'unavailable' }
    ]

    // Highlight options for filter dropdown
    const highlightOptions = [
      { title: 'Featured', value: 'featured' },
      { title: 'New Items', value: 'new' },
      { title: 'Best Sellers', value: 'bestseller' },
      { title: 'Seasonal Specials', value: 'seasonal' }
    ]
    
    const filteredItems = computed(() => {
      let items = [...menuItems.value]
      
      if (selectedCategory.value) {
        items = items.filter(item => item.categoryId === selectedCategory.value)
      }
      
      if (selectedStatus.value) {
        items = items.filter(item => {
          const itemStatus = item.status || (item.available ? 'available' : 'out_of_stock')
          return itemStatus === selectedStatus.value
        })
      }
      
      if (selectedHighlight.value) {
        switch (selectedHighlight.value) {
          case 'featured':
            items = items.filter(item => item.featured)
            break
          case 'new':
            items = items.filter(item => item.isNew)
            break
          case 'bestseller':
            items = items.filter(item => item.isBestSeller)
            break
          case 'seasonal':
            items = items.filter(item => item.isSeasonalSpecial)
            break
        }
      }
      
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        items = items.filter(item => 
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
        )
      }
      
      return items
    })

    // Methods
    const loadData = async () => {
      loading.value = true
      try {
        await Promise.all([
          store.dispatch('restaurantAdmin/fetchCategories'),
          store.dispatch('restaurantAdmin/fetchMenuItems')
        ])
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        loading.value = false
      }
    }

    const getCategoryName = (categoryId) => {
      const category = categories.value.find(c => c.id === categoryId)
      return category ? category.name : 'Uncategorized'
    }

    // Category methods
    const openCategoryDialog = (category = null) => {
      categoryDialog.value.isEdit = !!category
      categoryDialog.value.form = category
        ? { ...category }
        : { name: '', description: '', displayOrder: 0, isActive: true, hasSchedule: false, schedule: [{ active: true, from: '', to: '' }, { active: true, from: '', to: '' }, { active: true, from: '', to: '' }, { active: true, from: '', to: '' }, { active: true, from: '', to: '' }, { active: true, from: '', to: '' }, { active: true, from: '', to: '' }] }
      categoryDialog.value.show = true
    }

    const saveCategory = async () => {
      if (!categoryForm.value.validate()) return

      categoryDialog.value.loading = true
      try {
        if (categoryDialog.value.isEdit) {
          await store.dispatch('restaurantAdmin/updateCategory', categoryDialog.value.form)
        } else {
          await store.dispatch('restaurantAdmin/createCategory', categoryDialog.value.form)
        }
        categoryDialog.value.show = false
        await loadData()
      } catch (error) {
        console.error('Failed to save category:', error)
      } finally {
        categoryDialog.value.loading = false
      }
    }

    const confirmDeleteCategory = (category) => {
      deleteDialog.value = {
        show: true,
        loading: false,
        type: 'Category',
        item: category
      }
    }

    // Item methods
    const openItemDialog = (item = null) => {
      itemDialog.value.isEdit = !!item
      itemDialog.value.form = item
        ? { 
            ...item,
            image: null,
            sizes: [...(item.sizes || [])],
            toppings: [...(item.toppings || [])],
            dietaryTags: [...(item.dietaryTags || [])],
            available: item.available,
            featured: item.featured,
            imageUrl: item.imageUrl || null,
            status: item.status || 'available',
            unavailableUntil: item.unavailableUntil || '',
            hasSchedule: item.hasSchedule || false,
            schedule: [...(item.schedule || [{ active: true, from: '', to: '' }, { active: true, from: '', to: '' }, { active: true, from: '', to: '' }, { active: true, from: '', to: '' }, { active: true, from: '', to: '' }, { active: true, from: '', to: '' }, { active: true, from: '', to: '' }])]
          }
        : {
            name: '',
            description: '',
            price: 0,
            categoryId: null,
            image: null,
            sizes: [],
            toppings: [],
            dietaryTags: [],
            available: true,
            featured: false,
            imageUrl: null,
            status: 'available',
            unavailableUntil: '',
            hasSchedule: false,
            schedule: [{ active: true, from: '', to: '' }, { active: true, from: '', to: '' }, { active: true, from: '', to: '' }, { active: true, from: '', to: '' }, { active: true, from: '', to: '' }, { active: true, from: '', to: '' }, { active: true, from: '', to: '' }]
          }
      itemDialog.value.show = true
    }

    const closeItemDialog = () => {
      itemDialog.value.show = false
      itemDialog.value.form = {
        name: '',
        description: '',
        price: 0,
        categoryId: null,
        image: null,
        sizes: [],
        toppings: [],
        dietaryTags: [],
        available: true,
        featured: false,
        imageUrl: null,
        status: 'available',
        unavailableUntil: '',
        hasSchedule: false,
        schedule: [{ active: true, from: '', to: '' }, { active: true, from: '', to: '' }, { active: true, from: '', to: '' }, { active: true, from: '', to: '' }, { active: true, from: '', to: '' }, { active: true, from: '', to: '' }, { active: true, from: '', to: '' }]
      }
      imagePreview.value = null
    }

    const handleImagePreview = (file) => {
      if (!file) {
        imagePreview.value = null
        return
      }

      const reader = new FileReader()
      reader.onload = e => {
        imagePreview.value = e.target.result
      }
      reader.readAsDataURL(file)
    }

    const addSizeOption = () => {
      itemDialog.value.form.sizes.push({
        name: '',
        price: 0
      })
    }

    const removeSizeOption = (index) => {
      itemDialog.value.form.sizes.splice(index, 1)
    }

    const addTopping = () => {
      itemDialog.value.form.toppings.push({
        name: '',
        price: 0
      })
    }

    const removeTopping = (index) => {
      itemDialog.value.form.toppings.splice(index, 1)
    }

    const saveItem = async () => {
      if (!itemForm.value.validate()) return

      itemDialog.value.loading = true
      try {
        const formData = new FormData()
        Object.keys(itemDialog.value.form).forEach(key => {
          if (key === 'image' && itemDialog.value.form[key]) {
            formData.append('image', itemDialog.value.form[key])
          } else if (['sizes', 'toppings', 'dietaryTags', 'spiceLevels', 'schedule'].includes(key)) {
            formData.append(key, JSON.stringify(itemDialog.value.form[key]))
          } else {
            formData.append(key, itemDialog.value.form[key])
          }
        })

        if (itemDialog.value.isEdit) {
          await store.dispatch('restaurantAdmin/updateMenuItem', {
            id: itemDialog.value.form.id,
            data: formData
          })
        } else {
          await store.dispatch('restaurantAdmin/createMenuItem', formData)
        }
        closeItemDialog()
        await loadData()
      } catch (error) {
        console.error('Failed to save menu item:', error)
      } finally {
        itemDialog.value.loading = false
      }
    }

    const confirmDeleteItem = (item) => {
      deleteDialog.value = {
        show: true,
        loading: false,
        type: 'Menu Item',
        item: item
      }
    }

    const handleDelete = async () => {
      if (!deleteDialog.value.item) return

      deleteDialog.value.loading = true
      try {
        if (deleteDialog.value.type === 'Category') {
          await store.dispatch('restaurantAdmin/deleteCategory', deleteDialog.value.item.id)
        } else {
          await store.dispatch('restaurantAdmin/deleteMenuItem', deleteDialog.value.item.id)
        }
        deleteDialog.value.show = false
        await loadData()
      } catch (error) {
        console.error('Failed to delete:', error)
      } finally {
        deleteDialog.value.loading = false
      }
    }

    const toggleItemAvailability = async (item) => {
      try {
        await store.dispatch('restaurantAdmin/updateMenuItem', {
          id: item.id,
          data: { available: item.available }
        })
      } catch (error) {
        item.available = !item.available // Revert on error
        console.error('Failed to update item availability:', error)
      }
    }

    const dietaryOptions = [
      { label: 'Vegetarian', value: 'vegetarian', icon: 'mdi-leaf' },
      { label: 'Vegan', value: 'vegan', icon: 'mdi-sprout' },
      { label: 'Gluten Free', value: 'gluten_free', icon: 'mdi-grain-off' },
      { label: 'Halal', value: 'halal', icon: 'mdi-food-halal' },
      { label: 'Contains Nuts', value: 'nuts', icon: 'mdi-peanut' },
      { label: 'Spicy', value: 'spicy', icon: 'mdi-pepper-hot' }
    ]

    const toppingSelectionTypes = ['Single', 'Multiple', 'Optional']

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    // Handle category reordering
    const handleCategoryReorder = async () => {
      try {
        // Calculate new display order values based on current array positions
        const updatedCategories = sortableCategories.value.map((category, index) => ({
          ...category,
          displayOrder: index
        }))
        
        // Update each category with its new order
        for (const category of updatedCategories) {
          await store.dispatch('restaurantAdmin/updateMenuCategory', {
            id: category.id,
            displayOrder: category.displayOrder
          })
        }
        
        // Refresh the categories
        await store.dispatch('restaurantAdmin/fetchMenuCategories')
      } catch (error) {
        console.error('Failed to reorder categories:', error)
      }
    }

    // Item Status methods
    const getStatusColor = (status) => {
      switch (status) {
        case 'available':
          return 'success'
        case 'out_of_stock':
          return 'error'
        case 'unavailable':
          return 'warning'
        default:
          return 'grey'
      }
    }

    const getStatusTextColor = (status) => {
      return ['available', 'out_of_stock', 'unavailable'].includes(status) ? 'white' : 'black'
    }

    const getStatusLabel = (status) => {
      switch (status) {
        case 'available':
          return 'Available'
        case 'out_of_stock':
          return 'Out of Stock'
        case 'unavailable':
          return 'Temporarily Unavailable'
        default:
          return 'Unknown'
      }
    }

    const updateItemStatus = async (item, status) => {
      try {
        await store.dispatch('restaurantAdmin/updateMenuItem', {
          id: item.id,
          data: { status }
        })
        
        // Update local item status
        const updatedItem = menuItems.value.find(i => i.id === item.id)
        if (updatedItem) {
          updatedItem.status = status
        }
      } catch (error) {
        console.error('Failed to update item status:', error)
      }
    }

    // Highlight methods
    const toggleFeatured = async (item) => {
      try {
        await store.dispatch('restaurantAdmin/updateMenuItem', {
          id: item.id,
          data: { featured: !item.featured }
        })
        
        // Update local item featured status
        const updatedItem = menuItems.value.find(i => i.id === item.id)
        if (updatedItem) {
          updatedItem.featured = !item.featured
        }
      } catch (error) {
        console.error('Failed to toggle featured status:', error)
      }
    }

    const toggleNew = async (item) => {
      try {
        await store.dispatch('restaurantAdmin/updateMenuItem', {
          id: item.id,
          data: { isNew: !item.isNew }
        })
        
        // Update local item isNew status
        const updatedItem = menuItems.value.find(i => i.id === item.id)
        if (updatedItem) {
          updatedItem.isNew = !item.isNew
        }
      } catch (error) {
        console.error('Failed to toggle new status:', error)
      }
    }

    const toggleBestSeller = async (item) => {
      try {
        await store.dispatch('restaurantAdmin/updateMenuItem', {
          id: item.id,
          data: { isBestSeller: !item.isBestSeller }
        })
        
        // Update local item best seller status
        const updatedItem = menuItems.value.find(i => i.id === item.id)
        if (updatedItem) {
          updatedItem.isBestSeller = !item.isBestSeller
        }
      } catch (error) {
        console.error('Failed to toggle best seller status:', error)
      }
    }

    // Spice level methods
    const addSpiceLevel = () => {
      if (!itemDialog.value.form.spiceLevels) {
        itemDialog.value.form.spiceLevels = []
      }
      itemDialog.value.form.spiceLevels.push({
        name: '',
        value: 1
      })
    }

    const removeSpiceLevel = (index) => {
      itemDialog.value.form.spiceLevels.splice(index, 1)
    }

    // Initialize
    onMounted(() => {
      loadData()
    })

    return {
      // State
      loading,
      searchQuery,
      selectedCategory,
      selectedStatus,
      selectedHighlight,
      imagePreview,
      categoryDialog,
      itemDialog,
      deleteDialog,
      itemForm,
      categoryForm,
      categories,
      menuItems,
      filteredItems,
      rules,
      dietaryOptions,
      toppingSelectionTypes,
      daysOfWeek,
      activeItemTab,
      sortableCategories,
      tableHeaders,
      statusOptions,
      highlightOptions,

      // Methods
      getCategoryName,
      openCategoryDialog,
      saveCategory,
      confirmDeleteCategory,
      openItemDialog,
      closeItemDialog,
      handleImagePreview,
      addSizeOption,
      removeSizeOption,
      addTopping,
      removeTopping,
      addSpiceLevel,
      removeSpiceLevel,
      saveItem,
      confirmDeleteItem,
      handleDelete,
      toggleItemAvailability,
      handleCategoryReorder,
      getStatusColor,
      getStatusTextColor,
      getStatusLabel,
      updateItemStatus,
      toggleFeatured,
      toggleNew,
      toggleBestSeller
    }
  }
}
</script>

<style scoped>
.v-table img {
  object-fit: cover;
  border-radius: 4px;
}
</style>