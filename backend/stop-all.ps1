# Stop All Backend Services
# Kills all Node.js processes running the backend services

Write-Host "🛑 Stopping all backend services..." -ForegroundColor Yellow
Write-Host ""

# Get all Node.js processes
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "Found $($nodeProcesses.Count) Node.js process(es)" -ForegroundColor Cyan
    
    # Stop all Node.js processes
    $nodeProcesses | Stop-Process -Force
    
    Write-Host "✅ All Node.js processes stopped" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No Node.js processes found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
