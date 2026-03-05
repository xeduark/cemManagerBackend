import { Router } from "express";
import { getSedesController } from "../controllers/sedes.controller.js";

const router = Router();

router.get("/", getSedesController);

export default router;