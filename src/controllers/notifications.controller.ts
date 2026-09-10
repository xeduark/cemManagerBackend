import { Response } from "express";
import * as NotificationsService from "../services/notifications.service.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";

export const getNotificationsController = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user!.role;
    const notifications = await NotificationsService.getActiveNotifications(role);
    res.json(notifications);
  } catch (error) {
    console.error("❌ Error en getNotificationsController:", error);
    res.status(500).json({ message: "Error obteniendo notificaciones" });
  }
};

export const dismissNotificationController = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const notification = await NotificationsService.dismissNotification(id);

    if (!notification) {
      return res.status(404).json({ message: "Notificación no encontrada o ya resuelta/descartada" });
    }

    res.json(notification);
  } catch (error) {
    console.error("❌ Error en dismissNotificationController:", error);
    res.status(500).json({ message: "Error descartando la notificación" });
  }
};
