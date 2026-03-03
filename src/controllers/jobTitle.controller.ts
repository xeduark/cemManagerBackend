import { Request, Response } from 'express';
import * as CargoService from '../services/jobTitle.service.js';

/**
 * Obtener cargos activos
 */
export const getCargos = async (_req: Request, res: Response) => {
  try {
    const cargos = await CargoService.getActiveCargos();
    res.json(cargos);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error obteniendo cargos' });
  }
};