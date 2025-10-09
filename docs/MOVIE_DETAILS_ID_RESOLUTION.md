# Movie Details Endpoint - ID Resolution

## Problem
Frontend may send different types of IDs to the movie details endpoint:
- **TMDB ID** (e.g., `1100988`) - from TMDB API
- **Database ID** (e.g., `305017`) - from our database (could be Finnkino ID)

Previously, the endpoint assumed all IDs were TMDB IDs, causing 404 errors when database IDs were sent.

## Solution

The endpoint now uses **smart ID resolution**:

### Flow

```
GET /api/v1/tmdb/:id
    ↓
1. Check if movie exists in database by ID
    ↓
   YES: Use movie.tmdb_id for TMDB fetch
    ↓
   NO: Assume ID is already TMDB ID
    ↓
2. Fetch from TMDB with resolved ID
    ↓
3. Return movie details
```

## Examples

### Example 1: Database ID (Finnkino ID)
```bash
GET /api/v1/tmdb/305017
```

**Process:**
1. ✅ Finds movie in database with `id = 305017`
2. ✅ Extracts `tmdb_id = 1100988` from database
3. ✅ Fetches from TMDB: `/movie/1100988`
4. ✅ Returns movie details

### Example 2: TMDB ID (not in database)
```bash
GET /api/v1/tmdb/550
```

**Process:**
1. ❌ Movie not found in database with `id = 550`
2. ✅ Assumes `550` is TMDB ID
3. ✅ Fetches from TMDB: `/movie/550`
4. ✅ Returns movie details
5. ✅ Saves movie to database

### Example 3: TMDB ID (already in database)
```bash
GET /api/v1/tmdb/1100988
```

**Process:**
1. ✅ Finds movie in database with `tmdb_id = 1100988`
2. ✅ Uses same TMDB ID: `1100988`
3. ✅ Fetches from TMDB: `/movie/1100988`
4. ✅ Returns movie details

## Code Changes

### Before
```javascript
export const getMovieDetails = async (req, res) => {
  const { id } = req.params;
  const movie = await TMDBService.getMovieById(id); // ❌ 404 if ID is not TMDB ID
  res.json(movie);
};
```

### After
```javascript
export const getMovieDetails = async (req, res) => {
  const { id } = req.params;
  
  let tmdbId = id;
  
  // Try to resolve database ID to TMDB ID
  const dbMovie = await Movie.findById(id);
  if (dbMovie && dbMovie.tmdb_id) {
    tmdbId = dbMovie.tmdb_id; // ✅ Use TMDB ID from database
  }
  
  const movie = await TMDBService.getMovieById(tmdbId);
  res.json(movie);
};
```

## Benefits

✅ **Flexible ID handling** - Works with both database and TMDB IDs
✅ **No breaking changes** - Existing TMDB ID requests still work
✅ **Better UX** - Frontend doesn't need to track multiple ID types
✅ **Automatic resolution** - Transparent to frontend

## Database Schema

```sql
CREATE TABLE movies (
  id VARCHAR(255) PRIMARY KEY,        -- Can be Finnkino ID or generated ID
  original_title VARCHAR(255) NOT NULL,
  release_year INTEGER,
  tmdb_id INTEGER,                    -- TMDB ID for API calls
  poster_url TEXT,
  f_id INTEGER UNIQUE,                -- Finnkino ID
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Frontend Usage

Frontend can now send either ID type:

```javascript
// Using database ID (e.g., from in-theaters endpoint)
fetch(`/api/v1/tmdb/${movie.f_id}`)  // Works! ✅

// Using TMDB ID (e.g., from search results)
fetch(`/api/v1/tmdb/${movie.id}`)     // Works! ✅
```

## Error Handling

### Case 1: Invalid ID (not in database, not in TMDB)
```json
{
  "error": "Failed to get movie details: Failed to fetch data from TMDB: HTTP error! status: 404"
}
```

### Case 2: Database lookup fails but TMDB works
```
Movie not found in database with ID 12345, trying TMDB directly
✅ Falls back to TMDB
```

### Case 3: Database has movie but no TMDB ID
```
Found movie in database with ID 305017, but no tmdb_id
✅ Uses original ID for TMDB lookup
```

## Logging

The endpoint logs which ID resolution path is taken:

```
✅ Found movie in database with ID 305017, using TMDB ID: 1100988
✅ Movie not found in database with ID 550, trying TMDB directly
```

## Performance

- **Single database lookup**: O(1) with indexed `id` field
- **No extra overhead**: If ID is not in database, direct TMDB call
- **Caching opportunity**: Database lookup is very fast

## Related Endpoints

- **GET `/api/v1/tmdb/in-theaters`** - Returns movies with database IDs
- **GET `/api/v1/tmdb/search`** - Returns movies with TMDB IDs
- **GET `/api/v1/tmdb/:id`** - Now works with both ID types ✅

## Testing

Test both ID types:

```bash
# Test with Finnkino ID (from database)
curl http://localhost:3000/api/v1/tmdb/305017

# Test with TMDB ID (direct)
curl http://localhost:3000/api/v1/tmdb/1100988

# Test with invalid ID
curl http://localhost:3000/api/v1/tmdb/99999999
```
