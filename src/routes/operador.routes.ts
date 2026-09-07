import { Router } from 'express';
import { getOperadoresController } from '../controllers/operador.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.get("/", authenticate, getOperadoresController);

export default router;