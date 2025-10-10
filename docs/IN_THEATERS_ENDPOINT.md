# In Theaters Endpoint Documentation

## Overview
Endpoint that fetches movies currently in theaters (movies with Finnkino ID in database).

## Endpoint

### GET `/api/v1/tmdb/in-theaters`

Get movies that are currently in theaters (have Finnkino ID).

## Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | integer | No | 10 | Maximum number of movies to return (1-100) |
| `offset` | integer | No | 0 | Number of movies to skip (for pagination) |

## Response Format

```json
{
  "success": true,
  "results": [
    {
      "id": 1100988,
      "title": "Weapons",
      "originalTitle": "Weapons",
      "releaseDate": "2025-01-01",
      "releaseYear": 2025,
      "posterPath": "https://image.tmdb.org/t/p/w500/bbSHSJuO5XjrIKMh6QXXLTg3Yzr.jpg",
      "f_id": 305017,
      "fromDatabase": true,
      "createdAt": "2025-10-04T12:00:00.000Z"
    }
  ],
  "total": 25,
  "limit": 10,
  "offset": 0,
  "hasMore": true
}
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the request was successful |
| `results` | array | Array of movie objects |
| `results[].id` | integer | TMDB movie ID |
| `results[].title` | string | Movie title |
| `results[].originalTitle` | string | Original movie title |
| `results[].releaseDate` | string | Release date (YYYY-MM-DD) |
| `results[].releaseYear` | integer | Release year |
| `results[].posterPath` | string | Full URL to movie poster |
| `results[].f_id` | integer | Finnkino ID |
| `results[].fromDatabase` | boolean | Always `true` for this endpoint |
| `results[].createdAt` | string | When movie was added to database |
| `total` | integer | Total number of movies with Finnkino ID |
| `limit` | integer | Limit used in query |
| `offset` | integer | Offset used in query |
| `hasMore` | boolean | Whether there are more results available |

## Examples

### Get first 10 movies in theaters
```bash
GET /api/v1/tmdb/in-theaters
```

### Get specific page (carousel)
```bash
GET /api/v1/tmdb/in-theaters?limit=10&offset=0
```

### Get next page
```bash
GET /api/v1/tmdb/in-theaters?limit=10&offset=10
```

### Get all movies (up to 100)
```bash
GET /api/v1/tmdb/in-theaters?limit=100&offset=0
```

## Error Responses

### Invalid limit
```json
{
  "success": false,
  "error": "Limit must be between 1 and 100"
}
```

### Invalid offset
```json
{
  "success": false,
  "error": "Offset must be 0 or greater"
}
```

## Use Cases

### 1. Homepage Carousel (10 movies)
```javascript
fetch('/api/v1/tmdb/in-theaters?limit=10')
  .then(res => res.json())
  .then(data => {
    // data.results contains 10 most recent theater movies
    renderCarousel(data.results);
  });
```

### 2. Full Theater Listing with Pagination
```javascript
async function loadTheaterMovies(page = 1) {
  const limit = 20;
  const offset = (page - 1) * limit;
  
  const response = await fetch(`/api/v1/tmdb/in-theaters?limit=${limit}&offset=${offset}`);
  const data = await response.json();
  
  return {
    movies: data.results,
    totalPages: Math.ceil(data.total / limit),
    currentPage: page,
    hasMore: data.hasMore
  };
}
```

### 3. Check if any movies are in theaters
```javascript
fetch('/api/v1/tmdb/in-theaters?limit=1')
  .then(res => res.json())
  .then(data => {
    if (data.total > 0) {
      console.log(`${data.total} movies currently in theaters`);
    } else {
      console.log('No movies in theaters');
    }
  });
```

## Architecture

The endpoint follows MVC pattern:

```
Controller (TMDBController.js)
    ↓
Service (TMDBService.js)
    ↓
Model (Movie.js)
    ↓
Database (PostgreSQL)
```

### Database Query

The `Movie.findWithFinnkinoId()` method queries the `movies` table:

```sql
SELECT 
  id,
  original_title,
  release_year,
  tmdb_id,
  poster_url,
  f_id,
  created_at
FROM movies 
WHERE f_id IS NOT NULL
ORDER BY created_at DESC
LIMIT $1 OFFSET $2
```

## Notes

- **Default Limit**: 10 movies (perfect for carousel)
- **Maximum Limit**: 100 movies (to prevent performance issues)
- **Ordering**: Most recently added movies first (`created_at DESC`)
- **Filtering**: Only movies with `f_id IS NOT NULL` (Finnkino movies)
- **Poster URLs**: Full URLs ready to use (no need to construct)
- **Performance**: Uses database index on `f_id` for fast queries

## Related Endpoints

- **GET `/api/v1/tmdb/title-year`** - Search specific movie by title and year
- **GET `/api/v1/tmdb/discover`** - Discover movies with filters
- **GET `/api/v1/tmdb/:id`** - Get detailed movie information

## Integration with Finnkino

When frontend calls Finnkino API and finds a movie:
1. Frontend gets `f_id` from Finnkino API
2. Frontend calls `/api/v1/tmdb/title-year?f_id={f_id}` to save movie
3. Movie appears in `/api/v1/tmdb/in-theaters` response
4. Movie is cached for future requests

## Performance Considerations

- Uses database indexes for fast queries
- Pagination prevents loading all movies at once
- Total count is calculated separately for efficiency
- Results are ordered by `created_at` (indexed field)
