import logger from '#config/logger.js';
import { db } from '#config/database.js';
import { users } from '#models/user.model.js';
import { eq } from 'drizzle-orm';

// Return only safe fields (exclude password)
const userSelect = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  created_at: users.created_at,
  updated_at: users.updated_at,
};

export const getAllUsers = async () => {
  try {
    return await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      })
      .from(users);
  } catch (e) {
    logger.error('Error getting users', e);
    throw new Error('Error getting users');
  }
};

export const getUserById = async id => {
  try {
    const [row] = await db
      .select(userSelect)
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return row;
  } catch (e) {
    logger.error(`Error fetching user by id (${id}): ${e}`);
    throw e;
  }
};

export const updateUser = async (id, updates) => {
  try {
    // Ensure the user exists first
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!existing) {
      throw new Error('USER_NOT_FOUND');
    }

    // Allow only specific fields to be updated
    const allowed = ['name', 'email', 'role'];
    const payload = Object.fromEntries(
      Object.entries(updates || {}).filter(
        ([k, v]) => allowed.includes(k) && v !== undefined
      )
    );

    if (Object.keys(payload).length === 0) {
      throw new Error('NOTHING_TO_UPDATE');
    }

    const [updated] = await db
      .update(users)
      .set(payload)
      .where(eq(users.id, id))
      .returning(userSelect);

    logger.info(`User ${updated?.email || id} updated successfully.`);
    return updated;
  } catch (e) {
    // Handle Postgres unique violation (duplicate email)
    const code = e && (e.code || e?.cause?.code);
    const message = typeof e?.message === 'string' ? e.message : '';
    if (
      code === '23505' ||
      message.toLowerCase().includes('duplicate key') ||
      message.toLowerCase().includes('unique')
    ) {
      throw new Error('EMAIL_TAKEN');
    }
    logger.error(`Error updating user (${id}): ${e}`);
    throw e;
  }
};

export const deleteUser = async id => {
  try {
    // Ensure the user exists first
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!existing) {
      throw new Error('USER_NOT_FOUND');
    }

    const [deleted] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning(userSelect);

    logger.info(`User ${deleted?.email || id} deleted successfully.`);
    return deleted;
  } catch (e) {
    logger.error(`Error deleting user (${id}): ${e}`);
    throw e;
  }
};
