import { Request, Response } from "express";
import { getActiveSedes } from "../services/sedes.service.js";

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