import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { StockService } from '../services/stock.service';
import { PdfService } from '../services/pdf.service';
import { NotFoundError, BadRequestError } from '../utils/errors';

export const createChallanSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  status: z.enum(['Draft', 'Confirmed']).default('Draft'),
  notes: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, 'Product ID is required'),
        quantity: z.number().int().positive('Quantity must be greater than 0'),
      })
    )
    .min(1, 'At least one product item is required'),
});

export const updateChallanStatusSchema = z.object({
  status: z.enum(['Confirmed', 'Cancelled']),
});

export class ChallanController {
  static async getChallans(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string, 10) || 10));
      const status = req.query.status as string;
      const customerId = req.query.customerId as string;
      const search = (req.query.search as string || '').trim();

      const where: any = {};
      if (status && ['Draft', 'Confirmed', 'Cancelled'].includes(status)) {
        where.status = status;
      }
      if (customerId) {
        where.customerId = customerId;
      }
      if (search) {
        where.OR = [
          { challanNumber: { contains: search } },
          { customer: { name: { contains: search } } },
          { customer: { businessName: { contains: search } } },
        ];
      }

      const total = await prisma.salesChallan.count({ where });
      const skip = (page - 1) * limit;

      const challans = await prisma.salesChallan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              businessName: true,
              mobile: true,
              email: true,
              customerType: true,
            },
          },
          items: true,
        },
      });

      return res.status(200).json({
        success: true,
        data: challans,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getChallanById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const challan = await prisma.salesChallan.findUnique({
        where: { id },
        include: {
          customer: true,
          items: true,
        },
      });

      if (!challan) {
        throw new NotFoundError(`Sales Challan not found with ID ${id}`);
      }

      return res.status(200).json({
        success: true,
        data: challan,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createChallan(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerId, status, notes, items } = req.body;

      // 1. Fetch Customer details for Snapshot
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
      });
      if (!customer) {
        throw new BadRequestError('Selected customer does not exist');
      }

      const customerSnapshot = JSON.stringify({
        name: customer.name,
        businessName: customer.businessName,
        mobile: customer.mobile,
        email: customer.email,
        address: customer.address,
        gstNumber: customer.gstNumber,
        customerType: customer.customerType,
      });

      // 2. Fetch all requested Products for Snapshots
      const productIds = items.map((i: any) => i.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));
      let totalQuantity = 0;
      let totalAmount = 0;

      const preparedItems = [];
      for (const item of items) {
        const prod = productMap.get(item.productId);
        if (!prod) {
          throw new BadRequestError(`Product with ID ${item.productId} was not found.`);
        }

        const totalPrice = item.quantity * prod.unitPrice;
        totalQuantity += item.quantity;
        totalAmount += totalPrice;

        preparedItems.push({
          productId: prod.id,
          productName: prod.name, // Snapshot
          sku: prod.sku,         // Snapshot
          unitPrice: prod.unitPrice, // Snapshot
          quantity: item.quantity,
          totalPrice,
        });
      }

      // 3. Generate sequential challan number CH-YYYYMMDD-XXXX
      const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const countToday = await prisma.salesChallan.count({
        where: {
          challanNumber: { startsWith: `CH-${datePrefix}` },
        },
      });
      const sequentialSuffix = String(countToday + 1).padStart(4, '0');
      const challanNumber = `CH-${datePrefix}-${sequentialSuffix}`;

      // 4. Create Challan record
      const createdChallan = await prisma.salesChallan.create({
        data: {
          challanNumber,
          customerId: customer.id,
          customerSnapshot,
          totalQuantity,
          totalAmount,
          status: 'Draft', // Always create Draft first, then confirm atomically if requested
          notes: notes || null,
          createdById: req.user?.id || null,
          createdByName: req.user?.name || 'Sales Staff',
          items: {
            create: preparedItems,
          },
        },
        include: { items: true, customer: true },
      });

      // 5. If user requested "Confirmed" status, execute atomic stock reduction
      if (status === 'Confirmed') {
        const confirmed = await StockService.confirmChallan(createdChallan.id, {
          id: req.user?.id || 'system',
          name: req.user?.name || 'Sales Staff',
        });
        return res.status(201).json({
          success: true,
          message: 'Sales Challan created and confirmed with stock deducted',
          data: confirmed,
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Sales Challan saved as Draft',
        data: createdChallan,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateChallanStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const user = {
        id: req.user?.id || 'system',
        name: req.user?.name || 'Staff',
      };

      let result;
      if (status === 'Confirmed') {
        result = await StockService.confirmChallan(id, user);
      } else if (status === 'Cancelled') {
        result = await StockService.cancelChallan(id, user);
      } else {
        throw new BadRequestError('Invalid status update request');
      }

      return res.status(200).json({
        success: true,
        message: `Challan status updated to ${status}`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async downloadPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const challan = await prisma.salesChallan.findUnique({
        where: { id },
        include: {
          customer: true,
          items: true,
        },
      });

      if (!challan) {
        throw new NotFoundError(`Sales Challan not found with ID ${id}`);
      }

      PdfService.generateChallanInvoice(challan, res);
    } catch (error) {
      next(error);
    }
  }
}
