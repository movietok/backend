import express from 'express';
import UserController from '../controllers/UserController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Julkiset reitit (eivät vaadi autentikointia)
router.post('/register', UserController.register);
router.post('/login', UserController.login);

// Suojatut reitit (vaativat autentikoinnin)
router.use(authenticateToken); // Kaikki alla olevat reitit vaativat autentikoinnin

// Käyttäjän omat tiedot
router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateProfile);
router.delete('/profile', UserController.deleteProfile);

// Käyttäjähallinta
router.get('/', UserController.getAllUsers);
router.get('/:id', UserController.getUserById);
router.put('/:id', UserController.updateUserById);
router.delete('/:id', UserController.deleteUserById);

export default router;
