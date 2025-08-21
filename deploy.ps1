# Quick deployment script for Windows PowerShell
# Run this after configuring your project

Write-Host "🚀 Vercel Auto Deploy - Deployment Script" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Check if wrangler is installed
try {
    $wranglerVersion = wrangler --version
    Write-Host "✅ Wrangler is installed: $wranglerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Wrangler is not installed. Please run: npm install -g wrangler" -ForegroundColor Red
    exit 1
}

# Check if user is logged in
Write-Host "`n📝 Checking Cloudflare authentication..." -ForegroundColor Yellow
try {
    wrangler whoami
} catch {
    Write-Host "❌ Not logged in to Cloudflare. Please run: wrangler login" -ForegroundColor Red
    exit 1
}

# Check if VERCEL_TOKEN secret is set
Write-Host "`n🔑 Checking if VERCEL_TOKEN secret is configured..." -ForegroundColor Yellow
$secretSet = Read-Host "Have you set the VERCEL_TOKEN secret? (y/n)"
if ($secretSet -ne "y" -and $secretSet -ne "Y") {
    Write-Host "❌ Please set your Vercel token first: wrangler secret put VERCEL_TOKEN" -ForegroundColor Red
    exit 1
}

# Check if GitHub repo is configured
Write-Host "`n⚙️ Checking GitHub repository configuration..." -ForegroundColor Yellow
$configUpdated = Read-Host "Have you updated the GitHub repository in functions/api/deploy.js? (y/n)"
if ($configUpdated -ne "y" -and $configUpdated -ne "Y") {
    Write-Host "❌ Please update the GitHub repository in functions/api/deploy.js first" -ForegroundColor Red
    Write-Host "   - Update 'githubRepo' with your GitHub repository (username/repo)" -ForegroundColor Yellow
    Write-Host "   - Note: Project names are now auto-loaded from Vercel!" -ForegroundColor Green
    exit 1
}

# Deploy to Cloudflare Pages
Write-Host "`n🚀 Deploying to Cloudflare Pages..." -ForegroundColor Green
try {
    wrangler pages deploy . --project-name=vercel-auto-deploy
    Write-Host "`n✅ Deployment successful!" -ForegroundColor Green
    Write-Host "🌐 Your app should be available at: https://vercel-auto-deploy.pages.dev" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Deployment failed. Please check the error above." -ForegroundColor Red
    exit 1
}

Write-Host "`n🎉 All done! You can now use your Vercel Auto Deploy app." -ForegroundColor Green