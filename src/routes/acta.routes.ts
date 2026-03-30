import { Router } from 'express';
import {
  createActa,
  getActasController,
  getActaById,
  updateActa,
  closeActa,
  getLatestActasController,
  getDiademaMarcasController,
} from '../controllers/acta.controller.js';

const router = Router();

/**
 * Crear acta (BORRADOR)
 */
router.post('/', createActa);

/**
 * 🔥 PRINCIPAL → paginación + search + limit
 */
router.get('/', getActasController);

/**
 * 🔥 SOLO últimas N actas (rápido)
 */
router.get('/latest', getLatestActasController);

/**
 * Otros endpoints
 */
router.get('/diadema-marcas', getDiademaMarcasController);

/**
 * Obtener acta por ID (SIEMPRE AL FINAL)
 */
router.get('/:id', getActaById);

/**
 * Actualizar acta (solo BORRADOR)
 */
router.put('/:id', updateActa);

/**
 * Cerrar acta
 */
router.post('/:id/close', closeActa);

export default router;