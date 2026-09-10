import { Router } from "express";
import {
  getPublicSettingsController,
  getAllSettingsController,
  upsertSettingController,
} from "../controllers/settings.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import { UserRole } from "../types/auth.js";

const router = Router();

// Público: solo expone las claves marcadas is_public (ej. contacto de sistemas)
router.get("/public", getPublicSettingsController);

router.get("/", authenticate, authorize(UserRole.SUPERADMIN), getAllSettingsController);
router.put("/:key", authenticate, authorize(UserRole.SUPERADMIN), upsertSettingController);

export default router;
