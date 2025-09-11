import UserService from '../services/UserService.js';

class UserController {
  // POST /api/users/register - Rekisteröi uusi käyttäjä
  static async register(req, res) {
    try {
      const { username, email, password } = req.body;

      // Validoi syötteet
      if (!username || !email || !password) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Username, email, and password are required'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          error: 'Password too short',
          message: 'Password must be at least 6 characters long'
        });
      }

      const user = await UserService.register({ username, email, password });

      res.status(201).json({
        message: 'User registered successfully',
        user
      });
    } catch (error) {
      res.status(400).json({
        error: 'Registration failed',
        message: error.message
      });
    }
  }

  // POST /api/users/login - Kirjaudu sisään
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: 'Missing credentials',
          message: 'Email and password are required'
        });
      }

      const result = await UserService.login(email, password);

      res.json({
        message: 'Login successful',
        ...result
      });
    } catch (error) {
      res.status(401).json({
        error: 'Authentication failed',
        message: error.message
      });
    }
  }

  // GET /api/users/profile - Hae käyttäjän profiili (suojattu)
  static async getProfile(req, res) {
    try {
      const user = await UserService.getProfile(req.user.id);
      res.json({ user });
    } catch (error) {
      res.status(404).json({
        error: 'Profile not found',
        message: error.message
      });
    }
  }

  // PUT /api/users/profile - Päivitä käyttäjän profiili (suojattu)
  static async updateProfile(req, res) {
    try {
      const allowedFields = ['username', 'email', 'currentPassword', 'newPassword'];
      const updateData = {};

      // Ota vain sallitut kentät
      Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key)) {
          updateData[key] = req.body[key];
        }
      });

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: 'No valid fields to update',
          message: 'Please provide valid fields to update'
        });
      }

      const user = await UserService.updateProfile(req.user.id, updateData);

      res.json({
        message: 'Profile updated successfully',
        user
      });
    } catch (error) {
      res.status(400).json({
        error: 'Update failed',
        message: error.message
      });
    }
  }

  // DELETE /api/users/profile - Poista käyttäjän tili (suojattu)
  static async deleteProfile(req, res) {
    try {
      await UserService.deleteUser(req.user.id);
      res.json({
        message: 'User account deleted successfully'
      });
    } catch (error) {
      res.status(400).json({
        error: 'Deletion failed',
        message: error.message
      });
    }
  }

  // GET /api/users - Hae kaikki käyttäjät (suojattu)
  static async getAllUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;

      if (page < 1 || limit < 1 || limit > 100) {
        return res.status(400).json({
          error: 'Invalid pagination parameters',
          message: 'Page must be >= 1 and limit must be between 1-100'
        });
      }

      const users = await UserService.getAllUsers(page, limit);

      res.json({
        users,
        pagination: {
          page,
          limit,
          total: users.length
        }
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch users',
        message: error.message
      });
    }
  }

  // GET /api/users/:id - Hae käyttäjä ID:n perusteella (suojattu)
  static async getUserById(req, res) {
    try {
      const userId = parseInt(req.params.id);

      if (isNaN(userId)) {
        return res.status(400).json({
          error: 'Invalid user ID',
          message: 'User ID must be a valid number'
        });
      }

      const user = await UserService.getUserById(userId);
      res.json({ user });
    } catch (error) {
      res.status(404).json({
        error: 'User not found',
        message: error.message
      });
    }
  }

  // DELETE /api/users/:id - Poista käyttäjä ID:n perusteella (admin)
  static async deleteUserById(req, res) {
    try {
      const userId = parseInt(req.params.id);

      if (isNaN(userId)) {
        return res.status(400).json({
          error: 'Invalid user ID',
          message: 'User ID must be a valid number'
        });
      }

      // Estä käyttäjää poistamasta itseään tämän reitin kautta
      if (userId === req.user.id) {
        return res.status(400).json({
          error: 'Cannot delete own account',
          message: 'Use DELETE /api/users/profile to delete your own account'
        });
      }

      await UserService.deleteUser(userId);
      res.json({
        message: 'User deleted successfully'
      });
    } catch (error) {
      res.status(400).json({
        error: 'Deletion failed',
        message: error.message
      });
    }
  }
}

export default UserController;
