# Deploy miễn phí: Vercel (Frontend) + Render (API) + Railway (MySQL)

Hướng dẫn deploy MentorAI Grad **0đ** (free tier). URL kiểu:

- Frontend: `https://mentorai-grad.vercel.app`
- API: `https://mentorai-grad-api.onrender.com`

> **Lưu ý:** Render **không có MySQL miễn phí** → dùng **Railway** (free credit) chỉ cho database. Vẫn là stack free tổng thể.

---

## Chuẩn bị

1. Tài khoản GitHub (đẩy code repo lên GitHub).
2. Đăng ký miễn phí:
   - [Vercel](https://vercel.com)
   - [Render](https://render.com)
   - [Railway](https://railway.app) (MySQL)

3. **Không** commit file `.env` có mật khẩu / API key thật lên GitHub.

---

## Bước 1 — MySQL trên Railway (free)

1. Railway → **New Project** → **Provision MySQL**.
2. Vào service MySQL → tab **Connect** / **Variables**, copy:
   - `MYSQLHOST` → `DB_HOST`
   - `MYSQLPORT` → `DB_PORT`
   - `MYSQLUSER` → `DB_USER`
   - `MYSQLPASSWORD` → `DB_PASSWORD`
   - `MYSQLDATABASE` → `DB_NAME`
3. Bật **Public networking** (nếu Railway yêu cầu) để Render kết nối được từ internet.

Giữ các giá trị này cho Bước 2.

---

## Bước 2 — Backend trên Render

1. [Render Dashboard](https://dashboard.render.com) → **New** → **Web Service**.
2. Connect repo GitHub → chọn repo capstone.
3. Cấu hình:
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance type:** Free

4. **Environment Variables** (Add):

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `HOST` | `0.0.0.0` |
| `DB_HOST` | *(từ Railway)* |
| `DB_PORT` | *(từ Railway)* |
| `DB_USER` | *(từ Railway)* |
| `DB_PASSWORD` | *(từ Railway)* |
| `DB_NAME` | *(từ Railway)* |
| `JWT_SECRET` | Chuỗi dài ngẫu nhiên (khác dev) |
| `JWT_EXPIRE` | `7d` |
| `FRONTEND_URL` | Để tạm `http://localhost:5173` — **sửa lại sau Bước 3** thành URL Vercel |
| `GEMINI_API_KEY` | *(tùy chọn)* |

5. **Create Web Service** → đợi deploy xong.

6. Kiểm tra: mở `https://<tên-service>.onrender.com/api/health` → JSON `success: true`.

7. Lần đầu chạy, backend **tự bootstrap** bảng MySQL (giống local).

**Hạn chế free Render:**

- Service **ngủ** sau ~15 phút không truy cập → lần mở đầu **chậm 30–60 giây**.
- File upload lưu trên **ổ đĩa tạm** → redeploy có thể **mất file** đã upload (demo ổn, production cần S3 sau).

---

## Bước 3 — Frontend trên Vercel

1. [Vercel](https://vercel.com) → **Add New** → **Project** → import repo GitHub.
2. Cấu hình:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

3. **Environment Variables** (Production):

| Key | Value |
|-----|--------|
| `VITE_API_BASE_URL` | `https://<tên-render>.onrender.com/api` |
| `VITE_API_ORIGIN` | `https://<tên-render>.onrender.com` |

*(Xem mẫu `frontend/.env.production.example`.)*

4. **Deploy** → copy URL Vercel, ví dụ `https://mentorai-grad.vercel.app`.

5. Quay lại **Render** → sửa `FRONTEND_URL`:

```env
FRONTEND_URL=https://mentorai-grad.vercel.app
```

(Nếu có preview URL, thêm cách nhau bởi dấu phẩy: `https://xxx.vercel.app,https://yyy.vercel.app`)

6. **Redeploy** backend Render (Manual Deploy) để CORS + Socket áp dụng.

---

## Bước 4 — Kiểm tra

1. Mở URL Vercel → `/login`.
2. Đăng nhập tài khoản admin/sinh viên (seed sau bootstrap, hoặc tạo qua admin).
3. Thử upload bài, tin nhắn (Socket cần `VITE_API_ORIGIN` trỏ đúng Render).

---

## Sửa lỗi thường gặp

| Triệu chứng | Cách xử lý |
|-------------|-----------|
| CORS / API blocked | `FRONTEND_URL` trên Render = đúng URL Vercel (không slash cuối) |
| 401 / login OK nhưng API lỗi | Kiểm tra `VITE_API_BASE_URL` có `/api` ở cuối path base |
| Socket không realtime | `VITE_API_ORIGIN` = URL Render **không** có `/api` |
| API chậm lần đầu | Render free đang wake — đợi thêm |
| Bootstrap DB fail | Kiểm tra Railway MySQL public + đúng `DB_*` |
| Upload 404 sau vài ngày | Free tier mất file khi redeploy — upload lại hoặc dùng storage cloud |

---

## Tóm tắt biến môi trường

```text
Railway (MySQL)  ←──  Render (Node API :443)
                           ↑
                    Vercel (React static)
                    VITE_API_* → Render
                    FRONTEND_URL ← Vercel URL
```

---

## Tùy chọn: deploy nhanh bằng Blueprint Render

Repo có `backend/render.yaml`. Trên Render: **New → Blueprint**, connect repo, điền biến môi trường khi được hỏi.

---

Sau khi deploy xong, ghi link Vercel vào README / slide báo cáo đồ án.
