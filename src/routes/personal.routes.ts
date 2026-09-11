import { Router } from "express";
import { getPersonalController } from "../controllers/personal.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// Lista liviana (nombre + cédula) para selectores como "Entregado por" / "Recibido por"
// en la creación de actas. Cualquier rol autenticado puede leerla — no expone datos
// sensibles de cuenta (email, rol, password), a diferencia de /api/users (solo SUPERADMIN).
router.get("/", authenticate, getPersonalController);

export default router;
