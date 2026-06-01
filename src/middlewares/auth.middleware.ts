import {
  Request,
  Response,
  NextFunction,
} from "express";

import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

export interface AuthRequest
  extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader =
      req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "No autorizado",
      });
    }

    const token =
      authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Token inválido",
      });
    }

    const decoded = jwt.verify(
      token,
      env.jwtAccessSecret,
    ) as AuthRequest["user"];

    req.user = decoded;

    next();
  } catch {
    return res.status(401).json({
      message: "Token expirado o inválido",
    });
  }
};