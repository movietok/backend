import { describe, it, before, after } from 'mocha';
import { expect } from 'chai';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index.js';
import { query } from '../src/config/database.js';

describe('Core Authentication Tests', () => {
    let userToken, testUserId;

    // Test user data
    const testUser = {
        username: 'testuser123',
        email: 'testuser@example.com',
        password: 'TestPassword123!',
        name: 'Test User'
    };

    // Cleanup function to run before and after tests
    const cleanup = async () => {
        try {
            await query('DELETE FROM users WHERE email LIKE $1', ['%@example.com']);
        } catch (error) {
            console.log('Cleanup error:', error.message);
        }
    };

    before(async () => {
        await cleanup();
    });

    after(async () => {
        await cleanup();
    });

    describe('1. Sign In Function (User Registration)', () => {
        it('should register a new user successfully', async () => {
            const response = await request(app)
                .post('/api/users/register')
                .send(testUser)
                .expect(201);

            expect(response.body).to.have.property('success', true);
            expect(response.body).to.have.property('message', 'User registered successfully');
            expect(response.body).to.have.property('user');
            expect(response.body.user).to.have.property('id');
            expect(response.body.user).to.have.property('username', testUser.username);
            expect(response.body.user).to.have.property('email', testUser.email);
            expect(response.body.user).to.not.have.property('password');
            
            testUserId = response.body.user.id;
        });

        it('should not register user with missing required fields', async () => {
            const incompleteUser = {
                username: 'incomplete',
                // missing email and password
            };

            const response = await request(app)
                .post('/api/users/register')
                .send(incompleteUser)
                .expect(400);

            expect(response.body).to.have.property('error');
        });

        it('should not register user with existing email', async () => {
            const duplicateEmailUser = {
                username: 'differentuser',
                email: testUser.email, // Same email as testUser
                password: 'DifferentPassword123!',
                name: 'Different User'
            };

            const response = await request(app)
                .post('/api/users/register')
                .send(duplicateEmailUser)
                .expect(400);

            expect(response.body).to.have.property('error');
        });
    });

    describe('2. Log In Function', () => {
        it('should login successfully with correct credentials', async () => {
            const response = await request(app)
                .post('/api/users/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                })
                .expect(200);

            expect(response.body).to.have.property('success', true);
            expect(response.body).to.have.property('message', 'Login successful');
            expect(response.body).to.have.property('token');
            expect(response.body).to.have.property('user');
            expect(response.body.user).to.have.property('id');
            expect(response.body.user).to.have.property('email', testUser.email);
            expect(response.body.user).to.not.have.property('password');

            userToken = response.body.token;

            // Verify token is valid JWT
            const decoded = jwt.decode(userToken);
            expect(decoded).to.have.property('userId');
            expect(decoded).to.have.property('email', testUser.email);
        });

        it('should not login with incorrect password', async () => {
            const response = await request(app)
                .post('/api/users/login')
                .send({
                    email: testUser.email,
                    password: 'WrongPassword123!'
                })
                .expect(401);

            expect(response.body).to.have.property('error');
        });

        it('should not login with non-existent email', async () => {
            const response = await request(app)
                .post('/api/users/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: testUser.password
                })
                .expect(401);

            expect(response.body).to.have.property('error');
        });

        it('should not login with missing credentials', async () => {
            const response = await request(app)
                .post('/api/users/login')
                .send({})
                .expect(400);

            expect(response.body).to.have.property('error');
        });
    });

    describe('3. Log Out Function (Token Validation)', () => {
        it('should access protected route with valid token', async () => {
            const response = await request(app)
                .get('/api/users/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body).to.have.property('success', true);
            expect(response.body).to.have.property('user');
            expect(response.body.user).to.have.property('email', testUser.email);
            expect(response.body.user).to.not.have.property('password');
        });

        it('should not access protected route without token', async () => {
            const response = await request(app)
                .get('/api/users/profile')
                .expect(401);

            expect(response.body).to.have.property('error');
        });

        it('should not access protected route with invalid token', async () => {
            const response = await request(app)
                .get('/api/users/profile')
                .set('Authorization', 'Bearer invalid_token_here')
                .expect(403);

            expect(response.body).to.have.property('error');
        });

        it('should handle token expiration gracefully', async () => {
            // Create an expired token
            const expiredToken = jwt.sign(
                { userId: testUserId, email: testUser.email },
                process.env.DEV_JWT_SECRET || 'dev_jwt_secret_change_this',
                { expiresIn: '-1h' } // Already expired
            );

            const response = await request(app)
                .get('/api/users/profile')
                .set('Authorization', `Bearer ${expiredToken}`)
                .expect(403);

            expect(response.body).to.have.property('error');
        });
    });

    describe('4. Remove User Function', () => {
        it('should delete own user account with valid token', async () => {
            // First create a user to delete
            const userToDelete = {
                username: 'userToDelete',
                email: 'delete@example.com',
                password: 'DeletePassword123!',
                name: 'User To Delete'
            };

            const registerResponse = await request(app)
                .post('/api/users/register')
                .send(userToDelete)
                .expect(201);

            const loginResponse = await request(app)
                .post('/api/users/login')
                .send({
                    email: userToDelete.email,
                    password: userToDelete.password
                })
                .expect(200);

            const deleteToken = loginResponse.body.token;

            // Now delete the user
            const response = await request(app)
                .delete('/api/users/profile')
                .set('Authorization', `Bearer ${deleteToken}`)
                .expect(200);

            expect(response.body).to.have.property('success', true);
            expect(response.body).to.have.property('message', 'User account deleted successfully');

            // Verify user can no longer login
            await request(app)
                .post('/api/users/login')
                .send({
                    email: userToDelete.email,
                    password: userToDelete.password
                })
                .expect(401);
        });

        it('should not delete user account without authentication token', async () => {
            const response = await request(app)
                .delete('/api/users/profile')
                .expect(401);

            expect(response.body).to.have.property('error');
        });

        it('should not delete user account with invalid token', async () => {
            const response = await request(app)
                .delete('/api/users/profile')
                .set('Authorization', 'Bearer invalid_token')
                .expect(403);

            expect(response.body).to.have.property('error');
        });
    });
});