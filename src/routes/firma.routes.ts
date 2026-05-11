import { Router } from "express";
import { uploadFirma } from "../controllers/firma.controller.js";

const router = Router();

router.post("/firma", uploadFirma);

export default router;