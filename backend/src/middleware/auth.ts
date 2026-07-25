import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication token required' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'mini_erp_crm_super_secret_jwt_key_2026_safe';
    const decoded = jwt.verify(token, secret) as AuthRequest['user'];
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userRole = req.user.role.toUpperCase();
    const formattedAllowed = allowedRoles.map(r => r.toUpperCase());

    if (!formattedAllowed.includes(userRole) && userRole !== 'ADMIN') {
      return res.status(403).json({ 
        success: false, 
        message: `Forbidden: Access restricted to roles [${allowedRoles.join(', ')}]` 
      });
    }

    next();
  };
};
