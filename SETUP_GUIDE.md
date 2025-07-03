# 🚀 Hướng Dẫn Cài Đặt & Chạy Hệ Thống Tài Khoản UberEat

## Yêu Cầu Hệ Thống (System Requirements)

### Software:
- **Node.js**: v16+ 
- **npm**: v8+
- **MySQL**: v8.0+
- **Git**: Latest version

### Accounts (Optional):
- **Twilio Account**: Cho SMS OTP
- **Google OAuth**: Cho đăng nhập Google
- **Facebook App**: Cho đăng nhập Facebook
- **Gmail Account**: Cho gửi email

## 📦 Bước 1: Clone & Install

```bash
# 1. Clone repository
git clone <repository-url>
cd ubereats-vietnamese-auth

# 2. Install Backend Dependencies
cd backend
npm install

# 3. Install Frontend Dependencies  
cd ../frontend
npm install
```

## 🗃️ Bước 2: Cài Đặt Database

### Tạo Database MySQL:
```sql
-- Kết nối MySQL và tạo database
CREATE DATABASE ubereats_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ubereats_db;

-- Import schema từ file food_Delivery.sql
source food_Delivery.sql;
```

### Hoặc sử dụng script tự động:
```bash
# Từ thư mục root
node setup-database.js
```

## ⚙️ Bước 3: Cấu Hình Environment

### Backend Environment (.env):
```bash
# Tạo file backend/.env
cd backend
cp .env.example .env

# Chỉnh sửa file .env:
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ubereats_db
DB_PORT=3306

# JWT Secrets (Generate random strings)
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
JWT_EMAIL_SECRET=your-super-secret-email-key-here
JWT_VERSION=2024-01-01

# Server Configuration
NODE_ENV=development
PORT=3000

# Email Configuration (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password

# SMS Configuration (Twilio) - Optional
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Google OAuth - Optional
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Facebook OAuth - Optional  
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# CORS
FRONTEND_URL=http://localhost:5173
```

### Frontend Environment (Optional):
```bash
# Tạo file frontend/.env (nếu cần)
cd frontend

# Frontend config usually doesn't need .env for development
# API calls sẽ tự động proxy đến backend
```

## 🔑 Bước 4: Cấu Hình Dịch Vụ Bên Ngoài

### 1. Gmail App Password (Cho Email OTP):
```bash
1. Vào Google Account Settings
2. Security → 2-Step Verification
3. App passwords → Generate password cho "Mail"
4. Sử dụng password này trong EMAIL_PASSWORD
```

### 2. Twilio SMS (Cho SMS OTP):
```bash
1. Đăng ký tài khoản Twilio: https://www.twilio.com
2. Lấy Account SID và Auth Token từ Console  
3. Mua số điện thoại Twilio (hoặc dùng trial)
4. Cập nhật vào .env file
```

### 3. Google OAuth (Cho Social Login):
```bash
1. Vào Google Cloud Console
2. Tạo project mới hoặc chọn project có sẵn
3. APIs & Services → Credentials
4. Create OAuth 2.0 Client ID
5. Authorized redirect URIs: http://localhost:3000/api/auth/google/callback
6. Lấy Client ID và Client Secret
```

### 4. Facebook OAuth (Cho Social Login):
```bash
1. Vào Facebook Developers: https://developers.facebook.com
2. Tạo App mới
3. Add Facebook Login product
4. Valid OAuth Redirect URIs: http://localhost:3000/api/auth/facebook/callback
5. Lấy App ID và App Secret
```

## 🚀 Bước 5: Chạy Ứng Dụng

### Development Mode:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server sẽ chạy tại: http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
cd frontend  
npm run dev
# Client sẽ chạy tại: http://localhost:5173
```

### Production Mode:
```bash
# Build Frontend
cd frontend
npm run build

# Start Backend với static files
cd ../backend
npm start
# Ứng dụng sẽ chạy tại: http://localhost:3000
```

## 🧪 Bước 6: Test Hệ Thống

### 1. Kiểm tra Database Connection:
```bash
cd backend
node test-db-connection.js
```

### 2. Test Authentication Endpoints:
```bash
# Test với curl hoặc Postman
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com", 
    "password": "Test123!@#",
    "phone": "+84987654321"
  }'
```

### 3. Truy cập Demo Page:
```
http://localhost:5173/auth-demo
```

## 📱 URLs Demo

### Trang Authentication:
- **Đăng ký**: http://localhost:5173/auth/register
- **Đăng nhập**: http://localhost:5173/auth/login  
- **Quên mật khẩu**: http://localhost:5173/auth/forgot-password
- **Demo tổng thể**: http://localhost:5173/auth-demo

### API Endpoints:
- **Backend API**: http://localhost:3000/api
- **Auth Routes**: http://localhost:3000/api/auth
- **Health Check**: http://localhost:3000/health

## 🔧 Troubleshooting

### Lỗi Thường Gặp:

#### 1. Database Connection Error:
```bash
Error: ER_ACCESS_DENIED_FOR_USER
# Giải pháp: Kiểm tra username/password MySQL trong .env
```

#### 2. CORS Error:
```bash
# Đảm bảo FRONTEND_URL trong backend/.env đúng
FRONTEND_URL=http://localhost:5173
```

#### 3. JWT Token Error:
```bash
# Tạo JWT secrets mới
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
```

#### 4. Email không gửi được:
```bash
# Kiểm tra Gmail App Password
# Đảm bảo 2FA đã bật trên Gmail
# Sử dụng App Password thay vì password thường
```

#### 5. SMS OTP không hoạt động:
```bash
# Kiểm tra Twilio credentials
# Đảm bảo có credit trong Twilio account
# Verify số điện thoại nếu dùng trial account
```

#### 6. Social Login không hoạt động:
```bash
# Kiểm tra redirect URIs trong OAuth settings
# Đảm bảo domain match chính xác
# Kiểm tra Client ID/Secret
```

### Debug Mode:
```bash
# Backend debug
cd backend
DEBUG=* npm run dev

# Xem logs chi tiết
tail -f backend/logs/app.log
```

## 🎯 Test Accounts

### Tạo Test Data:
```sql
-- Thêm test user vào database
INSERT INTO users (fullName, email, username, password, phone, isEmailVerified, isPhoneVerified, role) 
VALUES (
  'Demo User',
  'demo@ubereats.vn', 
  'demouser',
  '$2a$12$hashed_password_here',
  '+84987654321',
  1,
  1,
  'customer'
);
```

### Test Credentials:
```javascript
// Test User 1
{
  email: "demo@ubereats.vn",
  password: "Demo123!@#",
  phone: "+84987654321"
}

// Test User 2 (tạo qua đăng ký)
{
  name: "Nguyễn Văn Test",
  email: "test@example.com", 
  password: "Test123!@#",
  phone: "+84912345678"
}
```

## 📋 Checklist Hoàn Thành

### Backend Setup:
- [ ] MySQL database đã tạo và import schema
- [ ] Backend dependencies đã install
- [ ] File .env đã cấu hình đầy đủ
- [ ] Database connection test thành công
- [ ] Backend server chạy không lỗi

### Frontend Setup:  
- [ ] Frontend dependencies đã install
- [ ] Frontend server chạy không lỗi
- [ ] API calls kết nối được backend
- [ ] Giao diện hiển thị tiếng Việt

### Authentication Features:
- [ ] Đăng ký email/password hoạt động
- [ ] Đăng nhập email/password hoạt động  
- [ ] Email OTP verification hoạt động
- [ ] SMS OTP verification hoạt động (nếu có Twilio)
- [ ] Quên mật khẩu hoạt động
- [ ] Google OAuth hoạt động (nếu có config)
- [ ] Facebook OAuth hoạt động (nếu có config)

### UI/UX:
- [ ] Giao diện responsive trên mobile
- [ ] Chuyển đổi ngôn ngữ Việt/Anh hoạt động
- [ ] Dark/Light mode hoạt động
- [ ] Form validation hiển thị tiếng Việt
- [ ] Error messages hiển thị tiếng Việt

## 🎉 Kết Quả

Sau khi hoàn thành setup, bạn sẽ có:

✅ **Hệ thống authentication hoàn chỉnh**
✅ **Giao diện tiếng Việt chuyên nghiệp** 
✅ **Multi-method authentication** (email, phone, social)
✅ **OTP verification** qua SMS và email
✅ **Secure password reset** 
✅ **Modern UI/UX** với Vuetify 3
✅ **Production-ready** code

Hệ thống sẵn sàng để phát triển thêm các tính năng khác của ứng dụng UberEat!

---

**🆘 Cần hỗ trợ?**
- Kiểm tra file `VIETNAMESE_AUTH_SYSTEM.md` để hiểu rõ hơn về các tính năng
- Xem demo tại `/auth-demo` để trải nghiệm đầy đủ
- Check backend logs trong thư mục `backend/logs/`