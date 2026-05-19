# Làm deploy hộ bạn — checklist 15 phút

Mình **không thể** đăng nhập Railway / Render / Vercel thay bạn (cần tài khoản GitHub của bạn).  
Đã chuẩn bị sẵn trên repo — bạn chỉ **bấm theo 4 phần** dưới đây.

---

## Phần 0 — Code trên GitHub

Đảm bảo branch `main` có các file deploy mới (`docs/`, `frontend/vercel.json`, `.github/workflows/...`).  
Nếu chưa push, trong máy chạy:

```powershell
cd d:\minecraft\cap2\CAPSTONE-2--C2SE.71
git add README.md backend docs frontend .github
git commit -m "Add free deploy config (Vercel, Render, GitHub Pages)"
git push origin main
```

---

## Phần 1 — MySQL (Railway) ~5 phút

1. Mở: **https://railway.app** → Login **GitHub**
2. **New Project** → **Provision MySQL**
3. Click service MySQL → **Variables** / **Connect**, ghi lại:
   - `MYSQLHOST` → dùng làm `DB_HOST`
   - `MYSQLPORT` → `DB_PORT`
   - `MYSQLUSER` → `DB_USER`
   - `MYSQLPASSWORD` → `DB_PASSWORD`
   - `MYSQLDATABASE` → `DB_NAME`
4. Bật **Public URL** nếu có (để Render kết nối được)

---

## Phần 2 — API (Render) ~5 phút

1. Mở: **https://dashboard.render.com** → Login **GitHub**
2. **New +** → **Web Service** → repo `CAPSTONE-2--C2SE.71`
3. Điền:
   - **Root Directory:** `backend`
   - **Build:** `npm install`
   - **Start:** `npm start`
   - **Free** instance
4. **Environment** (Add):

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `HOST` | `0.0.0.0` |
| `DB_HOST` | *(Railway)* |
| `DB_PORT` | *(Railway)* |
| `DB_USER` | *(Railway)* |
| `DB_PASSWORD` | *(Railway)* |
| `DB_NAME` | *(Railway)* |
| `JWT_SECRET` | Chuỗi bất kỳ dài 32+ ký tự |
| `JWT_EXPIRE` | `7d` |
| `FRONTEND_URL` | Tạm để trống, sửa sau Phần 3 |
| `GEMINI_API_KEY` | Key Gemini (nếu dùng AI) |

5. **Create** → đợi **Live**
6. Copy URL, ví dụ: `https://mentorai-grad-api.onrender.com`
7. Mở `https://...onrender.com/api/health` → thấy `"success":true`

---

## Phần 3 — Frontend (chọn 1 cách)

### Cách A — Vercel (dễ, URL đẹp)

1. **https://vercel.com** → Import repo `CAPSTONE-2--C2SE.71`
2. **Root Directory:** `frontend`
3. Environment:

```env
VITE_API_BASE_URL=https://YOUR-RENDER-URL.onrender.com/api
VITE_API_ORIGIN=https://YOUR-RENDER-URL.onrender.com
```

4. Deploy → copy URL Vercel
5. Render → sửa `FRONTEND_URL` = URL Vercel → **Manual Deploy**

### Cách B — GitHub Pages (đã có workflow tự deploy)

1. Repo GitHub → **Settings** → **Pages** → Source: **GitHub Actions**
2. **Settings** → **Secrets and variables** → **Actions** → New secret:
   - `VITE_API_BASE_URL` = `https://YOUR-RENDER.onrender.com/api`
   - `VITE_API_ORIGIN` = `https://YOUR-RENDER.onrender.com`
3. Push `main` hoặc **Actions** → chạy workflow **Deploy frontend**
4. URL: `https://tranathai.github.io/CAPSTONE-2--C2SE.71/`
5. Render → `FRONTEND_URL` = URL Pages trên (không slash cuối) → Redeploy

---

## Phần 4 — Xong

- Mở URL frontend → `/login`
- Lần đầu API Render free có thể **chậm 30–60s** (đang wake)

Chi tiết: [DEPLOY_FREE_VERCEL_RENDER.md](./DEPLOY_FREE_VERCEL_RENDER.md)
