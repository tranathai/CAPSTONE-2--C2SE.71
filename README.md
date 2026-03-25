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
- React 18 (JSX)
- React Router DOM v7
- Axios
- CSS3
- localStorage (quản lý submissions)

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

4. **Dashboard Sinh viên** (`/dashboard`)
   - Hiển thị thông tin người dùng và project của sinh viên
   - Phần **Recent Submissions**: Danh sách các đề tài sinh viên đã đăng ký
     - Xem trạng thái: ⏳ Pending, ✓ Accepted, ✕ Denied
   - Nút **+ Submit Update**: Chỉnh sửa đề tài đang pending và lưu lại
   - Nút **+ New Project**: Tạo đề tài mới
   - Nút **Logout**: Đăng xuất

5. **Dashboard Giáo viên** (`/teacher-dashboard`)
   - Quản lý và giám sát các đề tài của sinh viên
   - Phần **Recent Submissions** với filter tabs:
     - **⏳ Waiting for Review**: Hiển thị đề tài chờ duyệt
     - **✓ Reviewed**: Hiển thị đề tài đã được phê duyệt hoặc từ chối
   - Action buttons:
     - **Review**: Để xem chi tiết và phê duyệt/từ chối đề tài pending
     - **View Details**: Để xem thông tin đề tài đã approve
     - **View Feedback**: Để xem lý do từ chối
   - Modal review với 2 nút:
     - **Duyet (accept)**: Phê duyệt đề tài
     - **Tu choi (deny)**: Từ chối đề tài kèm lý do

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
│   │   ├── RoleSelection.jsx           # Trang chọn vai trò
│   │   ├── RoleSelection.css
│   │   ├── Login.jsx                   # Trang đăng nhập
│   │   ├── Login.css
│   │   ├── Register.jsx                # Trang đăng ký
│   │   ├── Register.css
│   │   ├── Dashboard.jsx               # Trang dashboard sinh viên
│   │   ├── Dashboard.css
│   │   ├── ProjectRegistration.jsx     # Form đăng ký/chỉnh sửa đề tài
│   │   ├── ProjectRegistration.css
│   │   ├── TeacherDashboard.jsx        # Trang dashboard giáo viên
│   │   └── TeacherDashboard.css
│   ├── App.jsx                          # Main app với routing
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

## Lưu trữ dữ liệu

- **Backend**: MongoDB lưu trữ thông tin user (email, password, fullName, role)
- **Frontend**: localStorage lưu trữ:
  - `token`: JWT token cho authentication
  - `user`: Thông tin user hiện tại
  - `mentorai_project_submissions`: Danh sách submissions của sinh viên
    - Cấu trúc: `{ id, projectTitle, description, techStack[], studentName, studentEmail, status, submittedAt, updatedAt?, reviewReason?, reviewedBy? }`
    - Status có thể là: `pending`, `access` (approved), `deny` (denied)

## Tính năng Chi tiết

### Sinh viên
- ✅ Đăng nhập/Đăng ký với vai trò Student
- ✅ Xem danh sách các đề tài đã đăng ký
- ✅ Tạo đề tài mới (Project Registration)
- ✅ Chỉnh sửa đề tài đang pending status
- ✅ Xem trạng thái phê duyệt: Pending, Accepted, Denied
- ✅ Submit update để cập nhật đề tài pending
- ✅ Quản lý thông tin cá nhân (Profile)

### Giáo viên
- ✅ Đăng nhập/Đăng ký với vai trò Teacher
- ✅ Xem danh sách đề tài chờ phê duyệt (Waiting for Review)
- ✅ Xem danh sách đề tài đã phê duyệt (Reviewed)
- ✅ Phê duyệt đề tài (Duyet)
- ✅ Từ chối đề tài với lý do (Tu choi)
- ✅ Xem chi tiết đề tài: tên đề tài, mô tả, tech stack
- ✅ Quản lý thông tin cá nhân (Profile)

## Phát triển tiếp

Các tính năng có thể thêm vào:
- Lưu submissions lên Backend (DB) thay vì localStorage
- API endpoints cho Project CRUD operations
- Notification system khi submission được review
- Email notification khi submission được approve/deny
- Search và filter functionality
- Upload file (document, presentation, source code)
- Comment/Discussion trên submissions
- Version control cho submissions
- Reset password
- Email verification
- Social login (Google, Facebook)
- Upload avatar
- 2FA (Two-Factor Authentication)
- Schedule/Timeline cho submission deadlines

## License

ISC
