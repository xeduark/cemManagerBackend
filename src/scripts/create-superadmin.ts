import "dotenv/config";

import * as bcrypt from "bcrypt";

import { pool } from "../config/db.js";

const createSuperAdmin =
  async () => {
    try {
      const passwordHash =
        await bcrypt.hash(
          "Admin123*",
          10,
        );

      await pool.query(
        `
        INSERT INTO users (
          full_name,
          email,
          password_hash,
          role,
          is_active
        )
        VALUES ($1, $2, $3, $4, $5)
      `,
        [
          "Super Administrador",
          "admin@cem.com",
          passwordHash,
          "superadmin",
          true,
        ],
      );

      console.log(
        "✅ Superadmin creado",
      );

      process.exit(0);
    } catch (error) {
      console.error(error);

      process.exit(1);
    }
  };

createSuperAdmin();