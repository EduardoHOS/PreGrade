import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { prisma } from '../database';
import { asyncHandler } from '../middleware/errorHandler';
import { generateToken, authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * POST /api/auth/login
 */
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 1 }),
  ],
  asyncHandler(async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Invalid email or password' });
    }

    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true, firstName: true, lastName: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role.toLowerCase(),
      firstName: user.firstName,
      lastName: user.lastName,
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role.toLowerCase(),
          firstName: user.firstName,
          lastName: user.lastName,
        },
      },
    });
  })
);

/**
 * GET /api/auth/me
 */
router.get(
  '/me',
  authMiddleware,
  asyncHandler(async (req: any, res: any) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, avatar: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        ...user,
        role: user.role.toLowerCase(),
      },
    });
  })
);

export default router;
