<template>
  <v-container class="profile-page py-8">
    <h1 class="text-h4 font-weight-bold mb-6">My Profile</h1>

    <div v-if="isLoading" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4">Loading your profile...</p>
    </div>

    <v-row v-else>
      <!-- Left side - Profile info and navigation -->
      <v-col cols="12" md="4" class="pb-md-0">
        <v-card class="profile-sidebar mb-4">
          <v-card-text class="text-center pa-6">
            <v-avatar size="120" class="mb-4">
              <v-img
                v-if="user.avatar"
                :src="user.avatar"
                alt="Profile Avatar"
              ></v-img>
              <v-icon v-else size="60" color="primary">mdi-account</v-icon>
            </v-avatar>
            <h2 class="text-h5 font-weight-bold mb-1">{{ user.firstName }} {{ user.lastName }}</h2>
            <p class="text-body-1 text-medium-emphasis mb-4">{{ user.email }}</p>
            <v-btn 
              prepend-icon="mdi-image-edit"
              variant="outlined"
              @click="uploadAvatar"
            >
              Change Avatar
            </v-btn>
          </v-card-text>
        </v-card>

        <v-card>
          <v-list>
            <v-list-item
              prepend-icon="mdi-account-outline"
              title="Personal Information"
              :active="activeTab === 'personal'"
              @click="activeTab = 'personal'"
            ></v-list-item>
            
            <v-list-item
              prepend-icon="mdi-map-marker-outline"
              title="Address Book"
              :active="activeTab === 'addresses'"
              @click="activeTab = 'addresses'"
            ></v-list-item>
            
            <v-list-item
              prepend-icon="mdi-credit-card-outline"
              title="Payment Methods"
              :active="activeTab === 'payment'"
              @click="activeTab = 'payment'"
            ></v-list-item>
            
            <v-list-item
              prepend-icon="mdi-bell-outline"
              title="Notifications"
              :active="activeTab === 'notifications'"
              @click="activeTab = 'notifications'"
            ></v-list-item>
            
            <v-list-item
              prepend-icon="mdi-history"
              title="Order History"
              :active="activeTab === 'orders'"
              @click="activeTab = 'orders'"
            ></v-list-item>
            
            <v-list-item
              prepend-icon="mdi-shield-account-outline"
              title="Privacy & Security"
              :active="activeTab === 'privacy'"
              @click="activeTab = 'privacy'"
            ></v-list-item>
            
            <v-divider></v-divider>
            
            <v-list-item 
              prepend-icon="mdi-logout" 
              title="Logout"
              color="error"
              @click="logout"
            ></v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <!-- Right side - Content based on selected tab -->
      <v-col cols="12" md="8">
        <v-sheet class="pa-0" rounded>
          <!-- Personal Information Tab -->
          <div v-if="activeTab === 'personal'">
            <h2 class="text-h5 mb-6">Personal Information</h2>
            
            <v-form ref="personalForm" v-model="isPersonalFormValid" @submit.prevent="updatePersonalInfo">
              <v-card class="mb-4">
                <v-card-text>
                  <v-row>
                    <v-col cols="12" sm="6">
                      <v-text-field
                        v-model="personalInfo.firstName"
                        label="First Name"
                        variant="outlined"
                        :rules="nameRules"
                        required
                      ></v-text-field>
                    </v-col>
                    
                    <v-col cols="12" sm="6">
                      <v-text-field
                        v-model="personalInfo.lastName"
                        label="Last Name"
                        variant="outlined"
                        :rules="nameRules"
                        required
                      ></v-text-field>
                    </v-col>
                  </v-row>
                  
                  <v-text-field
                    v-model="personalInfo.email"
                    label="Email"
                    type="email"
                    variant="outlined"
                    :rules="emailRules"
                    required
                    disabled
                  ></v-text-field>
                  
                  <v-text-field
                    v-model="personalInfo.phone"
                    label="Phone Number"
                    variant="outlined"
                    :rules="phoneRules"
                    required
                  ></v-text-field>
                  
                  <v-select
                    v-model="personalInfo.language"
                    label="Preferred Language"
                    :items="languages"
                    variant="outlined"
                  ></v-select>
                </v-card-text>
                
                <v-divider></v-divider>
                
                <v-card-actions class="pa-4">
                  <v-spacer></v-spacer>
                  <v-btn
                    color="primary"
                    type="submit"
                    :loading="isSaving"
                    :disabled="!isPersonalFormValid || isSaving"
                  >
                    Save Changes
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-form>
            
            <h3 class="text-h6 mb-4">Change Password</h3>
            <v-form ref="passwordForm" v-model="isPasswordFormValid" @submit.prevent="updatePassword">
              <v-card>
                <v-card-text>
                  <v-text-field
                    v-model="passwordInfo.currentPassword"
                    label="Current Password"
                    :type="showCurrentPassword ? 'text' : 'password'"
                    variant="outlined"
                    :rules="[v => !!v || 'Current password is required']"
                    required
                    :append-inner-icon="showCurrentPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    @click:append-inner="showCurrentPassword = !showCurrentPassword"
                  ></v-text-field>
                  
                  <v-text-field
                    v-model="passwordInfo.newPassword"
                    label="New Password"
                    :type="showNewPassword ? 'text' : 'password'"
                    variant="outlined"
                    :rules="passwordRules"
                    required
                    :append-inner-icon="showNewPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    @click:append-inner="showNewPassword = !showNewPassword"
                  ></v-text-field>
                  
                  <v-text-field
                    v-model="passwordInfo.confirmPassword"
                    label="Confirm New Password"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    variant="outlined"
                    :rules="confirmPasswordRules"
                    required
                    :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    @click:append-inner="showConfirmPassword = !showConfirmPassword"
                  ></v-text-field>
                  
                  <div v-if="passwordError" class="text-error mb-2">{{ passwordError }}</div>
                </v-card-text>
                
                <v-divider></v-divider>
                
                <v-card-actions class="pa-4">
                  <v-spacer></v-spacer>
                  <v-btn
                    color="primary"
                    type="submit"
                    :loading="isChangingPassword"
                    :disabled="!isPasswordFormValid || isChangingPassword"
                  >
                    Update Password
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-form>
          </div>

          <!-- Address Book Tab -->
          <div v-else-if="activeTab === 'addresses'">
            <div class="d-flex justify-space-between align-center mb-6">
              <h2 class="text-h5">Saved Addresses</h2>
              <v-btn
                color="primary"
                prepend-icon="mdi-plus"
                @click="showNewAddressForm = true"
              >
                Add New Address
              </v-btn>
            </div>
            
            <v-card v-if="showNewAddressForm" class="mb-4">
              <v-card-title>Add New Address</v-card-title>
              <v-card-text>
                <v-form ref="addressForm" v-model="isAddressFormValid">
                  <v-text-field
                    v-model="newAddress.name"
                    label="Address Name (e.g. Home, Work)"
                    variant="outlined"
                    :rules="[v => !!v || 'Address name is required']"
                    required
                  ></v-text-field>
                  
                  <v-text-field
                    v-model="newAddress.address"
                    label="Street Address"
                    variant="outlined"
                    :rules="[v => !!v || 'Street address is required']"
                    required
                  ></v-text-field>
                  
                  <v-row>
                    <v-col cols="12" sm="6">
                      <v-text-field
                        v-model="newAddress.city"
                        label="City"
                        variant="outlined"
                        :rules="[v => !!v || 'City is required']"
                        required
                      ></v-text-field>
                    </v-col>
                    <v-col cols="6" sm="3">
                      <v-text-field
                        v-model="newAddress.state"
                        label="State"
                        variant="outlined"
                        :rules="[v => !!v || 'State is required']"
                        required
                      ></v-text-field>
                    </v-col>
                    <v-col cols="6" sm="3">
                      <v-text-field
                        v-model="newAddress.zipcode"
                        label="ZIP Code"
                        variant="outlined"
                        :rules="[v => !!v || 'ZIP code is required', v => /^\d{5}(-\d{4})?$/.test(v) || 'Invalid ZIP format']"
                        required
                      ></v-text-field>
                    </v-col>
                  </v-row>
                  
                  <v-text-field
                    v-model="newAddress.instructions"
                    label="Delivery Instructions (optional)"
                    variant="outlined"
                  ></v-text-field>
                  
                  <v-checkbox
                    v-model="newAddress.default"
                    label="Set as default address"
                  ></v-checkbox>
                </v-form>
              </v-card-text>
              
              <v-divider></v-divider>
              
              <v-card-actions class="pa-4">
                <v-btn
                  variant="text"
                  @click="showNewAddressForm = false"
                >
                  Cancel
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn
                  color="primary"
                  :disabled="!isAddressFormValid || isSaving"
                  :loading="isSaving"
                  @click="addNewAddress"
                >
                  Save Address
                </v-btn>
              </v-card-actions>
            </v-card>
            
            <div v-if="!showNewAddressForm && addresses.length === 0" class="text-center py-6">
              <v-icon size="64" color="grey">mdi-map-marker-off</v-icon>
              <h3 class="text-h6 mt-4 mb-2">No saved addresses</h3>
              <p class="mb-4">Add a new address to streamline your checkout process</p>
            </div>
            
            <v-card
              v-for="(address, index) in addresses"
              :key="index"
              class="mb-4"
            >
              <v-card-text>
                <div class="d-flex align-start justify-space-between">
                  <div>
                    <div class="d-flex align-center">
                      <h3 class="text-subtitle-1 font-weight-bold">{{ address.name }}</h3>
                      <v-chip
                        v-if="address.default"
                        size="small"
                        color="success"
                        class="ml-3"
                      >
                        Default
                      </v-chip>
                    </div>
                    <p class="mt-2 mb-0">{{ address.address }}</p>
                    <p class="mb-0">{{ address.city }}, {{ address.state }} {{ address.zipcode }}</p>
                    <p v-if="address.instructions" class="text-caption text-medium-emphasis mt-2">
                      {{ address.instructions }}
                    </p>
                  </div>
                  
                  <div>
                    <v-btn
                      icon="mdi-pencil"
                      variant="text"
                      size="small"
                      @click="editAddress(index)"
                    ></v-btn>
                    <v-btn
                      icon="mdi-delete"
                      variant="text"
                      size="small"
                      color="error"
                      @click="deleteAddress(index)"
                    ></v-btn>
                  </div>
                </div>
              </v-card-text>
              
              <v-divider v-if="!address.default"></v-divider>
              
              <v-card-actions v-if="!address.default">
                <v-spacer></v-spacer>
                <v-btn
                  variant="text"
                  color="primary"
                  @click="setDefaultAddress(index)"
                >
                  Set as Default
                </v-btn>
              </v-card-actions>
            </v-card>
          </div>

          <!-- Payment Methods Tab -->
          <div v-else-if="activeTab === 'payment'">
            <div class="d-flex justify-space-between align-center mb-6">
              <h2 class="text-h5">Payment Methods</h2>
              <v-btn
                color="primary"
                prepend-icon="mdi-plus"
                @click="showNewCardForm = true"
              >
                Add New Card
              </v-btn>
            </div>
            
            <v-card v-if="showNewCardForm" class="mb-4">
              <v-card-title>Add New Card</v-card-title>
              <v-card-text>
                <v-form ref="cardForm" v-model="isCardFormValid">
                  <v-text-field
                    v-model="newCard.name"
                    label="Name on Card"
                    variant="outlined"
                    :rules="[v => !!v || 'Name is required']"
                    required
                  ></v-text-field>
                  
                  <v-text-field
                    v-model="newCard.number"
                    label="Card Number"
                    variant="outlined"
                    :rules="[v => !!v || 'Card number is required', v => /^\d{16}$/.test(v.replace(/\s/g, '')) || 'Invalid card number']"
                    maxlength="19"
                    @input="formatCardNumber"
                    required
                  ></v-text-field>
                  
                  <v-row>
                    <v-col cols="6">
                      <v-text-field
                        v-model="newCard.expiry"
                        label="Expiry (MM/YY)"
                        variant="outlined"
                        :rules="[v => !!v || 'Expiry date is required', v => /^(0[1-9]|1[0-2])\/\d{2}$/.test(v) || 'Invalid expiry date']"
                        maxlength="5"
                        @input="formatExpiryDate"
                        required
                      ></v-text-field>
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                        v-model="newCard.cvv"
                        label="CVV"
                        variant="outlined"
                        :rules="[v => !!v || 'CVV is required', v => /^\d{3,4}$/.test(v) || 'Invalid CVV']"
                        maxlength="4"
                        type="password"
                        required
                      ></v-text-field>
                    </v-col>
                  </v-row>
                  
                  <v-checkbox
                    v-model="newCard.default"
                    label="Set as default payment method"
                  ></v-checkbox>
                </v-form>
              </v-card-text>
              
              <v-divider></v-divider>
              
              <v-card-actions class="pa-4">
                <v-btn
                  variant="text"
                  @click="showNewCardForm = false"
                >
                  Cancel
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn
                  color="primary"
                  :disabled="!isCardFormValid || isSaving"
                  :loading="isSaving"
                  @click="addNewCard"
                >
                  Save Card
                </v-btn>
              </v-card-actions>
            </v-card>
            
            <div v-if="!showNewCardForm && paymentMethods.length === 0" class="text-center py-6">
              <v-icon size="64" color="grey">mdi-credit-card-off</v-icon>
              <h3 class="text-h6 mt-4 mb-2">No saved payment methods</h3>
              <p class="mb-4">Add a payment method to make checkout faster</p>
            </div>
            
            <v-card
              v-for="(card, index) in paymentMethods"
              :key="index"
              class="mb-4"
            >
              <v-card-text>
                <div class="d-flex align-start justify-space-between">
                  <div>
                    <div class="d-flex align-center">
                      <v-icon size="32" :color="getCardType(card.number).color" class="mr-2">
                        {{ getCardType(card.number).icon }}
                      </v-icon>
                      <div>
                        <h3 class="text-subtitle-1 font-weight-bold mb-1">
                          {{ getCardType(card.number).name }} •••• {{ card.number.slice(-4) }}
                        </h3>
                        <p class="text-caption text-medium-emphasis mb-0">
                          {{ card.name }} | Expires {{ card.expiry }}
                        </p>
                      </div>
                      <v-chip
                        v-if="card.default"
                        size="small"
                        color="success"
                        class="ml-3"
                      >
                        Default
                      </v-chip>
                    </div>
                  </div>
                  
                  <div>
                    <v-btn
                      icon="mdi-pencil"
                      variant="text"
                      size="small"
                      @click="editCard(index)"
                    ></v-btn>
                    <v-btn
                      icon="mdi-delete"
                      variant="text"
                      size="small"
                      color="error"
                      @click="deleteCard(index)"
                    ></v-btn>
                  </div>
                </div>
              </v-card-text>
              
              <v-divider v-if="!card.default"></v-divider>
              
              <v-card-actions v-if="!card.default">
                <v-spacer></v-spacer>
                <v-btn
                  variant="text"
                  color="primary"
                  @click="setDefaultCard(index)"
                >
                  Set as Default
                </v-btn>
              </v-card-actions>
            </v-card>
          </div>

          <!-- Notifications Tab -->
          <div v-else-if="activeTab === 'notifications'">
            <h2 class="text-h5 mb-6">Notification Settings</h2>
            
            <v-card>
              <v-card-text>
                <div class="d-flex justify-space-between align-center mb-4">
                  <div>
                    <h3 class="text-subtitle-1 font-weight-bold mb-1">Email Notifications</h3>
                    <p class="text-caption text-medium-emphasis mb-0">Receive updates about your orders via email</p>
                  </div>
                  <v-switch v-model="notifications.email" color="primary" hide-details></v-switch>
                </div>
                
                <v-divider class="my-4"></v-divider>
                
                <div class="d-flex justify-space-between align-center mb-4">
                  <div>
                    <h3 class="text-subtitle-1 font-weight-bold mb-1">SMS Notifications</h3>
                    <p class="text-caption text-medium-emphasis mb-0">Receive text messages about your orders</p>
                  </div>
                  <v-switch v-model="notifications.sms" color="primary" hide-details></v-switch>
                </div>
                
                <v-divider class="my-4"></v-divider>
                
                <div class="d-flex justify-space-between align-center mb-4">
                  <div>
                    <h3 class="text-subtitle-1 font-weight-bold mb-1">Push Notifications</h3>
                    <p class="text-caption text-medium-emphasis mb-0">Receive push notifications on your device</p>
                  </div>
                  <v-switch v-model="notifications.push" color="primary" hide-details></v-switch>
                </div>
                
                <v-divider class="my-4"></v-divider>
                
                <div class="d-flex justify-space-between align-center mb-4">
                  <div>
                    <h3 class="text-subtitle-1 font-weight-bold mb-1">Promotional Emails</h3>
                    <p class="text-caption text-medium-emphasis mb-0">Receive special offers and promotions</p>
                  </div>
                  <v-switch v-model="notifications.promotional" color="primary" hide-details></v-switch>
                </div>
              </v-card-text>
              
              <v-divider></v-divider>
              
              <v-card-actions class="pa-4">
                <v-spacer></v-spacer>
                <v-btn
                  color="primary"
                  @click="saveNotificationSettings"
                  :loading="isSaving"
                >
                  Save Settings
                </v-btn>
              </v-card-actions>
            </v-card>
          </div>

          <!-- Order History Tab -->
          <div v-else-if="activeTab === 'orders'">
            <div class="d-flex justify-space-between align-center mb-6">
              <h2 class="text-h5">Order History</h2>
              <v-text-field
                v-model="orderSearch"
                append-inner-icon="mdi-magnify"
                label="Search orders"
                density="compact"
                hide-details
                variant="outlined"
                class="max-width-200"
              ></v-text-field>
            </div>
            
            <div v-if="filteredOrders.length === 0" class="text-center py-6">
              <v-icon size="64" color="grey">mdi-package-variant</v-icon>
              <h3 class="text-h6 mt-4 mb-2">No orders found</h3>
              <p class="mb-4">You haven't placed any orders yet</p>
              <v-btn color="primary" to="/">Browse Restaurants</v-btn>
            </div>
            
            <v-card
              v-for="(order, index) in filteredOrders"
              :key="order.id"
              class="mb-4"
              :class="{ 'border-primary': order.status === 'active' }"
            >
              <v-card-title class="d-flex justify-space-between align-center">
                <div>
                  <span class="text-subtitle-1">Order #{{ order.orderNumber }}</span>
                  <v-chip
                    size="small"
                    :color="getOrderStatusColor(order.status)"
                    class="ml-2"
                  >
                    {{ getOrderStatusText(order.status) }}
                  </v-chip>
                </div>
                <span class="text-caption text-medium-emphasis">{{ formatDate(order.date) }}</span>
              </v-card-title>
              
              <v-divider></v-divider>
              
              <v-card-text>
                <div class="d-flex align-start mb-4">
                  <v-avatar size="48" class="mr-4">
                    <v-img :src="order.restaurant.image" alt="Restaurant"></v-img>
                  </v-avatar>
                  <div>
                    <h3 class="text-subtitle-1 font-weight-bold mb-1">{{ order.restaurant.name }}</h3>
                    <p class="text-caption text-medium-emphasis mb-0">{{ order.restaurant.address }}</p>
                  </div>
                </div>
                
                <v-list density="compact" class="bg-transparent pa-0">
                  <v-list-item
                    v-for="(item, itemIndex) in order.items"
                    :key="itemIndex"
                    class="px-0"
                  >
                    <template v-slot:prepend>
                      <span class="text-body-2 mr-2">{{ item.quantity }}x</span>
                    </template>
                    <v-list-item-title class="text-body-2">
                      {{ item.name }}
                    </v-list-item-title>
                    <template v-slot:append>
                      <span class="text-body-2">${{ (item.price * item.quantity).toFixed(2) }}</span>
                    </template>
                  </v-list-item>
                </v-list>
                
                <v-divider class="my-3"></v-divider>
                
                <div class="d-flex justify-space-between text-body-2 mb-1">
                  <span>Subtotal</span>
                  <span>${{ order.subtotal.toFixed(2) }}</span>
                </div>
                <div class="d-flex justify-space-between text-body-2 mb-1">
                  <span>Delivery Fee</span>
                  <span>${{ order.deliveryFee.toFixed(2) }}</span>
                </div>
                <div class="d-flex justify-space-between text-body-2 mb-1">
                  <span>Tax</span>
                  <span>${{ order.tax.toFixed(2) }}</span>
                </div>
                <div class="d-flex justify-space-between text-subtitle-1 font-weight-bold mt-2">
                  <span>Total</span>
                  <span>${{ order.total.toFixed(2) }}</span>
                </div>
              </v-card-text>
              
              <v-divider></v-divider>
              
              <v-card-actions>
                <v-btn
                  variant="text"
                  prepend-icon="mdi-receipt"
                  @click="viewOrderDetails(order.id)"
                >
                  View Details
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn
                  v-if="order.status === 'delivered'"
                  color="primary"
                  variant="text"
                  prepend-icon="mdi-repeat"
                  @click="reorderItems(order.id)"
                >
                  Reorder
                </v-btn>
                <v-btn
                  v-if="order.status === 'active'"
                  color="error"
                  variant="text"
                  prepend-icon="mdi-close"
                  @click="cancelOrder(order.id)"
                >
                  Cancel Order
                </v-btn>
              </v-card-actions>
            </v-card>
            
            <div class="text-center mt-4" v-if="orders.length > displayedOrderCount">
              <v-btn
                variant="outlined"
                @click="loadMoreOrders"
              >
                Load More Orders
              </v-btn>
            </div>
          </div>

          <!-- Privacy & Security Tab -->
          <div v-else-if="activeTab === 'privacy'">
            <h2 class="text-h5 mb-6">Privacy & Security</h2>
            
            <v-card class="mb-4">
              <v-card-title>Privacy Settings</v-card-title>
              <v-card-text>
                <div class="d-flex justify-space-between align-center mb-4">
                  <div>
                    <h3 class="text-subtitle-1 font-weight-bold mb-1">Share Order History</h3>
                    <p class="text-caption text-medium-emphasis mb-0">Allow sharing of your order history for personalized recommendations</p>
                  </div>
                  <v-switch v-model="privacy.shareOrderHistory" color="primary" hide-details></v-switch>
                </div>
                
                <v-divider class="my-4"></v-divider>
                
                <div class="d-flex justify-space-between align-center">
                  <div>
                    <h3 class="text-subtitle-1 font-weight-bold mb-1">Location Tracking</h3>
                    <p class="text-caption text-medium-emphasis mb-0">Allow location tracking for better delivery experience</p>
                  </div>
                  <v-switch v-model="privacy.locationTracking" color="primary" hide-details></v-switch>
                </div>
              </v-card-text>
              
              <v-divider></v-divider>
              
              <v-card-actions class="pa-4">
                <v-spacer></v-spacer>
                <v-btn
                  color="primary"
                  @click="savePrivacySettings"
                  :loading="isSaving"
                >
                  Save Settings
                </v-btn>
              </v-card-actions>
            </v-card>
            
            <v-card class="mb-4">
              <v-card-title>Account Security</v-card-title>
              <v-card-text>
                <div class="d-flex justify-space-between align-center mb-4">
                  <div>
                    <h3 class="text-subtitle-1 font-weight-bold mb-1">Two-Factor Authentication</h3>
                    <p class="text-caption text-medium-emphasis mb-0">Add an extra layer of security to your account</p>
                  </div>
                  <v-btn
                    color="primary"
                    variant="outlined"
                    :disabled="privacy.twoFactorEnabled"
                    @click="setup2FA"
                  >
                    {{ privacy.twoFactorEnabled ? 'Enabled' : 'Enable' }}
                  </v-btn>
                </div>
                
                <v-divider class="my-4"></v-divider>
                
                <div class="d-flex justify-space-between align-center">
                  <div>
                    <h3 class="text-subtitle-1 font-weight-bold mb-1">Login Activity</h3>
                    <p class="text-caption text-medium-emphasis mb-0">View your recent login activity</p>
                  </div>
                  <v-btn
                    color="primary"
                    variant="text"
                    @click="viewLoginActivity"
                  >
                    View
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
            
            <v-card>
              <v-card-title class="text-error">Danger Zone</v-card-title>
              <v-card-text>
                <div class="d-flex justify-space-between align-center">
                  <div>
                    <h3 class="text-subtitle-1 font-weight-bold mb-1">Delete Account</h3>
                    <p class="text-caption text-medium-emphasis mb-0">Permanently delete your account and all your data</p>
                  </div>
                  <v-btn
                    color="error"
                    variant="outlined"
                    @click="showDeleteAccountDialog = true"
                  >
                    Delete Account
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </div>
        </v-sheet>
      </v-col>
    </v-row>

    <!-- Delete Account Dialog -->
    <v-dialog v-model="showDeleteAccountDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5">Delete Account</v-card-title>
        <v-card-text>
          <p class="mb-4">Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.</p>
          <v-text-field
            v-model="deleteAccountPassword"
            label="Enter your password to confirm"
            type="password"
            variant="outlined"
            :rules="[v => !!v || 'Password is required']"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showDeleteAccountDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            @click="deleteAccount"
            :loading="isDeleting"
            :disabled="!deleteAccountPassword"
          >
            Delete Account
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Login Activity Dialog -->
    <v-dialog v-model="showLoginActivityDialog" max-width="600">
      <v-card>
        <v-card-title class="text-h5">Login Activity</v-card-title>
        <v-card-text>
          <v-list>
            <v-list-item
              v-for="(activity, index) in loginActivity"
              :key="index"
            >
              <template v-slot:prepend>
                <v-icon :color="activity.current ? 'success' : undefined">
                  {{ activity.current ? 'mdi-check-circle' : 'mdi-information' }}
                </v-icon>
              </template>
              <v-list-item-title>
                {{ activity.device }}
                <v-chip v-if="activity.current" size="x-small" color="success" class="ml-2">Current</v-chip>
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ activity.location }} • {{ formatDate(activity.date) }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="error"
            variant="text"
            @click="logoutAllDevices"
            :loading="isLoggingOut"
          >
            Logout from all devices
          </v-btn>
          <v-btn
            color="primary"
            @click="showLoginActivityDialog = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
export default {
  name: 'UserProfile',
  data() {
    return {
      isLoading: true,
      activeTab: 'personal',
      isSaving: false,
      isChangingPassword: false,
      isDeleting: false,
      isLoggingOut: false,
      
      // User info
      user: {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '(555) 123-4567',
        avatar: null
      },
      
      // Personal form data
      isPersonalFormValid: true,
      personalInfo: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        language: 'English'
      },
      languages: [
        'English',
        'Spanish',
        'French',
        'German',
        'Chinese',
        'Japanese'
      ],
      nameRules: [
        v => !!v || 'Name is required',
        v => (v && v.length <= 50) || 'Name must be less than 50 characters'
      ],
      emailRules: [
        v => !!v || 'Email is required',
        v => /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v) || 'Email must be valid'
      ],
      phoneRules: [
        v => !!v || 'Phone number is required',
        v => /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(v) || 'Phone number must be valid'
      ],
      
      // Password form data
      isPasswordFormValid: true,
      passwordError: '',
      showCurrentPassword: false,
      showNewPassword: false,
      showConfirmPassword: false,
      passwordInfo: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      passwordRules: [
        v => !!v || 'Password is required',
        v => v.length >= 8 || 'Password must be at least 8 characters',
        v => /\d/.test(v) || 'Password must contain at least one number',
        v => /[A-Z]/.test(v) || 'Password must contain at least one uppercase letter'
      ],
      
      // Address book
      showNewAddressForm: false,
      isAddressFormValid: true,
      newAddress: {
        name: '',
        address: '',
        city: '',
        state: '',
        zipcode: '',
        instructions: '',
        default: false
      },
      addresses: [
        {
          id: 1,
          name: 'Home',
          address: '123 Main St, Apt 4B',
          city: 'New York',
          state: 'NY',
          zipcode: '10001',
          instructions: 'Ring doorbell twice',
          default: true
        },
        {
          id: 2,
          name: 'Work',
          address: '456 Business Ave',
          city: 'New York',
          state: 'NY',
          zipcode: '10002',
          instructions: 'Front desk reception',
          default: false
        }
      ],
      
      // Payment methods
      showNewCardForm: false,
      isCardFormValid: true,
      newCard: {
        name: '',
        number: '',
        expiry: '',
        cvv: '',
        default: false
      },
      paymentMethods: [
        {
          id: 1,
          name: 'John Doe',
          number: '4111111111111111',
          expiry: '12/25',
          default: true
        },
        {
          id: 2,
          name: 'John Doe',
          number: '5555555555554444',
          expiry: '10/24',
          default: false
        }
      ],
      
      // Notification settings
      notifications: {
        email: true,
        sms: true,
        push: true,
        promotional: false
      },
      
      // Privacy & security
      privacy: {
        shareOrderHistory: true,
        locationTracking: true,
        twoFactorEnabled: false
      },
      
      // Delete account
      showDeleteAccountDialog: false,
      deleteAccountPassword: '',
      
      // Login activity
      showLoginActivityDialog: false,
      loginActivity: [
        {
          device: 'Chrome on Windows',
          location: 'New York, NY',
          date: new Date(),
          current: true
        },
        {
          device: 'Safari on iPhone',
          location: 'New York, NY',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          current: false
        },
        {
          device: 'Firefox on MacOS',
          location: 'Boston, MA',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          current: false
        }
      ]
    };
  },
  computed: {
    confirmPasswordRules() {
      return [
        v => !!v || 'Confirm password is required',
        v => v === this.passwordInfo.newPassword || 'Passwords must match'
      ];
    }
  },
  created() {
    this.loadUserProfile();
  },
  methods: {
    loadUserProfile() {
      // Simulate API call
      setTimeout(() => {
        // Clone user data to forms
        this.personalInfo = {
          firstName: this.user.firstName,
          lastName: this.user.lastName,
          email: this.user.email,
          phone: this.user.phone,
          language: 'English'
        };
        
        this.isLoading = false;
      }, 1000);
    },
    
    uploadAvatar() {
      // In a real app, this would open a file picker and upload the image
      alert('This feature would open a file picker in a real app');
    },
    
    async updatePersonalInfo() {
      if (!this.$refs.personalForm.validate()) return;
      
      this.isSaving = true;
      
      try {
        // In a real app, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update user info with form data
        this.user.firstName = this.personalInfo.firstName;
        this.user.lastName = this.personalInfo.lastName;
        this.user.phone = this.personalInfo.phone;
        
        // Show success message
        this.$store.dispatch('ui/showSnackbar', {
          text: 'Personal information updated successfully',
          color: 'success'
        });
      } catch (error) {
        console.error('Error updating profile:', error);
      } finally {
        this.isSaving = false;
      }
    },
    
    async updatePassword() {
      if (!this.$refs.passwordForm.validate()) return;
      
      this.isChangingPassword = true;
      this.passwordError = '';
      
      try {
        // In a real app, this would verify the current password and update to the new one
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // For demo, we'll pretend it was successful
        // Reset the form
        this.passwordInfo = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };
        
        // Show success message
        this.$store.dispatch('ui/showSnackbar', {
          text: 'Password updated successfully',
          color: 'success'
        });
      } catch (error) {
        this.passwordError = 'Current password is incorrect';
        console.error('Error updating password:', error);
      } finally {
        this.isChangingPassword = false;
      }
    },
    
    async addNewAddress() {
      if (!this.$refs.addressForm.validate()) return;
      
      this.isSaving = true;
      
      try {
        // In a real app, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // If setting as default, update other addresses
        if (this.newAddress.default) {
          this.addresses.forEach(address => {
            address.default = false;
          });
        }
        
        // Add new address to the list
        const newId = Math.max(...this.addresses.map(a => a.id), 0) + 1;
        this.addresses.push({
          id: newId,
          ...this.newAddress
        });
        
        // Reset form
        this.newAddress = {
          name: '',
          address: '',
          city: '',
          state: '',
          zipcode: '',
          instructions: '',
          default: false
        };
        
        // Hide form
        this.showNewAddressForm = false;
        
        // Show success message
        this.$store.dispatch('ui/showSnackbar', {
          text: 'Address added successfully',
          color: 'success'
        });
      } catch (error) {
        console.error('Error adding address:', error);
      } finally {
        this.isSaving = false;
      }
    },
    
    editAddress(index) {
      // In a real app, this would open the edit form
      alert(`Editing address: ${this.addresses[index].name}`);
    },
    
    async deleteAddress(index) {
      if (confirm(`