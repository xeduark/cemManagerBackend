import { Router } from 'express';
import { getOperadoresController } from '../controllers/operador.controller.js';

const router = Router();

router.get("/", getOperadoresController);

export default router;