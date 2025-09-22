import xml2js from 'xml2js';
import FinnkinoCache from '../utils/FinnkinoCache.js';

class FinnkinoService {
  constructor() {
    this.baseUrl = 'https://www.finnkino.fi/xml';
    this.parser = new xml2js.Parser({ 
      explicitArray: false,
      ignoreAttrs: false,
      mergeAttrs: true 
    });
    this.cache = FinnkinoCache;
  }

  /**
   * Hae XML-data Finnkino API:sta ja muunna JSON:ksi (tehtiin useragentti, jotta vältytään banneilta)
   * Käyttää cache-järjestelmää parantaakseen luotettavuutta
   */
  async fetchXmlData(url) {
    try {
      // Generate cache key for this request
      const cacheKey = this.cache.generateCacheKey(url);
      
      // Try to get data from cache first
      const cachedData = await this.cache.getFromCache(cacheKey);
      if (cachedData) {
        console.log(`📂 Using cached data for: ${url}`);
        return cachedData.data;
      }

      // If not in cache or expired, fetch from API
      console.log(`🌐 Fetching fresh data from: ${url}`);
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
          'Accept': 'application/xml, text/xml, */*',
          'Accept-Language': 'fi-FI,fi;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Ch-Ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Cache-Control': 'no-cache'
        },
        method: 'GET'
      });
      
      if (!response.ok) {
        // If API call fails, try to use cached data even if expired
        const expiredCachedData = await this.cache.getFromCache(cacheKey);
        if (expiredCachedData) {
          console.log(`⚠️ API failed (${response.status}), using expired cache for: ${url}`);
          return expiredCachedData.data;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const xmlData = await response.text();
      const result = await this.parser.parseStringPromise(xmlData);
      
      // Save successful response to cache
      await this.cache.saveToCache(cacheKey, result);
      console.log(`💾 Cached fresh data for: ${url}`);
      
      return result;
    } catch (error) {
      console.error('Finnkino API error:', error);
      
      // As a last resort, try to use any cached data (even expired)
      const cacheKey = this.cache.generateCacheKey(url);
      const fallbackData = await this.cache.getFromCache(cacheKey);
      if (fallbackData) {
        console.log(`🚨 Using fallback cache data due to error for: ${url}`);
        return fallbackData.data;
      }
      
      throw new Error(`Failed to fetch data from Finnkino: ${error.message}`);
    }
  }

  /**
   * Hae elokuvien lista
   * @param {Object} options - Hakuehdot
   * @returns {Promise<Array>} Lista elokuvista
   */
  async getEvents(options = {}) {
    try {
      const {
        listType = 'NowInTheatres',
        area = '',
        eventID = '',
        includeVideos = 'true',
        includeLinks = 'false',
        includeGallery = 'false',
        includePictures = 'false'
      } = options;

      const params = new URLSearchParams({
        listType,
        includeVideos,
        includeLinks,
        includeGallery,
        includePictures
      });

      if (area) params.append('area', area);
      if (eventID) params.append('eventID', eventID);

      const url = `${this.baseUrl}/Events/?${params.toString()}`;
      console.log('🎬 Fetching events from:', url);

      const data = await this.fetchXmlData(url);
      
      console.log('📊 Finnkino API response structure:', {
        hasEvents: !!data.Events,
        hasEvent: !!(data.Events && data.Events.Event),
        eventType: data.Events && data.Events.Event ? typeof data.Events.Event : 'undefined'
      });
      
      if (!data.Events || !data.Events.Event) {
        console.log('⚠️ No events found in Finnkino response');
        return [];
      }

      // Varmista että Event on aina array
      const events = Array.isArray(data.Events.Event) ? data.Events.Event : [data.Events.Event];
      
      console.log(`📽️ Found ${events.length} events`);
      
      return events.map((event, index) => {
        try {
          return this.formatEvent(event);
        } catch (formatError) {
          console.error(`❌ Error formatting event ${index}:`, formatError);
          console.error('Event data:', JSON.stringify(event, null, 2));
          throw formatError;
        }
      });
    } catch (error) {
      throw new Error(`Failed to get events: ${error.message}`);
    }
  }

  /**
   * Hae elokuvien aikataulut
   * @param {Object} options - Hakuehdot
   * @returns {Promise<Array>} Lista aikatauluista
   */
  async getSchedule(options = {}) {
    try {
      const {
        area = '1014', // Pääkaupunkiseutu oletuksena, listään tietokantaan listaus 
        dt = '', // Tämä päivä oletuksena
        eventID = '',
        nrOfDays = '1'
      } = options;

      const params = new URLSearchParams({
        area,
        nrOfDays
      });

      if (dt) params.append('dt', dt);
      if (eventID) params.append('eventID', eventID);

      const url = `${this.baseUrl}/Schedule/?${params.toString()}`;
      console.log('📅 Fetching schedule from:', url);

      const data = await this.fetchXmlData(url);
      
      if (!data.Schedule || !data.Schedule.Shows || !data.Schedule.Shows.Show) {
        return [];
      }

      // Varmista että Show on aina array
      const shows = Array.isArray(data.Schedule.Shows.Show) ? data.Schedule.Shows.Show : [data.Schedule.Shows.Show];
      
      return shows.map(show => this.formatShow(show));
    } catch (error) {
      throw new Error(`Failed to get schedule: ${error.message}`);
    }
  }

  /**
   * Hae teatterialueiden lista
   * @returns {Promise<Array>} Lista teatterialueista
   */
  async getTheatreAreas() {
    try {
      const url = `${this.baseUrl}/TheatreAreas/`;
      console.log('🏛️ Fetching theatre areas from:', url);

      const data = await this.fetchXmlData(url);
      
      if (!data.TheatreAreas || !data.TheatreAreas.TheatreArea) {
        return [];
      }

      const areas = Array.isArray(data.TheatreAreas.TheatreArea) 
        ? data.TheatreAreas.TheatreArea 
        : [data.TheatreAreas.TheatreArea];
      
      return areas.map(area => ({
        id: area.ID,
        name: area.Name
      }));
    } catch (error) {
      throw new Error(`Failed to get theatre areas: ${error.message}`);
    }
  }

  /**
   * Hae yksittäisen elokuvan tiedot
   * @param {string} eventID - Elokuvan ID
   * @returns {Promise<Object>} Elokuvan tiedot
   */
  async getEventById(eventID) {
    try {
      const events = await this.getEvents({ eventID });
      return events.length > 0 ? events[0] : null;
    } catch (error) {
      throw new Error(`Failed to get event by ID: ${error.message}`);
    }
  }

  /**
   * Hae elokuvan aikataulut tietyllä alueella
   * @param {string} eventID - Elokuvan ID
   * @param {string} area - Alueen ID
   * @param {string} date - Päivämäärä (dd.mm.yyyy)
   * @param {number} days - Päivien määrä
   * @returns {Promise<Array>} Lista näytöksistä
   */
  async getEventSchedule(eventID, area = '1014', date = '', days = 7) {
    try {
      return await this.getSchedule({
        eventID,
        area,
        dt: date,
        nrOfDays: days.toString()
      });
    } catch (error) {
      throw new Error(`Failed to get event schedule: ${error.message}`);
    }
  }

  /**
   * Etsi elokuvia nimellä
   * @param {string} query - Hakusana
   * @param {string} listType - Lista tyyppi
   * @returns {Promise<Array>} Lista elokuvista
   */
  async searchEvents(query, listType = 'NowInTheatres') {
    try {
      const events = await this.getEvents({ listType });
      
      if (!query) return events;
      
      const searchTerm = query.toLowerCase();
      return events.filter(event => {
        // Varmistetaan että kaikki kentät ovat stringejä
        const title = (event.title || '').toString().toLowerCase();
        const originalTitle = (event.originalTitle || '').toString().toLowerCase();
        const genres = (event.genres || '').toString().toLowerCase();
        const directors = (event.directors || '').toString().toLowerCase();
        const cast = (event.cast || '').toString().toLowerCase();
        const synopsis = (event.synopsis || '').toString().toLowerCase();
        
        return title.includes(searchTerm) ||
               originalTitle.includes(searchTerm) ||
               genres.includes(searchTerm) ||
               directors.includes(searchTerm) ||
               cast.includes(searchTerm) ||
               synopsis.includes(searchTerm);
      });
    } catch (error) {
      throw new Error(`Failed to search events: ${error.message}`);
    }
  }

  /**
   * Muotoile elokuvan tiedot
   * @param {Object} event - Raaka elokuvan data
   * @returns {Object} Muotoiltu elokuvan data
   */
  formatEvent(event) {
    return {
      id: event.ID,
      title: event.Title || '',
      originalTitle: event.OriginalTitle || '',
      productionYear: event.ProductionYear ? parseInt(event.ProductionYear) : null,
      lengthInMinutes: event.LengthInMinutes ? parseInt(event.LengthInMinutes) : null,
      dtLocalRelease: event.dtLocalRelease || '',
      dtModified: event.dtModified || '',
      eventType: event.EventType || '',
      genres: event.Genres || '',
      synopsis: event.Synopsis || '',
      directors: event.Directors || '',
      cast: event.Cast || '',
      productionCompanies: event.ProductionCompanies || '',
      distributorFinnish: event.DistributorFinnish || '',
      language: event.SpokenLanguage ? event.SpokenLanguage.Name : '',
      subtitleLanguage1: event.SubtitleLanguage1 ? event.SubtitleLanguage1.Name : '',
      subtitleLanguage2: event.SubtitleLanguage2 ? event.SubtitleLanguage2.Name : '',
      rating: {
        name: event.Rating && event.Rating.Name ? event.Rating.Name : '',
        ageLimit: event.Rating && event.Rating.Name ? event.Rating.Name.replace(/\D/g, '') : '',
        imageUrl: event.Rating && event.Rating.ImageURL ? event.Rating.ImageURL : ''
      },
      images: {
        eventSmall: event.Images ? event.Images.EventSmallImageURL : '',
        eventMedium: event.Images ? event.Images.EventMediumImageURL : '',
        eventLarge: event.Images ? event.Images.EventLargeImageURL : ''
      },
      videos: event.Videos && event.Videos.EventVideo ? 
        (Array.isArray(event.Videos.EventVideo) ? event.Videos.EventVideo : [event.Videos.EventVideo]).map(video => ({
          title: video.Title || '',
          location: video.Location || '',
          thumbnailLocation: video.ThumbnailLocation || ''
        })) : [],
      showStart: event.dttmShowStart || '',
      showEnd: event.dttmShowEnd || ''
    };
  }

  /**
   * Muotoile näytöksen tiedot
   * @param {Object} show - Raaka näytöksen data
   * @returns {Object} Muotoiltu näytöksen data
   */
  formatShow(show) {
    return {
      id: show.ID,
      eventId: show.EventID,
      title: show.Title || '',
      originalTitle: show.OriginalTitle || '',
      productionYear: show.ProductionYear ? parseInt(show.ProductionYear) : null,
      lengthInMinutes: show.LengthInMinutes ? parseInt(show.LengthInMinutes) : null,
      showStart: show.dttmShowStart || '',
      showEnd: show.dttmShowEnd || '',
      genres: show.Genres || '',
      synopsis: show.Synopsis || '',
      rating: {
        name: show.Rating && show.Rating.Name ? show.Rating.Name : '',
        ageLimit: show.Rating && show.Rating.Name ? show.Rating.Name.replace(/\D/g, '') : '',
        imageUrl: show.Rating && show.Rating.ImageURL ? show.Rating.ImageURL : ''
      },
      images: {
        eventSmall: show.Images ? show.Images.EventSmallImageURL : '',
        eventMedium: show.Images ? show.Images.EventMediumImageURL : '',
        eventLarge: show.Images ? show.Images.EventLargeImageURL : ''
      },
      theatre: show.Theatre || '',
      theatreAuditorium: show.TheatreAuditorium || '',
      theatreAndAuditorium: show.TheatreAndAuditorium || '',
      presentationMethod: show.PresentationMethod || '',
      presentationMethodAndLanguage: show.PresentationMethodAndLanguage || '',
      ticketUrl: show.ShowURL || '',
      eventUrl: show.EventURL || ''
    };
  }

  /**
   * Cache management methods
   */
  
  /**
   * Get cache statistics
   */
  async getCacheStats() {
    return await this.cache.getCacheStats();
  }

  /**
   * Clear all cached data
   */
  async clearCache() {
    return await this.cache.clearAllCache();
  }

  /**
   * Clear specific cache entry
   */
  async clearCacheForUrl(url) {
    const cacheKey = this.cache.generateCacheKey(url);
    return await this.cache.clearCache(cacheKey);
  }

  /**
   * Hae suositut elokuvat (esim. top 10)
   * @param {number} limit - Montako elokuvaa palautetaan
   * @returns {Promise<Array>} Lista suosituista elokuvista
   */
  async getPopularEvents(limit = 10) {
    try {
      const events = await this.getEvents({ listType: 'NowInTheatres' });
      
      // Järjestä elokuvat (tässä esimerkissä vain rajoita määrää)
      // Oikeassa toteutuksessa voisi järjestää esim. näytösten määrän mukaan
      // Palataan tähän, kun Frontti on valmis.
      return events.slice(0, limit);
    } catch (error) {
      throw new Error(`Failed to get popular events: ${error.message}`);
    }
  }

  /**
   * Hae tulevat elokuvat
   * @returns {Promise<Array>} Lista tulevista elokuvista
  * Palataan tähän, kun Frontti on valmis. 
  */
  async getComingSoonEvents() {
    try {
      return await this.getEvents({ listType: 'ComingSoon' });
    } catch (error) {
      throw new Error(`Failed to get coming soon events: ${error.message}`);
    }
  }
}

export default FinnkinoService;
