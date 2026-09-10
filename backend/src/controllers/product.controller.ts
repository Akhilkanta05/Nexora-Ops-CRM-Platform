import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { StockService } from '../services/stock.service';
import { S3Service } from '../services/s3.service';
import { NotFoundError, BadRequestError } from '../utils/errors';

export const createProductSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  sku: z.string().min(2, 'SKU / Product code is required'),
  category: z.string().min(2, 'Category is required'),
  unitPrice: z.number().nonnegative('Unit price must be 0 or positive'),
  currentStock: z.number().int().nonnegative('Stock must be 0 or positive').default(0),
  minStockAlert: z.number().int().nonnegative('Alert quantity must be 0 or positive').default(5),
  warehouseLocation: z.string().min(1, 'Warehouse location/bay is required'),
  imageUrl: z.string().optional().nullable(),
});

export const updateProductSchema = createProductSchema.partial();

export const stockAdjustmentSchema = z.object({
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  movementType: z.enum(['IN', 'OUT']),
  reason: z.string().min(3, 'Reason is mandatory for audit compliance'),
});

export class ProductController {
  static async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string, 10) || 10));
      const search = (req.query.search as string || '').trim();
      const category = req.query.category as string;
      const lowStockOnly = req.query.lowStock === 'true';

      const where: any = {};

      if (category) {
        where.category = category;
      }

      if (search) {
        where.OR = [
          { name: { contains: search } },
          { sku: { contains: search } },
          { category: { contains: search } },
          { warehouseLocation: { contains: search } },
        ];
      }

      const allProducts = await prisma.product.findMany({
        where,
        orderBy: { name: 'asc' },
      });

      // Filter in memory for lowStock alert if requested (currentStock <= minStockAlert)
      let filteredProducts = allProducts;
      if (lowStockOnly) {
        filteredProducts = allProducts.filter((p) => p.currentStock <= p.minStockAlert);
      }

      const total = filteredProducts.length;
      const skip = (page - 1) * limit;
      const paginated = filteredProducts.slice(skip, skip + limit);

      return res.status(200).json({
        success: true,
        data: paginated,
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

  static async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          stockLogs: {
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      });

      if (!product) {
        throw new NotFoundError(`Product not found with ID ${id}`);
      }

      return res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body;

      const existingSku = await prisma.product.findUnique({
        where: { sku: data.sku },
      });

      if (existingSku) {
        throw new BadRequestError(`Product with SKU '${data.sku}' already exists.`);
      }

      const product = await prisma.product.create({
        data: {
          name: data.name,
          sku: data.sku,
          category: data.category,
          unitPrice: data.unitPrice,
          currentStock: data.currentStock || 0,
          minStockAlert: data.minStockAlert !== undefined ? data.minStockAlert : 5,
          warehouseLocation: data.warehouseLocation,
          imageUrl: data.imageUrl || null,
        },
      });

      // If initial stock was provided, create an initial stock movement record
      if (product.currentStock > 0) {
        await prisma.stockMovement.create({
          data: {
            productId: product.id,
            quantity: product.currentStock,
            movementType: 'IN',
            reason: 'Initial Opening Inventory Stock Intake',
            createdBy: req.user?.name || 'System Admin',
          },
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = req.body;

      const existing = await prisma.product.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundError(`Product not found with ID ${id}`);
      }

      // If SKU is changed, check uniqueness
      if (data.sku && data.sku !== existing.sku) {
        const dup = await prisma.product.findUnique({ where: { sku: data.sku } });
        if (dup) {
          throw new BadRequestError(`SKU '${data.sku}' is already used by another product.`);
        }
      }

      // currentStock is updated via adjustStock to preserve audit logs, but alert/price/etc can be updated directly
      const { currentStock, ...safeData } = data;

      const updated = await prisma.product.update({
        where: { id },
        data: safeData,
      });

      return res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async adjustStock(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { quantity, movementType, reason } = req.body;

      const result = await StockService.adjustStock({
        productId: id,
        quantity,
        movementType,
        reason,
        createdBy: req.user?.name || 'Inventory Staff',
      });

      return res.status(200).json({
        success: true,
        message: `Stock successfully adjusted (${movementType}: ${quantity})`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStockLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string, 10) || 15));
      const productId = req.query.productId as string;
      const movementType = req.query.movementType as string;

      const where: any = {};
      if (productId) where.productId = productId;
      if (movementType && ['IN', 'OUT'].includes(movementType)) where.movementType = movementType;

      const total = await prisma.stockMovement.count({ where });
      const skip = (page - 1) * limit;

      const logs = await prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              category: true,
              warehouseLocation: true,
            },
          },
        },
      });

      return res.status(200).json({
        success: true,
        data: logs,
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

  static async getUploadUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const { filename, contentType } = req.body;
      if (!filename || !contentType) {
        throw new BadRequestError('filename and contentType are required');
      }

      const result = await S3Service.getPresignedUploadUrl(filename, contentType);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
