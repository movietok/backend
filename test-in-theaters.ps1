# Test In Theaters Endpoint
# Tests the /api/v1/tmdb/in-theaters endpoint

$API_URL = "http://localhost:3000/api/v1"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "In Theaters Endpoint Test" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Get default (first 10 movies)
Write-Host "📽️  Test 1: Get first 10 movies (default carousel)" -ForegroundColor Yellow
Write-Host "GET $API_URL/tmdb/in-theaters"
try {
    $response = Invoke-RestMethod -Uri "$API_URL/tmdb/in-theaters" -Method Get
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host "   Total movies in theaters: $($response.total)" -ForegroundColor White
    Write-Host "   Movies returned: $($response.results.Count)" -ForegroundColor White
    Write-Host "   Limit: $($response.limit)" -ForegroundColor White
    Write-Host "   Offset: $($response.offset)" -ForegroundColor White
    Write-Host "   Has more: $($response.hasMore)" -ForegroundColor White
    
    if ($response.results.Count -gt 0) {
        Write-Host ""
        Write-Host "   First movie:" -ForegroundColor Cyan
        $firstMovie = $response.results[0]
        Write-Host "   - Title: $($firstMovie.title)" -ForegroundColor White
        Write-Host "   - Original Title: $($firstMovie.originalTitle)" -ForegroundColor White
        Write-Host "   - Year: $($firstMovie.releaseYear)" -ForegroundColor White
        Write-Host "   - TMDB ID: $($firstMovie.id)" -ForegroundColor White
        Write-Host "   - Finnkino ID: $($firstMovie.f_id)" -ForegroundColor White
        Write-Host "   - Poster: $($firstMovie.posterPath)" -ForegroundColor White
        Write-Host "   - From Database: $($firstMovie.fromDatabase)" -ForegroundColor White
    }
    Write-Host ""
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host ""
}

# Test 2: Get specific limit (5 movies for smaller carousel)
Write-Host "📽️  Test 2: Get 5 movies (smaller carousel)" -ForegroundColor Yellow
Write-Host "GET $API_URL/tmdb/in-theaters?limit=5"
try {
    $response = Invoke-RestMethod -Uri "$API_URL/tmdb/in-theaters?limit=5" -Method Get
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host "   Movies returned: $($response.results.Count)" -ForegroundColor White
    Write-Host "   Limit: $($response.limit)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host ""
}

# Test 3: Pagination - Get second page
Write-Host "📽️  Test 3: Get second page (offset 10)" -ForegroundColor Yellow
Write-Host "GET $API_URL/tmdb/in-theaters?limit=10&offset=10"
try {
    $response = Invoke-RestMethod -Uri "$API_URL/tmdb/in-theaters?limit=10&offset=10" -Method Get
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host "   Movies returned: $($response.results.Count)" -ForegroundColor White
    Write-Host "   Offset: $($response.offset)" -ForegroundColor White
    Write-Host "   Has more: $($response.hasMore)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host ""
}

# Test 4: Invalid limit (should fail)
Write-Host "❌ Test 4: Invalid limit (should fail)" -ForegroundColor Yellow
Write-Host "GET $API_URL/tmdb/in-theaters?limit=150"
try {
    $response = Invoke-RestMethod -Uri "$API_URL/tmdb/in-theaters?limit=150" -Method Get -ErrorAction Stop
    Write-Host "❌ Test failed - should have returned error!" -ForegroundColor Red
    Write-Host ""
} catch {
    $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
    if ($errorResponse.error -like "*between 1 and 100*") {
        Write-Host "✅ Correctly rejected invalid limit!" -ForegroundColor Green
        Write-Host "   Error: $($errorResponse.error)" -ForegroundColor White
    } else {
        Write-Host "❌ Unexpected error: $($errorResponse.error)" -ForegroundColor Red
    }
    Write-Host ""
}

# Test 5: Invalid offset (should fail)
Write-Host "❌ Test 5: Invalid offset (should fail)" -ForegroundColor Yellow
Write-Host "GET $API_URL/tmdb/in-theaters?offset=-1"
try {
    $response = Invoke-RestMethod -Uri "$API_URL/tmdb/in-theaters?offset=-1" -Method Get -ErrorAction Stop
    Write-Host "❌ Test failed - should have returned error!" -ForegroundColor Red
    Write-Host ""
} catch {
    $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
    if ($errorResponse.error -like "*0 or greater*") {
        Write-Host "✅ Correctly rejected invalid offset!" -ForegroundColor Green
        Write-Host "   Error: $($errorResponse.error)" -ForegroundColor White
    } else {
        Write-Host "❌ Unexpected error: $($errorResponse.error)" -ForegroundColor Red
    }
    Write-Host ""
}

# Test 6: Get all movies (max limit)
Write-Host "📽️  Test 6: Get maximum movies (limit=100)" -ForegroundColor Yellow
Write-Host "GET $API_URL/tmdb/in-theaters?limit=100"
try {
    $response = Invoke-RestMethod -Uri "$API_URL/tmdb/in-theaters?limit=100" -Method Get
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host "   Total in database: $($response.total)" -ForegroundColor White
    Write-Host "   Movies returned: $($response.results.Count)" -ForegroundColor White
    Write-Host "   Has more: $($response.hasMore)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host ""
}

# Summary
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Endpoint: GET /api/v1/tmdb/in-theaters" -ForegroundColor White
Write-Host ""
Write-Host "Query Parameters:" -ForegroundColor White
Write-Host "  - limit: 1-100 (default: 10)" -ForegroundColor White
Write-Host "  - offset: 0+ (default: 0)" -ForegroundColor White
Write-Host ""
Write-Host "Response Fields:" -ForegroundColor White
Write-Host "  - results: Array of movies with f_id" -ForegroundColor White
Write-Host "  - total: Total count in database" -ForegroundColor White
Write-Host "  - limit: Limit used" -ForegroundColor White
Write-Host "  - offset: Offset used" -ForegroundColor White
Write-Host "  - hasMore: Boolean for pagination" -ForegroundColor White
Write-Host ""
Write-Host "Use Cases:" -ForegroundColor White
Write-Host "  - Homepage carousel: ?limit=10" -ForegroundColor White
Write-Host "  - Mobile carousel: ?limit=5" -ForegroundColor White
Write-Host "  - Full listing: ?limit=20&offset=0" -ForegroundColor White
Write-Host "  - Next page: ?limit=20&offset=20" -ForegroundColor White
Write-Host ""
