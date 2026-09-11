import { Request, Response } from "express";
import { getAuditLogs } from "../services/auditLog.service.js";

export const getAuditLogsController = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, module, userId } = req.query as {
      page?: string;
      limit?: string;
      module?: string;
      userId?: string;
    };

    const result = await getAuditLogs({
      page: Number(page),
      limit: Number(limit),
      module,
      userId,
    });

    res.json(result);
  } catch (error) {
    console.error("Error obteniendo logs de auditoría:", error);
    res.status(500).json({ message: "Error obteniendo logs de auditoría" });
  }
};
