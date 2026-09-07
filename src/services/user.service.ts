// backend/src/services/user.service.ts

import { pool } from '../config/db.js';
import * as bcrypt from "bcrypt";

// ==========================================
// 1. TIPOS
// ==========================================

export interface CreateUserDTO {
  full_name: string;
  email: string;
  password: string;
  role: string;
  is_active: boolean;
  sede_id?: number;
  cargo_id?: number;
}

export interface UpdateUserDTO {
  full_name?: string;
  email?: string;
  password?: string;
  role?: string;
  is_active?: boolean;
  sede_id?: number;
  cargo_id?: number;
}

// ==========================================
// 2. CRUD SINCRONIZADO (Users + System Users)
// ==========================================

export const getAllUsers = async (): Promise<any[]> => {
  const result = await pool.query(`
    SELECT 
      u.id AS user_id,          -- ✅ Alias explícito para el ID de users
      u.full_name AS full_name, -- ✅ Alias explícito
      u.email AS email,
      u.role AS role,
      u.is_active AS is_active,
      u.created_at AS created_at,
      su.dni AS dni,
      su.sede_id AS sede_id,
      su.cargo_id AS cargo_id,
      s.nombre AS sede,
      c.nombre AS cargo
    FROM users u
    LEFT JOIN system_users su ON su.user_id = u.id
    LEFT JOIN sedes s ON s.id = su.sede_id
    LEFT JOIN cargos c ON c.id = su.cargo_id
    ORDER BY u.created_at DESC
  `);
  
  console.log('📊 getAllUsers - Raw result:', result.rows); // DEBUG
  
  // ✅ Mapeamos explícitamente para asegurar que el frontend reciba las claves correctas
  return result.rows.map((row: any) => ({
    id: row.user_id,            // Usamos el ID de la tabla users
    full_name: row.full_name,
    email: row.email,
    role: row.role,
    is_active: row.is_active,
    created_at: row.created_at,
    dni: row.dni,
    sede_id: row.sede_id,
    cargo_id: row.cargo_id,
    sede: row.sede,
    cargo: row.cargo,
  }));
};

export const getUserById = async (id: string | number) => {
  const result = await pool.query(
    `SELECT 
      u.id,
      u.full_name,
      u.email,
      u.role,
      u.is_active,
      u.created_at,
      su.dni,
      su.sede_id,
      su.cargo_id,
      s.nombre as sede,
      c.nombre as cargo
    FROM users u
    LEFT JOIN system_users su ON su.user_id = u.id
    LEFT JOIN sedes s ON s.id = su.sede_id
    LEFT JOIN cargos c ON c.id = su.cargo_id
    WHERE u.id = $1`,
    [id]
  );
  console.log('👥 getSystemUsers - Result:', result.rows); // DEBUG
  return result.rows;
};

export const createUser = async (data: CreateUserDTO) => {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    
    const passwordHash = await bcrypt.hash(data.password, 10);
    
    // 1️⃣ Crear en 'users' (Autenticación)
    const userResult = await client.query(
      `INSERT INTO users (full_name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [data.full_name, data.email, passwordHash, data.role, data.is_active]
    );
    
    const userId = userResult.rows[0].id;
    
    // Generar un DNI aleatorio de 10 dígitos (se puede editar después si se quiere)
    const randomDni = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    
    // 2️⃣ Crear en 'system_users' (Datos operativos para Actas)
    await client.query(
      `INSERT INTO system_users (nombre, dni, activo, user_id, sede_id, cargo_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        data.full_name,
        randomDni,
        data.is_active,
        userId, // 🔗 VINCULACIÓN CLAVE
        data.sede_id || null,
        data.cargo_id || null,
      ]
    );
    
    await client.query("COMMIT");
    return await getUserById(userId); // Devuelve el objeto completo con JOIN
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const updateUser = async (id: string | number, data: UpdateUserDTO) => {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    
    // 1️⃣ Actualizar 'users'
    if (data.full_name || data.email || data.role || data.is_active !== undefined || data.password) {
      const fields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (data.full_name) { fields.push(`full_name = $${paramCount}`); values.push(data.full_name); paramCount++; }
      if (data.email) { fields.push(`email = $${paramCount}`); values.push(data.email); paramCount++; }
      if (data.role) { fields.push(`role = $${paramCount}`); values.push(data.role); paramCount++; }
      if (data.is_active !== undefined) { fields.push(`is_active = $${paramCount}`); values.push(data.is_active); paramCount++; }
      
      if (data.password) {
        const passwordHash = await bcrypt.hash(data.password, 10);
        fields.push(`password_hash = $${paramCount}`);
        values.push(passwordHash);
        paramCount++;
      }

      if (fields.length > 0) {
        fields.push(`updated_at = NOW()`);
        values.push(id);
        await client.query(`UPDATE users SET ${fields.join(", ")} WHERE id = $${paramCount}`, values);
      }
    }
    
    // 2️⃣ Actualizar 'system_users'
    if (data.full_name || data.is_active !== undefined || data.sede_id !== undefined || data.cargo_id !== undefined) {
      const sysFields: string[] = [];
      const sysValues: any[] = [];
      let sysParamCount = 1;

      if (data.full_name) { sysFields.push(`nombre = $${sysParamCount}`); sysValues.push(data.full_name); sysParamCount++; }
      if (data.is_active !== undefined) { sysFields.push(`activo = $${sysParamCount}`); sysValues.push(data.is_active); sysParamCount++; }
      if (data.sede_id !== undefined) { sysFields.push(`sede_id = $${sysParamCount}`); sysValues.push(data.sede_id); sysParamCount++; }
      if (data.cargo_id !== undefined) { sysFields.push(`cargo_id = $${sysParamCount}`); sysValues.push(data.cargo_id); sysParamCount++; }

      if (sysFields.length > 0) {
        sysValues.push(id);
        await client.query(`UPDATE system_users SET ${sysFields.join(", ")} WHERE user_id = $${sysParamCount}`, sysValues);
      }
    }
    
    await client.query("COMMIT");
    return await getUserById(id);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const deleteUser = async (id: string | number) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Desactivar en ambas tablas (Soft delete)
    await client.query("UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1", [id]);
    await client.query("UPDATE system_users SET activo = false WHERE user_id = $1", [id]);
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};