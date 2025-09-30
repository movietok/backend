// Favorites Endpoint Testing Guide
// ================================

/* 
ENDPOINTS SUMMARY:
- POST /api/v1/favorites - Add to favorites
- DELETE /api/v1/favorites/:movie_id/:type - Remove from personal favorites  
- DELETE /api/v1/favorites/:movie_id/:type/group/:group_id - Remove from group favorites
- DELETE /api/v1/favorites/:movie_id/:type/user/:user_id - Admin remove from user's favorites
- GET /api/v1/favorites/user/:user_id/:type - Get user's favorites
- GET /api/v1/favorites/group/:group_id - Get group favorites
- GET /api/v1/favorites/status/:movie_id - Check favorite status

FAVORITE TYPES:
1 = Watchlist (private)
2 = Favorites (public)  
3 = Group Favorites (depends on group visibility)
*/

// Example API calls:

// 1. Add movie to watchlist
const addToWatchlist = {
  method: 'POST',
  url: '/api/v1/favorites',
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
  body: {
    movie_id: '12345',
    type: 1  // watchlist
  }
};

// 2. Add movie to personal favorites
const addToFavorites = {
  method: 'POST', 
  url: '/api/v1/favorites',
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
  body: {
    movie_id: '12345',
    type: 2  // favorites
  }
};

// 3. Add movie to group favorites
const addToGroupFavorites = {
  method: 'POST',
  url: '/api/v1/favorites', 
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
  body: {
    movie_id: '12345',
    type: 3,  // group favorites
    group_id: 1
  }
};

// 4. Get user's watchlist (requires auth if not own)
const getUserWatchlist = {
  method: 'GET',
  url: '/api/v1/favorites/user/123/1',  
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
};

// 5. Get user's public favorites (no auth needed)
const getUserFavorites = {
  method: 'GET',
  url: '/api/v1/favorites/user/123/2'
};

// 6. Get group favorites 
const getGroupFavorites = {
  method: 'GET',
  url: '/api/v1/favorites/group/1'
};

// 7. Check movie favorite status
const checkStatus = {
  method: 'GET',
  url: '/api/v1/favorites/status/12345',
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }  // optional
};

// 8. Remove from watchlist
const removeFromWatchlist = {
  method: 'DELETE',
  url: '/api/v1/favorites/12345/1',
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
};

// 9. Remove from group favorites (owner/admin only)
const removeFromGroupFavorites = {
  method: 'DELETE', 
  url: '/api/v1/favorites/12345/3/group/1',
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
};

console.log('Favorites API documentation ready!');