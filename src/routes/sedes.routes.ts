import { Router } from "express";
import { getSedesController, createSedeController, deactivateSedeController } from "../controllers/sedes.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import { UserRole } from "../types/auth.js";

const router = Router();

router.get("/", authenticate, getSedesController);
router.post("/", authenticate, authorize(UserRole.SUPERADMIN, UserRole.ADMIN), createSedeController);
router.delete("/:id", authenticate, authorize(UserRole.SUPERADMIN, UserRole.ADMIN), deactivateSedeController);

export default router;