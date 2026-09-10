import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { NotFoundError, BadRequestError } from '../utils/errors';

export const createCustomerSchema = z.object({
  name: z.string().min(2, 'Customer name is required'),
  mobile: z.string().min(5, 'Valid mobile number is required'),
  email: z.string().email('Valid email address is required'),
  businessName: z.string().min(2, 'Business name is required'),
  gstNumber: z.string().optional().nullable(),
  customerType: z.enum(['Retail', 'Wholesale', 'Distributor']).default('Retail'),
  address: z.string().min(3, 'Address is required'),
  status: z.enum(['Lead', 'Active', 'Inactive']).default('Lead'),
  followUpDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const addFollowUpSchema = z.object({
  note: z.string().min(2, 'Follow-up note content is required'),
  nextFollowUpDate: z.string().optional().nullable(),
});

export class CustomerController {
  static async getCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string, 10) || 10));
      const search = (req.query.search as string || '').trim();
      const status = req.query.status as string;
      const customerType = req.query.customerType as string;

      const where: any = {};

      if (status && ['Lead', 'Active', 'Inactive'].includes(status)) {
        where.status = status;
      }

      if (customerType && ['Retail', 'Wholesale', 'Distributor'].includes(customerType)) {
        where.customerType = customerType;
      }

      if (search) {
        where.OR = [
          { name: { contains: search } },
          { businessName: { contains: search } },
          { email: { contains: search } },
          { mobile: { contains: search } },
          { gstNumber: { contains: search } },
        ];
      }

      const total = await prisma.customer.count({ where });
      const skip = (page - 1) * limit;

      const customers = await prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: {
            select: { challans: true, followUpLogs: true },
          },
        },
      });

      return res.status(200).json({
        success: true,
        data: customers,
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

  static async getCustomerById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
          followUpLogs: {
            orderBy: { createdAt: 'desc' },
          },
          challans: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              challanNumber: true,
              status: true,
              totalQuantity: true,
              totalAmount: true,
              createdAt: true,
              confirmedAt: true,
            },
          },
        },
      });

      if (!customer) {
        throw new NotFoundError(`Customer not found with ID ${id}`);
      }

      return res.status(200).json({
        success: true,
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body;
      const followUpDate = data.followUpDate ? new Date(data.followUpDate) : null;

      const customer = await prisma.customer.create({
        data: {
          name: data.name,
          mobile: data.mobile,
          email: data.email,
          businessName: data.businessName,
          gstNumber: data.gstNumber || null,
          customerType: data.customerType || 'Retail',
          address: data.address,
          status: data.status || 'Lead',
          followUpDate,
          notes: data.notes || null,
          ...(data.notes
            ? {
                followUpLogs: {
                  create: {
                    note: `Initial Note: ${data.notes}`,
                    createdBy: req.user?.name || 'System User',
                  },
                },
              }
            : {}),
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Customer created successfully',
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = req.body;

      const existing = await prisma.customer.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundError(`Customer not found with ID ${id}`);
      }

      const updateData: any = { ...data };
      if (data.followUpDate !== undefined) {
        updateData.followUpDate = data.followUpDate ? new Date(data.followUpDate) : null;
      }

      const updated = await prisma.customer.update({
        where: { id },
        data: updateData,
      });

      return res.status(200).json({
        success: true,
        message: 'Customer updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async addFollowUpNote(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { note, nextFollowUpDate } = req.body;

      const customer = await prisma.customer.findUnique({ where: { id } });
      if (!customer) {
        throw new NotFoundError(`Customer not found with ID ${id}`);
      }

      const createdBy = req.user?.name || 'Staff';

      const [followUp] = await prisma.$transaction([
        prisma.followUpNote.create({
          data: {
            customerId: id,
            note,
            createdBy,
          },
        }),
        ...(nextFollowUpDate !== undefined
          ? [
              prisma.customer.update({
                where: { id },
                data: {
                  followUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
                },
              }),
            ]
          : []),
      ]);

      return res.status(201).json({
        success: true,
        message: 'Follow-up note recorded successfully',
        data: followUp,
      });
    } catch (error) {
      next(error);
    }
  }
}
