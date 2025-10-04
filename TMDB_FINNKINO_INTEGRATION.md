# TMDB API with Finnkino ID Support

## Overview
The TMDB API now supports Finnkino ID (`f_id`) parameter to enable database caching and faster lookups for movies with Finnkino showtimes.

## Endpoint
```
GET /api/tmdb/title-year
```

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `originalTitle` | string | Yes | Original movie title |
| `year` | integer | Yes | Release year (1900 - current year) |
| `f_id` | integer | No | Finnkino movie ID |

## How it Works

### With f_id (Recommended)
1. **Database Check**: First checks if movie exists in database with matching `f_id`
2. **Return Cached**: If found, returns movie data from database (faster)
3. **TMDB Fallback**: If not found, searches TMDB API
4. **Auto-Save**: Automatically saves TMDB result to database with `f_id` for future requests

### Without f_id
- Directly searches TMDB API
- No database caching
- Slower subsequent requests

## Usage Examples

### With Finnkino ID (Fast)
```
GET /api/tmdb/title-year?originalTitle=Täydelliset vieraat&year=2025&f_id=123
```

### Without Finnkino ID (Standard)
```
GET /api/tmdb/title-year?originalTitle=The Matrix&year=1999
```

## Response Format

### Database Hit (Cached)
```json
{
  "success": true,
  "results": [
    {
      "id": 550,
      "original_title": "Täydelliset vieraat",
      "release_year": 2025,
      "poster_path": "/path/to/poster.jpg",
      "vote_average": 8.5,
      "f_id": 123
    }
  ],
  "totalResults": 1,
  "source": "database"
}
```

### TMDB Hit (Fresh Data)
```json
{
  "success": true,
  "results": [
    {
      "id": 550,
      "original_title": "Täydelliset vieraat",
      "release_year": 2025,
      "poster_path": "/path/to/poster.jpg",
      "vote_average": 8.5
    }
  ],
  "totalResults": 1,
  "source": "tmdb"
}
```

## Database Schema

### movies table
```sql
CREATE TABLE movies (
    id                  VARCHAR(255) PRIMARY KEY,
    original_title      TEXT NOT NULL,
    release_year        INTEGER,
    imdb_rating         NUMERIC(3,1),
    tmdb_id             INTEGER UNIQUE,
    poster_url          TEXT,
    f_id                INTEGER UNIQUE    -- Finnkino ID
);
```

### Indexes
- `f_id` has unique constraint
- Index on `f_id` for fast lookups

## Benefits

### 🚀 Performance
- **Database Lookup**: ~5-10ms
- **TMDB API Call**: ~200-500ms
- **Speed Improvement**: 20-50x faster for cached movies

### 💾 Data Consistency
- Same movie always returns same data
- Reduces TMDB API rate limit usage
- Automatic caching on first request

### 🎯 Integration
- Seamless Finnkino integration
- Movies with showtimes are automatically cached
- Frontend can check `source` field to know data origin

## Error Handling

### Invalid f_id
- If `f_id` is not a valid integer, it's ignored
- Falls back to TMDB search

### Database Errors
- If database is unavailable, falls back to TMDB
- Errors are logged but don't break the request

### Duplicate f_id
- If movie with same `f_id` already exists, update is skipped
- No error returned to client

## Migration

Run the migration to add `f_id` column to existing database:
```bash
psql -U your_user -d your_database -f migrations/add_f_id_to_movies.sql
```

## Notes
- `f_id` is optional - backward compatible
- Auto-saves first TMDB match when `f_id` is provided
- Uses `ON CONFLICT` to handle duplicates gracefully
- Movie ID format in database: `tmdb_{tmdb_id}`
