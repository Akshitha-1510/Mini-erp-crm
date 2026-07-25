import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// Helper to generate unique Challan Number
const generateChallanNumber = async (): Promise<string> => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await prisma.challan.count();
  const sequence = String(count + 101).padStart(4, '0');
  return `CH-${dateStr}-${sequence}`;
};

// Get list of Challans
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { search, status, customerId, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      const q = (search as string).trim();
      where.OR = [
        { challanNumber: { contains: q } },
        { customer: { name: { contains: q } } },
        { customer: { businessName: { contains: q } } }
      ];
    }

    if (status) {
      where.status = status as string;
    }

    if (customerId) {
      where.customerId = customerId as string;
    }

    const [challans, total] = await Promise.all([
      prisma.challan.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, name: true, businessName: true, mobile: true, email: true, gstNumber: true }
          },
          items: true
        }
      }),
      prisma.challan.count({ where })
    ]);

    return res.json({
      success: true,
      data: challans,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Create Sales Challan
router.post('/', authenticateToken, requireRole(['ADMIN', 'SALES']), async (req: AuthRequest, res: Response) => {
  try {
    const { customerId, items, status = 'Draft' } = req.body;

    if (!customerId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Customer ID and at least one line item are required' });
    }

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Fetch products to build items & snapshots
    const productIds = items.map((i: any) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });

    const productMap = new Map(dbProducts.map(p => [p.id, p]));

    let totalQuantity = 0;
    let totalAmount = 0;
    const challanItemsData: any[] = [];
    const snapshotItems: any[] = [];

    for (const item of items) {
      const p = productMap.get(item.productId);
      if (!p) {
        return res.status(400).json({ success: false, message: `Product with ID '${item.productId}' not found` });
      }

      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ success: false, message: `Invalid quantity for product ${p.name}` });
      }

      const unitPrice = item.unitPrice !== undefined ? parseFloat(item.unitPrice) : p.unitPrice;
      const subtotal = qty * unitPrice;

      totalQuantity += qty;
      totalAmount += subtotal;

      challanItemsData.push({
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        unitPrice,
        quantity: qty,
        subtotal
      });

      snapshotItems.push({
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        unitPrice,
        quantity: qty,
        subtotal,
        category: p.category,
        location: p.location
      });
    }

    const initialStatus = status === 'Confirmed' ? 'Confirmed' : 'Draft';
    const createdByStr = req.user ? `${req.user.name} (${req.user.role})` : 'Sales Rep';

    // If initial status is Confirmed, check stock availability for all items
    if (initialStatus === 'Confirmed') {
      for (const itemData of challanItemsData) {
        const p = productMap.get(itemData.productId)!;
        if (p.currentStock < itemData.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for product '${p.name}' (SKU: ${p.sku}). Requested: ${itemData.quantity}, Available stock: ${p.currentStock}`
          });
        }
      }
    }

    const challanNumber = await generateChallanNumber();

    // Execute atomic transaction for Challan creation (+ stock deduction if Confirmed)
    const newChallan = await prisma.$transaction(async (tx) => {
      const challan = await tx.challan.create({
        data: {
          challanNumber,
          customerId,
          totalQuantity,
          totalAmount,
          status: initialStatus,
          productSnapshot: JSON.stringify(snapshotItems),
          createdBy: createdByStr,
          items: {
            create: challanItemsData
          }
        },
        include: {
          customer: true,
          items: true
        }
      });

      if (initialStatus === 'Confirmed') {
        for (const itemData of challanItemsData) {
          await tx.product.update({
            where: { id: itemData.productId },
            data: {
              currentStock: {
                decrement: itemData.quantity
              }
            }
          });

          await tx.stockMovement.create({
            data: {
              productId: itemData.productId,
              quantity: itemData.quantity,
              type: 'OUT',
              reason: `Sales Challan Confirmation #${challanNumber}`,
              createdBy: createdByStr
            }
          });
        }
      }

      return challan;
    });

    return res.status(201).json({
      success: true,
      message: `Sales Challan ${challanNumber} created successfully in ${initialStatus} status`,
      data: newChallan
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get Single Challan Detail
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const challan = await prisma.challan.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true
      }
    });

    if (!challan) return res.status(404).json({ success: false, message: 'Challan not found' });

    let parsedSnapshot = [];
    try {
      parsedSnapshot = JSON.parse(challan.productSnapshot);
    } catch (e) {
      parsedSnapshot = [];
    }

    return res.json({
      success: true,
      data: {
        ...challan,
        parsedSnapshot
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Update Challan Status (e.g. Draft -> Confirmed, Draft -> Cancelled, Confirmed -> Cancelled)
router.put('/:id/status', authenticateToken, requireRole(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['Draft', 'Confirmed', 'Cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Valid status required: Draft, Confirmed, Cancelled' });
    }

    const challan = await prisma.challan.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!challan) return res.status(404).json({ success: false, message: 'Challan not found' });

    if (challan.status === status) {
      return res.status(400).json({ success: false, message: `Challan is already in '${status}' status` });
    }

    const createdByStr = req.user ? `${req.user.name} (${req.user.role})` : 'System User';

    // Transition: Draft -> Confirmed (Must reduce stock)
    if (challan.status === 'Draft' && status === 'Confirmed') {
      const productIds = challan.items.map(i => i.productId);
      const dbProducts = await prisma.product.findMany({ where: { id: { in: productIds } } });
      const productMap = new Map(dbProducts.map(p => [p.id, p]));

      // Verify stock availability
      for (const item of challan.items) {
        const p = productMap.get(item.productId);
        if (!p) return res.status(400).json({ success: false, message: `Product '${item.productName}' no longer exists` });
        if (p.currentStock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for product '${p.name}'. Required: ${item.quantity}, Current Available: ${p.currentStock}`
          });
        }
      }

      // Perform atomic status update & stock reduction
      const updated = await prisma.$transaction(async (tx) => {
        const c = await tx.challan.update({
          where: { id },
          data: { status: 'Confirmed' },
          include: { customer: true, items: true }
        });

        for (const item of challan.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { decrement: item.quantity } }
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              type: 'OUT',
              reason: `Challan #${challan.challanNumber} Confirmation`,
              createdBy: createdByStr
            }
          });
        }

        return c;
      });

      return res.json({ success: true, message: `Challan #${challan.challanNumber} confirmed & stock deducted successfully`, data: updated });
    }

    // Transition: Confirmed -> Cancelled (Restore stock)
    if (challan.status === 'Confirmed' && status === 'Cancelled') {
      const updated = await prisma.$transaction(async (tx) => {
        const c = await tx.challan.update({
          where: { id },
          data: { status: 'Cancelled' },
          include: { customer: true, items: true }
        });

        for (const item of challan.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { increment: item.quantity } }
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              type: 'IN',
              reason: `Challan #${challan.challanNumber} Cancellation Stock Restored`,
              createdBy: createdByStr
            }
          });
        }

        return c;
      });

      return res.json({ success: true, message: `Challan #${challan.challanNumber} cancelled & stock restored`, data: updated });
    }

    // Transition: Draft -> Cancelled
    const updated = await prisma.challan.update({
      where: { id },
      data: { status },
      include: { customer: true, items: true }
    });

    return res.json({ success: true, message: `Challan status updated to ${status}`, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
