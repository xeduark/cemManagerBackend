//src/config/env.ts tipado por mi, no es un archivo que se haya editado recientemente, pero es importante para el funcionamiento del proyecto
const requiredEnv = [
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
];

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(
      `Missing environment variable: ${key}`,
    );
  }
});

export const env = {
  jwtAccessSecret:
    process.env.JWT_ACCESS_SECRET!,

  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET!,

  accessTokenExpires:
    process.env.ACCESS_TOKEN_EXPIRES ||
    "15m",

  refreshTokenExpires:
    process.env.REFRESH_TOKEN_EXPIRES ||
    "7d",
};