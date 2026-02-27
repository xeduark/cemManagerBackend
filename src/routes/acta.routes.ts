import { Router } from 'express';
import {
  createActa,
  getActas,
  getActaById,
  updateActa,
  closeActa
} from '../controllers/acta.controller.js';

const router = Router();

/**
 * Crear acta (BORRADOR)
 */
router.post('/', createActa);

/**
 * Obtener todas las actas
 */
router.get('/', getActas);

/**
 * Obtener acta por ID (preview / edición)
 */
router.get('/:id', getActaById);

/**
 * Actualizar acta (solo BORRADOR)
 */
router.put('/:id', updateActa);

/**
 * Cerrar acta (ya no editable)
 */
router.post('/:id/close', closeActa);

export default router;
