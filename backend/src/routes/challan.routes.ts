import { Router } from 'express';
import {
  ChallanController,
  createChallanSchema,
  updateChallanStatusSchema,
} from '../controllers/challan.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { validateBody } from '../middleware/validate.middleware';

const router = Router();

router.use(authenticate);

// View list & details: Admin, Sales, Warehouse, Accounts
router.get('/', authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), ChallanController.getChallans);
router.get('/:id', authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), ChallanController.getChallanById);
router.get('/:id/pdf', authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), ChallanController.downloadPdf);

// Create Challan: Admin, Sales
router.post(
  '/',
  authorizeRoles('ADMIN', 'SALES'),
  validateBody(createChallanSchema),
  ChallanController.createChallan
);

// Update Status (Confirm / Cancel): Admin, Sales, Warehouse
router.patch(
  '/:id/status',
  authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE'),
  validateBody(updateChallanStatusSchema),
  ChallanController.updateChallanStatus
);

export default router;
