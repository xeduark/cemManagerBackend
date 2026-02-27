import { Request, Response } from 'express';
import * as UserService from '../services/user.service.js';

//* Obtener todos los usuarios del sistema (para asignar roles, etc.) */
export const getUsers = async (_req: Request, res: Response) => {
  try {
    const users = await UserService.getSystemUsers();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error obteniendo usuarios' });
  }
};