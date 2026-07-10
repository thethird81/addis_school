# Authentication & Authorization Middleware Usage Examples

## Overview
This document demonstrates how to use the refactored two-stage middleware strategy:
- **Stage 1 - Authentication**: `authMiddleware` - Verifies JWT and identifies the user
- **Stage 2 - Authorization**: `restrictTo(...roles)` - Checks user role permissions

## Import Statements

```javascript
import express from "express";
import { authMiddleware, restrictTo } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js"; // Legacy - can be replaced
```

## Route Pattern 1: User Routes (Authentication Only)

Use only `authMiddleware` for routes where any authenticated user should have access.

```javascript
const router = express.Router();

// All routes in this file require authentication
router.use(authMiddleware);

// User-specific routes
router.get("/profile", getUserProfile);
router.put("/profile", updateUserProfile);
router.post("/settings", updateSettings);

export default router;
```

**Example - Individual Route Protection:**
```javascript
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public route
router.get("/public", getPublicContent);

// Protected route - requires authentication
router.get("/protected", authMiddleware, getProtectedContent);

// Multiple protected routes
router.use(authMiddleware, getUserMiddleware);

router.get("/dashboard", getUserDashboard);
router.get("/settings", getUserSettings);

export default router;
```

## Route Pattern 2: Admin Routes (Authentication + Authorization)

Use the chained middleware `authMiddleware, restrictTo('admin')` instead of the legacy `adminMiddleware`.

### New Approach (Recommended)

```javascript
import express from "express";
import { authMiddleware, restrictTo } from "../middleware/authMiddleware.js";
import { 
  createGrade,
  updateGrade,
  deleteGrade,
  getAllUsers
} from "../controllers/adminController.js";

const router = express.Router();

// All routes in this file require authentication + admin role
router.use(authMiddleware, restrictTo('admin'));

// Now all below routes are protected
router.post("/grades", createGrade);
router.put("/grades/:id", updateGrade);
router.delete("/grades/:id", deleteGrade);
router.get("/users", getAllUsers);

export default router;
```

### Legacy Approach (Still Works - But Can Be Replaced)

```javascript
// OLD WAY (still works but less flexible)
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";

router.use(authMiddleware, adminMiddleware); // Requires database query
```

**Benefits of new approach:**
- No database query needed (role is in JWT)
- More flexible (supports multiple roles)
- Cleaner code
- Better performance

## Route Pattern 3: Multiple Role Support

Use `restrictTo` with multiple roles for endpoints accessible by different user types.

```javascript
import express from "express";
import { authMiddleware, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

// Moderators and admins can access these routes
router.use(authMiddleware, restrictTo('admin', 'moderator'));

router.get("/reports", getAllReports);
router.put("/reports/:id", resolveReport);

// Teachers and admins can access these
router.use(authMiddleware, restrictTo('teacher', 'admin'));

router.get("/classes", getClasses);
router.post("/classes", createClass);

export default router;
```

## Route Pattern 4: Mixed Access Levels

Combine authenticated and role-restricted routes in the same router.

```javascript
import express from "express";
import { authMiddleware, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getPublicContent);
router.get("/about", getAboutPage);

// Any authenticated user
router.use(authMiddleware);

router.get("/dashboard", getUserDashboard);
router.get("/profile", getUserProfile);

// Admin-only routes
router.use(restrictTo('admin'));

router.get("/admin-panel", getAdminPanel);
router.get("/users", getAllUsers);

// Super admin routes (most restrictive)
router.use(restrictTo('superadmin'));

router.delete("/system", deleteSystemData);

export default router;
```

## Route Pattern 5: Per-Route Middleware (Granular Control)

Apply middleware to individual routes for maximum flexibility.

```javascript
import express from "express";
import { authMiddleware, restrictTo } from "../middleware/authMiddleware.js";
import { getAllContents, createContent } from "../controllers/contentController.js";
import { deleteAnyContent } from "../controllers/adminController.js";

const router = express.Router();

// Public route
router.get("/", getAllContents);

// Authenticated users can create content
router.post("/", authMiddleware, createContent);

// Only admins can delete any content
router.delete("/:id", authMiddleware, restrictTo('admin'), deleteAnyContent);

export default router;
```

## Migration Guide: From adminMiddleware to restrictTo

### Before (Old Pattern):
```javascript
import { adminMiddleware } from "../middleware/adminMiddleware.js";

const router = express.Router();
router.use(authMiddleware, adminMiddleware);

router.get("/grades", getGrades);
router.post("/grades", createGrade);
// ... more routes
```

### After (New Pattern):
```javascript
import { restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(authMiddleware, restrictTo('admin'));

router.get("/grades", getGrades);
router.post("/grades", createGrade);
// ... same routes, no changes needed
```

**What Changed:**
- Removed database query for role check (faster)
- Role is validated from JWT token
- More flexible (easy to add new roles like 'superadmin', 'moderator')
- Consistent error responses

## Middleware Execution Order

Always apply middlewares in this order:
1. `authMiddleware` FIRST (verifies JWT)
2. `restrictTo(...)` SECOND (checks role)

```javascript
// CORRECT ORDER
router.use(authMiddleware, restrictTo('admin'));

// WRONG ORDER - restrictTo needs req.user which is set by authMiddleware
router.use(restrictTo('admin'), authMiddleware); // ❌ Won't work!
```

## JWT Token Structure

After refactoring, your JWT tokens now use the standard `sub` claim:

**Access Token Payload:**
```json
{
  "sub": "user-id-here",
  "role": "admin",
  "iat": 1234567890,
  "exp": 1234567890
}
```

**Refresh Token Payload:**
```json
{
  "sub": "user-id-here",
  "iat": 1234567890,
  "exp": 1234567890
}
```

## Error Responses

### Authentication Errors (401 Unauthorized)
```json
{
  "error": "Unauthorized - No accessToken"
}
```
```json
{
  "error": "Invalid accessToken"
}
```

### Authorization Errors (403 Forbidden)
```json
{
  "error": "Forbidden - Insufficient permissions",
  "requiredRoles": ["admin"],
  "userRole": "user"
}
```

## Complete Example - Admin Routes

Here's how the adminRoutes.js file should look after migration:

```javascript
import express from "express";
import {
  getGrades,
  createGrade,
  updateGrade,
  deleteGrade,
  getSubjectsByGrade,
  createSubject,
  // ... all admin controller functions
} from "../controllers/adminController.js";
import { authMiddleware, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

// All admin routes require authentication + admin role
router.use(authMiddleware, restrictTo('admin'));

// Tree
router.get("/tree", getFullTree);

// Grades
router.get("/grades", getGrades);
router.post("/grades", createGrade);
router.put("/grades/:id", updateGrade);
router.delete("/grades/:id", deleteGrade);

// ... rest of the routes remain unchanged

export default router;
```

## Best Practices

1. **Always validate tokens**: Never skip `authMiddleware` for protected routes
2. **Use least privilege**: Apply `restrictTo` at the router level when all routes need the same role
3. **Be specific**: Use per-route middleware when only specific routes need role restrictions
4. **Order matters**: Always `authMiddleware` before `restrictTo`
5. **Use standard roles**: Consider defining roles as constants/enums for consistency
   ```javascript
   const ROLES = {
     USER: 'user',
     TEACHER: 'teacher',
     MODERATOR: 'moderator',
     ADMIN: 'admin',
     SUPERADMIN: 'superadmin'
   };
   
   router.use(restrictTo(ROLES.ADMIN, ROLES.SUPERADMIN));
   ```

## Testing the Middleware

1. **Test authenticated access:**
   ```bash
   curl -H "Authorization: Bearer <valid-token>" http://localhost:3000/api/admin/grades
   ```

2. **Test unauthenticated access:**
   ```bash
   curl http://localhost:3000/api/admin/grades
   # Expected: 401 Unauthorized
   ```

3. **Test unauthorized role:**
   ```bash
   curl -H "Authorization: Bearer <user-token>" http://localhost:3000/api/admin/grades
   # Expected: 403 Forbidden
   ```

4. **Test authorized access:**
   ```bash
   curl -H "Authorization: Bearer <admin-token>" http://localhost:3000/api/admin/grades
   # Expected: 200 OK with data