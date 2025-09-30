import logger from '#config/logger.js';
import bcrypt from 'bcrypt';
import { db } from '#config/database.js';
import { users } from '#models/user.model.js';
import { eq } from 'drizzle-orm';

const BCRYPT_COST = Number.parseInt(process.env.BCRYPT_COST || '11', 10);

export const hashPassword = async password => {
  try {
    return await bcrypt.hash(password, BCRYPT_COST);
  } catch (e) {
    logger.error(`Error hashing password: ${e}`);
    throw new Error('Error hashing.');
  }
};

export const createUser = async ({ name, email, password, role = 'user' }) => {
  try {
    const password_hash = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({ name, email, password: password_hash, role })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        created_at: users.created_at,
      });

    logger.info(`User ${newUser.email} created successfully.`);
    return newUser;
  } catch (e) {
    // Handle Postgres unique violation (duplicate email)
    const code = e && (e.code || e?.cause?.code);
    const message = typeof e?.message === 'string' ? e.message : '';
    if (code === '23505' || message.toLowerCase().includes('duplicate key') || message.toLowerCase().includes('unique')) {
      throw new Error('EMAIL_TAKEN');
    }
    logger.error(`Error creating the user: ${e}`);
    throw e;
  }
};

export const verifyPassword = async (password, hash) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (e) {
    logger.error(`Error verifying password: ${e}`);
    throw new Error('Error verifying password.');
  }
};

export const findUserByEmail = async email => {
  try {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        password: users.password,
        role: users.role,
        created_at: users.created_at,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return user;
  } catch (e) {
    logger.error(`Error fetching user by email: ${e}`);
    throw e;
  }
};

export const authenticateUser = async ({ email, password }) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error('INVALID_CREDENTIALS');
  }
  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    throw new Error('INVALID_CREDENTIALS');
  }
  const { password: _pw, ...safeUser } = user;
  return safeUser;
};
