export default {
  profileMenuItems: [
    { 
      title: 'Thông tin tài khoản', 
      icon: 'mdi-account-outline', 
      to: '/profile' 
    },
    { 
      title: 'Đơn hàng của tôi', 
      icon: 'mdi-clipboard-list-outline', 
      to: '/orders' 
    },
    { 
      title: 'Địa chỉ giao hàng', 
      icon: 'mdi-map-marker-outline', 
      to: '/profile/addresses' 
    },
    { 
      title: 'Phương thức thanh toán', 
      icon: 'mdi-credit-card-outline', 
      to: '/profile/payment-methods' 
    },
    { 
      title: 'Voucher của tôi', 
      icon: 'mdi-ticket-percent-outline', 
      to: '/profile/vouchers' 
    },
    { 
      title: 'Cài đặt', 
      icon: 'mdi-cog-outline', 
      to: '/profile/settings' 
    }
  ]
};