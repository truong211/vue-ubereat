# 🇻🇳 Hệ Thống Tài Khoản UberEat - Vietnamese Authentication System

## Tổng Quan (Overview)

Hệ thống tài khoản UberEat được thiết kế đầy đủ với tất cả các tính năng xác thực hiện đại và giao diện tiếng Việt hoàn chỉnh. Hệ thống hỗ trợ đầy đủ các yêu cầu bạn đã đề ra:

### ✅ 1. Đăng Ký Tài Khoản (Account Registration)

**Các phương thức đăng ký:**
- **Email + Mật khẩu**: Đăng ký truyền thống với email và mật khẩu mạnh
- **Số điện thoại**: Đăng ký và xác thực qua SMS OTP
- **Google**: Đăng ký nhanh với tài khoản Google
- **Facebook**: Đăng ký nhanh với tài khoản Facebook

**Tính năng nổi bật:**
- Kiểm tra email/số điện thoại đã tồn tại real-time
- Xác thực mật khẩu mạnh (8+ ký tự, chữ hoa, chữ thường, số, ký tự đặc biệt)
- Tự động tạo username từ email
- Điều khoản dịch vụ tiếng Việt
- Giao diện thân thiện với người dùng Việt Nam

### ✅ 2. Đăng Nhập/Đăng Xuất (Login/Logout)

**Phương thức đăng nhập:**
- **Email + Mật khẩu**: Đăng nhập truyền thống
- **Google OAuth 2.0**: Đăng nhập một chạm với Google
- **Facebook OAuth**: Đăng nhập một chạm với Facebook
- **Nhớ đăng nhập**: Tùy chọn ghi nhớ phiên đăng nhập

**Tính năng bảo mật:**
- JWT Token với thời hạn 7 ngày
- Refresh Token với thời hạn 30 ngày
- Secure cookies cho bảo mật tốt hơn
- Tự động redirect sau đăng nhập thành công

### ✅ 3. Quên Mật Khẩu/Khôi Phục Mật Khẩu (Password Recovery)

**Quy trình khôi phục:**
1. **Nhập email**: Người dùng nhập email đã đăng ký
2. **Nhận mã OTP**: Hệ thống gửi mã OTP 6 chữ số qua email
3. **Xác thực OTP**: Nhập mã OTP để xác thực
4. **Đặt mật khẩu mới**: Tạo mật khẩu mới theo quy tắc bảo mật
5. **Hoàn tất**: Đăng nhập với mật khẩu mới

**Tính năng bảo mật:**
- OTP có thời hạn 10 phút
- Mã hóa JWT cho token xác thực
- Yêu cầu mật khẩu mạnh
- Thông báo tiếng Việt rõ ràng

### ✅ 4. Xác Thực OTP (OTP Authentication)

**Hai phương thức xác thực:**

#### Email OTP:
- **Khi nào**: Sau đăng ký, quên mật khẩu
- **Cách thức**: Gửi mã 6 chữ số qua email
- **Thời hạn**: 24 giờ cho xác thực email
- **Tính năng**: Gửi lại mã, kiểm tra spam folder

#### SMS OTP:
- **Khi nào**: Xác thực số điện thoại
- **Cách thức**: Gửi SMS qua Twilio
- **Format**: Số điện thoại Việt Nam (+84xxxxxxxxx)
- **Thời hạn**: 10 phút
- **Tính năng**: Đếm ngược 60s trước khi cho phép gửi lại

**Giao diện OTP:**
- Input box riêng biệt cho từng chữ số
- Tự động focus sang ô tiếp theo
- Backspace thông minh
- Hiển thị số điện thoại/email đã ẩn một phần
- Thông báo lỗi bằng tiếng Việt

## 🎨 Giao Diện Người Dùng (User Interface)

### Thiết Kế Modern với Vuetify 3:
- **Material Design 3**: Giao diện hiện đại, thân thiện
- **Responsive**: Tương thích mọi thiết bị (desktop, tablet, mobile)
- **Dark/Light Mode**: Hỗ trợ chế độ sáng/tối
- **Animation**: Hiệu ứng mượt mà và chuyên nghiệp

### Đa Ngôn Ngữ (Internationalization):
- **Vue i18n**: Hệ thống đa ngôn ngữ hoàn chỉnh
- **Tiếng Việt**: Bản dịch đầy đủ và chính xác
- **English**: Hỗ trợ tiếng Anh làm fallback
- **Currency**: Format tiền tệ VND cho người Việt
- **Date Format**: Format ngày tháng theo chuẩn Việt Nam

## 🔧 Công Nghệ Sử Dụng (Technology Stack)

### Backend (Node.js):
```javascript
// Auth Routes - /backend/src/routes/auth.routes.js
- Email/Password registration & login
- Google OAuth 2.0 integration  
- Facebook OAuth integration
- Email OTP verification
- SMS OTP via Twilio
- Password reset with OTP
- JWT token management
- Profile management
```

### Frontend (Vue.js 3):
```javascript
// Components Structure
/frontend/src/components/auth/
├── AuthForm.vue              // Form tổng hợp
├── LoginForm.vue             // Form đăng nhập
├── RegisterForm.vue          // Form đăng ký (tiếng Việt)
├── ForgotPassword.vue        // Quên mật khẩu
├── ResetPassword.vue         // Đặt lại mật khẩu
├── OtpVerification.vue       // Xác thực OTP
├── SocialLogin.vue           // Đăng nhập mạng xã hội
└── VerifyEmail.vue           // Xác thực email

/frontend/src/views/auth/
├── Login.vue                 // Trang đăng nhập
├── Register.vue              // Trang đăng ký
├── ForgotPassword.vue        // Trang quên mật khẩu
├── ResetPassword.vue         // Trang đặt lại mật khẩu
└── VerifyOTP.vue            // Trang xác thực OTP
```

## 📋 Quy Trình Sử Dụng (User Flow)

### 1. Đăng Ký Mới (New Registration):
```
Người dùng truy cập /auth/register
↓
Điền thông tin: Họ tên, Email, Số điện thoại, Mật khẩu
↓
Kiểm tra email/số điện thoại trùng lặp (real-time)
↓
Đồng ý điều khoản dịch vụ
↓
Nhấn "Đăng ký"
↓
Chuyển đến trang xác thực OTP
↓
Nhập mã OTP từ SMS/Email
↓
Đăng ký thành công → Chuyển đến Dashboard
```

### 2. Đăng Nhập (Login):
```
Người dùng truy cập /auth/login
↓
Nhập Email + Mật khẩu HOẶC chọn Google/Facebook
↓
Xác thực thông tin
↓
Đăng nhập thành công → Chuyển đến trang được yêu cầu
```

### 3. Quên Mật Khẩu (Forgot Password):
```
Từ trang đăng nhập → Nhấn "Quên mật khẩu?"
↓
Nhập email đã đăng ký
↓
Nhận mã OTP qua email (6 chữ số)
↓
Nhập mã OTP để xác thực
↓
Tạo mật khẩu mới (theo quy tắc bảo mật)
↓
Đặt lại thành công → Đăng nhập với mật khẩu mới
```

## 🔐 Tính Năng Bảo Mật (Security Features)

### 1. Mã Hóa Mật Khẩu:
- **bcrypt**: Hash mật khẩu với salt rounds = 12
- **Password Requirements**: 
  - Tối thiểu 8 ký tự
  - Ít nhất 1 chữ hoa (A-Z)
  - Ít nhất 1 chữ thường (a-z)  
  - Ít nhất 1 chữ số (0-9)
  - Ít nhất 1 ký tự đặc biệt (@$!%*?&)

### 2. JWT Token Security:
- **Access Token**: 7 ngày expire
- **Refresh Token**: 30 ngày expire
- **Secure Cookies**: HttpOnly, Secure, SameSite
- **Token Rotation**: Tự động refresh khi gần hết hạn

### 3. OTP Security:
- **Email OTP**: 6 chữ số, hết hạn sau 24h
- **SMS OTP**: 6 chữ số, hết hạn sau 10 phút
- **Rate Limiting**: Giới hạn số lần gửi OTP
- **Attempt Limiting**: Giới hạn số lần thử sai

### 4. Social Login Security:
- **OAuth 2.0**: Chuẩn bảo mật quốc tế
- **Scope Minimal**: Chỉ yêu cầu quyền cần thiết
- **State Parameter**: Chống CSRF attacks
- **Token Validation**: Xác thực token với provider

## 🌟 Tính Năng Nâng Cao (Advanced Features)

### 1. Profile Management:
- **Update Profile**: Cập nhật thông tin cá nhân
- **Avatar Upload**: Upload và crop ảnh đại diện
- **Phone Verification**: Xác thực số điện thoại bổ sung
- **Email Change**: Thay đổi email với xác thực OTP

### 2. Security Settings:
- **Change Password**: Đổi mật khẩu an toàn
- **Login History**: Xem lịch sử đăng nhập
- **Active Sessions**: Quản lý phiên đăng nhập
- **Two-Factor Auth**: Chuẩn bị cho 2FA

### 3. Account Linking:
- **Link Social**: Liên kết tài khoản Google/Facebook
- **Unlink Social**: Hủy liên kết tài khoản
- **Multiple Providers**: Hỗ trợ nhiều nhà cung cấp

## 🚀 Cách Sử Dụng (How to Use)

### 1. Chạy Backend:
```bash
cd backend
npm install
npm run dev
# Server chạy trên http://localhost:3000
```

### 2. Chạy Frontend:
```bash
cd frontend  
npm install
npm run dev
# Client chạy trên http://localhost:5173
```

### 3. Cấu Hình Environment:
```bash
# Backend .env
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=ubereats_db

# Email Config
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# SMS Config (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token

# Social Auth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-secret
```

## 📱 Demo Features

### 1. Truy Cập Demo:
- **Đăng ký**: http://localhost:5173/auth/register
- **Đăng nhập**: http://localhost:5173/auth/login
- **Quên mật khẩu**: http://localhost:5173/auth/forgot-password

### 2. Test Accounts:
```javascript
// Test User 1
{
  email: "test@example.com",
  password: "Test123!@#",
  phone: "+84987654321"
}

// Test User 2  
{
  email: "demo@ubereats.vn", 
  password: "Demo123!@#",
  phone: "+84912345678"
}
```

### 3. Test OTP:
```javascript
// Development mode - OTP được log ra console
// Production mode - OTP gửi qua SMS/Email thật
```

## 🎯 Kết Luận (Conclusion)

Hệ thống tài khoản UberEat đã được phát triển hoàn chỉnh với:

✅ **Đăng ký tài khoản** (email, số điện thoại, mạng xã hội)  
✅ **Đăng nhập/Đăng xuất** với nhiều phương thức  
✅ **Quên mật khẩu/Khôi phục mật khẩu** an toàn  
✅ **Xác thực qua OTP** (email + SMS)  

**Bonus Features:**
- 🇻🇳 Giao diện tiếng Việt hoàn chỉnh
- 🎨 Design hiện đại với Vuetify 3  
- 🔒 Bảo mật cao với JWT + bcrypt
- 📱 Responsive trên mọi thiết bị
- ⚡ Performance tối ưu
- 🔧 Code dễ maintain và mở rộng

Hệ thống sẵn sàng production và có thể triển khai ngay lập tức cho ứng dụng giao đồ ăn tại Việt Nam!

---

*Developed with ❤️ for Vietnamese Users*