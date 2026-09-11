import { Request, Response } from "express";
import { getActiveSedes, createSede, deactivateSede } from "../services/sedes.service.js";
import { logAction } from "../services/auditLog.service.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";

export const getSedesController = async (_req: Request, res: Response) => {
  try {
    const sedes = await getActiveSedes();
    res.json(sedes);
  } catch (error) {
    console.error("Error obteniendo sedes:", error);
    res.status(500).json({
      message: "Error obteniendo sedes"
    });
  }
};

export const createSedeController = async (req: AuthRequest, res: Response) => {
  try {
    const { nombre, direccion, ciudad, codigo } = req.body as {
      nombre?: string;
      direccion?: string;
      ciudad?: string;
      codigo?: string;
    };

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ message: "nombre es requerido" });
    }

    const sede = await createSede({ nombre: nombre.trim(), direccion, ciudad, codigo });

    await logAction(req.user?.id, "CREAR", "sedes", "sede", sede.id, `Creó la sede ${sede.nombre}`);

    res.status(201).json(sede);
  } catch (error: any) {
    console.error("Error creando sede:", error);

    if (error.code === "23505") {
      return res.status(400).json({ message: "Ya existe una sede con ese nombre" });
    }

    res.status(500).json({ message: "Error creando sede" });
  }
};

export const deactivateSedeController = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const sede = await deactivateSede(id);

    if (!sede) {
      return res.status(404).json({ message: "Sede no encontrada" });
    }

    await logAction(req.user?.id, "ELIMINAR", "sedes", "sede", id, `Desactivó la sede ${sede.nombre}`);

    res.json({ message: "Sede desactivada correctamente", sede });
  } catch (error) {
    console.error("Error desactivando sede:", error);
    res.status(500).json({ message: "Error desactivando sede" });
  }
};