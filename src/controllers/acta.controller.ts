import { query, Request, Response } from "express";
import { pool } from "../db.js";
import * as ActaService from "../services/acta.service.js";
import { ActaPayload } from "../types/acta.types.js";

/**
 * Crear una nueva acta (BORRADOR)
 */
export const createActa = async (req: Request, res: Response) => {
  try {
    const { diadema_marca_id, diadema_serial, laptop_marca_id, ...payload } = req.body;

    const acta = await ActaService.createActa(
      payload,
      diadema_marca_id,
      diadema_serial,
    );

    res.status(201).json(acta);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Error creando el acta" });
  }
};

/**
 * Obtener todas las actas
 */
export const getActas = async (_req: Request, res: Response) => {
  try {
    const actas = await ActaService.getAllActas();
    res.json(actas);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo actas" });
  }
};

// GET /actas/latest - Obtener las últimas N actas (ordenadas por fecha)
export const getLatestActasController = async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const actas = await ActaService.getLatestActas(limit);
    res.json(actas);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo últimas actas" });
  }
};

/**
 * Obtener acta por ID (previsualización / edición)
 */
export const getActaById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const acta = await ActaService.getActaById(id);

    if (!acta) {
      return res.status(404).json({ message: "Acta no encontrada" });
    }

    res.json(acta);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo el acta" });
  }
};

/**
 * Actualizar acta (solo si está en BORRADOR)
 */
export const updateActa = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }


    console.log("BODY COMPLETO:", req.body);

    const { diadema_marca_id, diadema_serial, ...payload } = req.body;

 
    console.log("DIADENA:", diadema_marca_id, diadema_serial);

    const acta = await ActaService.updateActa(
      id,
      payload,
      diadema_marca_id,
      diadema_serial
    );

    if (!acta) {
      return res.status(404).json({
        message: "Acta no encontrada o ya cerrada",
      });
    }

    res.json(acta);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Error actualizando el acta" });
  }
};

/**
 * Cerrar acta (ya no editable)
 */
export const closeActa = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const acta = await ActaService.closeActa(id);

    if (!acta) {
      return res.status(404).json({ message: "Acta no encontrada" });
    }

    res.json(acta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error cerrando el acta" });
  }
};

// GET /diadema-marcas - Obtener todas las marcas de diademas
export const getDiademaMarcasController = async (
  _req: Request,
  res: Response,
) => {
  try {
    const marcas = await ActaService.getDiademaMarcas();
    res.json(marcas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo marcas" });
  }
};

export const getActasController = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const result = await ActaService.getActasPaginated(
      Number(page),
      Number(limit),
      String(search),
    );

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo actas" });
  }
};

// GET /laptop-marcas - Obtener todas las marcas de laptops
export const getLaptopMarcasController = async (
  req: Request,
  res: Response
) => {
   try {
    const marcasLaptop = await ActaService.getLaptopMarcas();
    res.json(marcasLaptop);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo marcas" });
  }
};
