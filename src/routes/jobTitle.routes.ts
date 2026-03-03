import { Router } from 'express';
import { getCargos } from '../controllers/jobTitle.controller.js';

const router = Router();

router.get('/', getCargos);

export default router;