import {
  findUserByEmail,
  findUserById,
} from "../users/user.repository.js";

import {
  comparePassword,
} from "../../utils/bcrypt.js";

import {
  generateAccessToken,
  generateRefreshToken,
} from "../../utils/jwt.js";

// Servicios de autenticación
export const loginService = async (
  email: string,
  password: string,
) => {
  const user =
    await findUserByEmail(email);

  if (!user) {
    throw new Error(
      "Credenciales inválidas",
    );
  }

  if (!user.is_active) {
    throw new Error(
      "Usuario deshabilitado",
    );
  }

  const validPassword =
    await comparePassword(
      password,
      user.password_hash,
    );

  if (!validPassword) {
    throw new Error(
      "Credenciales inválidas",
    );
  }

  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken =
    generateAccessToken(payload);

  const refreshToken =
    generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken,

    user: {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
    },
  };
};

// Servicio para obtener los datos del usuario autenticado
export const getMeService = async (
  userId: string,
) => {
  const user =
    await findUserById(userId);

  if (!user) {
    throw new Error(
      "Usuario no encontrado",
    );
  }

  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    role: user.role,
    isActive: user.is_active,
  };
};