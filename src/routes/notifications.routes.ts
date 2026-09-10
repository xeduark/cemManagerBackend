import { Router } from "express";
import {
  getNotificationsController,
  dismissNotificationController,
} from "../controllers/notifications.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", authenticate, getNotificationsController);
router.post("/:id/descartar", authenticate, dismissNotificationController);

export default router;
