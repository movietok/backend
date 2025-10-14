import pool from '../config/database.js';

// Favorites types
const FAVORITE_TYPES = {
  WATCHLIST: 1,
  FAVORITES: 2,
  GROUP_FAVORITES: 3
};

/**
 * Add movie to favorites (watchlist, favorites, or group favorites)
 */
export const addToFavorites = async (req, res) => {
  try {
    const { movie_id, type, group_id } = req.body;
    const user_id = req.user?.id;

    // Validate required fields
    if (!movie_id || !type) {
      return res.status(400).json({
        success: false,
        error: 'movie_id and type are required'
      });
    }

    // Validate type
    if (![1, 2, 3].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'type must be 1 (watchlist), 2 (favorites), or 3 (group_favorites)'
      });
    }

    // Authentication required for all types
    if (!user_id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Type-specific validation and permissions
    if (type === FAVORITE_TYPES.GROUP_FAVORITES) {
      // Group favorites require group_id
      if (!group_id) {
        return res.status(400).json({
          success: false,
          error: 'group_id is required for group favorites'
        });
      }

      // Check if user is owner or moderator of the group
      const groupCheck = await pool.query(`
        SELECT g.owner_id, gm.role
        FROM groups g
        LEFT JOIN group_members gm ON g.id = gm.group_id AND gm.user_id = $2
        WHERE g.id = $1
      `, [group_id, user_id]);

      if (groupCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Group not found'
        });
      }

      const group = groupCheck.rows[0];
      const isOwner = parseInt(group.owner_id) === parseInt(user_id);
      const isModerator = group.role === 'moderator';

      if (!isOwner && !isModerator) {
        return res.status(403).json({
          success: false,
          error: 'Only group owners and moderators can add movies to group favorites'
        });
      }
    } else {
      // For watchlist (type 1) and personal favorites (type 2), group_id should be null
      if (group_id) {
        return res.status(400).json({
          success: false,
          error: 'group_id should not be provided for personal watchlist or favorites'
        });
      }
    }

    // Check if movie exists in our database by tmdb_id
    const movieExists = await pool.query('SELECT id FROM movies WHERE tmdb_id = $1', [movie_id]);
    
    if (movieExists.rows.length === 0) {
      // Movie doesn't exist, fetch it from TMDB using getMovieDetailsById
      try {
        const TMDBService = await import('../services/TMDBService.js');
        const tmdbService = new TMDBService.default();
        const movieDetails = await tmdbService.getMovieById(movie_id);
        
        // Save movie to database using existing Movie model
        const Movie = await import('../models/Movie.js');
        await Movie.default.createFromTmdb(movieDetails);
      } catch (tmdbError) {
        console.error('Error fetching movie from TMDB:', tmdbError);
        return res.status(404).json({
          success: false,
          error: 'Movie not found in TMDB database'
        });
      }
    }

    // Check if this combination already exists to prevent duplicates
    const existingFavorite = await pool.query(`
      SELECT id FROM favorites 
      WHERE user_id = $1 AND tmdb_id = $2 AND type = $3 AND (group_id = $4 OR (group_id IS NULL AND $4 IS NULL))
    `, [user_id, movie_id, type, type === FAVORITE_TYPES.GROUP_FAVORITES ? group_id : null]);

    if (existingFavorite.rows.length > 0) {
      // Already exists, return success without inserting
      let message = '';
      switch (type) {
        case FAVORITE_TYPES.WATCHLIST:
          message = 'Movie already in watchlist';
          break;
        case FAVORITE_TYPES.FAVORITES:
          message = 'Movie already in favorites';
          break;
        case FAVORITE_TYPES.GROUP_FAVORITES:
          message = 'Movie already in group favorites';
          break;
      }

      return res.status(200).json({
        success: true,
        message: message,
        data: existingFavorite.rows[0]
      });
    }

    // Add to favorites table using tmdb_id directly
    const result = await pool.query(`
      INSERT INTO favorites (user_id, created_at, type, group_id, tmdb_id)
      VALUES ($1, NOW(), $2, $3, $4)
      RETURNING *
    `, [user_id, type, type === FAVORITE_TYPES.GROUP_FAVORITES ? group_id : null, movie_id]);

    // Determine success message based on type
    let message = '';
    switch (type) {
      case FAVORITE_TYPES.WATCHLIST:
        message = 'Movie added to watchlist successfully';
        break;
      case FAVORITE_TYPES.FAVORITES:
        message = 'Movie added to favorites successfully';
        break;
      case FAVORITE_TYPES.GROUP_FAVORITES:
        message = 'Movie added to group favorites successfully';
        break;
    }

    res.status(201).json({
      success: true,
      message: message,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add movie to favorites'
    });
  }
};

/**
 * Remove movie from favorites
 */
export const removeFromFavorites = async (req, res) => {
  try {
    const { movie_id, type, group_id } = req.params;
    const user_id = req.user?.id;

    // Validate required fields
    if (!movie_id || !type) {
      return res.status(400).json({
        success: false,
        error: 'movie_id and type are required'
      });
    }

    const typeInt = parseInt(type);
    if (![1, 2, 3].includes(typeInt)) {
      return res.status(400).json({
        success: false,
        error: 'type must be 1 (watchlist), 2 (favorites), or 3 (group_favorites)'
      });
    }

    // Check permissions
    if ((typeInt === FAVORITE_TYPES.WATCHLIST || typeInt === FAVORITE_TYPES.FAVORITES) && !user_id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Handle group favorites removal
    if (typeInt === FAVORITE_TYPES.GROUP_FAVORITES) {
      if (!group_id) {
        return res.status(400).json({
          success: false,
          error: 'group_id is required for group favorites'
        });
      }

      if (!user_id) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Check if user is group owner, moderator, or admin
      const groupCheck = await pool.query(`
        SELECT g.owner_id, gm.role
        FROM groups g
        LEFT JOIN group_members gm ON g.id = gm.group_id AND gm.user_id = $2
        WHERE g.id = $1
      `, [group_id, user_id]);

      if (groupCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Group not found'
        });
      }

      const group = groupCheck.rows[0];
      const isOwner = parseInt(group.owner_id) === parseInt(user_id);
      const isModerator = group.role === 'moderator';

      const isAdmin = await pool.query(`
        SELECT role FROM user_roles WHERE user_id = $1 AND role = 'admin'
      `, [user_id]);

      if (!isOwner && !isModerator && isAdmin.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'Only group owners, moderators, and admins can remove movies from group favorites'
        });
      }

      // Get group owner's user_id for the favorites table
      const target_user_id = group.owner_id;

      // Check what's actually in the database for this group
      const debugQuery = await pool.query(`
        SELECT id, user_id, tmdb_id, type, group_id 
        FROM favorites 
        WHERE group_id = $1 AND type = $2
      `, [group_id, typeInt]);
      
      console.log('Debug - Current favorites in group:', debugQuery.rows);

      // Remove from favorites - for group favorites, we search by group_id and tmdb_id
      // since the user_id might be different if group ownership changed
      const result = await pool.query(`
        DELETE FROM favorites 
        WHERE tmdb_id = $1 AND type = $2 AND group_id = $3
        RETURNING *
      `, [movie_id, typeInt, group_id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Movie not found in group favorites'
        });
      }
    } else {
      // Handle personal watchlist/favorites removal
      // Admin can remove from anyone's list
      const isAdmin = await pool.query(`
        SELECT role FROM user_roles WHERE user_id = $1 AND role = 'admin'
      `, [user_id]);

      let target_user_id;
      if (isAdmin.rows.length > 0 && req.params.user_id) {
        target_user_id = parseInt(req.params.user_id);
      } else {
        target_user_id = user_id;
      }

      const result = await pool.query(`
        DELETE FROM favorites 
        WHERE user_id = $1 AND tmdb_id = $2 AND type = $3
        RETURNING *
      `, [target_user_id, movie_id, typeInt]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Movie not found in favorites'
        });
      }
    }

    res.json({
      success: true,
      message: 'Movie removed from favorites successfully'
    });

  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove movie from favorites'
    });
  }
};

/**
 * Get user's favorites (watchlist or personal favorites)
 */
export const getUserFavorites = async (req, res) => {
  try {
    const { user_id, type } = req.params;
    const current_user_id = req.user?.id;

    if (!user_id || !type) {
      return res.status(400).json({
        success: false,
        error: 'user_id and type are required'
      });
    }

    const typeInt = parseInt(type);
    if (![1, 2].includes(typeInt)) {
      return res.status(400).json({
        success: false,
        error: 'type must be 1 (watchlist) or 2 (favorites)'
      });
    }

    // Watchlist is private, only user or admin can see it
    if (typeInt === FAVORITE_TYPES.WATCHLIST) {
      if (!current_user_id) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required for watchlist'
        });
      }

      const isAdmin = await pool.query(`
        SELECT role FROM user_roles WHERE user_id = $1 AND role = 'admin'
      `, [current_user_id]);

      if (parseInt(user_id) !== parseInt(current_user_id) && isAdmin.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'You can only view your own watchlist'
        });
      }
    }

    // Get favorites with movie details
    const result = await pool.query(`
      SELECT 
        f.tmdb_id,
        f.created_at,
        f.type,
        m.original_title,
        m.release_year,
        m.poster_url
      FROM favorites f
      LEFT JOIN movies m ON m.tmdb_id = f.tmdb_id
      WHERE f.user_id = $1 AND f.type = $2
      ORDER BY f.created_at DESC
    `, [user_id, typeInt]);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Error getting user favorites:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user favorites'
    });
  }
};

/**
 * Get group favorites
 */
export const getGroupFavorites = async (req, res) => {
  try {
    const { group_id } = req.params;
    const user_id = req.user?.id;

    if (!group_id) {
      return res.status(400).json({
        success: false,
        error: 'group_id is required'
      });
    }

    // Get group information
    const groupInfo = await pool.query(`
      SELECT g.*, gt.name as theme_name
      FROM groups g
      LEFT JOIN group_themes gt ON gt.id = g.theme_id
      WHERE g.id = $1
    `, [group_id]);

    if (groupInfo.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    const group = groupInfo.rows[0];

    // Check visibility permissions
    if (group.visibility === 'private' || group.visibility === 'closed') {
      if (!user_id) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required for private/closed groups'
        });
      }

      // Check if user is group member, owner, or admin
      const isMember = await pool.query(`
        SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2
      `, [group_id, user_id]);

      const isOwner = group.owner_id === user_id;

      const isAdmin = await pool.query(`
        SELECT role FROM user_roles WHERE user_id = $1 AND role = 'admin'
      `, [user_id]);

      if (!isOwner && isMember.rows.length === 0 && isAdmin.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to this group'
        });
      }
    }

    // Get group favorites
    const result = await pool.query(`
      SELECT 
        f.tmdb_id,
        f.created_at,
        f.type,
        m.original_title,
        m.release_year,
        m.poster_url
      FROM favorites f
      LEFT JOIN movies m ON m.tmdb_id = f.tmdb_id
      WHERE f.group_id = $1 AND f.type = 3
      ORDER BY f.created_at DESC
    `, [group_id]);

    res.json({
      success: true,
      data: {
        group: {
          id: group.id,
          name: group.name,
          description: group.description,
          visibility: group.visibility,
          theme_name: group.theme_name,
          poster_url: group.poster_url
        },
        favorites: result.rows,
        count: result.rows.length
      }
    });

  } catch (error) {
    console.error('Error getting group favorites:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get group favorites'
    });
  }
};

/**
 * Check if movie(s) are in user's favorites
 * Supports both single ID and comma-separated multiple IDs in URL
 */
export const checkFavoriteStatus = async (req, res) => {
  try {
    const { movie_ids } = req.params;
    const user_id = req.user?.id;

    if (!movie_ids) {
      return res.status(400).json({
        success: false,
        error: 'movie_ids parameter is required'
      });
    }

    // Parse comma-separated movie IDs
    const movieIdsArray = movie_ids.split(',')
      .map(id => id.trim())
      .filter(id => id.length > 0);

    if (movieIdsArray.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid movie IDs provided'
      });
    }

    if (movieIdsArray.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 100 movie IDs allowed per request'
      });
    }

    // If user is not authenticated, return empty results for all movies
    if (!user_id) {
      if (movieIdsArray.length === 1) {
        return res.json({
          success: true,
          data: {
            watchlist: false,
            favorites: false,
            groups: []
          },
          count: 1
        });
      } else {
        const emptyResult = movieIdsArray.reduce((acc, movieId) => {
          acc[movieId] = {
            watchlist: false,
            favorites: false,
            groups: []
          };
          return acc;
        }, {});

        return res.json({
          success: true,
          data: emptyResult,
          count: movieIdsArray.length
        });
      }
    }

    // Create placeholders for SQL IN clause
    const placeholders = movieIdsArray.map((_, index) => `$${index + 2}`).join(', ');

    // Check personal favorites for all movies
    const personalFavorites = await pool.query(`
      SELECT tmdb_id, type FROM favorites 
      WHERE user_id = $1 AND tmdb_id IN (${placeholders}) AND type IN (1, 2)
    `, [user_id, ...movieIdsArray]);

    // Check group favorites where user is member or owner
    const groupFavorites = await pool.query(`
      SELECT DISTINCT f.tmdb_id, g.id, g.name
      FROM favorites f
      JOIN groups g ON g.owner_id = f.user_id
      LEFT JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = $1
      WHERE f.tmdb_id IN (${placeholders}) AND f.type = 3 
      AND (g.owner_id = $1 OR gm.user_id = $1 OR g.visibility = 'public')
    `, [user_id, ...movieIdsArray]);

    // Build result object
    const result = {};
    
    movieIdsArray.forEach(movieId => {
      const moviePersonalFavorites = personalFavorites.rows.filter(row => row.tmdb_id === movieId);
      const movieGroupFavorites = groupFavorites.rows.filter(row => row.tmdb_id === movieId);

      result[movieId] = {
        watchlist: moviePersonalFavorites.some(row => row.type === 1),
        favorites: moviePersonalFavorites.some(row => row.type === 2),
        groups: movieGroupFavorites.map(row => ({
          id: row.id,
          name: row.name
        }))
      };
    });

    // Return single object for single movie, or full object for multiple movies
    res.json({
      success: true,
      data: movieIdsArray.length === 1 ? result[movieIdsArray[0]] : result,
      count: movieIdsArray.length
    });

  } catch (error) {
    console.error('Error checking favorite status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check favorite status'
    });
  }
};