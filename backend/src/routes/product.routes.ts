import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// Get stock movement audit logs (placed before /:id to avoid collision)
router.get('/movements/log', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { productId, type, search, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (productId) where.productId = productId as string;
    if (type) where.type = type as string;
    if (search) {
      const q = (search as string).trim();
      where.OR = [
        { reason: { contains: q } },
        { createdBy: { contains: q } },
        { product: { name: { contains: q } } },
        { product: { sku: { contains: q } } }
      ];
    }

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { timestamp: 'desc' },
        include: {
          product: {
            select: { name: true, sku: true, category: true }
          }
        }
      }),
      prisma.stockMovement.count({ where })
    ]);

    return res.json({
      success: true,
      data: movements,
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

// Get all products with search, category, lowStock filter
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { search, category, lowStockOnly, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      const q = (search as string).trim();
      where.OR = [
        { name: { contains: q } },
        { sku: { contains: q } },
        { category: { contains: q } }
      ];
    }

    if (category) {
      where.category = category as string;
    }

    let products = await prisma.product.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { movements: true }
        }
      }
    });

    if (lowStockOnly === 'true') {
      products = products.filter(p => p.currentStock <= p.minStockAlert);
    }

    const total = await prisma.product.count({ where });

    return res.json({
      success: true,
      data: products,
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

// Create product
router.post('/', authenticateToken, requireRole(['ADMIN', 'WAREHOUSE']), async (req: AuthRequest, res: Response) => {
  try {
    const { name, sku, category, unitPrice, currentStock, minStockAlert, location } = req.body;

    if (!name || !sku || unitPrice === undefined || currentStock === undefined) {
      return res.status(400).json({ success: false, message: 'Name, SKU, Unit Price, and Current Stock are required' });
    }

    const existingSku = await prisma.product.findUnique({ where: { sku: sku.trim().toUpperCase() } });
    if (existingSku) {
      return res.status(400).json({ success: false, message: `Product with SKU '${sku}' already exists` });
    }

    const product = await prisma.product.create({
      data: {
        name,
        sku: sku.trim().toUpperCase(),
        category: category || 'General',
        unitPrice: parseFloat(unitPrice),
        currentStock: parseInt(currentStock, 10),
        minStockAlert: minStockAlert ? parseInt(minStockAlert, 10) : 5,
        location: location || 'Main Warehouse'
      }
    });

    // Create initial stock movement log if initial stock > 0
    if (parseInt(currentStock, 10) > 0 && req.user) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          quantity: parseInt(currentStock, 10),
          type: 'IN',
          reason: 'Initial Product Setup Stock',
          createdBy: `${req.user.name} (${req.user.role})`
        }
      });
    }

    return res.status(201).json({ success: true, message: 'Product created successfully', data: product });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get Single Product
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        movements: {
          orderBy: { timestamp: 'desc' },
          take: 15
        }
      }
    });

    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    return res.json({ success: true, data: product });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Edit Product
router.put('/:id', authenticateToken, requireRole(['ADMIN', 'WAREHOUSE']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, sku, category, unitPrice, minStockAlert, location } = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Product not found' });

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        sku: sku !== undefined ? sku.trim().toUpperCase() : existing.sku,
        category: category !== undefined ? category : existing.category,
        unitPrice: unitPrice !== undefined ? parseFloat(unitPrice) : existing.unitPrice,
        minStockAlert: minStockAlert !== undefined ? parseInt(minStockAlert, 10) : existing.minStockAlert,
        location: location !== undefined ? location : existing.location
      }
    });

    return res.json({ success: true, message: 'Product updated successfully', data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Manual Stock Adjustment (IN or OUT)
router.post('/:id/adjust-stock', authenticateToken, requireRole(['ADMIN', 'WAREHOUSE']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { type, quantity, reason } = req.body;

    if (!type || !quantity || !reason) {
      return res.status(400).json({ success: false, message: 'Movement type (IN/OUT), quantity, and reason are required' });
    }

    const movementType = type.toUpperCase();
    if (movementType !== 'IN' && movementType !== 'OUT') {
      return res.status(400).json({ success: false, message: 'Movement type must be IN or OUT' });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive integer' });
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    if (movementType === 'OUT' && product.currentStock < qty) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient stock! Requested: ${qty}, Available: ${product.currentStock}` 
      });
    }

    const newStock = movementType === 'IN' ? product.currentStock + qty : product.currentStock - qty;

    const createdByStr = req.user ? `${req.user.name} (${req.user.role})` : 'Warehouse Staff';

    const [updatedProduct, movement] = await prisma.$transaction([
      prisma.product.update({
        where: { id },
        data: { currentStock: newStock }
      }),
      prisma.stockMovement.create({
        data: {
          productId: id,
          quantity: qty,
          type: movementType,
          reason: reason.trim(),
          createdBy: createdByStr
        }
      })
    ]);

    return res.json({
      success: true,
      message: `Stock updated successfully (${movementType} ${qty})`,
      data: {
        product: updatedProduct,
        movement
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
