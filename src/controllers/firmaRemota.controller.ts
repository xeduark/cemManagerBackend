import { Request, Response } from "express";
import * as FirmaRemotaService from "../services/firmaRemota.service.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";

export const solicitarFirmaRemotaController = async (req: AuthRequest, res: Response) => {
  try {
    const actaId = Number(req.params.id);

    if (isNaN(actaId)) {
      return res.status(400).json({ message: "ID de acta inválido" });
    }

    const { tipo, destinatarioNombre, destinatarioEmail, destinatarioTelefono } = req.body as {
      tipo: string;
      destinatarioNombre?: string;
      destinatarioEmail?: string;
      destinatarioTelefono?: string;
    };

    if (tipo !== "RECIBE" && tipo !== "ENTREGA") {
      return res.status(400).json({ message: "tipo debe ser RECIBE o ENTREGA" });
    }

    if (!destinatarioEmail && !destinatarioTelefono) {
      return res.status(400).json({
        message: "Debes indicar al menos destinatarioEmail o destinatarioTelefono",
      });
    }

    const solicitud = await FirmaRemotaService.solicitarFirmaRemota({
      actaId,
      tipo,
      destinatarioNombre,
      destinatarioEmail,
      destinatarioTelefono,
      creadoPor: req.user!.id,
    });

    res.status(201).json({
      message: "Enlace de firma remota generado",
      id: solicitud.id,
      link: solicitud.link,
      codigo: solicitud.codigo,
      waLink: solicitud.waLink,
      expiraEn: solicitud.expira_en,
    });
  } catch (error: any) {
    console.error("❌ Error en solicitarFirmaRemotaController:", error);

    if (error.message === "Acta no encontrada") {
      return res.status(404).json({ message: error.message });
    }

    res.status(500).json({ message: "Error enviando la solicitud de firma remota" });
  }
};

export const validarCodigoController = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { codigo } = req.body as { codigo: string };

    if (!codigo) {
      return res.status(400).json({ message: "codigo es requerido" });
    }

    const resultado = await FirmaRemotaService.validarCodigo(
      token,
      codigo,
      req.ip,
      req.headers["user-agent"],
    );

    res.json(resultado);
  } catch (error: any) {
    console.error("❌ Error en validarCodigoController:", error);
    res.status(400).json({ message: error.message || "Error validando el código" });
  }
};

export const completarFirmaRemotaController = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const firmaSessionToken = authHeader?.split(" ")[1];
    const { firmaBase64 } = req.body as { firmaBase64: string };

    if (!firmaSessionToken) {
      return res.status(401).json({ message: "Falta el token de sesión de firma" });
    }

    if (!firmaBase64) {
      return res.status(400).json({ message: "firmaBase64 es requerido" });
    }

    const firma = await FirmaRemotaService.completarFirmaRemota(
      firmaSessionToken,
      firmaBase64,
      req.ip,
      req.headers["user-agent"],
    );

    res.status(201).json({ message: "Firma registrada correctamente", firma });
  } catch (error: any) {
    console.error("❌ Error en completarFirmaRemotaController:", error);
    res.status(400).json({ message: error.message || "Error completando la firma" });
  }
};
