import { Request, Response } from "express";

import {
  loginService,
  getMeService,
} from "./auth.service.js";

import { AuthRequest } from "../../middlewares/auth.middleware.js";

export const loginController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { email, password } =
      req.body as {
        email: string;
        password: string;
      };

    const result =
      await loginService(
        email,
        password,
      );

    res.cookie(
      "refreshToken",
      result.refreshToken,
      {
        httpOnly: true,

        secure:
          process.env.NODE_ENV ===
          "production",

        sameSite: "lax",

        maxAge:
          7 *
          24 *
          60 *
          60 *
          1000,
      },
    );

    return res.status(200).json({
      accessToken:
        result.accessToken,

      user: result.user,
    });
  } catch (error) {
    return res.status(401).json({
      message:
        error instanceof Error
          ? error.message
          : "Error de autenticación",
    });
  }
};

export const meController = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "No autorizado",
      });
    }

    const user =
      await getMeService(userId);

    return res.json(user);
  } catch (error) {
    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Error interno",
    });
  }
};