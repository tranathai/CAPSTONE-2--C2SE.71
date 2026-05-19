# Mở các trang deploy — chạy: powershell -ExecutionPolicy Bypass -File scripts/open-deploy-sites.ps1

$urls = @(
  "https://railway.app/new",
  "https://dashboard.render.com/",
  "https://vercel.com/new",
  "https://github.com/tranathai/CAPSTONE-2--C2SE.71/settings/pages",
  "https://github.com/tranathai/CAPSTONE-2--C2SE.71/settings/secrets/actions"
)

foreach ($u in $urls) {
  Start-Process $u
  Start-Sleep -Milliseconds 400
}

Write-Host "Da mo: Railway, Render, Vercel, GitHub Pages, GitHub Secrets"
Write-Host "Lam theo: docs/DEPLOY_LAM_HO_BAN.md"
