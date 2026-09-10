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
  getCelularMarcasController,
  updateEstadoActa
} from '../controllers/acta.controller.js';
import { saveFirmaController } from '../controllers/firma.controller.js';
import { solicitarFirmaRemotaController } from '../controllers/firmaRemota.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { UserRole } from '../types/auth.js';

const router = Router();

const canWrite = [authenticate, authorize(UserRole.SUPERADMIN, UserRole.ADMIN)];

// llamar a marcas para dropdowns en el frontend
router.get('/laptop-marcas', authenticate, getLaptopMarcasController);
/**
 * 🔥 Obtener marcas de diademas para dropdown en el frontend
 */
router.get('/diadema-marcas', authenticate, getDiademaMarcasController);
/**
 * 🔥 Obtener marcas de celulares
 */
router.get('/celular-marcas', authenticate, getCelularMarcasController);
/**
 * 🔥 SOLO últimas N actas (rápido)
 */
router.get('/latest', authenticate, getLatestActasController);

/**
 * Crear acta
 */
router.post('/', ...canWrite, createActa);

/**
 * 🔥 PRINCIPAL → paginación + search + limit
 */
router.get('/', authenticate, getActasController);


/**
 * Obtener acta por ID (SIEMPRE AL FINAL)
 */
router.get('/:id', authenticate, getActaById);

/**
 * Actualizar acta (solo BORRADOR)
 */
router.put('/:id', ...canWrite, updateActa);

/**
 * Cerrar acta
 */
router.post('/:id/close', ...canWrite, closeActa);

/**
 * Actualizar estado de acta
 */
router.patch("/:id/estado", ...canWrite, updateEstadoActa);

/**
 * Guardar firma (panel TOPAZ)
 */
router.post('/:id/firma', ...canWrite, saveFirmaController);

/**
 * Solicitar firma remota (envía código de un solo uso por correo)
 */
router.post('/:id/firma-remota/solicitar', ...canWrite, solicitarFirmaRemotaController);


export default router;