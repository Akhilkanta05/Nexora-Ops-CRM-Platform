import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { config } from '../config';
import { BadRequestError, UnauthorizedError } from '../utils/errors';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (!user) {
        throw new UnauthorizedError('Invalid email or password');
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid email or password');
      }

      const tokenPayload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };

      const token = jwt.sign(tokenPayload, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn as any,
      });

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new UnauthorizedError('User account not found');
      }

      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getDemoAccounts(_req: Request, res: Response) {
    return res.status(200).json({
      success: true,
      data: [
        { role: 'ADMIN', email: 'admin@funsrooms.com', password: 'Admin@123', label: 'Admin (Full System Access)' },
        { role: 'SALES', email: 'sales@funsrooms.com', password: 'Sales@123', label: 'Sales User (CRM & Challans)' },
        { role: 'WAREHOUSE', email: 'warehouse@funsrooms.com', password: 'Warehouse@123', label: 'Warehouse (Stock & Movements)' },
        { role: 'ACCOUNTS', email: 'accounts@funsrooms.com', password: 'Accounts@123', label: 'Accounts (Invoices & Totals)' },
      ],
    });
  }
}
