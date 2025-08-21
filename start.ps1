# Quick start script for Windows PowerShell

Write-Host "🚀 Vercel Branch Deployer - Starting..." -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check if package.json exists
if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json not found. Please run this script from the project directory." -ForegroundColor Red
    exit 1
}

# Check if node_modules exists, install if not
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found. Please create .env with your VERCEL_TOKEN" -ForegroundColor Red
    Write-Host "   Example: VERCEL_TOKEN=your_token_here" -ForegroundColor Yellow
    exit 1
}

# Start the server
Write-Host "🚀 Starting Vercel Branch Deployer..." -ForegroundColor Green
Write-Host "📱 Open your browser to: http://localhost:3000" -ForegroundColor Cyan
Write-Host "⏹️  Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host "" -ForegroundColor White

npm start