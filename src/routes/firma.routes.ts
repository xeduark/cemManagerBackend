import { Router } from "express";
import { upload } from "../middlewares/upload.js";
import { uploadFirma } from "../controllers/firma.controller.js";

const router = Router();

router.post("/firma", upload.single("firma"), uploadFirma);

export default router;