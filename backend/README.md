# MentorAI Grad Backend

Backend REST API cho quy trình review submission của Supervisor.

## 1) Cài đặt

```bash
npm install
```

## 2) Cấu hình biến môi trường

Tạo file `.env` từ `.env.example`:

```bash
copy .env.example .env
```

Sau đó sửa giá trị trong `.env` cho đúng MySQL của bạn:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=mentor_ai_grad
PORT=3000
```

## 3) Chạy server

```bash
npm run dev
```

hoặc:

```bash
npm start
```

## 4) Seed dữ liệu test

Chạy file:

```bash
sql/test-data.sql
```

## 5) API endpoints

### `GET /api/submissions/:id`

Lấy thông tin bài nộp (latest version theo `version_number`).

Response thành công:

```json
{
  "success": true,
  "data": {
    "file_path": "/uploads/reports/final-report-v2.pdf",
    "version_number": 2,
    "team_name": "CS-401 Senior Capstone",
    "student_name": "Alex Smith"
  }
}
```

### `GET /api/feedbacks/:versionId`

Lấy danh sách feedback theo version, sắp xếp mới nhất trước.

### `POST /api/feedbacks`

Body JSON:

```json
{
  "submission_version_id": 2,
  "supervisor_id": 2,
  "content": "Nội dung feedback..."
}
```

Quy tắc:
- Validate đầy đủ input
- Chỉ user có role `supervisor` mới được tạo feedback
- Trả về JSON rõ ràng với `success`, `message`, `data`

