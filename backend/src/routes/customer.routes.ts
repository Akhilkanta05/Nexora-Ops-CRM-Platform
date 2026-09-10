import { Router } from 'express';
import {
  CustomerController,
  createCustomerSchema,
  updateCustomerSchema,
  addFollowUpSchema,
} from '../controllers/customer.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { validateBody } from '../middleware/validate.middleware';

const router = Router();

// All customer routes require authentication
router.use(authenticate);

// View list and detail: Admin, Sales, Accounts
router.get('/', authorizeRoles('ADMIN', 'SALES', 'ACCOUNTS'), CustomerController.getCustomers);
router.get('/:id', authorizeRoles('ADMIN', 'SALES', 'ACCOUNTS'), CustomerController.getCustomerById);

// Create, Update, Add Follow-up: Admin, Sales
router.post(
  '/',
  authorizeRoles('ADMIN', 'SALES'),
  validateBody(createCustomerSchema),
  CustomerController.createCustomer
);

router.put(
  '/:id',
  authorizeRoles('ADMIN', 'SALES'),
  validateBody(updateCustomerSchema),
  CustomerController.updateCustomer
);

router.post(
  '/:id/follow-up',
  authorizeRoles('ADMIN', 'SALES'),
  validateBody(addFollowUpSchema),
  CustomerController.addFollowUpNote
);

export default router;
