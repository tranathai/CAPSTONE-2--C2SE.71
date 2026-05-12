# In IP LAN và gợi ý .env cho máy KHÁC kết nối vào MySQL trên máy này.
# Chạy: powershell -ExecutionPolicy Bypass -File scripts\print-lan-db-env.ps1

$addrs = Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.InterfaceAlias -notmatch 'Loopback' -and $_.IPAddress -notlike '169.*' }
$private = $addrs | Where-Object {
  $a = $_.IPAddress
  $a -like '192.168.*' -or $a -like '10.*' -or ($a -match '^172\.(1[6-9]|2[0-9]|3[0-1])\.')
}
$ip = ($private | Select-Object -First 1).IPAddress
if (-not $ip) { $ip = ($addrs | Select-Object -First 1).IPAddress }

Write-Host ""
Write-Host "IP LAN cua may chay MySQL (gan cho DB_HOST tren may khac):" -ForegroundColor Cyan
Write-Host "  $ip"
Write-Host ""
Write-Host "Trong backend/.env tren MOI may trong nhom (may khac, khong phai may chu):" -ForegroundColor Yellow
Write-Host @"
  DB_HOST=$ip
  DB_PORT=3306
  DB_USER=mentor_shared
  DB_PASSWORD=YOUR_PASSWORD
  DB_NAME=mentorai_grad
"@
Write-Host ""
Write-Host "Tren CHINH may chu MySQL co the van dung DB_HOST=localhost." -ForegroundColor DarkGray
Write-Host "Mo firewall Windows cho port 3306 (can chay PowerShell Admin):" -ForegroundColor DarkGray
Write-Host '  netsh advfirewall firewall add rule name="MySQL 3306" dir=in action=allow protocol=TCP localport=3306'
Write-Host ""
