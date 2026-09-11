import { Request, Response } from "express";
import { getPersonalActivo } from "../services/personal.service.js";

export const getPersonalController = async (_req: Request, res: Response) => {
  try {
    const personal = await getPersonalActivo();
    res.json(personal);
  } catch (error) {
    console.error("Error obteniendo personal:", error);
    res.status(500).json({ message: "Error obteniendo personal" });
  }
};
