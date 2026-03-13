# MentorAI Grad - Authentication System

Hệ thống đăng nhập và đăng ký cho MentorAI Grad với phân quyền Student/Teacher.

## Tính năng

- ✅ Chọn vai trò (Student hoặc Teacher) trước khi đăng nhập
- ✅ Đăng nhập với email và mật khẩu
- ✅ Đăng ký tài khoản mới
- ✅ Phân quyền theo vai trò
- ✅ JWT Authentication
- ✅ Dashboard sau khi đăng nhập thành công

## Công nghệ sử dụng

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT (JSON Web Tokens)
- bcryptjs (mã hóa mật khẩu)

### Database schema dự phòng
- Thư mục `database/` đã có sẵn schema MySQL cho `users`, `students`, `lecturers` để tích hợp sau này.

### Frontend
- React (JSX)
- React Router DOM
- Axios
- CSS3

## Cài đặt

### 1. Cài đặt MongoDB

Đảm bảo MongoDB đã được cài đặt và đang chạy trên máy của bạn.

```bash
# Kiểm tra MongoDB
mongod --version
```

### 2. Cài đặt Backend

```bash
cd backend
npm install
```

Cấu hình file `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mentoral_grad
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRE=7d
```

Khởi động server:
```bash
npm start
# Hoặc sử dụng nodemon cho development
npm run dev
```

Server sẽ chạy tại: `http://localhost:5000`

### 3. Cài đặt Frontend

```bash
cd frontend
npm install
```

Khởi động ứng dụng React:
```bash
npm start
```

Ứng dụng sẽ chạy tại: `http://localhost:3000`

## Luồng hoạt động

1. **Trang chọn vai trò** (`/`)
   - Người dùng chọn đăng nhập với tư cách Student hoặc Teacher
   - Click vào card tương ứng để chuyển đến trang login

2. **Trang đăng nhập** (`/login/:role`)
   - Nhập email và password
   - Click "Sign In" để đăng nhập
   - Có thể chuyển sang trang đăng ký nếu chưa có tài khoản

3. **Trang đăng ký** (`/register/:role`)
   - Nhập họ tên, email, mật khẩu và xác nhận mật khẩu
   - Click "Register" để tạo tài khoản mới
   - Tự động đăng nhập sau khi đăng ký thành công

4. **Dashboard** (`/dashboard`)
   - Hiển thị thông tin người dùng
   - Có nút Logout để đăng xuất

## API Endpoints

### Authentication

#### Đăng ký
```
POST /api/auth/register
Body: {
  email: string,
  password: string,
  fullName: string,
  role: "student" | "teacher"
}
```

#### Đăng nhập
```
POST /api/auth/login
Body: {
  email: string,
  password: string,
  role: "student" | "teacher"
}
```

#### Lấy thông tin user hiện tại
```
GET /api/auth/me
Headers: {
  Authorization: "Bearer <token>"
}
```

## Cấu trúc thư mục

```
backend/
├── config/
│   └── database.js          # Kết nối MongoDB
├── controllers/
│   └── authController.js    # Controllers xử lý authentication
├── middleware/
│   └── authMiddleware.js    # Middleware bảo vệ routes
├── models/
│   └── User.js             # Model User schema
├── routes/
│   └── authRoutes.js       # Routes cho authentication
├── .env                    # Environment variables
├── package.json
└── server.js              # Entry point

database/
├── README.md              # Hướng dẫn import schema MySQL
└── schema_mysql.sql       # Schema MySQL cho users/students/lecturers

frontend/
├── public/
│   └── index.html
├── src/
│   ├── pages/
│   │   ├── RoleSelection.jsx      # Trang chọn vai trò
│   │   ├── RoleSelection.css
│   │   ├── Login.jsx             # Trang đăng nhập
│   │   ├── Login.css
│   │   ├── Register.jsx          # Trang đăng ký
│   │   ├── Register.css
│   │   ├── Dashboard.jsx         # Trang dashboard
│   │   └── Dashboard.css
│   ├── App.jsx                   # Main app với routing
│   ├── App.css
│   ├── index.jsx
│   └── index.css
└── package.json
```

## Bảo mật

- Mật khẩu được mã hóa bằng bcryptjs trước khi lưu vào database
- Sử dụng JWT tokens cho authentication
- Protected routes với middleware authentication
- Validation dữ liệu đầu vào với express-validator

## Phát triển tiếp

Các tính năng có thể thêm vào:
- Reset password
- Email verification
- Social login (Google, Facebook)
- Profile management
- Role-based dashboard với các tính năng riêng cho Student/Teacher
- Upload avatar
- 2FA (Two-Factor Authentication)

## License

ISC
