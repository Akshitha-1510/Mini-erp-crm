import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

const fallbackDemoUsers = [
  { id: 'demo-admin', name: 'System Admin', email: 'admin@erp.com', password: 'password123', role: 'ADMIN' },
  { id: 'demo-sales', name: 'Sarah Sales', email: 'sales@erp.com', password: 'password123', role: 'SALES' },
  { id: 'demo-warehouse', name: 'Will Warehouse', email: 'warehouse@erp.com', password: 'password123', role: 'WAREHOUSE' },
  { id: 'demo-accounts', name: 'Alex Accounts', email: 'accounts@erp.com', password: 'password123', role: 'ACCOUNTS' }
];

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = fallbackDemoUsers.find((candidate) => candidate.email === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = password === user.password;

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    const secret = process.env.JWT_SECRET || 'mini_erp_crm_super_secret_jwt_key_2026_safe';
    const token = jwt.sign(tokenPayload, secret, { expiresIn: '24h' });

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Server error during login' });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const currentUser = req.user;
    if (!currentUser) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = fallbackDemoUsers.find((candidate) => candidate.id === currentUser.id || candidate.email === currentUser.email);

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    return res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: new Date().toISOString() } });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
