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
      sort: 'Sort'
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
    }
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