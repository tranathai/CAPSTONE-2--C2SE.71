# Script to start MongoDB locally

Write-Host "Starting MongoDB..." -ForegroundColor Yellow

# Try to start MongoDB service
$service = Get-Service MongoDB -ErrorAction SilentlyContinue

if ($service) {
    Start-Service MongoDB
    Write-Host "MongoDB service started!" -ForegroundColor Green
} else {
    Write-Host "MongoDB not installed as service. Starting manually..." -ForegroundColor Yellow
    
    # Create data directory if not exists
    $dataPath = "D:\mongodb-data"
    if (-not (Test-Path $dataPath)) {
        New-Item -ItemType Directory -Path $dataPath
        Write-Host "Created data directory at $dataPath" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "Run this command in a NEW terminal window:" -ForegroundColor Cyan
    Write-Host "mongod --dbpath $dataPath" -ForegroundColor White
    Write-Host ""
    Write-Host "Or download MongoDB from: https://www.mongodb.com/try/download/community" -ForegroundColor Yellow
}
