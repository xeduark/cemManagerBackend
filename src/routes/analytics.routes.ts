import { Router } from "express";
import {
  getSummaryController,
  getActasByEstadoController,
  getActasBySedeController,
  getActasPorMesController,
  getTiempoCierrePromedioController,
  getEquiposStatsController,
  getUsuariosPorRolController,
} from "../controllers/analytics.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/summary", authenticate, getSummaryController);
router.get("/actas-by-estado", authenticate, getActasByEstadoController);
router.get("/actas-by-sede", authenticate, getActasBySedeController);
router.get("/actas-por-mes", authenticate, getActasPorMesController);
router.get("/tiempo-cierre-promedio", authenticate, getTiempoCierrePromedioController);
router.get("/equipos", authenticate, getEquiposStatsController);
router.get("/usuarios-por-rol", authenticate, getUsuariosPorRolController);

export default router;
