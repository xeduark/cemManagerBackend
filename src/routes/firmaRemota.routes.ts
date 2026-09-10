import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  validarCodigoController,
  completarFirmaRemotaController,
} from "../controllers/firmaRemota.controller.js";

const router = Router();

const validarLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados intentos, intenta de nuevo más tarde" },
});

router.post("/:token/validar", validarLimiter, validarCodigoController);
router.post("/completar", completarFirmaRemotaController);

export default router;
