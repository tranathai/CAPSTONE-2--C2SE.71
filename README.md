# MentorAI Grad

**Hệ thống quản lý đồ án tốt nghiệp (Capstone) có hỗ trợ tóm tắt phản hồi bằng AI**

MentorAI Grad là ứng dụng web hỗ trợ sinh viên, giảng viên hướng dẫn và quản trị viên trong suốt vòng đời đồ án: đăng ký đề tài, quản lý đợt/mốc, nộp tài liệu theo mốc, nhận phản hồi, tóm tắt AI, lịch họp và nhắn tin.

---

## Tổng quan

Luồng nghiệp vụ chính:

```text
Đăng ký đề tài → Duyệt đề tài → Đợt tốt nghiệp / Mốc → Nộp bài (nhiều phiên bản)
→ Phản hồi GV → Tóm tắt AI (lưu DB) → Dashboard / Thông báo
```

---

## Tính năng chính

### Quản lý người dùng
- Đăng nhập JWT (`/api/auth/login`)
- Phân quyền theo vai trò: **student**, **supervisor**, **admin**
- Admin: tạo/khóa tài khoản, import CSV

### Đề tài & nhóm
- Sinh viên đăng ký đề tài theo nhóm
- Giảng viên duyệt/từ chối; chọn mốc thuộc **một đợt tốt nghiệp**
- Một sinh viên chỉ thuộc **một nhóm** trong cùng học kỳ + năm học
- Sinh viên có thể tham gia nhiều nhóm ở các học kỳ/đợt khác nhau

### Đợt tốt nghiệp & mốc (Admin)
- Tạo **đợt tốt nghiệp** (bắt buộc khung thời gian bắt đầu/kết thúc)
- Tạo **mốc** gắn đợt; cấu hình **tài liệu cần nộp** (`required_documents`)
- Validate trùng thời gian mốc; không tạo mốc mới khi đợt đã kết thúc

### Nộp bài
- Nộp file theo mốc; chọn **tag tài liệu** từ danh sách mốc (thay tiêu đề tự do)
- Nhiều **phiên bản** (`submission_versions`) cho mỗi bài nộp
- Xem trước PDF / tải file

### Phản hồi & AI
- Giảng viên gửi phản hồi theo phiên bản bài nộp
- Sinh viên **tóm tắt AI** (Google Gemini); kết quả lưu `feedbacks.ai_summary`
- Mỗi dòng tóm tắt có ghi chú: *bản tóm tắt này chỉ mang tính chất tham khảo*

### Khác
- Thông báo trong app
- Lịch họp & yêu cầu họp (sinh viên ↔ giảng viên)
- Tin nhắn 1-1, nhóm theo team, theo đề tài (Socket.IO)
- Dashboard thống kê (admin / giảng viên)

---

## Kiến trúc

```text
┌─────────────────────┐
│  Frontend (React)   │  Vite · React Router · Axios · MUI
│  localhost:5173     │
└──────────┬──────────┘
           │ REST + WebSocket
┌──────────▼──────────┐
│  Backend (Node.js)  │  Express 5 · JWT · Multer
│  localhost:5000     │
└──────────┬──────────┘
           │ mysql2
┌──────────▼──────────┐
│  MySQL              │  Database: mentorai_grad
│  (bootstrap tự động)│
└─────────────────────┘
           │
┌──────────▼──────────┐
│  Gemini API         │  Tóm tắt phản hồi (tùy chọn)
└─────────────────────┘
```

---

## Công nghệ

| Tầng | Công nghệ |
|------|-----------|
| Frontend | React 19, Vite 8, React Router 7, Axios, MUI, Socket.IO Client, Recharts |
| Backend | Node.js, Express 5, mysql2, JWT, bcryptjs, Multer, Socket.IO |
| Database | **MySQL 8** (utf8mb4) |
| AI | Google Gemini API (`GEMINI_API_KEY`) |

---

## Vai trò hệ thống

| Vai trò | Đường dẫn UI | Mô tả |
|---------|--------------|--------|
| **student** | `/student/*` | Đề tài, nộp bài, xem phản hồi & tóm tắt AI, nhóm, lịch họp, tin nhắn |
| **supervisor** | `/supervisor/*` | Duyệt đề tài, xem/nhận xét bài nộp, quản lý nhóm, lịch họp |
| **admin** | `/admin/*` | Người dùng, nhóm, đợt/mốc, dashboard |

---

## Cơ sở dữ liệu (MySQL)

Database mặc định: **`mentorai_grad`**.

Backend **tự tạo database và bảng** khi khởi động (`backend/src/config/bootstrap.js`) — không bắt buộc chạy SQL thủ công, nhưng có thể tham khảo:

- `database/schema_mysql.sql` — schema tham khảo
- `backend/sql/` — script bổ trợ

### Bảng chính

```text
roles, users
student_profiles, supervisor_profiles
graduation_batches, milestones
teams, team_members
topic_registrations, topics
submissions, submission_versions
feedbacks          (cột ai_summary: tóm tắt AI đã lưu)
meetings, meeting_participants, meeting_requests
messages, notifications, system_config
```

### Quan hệ (rút gọn)

```text
users ── team_members ── teams ── topic_registrations
                              └── submissions ── submission_versions ── feedbacks
graduation_batches ── milestones ── submissions (milestone_id)
```

---

## Cấu trúc thư mục

```text
CAPSTONE-2--C2SE.71/
├── backend/
│   ├── src/
│   │   ├── config/          # db.js, bootstrap.js (MySQL auto-migrate)
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── server.js        # Express + Socket.IO
│   ├── uploads/             # File nộp bài
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── student/     # Dashboard, Submissions, Review, Feedback, ...
│   │   │   ├── mentor/      # Supervisor UI
│   │   │   └── admin/       # Users, Teams, Milestones
│   │   ├── components/
│   │   ├── context/         # AuthContext, SocketContext
│   │   └── lib/api.js       # Axios client
│   └── package.json
├── database/                # schema MySQL tham khảo
└── README.md
```

---

## API (tóm tắt)

Base URL: `http://localhost:5000/api`  
Header: `Authorization: Bearer <token>`

| Nhóm | Endpoint | Ghi chú |
|------|----------|---------|
| Health | `GET /health` | Kiểm tra server |
| Auth | `POST /auth/login`, `GET /auth/me` | JWT |
| Users | `GET/PUT /users/me`, `GET/POST /users` | Admin quản lý user |
| Teams | `GET /teams/joined`, `POST /teams`, `GET /teams/semester-busy-students` | Nhóm & validate semester |
| Topics | `POST /topics/register`, `GET /topics/my`, `PUT /topics/:id/approve` | Đề tài |
| Milestones | `GET /milestones`, `GET /milestones/batches`, `POST /milestones/batches` | Admin |
| Submissions | `GET /submissions/my`, `POST /submissions/student/upload`, `GET /submissions/supervisor` | Nộp bài |
| Feedbacks | `GET /feedbacks/version/:versionId`, `POST /feedbacks` | GV gửi phản hồi |
| AI | `POST /ai/summarize-feedback` | Body: `{ content, feedback_id }` |
| Meetings | `GET /meetings`, `POST /meetings/request` | Lịch họp |
| Messages | `GET /messages/contacts`, `POST /messages`, `GET /messages/groups/:teamId` | Chat |
| Notifications | `GET /notifications`, `PUT /notifications/read-all` | Thông báo |

Phản hồi JSON chuẩn: `{ success: true|false, data?, message? }`.

---

## Cài đặt & chạy

### Yêu cầu

- **Node.js** 18+
- **MySQL** 8.x (service đang chạy)
- (Tùy chọn) **Gemini API key** cho tóm tắt AI

### 1. Clone repository

```bash
git clone <url-repo>
cd CAPSTONE-2--C2SE.71
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Chỉnh `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=mentorai_grad

PORT=5000
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173

# Tùy chọn — tóm tắt AI (nhiều key cách nhau bởi dấu phẩy)
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.0-flash,gemini-2.5-flash
```

Chạy backend (tự bootstrap MySQL lần đầu):

```bash
npm run dev
```

API: [http://localhost:5000](http://localhost:5000) · Health: [http://localhost:5000/api/health](http://localhost:5000/api/health)

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

UI: [http://localhost:5173](http://localhost:5173)

Frontend dev proxy gọi API qua `/api` → `localhost:5000` (cấu hình trong Vite).

### 4. Tài khoản

- Tài khoản do **admin** tạo qua `/admin/users`, hoặc dữ liệu seed khi bootstrap (nếu DB trống).
- Đăng nhập tại `/login` — hệ thống chuyển hướng theo role.

---

## Bảo mật

- Mật khẩu băm **bcrypt**
- Xác thực **JWT** trên mọi route bảo vệ
- **RBAC** qua `requireRole` (student / supervisor / admin)
- Upload file qua Multer; file phục vụ tại `/uploads`

---

## Scripts hữu ích

```bash
# Backend
cd backend && npm run dev    # nodemon
cd backend && npm start      # production

# Frontend
cd frontend && npm run dev
cd frontend && npm run build
```

---

## Ghi chú phát triển

- Schema MySQL được quản lý chủ yếu qua **`bootstrap.js`** khi server start; thêm cột mới dùng hàm `ensure*Column` trong file đó.
- File upload lưu tại `backend/uploads/`.
- Socket.IO dùng cho tin nhắn realtime (cùng port với HTTP server).
- Tóm tắt AI lưu tại `feedbacks.ai_summary`; sinh viên chỉ tóm tắt phản hồi của nhóm mình.

---

## Nhóm phát triển

Capstone Project — **MentorAI Grad**  
Đại học Duy Tân

---

## License

Dự án phục vụ mục đích học tập / đồ án tốt nghiệp.
