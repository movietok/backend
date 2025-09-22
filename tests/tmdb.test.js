import { expect } from 'chai';
import request from 'supertest';
import app from '../index.js';

describe('TMDB API Tests', () => {
  
  describe('GET /api/tmdb/search', () => {
    it('should search movies successfully', async () => {
      const response = await request(app)
        .get('/api/tmdb/search')
        .query({ q: 'Spider-Man' });
        
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('results');
      expect(response.body.results).to.be.an('array');
    });

    it('should require search query', async () => {
      const response = await request(app)
        .get('/api/tmdb/search');
        
      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('error');
    });

    it('should handle pagination', async () => {
      const response = await request(app)
        .get('/api/tmdb/search')
        .query({ q: 'movie', page: 2 });
        
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
    });

    it('should handle year filter', async () => {
      const response = await request(app)
        .get('/api/tmdb/search')
        .query({ q: 'Avengers', year: 2019 });
        
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
    });
  });

  describe('GET /api/tmdb/:id', () => {
    it('should get movie details by ID', async () => {
      // Using a known movie ID (Avengers: Endgame)
      const movieId = 299534;
      const response = await request(app)
        .get(`/api/tmdb/${movieId}`);
        
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('movie');
      expect(response.body.movie).to.have.property('id', movieId);
    });

    it('should handle invalid movie ID', async () => {
      const response = await request(app)
        .get('/api/tmdb/999999999');
        
      expect(response.status).to.equal(404);
      expect(response.body).to.have.property('error');
    });

    it('should handle non-numeric ID', async () => {
      const response = await request(app)
        .get('/api/tmdb/invalid-id');
        
      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('error');
    });
  });

  describe('Error Handling', () => {
    it('should handle API rate limiting gracefully', async () => {
      // Make multiple rapid requests to test rate limiting
      const promises = Array(5).fill().map(() => 
        request(app).get('/api/tmdb/search').query({ q: 'test' })
      );
      
      const responses = await Promise.all(promises);
      
      // All should either succeed or fail gracefully
      responses.forEach(response => {
        expect([200, 429, 500]).to.include(response.status);
      });
    });

    it('should handle missing API key configuration', async () => {
      // This test assumes TMDB_API_KEY might not be configured
      const originalKey = process.env.TMDB_API_KEY;
      
      // Temporarily remove API key
      delete process.env.TMDB_API_KEY;
      
      try {
        const response = await request(app)
          .get('/api/tmdb/search')
          .query({ q: 'test' });
          
        // Should either work with fallback or return appropriate error
        expect([200, 500, 503]).to.include(response.status);
      } finally {
        // Restore API key
        if (originalKey) {
          process.env.TMDB_API_KEY = originalKey;
        }
      }
    });
  });
});