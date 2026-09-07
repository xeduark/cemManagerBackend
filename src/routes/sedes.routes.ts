import { Router } from "express";
import { getSedesController } from "../controllers/sedes.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", authenticate, getSedesController);

export default router;