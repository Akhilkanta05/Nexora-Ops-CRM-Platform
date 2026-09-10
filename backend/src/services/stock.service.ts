import { prisma } from '../utils/prisma';
import { BadRequestError } from '../utils/errors';

export interface StockAdjustmentParams {
  productId: string;
  quantity: number;
  movementType: 'IN' | 'OUT';
  reason: string;
  createdBy: string;
}

export class StockService {
  /**
   * Adjust stock manually or via intake/damage correction
   */
  static async adjustStock(params: StockAdjustmentParams) {
    const { productId, quantity, movementType, reason, createdBy } = params;

    if (quantity <= 0) {
      throw new BadRequestError('Quantity must be greater than 0');
    }

    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new BadRequestError(`Product not found with ID ${productId}`);
      }

      if (movementType === 'OUT' && product.currentStock < quantity) {
        throw new BadRequestError(
          `Insufficient stock for product "${product.name}". Available: ${product.currentStock}, Requested deduction: ${quantity}`
        );
      }

      const newStock =
        movementType === 'IN'
          ? product.currentStock + quantity
          : product.currentStock - quantity;

      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { currentStock: newStock },
      });

      const movement = await tx.stockMovement.create({
        data: {
          productId,
          quantity,
          movementType,
          reason,
          createdBy,
        },
      });

      return { product: updatedProduct, movement };
    });
  }

  /**
   * Confirms a sales challan atomically:
   * 1. Validates current stock for all items
   * 2. Decrements product stock
   * 3. Creates StockMovement log (type: OUT) for each item
   * 4. Updates challan status to 'Confirmed'
   */
  static async confirmChallan(challanId: string, user: { id: string; name: string }) {
    return await prisma.$transaction(async (tx) => {
      const challan = await tx.salesChallan.findUnique({
        where: { id: challanId },
        include: { items: true },
      });

      if (!challan) {
        throw new BadRequestError('Sales Challan not found');
      }

      if (challan.status === 'Confirmed') {
        throw new BadRequestError('Challan is already confirmed');
      }

      if (challan.status === 'Cancelled') {
        throw new BadRequestError('Cannot confirm a cancelled challan');
      }

      if (challan.items.length === 0) {
        throw new BadRequestError('Cannot confirm a challan with no line items');
      }

      // Step 1: Pre-flight stock check for all line items
      const productIds = challan.items.map((item) => item.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      // Aggregate quantities if the same product was added multiple times
      const itemQtyMap = new Map<string, number>();
      for (const item of challan.items) {
        itemQtyMap.set(item.productId, (itemQtyMap.get(item.productId) || 0) + item.quantity);
      }

      const stockDeficits: string[] = [];
      for (const [productId, requiredQty] of itemQtyMap.entries()) {
        const product = productMap.get(productId);
        if (!product) {
          stockDeficits.push(`Product ID ${productId} no longer exists.`);
          continue;
        }
        if (product.currentStock < requiredQty) {
          stockDeficits.push(
            `"${product.name}" (SKU: ${product.sku}) - In Stock: ${product.currentStock}, Required: ${requiredQty}`
          );
        }
      }

      if (stockDeficits.length > 0) {
        throw new BadRequestError(
          `Cannot confirm challan due to insufficient stock:\n` + stockDeficits.join('\n'),
          { deficits: stockDeficits }
        );
      }

      // Step 2: Atomic stock deduction and stock movement log creation
      for (const item of challan.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: 'OUT',
            reason: `Sales Challan Confirmation (${challan.challanNumber})`,
            referenceId: challan.id,
            createdBy: user.name,
          },
        });
      }

      // Step 3: Update challan status
      const updatedChallan = await tx.salesChallan.update({
        where: { id: challan.id },
        data: {
          status: 'Confirmed',
          confirmedAt: new Date(),
        },
        include: { items: true },
      });

      return updatedChallan;
    });
  }

  /**
   * Cancels a confirmed challan and restores inventory stock
   */
  static async cancelChallan(challanId: string, user: { id: string; name: string }) {
    return await prisma.$transaction(async (tx) => {
      const challan = await tx.salesChallan.findUnique({
        where: { id: challanId },
        include: { items: true },
      });

      if (!challan) {
        throw new BadRequestError('Sales Challan not found');
      }

      if (challan.status === 'Cancelled') {
        throw new BadRequestError('Challan is already cancelled');
      }

      const wasConfirmed = challan.status === 'Confirmed';

      // If it was confirmed, revert stock deductions
      if (wasConfirmed) {
        for (const item of challan.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { increment: item.quantity } },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              movementType: 'IN',
              reason: `Sales Challan Cancellation (${challan.challanNumber})`,
              referenceId: challan.id,
              createdBy: user.name,
            },
          });
        }
      }

      const updatedChallan = await tx.salesChallan.update({
        where: { id: challan.id },
        data: {
          status: 'Cancelled',
          cancelledAt: new Date(),
        },
        include: { items: true },
      });

      return updatedChallan;
    });
  }
}
