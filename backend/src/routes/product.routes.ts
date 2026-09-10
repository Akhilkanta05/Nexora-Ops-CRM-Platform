import { Router } from 'express';
import {
  ProductController,
  createProductSchema,
  updateProductSchema,
  stockAdjustmentSchema,
} from '../controllers/product.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { validateBody } from '../middleware/validate.middleware';

const router = Router();

router.use(authenticate);

// View products & stock logs: Admin, Sales, Warehouse, Accounts
router.get('/', authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), ProductController.getProducts);
router.get('/logs/movements', authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), ProductController.getStockLogs);
router.get('/:id', authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), ProductController.getProductById);

// Create & Edit products: Admin, Warehouse
router.post(
  '/',
  authorizeRoles('ADMIN', 'WAREHOUSE'),
  validateBody(createProductSchema),
  ProductController.createProduct
);

router.put(
  '/:id',
  authorizeRoles('ADMIN', 'WAREHOUSE'),
  validateBody(updateProductSchema),
  ProductController.updateProduct
);

// Stock Adjustment (IN / OUT): Admin, Warehouse
router.post(
  '/:id/adjust-stock',
  authorizeRoles('ADMIN', 'WAREHOUSE'),
  validateBody(stockAdjustmentSchema),
  ProductController.adjustStock
);

export default router;
