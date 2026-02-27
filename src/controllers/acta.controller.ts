import { Request, Response } from 'express';
import * as ActaService from '../services/acta.service.js';
import { ActaPayload } from '../types/acta.types.js';

/**
 * Crear una nueva acta (BORRADOR)
 */
export const createActa = async (req: Request, res: Response) => {
  try {
    const payload: ActaPayload = req.body;

    const acta = await ActaService.createActa(payload);

    res.status(201).json(acta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creando el acta' });
  }
};

/**
 * Obtener todas las actas
 */
export const getActas = async (_req: Request, res: Response) => {
  try {
    const actas = await ActaService.getAllActas();
    res.json(actas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error obteniendo actas' });
  }
};

/**
 * Obtener acta por ID (previsualización / edición)
 */
export const getActaById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const acta = await ActaService.getActaById(id);

    if (!acta) {
      return res.status(404).json({ message: 'Acta no encontrada' });
    }

    res.json(acta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error obteniendo el acta' });
  }
};

/**
 * Actualizar acta (solo si está en BORRADOR)
 */
export const updateActa = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const payload: ActaPayload = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const acta = await ActaService.updateActa(id, payload);

    if (!acta) {
      return res.status(404).json({
        message: 'Acta no encontrada o ya cerrada',
      });
    }

    res.json(acta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error actualizando el acta' });
  }
};

/**
 * Cerrar acta (ya no editable)
 */
export const closeActa = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const acta = await ActaService.closeActa(id);

    if (!acta) {
      return res.status(404).json({ message: 'Acta no encontrada' });
    }

    res.json(acta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error cerrando el acta' });
  }
};
