# In Theaters Endpoint - Implementation Summary

## ✅ Toteutettu

### 1. **Model Layer** (Movie.js)
Lisätty uusi metodi:
```javascript
Movie.findWithFinnkinoId({ limit, offset })
```

**Mitä tekee:**
- Hakee kaikki elokuvat joilla `f_id IS NOT NULL`
- Palauttaa elokuvat, kokonaismäärän ja pagination tiedot
- Järjestää tulokset `created_at DESC` (uusimmat ensin)

**Sijainti:** `src/models/Movie.js`

### 2. **Service Layer** (TMDBService.js)
Lisätty uusi metodi:
```javascript
TMDBService.getMoviesWithFinnkinoId({ limit, offset })
```

**Mitä tekee:**
- Kutsuu `Movie.findWithFinnkinoId()` metodia
- Formatoi tietokannan datan vastaamaan TMDB API:n muotoa
- Lisää `fromDatabase: true` kentän

**Sijainti:** `src/services/TMDBService.js`

### 3. **Controller Layer** (TMDBController.js)
Lisätty uusi controller funktio:
```javascript
export const getMoviesInTheaters(req, res)
```

**Mitä tekee:**
- Validoi query parametrit (limit, offset)
- Kutsuu `TMDBService.getMoviesWithFinnkinoId()`
- Palauttaa JSON vastauksen

**Sijainti:** `src/controllers/TMDBController.js`

### 4. **Routes** (tmdbRoutes.js)
Lisätty uusi route:
```javascript
router.get('/in-theaters', getMoviesInTheaters);
```

**Endpoint:** `GET /api/v1/tmdb/in-theaters`

**Sijainti:** `src/routes/tmdbRoutes.js`

## 📊 Arkkitehtuuri

```
Request: GET /api/v1/tmdb/in-theaters?limit=10&offset=0
    ↓
Router (tmdbRoutes.js)
    ↓
Controller (TMDBController.getMoviesInTheaters)
    - Validoi parametrit
    - Käsittelee virheet
    ↓
Service (TMDBService.getMoviesWithFinnkinoId)
    - Liiketoimintalogiikka
    - Datan formatointi
    ↓
Model (Movie.findWithFinnkinoId)
    - Tietokantakutsut
    - SQL queryt
    ↓
Database (PostgreSQL)
    - movies table
    - WHERE f_id IS NOT NULL
    ↓
Response: JSON { success, results, total, limit, offset, hasMore }
```

## 🎯 Default Behavior

- **Default limit:** 10 (täydellinen karuselleille)
- **Default offset:** 0
- **Max limit:** 100
- **Järjestys:** Uusimmat ensin (created_at DESC)
- **Filtteri:** Vain elokuvat joilla f_id olemassa

## 📝 Query Parameters

| Parameter | Type | Default | Min | Max | Required |
|-----------|------|---------|-----|-----|----------|
| limit | integer | 10 | 1 | 100 | No |
| offset | integer | 0 | 0 | ∞ | No |

## 📤 Response Format

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
      "posterPath": "https://image.tmdb.org/t/p/w500/...",
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

## 🧪 Testing

Testiskripti: `test-in-theaters.ps1`

Testaa:
1. Default haku (10 elokuvaa)
2. Custom limit (5 elokuvaa)
3. Pagination (offset 10)
4. Virheellinen limit (>100)
5. Virheellinen offset (<0)
6. Maksimi haku (100 elokuvaa)

## 📚 Documentation

- **API Docs:** `docs/IN_THEATERS_ENDPOINT.md`
- **Test Script:** `test-in-theaters.ps1`
- **This Summary:** `docs/IN_THEATERS_IMPLEMENTATION.md`

## 🔗 Related Features

### Finnkino Integration
Kun frontend hakee elokuvan Finnkino API:sta:
1. Frontend saa `f_id` (Finnkino ID)
2. Frontend kutsuu `/api/v1/tmdb/title-year?f_id=305017`
3. Backend tallentaa elokuvan `f_id`:n kanssa
4. Elokuva näkyy `/api/v1/tmdb/in-theaters` vastauksessa

### Database Schema
```sql
CREATE TABLE movies (
  id VARCHAR(255) PRIMARY KEY,
  original_title VARCHAR(255) NOT NULL,
  release_year INTEGER,
  tmdb_id INTEGER,
  poster_url TEXT,
  f_id INTEGER UNIQUE,  -- Finnkino ID
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_movies_f_id ON movies(f_id);
```

## 🚀 Use Cases

### 1. Homepage Carousel
```javascript
fetch('/api/v1/tmdb/in-theaters?limit=10')
  .then(res => res.json())
  .then(data => renderCarousel(data.results));
```

### 2. Mobile Carousel (smaller)
```javascript
fetch('/api/v1/tmdb/in-theaters?limit=5')
```

### 3. Full Theater Listing
```javascript
fetch('/api/v1/tmdb/in-theaters?limit=20&offset=0')
```

### 4. Pagination
```javascript
const page = 2;
const limit = 20;
const offset = (page - 1) * limit;
fetch(`/api/v1/tmdb/in-theaters?limit=${limit}&offset=${offset}`)
```

## ⚡ Performance

- **Database Index:** `f_id` column indexed
- **Optimized Query:** Only selects needed columns
- **Pagination:** Prevents loading all movies at once
- **Separate Count:** Total count calculated efficiently

## 🔒 Security

- **Input Validation:** limit (1-100), offset (≥0)
- **SQL Injection:** Prevented by parameterized queries
- **Error Handling:** Generic error messages to client
- **No Authentication:** Public endpoint (read-only)

## 📈 Future Enhancements

Mahdollisia parannuksia:
- Cache results for 5-10 minutes
- Add sorting options (by title, year, etc.)
- Filter by release year
- Search by title within theater movies
- Add theater location info from Finnkino API
