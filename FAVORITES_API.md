# Favorites API Documentation

## Overview
The Favorites API allows users to manage their movie lists including watchlists, personal favorites, and group favorites.

## Favorite Types
- **Type 1**: Watchlist (private, user can add/remove, admin can view/remove)
- **Type 2**: Favorites (public, anyone can view, user can add/remove)  
- **Type 3**: Group Favorites (visibility depends on group settings)

## Endpoints

### POST /api/v1/favorites
Add a movie to favorites (watchlist, favorites, or group favorites)

**Authentication**: Required

**Request Body**:
```json
{
  "movie_id": "string",
  "type": 1|2|3,
  "group_id": "number (required for type 3)"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Movie added to favorites successfully",
  "data": {
    "user_id": 1,
    "movie_id": "12345",
    "type": 1,
    "created_at": "2024-09-30T12:00:00.000Z"
  }
}
```

### DELETE /api/v1/favorites/:movie_id/:type
Remove movie from personal favorites

**Authentication**: Required

**Parameters**:
- `movie_id`: Movie ID to remove
- `type`: 1 (watchlist) or 2 (favorites)

### DELETE /api/v1/favorites/:movie_id/:type/group/:group_id
Remove movie from group favorites

**Authentication**: Required (group owner or admin only)

**Parameters**:
- `movie_id`: Movie ID to remove
- `type`: Must be 3 (group favorites)
- `group_id`: Group ID

### DELETE /api/v1/favorites/:movie_id/:type/user/:user_id
Remove movie from another user's favorites (admin only)

**Authentication**: Required (admin role)

**Parameters**:
- `movie_id`: Movie ID to remove
- `type`: 1 or 2
- `user_id`: Target user ID

### GET /api/v1/favorites/user/:user_id/:type
Get user's personal favorites

**Authentication**: 
- Required for watchlist (type 1) unless viewing own or admin
- Optional for favorites (type 2)

**Parameters**:
- `user_id`: User ID
- `type`: 1 (watchlist) or 2 (favorites)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "movie_id": "12345",
      "created_at": "2024-09-30T12:00:00.000Z",
      "type": 1,
      "original_title": "Test Movie",
      "tmdb_id": 12345,
      "release_year": 2024
    }
  ],
  "count": 1
}
```

### GET /api/v1/favorites/group/:group_id
Get group favorites

**Authentication**: 
- Optional for public groups
- Required for private/closed groups (members only)

**Parameters**:
- `group_id`: Group ID

**Response**:
```json
{
  "success": true,
  "data": {
    "group": {
      "id": 1,
      "name": "Movie Lovers",
      "description": "We love movies!",
      "visibility": "public",
      "theme_name": "default",
      "poster_url": null
    },
    "favorites": [
      {
        "movie_id": "12345",
        "created_at": "2024-09-30T12:00:00.000Z",
        "type": 3,
        "original_title": "Test Movie",
        "tmdb_id": 12345,
        "release_year": 2024
      }
    ],
    "count": 1
  }
}
```

### GET /api/v1/favorites/status/:movie_id
Check if movie is in user's favorites

**Authentication**: Optional (returns more info when authenticated)

**Parameters**:
- `movie_id`: Movie ID to check

**Response**:
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
  }
}
```

## Permission Rules

### Watchlist (Type 1)
- ✅ User can add/remove own movies
- ✅ Admin can view/remove any user's movies
- ❌ Others cannot view

### Personal Favorites (Type 2)  
- ✅ Anyone can view (no auth required)
- ✅ User can add/remove own movies
- ✅ Admin can remove any user's movies

### Group Favorites (Type 3)
- ✅ Group members can add movies
- ✅ Group owner can add/remove movies
- ✅ Admin can view/remove any group's movies
- ✅ Public groups: anyone can view
- ❌ Private/closed groups: members only can view

## Error Responses

```json
{
  "success": false,
  "error": "Error message"
}
```

Common error codes:
- `400`: Bad Request (missing/invalid parameters)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error

## Example Usage

```javascript
// Add to watchlist
fetch('/api/v1/favorites', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    movie_id: '12345',
    type: 1
  })
});

// Get user's public favorites
fetch('/api/v1/favorites/user/123/2')
  .then(response => response.json())
  .then(data => console.log(data));

// Check movie status
fetch('/api/v1/favorites/status/12345', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
})
  .then(response => response.json())
  .then(data => console.log(data));
```