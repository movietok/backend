import request from 'supertest';
import { expect } from 'chai';
import app from '../index.js';
import pool from '../src/config/database.js';

describe('Review API Tests', () => {
  let authToken;
  let userId;
  let testMovieId = 'test-movie-123';
  let reviewId; // Add reviewId at the top level scope

  before(async () => {
    // Create a test user and get auth token
    const uniqueEmail = `reviewtest_${Date.now()}@test.com`;
    const uniqueUsername = `reviewtester_${Date.now()}`;
    
    const userResponse = await request(app)
      .post('/api/users/register')
      .send({
        username: uniqueUsername,
        email: uniqueEmail,
        password: 'testpassword123',
        real_name: 'Review Tester'
      });

    console.log('User registration response:', userResponse.status, userResponse.body);
    expect(userResponse.status).to.equal(201);
    userId = userResponse.body.user.id;

    const loginResponse = await request(app)
      .post('/api/users/login')
      .send({
        email: uniqueEmail,
        password: 'testpassword123'
      });

    console.log('Login response:', loginResponse.status, loginResponse.body);
    expect(loginResponse.status).to.equal(200);
    authToken = loginResponse.body.token;
  });

  after(async () => {
    // Clean up test data
    try {
      await pool.query('DELETE FROM interactions WHERE user_id = $1', [userId]);
      await pool.query('DELETE FROM reviews WHERE user_id = $1', [userId]);
      await pool.query('DELETE FROM users WHERE id = $1', [userId]);
      await pool.query('DELETE FROM movies WHERE id = $1', [testMovieId]);
    } catch (error) {
      console.log('Cleanup error:', error.message);
    }
    // Don't end the pool here as it's shared across tests
  });

  describe('POST /api/reviews', () => {
    it('should create a new review', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          movieId: testMovieId,
          rating: 4,
          comment: 'Great movie!'
        });

      expect(response.status).to.equal(201);
      expect(response.body.status).to.equal('success');
      expect(response.body.data.review).to.have.property('id');
      expect(response.body.data.review.rating).to.equal(4);
      expect(response.body.data.review.content).to.equal('Great movie!');
      
      // Store the reviewId for later tests
      reviewId = response.body.data.review.id;
    });

    it('should not allow duplicate reviews', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          movieId: testMovieId,
          rating: 3,
          comment: 'Another review'
        });

      expect(response.status).to.equal(409);
      expect(response.body.message).to.include('already reviewed');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .send({
          movieId: 'another-movie',
          rating: 4,
          comment: 'Test review'
        });

      expect(response.status).to.equal(401);
    });

    it('should validate rating range', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          movieId: 'another-movie',
          rating: 6,
          comment: 'Invalid rating'
        });

      expect(response.status).to.equal(400);
      expect(response.body.message).to.include('between 1 and 5');
    });
  });

  describe('GET /api/reviews/movie/:movieId', () => {
    it('should get all reviews for a movie', async () => {
      const response = await request(app)
        .get(`/api/reviews/movie/${testMovieId}`);

      expect(response.status).to.equal(200);
      expect(response.body.status).to.equal('success');
      expect(response.body.data.reviews).to.be.an('array');
      expect(response.body.data.reviews.length).to.be.greaterThan(0);
      expect(response.body.data.pagination).to.have.property('total');
      expect(response.body.data.stats).to.have.property('averageRating');
    });
  });

  describe('GET /api/reviews/user/:userId', () => {
    it('should get all reviews by a user', async () => {
      const response = await request(app)
        .get(`/api/reviews/user/${userId}`);

      expect(response.status).to.equal(200);
      expect(response.body.status).to.equal('success');
      expect(response.body.data.reviews).to.be.an('array');
      expect(response.body.data.reviews.length).to.be.greaterThan(0);
    });
  });

  describe('PUT /api/reviews/:id', () => {
    let reviewId;

    before(async () => {
      // Get the review ID
      const response = await request(app)
        .get(`/api/reviews/user/${userId}`);
      reviewId = response.body.data.reviews[0].id;
    });

    it('should update a review', async () => {
      const response = await request(app)
        .put(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 5,
          comment: 'Updated: Amazing movie!'
        });

      expect(response.status).to.equal(200);
      expect(response.body.status).to.equal('success');
      expect(response.body.data.review.rating).to.equal(5);
      expect(response.body.data.review.content).to.equal('Updated: Amazing movie!');
    });

    it('should not allow updating others reviews', async () => {
      // Create another user
      const uniqueEmail2 = `another_${Date.now()}@test.com`;
      const uniqueUsername2 = `anotheruser_${Date.now()}`;
      
      const anotherUser = await request(app)
        .post('/api/users/register')
        .send({
          username: uniqueUsername2,
          email: uniqueEmail2,
          password: 'password123',
          real_name: 'Another User'
        });

      const anotherLogin = await request(app)
        .post('/api/users/login')
        .send({
          email: uniqueEmail2,
          password: 'password123'
        });

      const response = await request(app)
        .put(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${anotherLogin.body.token}`)
        .send({
          rating: 1,
          comment: 'Hacked review'
        });

      expect(response.status).to.equal(403);
      expect(response.body.message).to.include('Not authorized');

      // Cleanup
      await pool.query('DELETE FROM users WHERE id = $1', [anotherUser.body.user.id]);
    });
  });

  describe('POST /api/reviews/:id/interaction', () => {
    before(async () => {
      // Ensure we have a review ID from the previous test
      if (!reviewId) {
        const response = await request(app)
          .get(`/api/reviews/user/${userId}`);
        reviewId = response.body.data.reviews[0].id;
      }
    });

    it('should not allow liking own review', async () => {
      const response = await request(app)
        .post(`/api/reviews/${reviewId}/interaction`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'like'
        });

      expect(response.status).to.equal(400);
      expect(response.body.message).to.include('own review');
    });
  });

  describe('GET /api/reviews/:id', () => {
    it('should get a specific review by ID', async () => {
      const response = await request(app)
        .get(`/api/reviews/${reviewId}`)
        .expect(200);

      expect(response.body).to.have.property('status', 'success');
      expect(response.body).to.have.property('data');
      expect(response.body.data.review).to.have.property('id', reviewId);
      expect(response.body.data.review).to.have.property('content', 'Great movie!');
    });

    it('should return 404 for non-existent review', async () => {
      const response = await request(app)
        .get('/api/reviews/99999')
        .expect(404);

      expect(response.body).to.have.property('status', 'error');
      expect(response.body).to.have.property('message', 'Review not found');
    });

    it('should return 400 for invalid review ID', async () => {
      const response = await request(app)
        .get('/api/reviews/invalid-id')
        .expect(400);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('error');
    });
  });

  describe('DELETE /api/reviews/:id', () => {
    let deleteReviewId;

    beforeEach(async () => {
      // Create a review for deletion testing
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          movie_id: 'delete-test-movie',
          content: 'Review to be deleted',
          rating: 3
        })
        .expect(201);

      deleteReviewId = response.body.review.id;
    });

    it('should delete own review successfully', async () => {
      const response = await request(app)
        .delete(`/api/reviews/${deleteReviewId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', 'Review deleted successfully');

      // Verify review is deleted
      await request(app)
        .get(`/api/reviews/${deleteReviewId}`)
        .expect(404);
    });

    it('should not delete review without authentication', async () => {
      const response = await request(app)
        .delete(`/api/reviews/${deleteReviewId}`)
        .expect(401);

      expect(response.body).to.have.property('error', 'No token provided');
    });

    it('should not delete other users review', async () => {
      // Create another user and review
      const otherUser = {
        username: 'otheruser2',
        email: 'other2@test.com',
        password: 'password123'
      };

      await request(app)
        .post('/api/users/register')
        .send(otherUser);

      const loginResponse = await request(app)
        .post('/api/users/login')
        .send({ email: otherUser.email, password: otherUser.password });

      const otherToken = loginResponse.body.token;

      const response = await request(app)
        .delete(`/api/reviews/${deleteReviewId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('delete');
    });

    it('should return 404 for non-existent review deletion', async () => {
      const response = await request(app)
        .delete('/api/reviews/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('error', 'Review not found');
    });
  });
});
