import { Request, Response } from "express";
import { uploadSignature } from "../services/cloudinary.service.js";
import { pool } from "../db.js";

export const uploadFirma = async (req: Request, res: Response) => {
  try {
    const {
      firma,
      acta_id,
      tipo,
      nombre,
      documento,
      usuario_id,
    } = req.body;

    if (!firma) {
      return res.status(400).json({
        message: "No se envió firma",
      });
    }

    const result: any = await uploadSignature(firma);

    const firmaGuardada = await pool.query(
      `
      INSERT INTO acta_firmas (
        acta_id,
        tipo,
        usuario_id,
        nombre,
        documento,
        firma_url,
        public_id,
        ip,
        user_agent
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
      `,
      [
        acta_id,
        tipo,
        usuario_id || null,
        nombre,
        documento,
        result.secure_url,
        result.public_id,
        req.ip,
        req.headers["user-agent"],
      ]
    );

    res.json({
      message: "Firma subida correctamente",
      firma: firmaGuardada.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error subiendo firma",
    });
  }
};