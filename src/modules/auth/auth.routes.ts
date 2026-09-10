import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
  loginController,
  meController,
  changePasswordController,
  googleLoginController,
  refreshController,
} from "./auth.controller.js";

import {
  solicitarCambioController,
  listarSolicitudesController,
  resolverSolicitudController,
} from "../../controllers/passwordReset.controller.js";

import {
  authenticate,
} from "../../middlewares/auth.middleware.js";

import { authorize } from "../../middlewares/role.middleware.js";
import { UserRole } from "../../types/auth.js";

const router = Router();

// Máximo 5 solicitudes de cambio de contraseña por IP cada 15 minutos
const solicitudCambioLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiadas solicitudes, intenta de nuevo más tarde" },
});

router.post(
  "/login",
  loginController,
);

router.post(
  "/google",
  googleLoginController,
);

router.post(
  "/refresh",
  refreshController,
);

router.get(
  "/me",
  authenticate,
  meController,
);

router.post(
  "/change-password",
  authenticate,
  changePasswordController,
);

router.post(
  "/solicitar-cambio-password",
  solicitudCambioLimiter,
  solicitarCambioController,
);

router.get(
  "/solicitudes-cambio-password",
  authenticate,
  authorize(UserRole.SUPERADMIN),
  listarSolicitudesController,
);

router.post(
  "/solicitudes-cambio-password/:id/resolver",
  authenticate,
  authorize(UserRole.SUPERADMIN),
  resolverSolicitudController,
);

export default router;