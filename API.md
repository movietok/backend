# API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Response Format
All responses follow this structure:
```json
{
  "message": "Success message",
  "data": { /* Response data */ },
  "error": "Error message (if applicable)"
}
```

## Endpoints

### Health Check
- **GET** `/health`
- **Description**: Check server health status
- **Auth**: None required

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-09-11T10:30:00.000Z",
  "environment": "development"
}
```

---

### User Registration
- **POST** `/api/users/register`
- **Description**: Register a new user
- **Auth**: None required

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "created_at": "2025-09-11T10:30:00.000Z",
    "updated_at": "2025-09-11T10:30:00.000Z"
  }
}
```

---

### User Login
- **POST** `/api/users/login`
- **Description**: Login user and get JWT token
- **Auth**: None required

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "created_at": "2025-09-11T10:30:00.000Z",
    "updated_at": "2025-09-11T10:30:00.000Z"
  }
}
```

---

### Get User Profile
- **GET** `/api/users/profile`
- **Description**: Get current user's profile
- **Auth**: Required

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "created_at": "2025-09-11T10:30:00.000Z",
    "updated_at": "2025-09-11T10:30:00.000Z"
  }
}
```

---

### Update User Profile
- **PUT** `/api/users/profile`
- **Description**: Update current user's profile
- **Auth**: Required

**Request Body (all fields optional):**
```json
{
  "username": "newusername",
  "email": "newemail@example.com",
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "username": "newusername",
    "email": "newemail@example.com",
    "created_at": "2025-09-11T10:30:00.000Z",
    "updated_at": "2025-09-11T10:35:00.000Z"
  }
}
```

---

### Delete User Profile
- **DELETE** `/api/users/profile`
- **Description**: Delete current user's account
- **Auth**: Required

**Response (200):**
```json
{
  "message": "User account deleted successfully"
}
```

---

### Get All Users
- **GET** `/api/users`
- **Description**: Get all users with pagination
- **Auth**: Required
- **Query Parameters**:
  - `page` (number, default: 1)
  - `limit` (number, default: 50, max: 100)

**Example:** `/api/users?page=1&limit=10`

**Response (200):**
```json
{
  "users": [
    {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "created_at": "2025-09-11T10:30:00.000Z",
      "updated_at": "2025-09-11T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1
  }
}
```

---

### Get User by ID
- **GET** `/api/users/:id`
- **Description**: Get specific user by ID
- **Auth**: Required

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "created_at": "2025-09-11T10:30:00.000Z",
    "updated_at": "2025-09-11T10:30:00.000Z"
  }
}
```

---

### Delete User by ID
- **DELETE** `/api/users/:id`
- **Description**: Delete specific user by ID (admin function)
- **Auth**: Required

**Response (200):**
```json
{
  "message": "User deleted successfully"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error",
  "message": "Email and password are required"
}
```

### 401 Unauthorized
```json
{
  "error": "Access token required",
  "message": "Please provide a valid authentication token"
}
```

### 403 Forbidden
```json
{
  "error": "Invalid token",
  "message": "The provided token is invalid"
}
```

### 404 Not Found
```json
{
  "error": "User not found",
  "message": "The requested user does not exist"
}
```

### 409 Conflict
```json
{
  "error": "Registration failed",
  "message": "User with this email already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

## Rate Limiting
Currently no rate limiting is implemented, but it's recommended for production use.

## API Versioning
The API supports versioning through the URL path:
- Current version: `/api/v1/users`
- Legacy support: `/api/users`
