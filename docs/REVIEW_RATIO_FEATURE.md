# Review Ratio Feature Documentation

## Overview
All review endpoints now return a `ratio` field that represents the popularity of the review.

## Ratio Calculation
```
ratio = likes - dislikes
```

### Examples:
- **5 likes, 2 dislikes** → ratio = **3** (positive, popular)
- **2 likes, 5 dislikes** → ratio = **-3** (negative, unpopular)
- **0 likes, 0 dislikes** → ratio = **0** (neutral, default)
- **10 likes, 0 dislikes** → ratio = **10** (very positive)
- **0 likes, 10 dislikes** → ratio = **-10** (very negative)

## API Response Format

All review responses now include the `ratio` field:

```json
{
  "status": "success",
  "data": {
    "review": {
      "id": "123",
      "movie_id": "456",
      "user_id": "789",
      "rating": 4,
      "comment": "Great movie!",
      "likes": 5,
      "dislikes": 2,
      "ratio": 3,
      "created_at": "2025-01-01T12:00:00Z",
      "updated_at": "2025-01-01T12:00:00Z"
    }
  }
}
```

## Endpoints Updated

### 1. **POST /api/v1/reviews/:id/interaction**
Add like or dislike to a review. Returns updated counts and ratio.

**Request:**
```json
{
  "type": "like"  // or "dislike"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "interaction": {
      "id": "123",
      "likes": 6,
      "dislikes": 2,
      "ratio": 4,
      ...
    }
  }
}
```

### 2. **GET /api/v1/reviews/:id**
Get a single review with ratio.

**Response includes:** `ratio` field

### 3. **GET /api/v1/reviews/movie/:movieId**
Get all reviews for a movie. Each review includes ratio.

**Response:**
```json
{
  "status": "success",
  "data": {
    "reviews": [
      {
        "id": "123",
        "likes": 5,
        "dislikes": 2,
        "ratio": 3,
        ...
      }
    ],
    "pagination": {...},
    "stats": {...}
  }
}
```

### 4. **GET /api/v1/reviews/user/:userId**
Get all reviews by a user. Each review includes ratio.

### 5. **GET /api/v1/reviews/recent**
Get recent reviews. Each review includes ratio.

### 6. **POST /api/v1/reviews**
Create a new review. Returns review with ratio (default 0).

### 7. **PUT /api/v1/reviews/:id**
Update a review. Returns updated review with ratio.

## Frontend Usage

### Displaying Ratio
```javascript
// Display ratio with color coding
function getRatioColor(ratio) {
  if (ratio > 0) return 'green';
  if (ratio < 0) return 'red';
  return 'gray';
}

// Example usage
const review = { likes: 5, dislikes: 2, ratio: 3 };
console.log(`Popularity: ${review.ratio}`); // "Popularity: 3"
```

### Sorting by Ratio
```javascript
// Sort reviews by most popular (highest ratio first)
reviews.sort((a, b) => b.ratio - a.ratio);

// Sort by most controversial (lowest ratio first)
reviews.sort((a, b) => a.ratio - b.ratio);
```

## Implementation Details

### Controller Helper Functions
Two helper functions handle ratio calculation:

```javascript
// Single review
const addRatioToReview = (review) => {
  const likes = parseInt(review.likes) || 0;
  const dislikes = parseInt(review.dislikes) || 0;
  return {
    ...review,
    ratio: likes - dislikes
  };
};

// Array of reviews
const addRatioToReviews = (reviews) => {
  return reviews.map(addRatioToReview);
};
```

### Database Schema
The ratio is calculated from existing fields:
- `likes` - Count of like interactions
- `dislikes` - Count of dislike interactions
- `ratio` - Calculated field (not stored in database)

## Testing

Run the test script to verify functionality:

```powershell
# Edit the script first to add your authentication tokens
.\test-review-ratio.ps1
```

The test script will:
1. Get initial review state
2. Add a like (ratio should increase)
3. Add a dislike (ratio should decrease)
4. Verify final ratio is correct

## Notes

- **Default Value:** New reviews start with `ratio: 0`
- **Negative Values:** Ratio can be negative if dislikes exceed likes
- **Real-time Updates:** Ratio is calculated on-demand from database counts
- **No Database Changes:** Ratio is a computed field, not stored
- **Performance:** Minimal overhead as likes/dislikes are already queried

## Future Enhancements

Potential improvements:
- Add `ratio` as a sortBy option in query parameters
- Add filtering by minimum ratio threshold
- Add trending algorithm (ratio + time decay)
- Cache popular reviews with high ratios
