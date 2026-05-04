import { Router } from 'express';
import {
  createActa,
  getActasController,
  getActaById,
  updateActa,
  closeActa,
  getLatestActasController,
  getDiademaMarcasController,
  getLaptopMarcasController,
  getCelularMarcasController
} from '../controllers/acta.controller.js';

const router = Router();

// llamar a marcas para dropdowns en el frontend
router.get('/laptop-marcas', getLaptopMarcasController);
/**
 * 🔥 Obtener marcas de diademas para dropdown en el frontend
 */
router.get('/diadema-marcas', getDiademaMarcasController);
/**
 * 🔥 Obtener marcas de celulares 
 */
router.get('/celular-marcas', getCelularMarcasController);
/**
 * 🔥 SOLO últimas N actas (rápido)
 */
router.get('/latest', getLatestActasController);

/**
 * Crear acta 
 */
router.post('/', createActa);

/**
 * 🔥 PRINCIPAL → paginación + search + limit
 */
router.get('/', getActasController);



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