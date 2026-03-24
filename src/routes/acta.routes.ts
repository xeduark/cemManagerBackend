import { Router } from 'express';
import {
  createActa,
  getActas,
  getActaById,
  updateActa,
  closeActa,
  getLatestActasController,
  searchActasController,
  getDiademaMarcasController,
  getActasPaginatedController
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
 *  Rutas especiales PRIMERO
 */

/**limite de registros */
router.get('/latest', getLatestActasController);
/** paginación */
router.get('/paginated', getActasPaginatedController);
router.get('/search', searchActasController);
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
 * Cerrar acta (ya no editable)
 */
router.post('/:id/close', closeActa);


export default router;
