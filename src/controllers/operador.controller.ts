import { Request, Response } from 'express';
import { getOperadores } from '../services/operador.service.js';

export const getOperadoresController = async (req: Request, res: Response) => {
  try {
    const data = await getOperadores();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo operadores" });
  }
};