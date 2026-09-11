import { Request, Response } from "express";
import * as SettingsService from "../services/settings.service.js";
import { logAction } from "../services/auditLog.service.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";

export const getPublicSettingsController = async (_req: Request, res: Response) => {
  try {
    const settings = await SettingsService.getPublicSettings();
    res.json(settings);
  } catch (error) {
    console.error("❌ Error en getPublicSettingsController:", error);
    res.status(500).json({ message: "Error obteniendo configuración" });
  }
};

export const getAllSettingsController = async (_req: Request, res: Response) => {
  try {
    const settings = await SettingsService.getAllSettings();
    res.json(settings);
  } catch (error) {
    console.error("❌ Error en getAllSettingsController:", error);
    res.status(500).json({ message: "Error obteniendo configuración" });
  }
};

export const upsertSettingController = async (req: AuthRequest, res: Response) => {
  try {
    const { key } = req.params;
    const { value, isPublic } = req.body as { value?: string; isPublic?: boolean };

    if (!value) {
      return res.status(400).json({ message: "value es requerido" });
    }

    const setting = await SettingsService.upsertSetting(key, value, isPublic);

    await logAction(req.user?.id, "ACTUALIZAR", "configuracion", "setting", key, `Actualizó la configuración "${key}"`);

    res.json(setting);
  } catch (error) {
    console.error("❌ Error en upsertSettingController:", error);
    res.status(500).json({ message: "Error guardando configuración" });
  }
};
