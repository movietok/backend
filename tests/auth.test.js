import { expect } from 'chai';
import jwt from 'jsonwebtoken';

describe('JWT Token Tests', () => {
  const testSecret = 'test_secret';
  const testPayload = { 
    id: 1, 
    username: 'testuser', 
    email: 'test@example.com' 
  };

  it('should generate a valid JWT token', () => {
    const token = jwt.sign(testPayload, testSecret, { expiresIn: '1h' });
    expect(token).to.be.a('string');
    expect(token.split('.')).to.have.lengthOf(3);
  });

  it('should verify a valid JWT token', () => {
    const token = jwt.sign(testPayload, testSecret, { expiresIn: '1h' });
    const decoded = jwt.verify(token, testSecret);
    
    expect(decoded.id).to.equal(testPayload.id);
    expect(decoded.username).to.equal(testPayload.username);
    expect(decoded.email).to.equal(testPayload.email);
  });

  it('should throw error for invalid token', () => {
    expect(() => {
      jwt.verify('invalid.token.here', testSecret);
    }).to.throw();
  });

  it('should throw error for expired token', () => {
    const expiredToken = jwt.sign(testPayload, testSecret, { expiresIn: '-1h' });
    
    expect(() => {
      jwt.verify(expiredToken, testSecret);
    }).to.throw();
  });

  it('should include expiration time in token', () => {
    const token = jwt.sign(testPayload, testSecret, { expiresIn: '24h' });
    const decoded = jwt.verify(token, testSecret);
    
    expect(decoded).to.have.property('exp');
    expect(decoded).to.have.property('iat');
  });
});
