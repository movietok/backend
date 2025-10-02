# Favorites Status API - URL-based Multiple IDs

## Endpoint
```
GET /api/v1/favorites/status/:movie_ids
```

## Usage Examples

### Single Movie
```
GET /api/v1/favorites/status/550
```

### Multiple Movies (comma-separated)
```
GET /api/v1/favorites/status/550,551,552,553
GET /api/v1/favorites/status/550,551,552,553,554,555,556,557,558,559
```

## Limits
- Maximum 100 movie IDs per request
- IDs are trimmed and empty values filtered out
- Works with or without authentication

## Response Format

### Single Movie Response
```json
{
  "success": true,
  "data": {
    "watchlist": true,
    "favorites": false,
    "groups": [
      {
        "id": 1,
        "name": "Movie Lovers"
      }
    ]
  },
  "count": 1
}
```

### Multiple Movies Response
```json
{
  "success": true,
  "data": {
    "550": {
      "watchlist": true,
      "favorites": false,
      "groups": [{"id": 1, "name": "Movie Lovers"}]
    },
    "551": {
      "watchlist": false,
      "favorites": true,
      "groups": []
    },
    "552": {
      "watchlist": false,
      "favorites": false,
      "groups": []
    }
  },
  "count": 3
}
```

## Error Cases
- `400` - No movie IDs provided
- `400` - More than 100 movie IDs
- `500` - Server error

## Notes
- Unauthenticated users get all `false` values
- Authenticated users get their actual favorite status
- Group favorites respect visibility rules
- Spaces around commas are trimmed automatically