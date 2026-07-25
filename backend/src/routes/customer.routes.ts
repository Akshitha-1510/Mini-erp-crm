import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all customers with search, filter, pagination
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { search, status, type, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      const q = (search as string).trim();
      where.OR = [
        { name: { contains: q } },
        { businessName: { contains: q } },
        { mobile: { contains: q } },
        { email: { contains: q } }
      ];
    }

    if (status) {
      where.status = status as string;
    }

    if (type) {
      where.type = type as string;
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: {
            select: { noteLogs: true, challans: true }
          }
        }
      }),
      prisma.customer.count({ where })
    ]);

    return res.json({
      success: true,
      data: customers,
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

// Create Customer
router.post('/', authenticateToken, requireRole(['ADMIN', 'SALES']), async (req: AuthRequest, res: Response) => {
  try {
    const { name, mobile, email, businessName, gstNumber, type, address, status, followUpDate, notes } = req.body;

    if (!name || !mobile || !businessName) {
      return res.status(400).json({ success: false, message: 'Customer name, mobile number, and business name are required' });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        mobile,
        email: email || null,
        businessName,
        gstNumber: gstNumber || null,
        type: type || 'Retail',
        status: status || 'Lead',
        address: address || null,
        followUpDate: followUpDate || null,
        notes: notes || null
      }
    });

    // If initial notes were provided, add to notes timeline log
    if (notes && req.user) {
      await prisma.customerNote.create({
        data: {
          customerId: customer.id,
          note: `Initial Note: ${notes}`,
          createdBy: `${req.user.name} (${req.user.role})`
        }
      });
    }

    return res.status(201).json({ success: true, message: 'Customer created successfully', data: customer });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get Single Customer Detail Page
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        noteLogs: {
          orderBy: { createdAt: 'desc' }
        },
        challans: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    return res.json({ success: true, data: customer });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Update Customer
router.put('/:id', authenticateToken, requireRole(['ADMIN', 'SALES']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, mobile, email, businessName, gstNumber, type, address, status, followUpDate, notes } = req.body;

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        mobile: mobile !== undefined ? mobile : existing.mobile,
        email: email !== undefined ? email : existing.email,
        businessName: businessName !== undefined ? businessName : existing.businessName,
        gstNumber: gstNumber !== undefined ? gstNumber : existing.gstNumber,
        type: type !== undefined ? type : existing.type,
        address: address !== undefined ? address : existing.address,
        status: status !== undefined ? status : existing.status,
        followUpDate: followUpDate !== undefined ? followUpDate : existing.followUpDate,
        notes: notes !== undefined ? notes : existing.notes
      }
    });

    return res.json({ success: true, message: 'Customer updated successfully', data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Add Follow-up note
router.post('/:id/notes', authenticateToken, requireRole(['ADMIN', 'SALES', 'ACCOUNTS']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { note, newFollowUpDate, newStatus } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({ success: false, message: 'Note text is required' });
    }

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const createdByStr = req.user ? `${req.user.name} (${req.user.role})` : 'System User';

    const customerNote = await prisma.customerNote.create({
      data: {
        customerId: id,
        note: note.trim(),
        createdBy: createdByStr
      }
    });

    // Optionally update follow-up date / status if provided
    const updateData: any = {};
    if (newFollowUpDate !== undefined) updateData.followUpDate = newFollowUpDate;
    if (newStatus !== undefined) updateData.status = newStatus;

    if (Object.keys(updateData).length > 0) {
      await prisma.customer.update({
        where: { id },
        data: updateData
      });
    }

    return res.status(201).json({ success: true, message: 'Follow-up note added', data: customerNote });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
