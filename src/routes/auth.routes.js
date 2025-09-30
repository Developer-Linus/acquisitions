import { signup, signin, signout } from '#controllers/auth.controller.js';
import express from 'express';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limit auth endpoints to mitigate brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authLimiter);

router.post('/sign-up', signup);
router.post('/sign-in', signin);
router.post('/sign-out', signout);

export default router;
