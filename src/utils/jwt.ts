import jwt, {
  Secret,
  SignOptions,
} from "jsonwebtoken";

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

interface RefreshJwtPayload extends JwtPayload {
  remember?: boolean;
}

const accessSecret: Secret =
  process.env.JWT_ACCESS_SECRET!;

const refreshSecret: Secret =
  process.env.JWT_REFRESH_SECRET!;

const accessExpires =
  (process.env.ACCESS_TOKEN_EXPIRES ||
    "15m") as SignOptions["expiresIn"];

const refreshExpires =
  (process.env.REFRESH_TOKEN_EXPIRES ||
    "7d") as SignOptions["expiresIn"];

const refreshExpiresRemember =
  (process.env.REFRESH_TOKEN_EXPIRES_REMEMBER ||
    "30d") as SignOptions["expiresIn"];

export const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
export const REFRESH_COOKIE_MAX_AGE_REMEMBER_MS = 30 * 24 * 60 * 60 * 1000;

export const generateAccessToken = (
  payload: JwtPayload,
) => {
  return jwt.sign(payload, accessSecret, {
    expiresIn: accessExpires,
  });
};

export const generateRefreshToken = (
  payload: JwtPayload,
  remember = false,
) => {
  return jwt.sign(
    { ...payload, remember } as RefreshJwtPayload,
    refreshSecret,
    {
      expiresIn: remember ? refreshExpiresRemember : refreshExpires,
    },
  );
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, refreshSecret) as RefreshJwtPayload;
};