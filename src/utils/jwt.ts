import jwt, {
  Secret,
  SignOptions,
} from "jsonwebtoken";

interface JwtPayload {
  id: string;
  email: string;
  role: string;
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

export const generateAccessToken = (
  payload: JwtPayload,
) => {
  return jwt.sign(payload, accessSecret, {
    expiresIn: accessExpires,
  });
};

export const generateRefreshToken = (
  payload: JwtPayload,
) => {
  return jwt.sign(payload, refreshSecret, {
    expiresIn: refreshExpires,
  });
};