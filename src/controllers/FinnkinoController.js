import FinnkinoService from '../services/FinnkinoService.js';

class FinnkinoController {
  static finnkinoService = new FinnkinoService();

  /**
   * GET /api/finnkino/events - Hae elokuvien lista
   */
  static async getEvents(req, res) {
    try {
      const {
        listType = 'NowInTheatres',
        area,
        eventID,
        includeVideos = 'true',
        includeLinks = 'false',
        includeGallery = 'false',
        includePictures = 'false'
      } = req.query;

      const options = {
        listType,
        includeVideos,
        includeLinks,
        includeGallery,
        includePictures
      };

      if (area) options.area = area;
      if (eventID) options.eventID = eventID;

      const events = await FinnkinoController.finnkinoService.getEvents(options);

      res.json({
        success: true,
        count: events.length,
        listType,
        area: area || 'ALL',
        events
      });
    } catch (error) {
      console.error('Error fetching Finnkino events:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch events',
        message: error.message
      });
    }
  }

  /**
   * GET /api/finnkino/schedule - Hae elokuvien aikataulut
   */
  static async getSchedule(req, res) {
    try {
      const {
        area = '1014', // Pääkaupunkiseutu oletuksena
        dt,
        eventID,
        nrOfDays = '1'
      } = req.query;

      // Validoi nrOfDays
      const days = parseInt(nrOfDays);
      if (isNaN(days) || days < 1 || days > 31) {
        return res.status(400).json({
          success: false,
          error: 'Invalid nrOfDays parameter',
          message: 'nrOfDays must be a number between 1 and 31'
        });
      }

      // Validoi päivämäärä jos annettu
      if (dt && !/^\d{2}\.\d{2}\.\d{4}$/.test(dt)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format',
          message: 'Date must be in format dd.mm.yyyy'
        });
      }

      const options = {
        area,
        nrOfDays: days.toString()
      };

      if (dt) options.dt = dt;
      if (eventID) options.eventID = eventID;

      const schedule = await FinnkinoController.finnkinoService.getSchedule(options);

      res.json({
        success: true,
        count: schedule.length,
        area,
        date: dt || 'today',
        days,
        eventID: eventID || 'ALL',
        schedule
      });
    } catch (error) {
      console.error('Error fetching Finnkino schedule:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch schedule',
        message: error.message
      });
    }
  }

  /**
   * GET /api/finnkino/theatres - Hae teatterialueiden lista
   */
  static async getTheatreAreas(req, res) {
    try {
      const areas = await FinnkinoController.finnkinoService.getTheatreAreas();

      res.json({
        success: true,
        count: areas.length,
        theatreAreas: areas
      });
    } catch (error) {
      console.error('Error fetching theatre areas:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch theatre areas',
        message: error.message
      });
    }
  }

  /**
   * GET /api/finnkino/events/:id - Hae yksittäisen elokuvan tiedot
   */
  static async getEventById(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Missing event ID',
          message: 'Event ID is required'
        });
      }

      const event = await FinnkinoController.finnkinoService.getEventById(id);

      if (!event) {
        return res.status(404).json({
          success: false,
          error: 'Event not found',
          message: `Event with ID ${id} not found`
        });
      }

      res.json({
        success: true,
        event
      });
    } catch (error) {
      console.error('Error fetching event by ID:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch event',
        message: error.message
      });
    }
  }

  /**
   * GET /api/finnkino/events/:id/schedule - Hae elokuvan aikataulut
   */
  static async getEventSchedule(req, res) {
    try {
      const { id } = req.params;
      const {
        area = '1014',
        date = '',
        days = '7'
      } = req.query;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Missing event ID',
          message: 'Event ID is required'
        });
      }

      const daysNum = parseInt(days);
      if (isNaN(daysNum) || daysNum < 1 || daysNum > 31) {
        return res.status(400).json({
          success: false,
          error: 'Invalid days parameter',
          message: 'Days must be a number between 1 and 31'
        });
      }

      if (date && !/^\d{2}\.\d{2}\.\d{4}$/.test(date)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format',
          message: 'Date must be in format dd.mm.yyyy'
        });
      }

      const schedule = await FinnkinoController.finnkinoService.getEventSchedule(
        id, 
        area, 
        date, 
        daysNum
      );

      res.json({
        success: true,
        eventId: id,
        area,
        date: date || 'today',
        days: daysNum,
        count: schedule.length,
        schedule
      });
    } catch (error) {
      console.error('Error fetching event schedule:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch event schedule',
        message: error.message
      });
    }
  }

  /**
   * GET /api/finnkino/search - Etsi elokuvia
   */
  static async searchEvents(req, res) {
    try {
      const {
        q,
        query,
        listType = 'NowInTheatres'
      } = req.query;

      // Hyväksy sekä 'q' että 'query' parametrit
      const searchQuery = q || query || '';

      if (!searchQuery.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Missing search query',
          message: 'Search query (q or query) is required'
        });
      }

      if (!['NowInTheatres', 'ComingSoon'].includes(listType)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid list type',
          message: 'listType must be either NowInTheatres or ComingSoon'
        });
      }

      const events = await FinnkinoController.finnkinoService.searchEvents(searchQuery, listType);

      res.json({
        success: true,
        query: searchQuery,
        listType,
        count: events.length,
        events
      });
    } catch (error) {
      console.error('Error searching events:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search events',
        message: error.message
      });
    }
  }

  /**
   * GET /api/finnkino/popular - Hae suositut elokuvat
   */
  static async getPopularEvents(req, res) {
    try {
      const { limit = '10' } = req.query;
      
      const limitNum = parseInt(limit);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
        return res.status(400).json({
          success: false,
          error: 'Invalid limit parameter',
          message: 'Limit must be a number between 1 and 50'
        });
      }

      const events = await FinnkinoController.finnkinoService.getPopularEvents(limitNum);

      res.json({
        success: true,
        limit: limitNum,
        count: events.length,
        events
      });
    } catch (error) {
      console.error('Error fetching popular events:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch popular events',
        message: error.message
      });
    }
  }

  /**
   * GET /api/finnkino/coming-soon - Hae tulevat elokuvat
   */
  static async getComingSoonEvents(req, res) {
    try {
      const events = await FinnkinoController.finnkinoService.getComingSoonEvents();

      res.json({
        success: true,
        count: events.length,
        events
      });
    } catch (error) {
      console.error('Error fetching coming soon events:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch coming soon events',
        message: error.message
      });
    }
  }

  /**
   * GET /api/finnkino/now-showing - Hae nyt elokuvateattereissa olevat elokuvat
   */
  static async getNowShowingEvents(req, res) {
    try {
      const { area } = req.query;
      
      const options = { listType: 'NowInTheatres' };
      if (area) options.area = area;

      const events = await FinnkinoController.finnkinoService.getEvents(options);

      res.json({
        success: true,
        area: area || 'ALL',
        count: events.length,
        events
      });
    } catch (error) {
      console.error('Error fetching now showing events:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch now showing events',
        message: error.message
      });
    }
  }
}

export default FinnkinoController;
