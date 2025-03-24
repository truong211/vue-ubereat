export default {
  translations: {
    common: {
      welcome: 'Chào mừng đến UberEat',
      loading: 'Đang tải...',
      error: 'Đã xảy ra lỗi',
      retry: 'Thử lại',
      cancel: 'Hủy',
      save: 'Lưu',
      delete: 'Xóa',
      edit: 'Chỉnh sửa',
      search: 'Tìm kiếm',
      filter: 'Lọc',
      sort: 'Sắp xếp',
      view: 'Xem',
      addToCart: 'Thêm vào giỏ',
      min: 'phút'
    },
    auth: {
      login: 'Đăng nhập',
      logout: 'Đăng xuất',
      register: 'Đăng ký',
      forgotPassword: 'Quên mật khẩu',
      resetPassword: 'Đặt lại mật khẩu',
      email: 'Email',
      password: 'Mật khẩu',
      confirmPassword: 'Xác nhận mật khẩu'
    },
    navigation: {
      home: 'Trang chủ',
      restaurants: 'Nhà hàng',
      orders: 'Đơn hàng',
      cart: 'Giỏ hàng',
      profile: 'Hồ sơ',
      settings: 'Cài đặt'
    },
    favorites: {
      pageTitle: 'Mục yêu thích của tôi',
      title: 'Mục yêu thích',
      subtitle: 'Quản lý danh sách món ăn và nhà hàng yêu thích của bạn',
      foods: 'Món ăn yêu thích',
      restaurants: 'Nhà hàng yêu thích',
      noFavoriteFood: 'Bạn chưa có món ăn yêu thích nào',
      noFavoriteRestaurant: 'Bạn chưa có nhà hàng yêu thích nào',
      discoverButton: 'Khám phá ngay',
      addedSuccess: 'Đã thêm vào mục yêu thích',
      removedSuccess: 'Đã xóa khỏi mục yêu thích',
      toggleError: 'Không thể cập nhật mục yêu thích',
      removeError: 'Không thể xóa khỏi mục yêu thích'
    },
    social: {
      shareTitle: 'Chia sẻ',
      shareFoodText: 'Hãy xem món {name} từ {restaurant} trên UberEat!',
      shareRestaurantText: 'Hãy thử nhà hàng {name} trên UberEat!',
      shareOrderText: 'Tôi vừa đặt hàng từ {restaurant} trên UberEat!',
      shareSuccess: 'Đã chia sẻ thành công',
      shareError: 'Không thể chia sẻ lúc này',
      shareOnFacebook: 'Chia sẻ lên Facebook',
      shareOnTwitter: 'Chia sẻ lên Twitter',
      shareViaEmail: 'Chia sẻ qua Email'
    },
    recommendations: {
      title: 'Đề xuất cho bạn',
      subtitle: 'Dựa trên lịch sử đặt hàng và món yêu thích của bạn',
      viewAll: 'Xem tất cả',
      noRecommendations: 'Chưa có đề xuất nào, hãy đặt nhiều hơn để nhận được gợi ý phù hợp',
      fromFavorites: 'Từ mục yêu thích của bạn',
      popularNearby: 'Phổ biến gần đây',
      recentlyViewed: 'Đã xem gần đây'
    },
    cart: {
      addedToCart: 'Đã thêm vào giỏ hàng'
    },
    profile: {
      title: 'Hồ sơ của tôi'
    },
    restaurant: {
      // Previous translations remain...

      reports: {
        // General
        title: 'Báo cáo doanh số & xu hướng',
        download: 'Tải báo cáo',
        timePeriod: 'Khoảng thời gian',
        bestSellers: 'Món bán chạy',
        salesByCategory: 'Doanh số theo danh mục',
        salesTrends: 'Xu hướng bán hàng',
        keyMetrics: 'Chỉ số quan trọng',
        insights: 'Thông tin chi tiết',
        vsPrevPeriod: 'so với kỳ trước',
        sold: 'Đã bán',

        // Time Periods
        periods: {
          week: 'Tuần này',
          month: 'Tháng này',
          quarter: 'Quý này',
          year: 'Năm nay'
        },

        // Metrics
        metrics: {
          totalSales: 'Tổng doanh số',
          averageOrder: 'Giá trị đơn trung bình',
          customerRetention: 'Tỷ lệ giữ chân khách hàng',
          orderCompletion: 'Tỷ lệ hoàn thành đơn',
          topCategory: 'Danh mục hàng đầu',
          popularItems: 'Món phổ biến',
          growthRate: 'Tỷ lệ tăng trưởng',
          customerSatisfaction: 'Sự hài lòng của khách hàng'
        },

        // Insight Types
        insightTypes: {
          positive: 'Xu hướng tích cực',
          negative: 'Cần chú ý',
          suggestion: 'Đề xuất',
          alert: 'Cảnh báo'
        },

        // Alerts
        alerts: {
          stockLow: 'Cảnh báo hàng sắp hết',
          highDemand: 'Cảnh báo nhu cầu cao',
          trending: 'Món đang hot',
          seasonal: 'Xu hướng theo mùa',
          performance: 'Cảnh báo hiệu suất'
        },

        // Chart Labels
        chart: {
          revenue: 'Doanh thu',
          orders: 'Đơn hàng',
          averageOrder: 'Trung bình đơn hàng',
          mainDishes: 'Món chính',
          beverages: 'Đồ uống',
          appetizers: 'Khai vị',
          desserts: 'Tráng miệng',
          others: 'Khác'
        },

        // Export Options
        export: {
          pdf: 'Xuất file PDF',
          excel: 'Xuất file Excel',
          csv: 'Xuất file CSV'
        },

        // Messages
        loadingData: 'Đang tải dữ liệu báo cáo...',
        noData: 'Không có dữ liệu cho khoảng thời gian đã chọn',
        exportSuccess: 'Xuất báo cáo thành công',
        exportError: 'Lỗi khi xuất báo cáo'
      }
    }
  }
}