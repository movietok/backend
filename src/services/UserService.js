import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import config from '../config/config.js';

const securityConfig = config.getSecurityConfig();
const jwtConfig = config.getAll().jwt;

class UserService {
  // Rekisteröi uusi käyttäjä
  static async register(userData) {
    try {
      const { username, email, password } = userData;

      // Tarkista että käyttäjä ei ole jo olemassa
      const existingUserByEmail = await User.findByEmail(email);
      if (existingUserByEmail) {
        throw new Error('User with this email already exists');
      }

      const existingUserByUsername = await User.findByUsername(username);
      if (existingUserByUsername) {
        throw new Error('User with this username already exists');
      }

      // Hashaa salasana
      const saltRounds = securityConfig.bcryptRounds;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Luo uusi käyttäjä
      const newUser = await User.create({
        username,
        email,
        password: hashedPassword
      });

      return newUser.toPublicObject();
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  // Kirjaudu sisään
  static async login(email, password) {
    try {
      // Hae käyttäjä sähköpostilla
      const user = await User.findByEmail(email);
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Tarkista salasana
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        throw new Error('Invalid credentials');
      }

      // Luo JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username,
          email: user.email 
        },
        jwtConfig.secret,
        { expiresIn: jwtConfig.expiresIn }
      );

      return {
        token,
        user: user.toPublicObject()
      };
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  // Hae käyttäjän profiili
  static async getProfile(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      return user.toPublicObject();
    } catch (error) {
      throw new Error(`Failed to get profile: ${error.message}`);
    }
  }

  // Päivitä käyttäjän profiili
  static async updateProfile(userId, updateData) {
    try {
      const { username, email, currentPassword, newPassword } = updateData;
      
      // Jos halutaan vaihtaa salasana, tarkista nykyinen salasana
      if (newPassword) {
        if (!currentPassword) {
          throw new Error('Current password is required to change password');
        }

        const user = await User.findById(userId);
        if (!user) {
          throw new Error('User not found');
        }
        
        const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
        if (!validPassword) {
          throw new Error('Current password is incorrect');
        }

        // Hashaa uusi salasana
        const saltRounds = securityConfig.bcryptRounds;
        updateData.password = await bcrypt.hash(newPassword, saltRounds);
        delete updateData.newPassword;
        delete updateData.currentPassword;
      }

      // Tarkista että uusi sähköposti ei ole jo käytössä
      if (email) {
        const existingUser = await User.findByEmail(email);
        if (existingUser && existingUser.id !== userId) {
          throw new Error('Email is already in use');
        }
      }

      // Tarkista että uusi käyttäjänimi ei ole jo käytössä
      if (username) {
        const existingUser = await User.findByUsername(username);
        if (existingUser && existingUser.id !== userId) {
          throw new Error('Username is already in use');
        }
      }

      const updatedUser = await User.updateById(userId, updateData);
      if (!updatedUser) {
        throw new Error('User not found');
      }

      return updatedUser.toPublicObject();
    } catch (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }
  }

  // Poista käyttäjä
  static async deleteUser(userId) {
    try {
      const deletedUser = await User.deleteById(userId);
      if (!deletedUser) {
        throw new Error('User not found');
      }
      return deletedUser.toPublicObject();
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  // Hae kaikki käyttäjät (admin-toiminto)
  static async getAllUsers(page = 1, limit = 50) {
    try {
      const offset = (page - 1) * limit;
      const users = await User.findAll(limit, offset);
      return users.map(user => user.toPublicObject());
    } catch (error) {
      throw new Error(`Failed to get users: ${error.message}`);
    }
  }

  // Hae käyttäjä ID:n perusteella
  static async getUserById(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      return user.toPublicObject();
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  // Päivitä käyttäjä ID:n perusteella (admin-toiminto)
  static async updateUserById(userId, updateData) {
    try {
      const { username, email } = updateData;
      
      // Tarkista että käyttäjä löytyy
      const existingUser = await User.findById(userId);
      if (!existingUser) {
        throw new Error('User not found');
      }

      // Tarkista että sähköposti ei ole jo käytössä toisella käyttäjällä
      if (email && email !== existingUser.email) {
        const emailUser = await User.findByEmail(email);
        if (emailUser && emailUser.id !== userId) {
          throw new Error('Email is already in use by another user');
        }
      }

      // Tarkista että käyttäjänimi ei ole jo käytössä toisella käyttäjällä
      if (username && username !== existingUser.username) {
        const usernameUser = await User.findByUsername(username);
        if (usernameUser && usernameUser.id !== userId) {
          throw new Error('Username is already taken by another user');
        }
      }

      // Päivitä vain username ja email (role päivitetään erikseen jos tarvitaan)
      const updates = {};
      if (username) updates.username = username;
      if (email) updates.email = email;

      if (Object.keys(updates).length === 0) {
        // Jos ei ole päivitettäviä kenttiä, palauta nykyinen käyttäjä
        return existingUser.toPublicObject();
      }

      const updatedUser = await User.updateById(userId, updates);
      return updatedUser.toPublicObject();
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }
}

export default UserService;
