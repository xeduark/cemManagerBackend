import { Request, Response } from "express";

import {
  loginService,
  getMeService,
  changePasswordService,
  loginWithGoogleService,
  refreshTokenService,
} from "./auth.service.js";

import {
  REFRESH_COOKIE_MAX_AGE_MS,
  REFRESH_COOKIE_MAX_AGE_REMEMBER_MS,
} from "../../utils/jwt.js";

import { AuthRequest } from "../../middlewares/auth.middleware.js";

const setRefreshCookie = (res: Response, refreshToken: string, rememberMe: boolean) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: rememberMe ? REFRESH_COOKIE_MAX_AGE_REMEMBER_MS : REFRESH_COOKIE_MAX_AGE_MS,
  });
};

export const loginController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { email, password, rememberMe } =
      req.body as {
        email: string;
        password: string;
        rememberMe?: boolean;
      };

    const result =
      await loginService(
        email,
        password,
        Boolean(rememberMe),
      );

    setRefreshCookie(res, result.refreshToken, result.rememberMe);

    return res.status(200).json({
      accessToken:
        result.accessToken,

      mustChangePassword:
        result.mustChangePassword,

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

export const googleLoginController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { idToken, rememberMe } = req.body as { idToken: string; rememberMe?: boolean };

    if (!idToken) {
      return res.status(400).json({
        message: "idToken es requerido",
      });
    }

    const result = await loginWithGoogleService(idToken, Boolean(rememberMe));

    setRefreshCookie(res, result.refreshToken, result.rememberMe);

    return res.status(200).json({
      accessToken: result.accessToken,
      mustChangePassword: result.mustChangePassword,
      user: result.user,
    });
  } catch (error) {
    return res.status(401).json({
      message:
        error instanceof Error
          ? error.message
          : "Error de autenticación con Google",
    });
  }
};

export const refreshController = async (
  req: Request,
  res: Response,
) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    const result = await refreshTokenService(refreshToken);

    setRefreshCookie(res, result.refreshToken, result.rememberMe);

    return res.status(200).json({
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (error) {
    res.clearCookie("refreshToken");

    return res.status(401).json({
      message:
        error instanceof Error
          ? error.message
          : "Sesión expirada, vuelve a iniciar sesión",
    });
  }
};

export const changePasswordController = async (
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

    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "currentPassword y newPassword son requeridos",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "La nueva contraseña debe tener al menos 8 caracteres",
      });
    }

    await changePasswordService(userId, currentPassword, newPassword);

    return res.json({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Error actualizando la contraseña",
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