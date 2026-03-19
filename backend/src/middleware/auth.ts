import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        firstName: string;
        lastName: string;
      };
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'pregrade-demo-secret';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
    };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

export const requireTeacher = [
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'teacher' && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Teacher access required' });
    }
    next();
  },
];

export const requireStudent = [
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'student') {
      return res.status(403).json({ success: false, error: 'Student access required' });
    }
    next();
  },
];

export function generateToken(user: { id: string; email: string; role: string; firstName: string; lastName: string }) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}
