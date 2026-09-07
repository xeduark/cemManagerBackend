import { Router } from 'express';
import { getCargos } from '../controllers/jobTitle.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticate, getCargos);

export default router;