import {
  Response,
  NextFunction,
} from "express";

import { AuthRequest } from "./auth.middleware.js";

import { UserRole } from "../types/auth.js";

export const authorize =
  (...roles: UserRole[]) =>
  (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        message: "No autorizado",
      });
    }

    if (
      !roles.includes(
        user.role as UserRole,
      )
    ) {
      return res.status(403).json({
        message:
          "No tienes permisos",
      });
    }

    next();
  };