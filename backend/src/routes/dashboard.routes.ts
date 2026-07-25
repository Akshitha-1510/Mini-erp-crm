import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalCustomers,
      leadCustomers,
      activeCustomers,
      totalProducts,
      productsList,
      totalChallans,
      confirmedChallans,
      draftChallans,
      recentMovements,
      recentNotes,
      recentChallans
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { status: 'Lead' } }),
      prisma.customer.count({ where: { status: 'Active' } }),
      prisma.product.count(),
      prisma.product.findMany({ select: { id: true, name: true, sku: true, currentStock: true, minStockAlert: true, unitPrice: true } }),
      prisma.challan.count(),
      prisma.challan.findMany({ where: { status: 'Confirmed' } }),
      prisma.challan.count({ where: { status: 'Draft' } }),
      prisma.stockMovement.findMany({
        take: 5,
        orderBy: { timestamp: 'desc' },
        include: { product: { select: { name: true, sku: true } } }
      }),
      prisma.customerNote.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { name: true, businessName: true } } }
      }),
      prisma.challan.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { name: true, businessName: true } } }
      })
    ]);

    const lowStockProducts = productsList.filter(p => p.currentStock <= p.minStockAlert);
    const totalSalesAmount = confirmedChallans.reduce((sum, c) => sum + c.totalAmount, 0);

    return res.json({
      success: true,
      data: {
        summary: {
          totalCustomers,
          leadCustomers,
          activeCustomers,
          totalProducts,
          lowStockCount: lowStockProducts.length,
          totalChallans,
          confirmedChallansCount: confirmedChallans.length,
          draftChallansCount: draftChallans,
          totalSalesAmount
        },
        lowStockAlerts: lowStockProducts,
        activityFeed: {
          stockMovements: recentMovements,
          notes: recentNotes,
          recentChallans
        }
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
