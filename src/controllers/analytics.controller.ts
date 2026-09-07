import { Request, Response } from "express";
import * as AnalyticsService from "../services/analytics.service.js";

export const getSummaryController = async (_req: Request, res: Response) => {
  try {
    const summary = await AnalyticsService.getSummary();
    res.json(summary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo resumen de analítica" });
  }
};

export const getActasByEstadoController = async (_req: Request, res: Response) => {
  try {
    const data = await AnalyticsService.getActasByEstado();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo actas por estado" });
  }
};

export const getActasBySedeController = async (_req: Request, res: Response) => {
  try {
    const data = await AnalyticsService.getActasBySede();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo actas por sede" });
  }
};

export const getActasPorMesController = async (req: Request, res: Response) => {
  try {
    const months = Number(req.query.months) || 6;
    const data = await AnalyticsService.getActasPorMes(months);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo actas por mes" });
  }
};

export const getTiempoCierrePromedioController = async (_req: Request, res: Response) => {
  try {
    const data = await AnalyticsService.getTiempoCierrePromedio();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo tiempo de cierre promedio" });
  }
};

export const getEquiposStatsController = async (_req: Request, res: Response) => {
  try {
    const data = await AnalyticsService.getEquiposStats();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo estadísticas de equipos" });
  }
};

export const getUsuariosPorRolController = async (_req: Request, res: Response) => {
  try {
    const data = await AnalyticsService.getUsuariosPorRol();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo usuarios por rol" });
  }
};
