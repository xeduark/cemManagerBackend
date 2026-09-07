// backend/src/routes/user.routes.ts

import { Router } from 'express';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { UserRole } from '../types/auth.js';

const router = Router();

const onlySuperadmin = [authenticate, authorize(UserRole.SUPERADMIN)];

router.get('/', ...onlySuperadmin, getUsers);           // GET  /api/users
router.post('/', ...onlySuperadmin, createUser);        // POST /api/users
router.put('/:id', ...onlySuperadmin, updateUser);      // PUT  /api/users/:id
router.delete('/:id', ...onlySuperadmin, deleteUser);   // DELETE /api/users/:id

export default router;