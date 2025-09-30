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

    // For watchlist and personal favorites, user must be authenticated
    if ((type === FAVORITE_TYPES.WATCHLIST || type === FAVORITE_TYPES.FAVORITES) && !user_id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required for personal lists'
      });
    }

    // For group favorites, validate group_id and permissions
    if (type === FAVORITE_TYPES.GROUP_FAVORITES) {
      if (!group_id) {
        return res.status(400).json({
          success: false,
          error: 'group_id is required for group favorites'
        });
      }

      if (!user_id) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required for group favorites'
        });
      }

      // Check if user is group member or owner
      const memberCheck = await pool.query(`
        SELECT gm.role, g.owner_id 
        FROM group_members gm
        JOIN groups g ON g.id = gm.group_id
        WHERE gm.group_id = $1 AND gm.user_id = $2
      `, [group_id, user_id]);

      const isOwner = await pool.query(`
        SELECT id FROM groups WHERE id = $1 AND owner_id = $2
      `, [group_id, user_id]);

      if (memberCheck.rows.length === 0 && isOwner.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'You must be a group member to add movies to group favorites'
        });
      }
    }

    // Ensure movie exists in movies table
    const movieExists = await pool.query('SELECT id FROM movies WHERE id = $1', [movie_id]);
    if (movieExists.rows.length === 0) {
      // Create movie entry if it doesn't exist
      await pool.query('INSERT INTO movies (id) VALUES ($1) ON CONFLICT (id) DO NOTHING', [movie_id]);
    }

    // For group favorites, use group owner's user_id in the favorites table
    let target_user_id = user_id;
    if (type === FAVORITE_TYPES.GROUP_FAVORITES) {
      const groupOwner = await pool.query('SELECT owner_id FROM groups WHERE id = $1', [group_id]);
      if (groupOwner.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Group not found'
        });
      }
      target_user_id = groupOwner.rows[0].owner_id;
    }

    // Add to favorites
    const result = await pool.query(`
      INSERT INTO favorites (user_id, movie_id, type, created_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (user_id, movie_id) 
      DO UPDATE SET type = $3, created_at = NOW()
      RETURNING *
    `, [target_user_id, movie_id, type]);

    res.status(201).json({
      success: true,
      message: 'Movie added to favorites successfully',
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

      // Check if user is group owner or admin
      const isOwner = await pool.query(`
        SELECT id FROM groups WHERE id = $1 AND owner_id = $2
      `, [group_id, user_id]);

      const isAdmin = await pool.query(`
        SELECT role FROM user_roles WHERE user_id = $1 AND role = 'admin'
      `, [user_id]);

      if (isOwner.rows.length === 0 && isAdmin.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'Only group owners and admins can remove movies from group favorites'
        });
      }

      // Get group owner's user_id for the favorites table
      const groupOwner = await pool.query('SELECT owner_id FROM groups WHERE id = $1', [group_id]);
      if (groupOwner.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Group not found'
        });
      }

      const target_user_id = groupOwner.rows[0].owner_id;

      // Remove from favorites
      const result = await pool.query(`
        DELETE FROM favorites 
        WHERE user_id = $1 AND movie_id = $2 AND type = $3
        RETURNING *
      `, [target_user_id, movie_id, typeInt]);

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
        WHERE user_id = $1 AND movie_id = $2 AND type = $3
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

      if (parseInt(user_id) !== current_user_id && isAdmin.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'You can only view your own watchlist'
        });
      }
    }

    // Get favorites with movie details
    const result = await pool.query(`
      SELECT 
        f.movie_id,
        f.created_at,
        f.type,
        m.original_title,
        m.tmdb_id,
        m.release_year
      FROM favorites f
      LEFT JOIN movies m ON m.id = f.movie_id
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
        f.movie_id,
        f.created_at,
        f.type,
        m.original_title,
        m.tmdb_id,
        m.release_year
      FROM favorites f
      LEFT JOIN movies m ON m.id = f.movie_id
      WHERE f.user_id = $1 AND f.type = $2
      ORDER BY f.created_at DESC
    `, [group.owner_id, FAVORITE_TYPES.GROUP_FAVORITES]);

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
 * Check if movie is in user's favorites
 */
export const checkFavoriteStatus = async (req, res) => {
  try {
    const { movie_id } = req.params;
    const user_id = req.user?.id;

    if (!movie_id) {
      return res.status(400).json({
        success: false,
        error: 'movie_id is required'
      });
    }

    if (!user_id) {
      return res.json({
        success: true,
        data: {
          watchlist: false,
          favorites: false,
          groups: []
        }
      });
    }

    // Check personal favorites
    const personalFavorites = await pool.query(`
      SELECT type FROM favorites 
      WHERE user_id = $1 AND movie_id = $2 AND type IN (1, 2)
    `, [user_id, movie_id]);

    const watchlist = personalFavorites.rows.some(row => row.type === 1);
    const favorites = personalFavorites.rows.some(row => row.type === 2);

    // Check group favorites where user is member or owner
    const groupFavorites = await pool.query(`
      SELECT DISTINCT g.id, g.name
      FROM favorites f
      JOIN groups g ON g.owner_id = f.user_id
      LEFT JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = $1
      WHERE f.movie_id = $2 AND f.type = 3 
      AND (g.owner_id = $1 OR gm.user_id = $1 OR g.visibility = 'public')
    `, [user_id, movie_id]);

    res.json({
      success: true,
      data: {
        watchlist,
        favorites,
        groups: groupFavorites.rows
      }
    });

  } catch (error) {
    console.error('Error checking favorite status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check favorite status'
    });
  }
};