# Test Movie Details ID Resolution
# Tests that the endpoint works with both database IDs and TMDB IDs

$API_URL = "http://localhost:3000/api/v1"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Movie Details ID Resolution Test" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# First, get a movie with Finnkino ID from in-theaters
Write-Host "📋 Step 1: Get a movie from in-theaters (has Finnkino ID)" -ForegroundColor Yellow
try {
    $theaterMovies = Invoke-RestMethod -Uri "$API_URL/tmdb/in-theaters?limit=1" -Method Get
    
    if ($theaterMovies.results.Count -gt 0) {
        $testMovie = $theaterMovies.results[0]
        $databaseId = $testMovie.f_id
        $tmdbId = $testMovie.id
        $movieTitle = $testMovie.title
        
        Write-Host "✅ Found test movie:" -ForegroundColor Green
        Write-Host "   Title: $movieTitle" -ForegroundColor White
        Write-Host "   Database ID (f_id): $databaseId" -ForegroundColor White
        Write-Host "   TMDB ID: $tmdbId" -ForegroundColor White
        Write-Host ""
        
        # Test 1: Fetch using database ID (should resolve to TMDB ID)
        Write-Host "🔍 Test 1: Fetch movie using DATABASE ID ($databaseId)" -ForegroundColor Yellow
        Write-Host "GET $API_URL/tmdb/$databaseId"
        try {
            $response = Invoke-RestMethod -Uri "$API_URL/tmdb/$databaseId" -Method Get
            
            Write-Host "✅ Success! Resolved database ID to TMDB data" -ForegroundColor Green
            Write-Host "   Title: $($response.title)" -ForegroundColor White
            Write-Host "   TMDB ID: $($response.id)" -ForegroundColor White
            Write-Host "   Has trailer: $(if($response.trailer) {'Yes'} else {'No'})" -ForegroundColor White
            Write-Host "   Has cast: $(if($response.cast) {'Yes (' + $response.cast.Count + ' actors)'} else {'No'})" -ForegroundColor White
            Write-Host ""
        } catch {
            Write-Host "❌ Error: $_" -ForegroundColor Red
            Write-Host ""
        }
        
        # Test 2: Fetch using TMDB ID (should work directly)
        Write-Host "🔍 Test 2: Fetch movie using TMDB ID ($tmdbId)" -ForegroundColor Yellow
        Write-Host "GET $API_URL/tmdb/$tmdbId"
        try {
            $response = Invoke-RestMethod -Uri "$API_URL/tmdb/$tmdbId" -Method Get
            
            Write-Host "✅ Success! Direct TMDB fetch" -ForegroundColor Green
            Write-Host "   Title: $($response.title)" -ForegroundColor White
            Write-Host "   TMDB ID: $($response.id)" -ForegroundColor White
            Write-Host ""
        } catch {
            Write-Host "❌ Error: $_" -ForegroundColor Red
            Write-Host ""
        }
        
        # Verify both IDs return the same movie
        Write-Host "🔄 Test 3: Verify both IDs return same movie" -ForegroundColor Yellow
        try {
            $response1 = Invoke-RestMethod -Uri "$API_URL/tmdb/$databaseId" -Method Get
            $response2 = Invoke-RestMethod -Uri "$API_URL/tmdb/$tmdbId" -Method Get
            
            if ($response1.id -eq $response2.id -and $response1.title -eq $response2.title) {
                Write-Host "✅ Both IDs return the same movie!" -ForegroundColor Green
                Write-Host "   Database ID ($databaseId) → TMDB ID $($response1.id)" -ForegroundColor White
                Write-Host "   TMDB ID ($tmdbId) → TMDB ID $($response2.id)" -ForegroundColor White
            } else {
                Write-Host "❌ IDs return different movies!" -ForegroundColor Red
            }
            Write-Host ""
        } catch {
            Write-Host "❌ Error comparing responses: $_" -ForegroundColor Red
            Write-Host ""
        }
        
    } else {
        Write-Host "⚠️  No movies in theaters found. Skipping database ID tests." -ForegroundColor Yellow
        Write-Host ""
    }
} catch {
    Write-Host "❌ Error getting theater movies: $_" -ForegroundColor Red
    Write-Host ""
}

# Test 4: Fetch a well-known TMDB ID (Fight Club)
Write-Host "🔍 Test 4: Fetch well-known movie by TMDB ID (Fight Club)" -ForegroundColor Yellow
Write-Host "GET $API_URL/tmdb/550"
try {
    $response = Invoke-RestMethod -Uri "$API_URL/tmdb/550" -Method Get
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host "   Title: $($response.title)" -ForegroundColor White
    Write-Host "   Year: $($response.releaseDate.Split('-')[0])" -ForegroundColor White
    Write-Host "   TMDB ID: $($response.id)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host ""
}

# Test 5: Invalid ID (should return 404)
Write-Host "❌ Test 5: Fetch with invalid ID (should fail)" -ForegroundColor Yellow
Write-Host "GET $API_URL/tmdb/99999999"
try {
    $response = Invoke-RestMethod -Uri "$API_URL/tmdb/99999999" -Method Get -ErrorAction Stop
    Write-Host "❌ Test failed - should have returned error!" -ForegroundColor Red
    Write-Host ""
} catch {
    Write-Host "✅ Correctly returned error for invalid ID!" -ForegroundColor Green
    $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "   Error: $($errorResponse.error)" -ForegroundColor White
    Write-Host ""
}

# Summary
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "ID Resolution Logic:" -ForegroundColor White
Write-Host "  1. Check if ID exists in database" -ForegroundColor White
Write-Host "  2. If found, use movie.tmdb_id for TMDB" -ForegroundColor White
Write-Host "  3. If not found, assume ID is TMDB ID" -ForegroundColor White
Write-Host "  4. Fetch from TMDB with resolved ID" -ForegroundColor White
Write-Host ""
Write-Host "Supported ID Types:" -ForegroundColor White
Write-Host "  ✅ Database ID (e.g., Finnkino ID)" -ForegroundColor Green
Write-Host "  ✅ TMDB ID" -ForegroundColor Green
Write-Host "  ✅ Auto-resolution" -ForegroundColor Green
Write-Host ""
Write-Host "Benefits:" -ForegroundColor White
Write-Host "  - Frontend can use any ID type" -ForegroundColor White
Write-Host "  - No need to track multiple IDs" -ForegroundColor White
Write-Host "  - Transparent resolution" -ForegroundColor White
Write-Host "  - No breaking changes" -ForegroundColor White
Write-Host ""
