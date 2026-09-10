import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';

export class DashboardController {
  static async getOverview(_req: Request, res: Response, next: NextFunction) {
    try {
      // 1. Customer metrics
      const [totalCustomers, activeCustomers, leadCustomers] = await Promise.all([
        prisma.customer.count(),
        prisma.customer.count({ where: { status: 'Active' } }),
        prisma.customer.count({ where: { status: 'Lead' } }),
      ]);

      // 2. Product & Inventory metrics
      const allProducts = await prisma.product.findMany({
        select: { id: true, currentStock: true, minStockAlert: true },
      });
      const totalProducts = allProducts.length;
      const lowStockCount = allProducts.filter((p) => p.currentStock <= p.minStockAlert).length;
      const totalInventoryUnits = allProducts.reduce((sum, p) => sum + p.currentStock, 0);

      // 3. Challans & Revenue metrics
      const [totalChallans, confirmedChallans, draftChallans] = await Promise.all([
        prisma.salesChallan.count(),
        prisma.salesChallan.count({ where: { status: 'Confirmed' } }),
        prisma.salesChallan.count({ where: { status: 'Draft' } }),
      ]);

      const confirmedChallanAmounts = await prisma.salesChallan.findMany({
        where: { status: 'Confirmed' },
        select: { totalAmount: true },
      });
      const totalRevenue = confirmedChallanAmounts.reduce((sum, c) => sum + c.totalAmount, 0);

      // 4. Recent Stock Movements
      const recentStockMovements = await prisma.stockMovement.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { name: true, sku: true },
          },
        },
      });

      // 5. Recent Challans
      const recentChallans = await prisma.salesChallan.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { name: true, businessName: true },
          },
        },
      });

      // 6. Upcoming Follow-ups (next 7 days)
      const now = new Date();
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const upcomingFollowUps = await prisma.customer.findMany({
        where: {
          followUpDate: {
            gte: now,
            lte: nextWeek,
          },
        },
        take: 5,
        orderBy: { followUpDate: 'asc' },
        select: {
          id: true,
          name: true,
          businessName: true,
          mobile: true,
          followUpDate: true,
          status: true,
        },
      });

      return res.status(200).json({
        success: true,
        data: {
          kpi: {
            customers: {
              total: totalCustomers,
              active: activeCustomers,
              leads: leadCustomers,
            },
            inventory: {
              totalProducts,
              lowStockCount,
              totalUnits: totalInventoryUnits,
            },
            challans: {
              total: totalChallans,
              confirmed: confirmedChallans,
              draft: draftChallans,
              revenue: totalRevenue,
            },
          },
          recentStockMovements,
          recentChallans,
          upcomingFollowUps,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
