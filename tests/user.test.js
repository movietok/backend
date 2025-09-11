import { expect } from 'chai';
import request from 'supertest';
import app from '../index.js';

describe('User API Tests', () => {
  let authToken;
  let testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'testpassword123'
  };

  describe('Health Check', () => {
    it('should return OK status', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);

      expect(res.body).to.have.property('status', 'OK');
      expect(res.body).to.have.property('timestamp');
      expect(res.body).to.have.property('environment');
    });
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send(testUser)
        .expect(201);

      expect(res.body).to.have.property('message', 'User registered successfully');
      expect(res.body.user).to.have.property('username', testUser.username);
      expect(res.body.user).to.have.property('email', testUser.email);
      expect(res.body.user).to.not.have.property('password');
    });

    it('should not register user with missing fields', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({ username: 'testuser2' })
        .expect(400);

      expect(res.body).to.have.property('error');
    });

    it('should not register user with short password', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          username: 'testuser3',
          email: 'test3@example.com',
          password: '123'
        })
        .expect(400);

      expect(res.body).to.have.property('error', 'Password too short');
    });

    it('should not register user with existing email', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send(testUser)
        .expect(400);

      expect(res.body).to.have.property('error', 'Registration failed');
    });
  });

  describe('User Login', () => {
    it('should login successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(res.body).to.have.property('message', 'Login successful');
      expect(res.body).to.have.property('token');
      expect(res.body.user).to.have.property('email', testUser.email);
      
      authToken = res.body.token;
    });

    it('should not login with incorrect credentials', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(res.body).to.have.property('error', 'Authentication failed');
    });

    it('should not login with missing fields', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({ email: testUser.email })
        .expect(400);

      expect(res.body).to.have.property('error', 'Missing credentials');
    });
  });

  describe('Protected Routes', () => {
    it('should get user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.user).to.have.property('email', testUser.email);
      expect(res.body.user).to.not.have.property('password');
    });

    it('should update user profile with valid token', async () => {
      const updateData = { username: 'updateduser' };
      
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(res.body.user).to.have.property('username', 'updateduser');
      expect(res.body).to.have.property('message', 'Profile updated successfully');
    });

    it('should not access profile without token', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(res.body).to.have.property('error', 'Access token required');
    });

    it('should not access profile with invalid token', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(403);

      expect(res.body).to.have.property('error', 'Invalid token');
    });

    it('should get users list with valid token', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).to.have.property('users');
      expect(res.body.users).to.be.an('array');
    });

    it('should get user by ID with valid token', async () => {
      const res = await request(app)
        .get('/api/users/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).to.have.property('user');
      expect(res.body.user).to.have.property('id');
    });
  });

  describe('Pagination', () => {
    it('should respect pagination parameters', async () => {
      const res = await request(app)
        .get('/api/users?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).to.have.property('pagination');
      expect(res.body.pagination).to.have.property('page', 1);
      expect(res.body.pagination).to.have.property('limit', 10);
    });

    it('should reject invalid pagination parameters', async () => {
      const res = await request(app)
        .get('/api/users?page=0&limit=101')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(res.body).to.have.property('error', 'Invalid pagination parameters');
    });
  });
});
