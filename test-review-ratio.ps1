# Test Review Like/Dislike Ratio Feature
# This script tests the ratio calculation in review endpoints

$API_URL = "http://localhost:3000/api/v1"
$REVIEW_ID = "1"  # Change this to an existing review ID

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Review Ratio Test Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# You need to set these tokens from your authentication
$USER1_TOKEN = "your_user1_token_here"  # User who will like the review
$USER2_TOKEN = "your_user2_token_here"  # User who will dislike the review

Write-Host "📝 Step 1: Get initial review state" -ForegroundColor Yellow
Write-Host "GET $API_URL/reviews/$REVIEW_ID"
try {
    $response = Invoke-RestMethod -Uri "$API_URL/reviews/$REVIEW_ID" -Method Get -Headers @{
        "Content-Type" = "application/json"
    }
    Write-Host "✅ Initial state:" -ForegroundColor Green
    Write-Host "   Likes: $($response.data.review.likes)" -ForegroundColor White
    Write-Host "   Dislikes: $($response.data.review.dislikes)" -ForegroundColor White
    Write-Host "   Ratio: $($response.data.review.ratio)" -ForegroundColor Cyan
    Write-Host ""
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host "👍 Step 2: Add a LIKE to the review" -ForegroundColor Yellow
Write-Host "POST $API_URL/reviews/$REVIEW_ID/interaction"
try {
    $likeBody = @{
        type = "like"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$API_URL/reviews/$REVIEW_ID/interaction" -Method Post -Headers @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $USER1_TOKEN"
    } -Body $likeBody

    Write-Host "✅ After LIKE:" -ForegroundColor Green
    Write-Host "   Likes: $($response.data.interaction.likes)" -ForegroundColor White
    Write-Host "   Dislikes: $($response.data.interaction.dislikes)" -ForegroundColor White
    Write-Host "   Ratio: $($response.data.interaction.ratio)" -ForegroundColor Cyan
    Write-Host ""
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host "⚠️  Make sure USER1_TOKEN is set correctly" -ForegroundColor Yellow
}

Write-Host "👎 Step 3: Add a DISLIKE to the review" -ForegroundColor Yellow
Write-Host "POST $API_URL/reviews/$REVIEW_ID/interaction"
try {
    $dislikeBody = @{
        type = "dislike"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$API_URL/reviews/$REVIEW_ID/interaction" -Method Post -Headers @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $USER2_TOKEN"
    } -Body $dislikeBody

    Write-Host "✅ After DISLIKE:" -ForegroundColor Green
    Write-Host "   Likes: $($response.data.interaction.likes)" -ForegroundColor White
    Write-Host "   Dislikes: $($response.data.interaction.dislikes)" -ForegroundColor White
    Write-Host "   Ratio: $($response.data.interaction.ratio)" -ForegroundColor Cyan
    Write-Host ""
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host "⚠️  Make sure USER2_TOKEN is set correctly" -ForegroundColor Yellow
}

Write-Host "📊 Step 4: Get final review state" -ForegroundColor Yellow
Write-Host "GET $API_URL/reviews/$REVIEW_ID"
try {
    $response = Invoke-RestMethod -Uri "$API_URL/reviews/$REVIEW_ID" -Method Get -Headers @{
        "Content-Type" = "application/json"
    }
    Write-Host "✅ Final state:" -ForegroundColor Green
    Write-Host "   Likes: $($response.data.review.likes)" -ForegroundColor White
    Write-Host "   Dislikes: $($response.data.review.dislikes)" -ForegroundColor White
    Write-Host "   Ratio: $($response.data.review.ratio)" -ForegroundColor Cyan
    Write-Host ""
    
    # Calculate expected ratio
    $expectedRatio = [int]$response.data.review.likes - [int]$response.data.review.dislikes
    if ($response.data.review.ratio -eq $expectedRatio) {
        Write-Host "✅ Ratio calculation is CORRECT! ($expectedRatio)" -ForegroundColor Green
    } else {
        Write-Host "❌ Ratio calculation is WRONG!" -ForegroundColor Red
        Write-Host "   Expected: $expectedRatio" -ForegroundColor Yellow
        Write-Host "   Got: $($response.data.review.ratio)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Test Complete!" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Ratio Formula: likes - dislikes" -ForegroundColor White
Write-Host "   Examples:" -ForegroundColor White
Write-Host "   - 5 likes, 2 dislikes = ratio 3" -ForegroundColor White
Write-Host "   - 2 likes, 5 dislikes = ratio -3" -ForegroundColor White
Write-Host "   - 0 likes, 0 dislikes = ratio 0" -ForegroundColor White
