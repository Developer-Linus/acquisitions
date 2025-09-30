import express from 'express';
import { fetchAllUsers, getUserById, updateUser, deleteUser } from '#controllers/users.controller.js';
import { requireAuth, requireRole, requireSelfOrRole } from '#middlewares/auth.middleware.js';

const router = express.Router();

// List all users (admin only)
router.get('/', requireAuth, requireRole('admin'), fetchAllUsers);

// Get a user by id (self or admin)
router.get('/:id', requireAuth, requireSelfOrRole('id', ['admin']), getUserById);

// Update a user (self or admin)
router.put('/:id', requireAuth, requireSelfOrRole('id', ['admin']), updateUser);

// Delete a user (self or admin)
router.delete('/:id', requireAuth, requireSelfOrRole('id', ['admin']), deleteUser);

export default router;
