import {
  findUserByEmail,
  findUserById,
} from "../users/user.repository.js";

import {
  comparePassword,
  hashPassword,
} from "../../utils/bcrypt.js";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt.js";

import { pool } from "../../config/db.js";
import { OAuth2Client } from "google-auth-library";
import { env } from "../../config/env.js";

const googleClient = env.googleClientId
  ? new OAuth2Client(env.googleClientId)
  : null;

// Servicios de autenticación
export const loginService = async (
  email: string,
  password: string,
  rememberMe = false,
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
    generateRefreshToken(payload, rememberMe);

  return {
    accessToken,
    refreshToken,
    rememberMe,

    mustChangePassword: user.must_change_password,

    user: {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
    },
  };
};

// Servicio para que un usuario autenticado cambie su propia contraseña
export const changePasswordService = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
) => {
  const user = await findUserById(userId);

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  const validPassword = await comparePassword(
    currentPassword,
    user.password_hash,
  );

  if (!validPassword) {
    throw new Error("Contraseña actual incorrecta");
  }

  const newPasswordHash = await hashPassword(newPassword);

  await pool.query(
    `UPDATE users
     SET password_hash = $1, must_change_password = false, updated_at = NOW()
     WHERE id = $2`,
    [newPasswordHash, userId],
  );
};

// Login vía Google Workspace SSO — NO crea usuarios nuevos, solo autentica
// cuentas que un SUPERADMIN ya haya creado manualmente con ese mismo correo.
export const loginWithGoogleService = async (idToken: string, rememberMe = false) => {
  if (!googleClient || !env.googleClientId) {
    throw new Error("Login con Google no está configurado en el servidor");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: env.googleClientId,
  });

  const payload = ticket.getPayload();

  if (!payload || !payload.email) {
    throw new Error("Token de Google inválido");
  }

  if (!payload.email_verified) {
    throw new Error("El correo de Google no está verificado");
  }

  if (env.googleWorkspaceDomains.length > 0) {
    const emailDomain = payload.email.toLowerCase().split("@")[1];

    if (!env.googleWorkspaceDomains.includes(emailDomain)) {
      throw new Error("Ese correo no pertenece a la organización");
    }
  }

  const user = await findUserByEmail(payload.email);

  if (!user) {
    throw new Error(
      "Tu correo no está registrado en el sistema. Contacta a sistemas para que te den acceso.",
    );
  }

  if (!user.is_active) {
    throw new Error("Usuario deshabilitado");
  }

  const jwtPayload = { id: user.id, email: user.email, role: user.role };

  const accessToken = generateAccessToken(jwtPayload);
  const refreshToken = generateRefreshToken(jwtPayload, rememberMe);

  return {
    accessToken,
    refreshToken,
    rememberMe,
    mustChangePassword: user.must_change_password,
    user: {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
    },
  };
};

// Renueva el accessToken (y rota el refreshToken) a partir de la cookie
// httpOnly — así el usuario no tiene que volver a loguearse cada 15 minutos.
export const refreshTokenService = async (refreshToken: string | undefined) => {
  if (!refreshToken) {
    throw new Error("No hay sesión activa");
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new Error("Sesión expirada, vuelve a iniciar sesión");
  }

  const user = await findUserById(decoded.id);

  if (!user || !user.is_active) {
    throw new Error("Sesión inválida");
  }

  const payload = { id: user.id, email: user.email, role: user.role };
  const rememberMe = Boolean(decoded.remember);

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload, rememberMe),
    rememberMe,
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