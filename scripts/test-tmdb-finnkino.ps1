# TMDB-Finnkino Integration Test Script
# PowerShell version for Windows

Write-Host "🧪 Testing TMDB-Finnkino Integration" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000/api/tmdb"

# Test 1: Without f_id (Standard TMDB search)
Write-Host "Test 1: Standard TMDB search (no f_id)" -ForegroundColor Yellow
Write-Host "Request: GET $baseUrl/title-year?originalTitle=The Matrix&year=1999"
try {
    $response1 = Invoke-RestMethod -Uri "$baseUrl/title-year?originalTitle=The%20Matrix&year=1999" -Method Get
    Write-Host "Source: $($response1.source)" -ForegroundColor Green
    Write-Host "Results: $($response1.totalResults) movie(s) found"
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""
Write-Host "---"
Write-Host ""

# Test 2: With f_id (First request - should fetch from TMDB and save)
Write-Host "Test 2: First request with f_id (should save to DB)" -ForegroundColor Yellow
Write-Host "Request: GET $baseUrl/title-year?originalTitle=Täydelliset vieraat&year=2025&f_id=123"
try {
    $response2 = Invoke-RestMethod -Uri "$baseUrl/title-year?originalTitle=Täydelliset%20vieraat&year=2025&f_id=123" -Method Get
    Write-Host "Source: $($response2.source)" -ForegroundColor Green
    Write-Host "Movie: $($response2.results[0].original_title)"
    Write-Host "F_ID: $($response2.results[0].f_id)"
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""
Write-Host "---"
Write-Host ""

# Test 3: With same f_id (Second request - should fetch from database)
Write-Host "Test 3: Second request with same f_id (should load from DB - faster)" -ForegroundColor Yellow
Write-Host "Request: GET $baseUrl/title-year?originalTitle=Täydelliset vieraat&year=2025&f_id=123"
$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
try {
    $response3 = Invoke-RestMethod -Uri "$baseUrl/title-year?originalTitle=Täydelliset%20vieraat&year=2025&f_id=123" -Method Get
    $stopwatch.Stop()
    Write-Host "Source: $($response3.source)" -ForegroundColor Green
    Write-Host "Movie: $($response3.results[0].original_title)"
    Write-Host "Response Time: $($stopwatch.ElapsedMilliseconds)ms" -ForegroundColor Cyan
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""
Write-Host "---"
Write-Host ""

# Test 4: Invalid f_id (should fallback to TMDB)
Write-Host "Test 4: Invalid f_id (should fallback to TMDB)" -ForegroundColor Yellow
Write-Host "Request: GET $baseUrl/title-year?originalTitle=The Matrix&year=1999&f_id=invalid"
try {
    $response4 = Invoke-RestMethod -Uri "$baseUrl/title-year?originalTitle=The%20Matrix&year=1999&f_id=invalid" -Method Get
    Write-Host "Source: $($response4.source)" -ForegroundColor Green
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""
Write-Host "---"
Write-Host ""

Write-Host "✅ Tests completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Expected results:" -ForegroundColor Cyan
Write-Host "  Test 1: source = 'tmdb'"
Write-Host "  Test 2: source = 'tmdb' (first time, saves to DB)"
Write-Host "  Test 3: source = 'database' (cached, much faster)"
Write-Host "  Test 4: source = 'tmdb' (invalid f_id ignored)"
