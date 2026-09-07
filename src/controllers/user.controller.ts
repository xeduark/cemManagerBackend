// backend/src/controllers/user.controller.ts

import { Request, Response } from 'express';
import * as UserService from '../services/user.service.js';

// ✅ 1. OBTENER TODOS (READ)
export const getUsers = async (_req: Request, res: Response) => {
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
export const createUser = async (req: Request, res: Response) => {
  try {
    console.log("📥 Body recibido en createUser:", req.body);
    
    const newUser = await UserService.createUser(req.body);
    
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
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`📝 Actualizando usuario con ID: ${id}`, req.body);
    
    const updatedUser = await UserService.updateUser(id, req.body);
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
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
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Desactivando usuario con ID: ${id}`);
    
    await UserService.deleteUser(id);
    
    res.json({ message: 'Usuario desactivado correctamente' });
  } catch (error) {
    console.error("❌ Error en deleteUser:", error);
    res.status(500).json({ message: 'Error eliminando usuario' });
  }
};