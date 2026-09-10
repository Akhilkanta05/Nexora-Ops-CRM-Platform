import { Router } from 'express';
import { AuthController, loginSchema } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';

const router = Router();

router.post('/login', validateBody(loginSchema), AuthController.login);
router.get('/me', authenticate, AuthController.me);
router.get('/demo-accounts', AuthController.getDemoAccounts);

export default router;
