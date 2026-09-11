import { Response } from "express";
import * as FirmaService from "../services/firma.service.js";
import { logAction } from "../services/auditLog.service.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";

export const saveFirmaController = async (req: AuthRequest, res: Response) => {
  try {
    const actaId = Number(req.params.id);

    if (isNaN(actaId)) {
      return res.status(400).json({ message: "ID de acta inválido" });
    }

    const { tipo, firmaBase64, firmanteNombre, firmanteCC } = req.body;

    if (tipo !== "RECIBE" && tipo !== "ENTREGA") {
      return res.status(400).json({ message: "tipo debe ser RECIBE o ENTREGA" });
    }

    const firma = await FirmaService.saveFirma(
      actaId,
      tipo,
      firmaBase64,
      firmanteNombre,
      firmanteCC,
    );

    await logAction(req.user?.id, "FIRMAR", "firmas", "acta", actaId, `Firma ${tipo} capturada con panel TOPAZ`);

    res.status(201).json(firma);
  } catch (error: any) {
    console.error("❌ Error en saveFirmaController:", error);

    if (error.code === "23503") {
      return res.status(404).json({ message: "Acta no encontrada" });
    }

    if (error.message === "Firma vacía o inválida") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Error guardando la firma" });
  }
};
