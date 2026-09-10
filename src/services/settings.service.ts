import { pool } from "../config/db.js";

export const getPublicSettings = async () => {
  const result = await pool.query(
    `SELECT key, value FROM app_settings WHERE is_public = true`,
  );

  const settings: Record<string, string> = {};

  for (const row of result.rows) {
    settings[toCamelCase(row.key)] = row.value;
  }

  return settings;
};

export const getAllSettings = async () => {
  const result = await pool.query(
    `SELECT key, value, is_public, updated_at FROM app_settings ORDER BY key`,
  );

  return result.rows;
};

export const upsertSetting = async (key: string, value: string, isPublic?: boolean) => {
  const result = await pool.query(
    `
    INSERT INTO app_settings (key, value, is_public, updated_at)
    VALUES ($1, $2, COALESCE($3, false), NOW())
    ON CONFLICT (key) DO UPDATE SET
      value = EXCLUDED.value,
      is_public = COALESCE($3, app_settings.is_public),
      updated_at = NOW()
    RETURNING key, value, is_public, updated_at
    `,
    [key, value, isPublic ?? null],
  );

  return result.rows[0];
};

const toCamelCase = (key: string) =>
  key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
