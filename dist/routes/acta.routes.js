import { Router } from 'express';
import { createActa, getActas, getActaByNumber } from '../controllers/acta.controller.js';
const router = Router();
router.get('/', getActas);
router.get('/:actaNumber', getActaByNumber);
router.post('/', createActa);
export default router;
