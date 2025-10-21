# Kill Orphaned MySQL Process
# Run this script to manually kill the orphaned MySQL process blocking port 3306

Write-Host "🔍 Checking for MySQL processes..." -ForegroundColor Cyan

# Find all mysqld processes
$mysqlProcesses = Get-Process mysqld -ErrorAction SilentlyContinue

if ($null -eq $mysqlProcesses -or $mysqlProcesses.Count -eq 0) {
    Write-Host "✅ No MySQL processes found running" -ForegroundColor Green
    Write-Host "✅ Port 3306 should be available" -ForegroundColor Green
    exit 0
}

Write-Host "⚠️  Found $($mysqlProcesses.Count) MySQL process(es):" -ForegroundColor Yellow

foreach ($proc in $mysqlProcesses) {
    Write-Host "   - PID: $($proc.Id)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔪 Attempting to kill MySQL processes..." -ForegroundColor Cyan

$killed = 0
$failed = 0

foreach ($proc in $mysqlProcesses) {
    try {
        Stop-Process -Id $proc.Id -Force -ErrorAction Stop
        Write-Host "   ✅ Killed process PID $($proc.Id)" -ForegroundColor Green
        $killed++
    }
    catch {
        Write-Host "   ❌ Failed to kill PID $($proc.Id): $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""

if ($failed -gt 0) {
    Write-Host "⚠️  Could not kill $failed process(es)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📋 Manual Steps Required:" -ForegroundColor Cyan
    Write-Host "   1. Press Ctrl+Shift+Esc to open Task Manager" -ForegroundColor White
    Write-Host "   2. Go to 'Details' tab" -ForegroundColor White
    Write-Host "   3. Find 'mysqld.exe'" -ForegroundColor White
    Write-Host "   4. Right-click -> End Task" -ForegroundColor White
    Write-Host "   5. Retry site creation in PressBox" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Or run this script as Administrator (right-click -> Run as Administrator)" -ForegroundColor Yellow
    exit 1
}
else {
    Write-Host "✅ Successfully killed $killed MySQL process(es)" -ForegroundColor Green
    Write-Host "✅ Port 3306 is now available" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 You can now restart PressBox and create a new site" -ForegroundColor Cyan
    exit 0
}
