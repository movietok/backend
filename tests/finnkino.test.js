import { expect } from 'chai';
import request from 'supertest';
import app from '../index.js';

describe('Finnkino API Tests', () => {
  
  describe('Health Check for Finnkino Integration', () => {
    it('should return OK status', async () => {
      const res = await request(app)
        .get('/api/health')
        .expect(200);

      expect(res.body).to.have.property('status', 'OK');
      expect(res.body).to.have.property('timestamp');
    });
  });

  describe('Theatre Areas', () => {
    it('should get theatre areas list', async () => {
      const res = await request(app)
        .get('/api/finnkino/theatres')
        .expect(200);

      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('theatreAreas');
      expect(res.body.theatreAreas).to.be.an('array');
      
      if (res.body.theatreAreas.length > 0) {
        expect(res.body.theatreAreas[0]).to.have.property('id');
        expect(res.body.theatreAreas[0]).to.have.property('name');
      }
    }).timeout(10000); // 10 second timeout for external API call
  });

  describe('Events', () => {
    it('should get now showing events', async () => {
      const res = await request(app)
        .get('/api/finnkino/events')
        .expect(200);

      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('events');
      expect(res.body.events).to.be.an('array');
      expect(res.body).to.have.property('listType', 'NowInTheatres');
      
      if (res.body.events.length > 0) {
        const event = res.body.events[0];
        expect(event).to.have.property('id');
        expect(event).to.have.property('title');
        expect(event).to.have.property('originalTitle');
      }
    }).timeout(10000);

    it('should get coming soon events', async () => {
      const res = await request(app)
        .get('/api/finnkino/events?listType=ComingSoon')
        .expect(200);

      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('listType', 'ComingSoon');
      expect(res.body.events).to.be.an('array');
    }).timeout(10000);

    it('should get events with specific area', async () => {
      const res = await request(app)
        .get('/api/finnkino/events?area=1014') // Pääkaupunkiseutu
        .expect(200);

      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('area', '1014');
      expect(res.body.events).to.be.an('array');
    }).timeout(10000);
  });

  describe('Schedule', () => {
    it('should get schedule for today', async () => {
      const res = await request(app)
        .get('/api/finnkino/schedule')
        .expect(200);

      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('schedule');
      expect(res.body.schedule).to.be.an('array');
      expect(res.body).to.have.property('area', '1014'); // Default area
      expect(res.body).to.have.property('days', 1);
      
      if (res.body.schedule.length > 0) {
        const show = res.body.schedule[0];
        expect(show).to.have.property('id');
        expect(show).to.have.property('eventId');
        expect(show).to.have.property('title');
        expect(show).to.have.property('showStart');
        expect(show).to.have.property('theatre');
      }
    }).timeout(10000);

    it('should get schedule for multiple days', async () => {
      const res = await request(app)
        .get('/api/finnkino/schedule?nrOfDays=3')
        .expect(200);

      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('days', 3);
      expect(res.body.schedule).to.be.an('array');
    }).timeout(10000);

    it('should validate nrOfDays parameter', async () => {
      const res = await request(app)
        .get('/api/finnkino/schedule?nrOfDays=50')
        .expect(400);

      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('error', 'Invalid nrOfDays parameter');
    });

    it('should validate date format', async () => {
      const res = await request(app)
        .get('/api/finnkino/schedule?dt=invalid-date')
        .expect(400);

      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('error', 'Invalid date format');
    });
  });

  describe('Search', () => {
    it('should search events by title', async () => {
      const res = await request(app)
        .get('/api/finnkino/search?q=katu') // Common word in Finnish movie titles
        .expect(200);

      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('query', 'katu');
      expect(res.body).to.have.property('events');
      expect(res.body.events).to.be.an('array');
    }).timeout(10000);

    it('should require search query', async () => {
      const res = await request(app)
        .get('/api/finnkino/search')
        .expect(400);

      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('error', 'Missing search query');
    });

    it('should validate listType parameter', async () => {
      const res = await request(app)
        .get('/api/finnkino/search?q=test&listType=InvalidType')
        .expect(400);

      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('error', 'Invalid list type');
    });
  });

  describe('Popular Events', () => {
    it('should get popular events with default limit', async () => {
      const res = await request(app)
        .get('/api/finnkino/popular')
        .expect(200);

      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('limit', 10);
      expect(res.body.events).to.be.an('array');
      expect(res.body.events.length).to.be.at.most(10);
    }).timeout(10000);

    it('should get popular events with custom limit', async () => {
      const res = await request(app)
        .get('/api/finnkino/popular?limit=5')
        .expect(200);

      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('limit', 5);
      expect(res.body.events.length).to.be.at.most(5);
    }).timeout(10000);

    it('should validate limit parameter', async () => {
      const res = await request(app)
        .get('/api/finnkino/popular?limit=100')
        .expect(400);

      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('error', 'Invalid limit parameter');
    });
  });

  describe('Convenience Routes', () => {
    it('should get coming soon events via convenience route', async () => {
      const res = await request(app)
        .get('/api/finnkino/coming-soon')
        .expect(200);

      expect(res.body).to.have.property('success', true);
      expect(res.body.events).to.be.an('array');
    }).timeout(10000);

    it('should get now showing events via convenience route', async () => {
      const res = await request(app)
        .get('/api/finnkino/now-showing')
        .expect(200);

      expect(res.body).to.have.property('success', true);
      expect(res.body.events).to.be.an('array');
    }).timeout(10000);
  });

  describe('Event Details', () => {
    let eventId;

    before(async function() {
      this.timeout(10000);
      // Get an event ID for testing
      const res = await request(app).get('/api/finnkino/events');
      if (res.body.events && res.body.events.length > 0) {
        eventId = res.body.events[0].id;
      }
    });

    it('should get event by ID', async function() {
      if (!eventId) {
        this.skip();
        return;
      }

      const res = await request(app)
        .get(`/api/finnkino/events/${eventId}`)
        .expect(200);

      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('event');
      expect(res.body.event).to.have.property('id', eventId);
    }).timeout(10000);

    it('should get event schedule by ID', async function() {
      if (!eventId) {
        this.skip();
        return;
      }

      const res = await request(app)
        .get(`/api/finnkino/events/${eventId}/schedule`)
        .expect(200);

      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('eventId', eventId);
      expect(res.body).to.have.property('schedule');
      expect(res.body.schedule).to.be.an('array');
    }).timeout(10000);

    it('should handle non-existent event ID', async () => {
      const res = await request(app)
        .get('/api/finnkino/events/999999')
        .expect(404);

      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('error', 'Event not found');
    }).timeout(10000);
  });

  describe('Error Handling', () => {
    it('should handle missing event ID in params', async () => {
      const res = await request(app)
        .get('/api/finnkino/events/')
        .expect(200); // This will hit the events list endpoint

      expect(res.body).to.have.property('success', true);
    });
  });
});

describe('API Rate Limiting and Performance', () => {
  it('should handle multiple concurrent requests', async () => {
    const promises = Array(3).fill().map(() => 
      request(app).get('/api/finnkino/theatres')
    );

    const results = await Promise.all(promises);
    
    results.forEach(res => {
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
    });
  }).timeout(15000);
});
