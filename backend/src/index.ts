import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { execFileSync } from 'child_process';
import path from 'path';

import authRoutes from './routes/auth.routes';
import customerRoutes from './routes/customer.routes';
import productRoutes from './routes/product.routes';
import challanRoutes from './routes/challan.routes';
import dashboardRoutes from './routes/dashboard.routes';
import { prisma } from './prisma';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

async function initializeDatabase() {
  try {
    const backendRoot = path.resolve(__dirname, '..');
    const prismaCli = path.join(backendRoot, 'node_modules', 'prisma', 'build', 'index.js');
    execFileSync(process.execPath, [prismaCli, 'db', 'push', '--skip-generate'], {
      cwd: backendRoot,
      stdio: 'ignore'
    });
  } catch (error) {
    console.warn('Prisma db push skipped or failed during startup:', error);
  }

  try {
    const existingUserCount = await prisma.user.count();
    if (existingUserCount > 0) {
      return;
    }

    const hashedPassword = await bcrypt.hash('password123', 10);
    const defaultUsers = [
      { name: 'System Admin', email: 'admin@erp.com', password: hashedPassword, role: 'ADMIN' },
      { name: 'Sarah Sales', email: 'sales@erp.com', password: hashedPassword, role: 'SALES' },
      { name: 'Will Warehouse', email: 'warehouse@erp.com', password: hashedPassword, role: 'WAREHOUSE' },
      { name: 'Alex Accounts', email: 'accounts@erp.com', password: hashedPassword, role: 'ACCOUNTS' }
    ];

    await prisma.user.createMany({ data: defaultUsers });
    console.log('✅ Seeded default demo users for login.');
  } catch (error) {
    console.error('Failed to seed default users:', error);
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Healthcheck Route
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    service: 'Mini ERP + CRM API',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/challans', challanRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Global 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found` });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, async () => {
  await initializeDatabase();
  console.log(`==================================================`);
  console.log(`🚀 Mini ERP + CRM Server running on port ${PORT}`);
  console.log(`📡 Healthcheck: http://localhost:${PORT}/api/health`);
  console.log(`==================================================`);
});

export default app;
