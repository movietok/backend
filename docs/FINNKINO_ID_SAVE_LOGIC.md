# Finnkino ID Save Logic - Updated Implementation

## Problem Statement
When saving movies with Finnkino ID, the system needs to:
1. Check if movie already exists in database (by title + year)
2. If exists → Add/update `f_id` to existing record
3. If not exists → Create new movie with `f_id`

## Solution Architecture

All database operations moved to **Movie Model** (proper MVC pattern).

### Flow Diagram

```
Frontend calls API with f_id
        ↓
TMDBService.searchByOriginalTitleAndYear(title, year, finnkinoId)
        ↓
1. Check database by f_id
   ↓
   Found? Return from database
   ↓
2. Search TMDB API
   ↓
3. TMDBService.saveMovieWithFinnkinoId(movie, finnkinoId)
   ↓
Movie.upsertWithFinnkinoId(movieData, finnkinoId)
   ↓
   A. Check if exists by title + year
      ↓
      EXISTS: UPDATE with f_id
      ↓
      NOT EXISTS: INSERT with f_id
```

## Implementation

### 1. Movie Model (src/models/Movie.js)

#### New Method: `findByFinnkinoId(finnkinoId)`
```javascript
static async findByFinnkinoId(finnkinoId) {
  const result = await query(
    `SELECT * FROM movies WHERE f_id = $1`,
    [finnkinoId]
  );
  return result.rows.length > 0 ? new Movie(result.rows[0]) : null;
}
```

#### New Method: `findByTitleAndYear(title, year)`
```javascript
static async findByTitleAndYear(originalTitle, releaseYear) {
  const result = await query(
    `SELECT * FROM movies 
     WHERE LOWER(original_title) = LOWER($1) 
     AND release_year = $2
     LIMIT 1`,
    [originalTitle, releaseYear]
  );
  return result.rows.length > 0 ? new Movie(result.rows[0]) : null;
}
```

#### New Method: `upsertWithFinnkinoId(movieData, finnkinoId)`
```javascript
static async upsertWithFinnkinoId(movieData, finnkinoId) {
  const { title, releaseYear, tmdbId, posterUrl } = movieData;

  // Step 1: Check if movie exists by title + year
  const existingMovie = await Movie.findByTitleAndYear(title, releaseYear);

  if (existingMovie) {
    // CASE A: Movie exists → Update with f_id
    const result = await query(
      `UPDATE movies 
       SET f_id = $1,
           tmdb_id = COALESCE($2, tmdb_id),
           poster_url = COALESCE($3, poster_url)
       WHERE id = $4
       RETURNING *`,
      [finnkinoId, tmdbId, posterUrl, existingMovie.id]
    );
    return new Movie(result.rows[0]);
  } else {
    // CASE B: Movie doesn't exist → Create with f_id
    const result = await query(
      `INSERT INTO movies (id, original_title, release_year, tmdb_id, poster_url, f_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         f_id = EXCLUDED.f_id,
         original_title = EXCLUDED.original_title,
         release_year = EXCLUDED.release_year,
         tmdb_id = EXCLUDED.tmdb_id,
         poster_url = EXCLUDED.poster_url
       RETURNING *`,
      [finnkinoId.toString(), title, releaseYear, tmdbId, posterUrl, finnkinoId]
    );
    return new Movie(result.rows[0]);
  }
}
```

### 2. TMDB Service (src/services/TMDBService.js)

#### Updated: `saveMovieWithFinnkinoId(movie, finnkinoId)`
```javascript
async saveMovieWithFinnkinoId(movie, finnkinoId) {
  // Validate
  if (!movie || !movie.id || !movie.title) {
    console.error('Missing required fields');
    return;
  }

  // Prepare data
  const movieData = {
    title: movie.title,
    releaseYear: movie.release_year || null,
    tmdbId: movie.id,
    posterUrl: movie.poster_path 
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
      : null
  };

  // Use Movie model (no direct DB calls!)
  const savedMovie = await Movie.upsertWithFinnkinoId(movieData, finnkinoId);
  
  return savedMovie;
}
```

## Use Cases

### Case 1: First Time Movie (Not in Database)
```
Input: 
  title: "Weapons"
  year: 2025
  f_id: 305017

Process:
1. Movie.findByTitleAndYear("Weapons", 2025) → null
2. INSERT new movie with id = 305017, f_id = 305017

Result:
movies table:
| id     | original_title | release_year | tmdb_id  | f_id   |
|--------|----------------|--------------|----------|--------|
| 305017 | Weapons        | 2025         | 1100988  | 305017 |
```

### Case 2: Movie Exists (From TMDB Discovery)
```
Input:
  title: "Weapons"
  year: 2025
  f_id: 305017

Existing in DB:
| id      | original_title | release_year | tmdb_id  | f_id |
|---------|----------------|--------------|----------|------|
| tmdb_1  | Weapons        | 2025         | 1100988  | NULL |

Process:
1. Movie.findByTitleAndYear("Weapons", 2025) → Found (id: tmdb_1)
2. UPDATE movies SET f_id = 305017 WHERE id = 'tmdb_1'

Result:
| id      | original_title | release_year | tmdb_id  | f_id   |
|---------|----------------|--------------|----------|--------|
| tmdb_1  | Weapons        | 2025         | 1100988  | 305017 |
```

### Case 3: Movie with f_id Already Exists
```
Input:
  title: "Weapons"
  year: 2025
  f_id: 305017

Existing:
| id     | original_title | release_year | f_id   |
|--------|----------------|--------------|--------|
| 305017 | Weapons        | 2025         | 305017 |

Process:
1. Movie.findByTitleAndYear("Weapons", 2025) → Found
2. UPDATE (no changes, f_id already set)

Result: No changes (idempotent operation)
```

## Benefits

### ✅ Proper Architecture
- All DB operations in Model layer
- Service layer uses Model methods
- No direct SQL in Service

### ✅ Duplicate Prevention
- Checks by title + year first
- Updates existing instead of creating duplicates

### ✅ Flexible Primary Keys
- Existing movies keep their IDs
- New movies use f_id as ID

### ✅ Data Integrity
- COALESCE prevents overwriting good data
- ON CONFLICT handles race conditions
- Unique constraint on f_id prevents duplicates

## Database Schema

```sql
CREATE TABLE movies (
  id VARCHAR(255) PRIMARY KEY,           -- Can be f_id or auto-generated
  original_title VARCHAR(255) NOT NULL,
  release_year INTEGER,
  tmdb_id INTEGER,
  poster_url TEXT,
  f_id INTEGER UNIQUE,                   -- Finnkino ID
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_movies_title_year ON movies(LOWER(original_title), release_year);
CREATE INDEX idx_movies_tmdb_id ON movies(tmdb_id);
CREATE INDEX idx_movies_f_id ON movies(f_id);
```

## Testing Scenarios

### Test 1: New Movie from Finnkino
```bash
GET /api/v1/tmdb/title-year?originalTitle=Weapons&year=2025&f_id=305017
```
Expected: Creates new movie with f_id

### Test 2: Existing Movie (Add f_id)
```sql
-- Pre-populate
INSERT INTO movies (id, original_title, release_year, tmdb_id)
VALUES ('tmdb_1100988', 'Weapons', 2025, 1100988);
```
```bash
GET /api/v1/tmdb/title-year?originalTitle=Weapons&year=2025&f_id=305017
```
Expected: Updates tmdb_1100988 record with f_id = 305017

### Test 3: Duplicate Request
```bash
# Call twice with same data
GET /api/v1/tmdb/title-year?originalTitle=Weapons&year=2025&f_id=305017
GET /api/v1/tmdb/title-year?originalTitle=Weapons&year=2025&f_id=305017
```
Expected: No duplicates, second call updates existing

## Logging

The system logs each step:

```
✅ Upserting movie with Finnkino ID: { title: 'Weapons', year: 2025, f_id: 305017 }
✅ Found existing movie (id: tmdb_1100988), adding f_id: 305017
✅ Movie saved/updated: Weapons (f_id: 305017, tmdb_id: 1100988)
```

OR

```
✅ Upserting movie with Finnkino ID: { title: 'Weapons', year: 2025, f_id: 305017 }
✅ Movie not found in database, creating new with f_id: 305017
✅ Movie saved/updated: Weapons (f_id: 305017, tmdb_id: 1100988)
```

## Error Handling

### Unique Constraint Violation
```javascript
if (error.code === '23505') {
  console.log(`Movie with f_id ${finnkinoId} already exists`);
  return null; // Graceful handling
}
```

### Missing Required Fields
```javascript
if (!movie || !movie.id || !movie.title) {
  console.error('Cannot save movie: missing required fields');
  return;
}
```

## Performance Considerations

- **Single Query Check**: Uses indexed title + year lookup
- **No Duplicate Scans**: Checks once, then updates or inserts
- **Batch Safety**: ON CONFLICT handles concurrent requests
- **Index Usage**: All lookups use database indexes

## Related Documentation

- `docs/IN_THEATERS_ENDPOINT.md` - How to retrieve movies with f_id
- `docs/TMDB_FINNKINO_INTEGRATION.md` - Overall integration flow
- `src/models/Movie.js` - All database operations
- `src/services/TMDBService.js` - Business logic layer
