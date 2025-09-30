import logger from '#src/config/logger.js';
import { getAllUsers, getUserById as svcGetById, updateUser as svcUpdateUser, deleteUser as svcDeleteUser } from '#services/users.service.js';
import { userIdSchema, updateUserSchema } from '#validations/users.validation.js';
import { formatValidationError } from '#utils/format.js';


export const fetchAllUsers = async (req, res, next) => {
  try {
    logger.info('Getting users ...');
    const allUsers = await getAllUsers;
    res.json({
      message: 'Successfully retrieved users',
      users: allUsers,
      count: allUsers.length,
    });
  } catch (e) {
    logger.error(e);
    next(e);
  }
};

// GET /api/users/:id
export const getUserById = async (req, res, next) => {
  try {
    const paramsValidation = userIdSchema.safeParse(req.params);
    if (!paramsValidation.success) {
      return res.status(400).json({
        error: 'Validation failed.',
        details: formatValidationError(paramsValidation.error),
      });
    }
    const { id } = paramsValidation.data;

    const user = await svcGetById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info(`Fetched user by id ${id}`);
    return res.status(200).json({ user });
  } catch (e) {
    logger.error('Get user by id error', e);
    return next(e);
  }
};

// PATCH /api/users/:id
export const updateUser = async (req, res, next) => {
  try {
    const paramsValidation = userIdSchema.safeParse(req.params);
    if (!paramsValidation.success) {
      return res.status(400).json({
        error: 'Validation failed.',
        details: formatValidationError(paramsValidation.error),
      });
    }
    const bodyValidation = updateUserSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      return res.status(400).json({
        error: 'Validation failed.',
        details: formatValidationError(bodyValidation.error),
      });
    }

    const { id } = paramsValidation.data;
    const updates = bodyValidation.data;

    // Authorization: must be authenticated
    const requester = req.user;
    if (!requester) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Non-admins can only update their own profile
    const isSelf = Number(requester.id) === Number(id);
    const isAdmin = requester.role === 'admin';
    if (!isAdmin && !isSelf) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Only admins may change the role
    if (!isAdmin && Object.prototype.hasOwnProperty.call(updates, 'role')) {
      return res.status(403).json({ error: 'Forbidden: cannot change role' });
    }

    // Proceed with update
    const updated = await svcUpdateUser(id, updates);

    logger.info(`Updated user ${id} by ${requester.email || requester.id}`);
    return res.status(200).json({ user: updated });
  } catch (e) {
    if (e?.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ error: 'User not found' });
    }
    if (e?.message === 'EMAIL_TAKEN') {
      return res.status(409).json({ error: 'Email already exist' });
    }
    logger.error('Update user error', e);
    return next(e);
  }
};

// DELETE /api/users/:id
export const deleteUser = async (req, res, next) => {
  try {
    const paramsValidation = userIdSchema.safeParse(req.params);
    if (!paramsValidation.success) {
      return res.status(400).json({
        error: 'Validation failed.',
        details: formatValidationError(paramsValidation.error),
      });
    }

    const { id } = paramsValidation.data;

    // Authorization
    const requester = req.user;
    if (!requester) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const isSelf = Number(requester.id) === Number(id);
    const isAdmin = requester.role === 'admin';
    if (!isAdmin && !isSelf) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const deleted = await svcDeleteUser(id);
    logger.info(`Deleted user ${id} by ${requester.email || requester.id}`);
    return res.status(200).json({ message: 'User deleted.', user: deleted });
  } catch (e) {
    if (e?.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ error: 'User not found' });
    }
    logger.error('Delete user error', e);
    return next(e);
  }
};
