# MentorAI Grad - Quick Setup Script
# This script helps you setup both backend and frontend quickly

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MentorAI Grad - Quick Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if MongoDB is running
Write-Host "1. Checking MongoDB status..." -ForegroundColor Yellow
$mongoProcess = Get-Process mongod -ErrorAction SilentlyContinue
if ($null -eq $mongoProcess) {
    Write-Host "   Warning: MongoDB is not running!" -ForegroundColor Red
    Write-Host "   Please start MongoDB before continuing." -ForegroundColor Red
    Write-Host "   Run: mongod" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "   MongoDB is running!" -ForegroundColor Green
}

# Setup Backend
Write-Host ""
Write-Host "2. Setting up Backend..." -ForegroundColor Yellow
Set-Location backend

if (Test-Path "node_modules") {
    Write-Host "   Dependencies already installed." -ForegroundColor Green
} else {
    Write-Host "   Installing backend dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host "   Backend dependencies installed!" -ForegroundColor Green
}

Set-Location ..

# Setup Frontend
Write-Host ""
Write-Host "3. Setting up Frontend..." -ForegroundColor Yellow
Set-Location frontend

if (Test-Path "node_modules") {
    Write-Host "   Dependencies already installed." -ForegroundColor Green
} else {
    Write-Host "   Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host "   Frontend dependencies installed!" -ForegroundColor Green
}

Set-Location ..

# Display instructions
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "To start the application:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start Backend (in terminal 1):" -ForegroundColor Yellow
Write-Host "   cd backend" -ForegroundColor White
Write-Host "   npm start" -ForegroundColor White
Write-Host "   Backend will run at: http://localhost:5000" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start Frontend (in terminal 2):" -ForegroundColor Yellow
Write-Host "   cd frontend" -ForegroundColor White
Write-Host "   npm start" -ForegroundColor White
Write-Host "   Frontend will run at: http://localhost:3000" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
