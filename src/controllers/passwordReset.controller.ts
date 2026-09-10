import { Request, Response } from "express";
import * as PasswordResetService from "../services/passwordReset.service.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";

export const solicitarCambioController = async (req: Request, res: Response) => {
  try {
    const { email, nombreCompleto, motivo } = req.body as {
      email?: string;
      nombreCompleto?: string;
      motivo?: string;
    };

    if (!email || !nombreCompleto || !motivo) {
      return res.status(400).json({
        message: "email, nombreCompleto y motivo son requeridos",
      });
    }

    if (!PasswordResetService.isMotivoValido(motivo)) {
      return res.status(400).json({
        message: "motivo debe ser OLVIDO, CAMBIO_REGULAR o CUENTA_COMPROMETIDA",
      });
    }

    const solicitud = await PasswordResetService.crearSolicitud(
      email,
      nombreCompleto,
      motivo,
    );

    res.status(201).json({
      message: "Solicitud registrada. Sistemas se pondrá en contacto contigo.",
      solicitud,
    });
  } catch (error) {
    console.error("❌ Error en solicitarCambioController:", error);
    res.status(500).json({ message: "Error registrando la solicitud" });
  }
};

export const listarSolicitudesController = async (_req: Request, res: Response) => {
  try {
    const solicitudes = await PasswordResetService.listarSolicitudesPendientes();
    res.json(solicitudes);
  } catch (error) {
    console.error("❌ Error en listarSolicitudesController:", error);
    res.status(500).json({ message: "Error obteniendo solicitudes" });
  }
};

export const resolverSolicitudController = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const resueltoPor = req.user!.id;

    const resultado = await PasswordResetService.resolverSolicitud(id, resueltoPor);

    res.json({
      message: "Solicitud resuelta, comparte la contraseña temporal por un canal seguro",
      ...resultado,
    });
  } catch (error: any) {
    console.error("❌ Error en resolverSolicitudController:", error);

    if (error.message === "Solicitud no encontrada") {
      return res.status(404).json({ message: error.message });
    }

    if (error.message === "Esta solicitud ya fue resuelta" || error.message === "No existe un usuario con ese correo") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Error resolviendo la solicitud" });
  }
};
