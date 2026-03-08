# Authentication Middleware

This directory contains middleware for the ContentOS backend, including JWT authentication.

## JWT Authentication Middleware

The `authMiddleware` protects routes by verifying JWT tokens and attaching user context to requests.

### Features

- ✅ Verifies JWT tokens on protected endpoints
- ✅ Checks token expiration automatically
- ✅ Attaches user context (userId and user object) to requests
- ✅ Returns consistent error responses for authentication failures

### Usage

#### Basic Usage

```typescript
import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Protected route - requires authentication
router.get('/profile', authMiddleware, (req: AuthRequest, res) => {
  // Access user information from the request
  const userId = req.userId;
  const userEmail = req.user?.email;
  
  res.json({
    message: 'User profile',
    userId,
    email: userEmail,
  });
});

export default router;
```

#### Protecting Multiple Routes

```typescript
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Apply middleware to all routes in this router
router.use(authMiddleware);

// All routes below are now protected
router.get('/projects', (req: AuthRequest, res) => {
  // req.userId is available
});

router.post('/projects', (req: AuthRequest, res) => {
  // req.userId is available
});

export default router;
```

#### Mixed Public and Protected Routes

```typescript
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Public route - no authentication required
router.get('/public-info', (req, res) => {
  res.json({ message: 'Public data' });
});

// Protected route - authentication required
router.get('/private-info', authMiddleware, (req: AuthRequest, res) => {
  res.json({ 
    message: 'Private data',
    userId: req.userId 
  });
});

export default router;
```

### Request Object Extensions

The middleware extends the Express Request object with:

```typescript
interface AuthRequest extends Request {
  userId?: string;           // The authenticated user's ID
  user?: {                   // The authenticated user's basic info
    id: string;
    email: string;
  };
}
```

### Error Responses

The middleware returns consistent error responses:

#### Missing Token (401)
```json
{
  "error": {
    "code": "MISSING_TOKEN",
    "message": "Authentication required. Please log in.",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Invalid or Expired Token (401)
```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Your session has expired. Please log in again.",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### Client Usage

Clients should include the JWT token in the Authorization header:

```
Authorization: Bearer <jwt-token>
```

Example with fetch:
```javascript
fetch('/api/protected-route', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

Example with axios:
```javascript
axios.get('/api/protected-route', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

### Token Generation

Tokens are generated during login and registration using the `generateToken` utility:

```typescript
import { generateToken } from '../utils/jwt';

const token = generateToken({
  userId: user.id,
  email: user.email,
});
```

### Configuration

JWT settings are configured in `src/config/index.ts`:

- `JWT_SECRET`: Secret key for signing tokens (required in production)
- `JWT_EXPIRES_IN`: Token expiration time (default: '7d')

### Testing

The middleware includes comprehensive unit and integration tests:

- `auth.test.ts`: Unit tests for middleware logic
- `auth.integration.test.ts`: Integration tests with Express routes

Run tests:
```bash
npm test -- auth.test.ts
npm test -- auth.integration.test.ts
```

### Security Considerations

1. **Always use HTTPS in production** to prevent token interception
2. **Set a strong JWT_SECRET** in production (not the default)
3. **Use appropriate token expiration times** based on your security requirements
4. **Tokens are stateless** - revocation requires additional infrastructure (e.g., token blacklist)
5. **Store tokens securely on the client** (e.g., httpOnly cookies or secure storage)

### Requirements Validation

This middleware validates **Requirement 1.5**:
- ✅ Verifies JWT tokens on protected endpoints
- ✅ Checks token expiration
- ✅ Attaches user context to requests
