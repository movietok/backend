import express from 'express';
import FinnkinoController from '../controllers/FinnkinoController.js';

const router = express.Router();

// Elokuvien haku
router.get('/events', FinnkinoController.getEvents);
router.get('/events/:id', FinnkinoController.getEventById);
router.get('/events/:id/schedule', FinnkinoController.getEventSchedule);

// Aikataulut
router.get('/schedule', FinnkinoController.getSchedule);

// Teatterialueet
router.get('/theatres', FinnkinoController.getTheatreAreas);

// Haku
router.get('/search', FinnkinoController.searchEvents);

// Erikoisreitit
router.get('/popular', FinnkinoController.getPopularEvents);
router.get('/coming-soon', FinnkinoController.getComingSoonEvents);
router.get('/now-showing', FinnkinoController.getNowShowingEvents);

export default router;
