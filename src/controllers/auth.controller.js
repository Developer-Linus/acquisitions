import logger from '#config/logger.js';
import { signupSchema, signinSchema } from '#validations/auth.validation.js';
import { formatValidationError } from '#utils/format.js';
import { createUser, authenticateUser } from '#src/services/auth.service.js';
import { cookies } from '#utils/cookies.js';
import { jwttoken } from '#utils/jwt.js';

export const signup = async (req, res, next) => {
  try {
    const validationResult = signupSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed.',
        details: formatValidationError(validationResult.error),
      });
    }
    const { name, email, password, role } = validationResult.data;

    const user = await createUser({ name, email, password, role });

    const token = jwttoken.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    cookies.set(res, 'token', token);

    logger.info(`User registered successfully: ${user.email}`);

    return res.status(201).json({
      message: 'User registered.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    logger.error('Signup error', e);
    if (e?.message === 'EMAIL_TAKEN') {
      return res.status(409).json({ error: 'Email already exist' });
    }
    return next(e);
  }
};

export const signin = async (req, res, next) => {
  try {
    const validationResult = signinSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed.',
        details: formatValidationError(validationResult.error),
      });
    }
    const { email, password } = validationResult.data;

    const user = await authenticateUser({ email, password });

    const token = jwttoken.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    cookies.set(res, 'token', token);

    logger.info(`User signed in: ${user.email}`);
    return res.status(200).json({
      message: 'Signed in.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    if (e?.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    logger.error('Signin error', e);
    return next(e);
  }
};

export const signout = (req, res) => {
  cookies.clear(res, 'token');
  return res.status(200).json({ message: 'Signed out.' });
};
