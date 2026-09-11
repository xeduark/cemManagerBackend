// backend/src/controllers/user.controller.ts

import { Response } from 'express';
import * as UserService from '../services/user.service.js';
import { logAction } from '../services/auditLog.service.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

// ✅ 1. OBTENER TODOS (READ)
export const getUsers = async (_req: AuthRequest, res: Response) => {
  try {
    console.log("📥 Backend: Solicitando todos los usuarios con JOIN...");
    const users = await UserService.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error("❌ Error en getUsers:", error);
    res.status(500).json({ message: 'Error obteniendo usuarios' });
  }
};

// ✅ 2. CREAR NUEVO USUARIO (CREATE)
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    console.log("📥 Body recibido en createUser:", req.body);

    const newUser = await UserService.createUser(req.body);

    await logAction(req.user?.id, "CREAR", "usuarios", "usuario", newUser?.[0]?.id, `Creó al usuario ${newUser?.[0]?.email}`);

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: newUser
    });
  } catch (error: any) {
    console.error("❌ Error en createUser:", error);
    
    // Manejo de error de correo duplicado (código 23505 de PostgreSQL)
    if (error.code === '23505') {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
    }
    
    res.status(500).json({ message: error.message || 'Error creando usuario' });
  }
};

// ✅ 3. ACTUALIZAR USUARIO (UPDATE)
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`📝 Actualizando usuario con ID: ${id}`, req.body);

    const updatedUser = await UserService.updateUser(id, req.body);

    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    await logAction(req.user?.id, "ACTUALIZAR", "usuarios", "usuario", id, `Actualizó al usuario ${id}`);

    res.json({
      message: 'Usuario actualizado exitosamente',
      user: updatedUser
    });
  } catch (error: any) {
    console.error("❌ Error en updateUser:", error);
    
    if (error.code === '23505') {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
    }
    
    res.status(500).json({ message: error.message || 'Error actualizando usuario' });
  }
};

// ✅ 4. ELIMINAR USUARIO (SOFT DELETE)
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Desactivando usuario con ID: ${id}`);

    await UserService.deleteUser(id);

    await logAction(req.user?.id, "ELIMINAR", "usuarios", "usuario", id, `Desactivó al usuario ${id}`);

    res.json({ message: 'Usuario desactivado correctamente' });
  } catch (error) {
    console.error("❌ Error en deleteUser:", error);
    res.status(500).json({ message: 'Error eliminando usuario' });
  }
};