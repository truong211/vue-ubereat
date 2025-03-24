export default {
  translations: {
    common: {
      welcome: 'Welcome to UberEat',
      loading: 'Loading...',
      error: 'An error occurred',
      retry: 'Retry',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      view: 'View',
      addToCart: 'Add to cart',
      min: 'min'
    },
    auth: {
      login: 'Login',
      logout: 'Logout',
      register: 'Register',
      forgotPassword: 'Forgot Password',
      resetPassword: 'Reset Password',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password'
    },
    navigation: {
      home: 'Home',
      restaurants: 'Restaurants',
      orders: 'Orders',
      cart: 'Cart',
      profile: 'Profile',
      settings: 'Settings'
    },
    favorites: {
      pageTitle: 'My Favorites',
      title: 'Favorites',
      subtitle: 'Manage your favorite foods and restaurants',
      foods: 'Favorite Foods',
      restaurants: 'Favorite Restaurants',
      noFavoriteFood: 'You have no favorite foods yet',
      noFavoriteRestaurant: 'You have no favorite restaurants yet',
      discoverButton: 'Discover Now',
      addedSuccess: 'Added to favorites',
      removedSuccess: 'Removed from favorites',
      toggleError: 'Could not update favorites',
      removeError: 'Could not remove from favorites'
    },
    social: {
      shareTitle: 'Share',
      shareFoodText: 'Check out {name} from {restaurant} on UberEat!',
      shareRestaurantText: 'Check out {name} restaurant on UberEat!',
      shareOrderText: 'I just ordered from {restaurant} on UberEat!',
      shareSuccess: 'Shared successfully',
      shareError: 'Could not share at this time',
      shareOnFacebook: 'Share on Facebook',
      shareOnTwitter: 'Share on Twitter',
      shareViaEmail: 'Share via Email'
    },
    recommendations: {
      title: 'Recommended for You',
      subtitle: 'Based on your order history and favorites',
      viewAll: 'View all',
      noRecommendations: 'No recommendations yet, order more to get personalized suggestions',
      fromFavorites: 'From your favorites',
      popularNearby: 'Popular nearby',
      recentlyViewed: 'Recently viewed'
    },
    cart: {
      addedToCart: 'Added to cart'
    },
    profile: {
      title: 'My Profile'
    },
    restaurant: {
      // Previous translations remain...

      reports: {
        // General
        title: 'Sales & Trends Report',
        download: 'Download Report',
        timePeriod: 'Time Period',
        bestSellers: 'Best Sellers',
        salesByCategory: 'Sales by Category',
        salesTrends: 'Sales Trends',
        keyMetrics: 'Key Metrics',
        insights: 'Insights',
        vsPrevPeriod: 'vs previous period',
        sold: 'Sold',

        // Time Periods
        periods: {
          week: 'This Week',
          month: 'This Month',
          quarter: 'This Quarter',
          year: 'This Year'
        },

        // Metrics
        metrics: {
          totalSales: 'Total Sales',
          averageOrder: 'Average Order Value',
          customerRetention: 'Customer Retention',
          orderCompletion: 'Order Completion Rate',
          topCategory: 'Top Category',
          popularItems: 'Popular Items',
          growthRate: 'Growth Rate',
          customerSatisfaction: 'Customer Satisfaction'
        },

        // Insight Types
        insightTypes: {
          positive: 'Positive Trend',
          negative: 'Needs Attention',
          suggestion: 'Suggestion',
          alert: 'Alert'
        },

        // Alerts
        alerts: {
          stockLow: 'Low Stock Alert',
          highDemand: 'High Demand Alert',
          trending: 'Trending Item',
          seasonal: 'Seasonal Trend',
          performance: 'Performance Alert'
        },

        // Chart Labels
        chart: {
          revenue: 'Revenue',
          orders: 'Orders',
          averageOrder: 'Average Order',
          mainDishes: 'Main Dishes',
          beverages: 'Beverages',
          appetizers: 'Appetizers',
          desserts: 'Desserts',
          others: 'Others'
        },

        // Export Options
        export: {
          pdf: 'Export as PDF',
          excel: 'Export as Excel',
          csv: 'Export as CSV'
        },

        // Messages
        loadingData: 'Loading report data...',
        noData: 'No data available for selected period',
        exportSuccess: 'Report exported successfully',
        exportError: 'Error exporting report'
      }
    }
  }
}