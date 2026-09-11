import { Router } from "express";
import { getAuditLogsController } from "../controllers/auditLog.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import { UserRole } from "../types/auth.js";

const router = Router();

router.get("/", authenticate, authorize(UserRole.SUPERADMIN, UserRole.ADMIN), getAuditLogsController);

export default router;
