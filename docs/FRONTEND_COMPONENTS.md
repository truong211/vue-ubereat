# Frontend Components Documentation

## Overview

This food delivery application uses Vue.js 3 with Vuetify for the frontend interface. The components are organized by feature areas and provide a comprehensive user experience for customers, restaurant owners, and administrators.

## Architecture

- **Framework:** Vue.js 3 with Composition API
- **UI Library:** Vuetify 3
- **State Management:** Vuex
- **Routing:** Vue Router
- **Internationalization:** Vue i18n
- **Real-time:** Socket.IO client
- **HTTP Client:** Axios

---

## Authentication Components

### AuthForm.vue
Main authentication form component that handles both login and registration.

**Location:** `frontend/src/components/auth/AuthForm.vue`

**Props:**
```javascript
{
  mode: {
    type: String,
    default: 'login',
    validator: ['login', 'register']
  },
  redirectTo: {
    type: String,
    default: '/'
  }
}
```

**Events:**
- `@success` - Emitted when authentication succeeds
- `@error` - Emitted when authentication fails
- `@mode-change` - Emitted when switching between login/register

**Usage:**
```vue
<template>
  <AuthForm 
    :mode="authMode"
    redirect-to="/dashboard"
    @success="handleAuthSuccess"
    @error="handleAuthError"
  />
</template>
```

### LoginForm.vue
Simplified login-only form component.

**Props:**
```javascript
{
  showSocialLogin: {
    type: Boolean,
    default: true
  },
  showRememberMe: {
    type: Boolean,
    default: true
  }
}
```

**Usage:**
```vue
<template>
  <LoginForm 
    :show-social-login="false"
    @login="handleLogin"
  />
</template>
```

### RegisterForm.vue
Registration form with validation and email verification.

**Props:**
```javascript
{
  requireEmailVerification: {
    type: Boolean,
    default: true
  },
  allowSocialRegistration: {
    type: Boolean,
    default: true
  }
}
```

### SocialLogin.vue
Social authentication component supporting Google and Facebook.

**Props:**
```javascript
{
  providers: {
    type: Array,
    default: () => ['google', 'facebook']
  },
  variant: {
    type: String,
    default: 'button',
    validator: ['button', 'icon']
  }
}
```

**Usage:**
```vue
<template>
  <SocialLogin 
    :providers="['google']"
    variant="icon"
    @social-login="handleSocialAuth"
  />
</template>
```

### OtpVerification.vue
OTP verification component for phone and email verification.

**Props:**
```javascript
{
  type: {
    type: String,
    required: true,
    validator: ['phone', 'email']
  },
  contact: {
    type: String,
    required: true
  },
  length: {
    type: Number,
    default: 6
  }
}
```

---

## Restaurant Components

### RestaurantCard.vue
Displays restaurant information in card format.

**Location:** `frontend/src/components/restaurant/RestaurantCard.vue`

**Props:**
```javascript
{
  restaurant: {
    type: Object,
    required: true
  },
  showDistance: {
    type: Boolean,
    default: true
  },
  showRating: {
    type: Boolean,
    default: true
  },
  clickable: {
    type: Boolean,
    default: true
  }
}
```

**Events:**
- `@click` - Emitted when card is clicked
- `@favorite` - Emitted when favorite button is clicked

**Usage:**
```vue
<template>
  <RestaurantCard 
    :restaurant="restaurantData"
    :show-distance="userLocation !== null"
    @click="navigateToRestaurant"
    @favorite="toggleFavorite"
  />
</template>

<script>
export default {
  data() {
    return {
      restaurantData: {
        id: 1,
        name: "Pizza Palace",
        image: "https://example.com/image.jpg",
        cuisine: "Italian",
        rating: 4.5,
        reviewCount: 120,
        deliveryTime: "30-45 min",
        deliveryFee: 2.99,
        isOpen: true,
        distance: 2.5
      }
    }
  }
}
</script>
```

### RestaurantList.vue
Container component for displaying multiple restaurants.

**Props:**
```javascript
{
  restaurants: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  layout: {
    type: String,
    default: 'grid',
    validator: ['grid', 'list']
  }
}
```

### MenuCategory.vue
Displays menu category with items.

**Props:**
```javascript
{
  category: {
    type: Object,
    required: true
  },
  restaurantId: {
    type: [String, Number],
    required: true
  }
}
```

**Usage:**
```vue
<template>
  <MenuCategory 
    :category="categoryData"
    :restaurant-id="restaurant.id"
    @add-to-cart="handleAddToCart"
  />
</template>
```

### MenuItem.vue
Individual menu item component with customization options.

**Props:**
```javascript
{
  item: {
    type: Object,
    required: true
  },
  showAddButton: {
    type: Boolean,
    default: true
  },
  showCustomization: {
    type: Boolean,
    default: true
  }
}
```

---

## Cart and Checkout Components

### CartDrawer.vue
Sliding cart drawer component.

**Location:** `frontend/src/components/cart/CartDrawer.vue`

**Props:**
```javascript
{
  modelValue: {
    type: Boolean,
    default: false
  },
  items: {
    type: Array,
    default: () => []
  }
}
```

**Events:**
- `@update:modelValue` - Emitted when drawer visibility changes
- `@item-update` - Emitted when cart item is updated
- `@item-remove` - Emitted when cart item is removed
- `@checkout` - Emitted when checkout is initiated

**Usage:**
```vue
<template>
  <CartDrawer 
    v-model="showCart"
    :items="cartItems"
    @checkout="proceedToCheckout"
    @item-update="updateCartItem"
  />
</template>
```

### CartItem.vue
Individual cart item component with quantity controls.

**Props:**
```javascript
{
  item: {
    type: Object,
    required: true
  },
  editable: {
    type: Boolean,
    default: true
  },
  showImage: {
    type: Boolean,
    default: true
  }
}
```

### CheckoutForm.vue
Complete checkout form with payment and delivery options.

**Props:**
```javascript
{
  cartItems: {
    type: Array,
    required: true
  },
  restaurant: {
    type: Object,
    required: true
  },
  deliveryAddresses: {
    type: Array,
    default: () => []
  }
}
```

**Events:**
- `@place-order` - Emitted when order is placed
- `@payment-error` - Emitted when payment fails

---

## Order Components

### OrderCard.vue
Displays order information in card format.

**Location:** `frontend/src/components/order/OrderCard.vue`

**Props:**
```javascript
{
  order: {
    type: Object,
    required: true
  },
  showActions: {
    type: Boolean,
    default: true
  },
  compact: {
    type: Boolean,
    default: false
  }
}
```

**Events:**
- `@track` - Emitted when track order is clicked
- `@reorder` - Emitted when reorder is clicked
- `@cancel` - Emitted when cancel order is clicked

**Usage:**
```vue
<template>
  <OrderCard 
    :order="orderData"
    :show-actions="!order.isCompleted"
    @track="trackOrder"
    @reorder="reorderItems"
  />
</template>
```

### OrderTracking.vue
Real-time order tracking component with map.

**Props:**
```javascript
{
  orderId: {
    type: [String, Number],
    required: true
  },
  showMap: {
    type: Boolean,
    default: true
  },
  autoRefresh: {
    type: Boolean,
    default: true
  }
}
```

### OrderTimeline.vue
Displays order status progression timeline.

**Props:**
```javascript
{
  timeline: {
    type: Array,
    required: true
  },
  currentStatus: {
    type: String,
    required: true
  }
}
```

---

## User Profile Components

### ProfileForm.vue
User profile editing form.

**Location:** `frontend/src/components/user/ProfileForm.vue`

**Props:**
```javascript
{
  user: {
    type: Object,
    required: true
  },
  editable: {
    type: Boolean,
    default: true
  }
}
```

**Events:**
- `@update` - Emitted when profile is updated
- `@avatar-change` - Emitted when avatar is changed

### AddressBook.vue
Manages user delivery addresses.

**Props:**
```javascript
{
  addresses: {
    type: Array,
    default: () => []
  },
  allowSelection: {
    type: Boolean,
    default: false
  },
  selectedId: {
    type: [String, Number],
    default: null
  }
}
```

**Events:**
- `@address-select` - Emitted when address is selected
- `@address-add` - Emitted when new address is added
- `@address-edit` - Emitted when address is edited
- `@address-delete` - Emitted when address is deleted

### AddressForm.vue
Form for adding/editing delivery addresses.

**Props:**
```javascript
{
  address: {
    type: Object,
    default: () => ({})
  },
  mode: {
    type: String,
    default: 'add',
    validator: ['add', 'edit']
  }
}
```

---

## Payment Components

### PaymentForm.vue
Payment method selection and processing.

**Location:** `frontend/src/components/payment/PaymentForm.vue`

**Props:**
```javascript
{
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  methods: {
    type: Array,
    default: () => ['card', 'paypal', 'apple_pay']
  }
}
```

**Events:**
- `@payment-success` - Emitted when payment succeeds
- `@payment-error` - Emitted when payment fails
- `@method-change` - Emitted when payment method changes

### CreditCardForm.vue
Credit card input form with validation.

**Props:**
```javascript
{
  autoFormat: {
    type: Boolean,
    default: true
  },
  showSaveOption: {
    type: Boolean,
    default: true
  }
}
```

---

## Map Components

### MapView.vue
Interactive map component for location display and selection.

**Location:** `frontend/src/components/map/MapView.vue`

**Props:**
```javascript
{
  center: {
    type: Object,
    default: () => ({ lat: 0, lng: 0 })
  },
  zoom: {
    type: Number,
    default: 13
  },
  markers: {
    type: Array,
    default: () => []
  },
  interactive: {
    type: Boolean,
    default: true
  }
}
```

**Events:**
- `@marker-click` - Emitted when marker is clicked
- `@location-select` - Emitted when location is selected
- `@bounds-change` - Emitted when map bounds change

**Usage:**
```vue
<template>
  <MapView 
    :center="userLocation"
    :markers="restaurantMarkers"
    :interactive="true"
    @marker-click="handleMarkerClick"
    @location-select="handleLocationSelect"
  />
</template>

<script>
export default {
  data() {
    return {
      userLocation: { lat: 40.7128, lng: -74.0060 },
      restaurantMarkers: [
        {
          id: 1,
          position: { lat: 40.7589, lng: -73.9851 },
          title: "Pizza Palace",
          type: "restaurant"
        }
      ]
    }
  }
}
</script>
```

### LiveMap.vue
Real-time tracking map with driver location updates.

**Props:**
```javascript
{
  orderId: {
    type: [String, Number],
    required: true
  },
  showRoute: {
    type: Boolean,
    default: true
  },
  autoCenter: {
    type: Boolean,
    default: true
  }
}
```

---

## Notification Components

### NotificationBell.vue
Notification bell icon with badge count.

**Location:** `frontend/src/components/notifications/NotificationBell.vue`

**Props:**
```javascript
{
  count: {
    type: Number,
    default: 0
  },
  maxCount: {
    type: Number,
    default: 99
  },
  showZero: {
    type: Boolean,
    default: false
  }
}
```

### NotificationList.vue
List of notifications with mark as read functionality.

**Props:**
```javascript
{
  notifications: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  showActions: {
    type: Boolean,
    default: true
  }
}
```

### NotificationItem.vue
Individual notification item component.

**Props:**
```javascript
{
  notification: {
    type: Object,
    required: true
  },
  clickable: {
    type: Boolean,
    default: true
  }
}
```

---

## Search Components

### SearchBar.vue
Search input with autocomplete and filters.

**Location:** `frontend/src/components/search/SearchBar.vue`

**Props:**
```javascript
{
  placeholder: {
    type: String,
    default: 'Search restaurants, cuisines, dishes...'
  },
  suggestions: {
    type: Array,
    default: () => []
  },
  filters: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
}
```

**Events:**
- `@search` - Emitted when search is performed
- `@suggestion-select` - Emitted when suggestion is selected
- `@filter-change` - Emitted when filter is changed

**Usage:**
```vue
<template>
  <SearchBar 
    :suggestions="searchSuggestions"
    :filters="availableFilters"
    :loading="isSearching"
    @search="performSearch"
    @filter-change="updateFilters"
  />
</template>
```

### FilterPanel.vue
Advanced filtering panel for restaurants and menu items.

**Props:**
```javascript
{
  filters: {
    type: Object,
    default: () => ({})
  },
  options: {
    type: Object,
    required: true
  },
  collapsible: {
    type: Boolean,
    default: true
  }
}
```

---

## Admin Components

### AdminDashboard.vue
Main admin dashboard with statistics and quick actions.

**Location:** `frontend/src/components/admin/AdminDashboard.vue`

**Props:**
```javascript
{
  stats: {
    type: Object,
    default: () => ({})
  },
  refreshInterval: {
    type: Number,
    default: 30000
  }
}
```

### DataTable.vue
Generic data table component for admin CRUD operations.

**Props:**
```javascript
{
  items: {
    type: Array,
    default: () => []
  },
  headers: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  serverSide: {
    type: Boolean,
    default: false
  },
  actions: {
    type: Array,
    default: () => ['view', 'edit', 'delete']
  }
}
```

**Events:**
- `@item-click` - Emitted when item is clicked
- `@action-click` - Emitted when action button is clicked
- `@sort-change` - Emitted when sorting changes
- `@page-change` - Emitted when page changes

**Usage:**
```vue
<template>
  <DataTable 
    :items="users"
    :headers="userHeaders"
    :loading="isLoading"
    :server-side="true"
    @action-click="handleAction"
    @page-change="loadPage"
  />
</template>

<script>
export default {
  data() {
    return {
      userHeaders: [
        { text: 'ID', value: 'id', sortable: true },
        { text: 'Name', value: 'name', sortable: true },
        { text: 'Email', value: 'email', sortable: true },
        { text: 'Role', value: 'role', sortable: false },
        { text: 'Created', value: 'createdAt', sortable: true }
      ]
    }
  }
}
</script>
```

---

## Common/Utility Components

### LoadingSpinner.vue
Reusable loading spinner component.

**Location:** `frontend/src/components/common/LoadingSpinner.vue`

**Props:**
```javascript
{
  size: {
    type: String,
    default: 'medium',
    validator: ['small', 'medium', 'large']
  },
  overlay: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    default: ''
  }
}
```

### EmptyState.vue
Empty state component for when no data is available.

**Props:**
```javascript
{
  title: {
    type: String,
    default: 'No data available'
  },
  description: {
    type: String,
    default: ''
  },
  actionText: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: 'mdi-inbox'
  }
}
```

### ConfirmDialog.vue
Confirmation dialog component for destructive actions.

**Props:**
```javascript
{
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Confirm Action'
  },
  message: {
    type: String,
    required: true
  },
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  },
  dangerous: {
    type: Boolean,
    default: false
  }
}
```

**Usage:**
```vue
<template>
  <ConfirmDialog 
    v-model="showConfirm"
    title="Delete Restaurant"
    message="Are you sure you want to delete this restaurant? This action cannot be undone."
    confirm-text="Delete"
    :dangerous="true"
    @confirm="deleteRestaurant"
    @cancel="showConfirm = false"
  />
</template>
```

### ImageUpload.vue
Image upload component with preview and validation.

**Props:**
```javascript
{
  modelValue: {
    type: [File, String],
    default: null
  },
  accept: {
    type: String,
    default: 'image/*'
  },
  maxSize: {
    type: Number,
    default: 5242880 // 5MB
  },
  preview: {
    type: Boolean,
    default: true
  }
}
```

---

## Component Communication Patterns

### Props Down, Events Up
```vue
<!-- Parent Component -->
<template>
  <ChildComponent 
    :prop-data="parentData"
    @child-event="handleChildEvent"
  />
</template>

<!-- Child Component -->
<template>
  <button @click="$emit('child-event', eventData)">
    {{ propData.title }}
  </button>
</template>
```

### Provide/Inject for Deep Nesting
```vue
<!-- Provider (Parent) -->
<script>
export default {
  provide() {
    return {
      theme: this.theme,
      userPreferences: this.userPreferences
    }
  }
}
</script>

<!-- Consumer (Deeply Nested Child) -->
<script>
export default {
  inject: ['theme', 'userPreferences']
}
</script>
```

### Vuex Store Integration
```vue
<script>
import { mapState, mapActions } from 'vuex'

export default {
  computed: {
    ...mapState('auth', ['user', 'isAuthenticated']),
    ...mapState('cart', ['items', 'total'])
  },
  methods: {
    ...mapActions('cart', ['addItem', 'removeItem']),
    ...mapActions('auth', ['login', 'logout'])
  }
}
</script>
```

---

## Best Practices

### Component Structure
1. **Single Responsibility:** Each component should have one clear purpose
2. **Prop Validation:** Always validate props with appropriate types and defaults
3. **Event Naming:** Use kebab-case for event names (`add-to-cart` not `addToCart`)
4. **Slot Usage:** Provide slots for customizable content

### Performance Optimization
1. **Lazy Loading:** Use `defineAsyncComponent` for large components
2. **v-memo:** Use for expensive list rendering
3. **Keep-alive:** Wrap components that should maintain state

### Accessibility
1. **ARIA Labels:** Provide appropriate ARIA labels for interactive elements
2. **Keyboard Navigation:** Ensure all functionality is keyboard accessible
3. **Focus Management:** Manage focus for modal dialogs and dynamic content

### Testing
Each component should include:
1. **Unit Tests:** Test component logic and methods
2. **Integration Tests:** Test component interaction with parent/child components
3. **Accessibility Tests:** Verify ARIA compliance and keyboard navigation

Example test structure:
```javascript
import { mount } from '@vue/test-utils'
import RestaurantCard from '@/components/restaurant/RestaurantCard.vue'

describe('RestaurantCard.vue', () => {
  it('displays restaurant information correctly', () => {
    const restaurant = {
      name: 'Test Restaurant',
      rating: 4.5
    }
    
    const wrapper = mount(RestaurantCard, {
      props: { restaurant }
    })
    
    expect(wrapper.text()).toContain('Test Restaurant')
    expect(wrapper.text()).toContain('4.5')
  })
})
```