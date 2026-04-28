import { Request, Response } from "express";
import * as ActaService from "../services/acta.service.js";

/**
 * Crear una nueva acta
 */
export const createActa = async (req: Request, res: Response) => {
  try {
    console.log("📥 BODY QUE LLEGA DEL FRONT:");
    console.log(req.body);
    const { diademaMarcaId, diademaSerial, laptopMarcaId, ...data } = req.body;

    const acta = await ActaService.createActa(
      data,
      diademaMarcaId,
      diademaSerial,
      laptopMarcaId,
    );

    res.status(201).json(acta);
  } catch (error) {
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo actas" });
  }
};

/**
 * Obtener últimas actas
 */
export const getLatestActasController = async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const actas = await ActaService.getLatestActas(limit);
    res.json(actas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo últimas actas" });
  }
};

/**
 * Obtener acta por ID
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo el acta" });
  }
};

/**
 * Actualizar acta
 */
export const updateActa = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    console.log("📥 BODY UPDATE:");
    console.log(req.body);

    const {
      diademaMarcaId,
      diademaSerial,
      laptopMarcaId,
      ...data
    } = req.body;

    const acta = await ActaService.updateActa(
      id,
      data,
      diademaMarcaId,
      diademaSerial,
      laptopMarcaId
    );

    if (!acta) {
      return res.status(404).json({
        message: "Acta no encontrada o ya cerrada",
      });
    }

    res.json(acta);
  } catch (error) {
    console.error("❌ ERROR UPDATE ACTA:");
    console.error(error);
    res.status(500).json({ message: "Error actualizando el acta" });
  }
};

/**
 * Cerrar acta
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

/**
 * Marcas de diademas
 */
export const getDiademaMarcasController = async (
  _req: Request,
  res: Response,
) => {
  try {
    const marcas = await ActaService.getDiademaMarcas();
    res.json(marcas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo marcas" });
  }
};

/**
 * Marcas de laptops
 */
export const getLaptopMarcasController = async (
  _req: Request,
  res: Response,
) => {
  try {
    const marcas = await ActaService.getLaptopMarcas();
    res.json(marcas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo marcas" });
  }
};

/**
 * Actas paginadas
 */
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
