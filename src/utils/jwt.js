import jwt from 'jsonwebtoken';
import 'dotenv/config';

import logger from '#config/logger.js';

const JWT_SECRET = process.env.JWT_SECRET;
// Support both JWT_EXPIRES_IN and legacy EXPIRES_IN
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || process.env.EXPIRES_IN;

if (!JWT_SECRET) {
  throw new Error('Missing JWT_SECRET in environment');
}
if (!JWT_EXPIRES_IN) {
  throw new Error('Missing JWT_EXPIRES_IN (or EXPIRES_IN) in environment');
}

export const jwttoken = {
  sign: payload => {
    try {
      return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    } catch (e) {
      logger.error('Failed to sign token', e);
      throw new Error('Failed to sign token.');
    }
  },
  verify: token => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (e) {
      logger.error('Failed to authenticate.', e);
      throw new Error('Failed to authenticate');
    }
  },
};
